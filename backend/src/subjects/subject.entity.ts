import { Column, CreateDateColumn, Entity, Generated, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid') id: string;
  /** Drives the public Subject ID: AG-SUB-000001 */
  @Column() @Generated('increment') seq: number;

  @Column() @Index() fullName: string;
  @Column({ type: 'varchar', nullable: true }) preferredName: string;
  @Column({ type: 'simple-array', nullable: true }) previousNames: string[];
  @Column({ type: 'simple-array', nullable: true }) aliases: string[];
  @Column({ type: 'date', nullable: true }) dateOfBirth: string;
  @Column({ type: 'varchar', nullable: true }) placeOfBirth: string;
  @Column({ type: 'varchar', nullable: true }) nationality: string;
  @Column({ type: 'varchar', nullable: true }) citizenship: string;
  @Column({ type: 'varchar', nullable: true }) gender: string;
  @Column({ type: 'varchar', nullable: true }) preferredLanguage: string;
  @Column({ type: 'simple-array', nullable: true }) additionalLanguages: string[];
  @Column({ type: 'varchar', nullable: true }) maritalStatus: string;

  @Column({ type: 'int', nullable: true }) heightCm: number;
  @Column({ type: 'varchar', nullable: true }) eyeColor: string;
  @Column({ type: 'varchar', nullable: true }) hairColor: string;
  @Column({ type: 'text', nullable: true }) physicalDescription: string;
  @Column({ type: 'text', nullable: true }) distinguishingFeatures: string;

  // Encrypted at rest (AES-256-GCM); masked in API output unless the viewer is cleared
  @Column({ type: 'text', nullable: true }) passportRefEnc: string;
  @Column({ type: 'text', nullable: true }) nationalIdRefEnc: string;
  @Column({ type: 'text', nullable: true }) drivingLicenseRefEnc: string;

  @Column({ type: 'varchar', default: 'CONFIDENTIAL' }) classification: string;
  @Column({ type: 'varchar', default: 'active' }) @Index() status: 'active' | 'archived';
  @Column({ type: 'varchar', default: 'unverified' }) verificationStatus: string;
  @Column({ type: 'varchar', default: 'user_provided' }) dataSource: string;

  @Column({ type: 'varchar', nullable: true }) @Index() ownerId: string;
  @Column({ type: 'varchar', nullable: true }) createdById: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
