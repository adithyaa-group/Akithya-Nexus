import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '../common/guards';
import { AUDIT_ROLES } from '../common/roles';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...AUDIT_ROLES)
export class AuditController {
  constructor(private audit: AuditService) {}
  @Get()
  async list(@Query('page') page = '1', @Query('limit') limit = '50') {
    const [items, total] = await this.audit.list(Math.max(1, +page || 1), Math.min(200, +limit || 50));
    return { items, total };
  }
  @Get('verify')
  verify() {
    return this.audit.verifyChain();
  }
}
