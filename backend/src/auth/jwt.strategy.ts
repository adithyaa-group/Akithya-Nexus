import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

export const COOKIE = 'nexus_token';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectRepository(User) private users: Repository<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => req?.cookies?.[COOKIE] ?? null]),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    });
  }
  async validate(payload: { sub: string; purpose?: string }) {
    if (payload.purpose) throw new UnauthorizedException(); // MFA-challenge tokens are not sessions
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || user.status !== 'active') throw new UnauthorizedException();
    return user;
  }
}
