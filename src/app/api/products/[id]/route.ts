import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { name: true, slug: true } } },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    logServerError("api.products.id.GET", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 500;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to load product.", status);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await req.json();
  const allowedUnits = ["MTR", "PCS", "FEET", "KG"];
  const updateData = {
    slug: data.slug,
    name: data.name,
    sku: data.sku,
    hsn: data.hsn || "",
    unit: allowedUnits.includes(data.unit) ? data.unit : "PCS",
    stock: Number.isFinite(Number(data.stock)) ? Number(data.stock) : 0,
    description: data.description,
    pricePerMeter: data.pricePerMeter || "",
    specifications: typeof data.specifications === "string" ? data.specifications : JSON.stringify(data.specifications || {}),
    applications: typeof data.applications === "string" ? data.applications : JSON.stringify(data.applications || []),
    image: data.image || "",
    images: typeof data.images === "string" ? data.images : JSON.stringify(data.images || (data.image ? [data.image] : [])),
    isNewArrival: Boolean(data.isNewArrival),
    isFeatured: Boolean(data.isFeatured),
    isActive: data.isActive !== false,
    categoryId: data.categoryId,
  };

  try {
    const product = await prisma.product.update({ where: { id }, data: updateData });
    return NextResponse.json(product);
  } catch (error) {
    logServerError("api.products.id.PUT", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to update product.", status);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("api.products.id.DELETE", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to delete product.", status);
  }
}
