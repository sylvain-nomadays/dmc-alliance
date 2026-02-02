// Coordonnées GPS des destinations pour la carte interactive

export interface DestinationCoords {
  slug: string;
  lat: number;
  lng: number;
  // Point représentatif du pays (capitale ou ville principale)
}

export const destinationCoordinates: Record<string, DestinationCoords> = {
  // ============== ASIE ==============
  mongolie: { slug: 'mongolie', lat: 47.9212, lng: 106.9037 }, // Oulan-Bator
  kirghizistan: { slug: 'kirghizistan', lat: 42.8746, lng: 74.5698 }, // Bichkek
  thailande: { slug: 'thailande', lat: 13.7563, lng: 100.5018 }, // Bangkok
  cambodge: { slug: 'cambodge', lat: 13.3671, lng: 103.8448 }, // Siem Reap (Angkor)
  japon: { slug: 'japon', lat: 35.6762, lng: 139.6503 }, // Tokyo
  'coree-du-sud': { slug: 'coree-du-sud', lat: 37.5665, lng: 126.978 }, // Séoul
  indonesie: { slug: 'indonesie', lat: -8.3405, lng: 115.092 }, // Bali
  'sri-lanka': { slug: 'sri-lanka', lat: 7.8731, lng: 80.7718 }, // Centre Sri Lanka
  vietnam: { slug: 'vietnam', lat: 21.0285, lng: 105.8542 }, // Hanoi
  ouzbekistan: { slug: 'ouzbekistan', lat: 39.6547, lng: 66.9597 }, // Samarcande

  // ============== AFRIQUE ==============
  kenya: { slug: 'kenya', lat: -1.2864, lng: 36.8172 }, // Nairobi
  tanzanie: { slug: 'tanzanie', lat: -3.3869, lng: 36.6829 }, // Arusha
  ouganda: { slug: 'ouganda', lat: 0.3476, lng: 32.5825 }, // Kampala
  madagascar: { slug: 'madagascar', lat: -18.8792, lng: 47.5079 }, // Antananarivo
  mauritanie: { slug: 'mauritanie', lat: 20.4659, lng: -13.05 }, // Chinguetti
  algerie: { slug: 'algerie', lat: 22.79, lng: 5.52 }, // Tassili
  namibie: { slug: 'namibie', lat: -24.7073, lng: 15.5 }, // Sossusvlei
  egypte: { slug: 'egypte', lat: 29.9792, lng: 31.1342 }, // Pyramides de Gizeh

  // ============== MOYEN-ORIENT ==============
  jordanie: { slug: 'jordanie', lat: 30.3285, lng: 35.4444 }, // Petra

  // ============== EUROPE ==============
  albanie: { slug: 'albanie', lat: 40.4167, lng: 19.8317 }, // Gjirokastër
  croatie: { slug: 'croatie', lat: 42.6507, lng: 18.0944 }, // Dubrovnik
  slovenie: { slug: 'slovenie', lat: 46.3639, lng: 14.0942 }, // Bled
  kosovo: { slug: 'kosovo', lat: 42.5833, lng: 20.8833 }, // Prizren
  'macedoine-du-nord': { slug: 'macedoine-du-nord', lat: 41.1171, lng: 20.8019 }, // Ohrid
  montenegro: { slug: 'montenegro', lat: 42.4247, lng: 18.7712 }, // Kotor
  roumanie: { slug: 'roumanie', lat: 45.7489, lng: 25.3146 }, // Brașov (Transylvanie)
  ecosse: { slug: 'ecosse', lat: 57.4778, lng: -4.2247 }, // Inverness (Highlands)
  irlande: { slug: 'irlande', lat: 53.2707, lng: -9.0568 }, // Galway
  'pays-de-galles': { slug: 'pays-de-galles', lat: 53.0685, lng: -4.0763 }, // Snowdonia

  // ============== AMÉRIQUES ==============
  'costa-rica': { slug: 'costa-rica', lat: 10.4231, lng: -84.0016 }, // Arenal
  perou: { slug: 'perou', lat: -13.1631, lng: -72.545 }, // Machu Picchu
};

export const getCoordinates = (slug: string): DestinationCoords | undefined => {
  return destinationCoordinates[slug];
};

export const getAllCoordinates = (): DestinationCoords[] => {
  return Object.values(destinationCoordinates);
};
