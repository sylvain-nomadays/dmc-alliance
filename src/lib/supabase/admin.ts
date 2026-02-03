/**
 * Supabase Admin client that bypasses strict typing
 * Used for API routes that need full database access
 */

import { createClient } from '@supabase/supabase-js';

// Client admin avec service role - sans typage strict
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin: any = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
