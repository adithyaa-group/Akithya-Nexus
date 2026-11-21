import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { AuditService } from './audit/audit.service';
import { encrypt } from './common/crypto';
import { DEFAULT_CLEARANCE, Role } from './common/roles';
import { Subject } from './subjects/subject.entity';
import { User } from './users/user.entity';

const PASSWORD = process.env.SEED_PASSWORD || 'Nexus#Demo2026';

const USERS = [
  { username: 'admin', fullName: 'Aarav Mehta', role: Role.SUPREME_ADMIN, designation: 'Supreme Administrator' },
  { username: 'chief', fullName: 'Ishita Rao', role: Role.CHIEF_OFFICER, designation: 'Chief Intelligence Officer' },
  { username: 'director', fullName: 'Kabir Nair', role: Role.DIVISION_DIRECTOR, designation: 'Director, Records Division' },
  { username: 'officer', fullName: 'Meera Iyer', role: Role.OFFICER, designation: 'Intelligence Officer' },
  { username: 'analyst', fullName: 'Rohan Das', role: Role.ANALYST, designation: 'Intelligence Analyst' },
  { username: 'subject01', fullName: 'Vikram Sethi', role: Role.REGISTERED, designation: 'Registered User' },
];

// All fictional demonstration records
const SUBJECTS = [
  { fullName: 'Vikram Sethi', preferredName: 'Vik', dateOfBirth: '1991-04-12', placeOfBirth: 'Pune, India', nationality: 'Indian', citizenship: 'India', gender: 'Male', preferredLanguage: 'English', additionalLanguages: ['Hindi', 'Marathi'], maritalStatus: 'Married', heightCm: 178, eyeColor: 'Brown', hairColor: 'Black', physicalDescription: 'Athletic build, short hair.', distinguishingFeatures: 'Small scar above left eyebrow.', passportRef: 'DEMO-P-4471920', nationalIdRef: 'DEMO-ID-9012-3344', classification: 'CONFIDENTIAL', verificationStatus: 'verified', dataSource: 'fictional_demo', owner: 'subject01' },
  { fullName: 'Lena Hartmann', preferredName: 'Lena', aliases: ['L. Hart'], dateOfBirth: '1988-11-02', placeOfBirth: 'Hamburg, Germany', nationality: 'German', citizenship: 'Germany', gender: 'Female', preferredLanguage: 'German', additionalLanguages: ['English', 'French'], maritalStatus: 'Single', heightCm: 168, eyeColor: 'Grey', hairColor: 'Blonde', passportRef: 'DEMO-P-8830021', classification: 'SECRET', verificationStatus: 'user_provided', dataSource: 'fictional_demo' },
  { fullName: 'Tomás Alvarado', previousNames: ['Tomas Alvarado Ruiz'], dateOfBirth: '1979-07-23', placeOfBirth: 'Valencia, Spain', nationality: 'Spanish', citizenship: 'Spain', gender: 'Male', preferredLanguage: 'Spanish', additionalLanguages: ['English'], maritalStatus: 'Divorced', heightCm: 183, eyeColor: 'Hazel', hairColor: 'Dark brown', drivingLicenseRef: 'DEMO-DL-55-120098', classification: 'CONFIDENTIAL', verificationStatus: 'imported', dataSource: 'fictional_demo' },
  { fullName: 'Amara Okafor', preferredName: 'Amy', dateOfBirth: '1995-01-30', placeOfBirth: 'Lagos, Nigeria', nationality: 'Nigerian', citizenship: 'Nigeria', gender: 'Female', preferredLanguage: 'English', additionalLanguages: ['Igbo', 'Yoruba'], maritalStatus: 'Single', heightCm: 165, eyeColor: 'Brown', hairColor: 'Black', nationalIdRef: 'DEMO-ID-NG-7745100', classification: 'UNCLASSIFIED', verificationStatus: 'unverified', dataSource: 'fictional_demo' },
  { fullName: 'Hiroshi Tanabe', dateOfBirth: '1969-09-15', placeOfBirth: 'Osaka, Japan', nationality: 'Japanese', citizenship: 'Japan', gender: 'Male', preferredLanguage: 'Japanese', additionalLanguages: ['English'], maritalStatus: 'Married', heightCm: 172, eyeColor: 'Black', hairColor: 'Grey', passportRef: 'DEMO-P-TK-2201987', classification: 'TOP_SECRET', verificationStatus: 'verified', dataSource: 'fictional_demo' },
  { fullName: 'Priya Venkataraman', preferredName: 'Priya', dateOfBirth: '2000-03-08', placeOfBirth: 'Chennai, India', nationality: 'Indian', citizenship: 'India', gender: 'Female', preferredLanguage: 'Tamil', additionalLanguages: ['English', 'Hindi'], maritalStatus: 'Single', heightCm: 160, eyeColor: 'Brown', hairColor: 'Black', classification: 'CONFIDENTIAL', verificationStatus: 'historical', dataSource: 'fictional_demo', status: 'archived' },
];

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const users: Repository<User> = app.get(getRepositoryToken(User));
  const subjects: Repository<Subject> = app.get(getRepositoryToken(Subject));
  const audit = app.get(AuditService);

  const byName: Record<string, User> = {};
  for (const u of USERS) {
    let row = await users.findOne({ where: { username: u.username } });
    if (!row) {
      row = await users.save(users.create({ ...u, email: `${u.username}@akithya.example`, clearance: DEFAULT_CLEARANCE[u.role], passwordHash: await bcrypt.hash(PASSWORD, 12) }));
      console.log(`  + user ${u.username}`);
    }
    byName[u.username] = row;
  }

  if ((await subjects.count()) === 0) {
    for (const s of SUBJECTS) {
      const { passportRef, nationalIdRef, drivingLicenseRef, owner, ...rest } = s as any;
      const row = subjects.create({
        ...rest,
        passportRefEnc: encrypt(passportRef), nationalIdRefEnc: encrypt(nationalIdRef), drivingLicenseRefEnc: encrypt(drivingLicenseRef),
        ownerId: owner ? byName[owner].id : null, createdById: byName.admin.id,
      });
      await subjects.save(row);
    }
    await audit.log({ user: byName.admin, action: 'SEED_COMPLETE', metadata: { subjects: SUBJECTS.length } });
    console.log(`  + ${SUBJECTS.length} fictional subject records`);
  } else console.log('  subjects already present, skipped');

  console.log(`\nSeed complete. Demo password for all accounts: ${PASSWORD}`);
  console.log('Accounts: ' + USERS.map((u) => u.username).join(', '));
  await app.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
