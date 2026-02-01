// The DMC Alliance - Données des partenaires

export type PartnerTier = 'premium' | 'classic';

export type Region = 'asia' | 'africa' | 'europe' | 'americas' | 'middle-east' | 'oceania';

export interface Destination {
  name: string;
  nameEn: string;
  slug: string;
  code: string; // ISO country code
  region: Region;
}

export interface Partner {
  id: string;
  name: string;
  slug: string;
  tier: PartnerTier;
  destinations: Destination[];
  website: string;
  logo?: string;
  description: {
    fr: string;
    en: string;
    de?: string;
    nl?: string;
    es?: string;
    it?: string;
  };
  specialties: string[];
  hasGir: boolean;
  girExamples?: string[];
  contact?: {
    email?: string;
    phone?: string;
  };
}

export const partners: Partner[] = [
  // ============== ASIE ==============
  {
    id: 'horseback-adventure',
    name: 'Horseback Adventure',
    slug: 'horseback-adventure',
    tier: 'premium',
    destinations: [
      { name: 'Mongolie', nameEn: 'Mongolia', slug: 'mongolie', code: 'MN', region: 'asia' }
    ],
    website: 'https://www.voyage-mongolie.com/',
    description: {
      fr: "Spécialiste de la Mongolie depuis plus de 15 ans, Horseback Adventure propose des voyages authentiques au cœur des steppes, entre randonnées équestres et immersion nomade.",
      en: "Mongolia specialist for over 15 years, Horseback Adventure offers authentic journeys through the steppes, combining horseback riding and nomadic immersion."
    },
    specialties: ['Randonnée équestre', 'Aventure', 'Immersion nomade', 'Sur-mesure'],
    hasGir: true,
    girExamples: ['https://www.voyage-mongolie.com/circuit/entre-steppe-et-desert']
  },
  {
    id: 'kyrgyzwhat',
    name: "Kyrgyz'What ?",
    slug: 'kyrgyzwhat',
    tier: 'premium',
    destinations: [
      { name: 'Kirghizistan', nameEn: 'Kyrgyzstan', slug: 'kirghizistan', code: 'KG', region: 'asia' }
    ],
    website: 'https://www.voyagekirghizistan.com/',
    description: {
      fr: "Expert du Kirghizistan, Kyrgyz'What ? fait découvrir les montagnes célestes et la culture nomade à travers des voyages d'aventure responsables.",
      en: "Kyrgyzstan expert, Kyrgyz'What? reveals the celestial mountains and nomadic culture through responsible adventure travel."
    },
    specialties: ['Trekking', 'Aventure', 'Culture nomade', 'Yourtes'],
    hasGir: true,
    girExamples: ['https://www.voyagekirghizistan.com/circuit/merveilles-de-kirghizie']
  },
  {
    id: 'sawa-discovery',
    name: 'Sawa Discovery',
    slug: 'sawa-discovery',
    tier: 'premium',
    destinations: [
      { name: 'Thaïlande', nameEn: 'Thailand', slug: 'thailande', code: 'TH', region: 'asia' }
    ],
    website: 'https://www.voyagethailande.fr/',
    description: {
      fr: "Sawa Discovery conçoit des voyages sur-mesure en Thaïlande, alliant temples ancestraux, plages paradisiaques et rencontres authentiques.",
      en: "Sawa Discovery designs tailor-made trips to Thailand, combining ancient temples, paradise beaches and authentic encounters."
    },
    specialties: ['Sur-mesure', 'Famille', 'Culture', 'Plages'],
    hasGir: true,
    girExamples: ['https://www.voyagethailande.fr/circuit/grande-decouverte-thailande-groupe']
  },
  {
    id: 'seripheap',
    name: 'Seripheap',
    slug: 'seripheap',
    tier: 'premium',
    destinations: [
      { name: 'Cambodge', nameEn: 'Cambodia', slug: 'cambodge', code: 'KH', region: 'asia' }
    ],
    website: 'https://www.voyagecambodge.com/',
    description: {
      fr: "Seripheap ouvre les portes du Cambodge, des temples d'Angkor aux villages flottants, avec une approche responsable et humaine.",
      en: "Seripheap opens the doors to Cambodia, from Angkor temples to floating villages, with a responsible and human approach."
    },
    specialties: ['Culture', 'Temples', 'Responsable', 'Sur-mesure'],
    hasGir: false
  },
  {
    id: 'au-fil-du-japon',
    name: 'Au fil du Japon',
    slug: 'au-fil-du-japon',
    tier: 'classic',
    destinations: [
      { name: 'Japon', nameEn: 'Japan', slug: 'japon', code: 'JP', region: 'asia' }
    ],
    website: 'https://www.aufildujapon.com/',
    description: {
      fr: "Au fil du Japon invite à découvrir le pays du soleil levant hors des sentiers battus, entre tradition et modernité.",
      en: "Au fil du Japon invites you to discover Japan off the beaten path, between tradition and modernity."
    },
    specialties: ['Culture', 'Gastronomie', 'Sur-mesure', 'Ryokan'],
    hasGir: false
  },
  {
    id: 'cap-coree',
    name: 'Cap Corée',
    slug: 'cap-coree',
    tier: 'classic',
    destinations: [
      { name: 'Corée du Sud', nameEn: 'South Korea', slug: 'coree-du-sud', code: 'KR', region: 'asia' }
    ],
    website: 'https://www.capcoree.fr/',
    description: {
      fr: "Cap Corée révèle les trésors de la Corée du Sud, entre palais royaux, temples bouddhistes et dynamisme de Séoul.",
      en: "Cap Corée reveals the treasures of South Korea, from royal palaces to Buddhist temples and the dynamism of Seoul."
    },
    specialties: ['Culture', 'K-culture', 'Gastronomie', 'Sur-mesure'],
    hasGir: false
  },
  {
    id: 'azimuth',
    name: 'Azimuth Adventure Travel',
    slug: 'azimuth',
    tier: 'premium',
    destinations: [
      { name: 'Indonésie', nameEn: 'Indonesia', slug: 'indonesie', code: 'ID', region: 'asia' }
    ],
    website: 'https://www.voyageindonesie.com/',
    description: {
      fr: "Azimuth Adventure Travel explore l'Indonésie dans toute sa diversité : Bali, Java, Sumatra, Komodo et bien au-delà.",
      en: "Azimuth Adventure Travel explores Indonesia in all its diversity: Bali, Java, Sumatra, Komodo and beyond."
    },
    specialties: ['Aventure', 'Plongée', 'Culture', 'Sur-mesure', 'Multi-îles'],
    hasGir: false
  },
  {
    id: 'mai-globe',
    name: 'Mai Globe Travels',
    slug: 'mai-globe',
    tier: 'classic',
    destinations: [
      { name: 'Sri Lanka', nameEn: 'Sri Lanka', slug: 'sri-lanka', code: 'LK', region: 'asia' },
      { name: 'Vietnam', nameEn: 'Vietnam', slug: 'vietnam', code: 'VN', region: 'asia' }
    ],
    website: 'https://www.maiglobetravels.com/',
    description: {
      fr: "Mai Globe Travels fait découvrir le Sri Lanka et le Vietnam à travers des expériences authentiques et des rencontres locales.",
      en: "Mai Globe Travels reveals Sri Lanka and Vietnam through authentic experiences and local encounters."
    },
    specialties: ['Sur-mesure', 'Culture', 'Nature', 'Ayurveda'],
    hasGir: false
  },
  {
    id: 'silk-road-explorer',
    name: 'Silk Road Explorer',
    slug: 'silk-road-explorer',
    tier: 'classic',
    destinations: [
      { name: 'Ouzbékistan', nameEn: 'Uzbekistan', slug: 'ouzbekistan', code: 'UZ', region: 'asia' }
    ],
    website: 'https://www.silkroad-explorer.com/',
    description: {
      fr: "Silk Road Explorer parcourt la Route de la Soie en Ouzbékistan, de Samarcande à Boukhara, entre histoire et merveilles architecturales.",
      en: "Silk Road Explorer travels the Silk Road in Uzbekistan, from Samarkand to Bukhara, through history and architectural wonders."
    },
    specialties: ['Culture', 'Histoire', 'Architecture', 'Route de la Soie'],
    hasGir: false
  },

  // ============== AFRIQUE ==============
  {
    id: 'galago-expeditions',
    name: 'Galago Expeditions',
    slug: 'galago-expeditions',
    tier: 'premium',
    destinations: [
      { name: 'Kenya', nameEn: 'Kenya', slug: 'kenya', code: 'KE', region: 'africa' },
      { name: 'Tanzanie', nameEn: 'Tanzania', slug: 'tanzanie', code: 'TZ', region: 'africa' },
      { name: 'Ouganda', nameEn: 'Uganda', slug: 'ouganda', code: 'UG', region: 'africa' }
    ],
    website: 'https://www.voyagekenya.fr/',
    description: {
      fr: "Galago Expeditions organise des safaris authentiques au Kenya, en Tanzanie et en Ouganda, avec une expertise terrain inégalée.",
      en: "Galago Expeditions organizes authentic safaris in Kenya, Tanzania and Uganda, with unparalleled field expertise."
    },
    specialties: ['Safari', 'Grande migration', 'Gorilles', 'Photographie animalière'],
    hasGir: true
  },
  {
    id: 'detours-operator',
    name: 'Détours Opérator',
    slug: 'detours-operator',
    tier: 'premium',
    destinations: [
      { name: 'Madagascar', nameEn: 'Madagascar', slug: 'madagascar', code: 'MG', region: 'africa' },
      { name: 'Mauritanie', nameEn: 'Mauritania', slug: 'mauritanie', code: 'MR', region: 'africa' },
      { name: 'Algérie', nameEn: 'Algeria', slug: 'algerie', code: 'DZ', region: 'africa' }
    ],
    website: 'https://www.voyagemadagascar.com/',
    description: {
      fr: "Détours Opérator propose des voyages d'exception à Madagascar, en Mauritanie et en Algérie, hors des sentiers battus.",
      en: "Détours Opérator offers exceptional trips to Madagascar, Mauritania and Algeria, off the beaten track."
    },
    specialties: ['Aventure', 'Nature', 'Désert', 'Endémisme'],
    hasGir: false
  },
  {
    id: 'furaha-safaris',
    name: 'Furaha Safaris',
    slug: 'furaha-safaris',
    tier: 'classic',
    destinations: [
      { name: 'Namibie', nameEn: 'Namibia', slug: 'namibie', code: 'NA', region: 'africa' }
    ],
    website: 'https://www.furahasafaris.com/',
    description: {
      fr: "Furaha Safaris révèle les paysages grandioses de la Namibie, des dunes de Sossusvlei aux éléphants du désert.",
      en: "Furaha Safaris reveals the grandiose landscapes of Namibia, from Sossusvlei dunes to desert elephants."
    },
    specialties: ['Safari', 'Autotour', 'Désert', 'Photographie'],
    hasGir: false
  },
  {
    id: 'cheops-travel',
    name: 'Cheops Travel',
    slug: 'cheops-travel',
    tier: 'classic',
    destinations: [
      { name: 'Égypte', nameEn: 'Egypt', slug: 'egypte', code: 'EG', region: 'africa' }
    ],
    website: 'https://www.cheopstravel.com/en',
    description: {
      fr: "Cheops Travel ouvre les portes de l'Égypte antique et moderne, des pyramides aux rives du Nil.",
      en: "Cheops Travel opens the doors to ancient and modern Egypt, from the pyramids to the banks of the Nile."
    },
    specialties: ['Culture', 'Croisière Nil', 'Archéologie', 'Mer Rouge'],
    hasGir: false
  },

  // ============== MOYEN-ORIENT ==============
  {
    id: 'enjoy-jordan',
    name: 'Enjoy Jordan',
    slug: 'enjoy-jordan',
    tier: 'classic',
    destinations: [
      { name: 'Jordanie', nameEn: 'Jordan', slug: 'jordanie', code: 'JO', region: 'middle-east' }
    ],
    website: 'https://enjoy-jordan.com/?lang=fr',
    description: {
      fr: "Enjoy Jordan fait découvrir les merveilles de la Jordanie, de Petra au Wadi Rum, entre histoire et aventure.",
      en: "Enjoy Jordan reveals the wonders of Jordan, from Petra to Wadi Rum, between history and adventure."
    },
    specialties: ['Culture', 'Désert', 'Randonnée', 'Petra'],
    hasGir: false
  },

  // ============== EUROPE ==============
  {
    id: 'breathe-in-travel',
    name: 'Breathe in Travel',
    slug: 'breathe-in-travel',
    tier: 'classic',
    destinations: [
      { name: 'Albanie', nameEn: 'Albania', slug: 'albanie', code: 'AL', region: 'europe' },
      { name: 'Croatie', nameEn: 'Croatia', slug: 'croatie', code: 'HR', region: 'europe' },
      { name: 'Slovénie', nameEn: 'Slovenia', slug: 'slovenie', code: 'SI', region: 'europe' },
      { name: 'Kosovo', nameEn: 'Kosovo', slug: 'kosovo', code: 'XK', region: 'europe' },
      { name: 'Macédoine du Nord', nameEn: 'North Macedonia', slug: 'macedoine-du-nord', code: 'MK', region: 'europe' },
      { name: 'Monténégro', nameEn: 'Montenegro', slug: 'montenegro', code: 'ME', region: 'europe' },
      { name: 'Roumanie', nameEn: 'Romania', slug: 'roumanie', code: 'RO', region: 'europe' }
    ],
    website: 'https://www.breatheintravel.com/en',
    description: {
      fr: "Breathe in Travel explore les Balkans et l'Europe de l'Est, des côtes adriatiques aux montagnes des Carpates.",
      en: "Breathe in Travel explores the Balkans and Eastern Europe, from Adriatic coasts to Carpathian mountains."
    },
    specialties: ['Multi-pays', 'Nature', 'Culture', 'Roadtrip'],
    hasGir: false
  },
  {
    id: 'alainn-tours',
    name: 'Alainn Tours',
    slug: 'alainn-tours',
    tier: 'classic',
    destinations: [
      { name: 'Écosse', nameEn: 'Scotland', slug: 'ecosse', code: 'GB-SCT', region: 'europe' },
      { name: 'Irlande', nameEn: 'Ireland', slug: 'irlande', code: 'IE', region: 'europe' },
      { name: 'Pays de Galles', nameEn: 'Wales', slug: 'pays-de-galles', code: 'GB-WLS', region: 'europe' }
    ],
    website: 'https://www.alainntours.fr/',
    description: {
      fr: "Alainn Tours fait vibrer les terres celtiques : Écosse, Irlande et Pays de Galles, entre châteaux, légendes et paysages sauvages.",
      en: "Alainn Tours brings Celtic lands to life: Scotland, Ireland and Wales, among castles, legends and wild landscapes."
    },
    specialties: ['Autotour', 'Culture celtique', 'Châteaux', 'Nature'],
    hasGir: false
  },

  // ============== AMÉRIQUES ==============
  {
    id: 'morpho-evasions',
    name: 'Morpho Evasions',
    slug: 'morpho-evasions',
    tier: 'classic',
    destinations: [
      { name: 'Costa Rica', nameEn: 'Costa Rica', slug: 'costa-rica', code: 'CR', region: 'americas' }
    ],
    website: 'https://morphocostarica.com/en/',
    description: {
      fr: "Morpho Evasions dévoile la biodiversité exceptionnelle du Costa Rica, entre forêts tropicales, volcans et plages préservées.",
      en: "Morpho Evasions unveils the exceptional biodiversity of Costa Rica, from tropical forests to volcanoes and pristine beaches."
    },
    specialties: ['Écotourisme', 'Nature', 'Famille', 'Aventure douce'],
    hasGir: false
  },
  {
    id: 'pasion-andina',
    name: 'Pasión Andina',
    slug: 'pasion-andina',
    tier: 'classic',
    destinations: [
      { name: 'Pérou', nameEn: 'Peru', slug: 'perou', code: 'PE', region: 'americas' }
    ],
    website: 'https://pasionandina.com/',
    description: {
      fr: "Pasión Andina parcourt le Pérou, du Machu Picchu au lac Titicaca, entre vestiges incas et communautés andines.",
      en: "Pasión Andina travels through Peru, from Machu Picchu to Lake Titicaca, among Inca ruins and Andean communities."
    },
    specialties: ['Culture', 'Trekking', 'Histoire', 'Communautés'],
    hasGir: false
  }
];

