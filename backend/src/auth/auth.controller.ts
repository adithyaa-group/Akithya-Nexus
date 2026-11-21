import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsString, Length, MinLength } from 'class-validator';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards';
import { ROLE_LABEL } from '../common/roles';
import { AuditService } from '../audit/audit.service';
import { AuthService } from './auth.service';
import { COOKIE } from './jwt.strategy';

class LoginDto { @IsString() @MinLength(1) identifier: string; @IsString() @MinLength(1) password: string; }
class MfaDto { @IsString() mfaToken: string; @IsString() @Length(6, 6) code: string; }
class CodeDto { @IsString() @Length(6, 6) code: string; }

const publicUser = (u: any) => ({
  id: u.id, username: u.username, email: u.email, fullName: u.fullName, role: u.role,
  roleLabel: ROLE_LABEL[u.role], designation: u.designation || ROLE_LABEL[u.role],
  clearance: u.clearance, mfaEnabled: u.mfaEnabled, lastLoginAt: u.lastLoginAt,
});

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private audit: AuditService) {}

  private setCookie(res: Response, token: string) {
    res.cookie(COOKIE, token, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 3600 * 1000, path: '/',
    });
  }

  @Post('login') @HttpCode(200) @UseGuards(ThrottlerGuard) @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const r: any = await this.auth.login(dto.identifier, dto.password, req.ip, req.headers['user-agent'] || '');
    if (r.mfaRequired) return r;
    this.setCookie(res, this.auth.sessionToken(r.user));
    return { user: publicUser(r.user) };
  }

  @Post('mfa/verify') @HttpCode(200) @UseGuards(ThrottlerGuard) @Throttle({ default: { limit: 10, ttl: 60000 } })
  async mfaVerify(@Body() dto: MfaDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.verifyMfa(dto.mfaToken, dto.code, req.ip, req.headers['user-agent'] || '');
    this.setCookie(res, this.auth.sessionToken(user));
    return { user: publicUser(user) };
  }

  @Post('logout') @HttpCode(200)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  }

  @Get('me') @UseGuards(JwtAuthGuard)
  me(@Req() req: any) { return { user: publicUser(req.user) }; }

  @Post('mfa/setup') @HttpCode(200) @UseGuards(JwtAuthGuard)
  setup(@Req() req: any) { return this.auth.mfaSetup(req.user); }

  @Post('mfa/enable') @HttpCode(200) @UseGuards(JwtAuthGuard)
  enable(@Req() req: any, @Body() dto: CodeDto) { return this.auth.mfaEnable(req.user, dto.code); }
}
