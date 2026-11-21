import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '../common/guards';
import { Role } from '../common/roles';
import { CreateUserDto, UpdateUserDto, UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPREME_ADMIN)
export class UsersController {
  constructor(private users: UsersService) {}
  @Get() list() { return this.users.list(); }
  @Post() create(@Body() dto: CreateUserDto, @Req() req: any) { return this.users.create(dto, req.user); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    return this.users.update(id, dto, req.user);
  }
}
