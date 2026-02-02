// The DMC Alliance - Données des circuits GIR

export type DifficultyLevel = 'easy' | 'moderate' | 'challenging' | 'expert';
export type CircuitTheme = 'adventure' | 'culture' | 'nature' | 'wildlife' | 'trekking' | 'family' | 'photography' | 'gastronomy';

export interface CircuitDay {
  day: number;
  title: {
    fr: string;
    en: string;
  };
  description: {
    fr: string;
    en: string;
  };
  highlights?: {
    fr: string[];
    en: string[];
  };
  meals?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  accommodation?: {
    fr: string;
    en: string;
  };
  transferInfo?: {
    fr: string;
    en: string;
  };
}

export interface CircuitDeparture {
  id: string;
  startDate: string; // ISO date
  endDate: string;
  availableSpots: number;
  totalSpots: number;
  status: 'available' | 'few_spots' | 'full' | 'guaranteed';
  publicPrice: number; // Price per person in EUR
}

export interface Circuit {
  id: string;
  slug: string;
  partnerId: string;
  destinationSlug: string;

  // Basic info
  title: {
    fr: string;
    en: string;
  };
  subtitle: {
    fr: string;
    en: string;
  };
  duration: {
    days: number;
    nights: number;
  };
  difficulty: DifficultyLevel;
  themes: CircuitTheme[];

  // Description
  summary: {
    fr: string;
    en: string;
  };
  highlights: {
    fr: string[];
    en: string[];
  };

  // Itinerary
  itinerary: CircuitDay[];

  // Practical info
  included: {
    fr: string[];
    en: string[];
  };
  notIncluded: {
    fr: string[];
    en: string[];
  };
  practicalInfo: {
    groupSize: {
      min: number;
      max: number;
    };
    physicalCondition: {
      fr: string;
      en: string;
    };
    bestSeason: {
      fr: string;
      en: string;
    };
    altitude?: string;
  };

  // Departures
  departures: CircuitDeparture[];

  // Media
  images: {
    main: string;
    gallery: string[];
  };

  // GIR specific
  isGir: boolean;
  commissionInfo?: {
    fr: string;
    en: string;
  };
}

