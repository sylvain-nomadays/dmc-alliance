// The DMC Alliance - Profils détaillés des agences partenaires
// Ces données enrichissent les partners de base pour les pages profil

export interface TeamMember {
  name: string;
  role: {
    fr: string;
    en: string;
  };
  photo?: string;
  bio?: {
    fr: string;
    en: string;
  };
}

export interface PartnerProfile {
  partnerId: string;

  // Histoire et présentation
  foundedYear: number;
  story: {
    fr: string;
    en: string;
  };

  // Mission et valeurs
  mission: {
    fr: string;
    en: string;
  };
  values: {
    title: { fr: string; en: string };
    description: { fr: string; en: string };
  }[];

  // L'équipe
  teamSize: number;
  team: TeamMember[];

  // Statistiques
  stats: {
    travelersPerYear: number;
    yearsExperience: number;
    satisfactionRate?: number; // percentage
    returnRate?: number; // percentage
  };

  // Ce qui les rend uniques
  uniqueSellingPoints: {
    fr: string[];
    en: string[];
  };

  // Services B2B spécifiques
  b2bServices: {
    fr: string[];
    en: string[];
  };

  // Témoignages
  testimonials?: {
    quote: { fr: string; en: string };
    author: string;
    company: string;
  }[];

  // Certifications et labels
  certifications?: string[];

  // Médias
  images: {
    office?: string;
    team?: string;
    gallery: string[];
  };

  // Vidéo de présentation
  presentationVideo?: {
    url: string;
    title: { fr: string; en: string };
  };
}

