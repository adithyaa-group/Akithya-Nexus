import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Brackets, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { decrypt, encrypt, mask } from '../common/crypto';
import { ARCHIVE_ROLES, CLASSIFICATION_MIN, Role, WRITE_ROLES } from '../common/roles';
import { User } from '../users/user.entity';
import { Subject } from './subject.entity';

export const CLASSIFICATIONS = Object.keys(CLASSIFICATION_MIN);
export const VERIFICATION = ['verified', 'user_provided', 'imported', 'unverified', 'historical'];
export const SOURCES = ['user_provided', 'authorized_import', 'administrator_entry', 'fictional_demo'];

const strArr = () => [IsOptional(), IsArray(), ArrayMaxSize(20), IsString({ each: true }), MaxLength(120, { each: true })];
function multi(...decos: any[]) { return (t: any, k: string) => decos.forEach((d) => d(t, k)); }

export class CreateSubjectDto {
  @IsString() @MinLength(2) @MaxLength(160) fullName: string;
  @IsOptional() @IsString() @MaxLength(120) preferredName?: string;
  @multi(...strArr()) previousNames?: string[];
  @multi(...strArr()) aliases?: string[];
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() @MaxLength(160) placeOfBirth?: string;
  @IsOptional() @IsString() @MaxLength(80) nationality?: string;
  @IsOptional() @IsString() @MaxLength(80) citizenship?: string;
  @IsOptional() @IsString() @MaxLength(40) gender?: string;
  @IsOptional() @IsString() @MaxLength(60) preferredLanguage?: string;
  @multi(...strArr()) additionalLanguages?: string[];
  @IsOptional() @IsString() @MaxLength(40) maritalStatus?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(30) @Max(272) heightCm?: number;
  @IsOptional() @IsString() @MaxLength(40) eyeColor?: string;
  @IsOptional() @IsString() @MaxLength(40) hairColor?: string;
  @IsOptional() @IsString() @MaxLength(2000) physicalDescription?: string;
  @IsOptional() @IsString() @MaxLength(2000) distinguishingFeatures?: string;
  @IsOptional() @IsString() @MaxLength(60) passportRef?: string;
  @IsOptional() @IsString() @MaxLength(60) nationalIdRef?: string;
  @IsOptional() @IsString() @MaxLength(60) drivingLicenseRef?: string;
  @IsOptional() @IsIn(CLASSIFICATIONS) classification?: string;
  @IsOptional() @IsIn(VERIFICATION) verificationStatus?: string;
  @IsOptional() @IsIn(SOURCES) dataSource?: string;
  @IsOptional() @IsUUID() ownerId?: string;
}
export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}

export const subjectId = (s: Subject) => `AG-SUB-${String(s.seq).padStart(6, '0')}`;

@Injectable()
export class SubjectsService {
  constructor(@InjectRepository(Subject) private repo: Repository<Subject>, private audit: AuditService) {}

  private allowed(u: User) {
    return Object.entries(CLASSIFICATION_MIN).filter(([, min]) => u.clearance >= min).map(([k]) => k);
  }
  /** Role + clearance + ownership all have to agree. Clearance alone never opens a record. */
  private canAccess(u: User, s: Subject) {
    if (s.ownerId && s.ownerId === u.id) return true;
    if (u.role === Role.REGISTERED) return false;
    return u.clearance >= (CLASSIFICATION_MIN[s.classification] ?? 9);
  }
  private canSeeIds(u: User, s: Subject) {
    return (s.ownerId && s.ownerId === u.id) || (u.role !== Role.REGISTERED && u.clearance >= 5);
  }
  private canWrite(u: User, s?: Subject) {
    return WRITE_ROLES.includes(u.role) || (!!s && s.ownerId === u.id);
  }

  view(s: Subject, u: User) {
    const ids = this.canSeeIds(u, s);
    const show = (enc: string) => (ids ? decrypt(enc) : mask(decrypt(enc)));
    const { passportRefEnc, nationalIdRefEnc, drivingLicenseRefEnc, ...rest } = s as any;
    return {
      ...rest,
      subjectId: subjectId(s),
      passportRef: show(passportRefEnc),
      nationalIdRef: show(nationalIdRefEnc),
      drivingLicenseRef: show(drivingLicenseRefEnc),
      idsMasked: !ids,
      canEdit: this.canWrite(u, s),
      canArchive: ARCHIVE_ROLES.includes(u.role),
    };
  }

  private apply(s: Subject, dto: any) {
    const { passportRef, nationalIdRef, drivingLicenseRef, ownerId, ...plain } = dto;
    Object.assign(s, plain);
    // Masked placeholders echoed back by the UI are ignored so we never overwrite the real value
    const set = (field: keyof Subject, v?: string) => { if (v !== undefined && !v.includes('•')) (s as any)[field] = v ? encrypt(v) : null; };
    set('passportRefEnc', passportRef);
    set('nationalIdRefEnc', nationalIdRef);
    set('drivingLicenseRefEnc', drivingLicenseRef);
    return ownerId;
  }

