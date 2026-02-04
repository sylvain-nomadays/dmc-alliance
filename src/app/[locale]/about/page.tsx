'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Linkedin, Mail, Phone } from 'lucide-react';

interface CommercialRepresentative {
  id: string;
  name: string;
  photo_url: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  bio_fr: string | null;
  bio_en: string | null;
  region: string;
}

interface Partner {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  tier: string;
  destinations: { name_fr: string; name_en: string }[];
}

const values = [
  {
    key: 'expertise',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'terracotta',
  },
  {
    key: 'collaboration',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'deep-blue',
  },
  {
    key: 'quality',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    color: 'sage',
  },
  {
    key: 'responsibility',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'terracotta',
  },
];

const colorClasses = {
  terracotta: 'bg-terracotta-100 text-terracotta-600',
  'deep-blue': 'bg-deep-blue-100 text-deep-blue-600',
  sage: 'bg-sage-100 text-sage-600',
};

const stats = [
  { value: '30+', labelFr: 'Destinations', labelEn: 'Destinations' },
  { value: '20+', labelFr: 'Agences partenaires', labelEn: 'Partner agencies' },
  { value: '150+', labelFr: 'Années d\'expérience cumulée', labelEn: 'Years of combined experience' },
  { value: '50K+', labelFr: 'Voyageurs/an', labelEn: 'Travelers/year' },
];

const milestones = [
  {
    year: '2018',
    titleFr: 'Naissance de l\'idée',
    titleEn: 'Birth of the idea',
    descFr: 'Rencontre entre réceptifs passionnés lors d\'un salon professionnel. L\'idée d\'un collectif naît.',
    descEn: 'Meeting between passionate DMCs at a trade show. The idea of a collective is born.',
  },
  {
    year: '2019',
    titleFr: 'Création du collectif',
    titleEn: 'Creation of the collective',
    descFr: 'Fondation officielle de The DMC Alliance avec 5 agences fondatrices sur 3 continents.',
    descEn: 'Official foundation of The DMC Alliance with 5 founding agencies on 3 continents.',
  },
  {
    year: '2021',
    titleFr: 'Expansion du réseau',
    titleEn: 'Network expansion',
    descFr: 'Le réseau s\'agrandit à 15 agences. Lancement des premiers GIR co-remplissage.',
    descEn: 'The network grows to 15 agencies. Launch of the first co-fill GIR tours.',
  },
  {
    year: '2024',
    titleFr: 'Aujourd\'hui',
    titleEn: 'Today',
    descFr: '20+ agences locales, 30+ destinations, et une communauté grandissante de professionnels du voyage.',
    descEn: '20+ local agencies, 30+ destinations, and a growing community of travel professionals.',
  },
];

