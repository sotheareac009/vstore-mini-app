export type Product = {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  maxPrice: number;
  regularPrice: number | null;
  onSale: boolean;
  inStock: boolean;
  stockQuantity: number | null;
  totalSales: number;
  image: string | null;
  excerpt: string;
};

export type ProductDetail = Product & {
  description: string;
  gallery: string[];
  categories: { id: number; name: string; slug: string }[];
};

/** One step of a breadcrumb trail. Lives here, not in products.ts, so client
 *  components can import it without pulling in the server-only DB module. */
export type Crumb = { name: string; slug: string };

export type Category = {
  id: number;
  name: string;
  slug: string;
  count: number;
};

export type ProductPage = {
  items: Product[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
};

export const SORTS = ["newest", "price-asc", "price-desc", "popular"] as const;
export type Sort = (typeof SORTS)[number];

export type CartItem = {
  id: number;
  name: string;
  price: number;
  image: string | null;
  qty: number;
};

/** How the buyer wants to receive the order. */
export const FULFILMENTS = ["pickup", "delivery"] as const;
export type Fulfilment = (typeof FULFILMENTS)[number];

export const FULFILMENT_LABEL: Record<Fulfilment, string> = {
  pickup: "Pick Up",
  delivery: "Delivery",
};

/** What the checkout form collects. */
export type CheckoutDetails = {
  name: string;
  phone: string;
  address: string;
  fulfilment: Fulfilment;
  /** Telegram @username, filled in automatically when we know it. */
  telegramUser?: string;
};

export type OrderRequest = CheckoutDetails & {
  /** Only ids and quantities — prices are resolved server-side. */
  items: { id: number; qty: number }[];
};

/** Confirmed order, echoed back from WooCommerce. */
export type OrderResult = {
  number: string;
  total: string;
  currencySymbol: string;
  lines: { name: string; qty: number; total: string }[];
};
