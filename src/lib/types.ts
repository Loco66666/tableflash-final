export type OrderStatus = "to_accept" | "paid" | "preparing" | "ready" | "served";

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
};

export type Order = {
  id: string;
  table: number;
  status: OrderStatus;
  items: number;
  total: number;
  paymentLabel: string;
  actionLabel: string;
};

export type Review = {
  id: string;
  customer: string;
  rating: 4 | 5;
  table: number;
  orderId: string;
  ageLabel: string;
  suggestGoogle: boolean;
};

export type RestaurantSettings = {
  restaurantName: string;
  serviceLabel: string;
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
