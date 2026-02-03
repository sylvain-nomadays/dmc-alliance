/**
 * Server-side function to get the authenticated user's context
 * Includes role, partner info, and permissions
 */

import { createClient } from '@/lib/supabase/server';
import type { AuthContext, UserProfile, PartnerInfo, DestinationInfo } from './types';
import { rolePermissions } from './types';

/**
 * Get the full authentication context for the current user
 * Call this in server components or API routes
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // Get user profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const userProfile = profile as UserProfile;
  const isAdmin = userProfile.role === 'admin';
  const isPartner = userProfile.role === 'partner';
  const permissions = rolePermissions[userProfile.role];

  // If user is a partner, get their partner info and destinations
  let partnerInfo: PartnerInfo | null = null;

  if (isPartner) {
    // Find the partner record linked to this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partner, error: partnerError } = await (supabase as any)
      .from('partners')
      .select(`
        id,
        name,
        slug,
        tier,
        logo_url
      `)
      .eq('user_id', user.id)
      .single();

    if (!partnerError && partner) {
      // Get destinations for this partner
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: destinations } = await (supabase as any)
        .from('destinations')
        .select('id, slug, name')
        .eq('partner_id', partner.id)
        .eq('is_active', true);

      partnerInfo = {
        id: partner.id,
        name: partner.name,
        slug: partner.slug,
        tier: partner.tier,
        logo_url: partner.logo_url,
        destinations: (destinations || []) as DestinationInfo[],
      };
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email || '',
    },
    profile: userProfile,
    partner: partnerInfo,
    isAdmin,
    isPartner,
    canAccessAdmin: permissions.canAccessAdmin,
  };
}

/**
 * Check if the user can access a specific partner's data
 */
export function canAccessPartner(context: AuthContext, partnerId: string): boolean {
  if (context.isAdmin) return true;
  if (context.isPartner && context.partner?.id === partnerId) return true;
  return false;
}

/**
 * Check if the user can access a specific destination's data
 */
export function canAccessDestination(context: AuthContext, destinationId: string): boolean {
  if (context.isAdmin) return true;
  if (context.isPartner && context.partner) {
    return context.partner.destinations.some((d) => d.id === destinationId);
  }
  return false;
}

/**
 * Get the partner ID filter for queries (null for admin, partner_id for partners)
 */
export function getPartnerFilter(context: AuthContext): string | null {
  if (context.isAdmin) return null;
  if (context.isPartner && context.partner) return context.partner.id;
  return null;
}

/**
 * Get the destination IDs that the user can access
 */
export function getAccessibleDestinationIds(context: AuthContext): string[] | null {
  if (context.isAdmin) return null; // null means all
  if (context.isPartner && context.partner) {
    return context.partner.destinations.map((d) => d.id);
  }
  return [];
}
