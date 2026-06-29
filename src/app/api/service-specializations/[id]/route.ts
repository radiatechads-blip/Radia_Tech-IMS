import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);

  try {
    const { id } = await params;
    const data = await req.json();
    const title = typeof data?.title === "string" ? data.title.trim() : "";
    const shortDescription = typeof data?.shortDescription === "string" ? data.shortDescription.trim() : "";
    const fullDescription = typeof data?.fullDescription === "string" ? data.fullDescription.trim() : "";
    const image = typeof data?.image === "string" ? data.image.trim() : "";

    if (!title || !shortDescription || !fullDescription) {
      return jsonError("Title, short description, and full description are required.", 400);
    }

    const updated = await prisma.serviceSpecialization.update({
      where: { id },
      data: {
        title,
        shortDescription,
        fullDescription,
        image,
        sortOrder: Number(data?.sortOrder ?? 0),
        isActive: data?.isActive !== false,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logServerError("api.serviceSpecializations.PUT", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to update specialisation.", status);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);

  try {
    const { id } = await params;
    await prisma.serviceSpecialization.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("api.serviceSpecializations.DELETE", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to delete specialisation.", status);
  }
}
