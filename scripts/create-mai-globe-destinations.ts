/**
 * Script to create Sri Lanka and Vietnam destinations in Supabase
 * for Mai Globe Travels partner.
 *
 * Usage: npx tsx scripts/create-mai-globe-destinations.ts
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

const MAI_GLOBE_PARTNER_ID = '6cc88a1a-4400-4704-a428-78fbe7414151';

const destinations = [
  {
    name: 'Sri Lanka',
    name_en: 'Sri Lanka',
    slug: 'sri-lanka',
    country: 'Sri Lanka',
    region: 'asia',
    partner_id: MAI_GLOBE_PARTNER_ID,
    description_fr: "Le Sri Lanka concentre une incroyable diversité sur une île compacte : temples millénaires, plantations de thé, safaris, plages paradisiaques. Mai Globe Travels révèle toutes les facettes de cette perle.\n\nFacile à parcourir, le Sri Lanka permet de combiner culture, nature et détente en un seul voyage, avec un excellent rapport qualité-prix.",
    description_en: "Sri Lanka concentrates incredible diversity on a compact island: ancient temples, tea plantations, safaris, paradise beaches. Mai Globe Travels reveals all facets of this pearl.\n\nEasy to travel, Sri Lanka allows you to combine culture, nature and relaxation in one trip, with excellent value for money.",
    highlights: [
      'Diversité concentrée sur une petite île',
      'Sites UNESCO exceptionnels',
      'Safari éléphants et léopards',
      'Train panoramique légendaire',
      'Plages préservées',
    ],
    best_time: 'Déc-Mars (côte ouest) / Avril-Sept (côte est)',
    ideal_duration: '10-14 jours',
    is_active: true,
  },
  {
    name: 'Vietnam',
    name_en: 'Vietnam',
    slug: 'vietnam',
    country: 'Vietnam',
    region: 'asia',
    partner_id: MAI_GLOBE_PARTNER_ID,
    description_fr: "Le Vietnam séduit par sa longueur qui offre une diversité de paysages et de cultures étonnante. Mai Globe Travels propose des circuits authentiques du nord au sud.\n\nDe la majestueuse baie d'Halong aux rizières en terrasses de Sapa, des villes impériales de Hué aux marchés flottants du Mékong, le Vietnam est une terre de contrastes fascinante.",
    description_en: "Vietnam seduces with its length offering an amazing diversity of landscapes and cultures. Mai Globe Travels offers authentic circuits from north to south.\n\nFrom the majestic Halong Bay to the terraced rice fields of Sapa, from the imperial cities of Hue to the floating markets of the Mekong, Vietnam is a land of fascinating contrasts.",
    highlights: [
      'Diversité Nord-Centre-Sud exceptionnelle',
      'Gastronomie de renommée mondiale',
      'Patrimoine historique riche',
      'Excellent rapport qualité-prix',
      'Combinés régionaux faciles',
    ],
    best_time: 'Oct-Avril (nord) / Déc-Avril (sud)',
    ideal_duration: '12-18 jours',
    is_active: true,
  },
];

async function main() {
  console.log('\nCréation des destinations Sri Lanka et Vietnam pour Mai Globe Travels...\n');

  // Verify partner exists
  const { data: partner, error: partnerError } = await supabaseAdmin
    .from('partners')
    .select('id, name, slug')
    .eq('id', MAI_GLOBE_PARTNER_ID)
    .single();

  if (partnerError || !partner) {
    console.error('Partenaire Mai Globe non trouvé:', partnerError?.message);
    return;
  }
  console.log(`Partenaire trouvé: ${partner.name} (${partner.slug})`);

  for (const dest of destinations) {
    // Check if destination already exists
    const { data: existing } = await supabaseAdmin
      .from('destinations')
      .select('id, slug')
      .eq('slug', dest.slug)
      .single();

    if (existing) {
      console.log(`\n${dest.name}: existe déjà (id: ${existing.id}) — mise à jour du partner_id`);
      const { error } = await supabaseAdmin
        .from('destinations')
        .update({ partner_id: dest.partner_id })
        .eq('id', existing.id);

      if (error) {
        console.error(`  Erreur mise à jour:`, error.message);
      } else {
        console.log(`  partner_id mis à jour → Mai Globe Travels`);
      }
      continue;
    }

    // Insert new destination
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('destinations')
      .insert(dest)
      .select('id, slug, name')
      .single();

    if (insertError) {
      console.error(`\n${dest.name}: erreur d'insertion:`, insertError.message);
    } else {
      console.log(`\n${dest.name}: créée avec succès (id: ${inserted.id})`);
    }
  }

  // Verify
  const { data: results } = await supabaseAdmin
    .from('destinations')
    .select('id, name, slug, partner_id')
    .eq('partner_id', MAI_GLOBE_PARTNER_ID);

  console.log('\n=== Destinations Mai Globe Travels ===');
  (results || []).forEach((d) => {
    console.log(`  - ${d.name} (slug: ${d.slug})`);
  });

  console.log('\nTerminé.');
}

main();
