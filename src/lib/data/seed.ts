import type { Category, Order, Product, RestaurantSettings, Review, TableInfo } from "@/lib/types";

export const restaurantSettings: RestaurantSettings = {
  restaurantName: "Le Bistrot des Halles",
  serviceLabel: "Service midi en cours",
  address: "12 rue des Halles, Paris",
  phone: "01 42 00 00 00",
  googleReviewLabel: "Lien Google Avis",
};

export const categories: Category[] = [
  { id: "all", name: "Toutes", icon: "sparkles" },
  { id: "starters", name: "Entrées", icon: "leaf" },
  { id: "mains", name: "Plats", icon: "utensils" },
  { id: "desserts", name: "Desserts", icon: "cake" },
  { id: "drinks", name: "Boissons", icon: "cup" },
];

export const products: Product[] = [
  {
    id: "p1",
    name: "Salade César",
    categoryId: "starters",
    description: "Laitue romaine, poulet grillé, parmesan, croûtons, sauce César.",
    price: 12.5,
    available: true,
    promoted: true,
    visual: "salad",
  },
  {
    id: "p2",
    name: "Burger maison",
    categoryId: "mains",
    description: "Steak haché, cheddar, salade, tomate, oignons rouges, sauce maison, frites.",
    price: 15.9,
    available: true,
    visual: "burger",
  },
  {
    id: "p3",
    name: "Tiramisu",
    categoryId: "desserts",
    description: "Crème mascarpone, biscuits imbibés de café, cacao.",
    price: 6.5,
    available: false,
    visual: "dessert",
  },
];

export const orders: Order[] = [
  { id: "2018", table: 1, status: "to_accept", items: 1, total: 13.5, paymentLabel: "À payer", actionLabel: "Accepter" },
  { id: "2017", table: 4, status: "paid", items: 2, total: 27, paymentLabel: "Payée", actionLabel: "Lancer préparation" },
  { id: "2016", table: 2, status: "preparing", items: 3, total: 31.5, paymentLabel: "En préparation", actionLabel: "Marquer prête" },
];

export const reviews: Review[] = [
  { id: "r1", customer: "Camille", rating: 5, table: 1, orderId: "2002", ageLabel: "Il y a 1 jour", suggestGoogle: true },
  { id: "r2", customer: "Julien", rating: 4, table: 3, orderId: "2001", ageLabel: "Il y a 2 jours", suggestGoogle: false },
];

export const tables: TableInfo[] = [
  { id: "t1", number: 1, area: "Salle", active: true, scans: 18 },
  { id: "t2", number: 2, area: "Terrasse", active: true, scans: 15 },
  { id: "t6", number: 6, area: "Salle", active: false, scans: 7 },
];

export const todayStats = [
  { label: "commandes", value: "18", icon: "basket" },
  { label: "ventes estimées", value: "642 €", icon: "euro" },
  { label: "avis clients", value: "4,8/5", icon: "star" },
  { label: "tables actives", value: "6", icon: "table" },
];
