// The DMC Alliance - Données enrichies des destinations

import { type Region } from './partners';

export interface DestinationDetail {
  slug: string;
  name: string;
  nameEn: string;
  code: string;
  region: Region;
  partnerId: string;

  // SEO & Meta
  metaDescription: {
    fr: string;
    en: string;
  };

  // Hero section
  tagline: {
    fr: string;
    en: string;
  };

  // Description B2B
  description: {
    fr: string;
    en: string;
  };

  // Key facts
  highlights: {
    bestSeason: string;
    currency: string;
    language: string;
    timezone: string;
    flightTime: string; // from Paris
  };

  // Selling points for B2B
  sellingPoints: {
    fr: string[];
    en: string[];
  };

  // Target clientele
  idealFor: {
    fr: string[];
    en: string[];
  };

  // Video webinar
  webinarVideo?: {
    url: string; // YouTube/Vimeo embed URL
    title: {
      fr: string;
      en: string;
    };
    duration: string; // e.g., "45 min"
    recordedDate?: string;
  };

  // Images
  images: {
    hero: string;
    gallery: string[];
  };

  // Has GIR circuits
  hasGir: boolean;
}

export const destinationsData: DestinationDetail[] = [
  // ============== ASIE ==============
  {
    slug: 'mongolie',
    name: 'Mongolie',
    nameEn: 'Mongolia',
    code: 'MN',
    region: 'asia',
    partnerId: 'horseback-adventure',
    metaDescription: {
      fr: "Découvrez la Mongolie avec notre expert local Horseback Adventure. Circuits sur-mesure, groupes et GIR co-remplissage pour tour-opérateurs.",
      en: "Discover Mongolia with our local expert Horseback Adventure. Tailor-made circuits, groups and GIR co-filling for tour operators."
    },
    tagline: {
      fr: "L'immensité des steppes, l'authenticité nomade",
      en: "The vastness of the steppes, nomadic authenticity"
    },
    description: {
      fr: "La Mongolie offre une expérience de voyage unique, entre steppes infinies, désert de Gobi et culture nomade préservée. Notre partenaire Horseback Adventure, implanté depuis plus de 15 ans, propose une expertise terrain incomparable pour des voyages authentiques.\n\nIdéale pour les voyageurs en quête d'aventure et d'immersion culturelle, la Mongolie se prête particulièrement bien aux randonnées équestres, aux séjours chez l'habitant en yourte et aux circuits d'observation de la faune sauvage.",
      en: "Mongolia offers a unique travel experience, between infinite steppes, the Gobi desert and preserved nomadic culture. Our partner Horseback Adventure, established for over 15 years, offers unparalleled field expertise for authentic journeys.\n\nIdeal for travelers seeking adventure and cultural immersion, Mongolia is particularly suited to horseback riding, homestays in yurts and wildlife observation circuits."
    },
    highlights: {
      bestSeason: "Juin - Septembre",
      currency: "Tugrik (MNT)",
      language: "Mongol",
      timezone: "UTC+8",
      flightTime: "10h (via escale)"
    },
    sellingPoints: {
      fr: [
        "Destination authentique et préservée du tourisme de masse",
        "Expertise équestre unique - randonnées à cheval de 3 à 21 jours",
        "Immersion totale chez les familles nomades",
        "Festival du Naadam (juillet) - événement majeur",
        "Circuits GIR disponibles avec dates garanties"
      ],
      en: [
        "Authentic destination preserved from mass tourism",
        "Unique equestrian expertise - horseback riding from 3 to 21 days",
        "Total immersion with nomadic families",
        "Naadam Festival (July) - major event",
        "GIR circuits available with guaranteed dates"
      ]
    },
    idealFor: {
      fr: ["Aventuriers", "Cavaliers", "Photographes", "Familles aventure", "Groupes incentive"],
      en: ["Adventurers", "Horse riders", "Photographers", "Adventure families", "Incentive groups"]
    },
    webinarVideo: {
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
      title: {
        fr: "Webinaire : Vendre la Mongolie à vos clients",
        en: "Webinar: Selling Mongolia to your clients"
      },
      duration: "45 min",
      recordedDate: "2024-03"
    },
    images: {
      hero: "/images/destinations/mongolie.jpg",
      gallery: [
        "/images/destinations/mongolie/steppes.jpg",
        "/images/destinations/mongolie/yourte.jpg",
        "/images/destinations/mongolie/chevaux.jpg",
        "/images/destinations/mongolie/gobi.jpg"
      ]
    },
    hasGir: true
  },
  {
    slug: 'kirghizistan',
    name: 'Kirghizistan',
    nameEn: 'Kyrgyzstan',
    code: 'KG',
    region: 'asia',
    partnerId: 'kyrgyzwhat',
    metaDescription: {
      fr: "Découvrez le Kirghizistan avec Kyrgyz'What. Trekking, culture nomade et montagnes célestes pour tour-opérateurs et agences.",
      en: "Discover Kyrgyzstan with Kyrgyz'What. Trekking, nomadic culture and celestial mountains for tour operators and agencies."
    },
    tagline: {
      fr: "Les montagnes célestes, terre de nomades",
      en: "Celestial mountains, land of nomads"
    },
    description: {
      fr: "Le Kirghizistan, joyau méconnu d'Asie Centrale, dévoile des paysages montagneux spectaculaires et une culture nomade vivante. Notre partenaire Kyrgyz'What ? est spécialisé dans les voyages d'aventure responsables.\n\nAvec ses lacs d'altitude, ses cols vertigineux et ses yourtes traditionnelles, le Kirghizistan séduit les amateurs de trekking et de rencontres authentiques. Une destination émergente à fort potentiel.",
      en: "Kyrgyzstan, a hidden gem of Central Asia, reveals spectacular mountain landscapes and a living nomadic culture. Our partner Kyrgyz'What? specializes in responsible adventure travel.\n\nWith its high-altitude lakes, dizzying passes and traditional yurts, Kyrgyzstan appeals to trekking enthusiasts and those seeking authentic encounters. An emerging destination with high potential."
    },
    highlights: {
      bestSeason: "Juin - Septembre",
      currency: "Som (KGS)",
      language: "Kirghize, Russe",
      timezone: "UTC+6",
      flightTime: "8h (via escale)"
    },
    sellingPoints: {
      fr: [
        "Alternative économique à la Mongolie",
        "Trekkings spectaculaires (Song-Kul, Ala-Kul)",
        "Culture nomade authentique et préservée",
        "Rapport qualité-prix excellent",
        "Destination tendance en forte croissance"
      ],
      en: [
        "Economic alternative to Mongolia",
        "Spectacular treks (Song-Kul, Ala-Kul)",
        "Authentic and preserved nomadic culture",
        "Excellent value for money",
        "Trending destination with strong growth"
      ]
    },
    idealFor: {
      fr: ["Trekkeurs", "Aventuriers", "Photographes nature", "Voyageurs responsables"],
      en: ["Trekkers", "Adventurers", "Nature photographers", "Responsible travelers"]
    },
    webinarVideo: {
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      title: {
        fr: "Webinaire : Le Kirghizistan, nouvelle destination tendance",
        en: "Webinar: Kyrgyzstan, new trending destination"
      },
      duration: "40 min",
      recordedDate: "2024-02"
    },
    images: {
      hero: "/images/destinations/kirghizistan.jpg",
      gallery: [
        "/images/destinations/kirghizistan/song-kul.jpg",
        "/images/destinations/kirghizistan/yourtes.jpg",
        "/images/destinations/kirghizistan/chevaux.jpg"
      ]
    },
    hasGir: true
  },
  {
    slug: 'thailande',
    name: 'Thaïlande',
    nameEn: 'Thailand',
    code: 'TH',
    region: 'asia',
    partnerId: 'sawa-discovery',
    metaDescription: {
      fr: "Découvrez la Thaïlande avec Sawa Discovery. Circuits sur-mesure, combinés plage et culture pour tour-opérateurs.",
      en: "Discover Thailand with Sawa Discovery. Tailor-made circuits, beach and culture combos for tour operators."
    },
    tagline: {
      fr: "Entre temples dorés et plages de rêve",
      en: "Between golden temples and dream beaches"
    },
    description: {
      fr: "La Thaïlande reste une valeur sûre du tourisme en Asie du Sud-Est, combinant richesse culturelle, plages paradisiaques et infrastructure touristique de qualité. Sawa Discovery conçoit des voyages sur-mesure qui sortent des sentiers battus.\n\nDu nord montagneux aux îles du sud, en passant par Bangkok et les sites historiques, la Thaïlande offre une diversité d'expériences adaptée à tous les profils de voyageurs.",
      en: "Thailand remains a safe bet for tourism in Southeast Asia, combining cultural richness, paradise beaches and quality tourist infrastructure. Sawa Discovery designs tailor-made trips that go off the beaten track.\n\nFrom the mountainous north to the southern islands, via Bangkok and historical sites, Thailand offers a diversity of experiences suited to all traveler profiles."
    },
    highlights: {
      bestSeason: "Novembre - Mars",
      currency: "Baht (THB)",
      language: "Thaï",
      timezone: "UTC+7",
      flightTime: "11h direct"
    },
    sellingPoints: {
      fr: [
        "Destination familiale par excellence",
        "Excellent rapport qualité-prix",
        "Infrastructure touristique développée",
        "Combinés plage + culture faciles",
        "Gastronomie réputée mondialement"
      ],
      en: [
        "Ultimate family destination",
        "Excellent value for money",
        "Developed tourist infrastructure",
        "Easy beach + culture combos",
        "World-renowned gastronomy"
      ]
    },
    idealFor: {
      fr: ["Familles", "Couples", "Groupes seniors", "Incentive", "Premier voyage Asie"],
      en: ["Families", "Couples", "Senior groups", "Incentive", "First trip to Asia"]
    },
    webinarVideo: {
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      title: {
        fr: "Webinaire : Thaïlande, les nouveautés 2024",
        en: "Webinar: Thailand, what's new in 2024"
      },
      duration: "50 min"
    },
    images: {
      hero: "/images/destinations/thailande.jpg",
      gallery: []
    },
    hasGir: true
  },
  {
    slug: 'cambodge',
    name: 'Cambodge',
    nameEn: 'Cambodia',
    code: 'KH',
    region: 'asia',
    partnerId: 'seripheap',
    metaDescription: {
      fr: "Découvrez le Cambodge avec Seripheap. Temples d'Angkor, culture khmère et tourisme responsable pour professionnels du voyage.",
      en: "Discover Cambodia with Seripheap. Angkor temples, Khmer culture and responsible tourism for travel professionals."
    },
    tagline: {
      fr: "L'héritage khmer, entre temples et humanité",
      en: "Khmer heritage, between temples and humanity"
    },
    description: {
      fr: "Le Cambodge fascine par son patrimoine exceptionnel centré sur les temples d'Angkor et touche par la chaleur de son peuple. Seripheap propose une approche responsable et humaine du voyage.\n\nAu-delà d'Angkor, le Cambodge offre des expériences authentiques : villages flottants du Tonlé Sap, plages de Sihanoukville, jungle du Mondulkiri et rencontres avec les communautés locales.",
      en: "Cambodia fascinates with its exceptional heritage centered on the Angkor temples and touches with the warmth of its people. Seripheap offers a responsible and human approach to travel.\n\nBeyond Angkor, Cambodia offers authentic experiences: floating villages of Tonle Sap, Sihanoukville beaches, Mondulkiri jungle and encounters with local communities."
    },
    highlights: {
      bestSeason: "Novembre - Mars",
      currency: "Riel (KHR) / USD",
      language: "Khmer",
      timezone: "UTC+7",
      flightTime: "12h (via escale)"
    },
    sellingPoints: {
      fr: [
        "Angkor, site UNESCO incontournable",
        "Destination à forte dimension humaine",
        "Combiné facile avec Vietnam ou Thaïlande",
        "Budget accessible",
        "Engagement tourisme responsable"
      ],
      en: [
        "Angkor, must-see UNESCO site",
        "Destination with strong human dimension",
        "Easy combo with Vietnam or Thailand",
        "Accessible budget",
        "Commitment to responsible tourism"
      ]
    },
    idealFor: {
      fr: ["Amateurs de culture", "Photographes", "Voyageurs responsables", "Combinés Asie"],
      en: ["Culture enthusiasts", "Photographers", "Responsible travelers", "Asia combos"]
    },
    images: {
      hero: "/images/destinations/cambodge.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'japon',
    name: 'Japon',
    nameEn: 'Japan',
    code: 'JP',
    region: 'asia',
    partnerId: 'au-fil-du-japon',
    metaDescription: {
      fr: "Découvrez le Japon avec Au fil du Japon. Circuits hors des sentiers battus entre tradition et modernité.",
      en: "Discover Japan with Au fil du Japon. Off-the-beaten-track tours between tradition and modernity."
    },
    tagline: {
      fr: "Tradition et modernité, l'art de vivre nippon",
      en: "Tradition and modernity, the Japanese art of living"
    },
    description: {
      fr: "Le Japon incarne le contraste parfait entre tradition millénaire et modernité futuriste. Au fil du Japon conçoit des voyages qui révèlent l'âme profonde du pays, au-delà des circuits classiques.\n\nDes temples zen de Kyoto aux néons de Tokyo, des ryokans traditionnels aux routes de pèlerinage, chaque voyage est une immersion dans une culture unique.",
      en: "Japan embodies the perfect contrast between millennial tradition and futuristic modernity. Au fil du Japon designs trips that reveal the deep soul of the country, beyond classic circuits.\n\nFrom the Zen temples of Kyoto to the neon lights of Tokyo, from traditional ryokans to pilgrimage routes, each trip is an immersion in a unique culture."
    },
    highlights: {
      bestSeason: "Mars-Mai / Oct-Nov",
      currency: "Yen (JPY)",
      language: "Japonais",
      timezone: "UTC+9",
      flightTime: "12h direct"
    },
    sellingPoints: {
      fr: [
        "Destination premium à forte valeur ajoutée",
        "Expertise circuits hors des sentiers battus",
        "Expériences authentiques (ryokans, onsen)",
        "Saisons spectaculaires (sakura, momiji)",
        "Gastronomie d'exception"
      ],
      en: [
        "Premium destination with high added value",
        "Expertise in off-the-beaten-track circuits",
        "Authentic experiences (ryokans, onsen)",
        "Spectacular seasons (sakura, momiji)",
        "Exceptional gastronomy"
      ]
    },
    idealFor: {
      fr: ["Voyageurs exigeants", "Amateurs de gastronomie", "Culture japonaise", "Couples", "Lune de miel"],
      en: ["Discerning travelers", "Food lovers", "Japanese culture", "Couples", "Honeymoon"]
    },
    images: {
      hero: "/images/destinations/japon.jpg",
      gallery: []
    },
    hasGir: false
  },
  // ... Add more destinations following the same pattern
  {
    slug: 'kenya',
    name: 'Kenya',
    nameEn: 'Kenya',
    code: 'KE',
    region: 'africa',
    partnerId: 'galago-expeditions',
    metaDescription: {
      fr: "Safaris au Kenya avec Galago Expeditions. Grande migration, Big Five et expériences exclusives pour tour-opérateurs.",
      en: "Safaris in Kenya with Galago Expeditions. Great migration, Big Five and exclusive experiences for tour operators."
    },
    tagline: {
      fr: "Le berceau du safari, la grande migration",
      en: "The birthplace of safari, the great migration"
    },
    description: {
      fr: "Le Kenya reste la référence mondiale du safari africain. Galago Expeditions, avec son expertise terrain de plus de 20 ans, propose des safaris authentiques loin des foules.\n\nDu Masai Mara au lac Nakuru, d'Amboseli au pied du Kilimandjaro aux plages de Diani, le Kenya offre une diversité d'expériences incomparable. La grande migration (juillet-octobre) reste le spectacle nature le plus extraordinaire de la planète.",
      en: "Kenya remains the world reference for African safaris. Galago Expeditions, with over 20 years of field expertise, offers authentic safaris away from the crowds.\n\nFrom Masai Mara to Lake Nakuru, from Amboseli at the foot of Kilimanjaro to Diani beaches, Kenya offers an incomparable diversity of experiences. The great migration (July-October) remains the most extraordinary nature spectacle on the planet."
    },
    highlights: {
      bestSeason: "Juin - Octobre",
      currency: "Shilling (KES)",
      language: "Swahili, Anglais",
      timezone: "UTC+3",
      flightTime: "8h direct"
    },
    sellingPoints: {
      fr: [
        "Grande migration - spectacle unique au monde",
        "Big Five garantis",
        "Combinés safari + plage",
        "Hébergements de charme (lodges, camps)",
        "Circuits GIR disponibles"
      ],
      en: [
        "Great migration - unique spectacle in the world",
        "Guaranteed Big Five",
        "Safari + beach combos",
        "Charming accommodations (lodges, camps)",
        "GIR circuits available"
      ]
    },
    idealFor: {
      fr: ["Amateurs de safari", "Photographes animaliers", "Familles", "Lune de miel safari", "Groupes"],
      en: ["Safari enthusiasts", "Wildlife photographers", "Families", "Safari honeymoon", "Groups"]
    },
    webinarVideo: {
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      title: {
        fr: "Webinaire : Safari Kenya, conseils de pro",
        en: "Webinar: Kenya Safari, pro tips"
      },
      duration: "55 min"
    },
    images: {
      hero: "/images/destinations/kenya.jpg",
      gallery: []
    },
    hasGir: true
  },
  {
    slug: 'costa-rica',
    name: 'Costa Rica',
    nameEn: 'Costa Rica',
    code: 'CR',
    region: 'americas',
    partnerId: 'morpho-evasions',
    metaDescription: {
      fr: "Découvrez le Costa Rica avec Morpho Evasions. Écotourisme, biodiversité et aventure douce pour tour-opérateurs.",
      en: "Discover Costa Rica with Morpho Evasions. Ecotourism, biodiversity and soft adventure for tour operators."
    },
    tagline: {
      fr: "Pura Vida : nature luxuriante et aventure douce",
      en: "Pura Vida: lush nature and soft adventure"
    },
    description: {
      fr: "Le Costa Rica est devenu la référence mondiale de l'écotourisme. Morpho Evasions révèle la biodiversité exceptionnelle du pays à travers des voyages responsables.\n\nEntre volcans actifs, forêts tropicales, plages des deux océans et faune extraordinaire, le Costa Rica séduit les voyageurs en quête de nature préservée et d'aventure accessible.",
      en: "Costa Rica has become the world reference for ecotourism. Morpho Evasions reveals the country's exceptional biodiversity through responsible travel.\n\nBetween active volcanoes, tropical forests, beaches on both oceans and extraordinary wildlife, Costa Rica appeals to travelers seeking preserved nature and accessible adventure."
    },
    highlights: {
      bestSeason: "Décembre - Avril",
      currency: "Colón (CRC) / USD",
      language: "Espagnol",
      timezone: "UTC-6",
      flightTime: "11h (via escale)"
    },
    sellingPoints: {
      fr: [
        "Référence mondiale écotourisme",
        "Biodiversité exceptionnelle (5% mondiale)",
        "Destination familiale idéale",
        "Infrastructure touristique de qualité",
        "Combinés plages Caraïbes + Pacifique"
      ],
      en: [
        "World reference for ecotourism",
        "Exceptional biodiversity (5% of world)",
        "Ideal family destination",
        "Quality tourist infrastructure",
        "Caribbean + Pacific beach combos"
      ]
    },
    idealFor: {
      fr: ["Familles avec enfants", "Amoureux de nature", "Photographes", "Voyageurs responsables", "Aventure douce"],
      en: ["Families with children", "Nature lovers", "Photographers", "Responsible travelers", "Soft adventure"]
    },
    images: {
      hero: "/images/destinations/costa-rica.jpg",
      gallery: []
    },
    hasGir: false
  },
  // ============== ASIE (suite) ==============
  {
    slug: 'coree-du-sud',
    name: 'Corée du Sud',
    nameEn: 'South Korea',
    code: 'KR',
    region: 'asia',
    partnerId: 'cap-coree',
    metaDescription: {
      fr: "Découvrez la Corée du Sud avec Cap Corée. K-culture, temples et modernité pour tour-opérateurs.",
      en: "Discover South Korea with Cap Corée. K-culture, temples and modernity for tour operators."
    },
    tagline: {
      fr: "Entre tradition confucéenne et K-culture",
      en: "Between Confucian tradition and K-culture"
    },
    description: {
      fr: "La Corée du Sud fascine par son mélange unique de traditions ancestrales et d'ultra-modernité. Cap Corée révèle les trésors cachés de ce pays dynamique.\n\nDes palais de Séoul aux temples bouddhistes, des villages traditionnels aux quartiers branchés, la Corée du Sud offre une expérience culturelle intense portée par le phénomène mondial de la K-culture.",
      en: "South Korea fascinates with its unique blend of ancestral traditions and ultra-modernity. Cap Corée reveals the hidden treasures of this dynamic country.\n\nFrom Seoul's palaces to Buddhist temples, from traditional villages to trendy neighborhoods, South Korea offers an intense cultural experience driven by the global K-culture phenomenon."
    },
    highlights: {
      bestSeason: "Avril-Mai / Sept-Nov",
      currency: "Won (KRW)",
      language: "Coréen",
      timezone: "UTC+9",
      flightTime: "11h direct"
    },
    sellingPoints: {
      fr: [
        "Destination tendance portée par la K-culture",
        "Gastronomie riche et variée",
        "Patrimoine historique préservé",
        "Infrastructure moderne et efficace",
        "Saisons spectaculaires (cerisiers, automne)"
      ],
      en: [
        "Trending destination driven by K-culture",
        "Rich and varied gastronomy",
        "Preserved historical heritage",
        "Modern and efficient infrastructure",
        "Spectacular seasons (cherry blossoms, autumn)"
      ]
    },
    idealFor: {
      fr: ["Fans de K-culture", "Amateurs de gastronomie", "Voyageurs urbains", "Groupes jeunes"],
      en: ["K-culture fans", "Food lovers", "Urban travelers", "Young groups"]
    },
    images: {
      hero: "/images/destinations/coree-du-sud.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'indonesie',
    name: 'Indonésie',
    nameEn: 'Indonesia',
    code: 'ID',
    region: 'asia',
    partnerId: 'azimuth',
    metaDescription: {
      fr: "Découvrez l'Indonésie avec Azimuth Adventure Travel. Bali, Java, Komodo et archipels secrets.",
      en: "Discover Indonesia with Azimuth Adventure Travel. Bali, Java, Komodo and secret archipelagos."
    },
    tagline: {
      fr: "17 000 îles, une infinité d'aventures",
      en: "17,000 islands, infinite adventures"
    },
    description: {
      fr: "L'Indonésie, plus grand archipel du monde, offre une diversité culturelle et naturelle exceptionnelle. Azimuth Adventure Travel propose des itinéraires sur-mesure au-delà de Bali.\n\nDes temples de Java aux dragons de Komodo, des rizières de Bali aux volcans de Sumatra, chaque île révèle un visage différent de ce pays fascinant.",
      en: "Indonesia, the world's largest archipelago, offers exceptional cultural and natural diversity. Azimuth Adventure Travel offers tailor-made itineraries beyond Bali.\n\nFrom the temples of Java to the dragons of Komodo, from the rice fields of Bali to the volcanoes of Sumatra, each island reveals a different face of this fascinating country."
    },
    highlights: {
      bestSeason: "Avril - Octobre",
      currency: "Roupie (IDR)",
      language: "Indonésien",
      timezone: "UTC+7 à +9",
      flightTime: "15h (via escale)"
    },
    sellingPoints: {
      fr: [
        "Diversité exceptionnelle (îles, cultures, paysages)",
        "Bali, valeur sûre du tourisme mondial",
        "Expériences hors des sentiers battus",
        "Budget flexible (économique à luxe)",
        "Combinés multi-îles attractifs"
      ],
      en: [
        "Exceptional diversity (islands, cultures, landscapes)",
        "Bali, a safe bet in world tourism",
        "Off-the-beaten-track experiences",
        "Flexible budget (budget to luxury)",
        "Attractive multi-island combos"
      ]
    },
    idealFor: {
      fr: ["Tous types de voyageurs", "Lune de miel", "Familles", "Aventuriers", "Plongeurs"],
      en: ["All types of travelers", "Honeymoon", "Families", "Adventurers", "Divers"]
    },
    images: {
      hero: "/images/destinations/indonesie.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'sri-lanka',
    name: 'Sri Lanka',
    nameEn: 'Sri Lanka',
    code: 'LK',
    region: 'asia',
    partnerId: 'mai-globe',
    metaDescription: {
      fr: "Découvrez le Sri Lanka avec Mai Globe Travels. Temples, plages et thé pour tour-opérateurs.",
      en: "Discover Sri Lanka with Mai Globe Travels. Temples, beaches and tea for tour operators."
    },
    tagline: {
      fr: "L'île aux trésors, perle de l'océan Indien",
      en: "Treasure island, pearl of the Indian Ocean"
    },
    description: {
      fr: "Le Sri Lanka concentre une incroyable diversité sur une île compacte : temples millénaires, plantations de thé, safaris, plages paradisiaques. Mai Globe Travels révèle toutes les facettes de cette perle.\n\nFacile à parcourir, le Sri Lanka permet de combiner culture, nature et détente en un seul voyage, avec un excellent rapport qualité-prix.",
      en: "Sri Lanka concentrates incredible diversity on a compact island: ancient temples, tea plantations, safaris, paradise beaches. Mai Globe Travels reveals all facets of this pearl.\n\nEasy to travel, Sri Lanka allows you to combine culture, nature and relaxation in one trip, with excellent value for money."
    },
    highlights: {
      bestSeason: "Déc-Mars (côte ouest) / Avril-Sept (côte est)",
      currency: "Roupie (LKR)",
      language: "Cinghalais, Tamoul",
      timezone: "UTC+5:30",
      flightTime: "10h (via escale)"
    },
    sellingPoints: {
      fr: [
        "Diversité concentrée sur une petite île",
        "Sites UNESCO exceptionnels",
        "Safari éléphants et léopards",
        "Train panoramique légendaire",
        "Plages préservées"
      ],
      en: [
        "Diversity concentrated on a small island",
        "Exceptional UNESCO sites",
        "Elephant and leopard safaris",
        "Legendary panoramic train",
        "Preserved beaches"
      ]
    },
    idealFor: {
      fr: ["Familles", "Couples", "Amateurs de culture", "Photographes", "Premier voyage Asie"],
      en: ["Families", "Couples", "Culture enthusiasts", "Photographers", "First trip to Asia"]
    },
    images: {
      hero: "/images/destinations/sri-lanka.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'vietnam',
    name: 'Vietnam',
    nameEn: 'Vietnam',
    code: 'VN',
    region: 'asia',
    partnerId: 'mai-globe',
    metaDescription: {
      fr: "Découvrez le Vietnam avec Mai Globe Travels. Du nord au sud, rizières et baies légendaires.",
      en: "Discover Vietnam with Mai Globe Travels. From north to south, rice fields and legendary bays."
    },
    tagline: {
      fr: "Du delta du Mékong à la baie d'Halong",
      en: "From the Mekong Delta to Halong Bay"
    },
    description: {
      fr: "Le Vietnam séduit par sa longueur qui offre une diversité de paysages et de cultures étonnante. Mai Globe Travels propose des circuits authentiques du nord au sud.\n\nDe la majestueuse baie d'Halong aux rizières en terrasses de Sapa, des villes impériales de Hué aux marchés flottants du Mékong, le Vietnam est une terre de contrastes fascinante.",
      en: "Vietnam seduces with its length offering an amazing diversity of landscapes and cultures. Mai Globe Travels offers authentic circuits from north to south.\n\nFrom the majestic Halong Bay to the terraced rice fields of Sapa, from the imperial cities of Hue to the floating markets of the Mekong, Vietnam is a land of fascinating contrasts."
    },
    highlights: {
      bestSeason: "Oct-Avril (nord) / Déc-Avril (sud)",
      currency: "Dong (VND)",
      language: "Vietnamien",
      timezone: "UTC+7",
      flightTime: "11h direct"
    },
    sellingPoints: {
      fr: [
        "Diversité Nord-Centre-Sud exceptionnelle",
        "Gastronomie de renommée mondiale",
        "Patrimoine historique riche",
        "Excellent rapport qualité-prix",
        "Combinés régionaux faciles"
      ],
      en: [
        "Exceptional North-Center-South diversity",
        "World-renowned gastronomy",
        "Rich historical heritage",
        "Excellent value for money",
        "Easy regional combos"
      ]
    },
    idealFor: {
      fr: ["Tous publics", "Gastronomie", "Culture et histoire", "Aventure douce", "Groupes"],
      en: ["All audiences", "Gastronomy", "Culture and history", "Soft adventure", "Groups"]
    },
    images: {
      hero: "/images/destinations/vietnam.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'ouzbekistan',
    name: 'Ouzbékistan',
    nameEn: 'Uzbekistan',
    code: 'UZ',
    region: 'asia',
    partnerId: 'silk-road-explorer',
    metaDescription: {
      fr: "Découvrez l'Ouzbékistan avec Silk Road Explorer. Route de la soie et cités légendaires.",
      en: "Discover Uzbekistan with Silk Road Explorer. Silk Road and legendary cities."
    },
    tagline: {
      fr: "Sur les traces de la Route de la Soie",
      en: "In the footsteps of the Silk Road"
    },
    description: {
      fr: "L'Ouzbékistan fait revivre la magie de la Route de la Soie à travers ses cités légendaires. Silk Road Explorer révèle les trésors de Samarcande, Boukhara et Khiva.\n\nAvec ses médersas aux mosaïques turquoise, ses caravansérails et son artisanat séculaire, l'Ouzbékistan offre un voyage dans le temps unique en Asie Centrale.",
      en: "Uzbekistan revives the magic of the Silk Road through its legendary cities. Silk Road Explorer reveals the treasures of Samarkand, Bukhara and Khiva.\n\nWith its turquoise-mosaic madrasas, caravanserais and centuries-old craftsmanship, Uzbekistan offers a unique journey through time in Central Asia."
    },
    highlights: {
      bestSeason: "Avril-Juin / Sept-Oct",
      currency: "Sum (UZS)",
      language: "Ouzbek, Russe",
      timezone: "UTC+5",
      flightTime: "7h (via escale)"
    },
    sellingPoints: {
      fr: [
        "Cités légendaires de la Route de la Soie",
        "Architecture islamique exceptionnelle",
        "Destination émergente en plein essor",
        "Hospitalité légendaire",
        "Budget accessible"
      ],
      en: [
        "Legendary Silk Road cities",
        "Exceptional Islamic architecture",
        "Emerging destination on the rise",
        "Legendary hospitality",
        "Accessible budget"
      ]
    },
    idealFor: {
      fr: ["Amateurs d'histoire", "Architecture", "Photographes", "Voyages culturels"],
      en: ["History lovers", "Architecture", "Photographers", "Cultural trips"]
    },
    images: {
      hero: "/images/destinations/ouzbekistan.jpg",
      gallery: []
    },
    hasGir: false
  },
  // ============== AFRIQUE ==============
  {
    slug: 'tanzanie',
    name: 'Tanzanie',
    nameEn: 'Tanzania',
    code: 'TZ',
    region: 'africa',
    partnerId: 'galago-expeditions',
    metaDescription: {
      fr: "Safaris en Tanzanie avec Galago Expeditions. Serengeti, Ngorongoro et Zanzibar.",
      en: "Safaris in Tanzania with Galago Expeditions. Serengeti, Ngorongoro and Zanzibar."
    },
    tagline: {
      fr: "Le Serengeti, Zanzibar : l'Afrique de rêve",
      en: "Serengeti, Zanzibar: dream Africa"
    },
    description: {
      fr: "La Tanzanie incarne le safari africain par excellence avec le Serengeti et le cratère du Ngorongoro. Galago Expeditions propose des safaris authentiques complétés par les plages de Zanzibar.\n\nAvec le Kilimandjaro en toile de fond, la grande migration et l'île aux épices, la Tanzanie offre le combiné safari-plage parfait.",
      en: "Tanzania embodies the quintessential African safari with the Serengeti and Ngorongoro Crater. Galago Expeditions offers authentic safaris complemented by Zanzibar beaches.\n\nWith Kilimanjaro as a backdrop, the great migration and the spice island, Tanzania offers the perfect safari-beach combo."
    },
    highlights: {
      bestSeason: "Juin - Octobre",
      currency: "Shilling (TZS)",
      language: "Swahili, Anglais",
      timezone: "UTC+3",
      flightTime: "9h (via escale)"
    },
    sellingPoints: {
      fr: [
        "Serengeti et Ngorongoro - parcs iconiques",
        "Grande migration (décembre-juillet)",
        "Combiné safari + Zanzibar idéal",
        "Ascension du Kilimandjaro possible",
        "Circuits GIR disponibles"
      ],
      en: [
        "Serengeti and Ngorongoro - iconic parks",
        "Great migration (December-July)",
        "Ideal safari + Zanzibar combo",
        "Kilimanjaro climb possible",
        "GIR circuits available"
      ]
    },
    idealFor: {
      fr: ["Safaris premium", "Lune de miel", "Aventuriers", "Photographes", "Trekkeurs (Kili)"],
      en: ["Premium safaris", "Honeymoon", "Adventurers", "Photographers", "Trekkers (Kili)"]
    },
    images: {
      hero: "/images/destinations/tanzanie.jpg",
      gallery: []
    },
    hasGir: true
  },
  {
    slug: 'ouganda',
    name: 'Ouganda',
    nameEn: 'Uganda',
    code: 'UG',
    region: 'africa',
    partnerId: 'galago-expeditions',
    metaDescription: {
      fr: "Safaris en Ouganda avec Galago Expeditions. Gorilles des montagnes et faune sauvage.",
      en: "Safaris in Uganda with Galago Expeditions. Mountain gorillas and wildlife."
    },
    tagline: {
      fr: "La perle de l'Afrique, royaume des gorilles",
      en: "The pearl of Africa, kingdom of gorillas"
    },
    description: {
      fr: "L'Ouganda, surnommé la Perle de l'Afrique, offre une expérience unique : le trekking gorilles dans les montagnes brumeuses. Galago Expeditions organise des rencontres inoubliables.\n\nAu-delà des gorilles, l'Ouganda surprend par sa diversité : safaris classiques, chimpanzés, sources du Nil et une nature luxuriante.",
      en: "Uganda, nicknamed the Pearl of Africa, offers a unique experience: gorilla trekking in the misty mountains. Galago Expeditions organizes unforgettable encounters.\n\nBeyond gorillas, Uganda surprises with its diversity: classic safaris, chimpanzees, the sources of the Nile and lush nature."
    },
    highlights: {
      bestSeason: "Juin-Sept / Déc-Fév",
      currency: "Shilling (UGX)",
      language: "Anglais, Swahili",
      timezone: "UTC+3",
      flightTime: "10h (via escale)"
    },
    sellingPoints: {
      fr: [
        "Trekking gorilles - expérience unique",
        "Alternative économique au Rwanda",
        "Chimpanzés et primates",
        "Safaris variés (Queen Elizabeth, Murchison)",
        "Sources du Nil"
      ],
      en: [
        "Gorilla trekking - unique experience",
        "Economic alternative to Rwanda",
        "Chimpanzees and primates",
        "Varied safaris (Queen Elizabeth, Murchison)",
        "Sources of the Nile"
      ]
    },
    idealFor: {
      fr: ["Amoureux des primates", "Aventuriers", "Photographes nature", "Voyageurs responsables"],
      en: ["Primate lovers", "Adventurers", "Nature photographers", "Responsible travelers"]
    },
    images: {
      hero: "/images/destinations/ouganda.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'madagascar',
    name: 'Madagascar',
    nameEn: 'Madagascar',
    code: 'MG',
    region: 'africa',
    partnerId: 'detours-operator',
    metaDescription: {
      fr: "Découvrez Madagascar avec Détours Madagascar. Lémuriens, baobabs et paysages uniques.",
      en: "Discover Madagascar with Détours Madagascar. Lemurs, baobabs and unique landscapes."
    },
    tagline: {
      fr: "L'île continent aux espèces uniques",
      en: "The continent island with unique species"
    },
    description: {
      fr: "Madagascar, île continent isolée depuis des millions d'années, abrite une biodiversité unique au monde. Détours Madagascar révèle les trésors de ce sanctuaire naturel.\n\nDes lémuriens aux baobabs, des forêts primaires aux plages paradisiaques, Madagascar offre une aventure nature incomparable pour les voyageurs curieux.",
      en: "Madagascar, a continent island isolated for millions of years, is home to unique biodiversity. Détours Madagascar reveals the treasures of this natural sanctuary.\n\nFrom lemurs to baobabs, from primary forests to paradise beaches, Madagascar offers an incomparable nature adventure for curious travelers."
    },
    highlights: {
      bestSeason: "Avril - Novembre",
      currency: "Ariary (MGA)",
      language: "Malgache, Français",
      timezone: "UTC+3",
      flightTime: "11h direct"
    },
    sellingPoints: {
      fr: [
        "Biodiversité unique au monde (80% endémisme)",
        "Lémuriens - espèces introuvables ailleurs",
        "Allée des baobabs iconique",
        "Tsingy, paysages lunaires",
        "Plages préservées (Nosy Be)"
      ],
      en: [
        "Unique biodiversity (80% endemic)",
        "Lemurs - species found nowhere else",
        "Iconic baobab alley",
        "Tsingy, lunar landscapes",
        "Preserved beaches (Nosy Be)"
      ]
    },
    idealFor: {
      fr: ["Naturalistes", "Photographes", "Aventuriers", "Écotourisme", "Familles nature"],
      en: ["Naturalists", "Photographers", "Adventurers", "Ecotourism", "Nature families"]
    },
    images: {
      hero: "/images/destinations/madagascar.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'namibie',
    name: 'Namibie',
    nameEn: 'Namibia',
    code: 'NA',
    region: 'africa',
    partnerId: 'furaha-safaris',
    metaDescription: {
      fr: "Découvrez la Namibie avec Furaha Safaris. Déserts, safaris et paysages grandioses.",
      en: "Discover Namibia with Furaha Safaris. Deserts, safaris and grandiose landscapes."
    },
    tagline: {
      fr: "Dunes rouges et grands espaces sauvages",
      en: "Red dunes and vast wild spaces"
    },
    description: {
      fr: "La Namibie offre des paysages parmi les plus spectaculaires d'Afrique : dunes rouges de Sossusvlei, côte des Squelettes, Etosha. Furaha Safaris propose des autotours et safaris guidés.\n\nAvec ses infrastructures de qualité et sa faible densité de population, la Namibie est idéale pour les voyages en liberté et les photographes en quête de lumières uniques.",
      en: "Namibia offers some of Africa's most spectacular landscapes: red dunes of Sossusvlei, Skeleton Coast, Etosha. Furaha Safaris offers self-drive tours and guided safaris.\n\nWith its quality infrastructure and low population density, Namibia is ideal for self-drive trips and photographers seeking unique light."
    },
    highlights: {
      bestSeason: "Mai - Octobre",
      currency: "Dollar namibien (NAD)",
      language: "Anglais, Afrikaans",
      timezone: "UTC+2",
      flightTime: "12h (via escale)"
    },
    sellingPoints: {
      fr: [
        "Paysages parmi les plus photogéniques au monde",
        "Autotour facile et sécurisé",
        "Etosha, safari de qualité",
        "Hébergements de charme",
        "Faible fréquentation touristique"
      ],
      en: [
        "Some of the most photogenic landscapes in the world",
        "Easy and safe self-drive",
        "Etosha, quality safari",
        "Charming accommodations",
        "Low tourist crowds"
      ]
    },
    idealFor: {
      fr: ["Photographes", "Autotour", "Couples", "Voyageurs indépendants", "Nature sauvage"],
      en: ["Photographers", "Self-drive", "Couples", "Independent travelers", "Wild nature"]
    },
    images: {
      hero: "/images/destinations/namibie.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'egypte',
    name: 'Égypte',
    nameEn: 'Egypt',
    code: 'EG',
    region: 'africa',
    partnerId: 'cheops-travel',
    metaDescription: {
      fr: "Découvrez l'Égypte avec Cheops Travel. Pyramides, croisière sur le Nil et mer Rouge.",
      en: "Discover Egypt with Cheops Travel. Pyramids, Nile cruise and Red Sea."
    },
    tagline: {
      fr: "5000 ans d'histoire au fil du Nil",
      en: "5000 years of history along the Nile"
    },
    description: {
      fr: "L'Égypte fascine depuis toujours par son patrimoine pharaonique unique au monde. Cheops Travel propose des circuits culturels et des croisières sur le Nil combinées avec la mer Rouge.\n\nDes pyramides de Gizeh aux temples de Louxor, du Caire bouillonnant aux plages de Hurghada, l'Égypte offre un voyage à travers les millénaires.",
      en: "Egypt has always fascinated with its unique pharaonic heritage. Cheops Travel offers cultural circuits and Nile cruises combined with the Red Sea.\n\nFrom the pyramids of Giza to the temples of Luxor, from bustling Cairo to Hurghada beaches, Egypt offers a journey through millennia."
    },
    highlights: {
      bestSeason: "Oct - Avril",
      currency: "Livre égyptienne (EGP)",
      language: "Arabe",
      timezone: "UTC+2",
      flightTime: "4h30 direct"
    },
    sellingPoints: {
      fr: [
        "Patrimoine pharaonique unique au monde",
        "Croisière sur le Nil classique",
        "Combiné culture + mer Rouge",
        "Proche de l'Europe (4h30)",
        "Budget accessible"
      ],
      en: [
        "Unique pharaonic heritage in the world",
        "Classic Nile cruise",
        "Culture + Red Sea combo",
        "Close to Europe (4h30)",
        "Accessible budget"
      ]
    },
    idealFor: {
      fr: ["Amateurs d'histoire", "Familles", "Croisières", "Plongée mer Rouge", "Groupes"],
      en: ["History lovers", "Families", "Cruises", "Red Sea diving", "Groups"]
    },
    images: {
      hero: "/images/destinations/egypte.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'mauritanie',
    name: 'Mauritanie',
    nameEn: 'Mauritania',
    code: 'MR',
    region: 'africa',
    partnerId: 'detours-operator',
    metaDescription: {
      fr: "Découvrez la Mauritanie avec Détours. Désert du Sahara et culture nomade.",
      en: "Discover Mauritania with Détours. Sahara desert and nomadic culture."
    },
    tagline: {
      fr: "Le Sahara authentique, terre de nomades",
      en: "Authentic Sahara, land of nomads"
    },
    description: {
      fr: "La Mauritanie offre une immersion authentique dans le Sahara et la culture nomade. Détours propose des expéditions désert hors du temps.\n\nChinguetti, ville caravanière classée UNESCO, les dunes de l'Adrar et les campements sous les étoiles font de la Mauritanie une destination pour voyageurs en quête d'absolu.",
      en: "Mauritania offers an authentic immersion in the Sahara and nomadic culture. Détours offers timeless desert expeditions.\n\nChinguetti, a UNESCO-listed caravan city, the dunes of Adrar and camps under the stars make Mauritania a destination for travelers seeking the absolute."
    },
    highlights: {
      bestSeason: "Nov - Février",
      currency: "Ouguiya (MRU)",
      language: "Arabe, Français",
      timezone: "UTC+0",
      flightTime: "5h direct"
    },
    sellingPoints: {
      fr: [
        "Sahara authentique et préservé",
        "Chinguetti, ville UNESCO",
        "Expérience nomade vraie",
        "Nuits sous les étoiles",
        "Destination confidentielle"
      ],
      en: [
        "Authentic and preserved Sahara",
        "Chinguetti, UNESCO city",
        "True nomadic experience",
        "Nights under the stars",
        "Confidential destination"
      ]
    },
    idealFor: {
      fr: ["Aventuriers", "Amateurs de désert", "Photographes", "Voyageurs expérimentés"],
      en: ["Adventurers", "Desert lovers", "Photographers", "Experienced travelers"]
    },
    images: {
      hero: "/images/destinations/mauritanie.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'algerie',
    name: 'Algérie',
    nameEn: 'Algeria',
    code: 'DZ',
    region: 'africa',
    partnerId: 'detours-operator',
    metaDescription: {
      fr: "Découvrez l'Algérie avec Détours. Sahara, Tassili et patrimoine berbère.",
      en: "Discover Algeria with Détours. Sahara, Tassili and Berber heritage."
    },
    tagline: {
      fr: "Le plus grand Sahara, art rupestre millénaire",
      en: "The largest Sahara, millennia-old rock art"
    },
    description: {
      fr: "L'Algérie possède le plus grand territoire saharien et des trésors patrimoniaux uniques. Détours organise des expéditions dans le Tassili N'Ajjer aux peintures rupestres millénaires.\n\nDes dunes du Grand Erg aux montagnes du Hoggar, des villes romaines de Tipaza à la Casbah d'Alger, l'Algérie est une destination de caractère.",
      en: "Algeria has the largest Saharan territory and unique heritage treasures. Détours organizes expeditions in the Tassili N'Ajjer with millennia-old rock paintings.\n\nFrom the dunes of the Grand Erg to the Hoggar mountains, from the Roman cities of Tipaza to the Casbah of Algiers, Algeria is a destination of character."
    },
    highlights: {
      bestSeason: "Oct - Avril",
      currency: "Dinar (DZD)",
      language: "Arabe, Français, Berbère",
      timezone: "UTC+1",
      flightTime: "2h direct"
    },
    sellingPoints: {
      fr: [
        "Tassili N'Ajjer - art rupestre UNESCO",
        "Plus grand Sahara du monde",
        "Patrimoine romain remarquable",
        "Destination hors des radars",
        "Proche de la France (2h)"
      ],
      en: [
        "Tassili N'Ajjer - UNESCO rock art",
        "World's largest Sahara",
        "Remarkable Roman heritage",
        "Off-the-radar destination",
        "Close to France (2h)"
      ]
    },
    idealFor: {
      fr: ["Aventuriers", "Passionnés d'histoire", "Expéditions désert", "Voyageurs avertis"],
      en: ["Adventurers", "History enthusiasts", "Desert expeditions", "Savvy travelers"]
    },
    images: {
      hero: "/images/destinations/algerie.jpg",
      gallery: []
    },
    hasGir: false
  },
  // ============== MOYEN-ORIENT ==============
  {
    slug: 'jordanie',
    name: 'Jordanie',
    nameEn: 'Jordan',
    code: 'JO',
    region: 'middle-east',
    partnerId: 'enjoy-jordan',
    metaDescription: {
      fr: "Découvrez la Jordanie avec Enjoy Jordan. Petra, Wadi Rum et mer Morte.",
      en: "Discover Jordan with Enjoy Jordan. Petra, Wadi Rum and Dead Sea."
    },
    tagline: {
      fr: "Petra, merveille du monde au cœur du désert",
      en: "Petra, wonder of the world in the heart of the desert"
    },
    description: {
      fr: "La Jordanie concentre des trésors uniques sur un petit territoire : Petra, le Wadi Rum, la mer Morte. Enjoy Jordan révèle l'hospitalité légendaire du royaume hachémite.\n\nFacile d'accès et sûre, la Jordanie combine patrimoine antique, déserts spectaculaires et expériences bien-être dans un circuit compact et intense.",
      en: "Jordan concentrates unique treasures in a small territory: Petra, Wadi Rum, the Dead Sea. Enjoy Jordan reveals the legendary hospitality of the Hashemite kingdom.\n\nEasy to access and safe, Jordan combines ancient heritage, spectacular deserts and wellness experiences in a compact and intense circuit."
    },
    highlights: {
      bestSeason: "Mars - Mai / Sept - Nov",
      currency: "Dinar (JOD)",
      language: "Arabe, Anglais",
      timezone: "UTC+2",
      flightTime: "4h30 direct"
    },
    sellingPoints: {
      fr: [
        "Petra - merveille du monde",
        "Wadi Rum - désert lunaire",
        "Mer Morte - expérience unique",
        "Destination sûre et stable",
        "Circuit compact (7-10 jours idéal)"
      ],
      en: [
        "Petra - wonder of the world",
        "Wadi Rum - lunar desert",
        "Dead Sea - unique experience",
        "Safe and stable destination",
        "Compact circuit (7-10 days ideal)"
      ]
    },
    idealFor: {
      fr: ["Tous publics", "Familles", "Couples", "Photographes", "Court séjour"],
      en: ["All audiences", "Families", "Couples", "Photographers", "Short stay"]
    },
    images: {
      hero: "/images/destinations/jordanie.jpg",
      gallery: []
    },
    hasGir: false
  },
  // ============== EUROPE ==============
  {
    slug: 'albanie',
    name: 'Albanie',
    nameEn: 'Albania',
    code: 'AL',
    region: 'europe',
    partnerId: 'breathe-in-travel',
    metaDescription: {
      fr: "Découvrez l'Albanie avec Breathe in Travel. Balkans authentiques et riviera secrète.",
      en: "Discover Albania with Breathe in Travel. Authentic Balkans and secret riviera."
    },
    tagline: {
      fr: "Le secret des Balkans, riviera préservée",
      en: "The Balkans' secret, preserved riviera"
    },
    description: {
      fr: "L'Albanie est la destination émergente des Balkans, offrant authenticité et prix doux. Breathe in Travel révèle les trésors cachés de ce pays longtemps fermé.\n\nEntre riviera albanaise, sites UNESCO de Berat et Gjirokastër, montagnes sauvages et hospitalité chaleureuse, l'Albanie séduit les voyageurs curieux.",
      en: "Albania is the emerging destination of the Balkans, offering authenticity and affordable prices. Breathe in Travel reveals the hidden treasures of this long-closed country.\n\nBetween the Albanian riviera, UNESCO sites of Berat and Gjirokastër, wild mountains and warm hospitality, Albania seduces curious travelers."
    },
    highlights: {
      bestSeason: "Mai - Septembre",
      currency: "Lek (ALL)",
      language: "Albanais",
      timezone: "UTC+1",
      flightTime: "2h30 direct"
    },
    sellingPoints: {
      fr: [
        "Destination tendance et abordable",
        "Sites UNESCO méconnus",
        "Plages préservées",
        "Gastronomie méditerranéenne",
        "Proche de la France"
      ],
      en: [
        "Trendy and affordable destination",
        "Unknown UNESCO sites",
        "Preserved beaches",
        "Mediterranean gastronomy",
        "Close to France"
      ]
    },
    idealFor: {
      fr: ["Découvreurs", "Petits budgets", "Road-trip", "Plages secrètes", "Culture"],
      en: ["Discoverers", "Budget travelers", "Road trip", "Secret beaches", "Culture"]
    },
    images: {
      hero: "/images/destinations/albanie.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'croatie',
    name: 'Croatie',
    nameEn: 'Croatia',
    code: 'HR',
    region: 'europe',
    partnerId: 'breathe-in-travel',
    metaDescription: {
      fr: "Découvrez la Croatie avec Breathe in Travel. Dubrovnik, îles et parcs nationaux.",
      en: "Discover Croatia with Breathe in Travel. Dubrovnik, islands and national parks."
    },
    tagline: {
      fr: "Mille îles, cités vénitiennes et nature préservée",
      en: "Thousand islands, Venetian cities and preserved nature"
    },
    description: {
      fr: "La Croatie séduit par son littoral adriatique exceptionnel et ses villes chargées d'histoire. Breathe in Travel propose des itinéraires entre mer et parcs nationaux.\n\nDe Dubrovnik la majestueuse aux lacs de Plitvice, des îles dalmates à l'Istrie gourmande, la Croatie offre une diversité remarquable sur une courte distance.",
      en: "Croatia seduces with its exceptional Adriatic coastline and history-laden cities. Breathe in Travel offers itineraries between sea and national parks.\n\nFrom majestic Dubrovnik to Plitvice Lakes, from Dalmatian islands to gourmet Istria, Croatia offers remarkable diversity over short distances."
    },
    highlights: {
      bestSeason: "Mai - Septembre",
      currency: "Euro (EUR)",
      language: "Croate",
      timezone: "UTC+1",
      flightTime: "2h direct"
    },
    sellingPoints: {
      fr: [
        "Dubrovnik et patrimoine vénitien",
        "Plus de 1000 îles",
        "Parcs nationaux spectaculaires",
        "Gastronomie et vins",
        "Zone euro, proche"
      ],
      en: [
        "Dubrovnik and Venetian heritage",
        "Over 1000 islands",
        "Spectacular national parks",
        "Gastronomy and wines",
        "Eurozone, nearby"
      ]
    },
    idealFor: {
      fr: ["Croisières îles", "Familles", "Couples", "Road-trip", "Gastronomie"],
      en: ["Island cruises", "Families", "Couples", "Road trip", "Gastronomy"]
    },
    images: {
      hero: "/images/destinations/croatie.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'slovenie',
    name: 'Slovénie',
    nameEn: 'Slovenia',
    code: 'SI',
    region: 'europe',
    partnerId: 'breathe-in-travel',
    metaDescription: {
      fr: "Découvrez la Slovénie avec Breathe in Travel. Bled, grottes et nature alpine.",
      en: "Discover Slovenia with Breathe in Travel. Bled, caves and alpine nature."
    },
    tagline: {
      fr: "Petit pays, grande nature alpine",
      en: "Small country, great alpine nature"
    },
    description: {
      fr: "La Slovénie est un concentré de nature et de charme sur un petit territoire. Breathe in Travel révèle les merveilles de ce pays éco-responsable.\n\nDu lac de Bled aux grottes de Postojna, de Ljubljana la verte aux Alpes juliennes, la Slovénie est parfaite pour un voyage court mais intense.",
      en: "Slovenia is a concentrate of nature and charm on a small territory. Breathe in Travel reveals the wonders of this eco-responsible country.\n\nFrom Lake Bled to Postojna caves, from green Ljubljana to the Julian Alps, Slovenia is perfect for a short but intense trip."
    },
    highlights: {
      bestSeason: "Mai - Septembre",
      currency: "Euro (EUR)",
      language: "Slovène",
      timezone: "UTC+1",
      flightTime: "1h30 direct"
    },
    sellingPoints: {
      fr: [
        "Destination verte par excellence",
        "Lac de Bled iconique",
        "Grottes spectaculaires",
        "Ljubljana, capitale durable",
        "Compact et accessible"
      ],
      en: [
        "Green destination par excellence",
        "Iconic Lake Bled",
        "Spectacular caves",
        "Ljubljana, sustainable capital",
        "Compact and accessible"
      ]
    },
    idealFor: {
      fr: ["Nature", "Court séjour", "Familles", "Actif doux", "Écotourisme"],
      en: ["Nature", "Short stay", "Families", "Soft active", "Ecotourism"]
    },
    images: {
      hero: "/images/destinations/slovenie.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'ecosse',
    name: 'Écosse',
    nameEn: 'Scotland',
    code: 'GB-SCT',
    region: 'europe',
    partnerId: 'alainn-tours',
    metaDescription: {
      fr: "Découvrez l'Écosse avec Alainn Tours. Highlands, châteaux et whisky.",
      en: "Discover Scotland with Alainn Tours. Highlands, castles and whisky."
    },
    tagline: {
      fr: "Highlands sauvages, légendes et whisky",
      en: "Wild Highlands, legends and whisky"
    },
    description: {
      fr: "L'Écosse incarne le romantisme sauvage avec ses Highlands brumeux, ses châteaux hantés et ses whiskies légendaires. Alainn Tours propose des circuits authentiques en terre celte.\n\nDes lochs mystérieux aux îles Hébrides, d'Édimbourg la majestueuse aux distilleries du Speyside, l'Écosse offre une expérience intense.",
      en: "Scotland embodies wild romanticism with its misty Highlands, haunted castles and legendary whiskies. Alainn Tours offers authentic tours in Celtic land.\n\nFrom mysterious lochs to the Hebrides islands, from majestic Edinburgh to Speyside distilleries, Scotland offers an intense experience."
    },
    highlights: {
      bestSeason: "Mai - Septembre",
      currency: "Livre sterling (GBP)",
      language: "Anglais, Gaélique",
      timezone: "UTC+0",
      flightTime: "1h30 direct"
    },
    sellingPoints: {
      fr: [
        "Paysages iconiques des Highlands",
        "Route du whisky",
        "Châteaux et histoire",
        "Îles sauvages (Skye, Hébrides)",
        "Festivals (Édimbourg)"
      ],
      en: [
        "Iconic Highland landscapes",
        "Whisky trail",
        "Castles and history",
        "Wild islands (Skye, Hebrides)",
        "Festivals (Edinburgh)"
      ]
    },
    idealFor: {
      fr: ["Road-trip", "Amateurs de whisky", "Randonnée", "Histoire", "Photographes"],
      en: ["Road trip", "Whisky lovers", "Hiking", "History", "Photographers"]
    },
    images: {
      hero: "/images/destinations/ecosse.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'irlande',
    name: 'Irlande',
    nameEn: 'Ireland',
    code: 'IE',
    region: 'europe',
    partnerId: 'alainn-tours',
    metaDescription: {
      fr: "Découvrez l'Irlande avec Alainn Tours. Wild Atlantic Way et pubs authentiques.",
      en: "Discover Ireland with Alainn Tours. Wild Atlantic Way and authentic pubs."
    },
    tagline: {
      fr: "L'île émeraude, falaises et convivialité",
      en: "The emerald isle, cliffs and conviviality"
    },
    description: {
      fr: "L'Irlande séduit par ses paysages verdoyants, ses falaises spectaculaires et l'accueil chaleureux de ses habitants. Alainn Tours révèle l'âme celtique de l'île émeraude.\n\nDu Ring of Kerry au Wild Atlantic Way, des pubs de Dublin aux îles d'Aran, l'Irlande offre une escapade dépaysante à deux heures de Paris.",
      en: "Ireland seduces with its green landscapes, spectacular cliffs and the warm welcome of its inhabitants. Alainn Tours reveals the Celtic soul of the emerald isle.\n\nFrom the Ring of Kerry to the Wild Atlantic Way, from Dublin's pubs to the Aran Islands, Ireland offers an exotic getaway just two hours from Paris."
    },
    highlights: {
      bestSeason: "Mai - Septembre",
      currency: "Euro (EUR)",
      language: "Anglais, Gaélique",
      timezone: "UTC+0",
      flightTime: "1h30 direct"
    },
    sellingPoints: {
      fr: [
        "Wild Atlantic Way spectaculaire",
        "Culture des pubs authentique",
        "Paysages d'un vert intense",
        "Sites préhistoriques",
        "Très accessible depuis la France"
      ],
      en: [
        "Spectacular Wild Atlantic Way",
        "Authentic pub culture",
        "Intensely green landscapes",
        "Prehistoric sites",
        "Very accessible from France"
      ]
    },
    idealFor: {
      fr: ["Road-trip", "Familles", "Randonnée", "Culture celtique", "Court séjour"],
      en: ["Road trip", "Families", "Hiking", "Celtic culture", "Short stay"]
    },
    images: {
      hero: "/images/destinations/irlande.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'kosovo',
    name: 'Kosovo',
    nameEn: 'Kosovo',
    code: 'XK',
    region: 'europe',
    partnerId: 'breathe-in-travel',
    metaDescription: {
      fr: "Découvrez le Kosovo avec Breathe in Travel. Monastères médiévaux et hospitalité balkanique.",
      en: "Discover Kosovo with Breathe in Travel. Medieval monasteries and Balkan hospitality."
    },
    tagline: {
      fr: "Le cœur caché des Balkans",
      en: "The hidden heart of the Balkans"
    },
    description: {
      fr: "Le Kosovo, plus jeune État d'Europe, offre une authenticité rare et une hospitalité légendaire. Breathe in Travel vous fait découvrir ce territoire méconnu aux influences ottomanes et orthodoxes.\n\nDes monastères médiévaux classés UNESCO de Peja et Prizren aux marchés animés de Pristina, le Kosovo surprend par sa richesse culturelle et la générosité de ses habitants.",
      en: "Kosovo, Europe's youngest state, offers rare authenticity and legendary hospitality. Breathe in Travel takes you to discover this little-known territory with Ottoman and Orthodox influences.\n\nFrom the UNESCO medieval monasteries of Peja and Prizren to the lively markets of Pristina, Kosovo surprises with its cultural richness and the generosity of its people."
    },
    highlights: {
      bestSeason: "Mai - Septembre",
      currency: "Euro (EUR)",
      language: "Albanais, Serbe",
      timezone: "UTC+1",
      flightTime: "2h30 (via escale)"
    },
    sellingPoints: {
      fr: [
        "Destination vierge du tourisme de masse",
        "Monastères UNESCO remarquables",
        "Hospitalité balkanique authentique",
        "Budget très accessible",
        "Combiné facile avec Albanie/Macédoine"
      ],
      en: [
        "Destination untouched by mass tourism",
        "Remarkable UNESCO monasteries",
        "Authentic Balkan hospitality",
        "Very accessible budget",
        "Easy combo with Albania/Macedonia"
      ]
    },
    idealFor: {
      fr: ["Explorateurs", "Histoire et culture", "Petits budgets", "Voyageurs curieux"],
      en: ["Explorers", "History and culture", "Budget travelers", "Curious travelers"]
    },
    images: {
      hero: "/images/destinations/kosovo.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'macedoine-du-nord',
    name: 'Macédoine du Nord',
    nameEn: 'North Macedonia',
    code: 'MK',
    region: 'europe',
    partnerId: 'breathe-in-travel',
    metaDescription: {
      fr: "Découvrez la Macédoine du Nord avec Breathe in Travel. Lac d'Ohrid et patrimoine byzantin.",
      en: "Discover North Macedonia with Breathe in Travel. Lake Ohrid and Byzantine heritage."
    },
    tagline: {
      fr: "Le lac d'Ohrid, joyau des Balkans",
      en: "Lake Ohrid, jewel of the Balkans"
    },
    description: {
      fr: "La Macédoine du Nord dévoile des trésors insoupçonnés entre lac d'Ohrid millénaire et vestiges byzantins. Breathe in Travel révèle l'âme de ce pays au carrefour des civilisations.\n\nDu lac d'Ohrid, l'un des plus anciens au monde, aux monastères perchés et aux bazars ottomans de Skopje, la Macédoine du Nord offre un voyage hors du temps.",
      en: "North Macedonia reveals unsuspected treasures between the millennial Lake Ohrid and Byzantine remains. Breathe in Travel reveals the soul of this country at the crossroads of civilizations.\n\nFrom Lake Ohrid, one of the oldest in the world, to perched monasteries and Ottoman bazaars of Skopje, North Macedonia offers a timeless journey."
    },
    highlights: {
      bestSeason: "Mai - Septembre",
      currency: "Denar (MKD)",
      language: "Macédonien",
      timezone: "UTC+1",
      flightTime: "2h30 (via escale)"
    },
    sellingPoints: {
      fr: [
        "Lac d'Ohrid - site UNESCO exceptionnel",
        "Patrimoine byzantin et ottoman",
        "Destination abordable",
        "Nature préservée et randonnées",
        "Gastronomie balkanique"
      ],
      en: [
        "Lake Ohrid - exceptional UNESCO site",
        "Byzantine and Ottoman heritage",
        "Affordable destination",
        "Preserved nature and hiking",
        "Balkan gastronomy"
      ]
    },
    idealFor: {
      fr: ["Culture et histoire", "Nature", "Petits budgets", "Randonnée", "Hors des sentiers battus"],
      en: ["Culture and history", "Nature", "Budget travelers", "Hiking", "Off the beaten track"]
    },
    images: {
      hero: "/images/destinations/macedoine-du-nord.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'montenegro',
    name: 'Monténégro',
    nameEn: 'Montenegro',
    code: 'ME',
    region: 'europe',
    partnerId: 'breathe-in-travel',
    metaDescription: {
      fr: "Découvrez le Monténégro avec Breathe in Travel. Baie de Kotor et montagnes sauvages.",
      en: "Discover Montenegro with Breathe in Travel. Bay of Kotor and wild mountains."
    },
    tagline: {
      fr: "Fjords méditerranéens et montagnes sauvages",
      en: "Mediterranean fjords and wild mountains"
    },
    description: {
      fr: "Le Monténégro concentre une diversité spectaculaire sur un petit territoire. Breathe in Travel vous emmène des bouches de Kotor aux parcs nationaux sauvages.\n\nEntre la baie de Kotor aux allures de fjord, les plages de Budva, le lac de Skadar et les montagnes du Durmitor, le Monténégro offre mer et montagne en un voyage.",
      en: "Montenegro concentrates spectacular diversity in a small territory. Breathe in Travel takes you from the Bay of Kotor to wild national parks.\n\nBetween the fjord-like Bay of Kotor, the beaches of Budva, Lake Skadar and the Durmitor mountains, Montenegro offers sea and mountain in one trip."
    },
    highlights: {
      bestSeason: "Mai - Septembre",
      currency: "Euro (EUR)",
      language: "Monténégrin",
      timezone: "UTC+1",
      flightTime: "2h direct"
    },
    sellingPoints: {
      fr: [
        "Baie de Kotor - UNESCO spectaculaire",
        "Parcs nationaux préservés",
        "Littoral adriatique sublime",
        "Compact mais très varié",
        "Zone euro, proche"
      ],
      en: [
        "Bay of Kotor - spectacular UNESCO",
        "Preserved national parks",
        "Sublime Adriatic coastline",
        "Compact but very varied",
        "Eurozone, nearby"
      ]
    },
    idealFor: {
      fr: ["Road-trip", "Plage et montagne", "Familles", "Courts séjours", "Randonnée"],
      en: ["Road trip", "Beach and mountain", "Families", "Short stays", "Hiking"]
    },
    images: {
      hero: "/images/destinations/montenegro.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'roumanie',
    name: 'Roumanie',
    nameEn: 'Romania',
    code: 'RO',
    region: 'europe',
    partnerId: 'breathe-in-travel',
    metaDescription: {
      fr: "Découvrez la Roumanie avec Breathe in Travel. Transylvanie, châteaux et traditions vivantes.",
      en: "Discover Romania with Breathe in Travel. Transylvania, castles and living traditions."
    },
    tagline: {
      fr: "Transylvanie mystérieuse et traditions vivantes",
      en: "Mysterious Transylvania and living traditions"
    },
    description: {
      fr: "La Roumanie fascine par ses paysages préservés et ses traditions encore vivantes. Breathe in Travel révèle la magie de la Transylvanie et des Carpates.\n\nDes châteaux légendaires de Dracula aux villages saxons classés UNESCO, des monastères peints de Bucovine aux Carpates sauvages, la Roumanie offre un voyage dans le temps.",
      en: "Romania fascinates with its preserved landscapes and still-living traditions. Breathe in Travel reveals the magic of Transylvania and the Carpathians.\n\nFrom the legendary castles of Dracula to UNESCO Saxon villages, from painted monasteries of Bucovina to wild Carpathians, Romania offers a journey through time."
    },
    highlights: {
      bestSeason: "Mai - Septembre",
      currency: "Leu (RON)",
      language: "Roumain",
      timezone: "UTC+2",
      flightTime: "2h30 direct"
    },
    sellingPoints: {
      fr: [
        "Transylvanie et légende de Dracula",
        "Villages saxons UNESCO",
        "Monastères peints de Bucovine",
        "Nature sauvage des Carpates",
        "Budget très accessible"
      ],
      en: [
        "Transylvania and Dracula legend",
        "UNESCO Saxon villages",
        "Painted monasteries of Bucovina",
        "Wild Carpathian nature",
        "Very accessible budget"
      ]
    },
    idealFor: {
      fr: ["Culture et histoire", "Nature", "Road-trip", "Randonnée", "Familles"],
      en: ["Culture and history", "Nature", "Road trip", "Hiking", "Families"]
    },
    images: {
      hero: "/images/destinations/roumanie.jpg",
      gallery: []
    },
    hasGir: false
  },
  {
    slug: 'pays-de-galles',
    name: 'Pays de Galles',
    nameEn: 'Wales',
    code: 'GB-WLS',
    region: 'europe',
    partnerId: 'alainn-tours',
    metaDescription: {
      fr: "Découvrez le Pays de Galles avec Alainn Tours. Châteaux, côtes sauvages et culture celtique.",
      en: "Discover Wales with Alainn Tours. Castles, wild coasts and Celtic culture."
    },
    tagline: {
      fr: "Terre de châteaux et de légendes celtiques",
      en: "Land of castles and Celtic legends"
    },
    description: {
      fr: "Le Pays de Galles enchante par ses châteaux médiévaux, ses côtes sauvages et sa culture celtique vibrante. Alainn Tours propose des circuits authentiques en terre galloise.\n\nDu parc national de Snowdonia aux châteaux d'Édouard Ier, des vallées verdoyantes au Pembrokeshire Coast Path, le Pays de Galles offre une immersion dans un monde de légendes.",
      en: "Wales enchants with its medieval castles, wild coasts and vibrant Celtic culture. Alainn Tours offers authentic tours in Welsh land.\n\nFrom Snowdonia National Park to Edward I's castles, from green valleys to Pembrokeshire Coast Path, Wales offers an immersion in a world of legends."
    },
    highlights: {
      bestSeason: "Mai - Septembre",
      currency: "Livre sterling (GBP)",
      language: "Anglais, Gallois",
      timezone: "UTC+0",
      flightTime: "1h30 direct"
    },
    sellingPoints: {
      fr: [
        "Plus grande densité de châteaux au monde",
        "Parcs nationaux spectaculaires",
        "Culture celtique vivante",
        "Côte sauvage préservée",
        "Très proche et accessible"
      ],
      en: [
        "Highest density of castles in the world",
        "Spectacular national parks",
        "Living Celtic culture",
        "Preserved wild coast",
        "Very close and accessible"
      ]
    },
    idealFor: {
      fr: ["Road-trip", "Histoire et châteaux", "Randonnée", "Familles", "Courts séjours"],
      en: ["Road trip", "History and castles", "Hiking", "Families", "Short stays"]
    },
    images: {
      hero: "/images/destinations/pays-de-galles.jpg",
      gallery: []
    },
    hasGir: false
  },
  // ============== AMÉRIQUES ==============
  {
    slug: 'perou',
    name: 'Pérou',
    nameEn: 'Peru',
    code: 'PE',
    region: 'americas',
    partnerId: 'pasion-andina',
    metaDescription: {
      fr: "Découvrez le Pérou avec Pasión Andina. Machu Picchu, Amazonie et culture inca.",
      en: "Discover Peru with Pasión Andina. Machu Picchu, Amazon and Inca culture."
    },
    tagline: {
      fr: "Empire inca, Amazonie et gastronomie d'exception",
      en: "Inca empire, Amazon and exceptional gastronomy"
    },
    description: {
      fr: "Le Pérou fascine par son héritage inca et sa diversité naturelle exceptionnelle. Pasión Andina propose des circuits authentiques au-delà du Machu Picchu.\n\nDes mystères de Cusco à l'Amazonie profonde, du lac Titicaca aux lignes de Nazca, le Pérou offre une aventure complète couronnée par une gastronomie mondialement reconnue.",
      en: "Peru fascinates with its Inca heritage and exceptional natural diversity. Pasión Andina offers authentic tours beyond Machu Picchu.\n\nFrom the mysteries of Cusco to the deep Amazon, from Lake Titicaca to the Nazca lines, Peru offers a complete adventure crowned by world-renowned gastronomy."
    },
    highlights: {
      bestSeason: "Avril - Octobre",
      currency: "Sol (PEN)",
      language: "Espagnol, Quechua",
      timezone: "UTC-5",
      flightTime: "12h (via escale)"
    },
    sellingPoints: {
      fr: [
        "Machu Picchu - merveille du monde",
        "Diversité exceptionnelle (côte, Andes, Amazonie)",
        "Gastronomie parmi les meilleures au monde",
        "Culture inca vivante",
        "Trekkings mythiques"
      ],
      en: [
        "Machu Picchu - wonder of the world",
        "Exceptional diversity (coast, Andes, Amazon)",
        "Gastronomy among the best in the world",
        "Living Inca culture",
        "Mythical treks"
      ]
    },
    idealFor: {
      fr: ["Aventuriers", "Trekkeurs", "Amateurs de gastronomie", "Culture et histoire", "Photographes"],
      en: ["Adventurers", "Trekkers", "Food lovers", "Culture and history", "Photographers"]
    },
    images: {
      hero: "/images/destinations/perou.jpg",
      gallery: []
    },
    hasGir: false
  }
];

// Helper functions
export const getDestinationBySlug = (slug: string): DestinationDetail | undefined => {
  return destinationsData.find(d => d.slug === slug);
};

export const getDestinationsByRegion = (region: Region): DestinationDetail[] => {
  return destinationsData.filter(d => d.region === region);
};

export const getDestinationsWithGir = (): DestinationDetail[] => {
  return destinationsData.filter(d => d.hasGir);
};

export const getAllDestinationSlugs = (): string[] => {
  return destinationsData.map(d => d.slug);
};