export const partnerProfiles: PartnerProfile[] = [
  // ============== HORSEBACK ADVENTURE (Mongolie) ==============
  {
    partnerId: 'horseback-adventure',
    foundedYear: 2008,
    story: {
      fr: "Horseback Mongolia est né de la passion de Marc et Uyanga pour les steppes mongoles. Installés à Oulan-Bator depuis 2008, ils ont créé une agence à taille humaine, spécialisée dans les voyages équestres et l'immersion chez les nomades.\n\nLeur philosophie : faire découvrir la Mongolie authentique, loin du tourisme de masse, en privilégiant les rencontres avec les familles d'éleveurs et le respect des traditions locales. Chaque voyage est conçu comme une aventure unique, adaptée aux rêves de chaque voyageur.",
      en: "Horseback Mongolia was born from Marc and Uyanga's passion for the Mongolian steppes. Based in Ulaanbaatar since 2008, they created a human-scale agency specializing in horseback riding trips and nomadic immersion.\n\nTheir philosophy: to reveal authentic Mongolia, far from mass tourism, by prioritizing encounters with herding families and respect for local traditions. Each trip is designed as a unique adventure, adapted to each traveler's dreams."
    },
    mission: {
      fr: "Révéler l'âme nomade de la Mongolie à travers des voyages authentiques qui créent des liens durables entre les voyageurs et les communautés locales.",
      en: "Reveal the nomadic soul of Mongolia through authentic journeys that create lasting bonds between travelers and local communities."
    },
    values: [
      {
        title: { fr: 'Authenticité', en: 'Authenticity' },
        description: { fr: "Des expériences vraies, loin des circuits touristiques classiques.", en: "Real experiences, far from classic tourist circuits." }
      },
      {
        title: { fr: 'Respect', en: 'Respect' },
        description: { fr: "Respect des traditions nomades et de l'environnement fragile des steppes.", en: "Respect for nomadic traditions and the fragile steppe environment." }
      },
      {
        title: { fr: 'Passion', en: 'Passion' },
        description: { fr: "Notre équipe vit et respire la Mongolie au quotidien.", en: "Our team lives and breathes Mongolia every day." }
      },
      {
        title: { fr: 'Excellence', en: 'Excellence' },
        description: { fr: "Une logistique irréprochable pour des voyages sans souci.", en: "Impeccable logistics for worry-free travel." }
      }
    ],
    teamSize: 12,
    team: [
      {
        name: 'Marc Progin',
        role: { fr: 'Fondateur & Directeur', en: 'Founder & Director' },
        photo: '/images/team/marc-progin.jpg',
        bio: { fr: "Franco-suisse installé en Mongolie depuis 2006, Marc a parcouru les steppes à cheval pendant des années avant de fonder l'agence.", en: "French-Swiss based in Mongolia since 2006, Marc rode across the steppes for years before founding the agency." }
      },
      {
        name: 'Uyanga',
        role: { fr: 'Co-fondatrice & Responsable opérations', en: 'Co-founder & Operations Manager' },
        photo: '/images/team/uyanga.jpg',
        bio: { fr: "Mongole passionnée par son pays, Uyanga supervise toutes les opérations terrain et la relation avec les familles nomades.", en: "Mongolian passionate about her country, Uyanga supervises all field operations and relations with nomadic families." }
      },
      {
        name: 'Batbold',
        role: { fr: 'Chef guide équestre', en: 'Head Horse Guide' },
        photo: '/images/team/batbold.jpg',
        bio: { fr: "Éleveur nomade devenu guide, Batbold connaît chaque vallée et chaque col de la Mongolie centrale.", en: "Nomadic herder turned guide, Batbold knows every valley and pass of central Mongolia." }
      }
    ],
    stats: {
      travelersPerYear: 450,
      yearsExperience: 16,
      satisfactionRate: 98,
      returnRate: 35
    },
    uniqueSellingPoints: {
      fr: [
        "Seule agence francophone spécialisée exclusivement en Mongolie",
        "Partenariats exclusifs avec des familles nomades",
        "Chevaux mongols de qualité, sélectionnés et entraînés par notre équipe",
        "Guides bilingues français-mongol formés en interne",
        "Logistique éprouvée avec véhicules tout-terrain et équipements camping premium"
      ],
      en: [
        "Only French-speaking agency exclusively specialized in Mongolia",
        "Exclusive partnerships with nomadic families",
        "Quality Mongolian horses, selected and trained by our team",
        "Bilingual French-Mongolian guides trained in-house",
        "Proven logistics with 4x4 vehicles and premium camping equipment"
      ]
    },
    b2bServices: {
      fr: [
        "Devis sous 48h avec tarification claire",
        "Commission attractive sur tous les circuits",
        "Support commercial et documentation marketing",
        "Formations destination sur demande",
        "Co-création de circuits exclusifs",
        "Assistance 24/7 pendant les voyages"
      ],
      en: [
        "Quote within 48h with clear pricing",
        "Attractive commission on all circuits",
        "Sales support and marketing documentation",
        "Destination training on request",
        "Co-creation of exclusive circuits",
        "24/7 assistance during trips"
      ]
    },
    testimonials: [
      {
        quote: {
          fr: "Notre partenariat avec Horseback Mongolia dure depuis 8 ans. Leur professionnalisme et leur connaissance du terrain sont incomparables.",
          en: "Our partnership with Horseback Mongolia has lasted 8 years. Their professionalism and field knowledge are incomparable."
        },
        author: "Marie-Claire Dupont",
        company: "Voyages Authentiques"
      },
      {
        quote: {
          fr: "Les retours de nos clients sont toujours excellents. Une valeur sûre pour programmer la Mongolie.",
          en: "Feedback from our clients is always excellent. A safe bet for programming Mongolia."
        },
        author: "Thomas Weber",
        company: "Aventure Reisen GmbH"
      }
    ],
    certifications: ['Membre Nomadays', 'Travelife Partner', 'ATR - Agir pour un Tourisme Responsable'],
    images: {
      office: '/images/partners/horseback-adventure/office.jpg',
      team: '/images/partners/horseback-adventure/team.jpg',
      gallery: [
        '/images/partners/horseback-adventure/gallery-1.jpg',
        '/images/partners/horseback-adventure/gallery-2.jpg',
        '/images/partners/horseback-adventure/gallery-3.jpg',
        '/images/partners/horseback-adventure/gallery-4.jpg'
      ]
    },
    presentationVideo: {
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: { fr: 'Découvrez Horseback Mongolia', en: 'Discover Horseback Mongolia' }
    }
  },

  // ============== KYRGYZ'WHAT (Kirghizistan) ==============
  {
    partnerId: 'kyrgyzwhat',
    foundedYear: 2015,
    story: {
      fr: "Kyrgyz'What ? a été créé par Antoine, un passionné de montagne tombé amoureux du Kirghizistan lors d'un trek en 2012. Installé à Bichkek avec son équipe locale, il a développé une expertise unique des montagnes célestes.\n\nL'agence s'est construite autour d'une conviction : le Kirghizistan mérite d'être découvert autrement que comme une simple alternative à la Mongolie. C'est une destination à part entière, avec sa culture, ses paysages et son hospitalité légendaire.",
      en: "Kyrgyz'What? was created by Antoine, a mountain enthusiast who fell in love with Kyrgyzstan during a trek in 2012. Based in Bishkek with his local team, he has developed unique expertise of the celestial mountains.\n\nThe agency was built around a conviction: Kyrgyzstan deserves to be discovered as more than just an alternative to Mongolia. It's a destination in its own right, with its culture, landscapes and legendary hospitality."
    },
    mission: {
      fr: "Faire découvrir les trésors cachés du Kirghizistan à travers des voyages d'aventure responsables qui bénéficient aux communautés locales.",
      en: "Reveal the hidden treasures of Kyrgyzstan through responsible adventure travel that benefits local communities."
    },
    values: [
      {
        title: { fr: 'Aventure responsable', en: 'Responsible Adventure' },
        description: { fr: "Des treks qui respectent l'environnement et soutiennent les communautés.", en: "Treks that respect the environment and support communities." }
      },
      {
        title: { fr: 'Immersion locale', en: 'Local Immersion' },
        description: { fr: "Nuits chez l'habitant et rencontres authentiques.", en: "Homestays and authentic encounters." }
      },
      {
        title: { fr: 'Expertise montagne', en: 'Mountain Expertise' },
        description: { fr: "Guides certifiés et sécurité optimale en altitude.", en: "Certified guides and optimal safety at altitude." }
      }
    ],
    teamSize: 8,
    team: [
      {
        name: 'Antoine Girard',
        role: { fr: 'Fondateur & Directeur', en: 'Founder & Director' },
        photo: '/images/team/antoine-girard.jpg',
        bio: { fr: "Guide de haute montagne de formation, Antoine parcourt le Kirghizistan depuis plus de 10 ans.", en: "Trained as a high mountain guide, Antoine has been exploring Kyrgyzstan for over 10 years." }
      },
      {
        name: 'Aïgul',
        role: { fr: 'Responsable réservations', en: 'Reservations Manager' },
        photo: '/images/team/aigul.jpg',
        bio: { fr: "Kirghize parlant parfaitement français, Aïgul est le point de contact privilégié des agences partenaires.", en: "Kyrgyz fluent in French, Aïgul is the preferred contact for partner agencies." }
      }
    ],
    stats: {
      travelersPerYear: 280,
      yearsExperience: 9,
      satisfactionRate: 97
    },
    uniqueSellingPoints: {
      fr: [
        "Expertise trekking avec guides certifiés montagne",
        "Réseau unique de familles d'accueil en yourte",
        "Programmes testés et approuvés sur le terrain",
        "Petits groupes (max 10 personnes)",
        "Excellent rapport qualité-prix"
      ],
      en: [
        "Trekking expertise with certified mountain guides",
        "Unique network of yurt homestay families",
        "Field-tested and approved programs",
        "Small groups (max 10 people)",
        "Excellent value for money"
      ]
    },
    b2bServices: {
      fr: [
        "Tarifs B2B compétitifs",
        "Création de circuits sur-mesure",
        "Documentation complète pour vos ventes",
        "Webinaires de formation destination",
        "GIR à co-remplir en été"
      ],
      en: [
        "Competitive B2B rates",
        "Custom circuit creation",
        "Complete documentation for your sales",
        "Destination training webinars",
        "GIR for co-filling in summer"
      ]
    },
    certifications: ['Membre Nomadays', 'Community Based Tourism Kyrgyzstan'],
    images: {
      office: '/images/partners/kyrgyzwhat/office.jpg',
      team: '/images/partners/kyrgyzwhat/team.jpg',
      gallery: [
        '/images/partners/kyrgyzwhat/gallery-1.jpg',
        '/images/partners/kyrgyzwhat/gallery-2.jpg'
      ]
    }
  },

  // ============== GALAGO EXPEDITIONS (Kenya, Tanzanie, Ouganda) ==============
  {
    partnerId: 'galago-expeditions',
    foundedYear: 2005,
    story: {
      fr: "Galago Expeditions est née de la rencontre entre Jean-Pierre, guide naturaliste français, et Samuel, guide safari kenyan. Ensemble, ils ont fondé une agence qui combine expertise scientifique et connaissance intime du bush africain.\n\nBasée à Arusha avec des bureaux à Nairobi, l'agence s'est imposée comme une référence pour les safaris haut de gamme en Afrique de l'Est. Leur crédo : des safaris authentiques, en petit comité, guidés par les meilleurs professionnels de la région.",
      en: "Galago Expeditions was born from the meeting between Jean-Pierre, a French naturalist guide, and Samuel, a Kenyan safari guide. Together, they founded an agency that combines scientific expertise with intimate knowledge of the African bush.\n\nBased in Arusha with offices in Nairobi, the agency has established itself as a reference for high-end safaris in East Africa. Their credo: authentic safaris, in small groups, guided by the best professionals in the region."
    },
    mission: {
      fr: "Offrir des safaris d'exception qui émerveillent les voyageurs tout en contribuant à la conservation de la faune africaine.",
      en: "Offer exceptional safaris that amaze travelers while contributing to African wildlife conservation."
    },
    values: [
      {
        title: { fr: 'Excellence', en: 'Excellence' },
        description: { fr: "Des prestations haut de gamme et une attention aux détails.", en: "High-end services and attention to detail." }
      },
      {
        title: { fr: 'Conservation', en: 'Conservation' },
        description: { fr: "Soutien actif aux projets de protection de la faune.", en: "Active support for wildlife protection projects." }
      },
      {
        title: { fr: 'Expertise', en: 'Expertise' },
        description: { fr: "Guides naturalistes passionnés et expérimentés.", en: "Passionate and experienced naturalist guides." }
      }
    ],
    teamSize: 25,
    team: [
      {
        name: 'Jean-Pierre Moreau',
        role: { fr: 'Co-fondateur & Directeur France', en: 'Co-founder & France Director' },
        photo: '/images/team/jp-moreau.jpg'
      },
      {
        name: 'Samuel Kimani',
        role: { fr: 'Co-fondateur & Directeur opérations', en: 'Co-founder & Operations Director' },
        photo: '/images/team/samuel-kimani.jpg'
      }
    ],
    stats: {
      travelersPerYear: 800,
      yearsExperience: 19,
      satisfactionRate: 99,
      returnRate: 45
    },
    uniqueSellingPoints: {
      fr: [
        "Expertise de 20 ans sur le terrain",
        "Véhicules 4x4 privatifs spécialement aménagés",
        "Accès exclusif à des conservancies privés",
        "Guides francophones passionnés de faune",
        "Hébergements triés sur le volet"
      ],
      en: [
        "20 years of field expertise",
        "Private specially equipped 4x4 vehicles",
        "Exclusive access to private conservancies",
        "French-speaking guides passionate about wildlife",
        "Hand-picked accommodations"
      ]
    },
    b2bServices: {
      fr: [
        "Tarifs nets négociés avec les lodges",
        "GIR grande migration (juillet-octobre)",
        "Support commercial et PLV",
        "Eductours pour agences",
        "Disponibilité hébergements en temps réel"
      ],
      en: [
        "Net rates negotiated with lodges",
        "Great migration GIR (July-October)",
        "Sales support and POS materials",
        "Eductours for agencies",
        "Real-time accommodation availability"
      ]
    },
    testimonials: [
      {
        quote: {
          fr: "Galago est notre partenaire safari depuis 12 ans. Leur connaissance du terrain et leur réseau de lodges sont inégalés.",
          en: "Galago has been our safari partner for 12 years. Their field knowledge and lodge network are unmatched."
        },
        author: "Philippe Martin",
        company: "Safaris du Monde"
      }
    ],
    certifications: ['Membre Nomadays', 'KATO (Kenya Association of Tour Operators)', 'Eco-Tourism Kenya Gold'],
    images: {
      office: '/images/partners/galago-expeditions/office.jpg',
      team: '/images/partners/galago-expeditions/team.jpg',
      gallery: [
        '/images/partners/galago-expeditions/gallery-1.jpg',
        '/images/partners/galago-expeditions/gallery-2.jpg',
        '/images/partners/galago-expeditions/gallery-3.jpg'
      ]
    },
    presentationVideo: {
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: { fr: 'Safari avec Galago Expeditions', en: 'Safari with Galago Expeditions' }
    }
  },

  // ============== SAWA DISCOVERY (Thaïlande) ==============
  {
    partnerId: 'sawa-discovery',
    foundedYear: 2012,
    story: {
      fr: "Sawa Discovery a été fondée par Sophie et son mari thaïlandais Nattapong à Chiang Mai. Après 15 ans en Thaïlande, Sophie connaît le pays comme sa poche et a développé un réseau exceptionnel de contacts locaux.\n\nL'agence se distingue par sa capacité à créer des voyages sur-mesure qui révèlent la Thaïlande authentique, des montagnes du Nord aux îles du Sud, en passant par les temples et la street food de Bangkok.",
      en: "Sawa Discovery was founded by Sophie and her Thai husband Nattapong in Chiang Mai. After 15 years in Thailand, Sophie knows the country like the back of her hand and has developed an exceptional network of local contacts.\n\nThe agency stands out for its ability to create tailor-made trips that reveal authentic Thailand, from the northern mountains to the southern islands, through Bangkok's temples and street food."
    },
    mission: {
      fr: "Créer des voyages en Thaïlande qui combinent expériences authentiques, confort et service impeccable.",
      en: "Create trips to Thailand that combine authentic experiences, comfort and impeccable service."
    },
    values: [
      {
        title: { fr: 'Sur-mesure', en: 'Tailor-made' },
        description: { fr: "Chaque voyage est unique, créé selon vos souhaits.", en: "Each trip is unique, created according to your wishes." }
      },
      {
        title: { fr: 'Service', en: 'Service' },
        description: { fr: "Réactivité et disponibilité à chaque étape.", en: "Responsiveness and availability at every step." }
      },
      {
        title: { fr: 'Qualité', en: 'Quality' },
        description: { fr: "Sélection rigoureuse de tous les prestataires.", en: "Rigorous selection of all providers." }
      }
    ],
    teamSize: 10,
    team: [
      {
        name: 'Sophie Duval',
        role: { fr: 'Fondatrice & Directrice', en: 'Founder & Director' },
        photo: '/images/team/sophie-duval.jpg'
      },
      {
        name: 'Nattapong',
        role: { fr: 'Co-fondateur & Directeur local', en: 'Co-founder & Local Director' },
        photo: '/images/team/nattapong.jpg'
      }
    ],
    stats: {
      travelersPerYear: 600,
      yearsExperience: 12,
      satisfactionRate: 96
    },
    uniqueSellingPoints: {
      fr: [
        "Expertise locale de 15 ans",
        "Large gamme d'hébergements (du boutique-hôtel au resort 5*)",
        "Expériences exclusives (cours de cuisine, rencontres artisans)",
        "Parfaite maîtrise des combinés plage + culture",
        "Flexibilité totale sur les itinéraires"
      ],
      en: [
        "15 years of local expertise",
        "Wide range of accommodations (from boutique hotels to 5* resorts)",
        "Exclusive experiences (cooking classes, artisan meetings)",
        "Perfect mastery of beach + culture combos",
        "Total flexibility on itineraries"
      ]
    },
    b2bServices: {
      fr: [
        "Devis rapides sous 24h",
        "Tarifs B2B transparents",
        "GIR famille pendant les vacances scolaires",
        "Documentation commerciale personnalisée",
        "Formation destination en visio"
      ],
      en: [
        "Quick quotes within 24h",
        "Transparent B2B pricing",
        "Family GIR during school holidays",
        "Personalized sales documentation",
        "Destination training via video call"
      ]
    },
    certifications: ['Membre Nomadays', 'TAT Licensed'],
    images: {
      office: '/images/partners/sawa-discovery/office.jpg',
      team: '/images/partners/sawa-discovery/team.jpg',
      gallery: [
        '/images/partners/sawa-discovery/gallery-1.jpg',
        '/images/partners/sawa-discovery/gallery-2.jpg'
      ]
    }
  },

  // ============== MORPHO EVASIONS (Costa Rica) ==============
  {
    partnerId: 'morpho-evasions',
    foundedYear: 2010,
    story: {
      fr: "Morpho Evasions a été créée par Claire et Roberto, unis par leur passion pour la biodiversité du Costa Rica. Biologiste de formation, Claire s'est installée au Costa Rica en 2005 et a développé une expertise unique de l'écotourisme local.\n\nL'agence tire son nom du papillon Morpho, emblème du pays, et incarne la même philosophie : révéler la beauté fragile de la nature costaricienne à travers des voyages respectueux de l'environnement.",
      en: "Morpho Evasions was created by Claire and Roberto, united by their passion for Costa Rica's biodiversity. A trained biologist, Claire moved to Costa Rica in 2005 and developed unique expertise in local ecotourism.\n\nThe agency takes its name from the Morpho butterfly, the country's emblem, and embodies the same philosophy: revealing the fragile beauty of Costa Rican nature through environmentally friendly travel."
    },
    mission: {
      fr: "Faire découvrir la biodiversité exceptionnelle du Costa Rica tout en participant activement à sa préservation.",
      en: "Reveal Costa Rica's exceptional biodiversity while actively participating in its preservation."
    },
    values: [
      {
        title: { fr: 'Écotourisme', en: 'Ecotourism' },
        description: { fr: "Voyages à faible impact, prestataires certifiés.", en: "Low-impact travel, certified providers." }
      },
      {
        title: { fr: 'Expertise nature', en: 'Nature Expertise' },
        description: { fr: "Guides naturalistes passionnés de biodiversité.", en: "Naturalist guides passionate about biodiversity." }
      },
      {
        title: { fr: 'Famille', en: 'Family' },
        description: { fr: "Spécialiste des voyages en famille.", en: "Family travel specialist." }
      }
    ],
    teamSize: 7,
    team: [
      {
        name: 'Claire Bertrand',
        role: { fr: 'Fondatrice & Directrice', en: 'Founder & Director' },
        photo: '/images/team/claire-bertrand.jpg'
      },
      {
        name: 'Roberto',
        role: { fr: 'Co-fondateur & Guide en chef', en: 'Co-founder & Head Guide' },
        photo: '/images/team/roberto.jpg'
      }
    ],
    stats: {
      travelersPerYear: 350,
      yearsExperience: 14,
      satisfactionRate: 98
    },
    uniqueSellingPoints: {
      fr: [
        "Expertise écotourisme certifiée CST (Certification for Sustainable Tourism)",
        "Programmes famille éprouvés et sécurisés",
        "Partenariats avec réserves privées et projets de conservation",
        "Guides naturalistes bilingues",
        "Logistique parfaite (autotour ou chauffeur-guide)"
      ],
      en: [
        "CST certified ecotourism expertise",
        "Proven and safe family programs",
        "Partnerships with private reserves and conservation projects",
        "Bilingual naturalist guides",
        "Perfect logistics (self-drive or driver-guide)"
      ]
    },
    b2bServices: {
      fr: [
        "Tarifs nets avec marges confortables",
        "Spécialiste circuits famille",
        "Documentation pédagogique pour vos clients",
        "Disponibilités hébergements en direct",
        "Support commercial"
      ],
      en: [
        "Net rates with comfortable margins",
        "Family circuit specialist",
        "Educational documentation for your clients",
        "Direct accommodation availability",
        "Sales support"
      ]
    },
    certifications: ['Membre Nomadays', 'CST - Certification for Sustainable Tourism', 'Rainforest Alliance'],
    images: {
      office: '/images/partners/morpho-evasions/office.jpg',
      team: '/images/partners/morpho-evasions/team.jpg',
      gallery: [
        '/images/partners/morpho-evasions/gallery-1.jpg',
        '/images/partners/morpho-evasions/gallery-2.jpg'
      ]
    }
  }
];

// Helper function
export const getPartnerProfile = (partnerId: string): PartnerProfile | undefined => {
  return partnerProfiles.find(p => p.partnerId === partnerId);
};
