import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const newArrivals = searchParams.get("newArrivals");
  const admin = searchParams.get("admin") === "true";
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const shouldPaginate = pageParam !== null || pageSizeParam !== null;
  const page = Math.max(1, Number.parseInt(pageParam || "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(pageSizeParam || "10", 10) || 10));

  if (admin) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const where: Record<string, unknown> = admin ? {} : { isActive: true };
    if (category) where.category = { slug: category };
    if (featured === "true") where.isFeatured = true;
    if (newArrivals === "true") where.isNewArrival = true;

    if (shouldPaginate) {
      const [items, total] = await prisma.$transaction([
        prisma.product.findMany({
          where,
          include: { category: { select: { name: true, slug: true } } },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.product.count({ where }),
      ]);

      return NextResponse.json({ items, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    logServerError("api.products.GET", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 500;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to load products.", status);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const allowedUnits = ["MTR", "PCS", "FEET", "KG"];
    const unit = allowedUnits.includes(data.unit) ? data.unit : "PCS";
    const product = await prisma.product.create({
      data: {
        slug: data.slug,
        name: data.name,
        sku: data.sku,
        hsn: data.hsn || "",
        unit,
        stock: Number.isFinite(Number(data.stock)) ? Number(data.stock) : 0,
        description: data.description || "",
        pricePerMeter: data.pricePerMeter || "",
        specifications: JSON.stringify(data.specifications || {}),
        applications: JSON.stringify(data.applications || []),
        image: data.image || "",
        images: JSON.stringify(data.images || (data.image ? [data.image] : [])),
        isNewArrival: data.isNewArrival || false,
        isFeatured: data.isFeatured || false,
        isActive: data.isActive !== false,
        categoryId: data.categoryId,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    logServerError("api.products.POST", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to create product. Check the fields and try again.", status);
  }
}
