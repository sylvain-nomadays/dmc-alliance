/**
 * Script de diagnostic et correction des partner_members manquants.
 *
 * Vérifie que chaque partenaire ayant un owner_id a bien une entrée
 * correspondante dans partner_members avec role='owner' et status='active'.
 * Ajoute les entrées manquantes.
 *
 * Usage: npx tsx scripts/fix-partner-members.ts
 *   --dry-run   Afficher les corrections sans les appliquer (par défaut)
 *   --apply     Appliquer les corrections
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

const applyMode = process.argv.includes('--apply');

async function main() {
  console.log(`\n=== Diagnostic partner_members ===`);
  console.log(`Mode: ${applyMode ? 'APPLY (corrections appliquées)' : 'DRY-RUN (aucune modification)'}\n`);

  // 1. Récupérer tous les partenaires
  const { data: partners, error: partnersError } = await supabaseAdmin
    .from('partners')
    .select('id, name, slug, owner_id')
    .order('name');

  if (partnersError || !partners) {
    console.error('Erreur lors du chargement des partenaires:', partnersError?.message);
    return;
  }

  console.log(`${partners.length} partenaires trouvés.\n`);

  // 2. Récupérer tous les partner_members existants
  const { data: members, error: membersError } = await supabaseAdmin
    .from('partner_members')
    .select('partner_id, user_id, role, status');

  if (membersError) {
    console.error('Erreur lors du chargement des partner_members:', membersError.message);
    return;
  }

  // Créer un set pour lookup rapide
  const memberSet = new Set(
    (members || []).map((m) => `${m.partner_id}:${m.user_id}`)
  );

  const membersByPartner = new Map<string, typeof members>();
  for (const m of members || []) {
    const list = membersByPartner.get(m.partner_id) || [];
    list.push(m);
    membersByPartner.set(m.partner_id, list);
  }

  // 3. Diagnostic
  let missingCount = 0;
  let noOwnerCount = 0;
  let okCount = 0;
  const toFix: { partnerId: string; partnerName: string; ownerUserId: string }[] = [];

  for (const partner of partners) {
    const partnerMembers = membersByPartner.get(partner.id) || [];
    const hasOwnerMember = partnerMembers.some(
      (m) => m.user_id === partner.owner_id && m.role === 'owner' && m.status === 'active'
    );

    if (!partner.owner_id) {
      console.log(`  ⚠  ${partner.name} (${partner.slug}) — pas de owner_id défini`);
      noOwnerCount++;
    } else if (!memberSet.has(`${partner.id}:${partner.owner_id}`)) {
      console.log(`  ✗  ${partner.name} (${partner.slug}) — owner_id existe mais ABSENT de partner_members`);
      toFix.push({ partnerId: partner.id, partnerName: partner.name, ownerUserId: partner.owner_id });
      missingCount++;
    } else if (!hasOwnerMember) {
      console.log(`  ~  ${partner.name} (${partner.slug}) — dans partner_members mais pas avec role=owner/status=active`);
      missingCount++;
    } else {
      console.log(`  ✓  ${partner.name} (${partner.slug}) — OK`);
      okCount++;
    }
  }

  console.log(`\n--- Résumé ---`);
  console.log(`  OK:                 ${okCount}`);
  console.log(`  Sans owner_id:      ${noOwnerCount}`);
  console.log(`  Manquants à fixer:  ${toFix.length}`);
  console.log('');

  // 4. Correction
  if (toFix.length === 0) {
    console.log('Rien à corriger.\n');
    return;
  }

  if (!applyMode) {
    console.log('Corrections à appliquer :');
    for (const fix of toFix) {
      console.log(`  → Ajouter ${fix.ownerUserId} comme owner de ${fix.partnerName}`);
    }
    console.log('\nRelancez avec --apply pour appliquer les corrections.');
    console.log('  npx tsx scripts/fix-partner-members.ts --apply\n');
    return;
  }

  console.log('Application des corrections...\n');

  for (const fix of toFix) {
    const { error } = await supabaseAdmin
      .from('partner_members')
      .upsert(
        {
          partner_id: fix.partnerId,
          user_id: fix.ownerUserId,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString(),
        },
        { onConflict: 'partner_id,user_id' }
      );

    if (error) {
      console.error(`  ✗  ${fix.partnerName}: erreur — ${error.message}`);
    } else {
      console.log(`  ✓  ${fix.partnerName}: owner ajouté dans partner_members`);
    }
  }

  console.log('\nCorrections appliquées.\n');
}

main();
