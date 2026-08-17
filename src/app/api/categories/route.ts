import { NextResponse } from "next/server";
import { getNavTree, getSubcategories } from "@/lib/products";
import { NAV_SECTIONS, sectionForSlug } from "@/lib/nav";

export const dynamic = "force-dynamic";

/**
 * Subcategories for the bottom navigation.
 *
 * Without `?section=`, returns the map for all five sections in one query —
 * the nav needs the whole thing to know which tab owns the current filter.
 */
export async function GET(request: Request) {
  const section = new URL(request.url).searchParams.get("section");

  try {
    if (section === null) {
      return NextResponse.json({ sections: await getNavTree(NAV_SECTIONS.map((s) => s.slug)) });
    }

    // Only the five known sections — this shouldn't become an open category API.
    if (!sectionForSlug(section)) {
      return NextResponse.json({ error: "Unknown section" }, { status: 404 });
    }

    return NextResponse.json({ items: await getSubcategories(section) });
  } catch (error) {
    console.error("GET /api/categories failed", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
