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
