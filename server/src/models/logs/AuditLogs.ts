
export type AuditLogEntity = {
  id: number;
  label: string;
}

export type AuditLog = {
  message: string;
  category?: string;
  entities: AuditLogEntity[];
}