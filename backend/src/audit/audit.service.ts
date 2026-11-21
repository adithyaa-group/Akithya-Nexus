import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { AuditLog, LoginHistory } from './audit.entity';

const GENESIS = '0'.repeat(64);
const digest = (prev: string, a: AuditLog) =>
  createHash('sha256')
    .update(JSON.stringify([prev, a.createdAt.toISOString(), a.userId, a.action, a.entityType, a.entityId, a.success, a.metadata ?? null]))
    .digest('hex');

export interface AuditInput {
  user?: { id: string; username: string } | null;
  action: string;
  entityType?: string;
  entityId?: string;
  success?: boolean;
  metadata?: any;
  ip?: string;
}

@Injectable()
export class AuditService {
  private queue: Promise<any> = Promise.resolve();
  constructor(
    @InjectRepository(AuditLog) private repo: Repository<AuditLog>,
    @InjectRepository(LoginHistory) private logins: Repository<LoginHistory>,
  ) {}

  /** Serialised so the hash chain stays linear. Never throws into the caller. */
  log(e: AuditInput) {
    this.queue = this.queue
      .then(async () => {
        const last = await this.repo.findOne({ where: {}, order: { seq: 'DESC' } });
        const prevHash = last?.hash ?? GENESIS;
        const row = this.repo.create({
          createdAt: new Date(),
          userId: e.user?.id ?? null,
          username: e.user?.username ?? null,
          action: e.action,
          entityType: e.entityType ?? null,
          entityId: e.entityId ?? null,
          success: e.success ?? true,
          ip: e.ip ?? null,
          metadata: e.metadata ?? null,
          prevHash,
        });
        row.hash = digest(prevHash, row);
        await this.repo.save(row);
      })
      .catch((err) => console.error('audit write failed', err));
    return this.queue;
  }

  recordLogin(d: Partial<LoginHistory>) {
    return this.logins.save(this.logins.create(d)).catch(() => undefined);
  }

  list(page = 1, limit = 50, entityId?: string) {
    return this.repo.findAndCount({
      where: entityId ? { entityId } : {},
      order: { seq: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async verifyChain() {
    let prev = GENESIS;
    let checked = 0;
    for (let skip = 0; ; skip += 1000) {
      const rows = await this.repo.find({ order: { seq: 'ASC' }, skip, take: 1000 });
      if (!rows.length) break;
      for (const r of rows) {
        r.createdAt = new Date(r.createdAt);
        if (r.prevHash !== prev || digest(r.prevHash, r) !== r.hash) {
          return { valid: false, checked, brokenAtSeq: r.seq };
        }
        prev = r.hash;
        checked++;
      }
    }
    return { valid: true, checked, brokenAtSeq: null };
  }
}
