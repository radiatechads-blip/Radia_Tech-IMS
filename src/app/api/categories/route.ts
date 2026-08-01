import { categories as fallbackCategories } from "@/data/products";
import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function buildFallbackCategories() {
  return fallbackCategories.map((category, index) => ({
    id: `fallback-${index + 1}`,
    slug: category.slug,
    name: category.name,
    description: category.description,
    image: category.image,
    sortOrder: index + 1,
    _count: { products: category.productCount },
  }));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeProducts = searchParams.get("includeProducts") === "true";

    const categories = await prisma.productCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: includeProducts
        ? { products: { where: { isActive: true }, orderBy: { createdAt: "desc" } }, _count: { select: { products: true } } }
        : { _count: { select: { products: true } } },
    });
    return NextResponse.json(categories);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(buildFallbackCategories());
    }

    logServerError("api.categories.GET", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 500;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to load categories.", status);
  }
}

function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const slug = sanitizeSlug(data.slug || data.name);

    if (!slug) {
      return jsonError("Category name is required.", 400);
    }

    // Check for existing slug before inserting to give a clear error
    const existing = await prisma.productCategory.findUnique({ where: { slug } });
    if (existing) {
      return jsonError(`A category with slug "${slug}" already exists (name: "${existing.name}"). Please use a different name or edit the existing category.`, 400);
    }

    const category = await prisma.productCategory.create({
      data: {
        slug,
        name: data.name,
        description: data.description || "",
        image: data.image || "",
        sortOrder: data.sortOrder || 0,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    logServerError("api.categories.POST", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    // P2002 = unique constraint — give a helpful message even if the pre-check missed a race condition
    const isPrismaUniqueError = typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002";
    return jsonError(
      status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : isPrismaUniqueError ? "A category with that name already exists. Please choose a different name." : "Unable to create category. Check the fields and try again.",
      status,
    );
  }
}
