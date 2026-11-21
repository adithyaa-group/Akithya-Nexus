import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('increment') seq: number;
  @Column({ type: 'timestamptz' }) @Index() createdAt: Date;
  @Column({ type: 'varchar', nullable: true }) userId: string;
  @Column({ type: 'varchar', nullable: true }) username: string;
  @Column() action: string;
  @Column({ type: 'varchar', nullable: true }) entityType: string;
  @Column({ type: 'varchar', nullable: true }) @Index() entityId: string;
  @Column({ default: true }) success: boolean;
  @Column({ type: 'varchar', nullable: true }) ip: string;
  @Column({ type: 'json', nullable: true }) metadata: any;
  /** Hash chain: each row commits to the previous row, so edits/deletions are detectable. */
  @Column({ type: 'varchar', length: 64 }) prevHash: string;
  @Column({ type: 'varchar', length: 64 }) hash: string;
}

@Entity('login_history')
export class LoginHistory {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'timestamptz', default: () => 'now()' }) @Index() createdAt: Date;
  @Column() identifier: string;
  @Column({ type: 'varchar', nullable: true }) userId: string;
  @Column() success: boolean;
  @Column({ type: 'varchar', nullable: true }) reason: string;
  @Column({ type: 'varchar', nullable: true }) ip: string;
  @Column({ type: 'varchar', nullable: true }) userAgent: string;
}
