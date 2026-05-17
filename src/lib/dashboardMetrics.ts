import type { Order, Product, RestaurantSettings, Review, TableInfo } from "@/lib/types";

type DashboardMetricInput = {
  orders: Order[];
  products: Product[];
  reviews: Review[];
  settings: RestaurantSettings;
  tables: TableInfo[];
};

export type DashboardMetrics = ReturnType<typeof getDashboardMetrics>;

function pluralize(count: number, singular: string, plural: string) {
  return count > 1 ? plural : singular;
}

function formatEstimatedSales(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRating(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function getDashboardMetrics({ orders, products, reviews, settings, tables }: DashboardMetricInput) {
  const serviceOrders = orders.filter((order) => order.serviceDate === settings.serviceDate);
  const ordersToAccept = orders.filter((order) => order.status === "new");
  const ordersToCollect = orders.filter((order) => order.status === "accepted" || order.status === "payment_pending");
  const reviewsToHandle = reviews.filter((review) => review.status !== "archived");
  const unavailableProducts = products.filter((product) => !product.available);
  const estimatedSales = serviceOrders.reduce((total, order) => total + order.total, 0);
  const averageRating = reviews.length > 0 ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0;
  const activeTables = tables.filter((table) => table.active);

  return {
    service: {
      isOpen: settings.serviceOpen,
      qrOrdersEnabled: settings.qrOrdersEnabled,
      onSitePaymentEnabled: settings.onSitePaymentEnabled,
    },
    tasks: {
      ordersToAccept: {
        count: ordersToAccept.length,
        label: pluralize(ordersToAccept.length, "commande à accepter", "commandes à accepter"),
      },
      ordersToCollect: {
        count: ordersToCollect.length,
        label: pluralize(ordersToCollect.length, "commande à encaisser", "commandes à encaisser"),
      },
      reviewsToHandle: {
        count: reviewsToHandle.length,
        label: pluralize(reviewsToHandle.length, "avis à traiter", "avis à traiter"),
      },
      unavailableProducts: {
        count: unavailableProducts.length,
        label: pluralize(unavailableProducts.length, "produit en rupture", "produits en rupture"),
      },
    },
    today: {
      ordersCount: serviceOrders.length,
      ordersLabel: pluralize(serviceOrders.length, "commande", "commandes"),
      estimatedSales: formatEstimatedSales(estimatedSales),
      averageRating: `${formatRating(averageRating)}/5`,
      activeTablesCount: activeTables.length,
      activeTablesLabel: pluralize(activeTables.length, "table active", "tables actives"),
    },
  };
}
