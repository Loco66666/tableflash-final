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

export type OrderLine = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  table: number;
  status: OrderStatus;
  items: number;
  total: number;
  paid: boolean;
  serviceDate: string;
  serviceTime?: string;
  service?: "midi" | "soir";
  lines?: OrderLine[];
  source?: "qr" | "service";
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
  text?: string;
  response?: string;
  responseSaved?: boolean;
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
  googleReviewUrl: string;
  publicSlug: string;
  city: string;
  email: string;
  website: string;
  hours: {
    automaticMode: boolean;
    lunchStart: string;
    lunchEnd: string;
    dinnerStart: string;
    dinnerEnd: string;
    openDays: string[];
  };
  ordersSettings: {
    acceptanceMode: "automatic" | "manual";
    onSitePaymentEnabled: boolean;
    customerMessage: string;
    customerTrackingEnabled: boolean;
  };
  qr: {
    instruction: string;
    showTableName: boolean;
    publicRestaurantLink: string;
  };
  reviewsSettings: {
    enabledAfterMeal: boolean;
    googleReviewUrl: string;
    suggestGoogleOnPositive: boolean;
  };
  appearance: {
    style: "Classique premium" | "Chaleureux" | "Moderne";
    primaryColor: string;
  };
};

export type TableInfo = {
  id: string;
  slug: string;
  name: string;
  area: string;
  isActive: boolean;
  scans: number;
};
