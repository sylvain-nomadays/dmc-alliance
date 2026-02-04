import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CommercialRepresentative {
  id: string;
  name: string;
  photo_url: string | null;
  linkedin_url: string | null;
  bio_fr: string | null;
  bio_en: string | null;
  region: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommercialRepresentativeInput {
  name: string;
  photo_url?: string | null;
  linkedin_url?: string | null;
  bio_fr?: string | null;
  bio_en?: string | null;
  region?: string;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Get all active commercial representatives sorted by display_order
 */
export async function getCommercialRepresentatives(): Promise<CommercialRepresentative[]> {
  const { data, error } = await supabase
    .from('commercial_representatives')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching commercial representatives:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all commercial representatives (including inactive) for admin
 */
export async function getAllCommercialRepresentatives(): Promise<CommercialRepresentative[]> {
  const { data, error } = await supabase
    .from('commercial_representatives')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching all commercial representatives:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single representative by ID
 */
export async function getCommercialRepresentativeById(id: string): Promise<CommercialRepresentative | null> {
  const { data, error } = await supabase
    .from('commercial_representatives')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching commercial representative:', error);
    return null;
  }

  return data;
}

/**
 * Create a new commercial representative
 */
export async function createCommercialRepresentative(
  input: CommercialRepresentativeInput
): Promise<CommercialRepresentative | null> {
  const { data, error } = await supabase
    .from('commercial_representatives')
    .insert([input])
    .select()
    .single();

  if (error) {
    console.error('Error creating commercial representative:', error);
    throw error;
  }

  return data;
}

/**
 * Update a commercial representative
 */
export async function updateCommercialRepresentative(
  id: string,
  input: Partial<CommercialRepresentativeInput>
): Promise<CommercialRepresentative | null> {
  const { data, error } = await supabase
    .from('commercial_representatives')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating commercial representative:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a commercial representative
 */
export async function deleteCommercialRepresentative(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('commercial_representatives')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting commercial representative:', error);
    throw error;
  }

  return true;
}

/**
 * Reorder commercial representatives
 */
export async function reorderCommercialRepresentatives(
  orderedIds: string[]
): Promise<boolean> {
  // Update each representative with its new order
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('commercial_representatives')
      .update({ display_order: index })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const hasError = results.some(result => result.error);

  if (hasError) {
    console.error('Error reordering commercial representatives');
    return false;
  }

  return true;
}
