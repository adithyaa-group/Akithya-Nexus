export enum Role {
  SUPREME_ADMIN = 'supreme_admin',
  CHIEF_OFFICER = 'chief_officer',
  DIVISION_DIRECTOR = 'division_director',
  OFFICER = 'intelligence_officer',
  ANALYST = 'intelligence_analyst',
  REGISTERED = 'registered_user',
}
export const ROLE_LABEL: Record<Role, string> = {
  [Role.SUPREME_ADMIN]: 'Supreme Administrator',
  [Role.CHIEF_OFFICER]: 'Chief Intelligence Officer',
  [Role.DIVISION_DIRECTOR]: 'Division Director',
  [Role.OFFICER]: 'Intelligence Officer',
  [Role.ANALYST]: 'Intelligence Analyst',
  [Role.REGISTERED]: 'Registered User',
};
export const DEFAULT_CLEARANCE: Record<Role, number> = {
  [Role.SUPREME_ADMIN]: 9,
  [Role.CHIEF_OFFICER]: 8,
  [Role.DIVISION_DIRECTOR]: 6,
  [Role.OFFICER]: 5,
  [Role.ANALYST]: 3,
  [Role.REGISTERED]: 2,
};
// Minimum clearance needed to open a record of each classification (in addition to role checks)
export const CLASSIFICATION_MIN: Record<string, number> = {
  UNCLASSIFIED: 1,
  CONFIDENTIAL: 3,
  SECRET: 5,
  TOP_SECRET: 7,
};
export const WRITE_ROLES = [Role.SUPREME_ADMIN, Role.CHIEF_OFFICER, Role.DIVISION_DIRECTOR, Role.OFFICER];
export const ARCHIVE_ROLES = [Role.SUPREME_ADMIN, Role.CHIEF_OFFICER, Role.DIVISION_DIRECTOR];
export const AUDIT_ROLES = [Role.SUPREME_ADMIN, Role.CHIEF_OFFICER];
