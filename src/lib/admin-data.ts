export type AdminRestaurantStatus = "Actif" | "Essai gratuit" | "Suspendu";

export type AdminRestaurant = {
  id: string;
  name: string;
  status: AdminRestaurantStatus;
  owner: string;
  city: string;
  phone: string;
  email: string;
  plan: string;
  priceOrTrial: string;
  lastActivity: string;
  ordersToday: number;
  ordersTrend?: string;
  scansToday: number;
  scansTrend?: string;
};

export const adminRestaurants: AdminRestaurant[] = [
  { id: "le-bistronome", name: "Le Bistronome", status: "Actif", owner: "Jean Dupont", city: "Biarritz", phone: "06 24 73 77 45", email: "contact@lebistronome.fr", plan: "Premium", priceOrTrial: "49 € / mois", lastActivity: "Il y a 15 min", ordersToday: 18, ordersTrend: "+28% vs hier", scansToday: 125, scansTrend: "+18% vs hier" },
  { id: "chez-marius", name: "Chez Marius", status: "Actif", owner: "Marie Martin", city: "Bordeaux", phone: "06 11 22 33 44", email: "contact@chezmarius.fr", plan: "Standard", priceOrTrial: "29 € / mois", lastActivity: "Il y a 1 h", ordersToday: 12, ordersTrend: "+12% vs hier", scansToday: 86, scansTrend: "+9% vs hier" },
  { id: "la-table-verte", name: "La Table Verte", status: "Essai gratuit", owner: "Paul Bernard", city: "Lyon", phone: "06 55 66 77 88", email: "contact@latableverte.fr", plan: "Essai gratuit", priceOrTrial: "13 jours restants", lastActivity: "Il y a 2 h", ordersToday: 7, ordersTrend: "+5% vs hier", scansToday: 43, scansTrend: "+6% vs hier" },
  { id: "cafe-voltaire", name: "Café Voltaire", status: "Suspendu", owner: "Sophie Laurent", city: "Toulouse", phone: "06 33 44 55 66", email: "contact@cafevoltaire.fr", plan: "Standard", priceOrTrial: "29 € / mois", lastActivity: "Il y a 2 jours", ordersToday: 0, scansToday: 0 },
];

export const adminRequests = [
  { id: "1", restaurant: "Le Bistrot du Port", owner: "Jean Dupont", city: "Bayonne, France", phone: "06 12 34 56 78", email: "lebistrotduport@gmail.com", type: "Bistrot", source: "Google Recherche", date: "21 mai 2026, 10:32" },
  { id: "2", restaurant: "La Table Verte", owner: "Sophie Martin", city: "Biarritz, France", phone: "06 23 45 67 89", email: "latableverte@gmail.com", type: "Cuisine saine", source: "Bouche-à-oreille", date: "20 mai 2026, 14:18" },
  { id: "3", restaurant: "Sushi Ki", owner: "Hiroshi Tanaka", city: "Anglet, France", phone: "06 98 76 54 32", email: "sushiki.anglet@gmail.com", type: "Sushis", source: "Google Maps", date: "19 mai 2026, 09:41" },
];
