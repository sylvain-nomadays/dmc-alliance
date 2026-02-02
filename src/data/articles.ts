export interface Article {
  id: string;
  slug: string;
  title: {
    fr: string;
    en: string;
  };
  excerpt: {
    fr: string;
    en: string;
  };
  content?: {
    fr: string;
    en: string;
  };
  image: string;
  category: 'destinations' | 'trends' | 'tips' | 'partners' | 'gir';
  author: {
    name: string;
    role: {
      fr: string;
      en: string;
    };
    avatar: string;
  };
  publishedAt: string;
  readTime: number; // in minutes
  featured?: boolean;
  tags: string[];
}

export const categories = {
  destinations: {
    name: { fr: 'Destinations', en: 'Destinations' },
    color: 'terracotta',
  },
  trends: {
    name: { fr: 'Tendances', en: 'Trends' },
    color: 'deep-blue',
  },
  tips: {
    name: { fr: 'Conseils pros', en: 'Pro tips' },
    color: 'sage',
  },
  partners: {
    name: { fr: 'Partenaires', en: 'Partners' },
    color: 'terracotta',
  },
  gir: {
    name: { fr: 'Circuits GIR', en: 'GIR Tours' },
    color: 'deep-blue',
  },
};

export const articles: Article[] = [
  {
    id: '1',
    slug: 'mongolie-destination-tendance-2024',
    title: {
      fr: 'Mongolie : la destination tendance de 2024',
      en: 'Mongolia: the trending destination of 2024',
    },
    excerpt: {
      fr: 'Découvrez pourquoi la Mongolie attire de plus en plus de voyageurs en quête d\'authenticité et comment programmer cette destination unique.',
      en: 'Discover why Mongolia is attracting more and more travelers seeking authenticity and how to program this unique destination.',
    },
    image: '/images/magazine/mongolie-tendance.jpg',
    category: 'destinations',
    author: {
      name: 'Arnaud Delacroix',
      role: { fr: 'Fondateur, Horseback Adventure', en: 'Founder, Horseback Adventure' },
      avatar: '/images/team/arnaud.jpg',
    },
    publishedAt: '2024-01-15',
    readTime: 8,
    featured: true,
    tags: ['mongolie', 'asie', 'tendances', 'aventure'],
  },
  {
    id: '2',
    slug: 'gir-co-remplissage-guide-complet',
    title: {
      fr: 'GIR Co-remplissage : le guide complet pour les agences',
      en: 'GIR Co-fill: the complete guide for agencies',
    },
    excerpt: {
      fr: 'Tout ce que vous devez savoir sur le système GIR : fonctionnement, avantages et comment maximiser vos commissions.',
      en: 'Everything you need to know about the GIR system: how it works, benefits, and how to maximize your commissions.',
    },
    image: '/images/magazine/gir-guide.jpg',
    category: 'tips',
    author: {
      name: 'Marie Dupont',
      role: { fr: 'Directrice commerciale', en: 'Sales Director' },
      avatar: '/images/team/marie.jpg',
    },
    publishedAt: '2024-01-10',
    readTime: 12,
    featured: true,
    tags: ['gir', 'commission', 'b2b', 'guide'],
  },
  {
    id: '3',
    slug: 'grande-migration-kenya-tanzanie',
    title: {
      fr: 'Grande Migration : Kenya ou Tanzanie ?',
      en: 'Great Migration: Kenya or Tanzania?',
    },
    excerpt: {
      fr: 'Comparatif détaillé pour aider vos clients à choisir la meilleure option pour observer ce spectacle naturel unique.',
      en: 'Detailed comparison to help your clients choose the best option to observe this unique natural spectacle.',
    },
    image: '/images/magazine/migration-comparatif.jpg',
    category: 'destinations',
    author: {
      name: 'Pierre Martin',
      role: { fr: 'Expert Afrique, Galago Expeditions', en: 'Africa Expert, Galago Expeditions' },
      avatar: '/images/team/pierre.jpg',
    },
    publishedAt: '2024-01-05',
    readTime: 10,
    tags: ['kenya', 'tanzanie', 'safari', 'migration'],
  },
  {
    id: '4',
    slug: 'tourisme-durable-asie-centrale',
    title: {
      fr: 'Tourisme durable en Asie Centrale : nos engagements',
      en: 'Sustainable tourism in Central Asia: our commitments',
    },
    excerpt: {
      fr: 'Comment nos partenaires locaux s\'engagent pour un tourisme responsable au Kirghizistan et dans la région.',
      en: 'How our local partners are committed to responsible tourism in Kyrgyzstan and the region.',
    },
    image: '/images/magazine/tourisme-durable.jpg',
    category: 'trends',
    author: {
      name: 'Sophie Laurent',
      role: { fr: 'Co-fondatrice, Kyrgyz\'What?', en: 'Co-founder, Kyrgyz\'What?' },
      avatar: '/images/team/sophie.jpg',
    },
    publishedAt: '2023-12-20',
    readTime: 7,
    tags: ['kirghizistan', 'durable', 'responsable', 'asie-centrale'],
  },
  {
    id: '5',
    slug: 'nouveaux-partenaires-amerique-latine',
    title: {
      fr: 'Bienvenue à nos nouveaux partenaires en Amérique Latine',
      en: 'Welcome to our new partners in Latin America',
    },
    excerpt: {
      fr: 'Découvrez Morpho Evasions et nos nouveaux réceptifs au Costa Rica, Panama et Colombie.',
      en: 'Discover Morpho Evasions and our new DMCs in Costa Rica, Panama and Colombia.',
    },
    image: '/images/magazine/amerique-latine.jpg',
    category: 'partners',
    author: {
      name: 'Jean-Marc Rousseau',
      role: { fr: 'Directeur partenariats', en: 'Partnerships Director' },
      avatar: '/images/team/jeanmarc.jpg',
    },
    publishedAt: '2023-12-15',
    readTime: 5,
    tags: ['costa-rica', 'panama', 'colombie', 'partenaires'],
  },
  {
    id: '6',
    slug: 'preparer-saison-ete-2024',
    title: {
      fr: 'Comment bien préparer la saison été 2024',
      en: 'How to prepare for summer 2024 season',
    },
    excerpt: {
      fr: 'Nos conseils pour anticiper les tendances, optimiser vos stocks GIR et satisfaire vos clients cet été.',
      en: 'Our tips to anticipate trends, optimize your GIR inventory and satisfy your customers this summer.',
    },
    image: '/images/magazine/saison-ete.jpg',
    category: 'tips',
    author: {
      name: 'Marie Dupont',
      role: { fr: 'Directrice commerciale', en: 'Sales Director' },
      avatar: '/images/team/marie.jpg',
    },
    publishedAt: '2023-12-10',
    readTime: 6,
    tags: ['été', 'planification', 'conseils', 'gir'],
  },
  {
    id: '7',
    slug: 'nouveaux-gir-printemps-2024',
    title: {
      fr: 'Nouveaux circuits GIR : printemps 2024',
      en: 'New GIR tours: spring 2024',
    },
    excerpt: {
      fr: 'Découvrez notre nouvelle programmation GIR pour le printemps : Mongolie, Kirghizistan, Oman et Madagascar.',
      en: 'Discover our new GIR programming for spring: Mongolia, Kyrgyzstan, Oman and Madagascar.',
    },
    image: '/images/magazine/nouveaux-gir.jpg',
    category: 'gir',
    author: {
      name: 'Jean-Marc Rousseau',
      role: { fr: 'Directeur partenariats', en: 'Partnerships Director' },
      avatar: '/images/team/jeanmarc.jpg',
    },
    publishedAt: '2023-12-05',
    readTime: 4,
    featured: true,
    tags: ['gir', 'printemps', 'nouveautés', 'programmation'],
  },
  {
    id: '8',
    slug: 'interview-sawa-discovery-madagascar',
    title: {
      fr: 'Interview : Sawa Discovery révèle les secrets de Madagascar',
      en: 'Interview: Sawa Discovery reveals the secrets of Madagascar',
    },
    excerpt: {
      fr: 'Rencontre avec notre partenaire malgache pour découvrir les trésors cachés de la Grande Île.',
      en: 'Meeting with our Malagasy partner to discover the hidden treasures of the Big Island.',
    },
    image: '/images/magazine/madagascar-interview.jpg',
    category: 'partners',
    author: {
      name: 'Équipe DMC Alliance',
      role: { fr: 'Rédaction', en: 'Editorial Team' },
      avatar: '/images/team/dmc-logo.jpg',
    },
    publishedAt: '2023-11-28',
    readTime: 9,
    tags: ['madagascar', 'partenaires', 'interview', 'afrique'],
  },
];

export const getFeaturedArticles = () => articles.filter((a) => a.featured);

export const getArticlesByCategory = (category: Article['category']) =>
  articles.filter((a) => a.category === category);

export const getArticleBySlug = (slug: string) =>
  articles.find((a) => a.slug === slug);

export const getRecentArticles = (count: number = 6) =>
  [...articles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, count);
