import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CreateSubjectDto, SubjectsService, UpdateSubjectDto } from './subjects.service';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private subjects: SubjectsService) {}
  @Get() list(@Req() req: any, @Query() q: any) { return this.subjects.list(req.user, q); }
  @Post() create(@Body() dto: CreateSubjectDto, @Req() req: any) { return this.subjects.create(dto, req.user, req.ip); }
  @Get(':id') get(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) { return this.subjects.get(id, req.user); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubjectDto, @Req() req: any) {
    return this.subjects.update(id, dto, req.user);
  }
  @Post(':id/archive') archive(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) { return this.subjects.setStatus(id, 'archived', req.user); }
  @Post(':id/restore') restore(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) { return this.subjects.setStatus(id, 'active', req.user); }
  @Get(':id/history') history(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) { return this.subjects.history(id, req.user); }
}
