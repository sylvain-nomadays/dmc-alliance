/**
 * Types for authentication and authorization
 */

export type UserRole = 'admin' | 'partner' | 'agency' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  locale: string;
  is_active: boolean;
}

export interface PartnerInfo {
  id: string;
  name: string;
  slug: string;
  tier: 'premium' | 'classic';
  logo_url: string | null;
  destinations: DestinationInfo[];
}

export interface DestinationInfo {
  id: string;
  slug: string;
  name: string;
}

export interface AuthContext {
  user: {
    id: string;
    email: string;
  };
  profile: UserProfile;
  partner: PartnerInfo | null;
  isAdmin: boolean;
  isPartner: boolean;
  canAccessAdmin: boolean;
}

/**
 * Permissions for different roles
 */
export const rolePermissions: Record<UserRole, {
  canAccessAdmin: boolean;
  canManageAllPartners: boolean;
  canManageAllDestinations: boolean;
  canManageAllCircuits: boolean;
  canManageAllArticles: boolean;
  canViewHomepageSettings: boolean;
  canViewMessages: boolean;
  canViewMedia: boolean;
  canViewSettings: boolean;
}> = {
  admin: {
    canAccessAdmin: true,
    canManageAllPartners: true,
    canManageAllDestinations: true,
    canManageAllCircuits: true,
    canManageAllArticles: true,
    canViewHomepageSettings: true,
    canViewMessages: true,
    canViewMedia: true,
    canViewSettings: true,
  },
  partner: {
    canAccessAdmin: true,
    canManageAllPartners: false,
    canManageAllDestinations: false,
    canManageAllCircuits: false,
    canManageAllArticles: false,
    canViewHomepageSettings: false,
    canViewMessages: false,
    canViewMedia: true, // Can upload their own media
    canViewSettings: false,
  },
  agency: {
    canAccessAdmin: false,
    canManageAllPartners: false,
    canManageAllDestinations: false,
    canManageAllCircuits: false,
    canManageAllArticles: false,
    canViewHomepageSettings: false,
    canViewMessages: false,
    canViewMedia: false,
    canViewSettings: false,
  },
  member: {
    canAccessAdmin: false,
    canManageAllPartners: false,
    canManageAllDestinations: false,
    canManageAllCircuits: false,
    canManageAllArticles: false,
    canViewHomepageSettings: false,
    canViewMessages: false,
    canViewMedia: false,
    canViewSettings: false,
  },
};