export default function AboutPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const isFr = locale === 'fr';

  const [representatives, setRepresentatives] = useState<CommercialRepresentative[]>([]);
  const [featuredPartners, setFeaturedPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      try {
        // Load commercial representatives
        const { data: reps } = await supabase
          .from('commercial_representatives')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (reps) setRepresentatives(reps);

        // Load partners from Supabase with their destinations
        const { data: partnersData } = await supabase
          .from('partners')
          .select(`
            id,
            name,
            slug,
            logo_url,
            tier,
            destinations:partner_destinations(
              destination:destinations(name_fr, name_en)
            )
          `)
          .eq('tier', 'premium')
          .limit(6);

        if (partnersData) {
          // Transform the data to flatten the destinations
          const transformedPartners = partnersData.map(p => ({
            ...p,
            destinations: p.destinations?.map((d: { destination: { name_fr: string; name_en: string } }) => ({
              name_fr: d.destination?.name_fr || '',
              name_en: d.destination?.name_en || ''
            })) || []
          }));
          setFeaturedPartners(transformedPartners);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const translations = {
    title: isFr ? 'Qui sommes-nous' : 'About us',
    subtitle: isFr
      ? 'The DMC Alliance, c\'est l\'histoire d\'agences locales passionnées qui s\'unissent pour mieux vous servir.'
      : 'The DMC Alliance is the story of passionate local agencies uniting to serve you better.',
    historyTitle: isFr ? 'Notre histoire' : 'Our story',
    historyContent: isFr
      ? 'Né de la volonté de partager notre expertise terrain, The DMC Alliance réunit les meilleurs réceptifs indépendants d\'Asie, d\'Afrique, d\'Europe et des Amériques. Notre collectif est né d\'un constat simple : les meilleures expériences de voyage sont celles créées par des passionnés qui connaissent intimement leur territoire. Chaque agence membre apporte sa connaissance unique, ses contacts privilégiés et son amour pour sa destination.'
      : 'Born from the desire to share our field expertise, The DMC Alliance brings together the best independent DMCs from Asia, Africa, Europe and the Americas. Our collective was born from a simple observation: the best travel experiences are those created by enthusiasts who intimately know their territory. Each member agency brings its unique knowledge, privileged contacts and love for its destination.',
    missionTitle: isFr ? 'Notre mission' : 'Our mission',
    missionContent: isFr
      ? 'Offrir aux professionnels du voyage un accès privilégié à un réseau d\'experts locaux, pour des expériences authentiques et une qualité de service irréprochable. Nous croyons que le voyage de demain sera plus responsable, plus authentique et plus personnalisé. C\'est pourquoi nous mettons notre expertise collective au service de vos projets.'
      : 'To offer travel professionals privileged access to a network of local experts, for authentic experiences and impeccable service quality. We believe that tomorrow\'s travel will be more responsible, more authentic and more personalized. That\'s why we put our collective expertise at the service of your projects.',
    valuesTitle: isFr ? 'Nos valeurs' : 'Our values',
    expertise: {
      title: isFr ? 'Expertise terrain' : 'Field expertise',
      description: isFr
        ? 'Chaque destination est opérée par des équipes locales qui vivent et respirent leur pays.'
        : 'Each destination is operated by local teams who live and breathe their country.',
    },
    collaboration: {
      title: isFr ? 'Collaboration' : 'Collaboration',
      description: isFr
        ? 'Nous partageons nos savoirs et mutualisons nos forces pour mieux vous accompagner.'
        : 'We share our knowledge and pool our strengths to better support you.',
    },
    quality: {
      title: isFr ? 'Qualité' : 'Quality',
      description: isFr
        ? 'Sélection rigoureuse des prestataires, contrôle qualité permanent, amélioration continue.'
        : 'Rigorous selection of providers, permanent quality control, continuous improvement.',
    },
    responsibility: {
      title: isFr ? 'Responsabilité' : 'Responsibility',
      description: isFr
        ? 'Tourisme durable, impact positif sur les communautés locales, respect de l\'environnement.'
        : 'Sustainable tourism, positive impact on local communities, respect for the environment.',
    },
    teamTitle: isFr ? 'Notre réseau de partenaires' : 'Our partner network',
    teamSubtitle: isFr
      ? 'Des femmes et des hommes passionnés aux quatre coins du monde.'
      : 'Passionate men and women from all corners of the world.',
    timelineTitle: isFr ? 'Notre parcours' : 'Our journey',
    ctaTitle: isFr ? 'Rejoignez notre aventure' : 'Join our adventure',
    ctaSubtitle: isFr
      ? 'Vous êtes une agence réceptive locale et partagez nos valeurs ? Rejoignez The DMC Alliance.'
      : 'Are you a local DMC and share our values? Join The DMC Alliance.',
    ctaButton: isFr ? 'Devenir partenaire' : 'Become a partner',
    viewAllPartners: isFr ? 'Voir tous nos partenaires' : 'View all our partners',
    representativesTitle: isFr ? 'Nos représentants commerciaux en Europe' : 'Our commercial representatives in Europe',
    representativesSubtitle: isFr
      ? 'Votre point de contact privilégié pour découvrir notre réseau.'
      : 'Your privileged point of contact to discover our network.',
  };

  const valueTranslations = [
    translations.expertise,
    translations.collaboration,
    translations.quality,
    translations.responsibility,
  ];

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-24 bg-deep-blue-900 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/about/hero-team.jpg"
            alt=""
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deep-blue-900/90 to-deep-blue-900/50" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block text-terracotta-400 font-accent text-sm uppercase tracking-wider mb-4">
              The DMC Alliance
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading text-white mb-6">
              {translations.title}
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              {translations.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-heading text-terracotta-500 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {isFr ? stat.labelFr : stat.labelEn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commercial Representatives */}
      {representatives.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-heading text-gray-900 mb-3">
                {translations.representativesTitle}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {translations.representativesSubtitle}
              </p>
            </div>

            <div className={`grid gap-8 max-w-4xl mx-auto ${representatives.length === 1 ? 'grid-cols-1 max-w-lg' : 'grid-cols-1 md:grid-cols-2'}`}>
              {representatives.map((rep) => (
                <div
                  key={rep.id}
                  className="flex gap-6 bg-sand-50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    {rep.photo_url ? (
                      <Image
                        src={rep.photo_url}
                        alt={rep.name}
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-3xl text-gray-500">
                          {rep.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-heading text-gray-900">
                        {rep.name}
                      </h3>
                      {rep.linkedin_url && (
                        <a
                          href={rep.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-terracotta-500 font-medium mb-2">
                      {rep.region}
                    </p>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-3 mb-3">
                      {rep.email && (
                        <a
                          href={`mailto:${rep.email}`}
                          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-terracotta-500 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {rep.email}
                        </a>
                      )}
                      {rep.phone && (
                        <a
                          href={`tel:${rep.phone.replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-terracotta-500 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {rep.phone}
                        </a>
                      )}
                    </div>

                    {(isFr ? rep.bio_fr : rep.bio_en) && (
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {isFr ? rep.bio_fr : rep.bio_en}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* History & Mission */}
      <section className="py-20 bg-sand-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* History */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-terracotta-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-heading text-gray-900">
                  {translations.historyTitle}
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {translations.historyContent}
              </p>
            </div>

            {/* Mission */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-deep-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-deep-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-heading text-gray-900">
                  {translations.missionTitle}
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {translations.missionContent}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading text-gray-900 mb-4">
              {translations.valuesTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={value.key}
                className="text-center p-8 rounded-2xl bg-sand-50 hover:bg-sand-100 transition-colors"
              >
                <div className={`w-16 h-16 rounded-2xl ${colorClasses[value.color as keyof typeof colorClasses]} flex items-center justify-center mx-auto mb-6`}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-heading text-gray-900 mb-3">
                  {valueTranslations[index].title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {valueTranslations[index].description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-deep-blue-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading text-white text-center mb-16">
            {translations.timelineTitle}
          </h2>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-deep-blue-700 md:-translate-x-1/2" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className={`relative flex items-start gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  {/* Dot */}
                  <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-terracotta-500 rounded-full md:-translate-x-1/2 ring-4 ring-deep-blue-900" />

                  {/* Content */}
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                    <span className="text-terracotta-400 font-heading text-2xl">
                      {milestone.year}
                    </span>
                    <h3 className="text-white text-xl font-heading mt-2 mb-2">
                      {isFr ? milestone.titleFr : milestone.titleEn}
                    </h3>
                    <p className="text-deep-blue-200">
                      {isFr ? milestone.descFr : milestone.descEn}
                    </p>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block md:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team / Partners */}
      <section className="py-20 bg-sand-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading text-gray-900 mb-4">
              {translations.teamTitle}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {translations.teamSubtitle}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
              {featuredPartners.map((partner) => (
                <Link
                  key={partner.slug}
                  href={`/${locale}/partners/${partner.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl p-6 text-center shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1">
                    <div className="relative w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-white border-2 border-sand-200 flex items-center justify-center">
                      {partner.logo_url ? (
                        <Image
                          src={partner.logo_url}
                          alt={partner.name}
                          fill
                          className="object-contain p-2"
                        />
                      ) : (
                        <span className="text-2xl font-heading text-gray-400">
                          {partner.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-terracotta-500 transition-colors truncate">
                      {partner.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {partner.destinations[0] && (isFr ? partner.destinations[0].name_fr : partner.destinations[0].name_en)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link href={`/${locale}/partners`}>
              <Button variant="outline" size="md">
                {translations.viewAllPartners}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-terracotta-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading text-white mb-4">
            {translations.ctaTitle}
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            {translations.ctaSubtitle}
          </p>
          <Link href={`/${locale}/contact?subject=partnership`}>
            <Button variant="outline-white" size="lg">
              {translations.ctaButton}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
