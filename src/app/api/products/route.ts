import { NextResponse } from "next/server";
import { listProducts, parseSort } from "@/lib/products";
import { diagnose } from "@/lib/setup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const data = await listProducts({
      search: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      sort: parseSort(searchParams.get("sort") ?? undefined),
      page: Number(searchParams.get("page") ?? 1),
      perPage: Number(searchParams.get("perPage") ?? 24),
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/products failed", error);
    const problem = diagnose(error);
    return NextResponse.json(
      problem.detailed
        ? { error: problem.title, detail: problem.summary, variables: problem.variables }
        : { error: "Failed to load products" },
      { status: 500 },
    );
  }
}
