import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";

const orderBy = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("admin") === "true") {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.projectImage.findMany({ orderBy });
    return NextResponse.json(items);
  } catch (error) {
    logServerError("api.projectImages.GET", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 500;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to load project images.", status);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return jsonError("Invalid request payload.", 400);
    }

    const image = typeof data.image === "string" ? data.image.trim() : "";
    if (!image) return jsonError("Image is required.", 400);

    const title = typeof data.title === "string" ? data.title.trim() : "";
    const sortOrder = Number.parseInt(String((data as { sortOrder?: unknown }).sortOrder ?? 0), 10) || 0;

    const item = await prisma.projectImage.create({
      data: {
        title: title || "Project image",
        image,
        sortOrder,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    logServerError("api.projectImages.POST", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to create project image.", status);
  }
}