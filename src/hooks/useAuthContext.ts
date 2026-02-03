'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/auth/types';

interface PartnerInfo {
  id: string;
  name: string;
  slug: string;
  destinations: { id: string; slug: string; name: string }[];
}

interface AuthContextClient {
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  userId: string | null;
  userRole: UserRole | null;
  partnerId: string | null;
  partner: PartnerInfo | null;
  destinationIds: string[];
}

/**
 * Client-side hook to get the current user's auth context
 * Use this in client components that need to filter data based on permissions
 */
export function useAuthContext(): AuthContextClient {
  const [context, setContext] = useState<AuthContextClient>({
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
    isPartner: false,
    userId: null,
    userRole: null,
    partnerId: null,
    partner: null,
    destinationIds: [],
  });

  useEffect(() => {
    async function fetchAuthContext() {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setContext((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Get user profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        setContext((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const isAdmin = profile.role === 'admin';
      const isPartner = profile.role === 'partner';

      let partnerInfo: PartnerInfo | null = null;
      let destinationIds: string[] = [];

      if (isPartner) {
        // Get partner info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: partner } = await (supabase as any)
          .from('partners')
          .select('id, name, slug')
          .eq('user_id', user.id)
          .single();

        if (partner) {
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
            destinations: destinations || [],
          };

          destinationIds = (destinations || []).map((d: { id: string }) => d.id);
        }
      }

      setContext({
        isLoading: false,
        isAuthenticated: true,
        isAdmin,
        isPartner,
        userId: user.id,
        userRole: profile.role as UserRole,
        partnerId: partnerInfo?.id || null,
        partner: partnerInfo,
        destinationIds,
      });
    }

    fetchAuthContext();
  }, []);

  return context;
}