export const circuits: Circuit[] = [
  // Mongolie - Horseback Adventure
  {
    id: 'mongolie-steppes-desert',
    slug: 'entre-steppe-et-desert',
    partnerId: 'horseback-adventure',
    destinationSlug: 'mongolie',
    title: {
      fr: 'Entre steppe et désert',
      en: 'Between steppe and desert'
    },
    subtitle: {
      fr: 'Randonnée équestre au cœur de la Mongolie',
      en: 'Horseback riding in the heart of Mongolia'
    },
    duration: {
      days: 15,
      nights: 14
    },
    difficulty: 'moderate',
    themes: ['adventure', 'nature', 'culture'],
    summary: {
      fr: "Ce voyage équestre vous emmène des steppes verdoyantes du centre de la Mongolie jusqu'aux confins du désert de Gobi. Une immersion totale dans la vie nomade, entre randonnées à cheval, nuits en yourte et rencontres authentiques avec les familles d'éleveurs.",
      en: "This horseback journey takes you from the green steppes of central Mongolia to the edges of the Gobi Desert. A total immersion in nomadic life, with horseback riding, nights in yurts and authentic encounters with herding families."
    },
    highlights: {
      fr: [
        'Randonnée équestre de 10 jours avec des chevaux mongols',
        'Traversée du parc national de Khustain Nuruu (chevaux de Przewalski)',
        'Nuits chez les nomades en yourte traditionnelle',
        'Découverte des dunes de Khongor (Gobi)',
        'Falaises de Bayanzag (fossiles de dinosaures)',
        'Festival local et démonstration de dressage',
      ],
      en: [
        '10-day horseback riding with Mongolian horses',
        'Crossing Khustain Nuruu National Park (Przewalski horses)',
        'Nights with nomads in traditional yurts',
        'Discovery of Khongor dunes (Gobi)',
        'Bayanzag cliffs (dinosaur fossils)',
        'Local festival and horse training demonstration',
      ]
    },
    itinerary: [
      {
        day: 1,
        title: {
          fr: 'Arrivée à Oulan-Bator',
          en: 'Arrival in Ulaanbaatar'
        },
        description: {
          fr: "Accueil à l'aéroport international de Oulan-Bator par notre équipe. Transfert à l'hôtel et temps de repos. En fin d'après-midi, visite du monastère de Gandan, le plus grand monastère bouddhiste actif de Mongolie. Dîner de bienvenue avec présentation du voyage.",
          en: "Welcome at Ulaanbaatar International Airport by our team. Transfer to the hotel and rest time. In the late afternoon, visit Gandan Monastery, the largest active Buddhist monastery in Mongolia. Welcome dinner with trip presentation."
        },
        highlights: {
          fr: ['Monastère de Gandan', 'Briefing du voyage'],
          en: ['Gandan Monastery', 'Trip briefing']
        },
        meals: { breakfast: false, lunch: false, dinner: true },
        accommodation: { fr: 'Hôtel 3* à Oulan-Bator', en: '3* hotel in Ulaanbaatar' }
      },
      {
        day: 2,
        title: {
          fr: 'Oulan-Bator - Khustain Nuruu',
          en: 'Ulaanbaatar - Khustain Nuruu'
        },
        description: {
          fr: "Départ vers le parc national de Khustain Nuruu, réserve naturelle des chevaux de Przewalski, derniers chevaux sauvages au monde. Installation au camp de yourtes et première randonnée d'observation en fin de journée pour apercevoir les chevaux sauvages.",
          en: "Departure to Khustain Nuruu National Park, natural reserve of Przewalski horses, the last wild horses in the world. Settling in the yurt camp and first observation hike at the end of the day to spot the wild horses."
        },
        highlights: {
          fr: ['Chevaux de Przewalski', 'Première nuit en yourte'],
          en: ['Przewalski horses', 'First night in yurt']
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Camp de yourtes', en: 'Yurt camp' },
        transferInfo: { fr: '100 km - 2h de route', en: '100 km - 2h drive' }
      },
      {
        day: 3,
        title: {
          fr: 'Début de la randonnée équestre',
          en: 'Start of horseback riding'
        },
        description: {
          fr: "Rencontre avec nos chevaux et nos guides nomades. Après un briefing sur les techniques de monte mongole, nous commençons notre randonnée équestre. Chevauchée à travers les vallées verdoyantes, premiers contacts avec les familles nomades rencontrées sur notre route.",
          en: "Meeting with our horses and nomad guides. After a briefing on Mongolian riding techniques, we start our horseback ride. Riding through green valleys, first contacts with nomadic families encountered along the way."
        },
        highlights: {
          fr: ['Attribution des chevaux', '4-5h à cheval'],
          en: ['Horse assignment', '4-5h on horseback']
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Yourte chez les nomades', en: 'Yurt with nomads' }
      },
      {
        day: 4,
        title: {
          fr: 'Vallée de l\'Orkhon',
          en: 'Orkhon Valley'
        },
        description: {
          fr: "Poursuite de la randonnée vers la vallée de l'Orkhon, classée au patrimoine mondial de l'UNESCO. Cette vallée fut le berceau de nombreux empires nomades. Passage par des prairies fleuries et des forêts de mélèzes.",
          en: "Continuation of the ride towards the Orkhon Valley, a UNESCO World Heritage site. This valley was the cradle of many nomadic empires. Passing through flowery meadows and larch forests."
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Campement nomade', en: 'Nomad camp' }
      },
      {
        day: 5,
        title: {
          fr: 'Cascades de l\'Orkhon',
          en: 'Orkhon Waterfalls'
        },
        description: {
          fr: "Journée de randonnée équestre jusqu'aux impressionnantes cascades de l'Orkhon (Ulaan Tsutgalan). Ces chutes de 20 mètres de haut se sont formées il y a 20 000 ans suite à une éruption volcanique. Temps libre pour explorer les environs.",
          en: "Full day horseback ride to the impressive Orkhon Waterfalls (Ulaan Tsutgalan). These 20-meter high falls were formed 20,000 years ago following a volcanic eruption. Free time to explore the surroundings."
        },
        highlights: {
          fr: ['Cascades de 20m', 'Baignade possible'],
          en: ['20m waterfalls', 'Swimming possible']
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Yourte près des cascades', en: 'Yurt near the falls' }
      },
      {
        day: 6,
        title: {
          fr: 'Karakorum - Erdene Zuu',
          en: 'Karakorum - Erdene Zuu'
        },
        description: {
          fr: "Route vers Karakorum, ancienne capitale de l'empire mongol de Gengis Khan. Visite du monastère d'Erdene Zuu, premier monastère bouddhiste de Mongolie (XVIe siècle), entouré de 108 stupas. Découverte du musée de Karakorum.",
          en: "Drive to Karakorum, former capital of Genghis Khan's Mongol Empire. Visit Erdene Zuu Monastery, the first Buddhist monastery in Mongolia (16th century), surrounded by 108 stupas. Discovery of Karakorum Museum."
        },
        highlights: {
          fr: ['Monastère Erdene Zuu', 'Histoire de Gengis Khan'],
          en: ['Erdene Zuu Monastery', 'Genghis Khan history']
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Camp de yourtes', en: 'Yurt camp' }
      },
      {
        day: 7,
        title: {
          fr: 'Vers le Gobi - Dunes de Khongor',
          en: 'Towards the Gobi - Khongor Dunes'
        },
        description: {
          fr: "Longue journée de transfert vers le désert de Gobi. Arrivée en fin de journée aux impressionnantes dunes de Khongor, surnommées les 'dunes chantantes'. Installation dans un camp de yourtes au pied des dunes.",
          en: "Long transfer day towards the Gobi Desert. Arrival at the end of the day at the impressive Khongor Dunes, nicknamed the 'singing dunes'. Settlement in a yurt camp at the foot of the dunes."
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Camp de yourtes dans le Gobi', en: 'Yurt camp in the Gobi' },
        transferInfo: { fr: '350 km - 7h de route', en: '350 km - 7h drive' }
      },
      {
        day: 8,
        title: {
          fr: 'Exploration des dunes de Khongor',
          en: 'Exploration of Khongor Dunes'
        },
        description: {
          fr: "Journée dédiée à l'exploration des dunes de Khongor, parmi les plus hautes du monde (jusqu'à 300m). Ascension matinale pour admirer le lever du soleil. Balade à dos de chameau avec les éleveurs locaux. Temps libre pour profiter de ce paysage extraordinaire.",
          en: "Day dedicated to exploring the Khongor Dunes, among the highest in the world (up to 300m). Morning ascent to admire the sunrise. Camel ride with local herders. Free time to enjoy this extraordinary landscape."
        },
        highlights: {
          fr: ['Lever de soleil sur les dunes', 'Balade à dos de chameau'],
          en: ['Sunrise over the dunes', 'Camel ride']
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Camp de yourtes dans le Gobi', en: 'Yurt camp in the Gobi' }
      },
      {
        day: 9,
        title: {
          fr: 'Falaises de Bayanzag',
          en: 'Bayanzag Cliffs'
        },
        description: {
          fr: "Route vers les falaises flamboyantes de Bayanzag, site paléontologique majeur où furent découverts les premiers œufs de dinosaures au monde en 1923. Randonnée au coucher du soleil dans ce paysage lunaire aux couleurs ocre et rouge.",
          en: "Drive to the flaming cliffs of Bayanzag, a major paleontological site where the world's first dinosaur eggs were discovered in 1923. Sunset hike in this lunar landscape with ochre and red colors."
        },
        highlights: {
          fr: ['Site de fossiles de dinosaures', 'Coucher de soleil spectaculaire'],
          en: ['Dinosaur fossil site', 'Spectacular sunset']
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Camp de yourtes', en: 'Yurt camp' }
      },
      {
        day: 10,
        title: {
          fr: 'Canyon de Yoliin Am',
          en: 'Yolyn Am Canyon'
        },
        description: {
          fr: "Visite du canyon de Yoliin Am dans le parc national de Gurvan Saikhan. Ce canyon étroit abrite des glaces permanentes même en été. Randonnée pédestre dans le canyon et observation de la faune locale (marmottes, rapaces).",
          en: "Visit Yolyn Am Canyon in Gurvan Saikhan National Park. This narrow canyon harbors permanent ice even in summer. Hiking in the canyon and observation of local wildlife (marmots, raptors)."
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Camp de yourtes', en: 'Yurt camp' }
      },
      {
        day: 11,
        title: {
          fr: 'Retour vers le centre - Tsagaan Suvarga',
          en: 'Return to the center - Tsagaan Suvarga'
        },
        description: {
          fr: "Route vers le nord avec arrêt aux formations rocheuses de Tsagaan Suvarga, anciennes falaises maritimes sculptées par l'érosion. Ces paysages lunaires témoignent de l'ancien fond marin qu'était cette région il y a des millions d'années.",
          en: "Drive north with a stop at the Tsagaan Suvarga rock formations, ancient sea cliffs sculpted by erosion. These lunar landscapes bear witness to the ancient seabed that this region was millions of years ago."
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Camp de yourtes', en: 'Yurt camp' },
        transferInfo: { fr: '250 km - 5h de route', en: '250 km - 5h drive' }
      },
      {
        day: 12,
        title: {
          fr: 'Reprise de la randonnée équestre',
          en: 'Resuming horseback riding'
        },
        description: {
          fr: "Retrouvailles avec nos chevaux pour une dernière étape équestre de deux jours. Chevauchée à travers les paysages vallonnés de la région centrale, rencontre avec des familles d'éleveurs et participation aux activités quotidiennes.",
          en: "Reunion with our horses for a final two-day equestrian stage. Riding through the hilly landscapes of the central region, meeting herding families and participating in daily activities."
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Yourte chez les nomades', en: 'Yurt with nomads' }
      },
      {
        day: 13,
        title: {
          fr: 'Dernière journée à cheval',
          en: 'Last day on horseback'
        },
        description: {
          fr: "Dernière journée de randonnée équestre, moment d'émotion lors des adieux à nos montures et nos guides nomades. Cérémonie traditionnelle et échange de cadeaux avec la famille d'accueil.",
          en: "Last day of horseback riding, emotional moment when saying goodbye to our mounts and nomad guides. Traditional ceremony and gift exchange with the host family."
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Yourte chez les nomades', en: 'Yurt with nomads' }
      },
      {
        day: 14,
        title: {
          fr: 'Retour à Oulan-Bator',
          en: 'Return to Ulaanbaatar'
        },
        description: {
          fr: "Transfert vers Oulan-Bator. En chemin, arrêt dans une fabrique de cachemire et visite du marché de Narantuul. Installation à l'hôtel et temps libre pour les achats. Dîner de clôture au restaurant avec spectacle de chants traditionnels.",
          en: "Transfer to Ulaanbaatar. On the way, stop at a cashmere factory and visit Narantuul market. Check-in at the hotel and free time for shopping. Closing dinner at the restaurant with traditional singing performance."
        },
        highlights: {
          fr: ['Shopping cachemire', 'Dîner spectacle'],
          en: ['Cashmere shopping', 'Dinner show']
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Hôtel 3* à Oulan-Bator', en: '3* hotel in Ulaanbaatar' }
      },
      {
        day: 15,
        title: {
          fr: 'Vol de retour',
          en: 'Return flight'
        },
        description: {
          fr: "Transfert à l'aéroport selon les horaires de vol. Fin de nos services.",
          en: "Transfer to the airport according to flight times. End of our services."
        },
        meals: { breakfast: true, lunch: false, dinner: false }
      }
    ],
    included: {
      fr: [
        'Tous les transferts mentionnés au programme',
        'Hébergement en hôtel 3* à Oulan-Bator (2 nuits)',
        'Hébergement en yourte et chez l\'habitant (12 nuits)',
        'Pension complète du dîner J1 au petit-déjeuner J15',
        'Chevaux mongols et équipement pour la randonnée',
        'Guide francophone pendant tout le séjour',
        'Guide équestre mongol',
        'Entrées dans les parcs nationaux et sites',
        'Spectacle de chants traditionnels',
        'Eau minérale pendant les repas'
      ],
      en: [
        'All transfers mentioned in the program',
        'Accommodation in 3* hotel in Ulaanbaatar (2 nights)',
        'Accommodation in yurt and with locals (12 nights)',
        'Full board from dinner D1 to breakfast D15',
        'Mongolian horses and equipment for the ride',
        'French-speaking guide throughout the stay',
        'Mongolian horse guide',
        'Entrance to national parks and sites',
        'Traditional singing performance',
        'Mineral water during meals'
      ]
    },
    notIncluded: {
      fr: [
        'Vols internationaux',
        'Visa (gratuit pour les ressortissants français)',
        'Assurance voyage et rapatriement',
        'Boissons en dehors des repas',
        'Pourboires (prévoir ~50€/personne)',
        'Dépenses personnelles'
      ],
      en: [
        'International flights',
        'Visa (free for French nationals)',
        'Travel and repatriation insurance',
        'Drinks outside meals',
        'Tips (budget ~€50/person)',
        'Personal expenses'
      ]
    },
    practicalInfo: {
      groupSize: { min: 4, max: 12 },
      physicalCondition: {
        fr: 'Bonne condition physique requise. Expérience équestre souhaitée mais pas obligatoire. Capacité à passer 5-6h par jour à cheval.',
        en: 'Good physical condition required. Horse riding experience preferred but not mandatory. Ability to spend 5-6h per day on horseback.'
      },
      bestSeason: {
        fr: 'De juin à septembre. Juillet pour le festival du Naadam.',
        en: 'From June to September. July for the Naadam festival.'
      }
    },
    departures: [
      {
        id: 'mon-2024-06-15',
        startDate: '2024-06-15',
        endDate: '2024-06-29',
        availableSpots: 8,
        totalSpots: 12,
        status: 'available',
        publicPrice: 3450
      },
      {
        id: 'mon-2024-07-06',
        startDate: '2024-07-06',
        endDate: '2024-07-20',
        availableSpots: 3,
        totalSpots: 12,
        status: 'few_spots',
        publicPrice: 3650
      },
      {
        id: 'mon-2024-07-20',
        startDate: '2024-07-20',
        endDate: '2024-08-03',
        availableSpots: 0,
        totalSpots: 12,
        status: 'full',
        publicPrice: 3650
      },
      {
        id: 'mon-2024-08-10',
        startDate: '2024-08-10',
        endDate: '2024-08-24',
        availableSpots: 10,
        totalSpots: 12,
        status: 'guaranteed',
        publicPrice: 3550
      },
      {
        id: 'mon-2024-09-07',
        startDate: '2024-09-07',
        endDate: '2024-09-21',
        availableSpots: 12,
        totalSpots: 12,
        status: 'available',
        publicPrice: 3350
      }
    ],
    images: {
      main: '/images/circuits/mongolie-steppes-desert.jpg',
      gallery: [
        '/images/circuits/mongolie-steppes-desert/chevaux.jpg',
        '/images/circuits/mongolie-steppes-desert/yourte.jpg',
        '/images/circuits/mongolie-steppes-desert/gobi.jpg',
        '/images/circuits/mongolie-steppes-desert/dunes.jpg',
      ]
    },
    isGir: true,
    commissionInfo: {
      fr: 'Commission attractive sur demande. Contactez-nous pour connaître vos conditions partenaire.',
      en: 'Attractive commission on request. Contact us to learn about your partner conditions.'
    }
  },
  // Kenya - Galago Expeditions
  {
    id: 'kenya-grande-migration',
    slug: 'grande-migration-masai-mara',
    partnerId: 'galago-expeditions',
    destinationSlug: 'kenya',
    title: {
      fr: 'Grande Migration au Masai Mara',
      en: 'Great Migration in Masai Mara'
    },
    subtitle: {
      fr: 'Safari d\'exception au cœur de la grande migration',
      en: 'Exceptional safari in the heart of the great migration'
    },
    duration: {
      days: 10,
      nights: 9
    },
    difficulty: 'easy',
    themes: ['wildlife', 'photography', 'nature'],
    summary: {
      fr: "Vivez le spectacle le plus extraordinaire de la nature : la grande migration des gnous et zèbres au Masai Mara. Ce safari d'exception combine les meilleurs spots d'observation avec des hébergements de charme au cœur de la réserve.",
      en: "Experience the most extraordinary spectacle in nature: the great wildebeest and zebra migration in Masai Mara. This exceptional safari combines the best observation spots with charming accommodations in the heart of the reserve."
    },
    highlights: {
      fr: [
        'Grande migration des gnous (juillet-octobre)',
        'Traversée de la rivière Mara',
        'Big Five garantis',
        'Lodges et camps de charme',
        'Safari en 4x4 privatif',
        'Rencontre avec les Masaï'
      ],
      en: [
        'Great wildebeest migration (July-October)',
        'Mara River crossing',
        'Guaranteed Big Five',
        'Charming lodges and camps',
        'Private 4x4 safari',
        'Meeting with Maasai'
      ]
    },
    itinerary: [
      {
        day: 1,
        title: { fr: 'Arrivée à Nairobi', en: 'Arrival in Nairobi' },
        description: {
          fr: "Accueil à l'aéroport international Jomo Kenyatta de Nairobi. Transfert à l'hôtel et briefing du safari. Dîner et nuit à Nairobi.",
          en: "Welcome at Nairobi's Jomo Kenyatta International Airport. Transfer to the hotel and safari briefing. Dinner and overnight in Nairobi."
        },
        meals: { breakfast: false, lunch: false, dinner: true },
        accommodation: { fr: 'Hôtel 4* à Nairobi', en: '4* hotel in Nairobi' }
      },
      {
        day: 2,
        title: { fr: 'Nairobi - Lac Nakuru', en: 'Nairobi - Lake Nakuru' },
        description: {
          fr: "Route vers le lac Nakuru, célèbre pour ses colonies de flamants roses et sa population de rhinocéros. Safari l'après-midi dans le parc national du lac Nakuru.",
          en: "Drive to Lake Nakuru, famous for its flamingo colonies and rhino population. Afternoon safari in Lake Nakuru National Park."
        },
        meals: { breakfast: true, lunch: true, dinner: true },
        accommodation: { fr: 'Lodge au lac Nakuru', en: 'Lodge at Lake Nakuru' }
      },
      // ... Add more days
    ],
    included: {
      fr: [
        'Tous les transferts en 4x4 privatif',
        'Hébergement en lodges et camps de qualité',
        'Pension complète',
        'Safaris avec guide francophone',
        'Entrées dans les parcs',
        'Eau minérale pendant les safaris'
      ],
      en: [
        'All transfers in private 4x4',
        'Accommodation in quality lodges and camps',
        'Full board',
        'Safaris with French-speaking guide',
        'Park entrance fees',
        'Mineral water during safaris'
      ]
    },
    notIncluded: {
      fr: [
        'Vols internationaux et domestiques',
        'Visa Kenya',
        'Assurance voyage',
        'Boissons',
        'Pourboires',
        'Dépenses personnelles'
      ],
      en: [
        'International and domestic flights',
        'Kenya visa',
        'Travel insurance',
        'Drinks',
        'Tips',
        'Personal expenses'
      ]
    },
    practicalInfo: {
      groupSize: { min: 2, max: 8 },
      physicalCondition: {
        fr: 'Aucune condition physique particulière requise.',
        en: 'No particular physical condition required.'
      },
      bestSeason: {
        fr: 'Juillet à octobre pour la grande migration.',
        en: 'July to October for the great migration.'
      }
    },
    departures: [
      {
        id: 'ken-2024-07-15',
        startDate: '2024-07-15',
        endDate: '2024-07-24',
        availableSpots: 6,
        totalSpots: 8,
        status: 'available',
        publicPrice: 4890
      },
      {
        id: 'ken-2024-08-12',
        startDate: '2024-08-12',
        endDate: '2024-08-21',
        availableSpots: 2,
        totalSpots: 8,
        status: 'few_spots',
        publicPrice: 5190
      },
      {
        id: 'ken-2024-09-02',
        startDate: '2024-09-02',
        endDate: '2024-09-11',
        availableSpots: 8,
        totalSpots: 8,
        status: 'guaranteed',
        publicPrice: 4790
      }
    ],
    images: {
      main: '/images/circuits/kenya-migration.jpg',
      gallery: []
    },
    isGir: true,
    commissionInfo: {
      fr: 'Commission attractive sur demande.',
      en: 'Attractive commission on request.'
    }
  },
  // Kirghizistan - Kyrgyz'What?
  {
    id: 'kirghizistan-merveilles',
    slug: 'merveilles-de-kirghizie',
    partnerId: 'kyrgyzwhat',
    destinationSlug: 'kirghizistan',
    title: {
      fr: 'Merveilles de Kirghizie',
      en: 'Wonders of Kyrgyzstan'
    },
    subtitle: {
      fr: 'Trek et immersion nomade au pays des montagnes célestes',
      en: 'Trek and nomadic immersion in the land of celestial mountains'
    },
    duration: {
      days: 12,
      nights: 11
    },
    difficulty: 'moderate',
    themes: ['trekking', 'adventure', 'culture'],
    summary: {
      fr: "Un voyage complet au Kirghizistan combinant trekkings spectaculaires, nuits en yourte chez les nomades et découverte de la culture kirghize. Des lacs d'altitude aux vallées verdoyantes, une immersion totale dans les montagnes célestes.",
      en: "A complete journey through Kyrgyzstan combining spectacular treks, nights in yurts with nomads and discovery of Kyrgyz culture. From high-altitude lakes to green valleys, a total immersion in the celestial mountains."
    },
    highlights: {
      fr: [
        'Trek au lac Song-Kul (3000m)',
        'Randonnée au lac Ala-Kul',
        'Nuits en yourte chez les nomades',
        'Vallée de Jety-Oguz',
        'Caravansérail de Tash Rabat',
        'Rencontres avec les familles kirghizes'
      ],
      en: [
        'Trek to Song-Kul Lake (3000m)',
        'Hike to Ala-Kul Lake',
        'Nights in yurts with nomads',
        'Jety-Oguz Valley',
        'Tash Rabat Caravanserai',
        'Meetings with Kyrgyz families'
      ]
    },
    itinerary: [],
    included: {
      fr: [],
      en: []
    },
    notIncluded: {
      fr: [],
      en: []
    },
    practicalInfo: {
      groupSize: { min: 4, max: 10 },
      physicalCondition: {
        fr: 'Bonne condition physique. Trek de 4-6h/jour. Altitude max 3800m.',
        en: 'Good physical condition. Trek 4-6h/day. Max altitude 3800m.'
      },
      bestSeason: {
        fr: 'Juin à septembre.',
        en: 'June to September.'
      },
      altitude: '3800m max'
    },
    departures: [
      {
        id: 'kgz-2024-06-22',
        startDate: '2024-06-22',
        endDate: '2024-07-03',
        availableSpots: 6,
        totalSpots: 10,
        status: 'available',
        publicPrice: 2190
      },
      {
        id: 'kgz-2024-07-13',
        startDate: '2024-07-13',
        endDate: '2024-07-24',
        availableSpots: 10,
        totalSpots: 10,
        status: 'guaranteed',
        publicPrice: 2290
      },
      {
        id: 'kgz-2024-08-03',
        startDate: '2024-08-03',
        endDate: '2024-08-14',
        availableSpots: 4,
        totalSpots: 10,
        status: 'few_spots',
        publicPrice: 2290
      }
    ],
    images: {
      main: '/images/circuits/kirghizistan-merveilles.jpg',
      gallery: []
    },
    isGir: true,
    commissionInfo: {
      fr: 'Commission sur demande.',
      en: 'Commission on request.'
    }
  }
];

// Helper functions
export const getCircuitBySlug = (slug: string): Circuit | undefined => {
  return circuits.find(c => c.slug === slug);
};

export const getCircuitsByDestination = (destinationSlug: string): Circuit[] => {
  return circuits.filter(c => c.destinationSlug === destinationSlug);
};

export const getCircuitsByPartner = (partnerId: string): Circuit[] => {
  return circuits.filter(c => c.partnerId === partnerId);
};

export const getGirCircuits = (): Circuit[] => {
  return circuits.filter(c => c.isGir);
};

export const getUpcomingDepartures = (circuitId?: string): CircuitDeparture[] => {
  const today = new Date().toISOString().split('T')[0];
  let departures: CircuitDeparture[] = [];

  if (circuitId) {
    const circuit = circuits.find(c => c.id === circuitId);
    departures = circuit?.departures || [];
  } else {
    circuits.forEach(c => {
      departures = [...departures, ...c.departures.map(d => ({ ...d, circuitId: c.id }))];
    });
  }

  return departures
    .filter(d => d.startDate >= today && d.status !== 'full')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
};

export const getAllCircuitSlugs = (): string[] => {
  return circuits.map(c => c.slug);
};
