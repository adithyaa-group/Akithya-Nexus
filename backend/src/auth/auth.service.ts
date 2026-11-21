import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { decrypt, encrypt } from '../common/crypto';
import { User } from '../users/user.entity';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const SESSION_TTL = '8h';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
    private audit: AuditService,
  ) {}

  sessionToken(user: User) {
    return this.jwt.sign({ sub: user.id, role: user.role, clr: user.clearance }, { expiresIn: SESSION_TTL });
  }

  private async fail(identifier: string, user: User | null, reason: string, ip: string, ua: string) {
    await this.audit.recordLogin({ identifier, userId: user?.id, success: false, reason, ip, userAgent: ua });
    await this.audit.log({ user, action: 'LOGIN_FAILED', entityType: 'user', entityId: user?.id, success: false, ip, metadata: { identifier, reason } });
  }

  async login(identifier: string, password: string, ip: string, ua: string) {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('LOWER(u.username) = LOWER(:i) OR LOWER(u.email) = LOWER(:i)', { i: identifier })
      .getOne();
    if (!user) {
      await bcrypt.compare(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv'); // timing parity
      await this.fail(identifier, null, 'unknown_user', ip, ua);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.fail(identifier, user, 'locked', ip, ua);
      throw new ForbiddenException(`Account locked. Try again after ${user.lockedUntil.toISOString()}`);
    }
    if (user.status !== 'active') {
      await this.fail(identifier, user, 'inactive', ip, ua);
      throw new ForbiddenException('Account is not active');
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= MAX_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
        user.failedAttempts = 0;
        await this.audit.log({ user, action: 'ACCOUNT_LOCKED', entityType: 'user', entityId: user.id, success: false, ip });
      }
      await this.users.save(user);
      await this.fail(identifier, user, 'bad_password', ip, ua);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.mfaEnabled) {
      return { mfaRequired: true, mfaToken: this.jwt.sign({ sub: user.id, purpose: 'mfa' }, { expiresIn: '5m' }) };
    }
    return { user: await this.completeLogin(user, ip, ua) };
  }

  async verifyMfa(mfaToken: string, code: string, ip: string, ua: string) {
    let payload: any;
    try { payload = this.jwt.verify(mfaToken); } catch { throw new UnauthorizedException('Verification expired'); }
    if (payload.purpose !== 'mfa') throw new UnauthorizedException();
    const user = await this.users.createQueryBuilder('u').addSelect('u.mfaSecret').where('u.id = :id', { id: payload.sub }).getOne();
    if (!user || user.status !== 'active' || !user.mfaSecret) throw new UnauthorizedException();
    if (!authenticator.check(code, decrypt(user.mfaSecret))) {
      await this.fail(user.username, user, 'bad_mfa', ip, ua);
      throw new UnauthorizedException('Invalid verification code');
    }
    return this.completeLogin(user, ip, ua);
  }

  private async completeLogin(user: User, ip: string, ua: string) {
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.users.save(user);
    await this.audit.recordLogin({ identifier: user.username, userId: user.id, success: true, ip, userAgent: ua });
    await this.audit.log({ user, action: 'LOGIN', entityType: 'user', entityId: user.id, ip });
    return user;
  }

  async mfaSetup(user: User) {
    const secret = authenticator.generateSecret();
    await this.users.update(user.id, { mfaSecret: encrypt(secret), mfaEnabled: false });
    const uri = authenticator.keyuri(user.username, 'NEXUS · Akithya Group', secret);
    return { secret, uri, qr: await QRCode.toDataURL(uri, { margin: 1, width: 220 }) };
  }

  async mfaEnable(user: User, code: string) {
    const u = await this.users.createQueryBuilder('u').addSelect('u.mfaSecret').where('u.id = :id', { id: user.id }).getOne();
    if (!u?.mfaSecret || !authenticator.check(code, decrypt(u.mfaSecret))) throw new UnauthorizedException('Invalid verification code');
    await this.users.update(user.id, { mfaEnabled: true });
    await this.audit.log({ user, action: 'MFA_ENABLED', entityType: 'user', entityId: user.id });
    return { mfaEnabled: true };
  }
}