  async create(dto: CreateSubjectDto, u: User, ip?: string) {
    if (!WRITE_ROLES.includes(u.role)) throw new ForbiddenException();
    const s = new Subject();
    const ownerId = this.apply(s, dto);
    s.ownerId = ownerId ?? null;
    s.createdById = u.id;
    s.status = 'active';
    const saved = await this.repo.save(s);
    await this.audit.log({ user: u, action: 'SUBJECT_CREATE', entityType: 'subject', entityId: saved.id, ip, metadata: { subjectId: subjectId(saved) } });
    return this.view(saved, u);
  }

  async list(u: User, q: { q?: string; status?: string; classification?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const qb = this.repo.createQueryBuilder('s');
    if (u.role === Role.REGISTERED) qb.where('s.ownerId = :uid', { uid: u.id });
    else qb.where('(s.classification IN (:...cl) OR s.ownerId = :uid)', { cl: this.allowed(u), uid: u.id });
    if (q.status && ['active', 'archived'].includes(q.status)) qb.andWhere('s.status = :st', { st: q.status });
    if (q.classification && CLASSIFICATIONS.includes(q.classification)) qb.andWhere('s.classification = :cls', { cls: q.classification });
    const term = (q.q || '').trim();
    if (term) {
      const like = `%${term.replace(/[\\%_]/g, '\\$&')}%`;
      const idMatch = /^(ag-sub-)?0*(\d+)$/i.exec(term);
      qb.andWhere(new Brackets((b) => {
        b.where('s.fullName ILIKE :like').orWhere('s.preferredName ILIKE :like').orWhere('s.nationality ILIKE :like')
          .orWhere('s.placeOfBirth ILIKE :like').orWhere('s.aliases ILIKE :like');
        if (idMatch) b.orWhere('s.seq = :seq', { seq: parseInt(idMatch[2], 10) });
      }));
      qb.setParameter('like', like);
    }
    qb.orderBy('s.seq', 'DESC').skip((page - 1) * limit).take(limit);
    const [rows, total] = await qb.getManyAndCount();
    await this.audit.log({ user: u, action: 'SUBJECT_SEARCH', entityType: 'subject', metadata: { q: term, results: total } });
    return {
      total, page, limit,
      items: rows.map((s) => ({
        id: s.id, subjectId: subjectId(s), fullName: s.fullName, nationality: s.nationality, dateOfBirth: s.dateOfBirth,
        classification: s.classification, status: s.status, verificationStatus: s.verificationStatus, updatedAt: s.updatedAt,
      })),
    };
  }

  private async load(id: string, u: User) {
    const s = await this.repo.findOne({ where: { id } });
    // Same response for "missing" and "forbidden" so record existence isn't leaked
    if (!s || !this.canAccess(u, s)) {
      if (s) await this.audit.log({ user: u, action: 'SUBJECT_ACCESS_DENIED', entityType: 'subject', entityId: id, success: false });
      throw new NotFoundException('Record not found');
    }
    return s;
  }

  async get(id: string, u: User) {
    const s = await this.load(id, u);
    await this.audit.log({ user: u, action: 'SUBJECT_VIEW', entityType: 'subject', entityId: id });
    return this.view(s, u);
  }

  async update(id: string, dto: UpdateSubjectDto, u: User) {
    const s = await this.load(id, u);
    if (!this.canWrite(u, s)) throw new ForbiddenException();
    const { ownerId, classification, verificationStatus, dataSource, ...rest } = dto as any;
    this.apply(s, rest);
    // Only officers+ may change control fields; an owner editing their own vault may not
    if (WRITE_ROLES.includes(u.role)) {
      if (classification) s.classification = classification;
      if (verificationStatus) s.verificationStatus = verificationStatus;
      if (dataSource) s.dataSource = dataSource;
      if (ownerId !== undefined) s.ownerId = ownerId || null;
    }
    const saved = await this.repo.save(s);
    await this.audit.log({ user: u, action: 'SUBJECT_UPDATE', entityType: 'subject', entityId: id, metadata: { fields: Object.keys(dto).filter((k) => !/Ref$/.test(k)), identificationChanged: Object.keys(dto).some((k) => /Ref$/.test(k)) } });
    return this.view(saved, u);
  }

  async setStatus(id: string, status: 'active' | 'archived', u: User) {
    if (!ARCHIVE_ROLES.includes(u.role)) throw new ForbiddenException();
    const s = await this.load(id, u);
    s.status = status;
    await this.repo.save(s);
    await this.audit.log({ user: u, action: status === 'archived' ? 'SUBJECT_ARCHIVE' : 'SUBJECT_RESTORE', entityType: 'subject', entityId: id });
    return this.view(s, u);
  }

  async history(id: string, u: User) {
    await this.load(id, u);
    const [items] = await this.audit.list(1, 30, id);
    return items.map((a) => ({ seq: a.seq, createdAt: a.createdAt, username: a.username, action: a.action, success: a.success, metadata: a.metadata }));
  }
}
