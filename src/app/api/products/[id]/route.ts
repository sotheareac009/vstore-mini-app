import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";
import { diagnose } from "@/lib/setup";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  try {
    const product = await getProduct(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error(`GET /api/products/${id} failed`, error);
    const problem = diagnose(error);
    return NextResponse.json(
      problem.detailed
        ? { error: problem.title, detail: problem.summary, variables: problem.variables }
        : { error: "Failed to load product" },
      { status: 500 },
    );
  }
}
