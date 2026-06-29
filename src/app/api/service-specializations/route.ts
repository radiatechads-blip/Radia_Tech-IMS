import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publicOnly = searchParams.get("public") === "true";

    const items = await prisma.serviceSpecialization.findMany({
      where: publicOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    logServerError("api.serviceSpecializations.GET", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 500;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to load specialisations.", status);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);

  try {
    const data = await req.json();
    const title = typeof data?.title === "string" ? data.title.trim() : "";
    const shortDescription = typeof data?.shortDescription === "string" ? data.shortDescription.trim() : "";
    const fullDescription = typeof data?.fullDescription === "string" ? data.fullDescription.trim() : "";
    const image = typeof data?.image === "string" ? data.image.trim() : "";

    if (!title || !shortDescription || !fullDescription) {
      return jsonError("Title, short description, and full description are required.", 400);
    }

    const item = await prisma.serviceSpecialization.create({
      data: {
        title,
        shortDescription,
        fullDescription,
        image,
        sortOrder: Number(data?.sortOrder ?? 0),
        isActive: data?.isActive !== false,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    logServerError("api.serviceSpecializations.POST", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to create specialisation.", status);
  }
}