// Helper functions
export const getPartnersByRegion = (region: Region): Partner[] => {
  return partners.filter(p => p.destinations.some(d => d.region === region));
};

export const getPartnersByTier = (tier: PartnerTier): Partner[] => {
  return partners.filter(p => p.tier === tier);
};

export const getPartnersWithGir = (): Partner[] => {
  return partners.filter(p => p.hasGir);
};

export const getAllDestinations = (): Destination[] => {
  const destinations: Destination[] = [];
  partners.forEach(p => {
    p.destinations.forEach(d => {
      if (!destinations.find(dest => dest.slug === d.slug)) {
        destinations.push(d);
      }
    });
  });
  return destinations.sort((a, b) => a.name.localeCompare(b.name));
};

export const getDestinationsByRegion = (region: Region): Destination[] => {
  return getAllDestinations().filter(d => d.region === region);
};

export const getPartnerByDestination = (destinationSlug: string): Partner | undefined => {
  return partners.find(p => p.destinations.some(d => d.slug === destinationSlug));
};

// Regions metadata
export const regions: Record<Region, { name: string; nameEn: string }> = {
  asia: { name: 'Asie', nameEn: 'Asia' },
  africa: { name: 'Afrique', nameEn: 'Africa' },
  europe: { name: 'Europe', nameEn: 'Europe' },
  americas: { name: 'Amériques', nameEn: 'Americas' },
  'middle-east': { name: 'Moyen-Orient', nameEn: 'Middle East' },
  oceania: { name: 'Océanie', nameEn: 'Oceania' }
};
