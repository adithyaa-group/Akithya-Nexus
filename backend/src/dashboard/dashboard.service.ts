import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { AuditLog, LoginHistory } from '../audit/audit.entity';
import { CLASSIFICATION_MIN, Role } from '../common/roles';
import { Subject } from '../subjects/subject.entity';
import { User } from '../users/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectDataSource() private ds: DataSource,
    @InjectRepository(Subject) private subjects: Repository<Subject>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(AuditLog) private audit: Repository<AuditLog>,
    @InjectRepository(LoginHistory) private logins: Repository<LoginHistory>,
  ) {}

  async summary(u: User) {
    // Every figure is computed from the user's *visible* records, not the whole table
    const visible = () => {
      const qb = this.subjects.createQueryBuilder('s');
      if (u.role === Role.REGISTERED) return qb.where('s.ownerId = :uid', { uid: u.id });
      const cl = Object.entries(CLASSIFICATION_MIN).filter(([, m]) => u.clearance >= m).map(([k]) => k);
      return qb.where('(s.classification IN (:...cl) OR s.ownerId = :uid)', { cl, uid: u.id });
    };
    const group = async (col: string) =>
      (await visible().select(`s.${col}`, 'k').addSelect('COUNT(*)', 'n').groupBy(`s.${col}`).getRawMany()).map((r) => ({ key: r.k ?? 'unspecified', count: +r.n }));

    const [byStatus, byClassification, byVerification] = await Promise.all([group('status'), group('classification'), group('verificationStatus')]);
    const count = (k: string) => byStatus.find((x) => x.key === k)?.count ?? 0;

    let dbOk = true;
    try { await this.ds.query('SELECT 1'); } catch { dbOk = false; }

    const isAdmin = u.role === Role.SUPREME_ADMIN || u.role === Role.CHIEF_OFFICER;
    const since = new Date(Date.now() - 24 * 3600 * 1000);

    // 7-day activity from the audit trail
    const days: { date: string; count: number }[] = [];
    const rows = await this.ds.query(
      `SELECT to_char("createdAt" AT TIME ZONE 'UTC','YYYY-MM-DD') d, COUNT(*)::int n FROM audit_logs WHERE "createdAt" > now() - interval '7 days' ${isAdmin ? '' : `AND "userId" = '${u.id.replace(/'/g, '')}'`} GROUP BY d`,
    );
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days.push({ date: d, count: rows.find((r: any) => r.d === d)?.n ?? 0 });
    }

    const recent = await this.audit.find({ where: isAdmin ? {} : { userId: u.id }, order: { seq: 'DESC' }, take: 8 });

    return {
      cards: {
        totalSubjects: count('active') + count('archived'),
        activeSubjects: count('active'),
        archivedSubjects: count('archived'),
        operators: isAdmin ? await this.users.count({ where: { status: 'active' } }) : null,
      },
      byClassification, byVerification, activity: days,
      system: {
        api: 'operational',
        database: dbOk ? 'connected' : 'unreachable',
        security: isAdmin
          ? { failedLogins24h: await this.logins.count({ where: { success: false, createdAt: MoreThan(since) } }), successfulLogins24h: await this.logins.count({ where: { success: true, createdAt: MoreThan(since) } }), lockedAccounts: await this.users.createQueryBuilder('u').where('u.lockedUntil > now()').getCount() }
          : null,
        backup: 'not configured', // honest: backups arrive in Phase 5
        uptimeSeconds: Math.round(process.uptime()),
      },
      recent: recent.map((a) => ({ seq: a.seq, createdAt: a.createdAt, username: a.username, action: a.action, success: a.success })),
    };
  }
}
