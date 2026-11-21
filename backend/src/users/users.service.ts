import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Matches, Max, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { DEFAULT_CLEARANCE, Role } from '../common/roles';
import { User } from './user.entity';

export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
const PW_MSG = 'Password must be 12+ characters with upper, lower, number and symbol';

export class CreateUserDto {
  @IsString() @MinLength(3) username: string;
  @IsEmail() email: string;
  @IsString() @MinLength(2) fullName: string;
  @IsOptional() @IsString() designation?: string;
  @IsIn(Object.values(Role)) role: Role;
  @IsOptional() @IsInt() @Min(1) @Max(9) clearance?: number;
  @Matches(PASSWORD_RE, { message: PW_MSG }) password: string;
}
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional() @IsIn(['active', 'suspended', 'deactivated']) status?: 'active' | 'suspended' | 'deactivated';
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>, private audit: AuditService) {}

  list() {
    return this.repo.find({ order: { createdAt: 'ASC' } });
  }

  async create(dto: CreateUserDto, actor: User) {
    if (await this.repo.findOne({ where: [{ username: dto.username }, { email: dto.email }] }))
      throw new ConflictException('Username or email already exists');
    const user = this.repo.create({
      ...dto,
      clearance: dto.clearance ?? DEFAULT_CLEARANCE[dto.role],
      passwordHash: await bcrypt.hash(dto.password, 12),
    });
    delete (user as any).password;
    const saved = await this.repo.save(user);
    await this.audit.log({ user: actor, action: 'USER_CREATE', entityType: 'user', entityId: saved.id, metadata: { username: saved.username, role: saved.role } });
    return saved;
  }

  async update(id: string, dto: UpdateUserDto, actor: User) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    if (id === actor.id && (dto.status && dto.status !== 'active' || (dto.role && dto.role !== user.role)))
      throw new BadRequestException('You cannot suspend or change the role of your own account');
    const { password, ...rest } = dto as any;
    Object.assign(user, rest);
    if (password) {
      if (!PASSWORD_RE.test(password)) throw new BadRequestException(PW_MSG);
      user.passwordHash = await bcrypt.hash(password, 12);
      user.failedAttempts = 0;
      user.lockedUntil = null;
    }
    const saved = await this.repo.save(user);
    await this.audit.log({ user: actor, action: 'USER_UPDATE', entityType: 'user', entityId: id, metadata: { fields: Object.keys(rest), passwordReset: !!password } });
    return saved;
  }
}
