export type OrderStatus = "new" | "accepted" | "payment_pending" | "paid" | "preparing" | "ready" | "served" | "refused";

export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  price: number;
  available: boolean;
  promoted?: boolean;
  visual: string;
  imageUrl?: string;
};

export type Order = {
  id: string;
  table: number;
  status: OrderStatus;
  items: number;
  total: number;
  paid: boolean;
  serviceDate: string;
};

export type Review = {
  id: string;
  customer: string;
  rating: 1 | 2 | 3 | 4 | 5;
  table: number;
  orderId: string;
  ageLabel: string;
  status: "pending" | "archived";
  suggestGoogle: boolean;
};

export type RestaurantSettings = {
  restaurantName: string;
  serviceLabel: string;
  serviceOpen: boolean;
  qrOrdersEnabled: boolean;
  onSitePaymentEnabled: boolean;
  serviceDate: string;
  address: string;
  phone: string;
  googleReviewLabel: string;
};

export type TableInfo = {
  id: string;
  number: number;
  area: string;
  active: boolean;
  scans: number;
};
