import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../common/roles';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) username: string;
  @Column({ unique: true }) email: string;
  @Column() fullName: string;
  @Column({ type: 'varchar', nullable: true }) designation: string;
  @Column({ type: 'varchar', default: Role.REGISTERED }) role: Role;
  @Column({ type: 'int', default: 2 }) clearance: number;
  @Column({ type: 'varchar', default: 'active' }) status: 'active' | 'suspended' | 'deactivated';
  @Column({ select: false }) passwordHash: string;
  @Column({ default: false }) mfaEnabled: boolean;
  @Column({ type: 'varchar', nullable: true, select: false }) mfaSecret: string;
  @Column({ type: 'int', default: 0 }) failedAttempts: number;
  @Column({ type: 'timestamptz', nullable: true }) lockedUntil: Date;
  @Column({ type: 'timestamptz', nullable: true }) lastLoginAt: Date;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
