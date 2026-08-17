/**
 * The five top-level sections shown in the bottom navigation.
 *
 * The store has ~100 product categories, which is far too many to browse from
 * a phone. These five are the same groupings the website's own header uses, so
 * the mini app and vstorecenter.com stay consistent; everything else is
 * reachable underneath them as a subcategory.
 *
 * `slug` must match a real WooCommerce product_cat slug — it's what the
 * catalogue filters on.
 */
export type NavSection = {
  /** Label shown in the tab bar; kept short so five fit across a phone. */
  label: string;
  /** WooCommerce category slug this section maps to. */
  slug: string;
  icon: string;
};

export const NAV_SECTIONS: NavSection[] = [
  { label: "Laptop", slug: "laptop", icon: "laptop" },
  { label: "PC Parts", slug: "component", icon: "chip" },
  { label: "Gaming", slug: "gaming-gear", icon: "gamepad" },
  { label: "Network", slug: "network", icon: "wifi" },
  { label: "Used", slug: "used-product", icon: "tag" },
];

export function sectionForSlug(slug: string | undefined): NavSection | undefined {
  return slug ? NAV_SECTIONS.find((s) => s.slug === slug) : undefined;
}
