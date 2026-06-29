import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const item = await prisma.projectImage.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    logServerError("api.projectImages.id.GET", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 500;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to load project image.", status);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const data = await req.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return jsonError("Invalid request payload.", 400);
    }

    const image = typeof data.image === "string" ? data.image.trim() : "";
    if (!image) return jsonError("Image is required.", 400);

    const title = typeof data.title === "string" ? data.title.trim() : "";
    const sortOrder = Number.parseInt(String((data as { sortOrder?: unknown }).sortOrder ?? 0), 10) || 0;

    const item = await prisma.projectImage.update({
      where: { id },
      data: {
        title: title || "Project image",
        image,
        sortOrder,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    logServerError("api.projectImages.id.PUT", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to update project image.", status);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.projectImage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("api.projectImages.id.DELETE", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to delete project image.", status);
  }
}