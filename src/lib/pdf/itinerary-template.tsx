/**
 * Template PDF pour l'itinéraire de circuit
 * Utilisé par les agences pour générer un PDF personnalisé avec leur logo
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Enregistrer une police personnalisée (optionnel)
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#c7a17a', // terracotta
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  headerRight: {
    textAlign: 'right',
  },
  agencyName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1e3a5f', // deep-blue
    marginBottom: 4,
  },
  agencyContact: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e3a5f',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#c7a17a',
    marginBottom: 4,
    textAlign: 'center',
  },
  destination: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#faf7f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 600,
    color: '#1f2937',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1e3a5f',
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayContainer: {
    marginBottom: 16,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#c7a17a',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: 700,
    color: '#c7a17a',
    marginRight: 8,
  },
  dayTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#1f2937',
    flex: 1,
  },
  dayDescription: {
    fontSize: 10,
    color: '#4b5563',
    lineHeight: 1.5,
    marginBottom: 6,
  },
  dayMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  dayMetaItem: {
    fontSize: 8,
    color: '#6b7280',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 10,
  },
  bullet: {
    width: 15,
    fontSize: 10,
    color: '#c7a17a',
  },
  listText: {
    flex: 1,
    fontSize: 10,
    color: '#4b5563',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  column: {
    flex: 1,
  },
  includedTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#059669', // green
    marginBottom: 8,
  },
  notIncludedTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#dc2626', // red
    marginBottom: 8,
  },
  priceBox: {
    backgroundColor: '#1e3a5f',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  priceLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#ffffff',
  },
  pricePer: {
    fontSize: 10,
    color: '#94a3b8',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  pageNumber: {
    fontSize: 8,
    color: '#9ca3af',
  },
  customNote: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 6,
    marginTop: 15,
    marginBottom: 15,
  },
  customNoteTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: '#92400e',
    marginBottom: 4,
  },
  customNoteText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.4,
  },
});

export interface ItineraryDay {
  day: number;
  title_fr: string;
  title_en: string;
  description_fr: string;
  description_en: string;
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  accommodation: string;
}

export interface CircuitPDFData {
  // Circuit info
  title: string;
  subtitle?: string;
  destination: string;
  region?: string;
  duration_days: number;
  group_size_min: number;
  group_size_max: number;
  difficulty_level: number;
  price_from: number;

  // Content
  description: string;
  itinerary: ItineraryDay[];
  included: string[];
  not_included: string[];

  // Agency info
  agency: {
    name: string;
    logo_url?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };

  // Customization
  customNote?: string;
  showPrice?: boolean;
  showCommission?: boolean;
  commission_rate?: number;

  // Departure (optional)
  departure?: {
    start_date: string;
    end_date: string;
    price: number;
    available_seats: number;
  };

  // Language
  language: 'fr' | 'en';
}

// Helper to strip HTML tags from rich text
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Helper to format date
function formatDate(dateStr: string, language: 'fr' | 'en'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Translations
const t = {
  fr: {
    duration: 'Durée',
    days: 'jours',
    groupSize: 'Taille du groupe',
    to: 'à',
    persons: 'personnes',
    difficulty: 'Difficulté',
    itinerary: 'Itinéraire détaillé',
    day: 'Jour',
    accommodation: 'Hébergement',
    meals: 'Repas',
    breakfast: 'Petit-déj',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    included: 'Inclus dans le prix',
    notIncluded: 'Non inclus',
    priceFrom: 'À partir de',
    perPerson: 'par personne',
    departure: 'Départ du',
    availableSeats: 'places disponibles',
    commission: 'Commission agence',
    note: 'Note personnalisée',
    generatedBy: 'Document généré par',
    page: 'Page',
    difficultyLevels: ['Facile', 'Modéré', 'Sportif', 'Difficile', 'Expert'],
  },
  en: {
    duration: 'Duration',
    days: 'days',
    groupSize: 'Group size',
    to: 'to',
    persons: 'people',
    difficulty: 'Difficulty',
    itinerary: 'Detailed Itinerary',
    day: 'Day',
    accommodation: 'Accommodation',
    meals: 'Meals',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    included: 'Included in price',
    notIncluded: 'Not included',
    priceFrom: 'From',
    perPerson: 'per person',
    departure: 'Departure',
    availableSeats: 'seats available',
    commission: 'Agency commission',
    note: 'Custom note',
    generatedBy: 'Document generated by',
    page: 'Page',
    difficultyLevels: ['Easy', 'Moderate', 'Active', 'Difficult', 'Expert'],
  },
};

export function ItineraryPDF({ data }: { data: CircuitPDFData }) {
  const lang = t[data.language];
  const getDayContent = (day: ItineraryDay) => ({
    title: data.language === 'fr' ? day.title_fr : day.title_en,
    description: data.language === 'fr' ? day.description_fr : day.description_en,
  });

  const getMealsText = (meals: ItineraryDay['meals']) => {
    const included = [];
    if (meals.breakfast) included.push(lang.breakfast);
    if (meals.lunch) included.push(lang.lunch);
    if (meals.dinner) included.push(lang.dinner);
    return included.join(', ') || '-';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Agency Logo */}
        <View style={styles.header}>
          {data.agency.logo_url ? (
            <Image src={data.agency.logo_url} style={styles.logo} />
          ) : (
            <Text style={styles.agencyName}>{data.agency.name}</Text>
          )}
          <View style={styles.headerRight}>
            <Text style={styles.agencyName}>{data.agency.name}</Text>
            {data.agency.email && (
              <Text style={styles.agencyContact}>{data.agency.email}</Text>
            )}
            {data.agency.phone && (
              <Text style={styles.agencyContact}>{data.agency.phone}</Text>
            )}
            {data.agency.website && (
              <Text style={styles.agencyContact}>{data.agency.website}</Text>
            )}
          </View>
        </View>

        {/* Circuit Title */}
        <Text style={styles.title}>{data.title}</Text>
        {data.subtitle && <Text style={styles.subtitle}>{data.subtitle}</Text>}
        <Text style={styles.destination}>
          {data.destination}{data.region ? ` • ${data.region}` : ''}
        </Text>

        {/* Departure Info if available */}
        {data.departure && (
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <View>
                <Text style={styles.infoLabel}>{lang.departure}</Text>
                <Text style={styles.infoValue}>
                  {formatDate(data.departure.start_date, data.language)} → {formatDate(data.departure.end_date, data.language)}
                </Text>
              </View>
              <View>
                <Text style={styles.infoLabel}>{lang.availableSeats}</Text>
                <Text style={styles.infoValue}>{data.departure.available_seats}</Text>
              </View>
              {data.showPrice && (
                <View>
                  <Text style={styles.infoLabel}>{lang.priceFrom}</Text>
                  <Text style={styles.infoValue}>{data.departure.price.toLocaleString()} €</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Trip Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.infoLabel}>{lang.duration}</Text>
              <Text style={styles.infoValue}>{data.duration_days} {lang.days}</Text>
            </View>
            <View>
              <Text style={styles.infoLabel}>{lang.groupSize}</Text>
              <Text style={styles.infoValue}>
                {data.group_size_min} {lang.to} {data.group_size_max} {lang.persons}
              </Text>
            </View>
            <View>
              <Text style={styles.infoLabel}>{lang.difficulty}</Text>
              <Text style={styles.infoValue}>
                {lang.difficultyLevels[data.difficulty_level - 1] || lang.difficultyLevels[1]}
              </Text>
            </View>
          </View>
        </View>

        {/* Custom Note */}
        {data.customNote && (
          <View style={styles.customNote}>
            <Text style={styles.customNoteTitle}>{lang.note}</Text>
            <Text style={styles.customNoteText}>{data.customNote}</Text>
          </View>
        )}

        {/* Description */}
        <Text style={styles.dayDescription}>{stripHtml(data.description)}</Text>

        {/* Itinerary */}
        <Text style={styles.sectionTitle}>{lang.itinerary}</Text>
        {data.itinerary.map((day) => {
          const content = getDayContent(day);
          return (
            <View key={day.day} style={styles.dayContainer} wrap={false}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayNumber}>{lang.day} {day.day}</Text>
                <Text style={styles.dayTitle}>{content.title}</Text>
              </View>
              <Text style={styles.dayDescription}>{stripHtml(content.description)}</Text>
              <View style={styles.dayMeta}>
                {day.accommodation && (
                  <Text style={styles.dayMetaItem}>
                    🏨 {lang.accommodation}: {day.accommodation}
                  </Text>
                )}
                <Text style={styles.dayMetaItem}>
                  🍽️ {lang.meals}: {getMealsText(day.meals)}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Included / Not Included */}
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.includedTitle}>✓ {lang.included}</Text>
            {data.included.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={styles.column}>
            <Text style={styles.notIncludedTitle}>✗ {lang.notIncluded}</Text>
            {data.not_included.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Price Box */}
        {data.showPrice && !data.departure && (
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>{lang.priceFrom}</Text>
            <Text style={styles.priceValue}>
              {data.price_from.toLocaleString()} €
              <Text style={styles.pricePer}> {lang.perPerson}</Text>
            </Text>
            {data.showCommission && data.commission_rate && (
              <Text style={styles.pricePer}>
                {lang.commission}: {data.commission_rate}%
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {lang.generatedBy} {data.agency.name} • {new Date().toLocaleDateString(data.language === 'fr' ? 'fr-FR' : 'en-US')}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `${lang.page} ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export default ItineraryPDF;
