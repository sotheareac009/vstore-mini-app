import { NextResponse } from "next/server";
import { getSubcategories } from "@/lib/products";
import { sectionForSlug } from "@/lib/nav";

export const dynamic = "force-dynamic";

/**
 * Subcategories for one bottom-nav section.
 *
 * Loaded on demand rather than with every page so the layout can stay static;
 * the nav caches each section after the first open.
 */
export async function GET(request: Request) {
  const section = new URL(request.url).searchParams.get("section") ?? "";

  // Only the five known sections — this shouldn't become an open category API.
  if (!sectionForSlug(section)) {
    return NextResponse.json({ error: "Unknown section" }, { status: 404 });
  }

  try {
    return NextResponse.json({ items: await getSubcategories(section) });
  } catch (error) {
    console.error(`GET /api/categories?section=${section} failed`, error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
