/**
 * Script to upgrade a partner member to owner.
 * Usage: npx tsx scripts/upgrade-partner-owner.ts <email> <partner-slug>
 *
 * Examples:
 *   npx tsx scripts/upgrade-partner-owner.ts lionel@pasionandina.com pasion-andina
 *   npx tsx scripts/upgrade-partner-owner.ts info@horseback-mongolia.com horseback-adventure
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually
const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMAIL = process.argv[2];
const PARTNER_SLUG = process.argv[3];

if (!EMAIL || !PARTNER_SLUG) {
  console.error('Usage: npx tsx scripts/upgrade-partner-owner.ts <email> <partner-slug>');
  console.log('\nExemples:');
  console.log('  npx tsx scripts/upgrade-partner-owner.ts lionel@pasionandina.com pasion-andina');
  console.log('  npx tsx scripts/upgrade-partner-owner.ts info@horseback-mongolia.com horseback-adventure');
  process.exit(1);
}

async function main() {
  console.log(`\nUpgrade ${EMAIL} en owner de ${PARTNER_SLUG}...\n`);

  // 1. Trouver l'utilisateur
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('email', EMAIL)
    .single();

  if (profileError || !profile) {
    console.error('Utilisateur non trouvé:', profileError?.message || 'aucun résultat');
    console.log('\nLe contact doit d\'abord s\'inscrire et être approuvé avant de lancer ce script.');
    return;
  }
  console.log(`Utilisateur trouvé: ${profile.full_name} (${profile.email})`);

  // 2. Trouver le partenaire
  const { data: partner, error: partnerError } = await supabaseAdmin
    .from('partners')
    .select('id, name, slug, owner_id')
    .eq('slug', PARTNER_SLUG)
    .single();

  if (partnerError || !partner) {
    console.error('Partenaire non trouvé:', partnerError?.message || 'aucun résultat');
    return;
  }
  console.log(`Partenaire trouvé: ${partner.name} (slug: ${partner.slug})`);

  if (partner.owner_id) {
    console.warn(`\nAttention: ce partenaire a déjà un owner_id (${partner.owner_id}).`);
    console.warn('Abandon pour éviter un conflit.');
    return;
  }

  // 3. Vérifier que l'utilisateur est bien membre
  const { data: membership } = await supabaseAdmin
    .from('partner_members')
    .select('id, role, status')
    .eq('partner_id', partner.id)
    .eq('user_id', profile.id)
    .single();

  if (!membership) {
    console.error('\nCet utilisateur n\'est pas membre de ce partenaire.');
    console.log('Il doit d\'abord être approuvé en tant que membre via l\'admin.');
    return;
  }
  console.log(`Membership actuel: role=${membership.role}, status=${membership.status}`);

  if (membership.role === 'owner') {
    console.log('\nCet utilisateur est déjà owner. Rien à faire.');
    return;
  }

  // 4. Upgrade partner_members → owner
  const { error: memberError } = await supabaseAdmin
    .from('partner_members')
    .update({ role: 'owner' })
    .eq('id', membership.id);

  if (memberError) {
    console.error('Erreur mise à jour partner_members:', memberError.message);
    return;
  }
  console.log('partner_members.role → owner');

  // 5. Mettre à jour partners.owner_id
  const { error: ownerError } = await supabaseAdmin
    .from('partners')
    .update({ owner_id: profile.id })
    .eq('id', partner.id);

  if (ownerError) {
    console.error('Erreur mise à jour partners.owner_id:', ownerError.message);
    return;
  }
  console.log('partners.owner_id → ' + profile.id);

  console.log(`\n${profile.full_name} est maintenant owner de ${partner.name}.`);
}

main();
