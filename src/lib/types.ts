export type ProductOptionItem = {
  id: string;
  name: string;
  price?: number;
};

export type ProductOptionGroup = {
  id: string;
  name: string;
  type: "single_choice" | "multiple_choice" | "supplement" | "formula" | "text";
  required: boolean;
  items: ProductOptionItem[];
};

export type ProductOptionsConfig = {
  groups: ProductOptionGroup[];
  allergens: string[];
  availability: {
    enabled: boolean;
    label?: string;
  };
};

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
  isAvailable?: boolean;
  outOfStock?: boolean;
  stockStatus?: string;
  status?: string;
  promoted?: boolean;
  featured?: boolean;
  promoPrice?: number;
  visual: string;
  imageUrl?: string;
  imageDataUrl?: string;
  allergens?: string[] | string;
  optionsConfig?: ProductOptionsConfig;
};

export type OrderLine = {
  productId: string;
  quantity: number;
  name?: string;
  unitPrice?: number;
};

export type Order = {
  id: string;
  orderNumber?: number;
  createdAt?: string;
  createdDate?: string;
  createdTime?: string;
  timeLabel?: string;
  table: number;
  tableId?: string;
  tableSlug?: string;
  tableName?: string;
  tableArea?: string;
  restaurantSlug?: string;
  status: OrderStatus;
  items: number;
  total: number;
  paid: boolean;
  paymentStatus?: "on_site_pending" | "paid" | "cancelled" | "not_paid";
  paymentMethod?: "on_site";
  customerNote?: string;
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
    style: "Classique" | "Moderne" | "Premium";
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
