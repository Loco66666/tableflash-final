import type { Category, Order, Product, RestaurantSettings, Review, TableInfo } from "@/lib/types";

export const restaurantSettings: RestaurantSettings = {
  restaurantName: "Le Bistrot des Halles",
  serviceLabel: "Service midi en cours",
  serviceOpen: true,
  qrOrdersEnabled: true,
  onSitePaymentEnabled: true,
  serviceDate: "2026-05-17",
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
  { id: "2018", table: 1, status: "new", items: 1, total: 13.5, paid: false, serviceDate: "2026-05-17" },
  { id: "2017", table: 4, status: "new", items: 2, total: 27, paid: false, serviceDate: "2026-05-17" },
  { id: "2016", table: 2, status: "payment_pending", items: 3, total: 31.5, paid: false, serviceDate: "2026-05-17" },
  { id: "2015", table: 5, status: "paid", items: 2, total: 42, paid: true, serviceDate: "2026-05-17" },
  { id: "2014", table: 3, status: "preparing", items: 4, total: 56, paid: true, serviceDate: "2026-05-17" },
  { id: "2013", table: 6, status: "ready", items: 2, total: 33, paid: true, serviceDate: "2026-05-17" },
  { id: "2012", table: 8, status: "served", items: 3, total: 48, paid: true, serviceDate: "2026-05-17" },
  { id: "2011", table: 9, status: "served", items: 2, total: 29, paid: true, serviceDate: "2026-05-17" },
  { id: "2010", table: 10, status: "served", items: 5, total: 66, paid: true, serviceDate: "2026-05-17" },
  { id: "2009", table: 11, status: "served", items: 3, total: 37.5, paid: true, serviceDate: "2026-05-17" },
  { id: "2008", table: 12, status: "served", items: 2, total: 24, paid: true, serviceDate: "2026-05-17" },
  { id: "2007", table: 13, status: "served", items: 4, total: 54.5, paid: true, serviceDate: "2026-05-17" },
  { id: "2006", table: 14, status: "served", items: 2, total: 28, paid: true, serviceDate: "2026-05-17" },
  { id: "2005", table: 15, status: "served", items: 3, total: 43, paid: true, serviceDate: "2026-05-17" },
  { id: "2004", table: 16, status: "served", items: 2, total: 35, paid: true, serviceDate: "2026-05-17" },
  { id: "2003", table: 17, status: "served", items: 5, total: 58, paid: true, serviceDate: "2026-05-17" },
  { id: "2002", table: 18, status: "served", items: 2, total: 18, paid: true, serviceDate: "2026-05-17" },
  { id: "2001", table: 19, status: "served", items: 4, total: 98, paid: true, serviceDate: "2026-05-17" },
  { id: "1999", table: 7, status: "served", items: 2, total: 22, paid: true, serviceDate: "2026-05-16" },
];

export const reviews: Review[] = [
  { id: "r1", customer: "Camille", rating: 5, table: 1, orderId: "2002", ageLabel: "Il y a 1 jour", status: "pending", suggestGoogle: true },
  { id: "r2", customer: "Julien", rating: 5, table: 3, orderId: "2001", ageLabel: "Il y a 2 jours", status: "archived", suggestGoogle: false },
  { id: "r3", customer: "Nora", rating: 5, table: 5, orderId: "2005", ageLabel: "Il y a 3 jours", status: "archived", suggestGoogle: true },
  { id: "r4", customer: "Hugo", rating: 5, table: 8, orderId: "2008", ageLabel: "Il y a 4 jours", status: "archived", suggestGoogle: true },
  { id: "r5", customer: "Inès", rating: 4, table: 9, orderId: "2009", ageLabel: "Il y a 5 jours", status: "archived", suggestGoogle: false },
];

export const tables: TableInfo[] = [
  { id: "t1", number: 1, area: "Salle", active: true, scans: 18 },
  { id: "t2", number: 2, area: "Terrasse", active: true, scans: 15 },
  { id: "t3", number: 3, area: "Salle", active: true, scans: 14 },
  { id: "t4", number: 4, area: "Salle", active: true, scans: 12 },
  { id: "t5", number: 5, area: "Terrasse", active: true, scans: 9 },
  { id: "t6", number: 6, area: "Salle", active: true, scans: 12 },
  { id: "t7", number: 7, area: "Salle", active: false, scans: 0 },
];
