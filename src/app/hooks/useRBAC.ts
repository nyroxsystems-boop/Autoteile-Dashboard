import { useAuth } from '../../auth/AuthContext';
import { useTenants } from './useTenants';

export type Role = 'owner' | 'admin' | 'member';

/**
 * RBAC hook for frontend feature-gating.
 * 
 * Usage:
 *   const { canManageTeam, canEditSettings, isOwner } = useRBAC();
 *   {canManageTeam && <TeamTab />}
 */
export function useRBAC() {
    const { user } = useAuth();
    const { currentTenant } = useTenants();

    const role: Role = (currentTenant?.role as Role) || (user?.role as Role) || 'member';

    const isOwner = role === 'owner';
    const isAdmin = role === 'admin' || role === 'owner';
    const isMember = true; // everyone is at least a member

    return {
        role,
        isOwner,
        isAdmin,
        isMember,

        // ── Feature Permissions ──
        // Settings
        canEditSettings: isAdmin,           // owner + admin
        canManageTeam: isOwner,             // owner only
        canManageBilling: isOwner,          // owner only
        canViewSettings: isMember,          // everyone

        // WaWi
        canDeleteArticles: isAdmin,         // owner + admin
        canEditPrices: isAdmin,             // owner + admin
        canManageSuppliers: isAdmin,        // owner + admin
        canViewWawi: isMember,              // everyone

        // Orders & Invoicing
        canCreateInvoices: isAdmin,         // owner + admin
        canCancelInvoices: isOwner,         // owner only
        canExportData: isAdmin,             // owner + admin

        // AI Features
        canUseAI: isAdmin,                  // owner + admin
    };
}
