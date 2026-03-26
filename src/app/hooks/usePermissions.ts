/**
 * Enterprise RBAC Permission Hook
 * 
 * Provides role-based access checks for UI components.
 * Mirrors the server-side permission system in requirePermission.ts
 */

export type Permission =
  | 'bot.read' | 'bot.write'
  | 'wawi.read' | 'wawi.write'
  | 'warehouse.read' | 'warehouse.write' | 'warehouse.inventory'
  | 'invoices.read' | 'invoices.write'
  | 'settings.read' | 'settings.write'
  | 'team.read' | 'team.manage'
  | 'admin.access'
  | 'audit.read';

export type UserRole = 'owner' | 'manager' | 'warehouse' | 'sales' | 'viewer' | 'admin' | 'user';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    'bot.read', 'bot.write', 'wawi.read', 'wawi.write',
    'warehouse.read', 'warehouse.write', 'warehouse.inventory',
    'invoices.read', 'invoices.write',
    'settings.read', 'settings.write',
    'team.read', 'team.manage', 'admin.access', 'audit.read',
  ],
  manager: [
    'bot.read', 'bot.write', 'wawi.read', 'wawi.write',
    'warehouse.read', 'warehouse.write', 'warehouse.inventory',
    'invoices.read', 'invoices.write',
    'settings.read', 'team.read', 'audit.read',
  ],
  warehouse: [
    'wawi.read', 'warehouse.read', 'warehouse.write', 'warehouse.inventory', 'audit.read',
  ],
  sales: [
    'bot.read', 'bot.write', 'wawi.read', 'invoices.read', 'audit.read',
  ],
  viewer: [
    'bot.read', 'wawi.read',
  ],
  // Legacy role mapping
  admin: [
    'bot.read', 'bot.write', 'wawi.read', 'wawi.write',
    'warehouse.read', 'warehouse.write', 'warehouse.inventory',
    'invoices.read', 'invoices.write',
    'settings.read', 'settings.write',
    'team.read', 'team.manage', 'admin.access', 'audit.read',
  ],
  user: [
    'bot.read', 'bot.write', 'wawi.read', 'wawi.write',
    'warehouse.read', 'warehouse.write',
    'invoices.read', 'invoices.write',
    'settings.read', 'audit.read',
  ],
};

export interface PermissionHelpers {
  /** Current user role */
  role: UserRole;
  /** All permissions for current role */
  permissions: Permission[];
  /** Check if user has specific permission */
  can: (permission: Permission) => boolean;
  /** Check if user has ANY of the permissions */
  canAny: (...permissions: Permission[]) => boolean;
  /** Check if user has ALL of the permissions */
  canAll: (...permissions: Permission[]) => boolean;
  /** Check if user is owner/admin */
  isOwner: boolean;
  /** Check if user can access a workspace */
  canAccessBot: boolean;
  canAccessWawi: boolean;
  canAccessWarehouse: boolean;
  canAccessInvoices: boolean;
  canAccessSettings: boolean;
  canAccessAdmin: boolean;
}

/**
 * Get permissions for a role (standalone function, no hook dependency)
 */
export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['viewer'];
}

/**
 * Hook: usePermissions
 * 
 * Usage:
 *   const { can, canAny, role, isOwner } = usePermissions(user);
 *   if (can('wawi.write')) showEditButton();
 *   if (canAccessWarehouse) showWarehouseNav();
 */
export function usePermissions(user?: { role?: string } | null): PermissionHelpers {
  const role = (user?.role || 'viewer') as UserRole;
  const permissions = getPermissionsForRole(role);

  const can = (permission: Permission): boolean => permissions.includes(permission);
  const canAny = (...perms: Permission[]): boolean => perms.some(p => permissions.includes(p));
  const canAll = (...perms: Permission[]): boolean => perms.every(p => permissions.includes(p));

  return {
    role,
    permissions,
    can,
    canAny,
    canAll,
    isOwner: role === 'owner' || role === 'admin',
    canAccessBot: can('bot.read'),
    canAccessWawi: can('wawi.read'),
    canAccessWarehouse: can('warehouse.read'),
    canAccessInvoices: can('invoices.read'),
    canAccessSettings: can('settings.read'),
    canAccessAdmin: can('admin.access'),
  };
}

/**
 * Role definitions for UI display (role selector, team management)
 */
export const ROLE_DEFINITIONS = [
  { role: 'owner' as UserRole, label: 'Inhaber', description: 'Voller Zugriff auf alle Funktionen', color: '#8b5cf6' },
  { role: 'manager' as UserRole, label: 'Manager', description: 'Operative Verwaltung ohne Admin-Zugang', color: '#3b82f6' },
  { role: 'warehouse' as UserRole, label: 'Lager', description: 'Lagerverwaltung und Warenwirtschaft', color: '#f59e0b' },
  { role: 'sales' as UserRole, label: 'Verkauf', description: 'Bot-Workspace und Rechnungseinsicht', color: '#10b981' },
  { role: 'viewer' as UserRole, label: 'Betrachter', description: 'Nur Leserechte', color: '#6b7280' },
];
