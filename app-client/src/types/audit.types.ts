export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resourceType: 'flag' | 'project' | 'environment';
  resourceId: string;
  resourceName: string;
  environment?: string;
  changes?: Record<string, unknown>;
}

export const AuditAction = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
} as const;

export type AuditAction = typeof AuditAction[keyof typeof AuditAction];
