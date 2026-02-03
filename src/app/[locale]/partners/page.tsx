import { getAllPartnersWithImages } from '@/lib/supabase/partners';
import { PartnersPageClient } from './PartnersPageClient';

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fetch partners with logos from Supabase
  const partnersWithLogos = await getAllPartnersWithImages();

  return <PartnersPageClient locale={locale} partnersWithLogos={partnersWithLogos} />;
}
