import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { partners } from '@/data/partners';
import { getPartnerProfile } from '@/data/partners-profiles';
import { getCircuitsByPartner } from '@/data/circuits';
import { getDestinationBySlug } from '@/data/destinations';
import { getPartnerWithFullProfile, type PartnerVideo, type TeamMember, type Testimonial } from '@/lib/supabase/partners';
import { getGirCircuitsByPartner, type DbCircuit } from '@/lib/supabase/circuits';
import { VideoCarousel } from '@/components/partners/VideoCarousel';
import { cn } from '@/lib/utils';
import {
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  CalendarIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Generate metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const partner = partners.find(p => p.slug === slug);

  if (!partner) {
    return { title: 'Partner not found' };
  }

  const description = locale === 'fr' ? partner.description.fr : partner.description.en;

  return {
    title: `${partner.name} - Partenaire | The DMC Alliance`,
    description,
    openGraph: {
      title: `${partner.name} - The DMC Alliance`,
      description,
      locale,
      type: 'website',
    },
  };
}

// Generate static params
export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];

  locales.forEach((locale) => {
    partners.forEach((partner) => {
      params.push({ locale, slug: partner.slug });
    });
  });

  return params;
}

export default async function PartnerProfilePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Get partner with full profile from Supabase (falls back to static if not in Supabase)
  const partner = await getPartnerWithFullProfile(slug);

  if (!partner) {
    notFound();
  }

  // Get static profile as additional fallback for values, b2bServices, uniqueSellingPoints
  const staticProfile = getPartnerProfile(partner.id);

  // Get GIR circuits from Supabase first, fallback to static
  const girCircuitsFromDb = await getGirCircuitsByPartner(partner.slug);
  const staticCircuits = getCircuitsByPartner(partner.id);

  // Use DB circuits if available, otherwise static
  const hasDbCircuits = girCircuitsFromDb.length > 0;

  const isFr = locale === 'fr';

  // Get destination details
  const destinationDetails = partner.destinations.map(d => ({
    ...d,
    detail: getDestinationBySlug(d.slug)
  }));

  // Determine if we have enough profile data to show the detailed view
  const hasProfileData = partner.story || partner.mission || staticProfile;

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative bg-deep-blue-900 py-16 lg:py-24">
        {/* Cover image if available */}
        {partner.coverImage && (
          <div className="absolute inset-0">
            <Image
              src={partner.coverImage}
              alt={partner.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-deep-blue-900/80" />
          </div>
        )}
        {/* Pattern fallback if no cover image */}
        {!partner.coverImage && (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'url("/images/patterns/topography.svg")', backgroundSize: '400px' }} />
          </div>
        )}

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/60 text-sm mb-8">
            <Link href={`/${locale}`} className="hover:text-white transition-colors">
              {isFr ? 'Accueil' : 'Home'}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/partners`} className="hover:text-white transition-colors">
              {isFr ? 'Partenaires' : 'Partners'}
            </Link>
            <span>/</span>
            <span className="text-white">{partner.name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
            {/* Logo & Basic Info */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 lg:w-40 lg:h-40 bg-white rounded-2xl shadow-xl overflow-hidden">
                {partner.logo ? (
                  <div
                    className="w-full h-full bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${partner.logo})` }}
                    aria-label={partner.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-heading text-deep-blue-600">
                      {partner.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {partner.tier === 'premium' && (
                  <span className="inline-flex items-center gap-1 bg-terracotta-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                    <StarIcon className="w-4 h-4" />
                    {isFr ? 'Partenaire Premium' : 'Premium Partner'}
                  </span>
                )}
                {partner.hasGir && (
                  <span className="inline-flex items-center gap-1 bg-sage-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                    GIR
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading text-white mb-4">
                {partner.name}
              </h1>

              <p className="text-lg text-white/80 mb-6 max-w-2xl">
                {isFr ? partner.description.fr : partner.description.en}
              </p>

              {/* Destinations */}
              <div className="flex flex-wrap gap-2 mb-6">
                {partner.destinations.map((dest) => (
                  <Link
                    key={dest.slug}
                    href={`/${locale}/destinations/${dest.slug}`}
                    className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-sm transition-colors"
                  >
                    <MapPinIcon className="w-4 h-4" />
                    {isFr ? dest.name : dest.nameEn}
                  </Link>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <Link href={`/${locale}/contact?partner=${partner.slug}`}>
                  <Button variant="primary" size="lg">
                    <EnvelopeIcon className="w-5 h-5 mr-2" />
                    {isFr ? "Contacter l'agence" : 'Contact agency'}
                  </Button>
                </Link>
                {partner.website && (
                  <a href={partner.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                      <GlobeAltIcon className="w-5 h-5 mr-2" />
                      {isFr ? 'Site web' : 'Website'}
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Stats (if profile exists) */}
            {(staticProfile || partner.teamSize || partner.foundedYear) && (
              <div className="w-full lg:w-auto lg:flex-shrink-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 grid grid-cols-2 lg:grid-cols-1 gap-4">
                  {(partner.foundedYear || staticProfile?.stats.yearsExperience) && (
                    <div className="text-center lg:text-left">
                      <div className="text-3xl font-bold text-white">
                        {partner.foundedYear
                          ? new Date().getFullYear() - partner.foundedYear
                          : staticProfile?.stats.yearsExperience}
                      </div>
                      <div className="text-white/60 text-sm">{isFr ? "années d'expérience" : 'years experience'}</div>
                    </div>
                  )}
                  {staticProfile?.stats.travelersPerYear && (
                    <div className="text-center lg:text-left">
                      <div className="text-3xl font-bold text-white">{staticProfile.stats.travelersPerYear}+</div>
                      <div className="text-white/60 text-sm">{isFr ? 'voyageurs/an' : 'travelers/year'}</div>
                    </div>
                  )}
                  {staticProfile?.stats.satisfactionRate && (
                    <div className="text-center lg:text-left">
                      <div className="text-3xl font-bold text-white">{staticProfile.stats.satisfactionRate}%</div>
                      <div className="text-white/60 text-sm">{isFr ? 'satisfaction' : 'satisfaction'}</div>
                    </div>
                  )}
                  {(partner.teamSize || staticProfile?.teamSize) && (
                    <div className="text-center lg:text-left">
                      <div className="text-3xl font-bold text-white">{partner.teamSize || staticProfile?.teamSize}</div>
                      <div className="text-white/60 text-sm">{isFr ? 'collaborateurs' : 'team members'}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Specialties Bar */}
      <section className="bg-sand-100 py-4 border-b border-sand-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-gray-500 text-sm">{isFr ? 'Spécialités' : 'Specialties'}:</span>
            {partner.specialties.map((specialty, idx) => (
              <span
                key={idx}
                className="bg-white text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      {hasProfileData ? (
        <div className="bg-white">
          <div className="container mx-auto px-4 py-12 lg:py-16">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-12">
                {/* Story Section - from Supabase or static */}
                {(partner.story || staticProfile?.story) && (
                  <section>
                    <h2 className="text-2xl md:text-3xl font-heading text-gray-900 mb-6">
                      {isFr ? 'Notre histoire' : 'Our Story'}
                    </h2>
                    <div
                      className="prose prose-lg max-w-none text-gray-600 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-ul:list-disc prose-li:marker:text-terracotta-500"
                      dangerouslySetInnerHTML={{
                        __html: isFr
                          ? (partner.story?.fr || staticProfile?.story?.fr || '')
                          : (partner.story?.en || staticProfile?.story?.en || '')
                      }}
                    />
                  </section>
                )}

                {/* Video Carousel - from Supabase or static */}
                {((partner.videos && partner.videos.length > 0) || staticProfile?.presentationVideo) && (
                  <VideoCarousel
                    videos={partner.videos || []}
                    staticVideo={staticProfile?.presentationVideo}
                    locale={locale}
                  />
                )}

                {/* Mission & Values - from Supabase or static */}
                {(partner.mission || staticProfile?.mission) && (
                  <section>
                    <h2 className="text-2xl md:text-3xl font-heading text-gray-900 mb-4">
                      {isFr ? 'Notre mission' : 'Our Mission'}
                    </h2>
                    <div
                      className="prose prose-lg max-w-none text-gray-600 mb-8 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-ul:list-disc prose-li:marker:text-terracotta-500 prose-blockquote:border-l-4 prose-blockquote:border-terracotta-500 prose-blockquote:pl-4 prose-blockquote:italic"
                      dangerouslySetInnerHTML={{
                        __html: isFr
                          ? (partner.mission?.fr || staticProfile?.mission?.fr || '')
                          : (partner.mission?.en || staticProfile?.mission?.en || '')
                      }}
                    />

                    {staticProfile?.values && staticProfile.values.length > 0 && (
                      <>
                        <h3 className="text-xl font-heading text-gray-900 mb-6">
                          {isFr ? 'Nos valeurs' : 'Our Values'}
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          {staticProfile.values.map((value, idx) => (
                            <div key={idx} className="bg-sand-50 rounded-xl p-6">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-terracotta-100 rounded-full flex items-center justify-center">
                                  {idx === 0 && <HeartIcon className="w-5 h-5 text-terracotta-600" />}
                                  {idx === 1 && <ShieldCheckIcon className="w-5 h-5 text-terracotta-600" />}
                                  {idx === 2 && <SparklesIcon className="w-5 h-5 text-terracotta-600" />}
                                  {idx === 3 && <AcademicCapIcon className="w-5 h-5 text-terracotta-600" />}
                                </div>
                                <h4 className="font-semibold text-gray-900">
                                  {isFr ? value.title.fr : value.title.en}
                                </h4>
                              </div>
                              <p className="text-gray-600 text-sm">
                                {isFr ? value.description.fr : value.description.en}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                )}

                {/* Unique Selling Points - from static only */}
                {staticProfile?.uniqueSellingPoints && (
                  <section className="bg-deep-blue-50 rounded-2xl p-8">
                    <h2 className="text-2xl font-heading text-gray-900 mb-6">
                      {isFr ? 'Ce qui nous rend uniques' : 'What makes us unique'}
                    </h2>
                    <ul className="space-y-4">
                      {(isFr ? staticProfile.uniqueSellingPoints.fr : staticProfile.uniqueSellingPoints.en).map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckBadgeIcon className="w-6 h-6 text-deep-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Team Section - from Supabase or static */}
                {(partner.teamMembers && partner.teamMembers.length > 0) || (staticProfile?.team && staticProfile.team.length > 0) ? (
                  <section>
                    <h2 className="text-2xl md:text-3xl font-heading text-gray-900 mb-6">
                      {isFr ? "L'équipe" : 'The Team'}
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Supabase team members first */}
                      {partner.teamMembers?.map((member) => (
                        <div key={member.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div className="aspect-square bg-gray-100 relative">
                            {member.photo_url ? (
                              <Image
                                src={member.photo_url}
                                alt={member.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-6xl text-gray-300">
                                  {member.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            <p className="text-terracotta-600 text-sm mb-2">
                              {isFr ? member.role_fr : member.role_en}
                            </p>
                            {(member.bio_fr || member.bio_en) && (
                              <p className="text-gray-600 text-sm">
                                {isFr ? member.bio_fr : member.bio_en}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {/* Static team members if no Supabase data */}
                      {!partner.teamMembers?.length && staticProfile?.team.map((member, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <div className="aspect-square bg-gray-100 relative">
                            {member.photo ? (
                              <Image
                                src={member.photo}
                                alt={member.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-6xl text-gray-300">
                                  {member.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            <p className="text-terracotta-600 text-sm mb-2">
                              {isFr ? member.role.fr : member.role.en}
                            </p>
                            {member.bio && (
                              <p className="text-gray-600 text-sm">
                                {isFr ? member.bio.fr : member.bio.en}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {/* Testimonials - from Supabase or static */}
                {((partner.testimonials && partner.testimonials.length > 0) || (staticProfile?.testimonials && staticProfile.testimonials.length > 0)) && (
                  <section className="bg-terracotta-50 rounded-2xl p-8">
                    <h2 className="text-2xl font-heading text-gray-900 mb-6">
                      {isFr ? 'Ils nous font confiance' : 'They trust us'}
                    </h2>
                    <div className="space-y-6">
                      {/* Supabase testimonials first */}
                      {partner.testimonials?.map((testimonial) => (
                        <blockquote key={testimonial.id} className="bg-white rounded-xl p-6">
                          <p className="text-gray-700 italic mb-4">
                            "{isFr ? testimonial.content_fr : (testimonial.content_en || testimonial.content_fr)}"
                          </p>
                          <footer className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-terracotta-100 rounded-full flex items-center justify-center">
                              <span className="text-terracotta-600 font-semibold">
                                {testimonial.author_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{testimonial.author_name}</div>
                              {testimonial.author_company && (
                                <div className="text-gray-500 text-sm">{testimonial.author_company}</div>
                              )}
                            </div>
                          </footer>
                        </blockquote>
                      ))}
                      {/* Static testimonials if no Supabase data */}
                      {!partner.testimonials?.length && staticProfile?.testimonials?.map((testimonial, idx) => (
                        <blockquote key={idx} className="bg-white rounded-xl p-6">
                          <p className="text-gray-700 italic mb-4">
                            "{isFr ? testimonial.quote.fr : testimonial.quote.en}"
                          </p>
                          <footer className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-terracotta-100 rounded-full flex items-center justify-center">
                              <span className="text-terracotta-600 font-semibold">
                                {testimonial.author.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{testimonial.author}</div>
                              <div className="text-gray-500 text-sm">{testimonial.company}</div>
                            </div>
                          </footer>
                        </blockquote>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  {/* B2B Services Card - from static only */}
                  {staticProfile?.b2bServices && (
                    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
                      <div className="bg-sage-600 p-4">
                        <h3 className="text-lg font-heading text-white text-center">
                          {isFr ? 'Services B2B' : 'B2B Services'}
                        </h3>
                      </div>
                      <div className="p-6">
                        <ul className="space-y-3">
                          {(isFr ? staticProfile.b2bServices.fr : staticProfile.b2bServices.en).map((service, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckBadgeIcon className="w-5 h-5 text-sage-500 flex-shrink-0" />
                              {service}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <Link href={`/${locale}/contact?partner=${partner.slug}&type=b2b`} className="block">
                            <Button variant="primary" fullWidth>
                              {isFr ? 'Devenir partenaire' : 'Become a partner'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Certifications - from Supabase or static */}
                  {((partner.certifications && partner.certifications.length > 0) || (staticProfile?.certifications && staticProfile.certifications.length > 0)) && (
                    <div className="bg-sand-50 rounded-2xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        {isFr ? 'Certifications & Labels' : 'Certifications & Labels'}
                      </h3>
                      <div className="space-y-2">
                        {(partner.certifications || staticProfile?.certifications || []).map((cert, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckBadgeIcon className="w-5 h-5 text-terracotta-500" />
                            {cert}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Destinations Card */}
                  <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {isFr ? 'Destinations couvertes' : 'Covered Destinations'}
                    </h3>
                    <div className="space-y-3">
                      {partner.destinations.map((dest) => (
                        <Link
                          key={dest.slug}
                          href={`/${locale}/destinations/${dest.slug}`}
                          className="flex items-center justify-between p-3 bg-sand-50 rounded-lg hover:bg-sand-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <MapPinIcon className="w-5 h-5 text-terracotta-500" />
                            <span className="font-medium text-gray-900">
                              {isFr ? dest.name : dest.nameEn}
                            </span>
                          </div>
                          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Quick Contact */}
                  <div className="bg-terracotta-500 rounded-2xl p-6 text-white">
                    <h3 className="font-heading text-lg mb-3">
                      {isFr ? 'Contact direct' : 'Direct Contact'}
                    </h3>
                    <p className="text-white/80 text-sm mb-4">
                      {isFr
                        ? 'Notre équipe est à votre disposition pour discuter de vos projets.'
                        : 'Our team is available to discuss your projects.'}
                    </p>
                    <Link href={`/${locale}/contact?partner=${partner.slug}`}>
                      <Button variant="secondary" fullWidth>
                        <EnvelopeIcon className="w-5 h-5 mr-2" />
                        {isFr ? 'Nous contacter' : 'Contact us'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Fallback for partners without detailed profile data
        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-gray-600 mb-8">
                {isFr
                  ? "Le profil détaillé de ce partenaire sera bientôt disponible. Contactez-nous pour plus d'informations."
                  : 'The detailed profile of this partner will be available soon. Contact us for more information.'}
              </p>
              <Link href={`/${locale}/contact?partner=${partner.slug}`}>
                <Button variant="primary" size="lg">
                  <EnvelopeIcon className="w-5 h-5 mr-2" />
                  {isFr ? "Contacter l'agence" : 'Contact agency'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* GIR Section (if partner has GIR) */}
      {(hasDbCircuits || staticCircuits.length > 0) && (
        <section className="bg-sand-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <span className="inline-block bg-terracotta-500 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
                GIR
              </span>
              <h2 className="text-2xl md:text-3xl font-heading text-gray-900 mb-4">
                {isFr ? 'Circuits GIR disponibles' : 'Available GIR Circuits'}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {isFr
                  ? 'Intégrez vos clients à nos départs garantis. Dates fixes, commission attractive.'
                  : 'Integrate your clients into our guaranteed departures. Fixed dates, attractive commission.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Display DB circuits if available */}
              {hasDbCircuits ? (
                girCircuitsFromDb.slice(0, 3).map((circuit) => (
                  <Link
                    key={circuit.id}
                    href={`/${locale}/gir/${circuit.slug}`}
                    className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-shadow group"
                  >
                    <div className="aspect-[16/10] relative bg-gray-100">
                      <Image
                        src={circuit.image_url || '/images/placeholder-circuit.jpg'}
                        alt={circuit.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-terracotta-500 text-white text-xs font-bold px-2 py-1 rounded">
                        GIR
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-heading text-lg text-gray-900 mb-2 group-hover:text-terracotta-600 transition-colors">
                        {circuit.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {circuit.duration_days} {isFr ? 'jours' : 'days'}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserGroupIcon className="w-4 h-4" />
                          {circuit.departures?.filter(d => d.status !== 'full').length || 0} {isFr ? 'départs' : 'departures'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                /* Fallback to static circuits */
                staticCircuits.slice(0, 3).map((circuit) => (
                  <Link
                    key={circuit.id}
                    href={`/${locale}/gir/${circuit.slug}`}
                    className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-shadow group"
                  >
                    <div className="aspect-[16/10] relative bg-gray-100">
                      <Image
                        src={circuit.images.main}
                        alt={isFr ? circuit.title.fr : circuit.title.en}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-terracotta-500 text-white text-xs font-bold px-2 py-1 rounded">
                        GIR
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-heading text-lg text-gray-900 mb-2 group-hover:text-terracotta-600 transition-colors">
                        {isFr ? circuit.title.fr : circuit.title.en}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {circuit.duration.days} {isFr ? 'jours' : 'days'}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserGroupIcon className="w-4 h-4" />
                          {circuit.departures.filter(d => d.status !== 'full').length} {isFr ? 'départs' : 'departures'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {(hasDbCircuits ? girCircuitsFromDb.length : staticCircuits.length) > 3 && (
              <div className="text-center mt-8">
                <Link href={`/${locale}/gir?partner=${partner.slug}`}>
                  <Button variant="outline" size="lg">
                    {isFr ? 'Voir tous les GIR' : 'View all GIR circuits'}
                    <ChevronRightIcon className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-deep-blue-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading text-white mb-4">
            {isFr ? `Travaillez avec ${partner.name}` : `Work with ${partner.name}`}
          </h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            {isFr
              ? "Contactez-nous pour découvrir nos conditions partenaire et commencer à programmer cette destination."
              : "Contact us to discover our partner conditions and start programming this destination."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/contact?partner=${partner.slug}`}>
              <Button variant="primary" size="lg">
                {isFr ? 'Demander un partenariat' : 'Request partnership'}
              </Button>
            </Link>
            <Link href={`/${locale}/partners`}>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-deep-blue-900">
                {isFr ? 'Voir tous les partenaires' : 'View all partners'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
