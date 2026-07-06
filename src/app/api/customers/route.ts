import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const shouldPaginate = pageParam !== null || pageSizeParam !== null;
  const page = Math.max(1, Number.parseInt(pageParam || "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(pageSizeParam || "10", 10) || 10));

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    if (shouldPaginate) {
      const [items, total] = await prisma.$transaction([
        prisma.customer.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.customer.count(),
      ]);

      return NextResponse.json({ items, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
    }

    const customers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(customers);
  } catch (error) {
    logServerError("api.customers.GET", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 500;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to load customers.", status);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json().catch(() => null);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return jsonError("Invalid request body.", 400);
    }

    const {
      name,
      contactPerson = "",
      phone,
      email,
      gstin = "",
      address = "",
      city = "",
      state = "",
      pincode = "",
    } = data as Record<string, unknown>;

    if (typeof name !== "string" || !name.trim() || typeof phone !== "string" || !phone.trim() || typeof email !== "string" || !email.trim()) {
      return jsonError("Name, phone, and email are required.", 400);
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        contactPerson: typeof contactPerson === "string" ? contactPerson.trim() : "",
        phone: phone.trim(),
        email: email.trim(),
        gstin: typeof gstin === "string" ? gstin.trim() : "",
        address: typeof address === "string" ? address.trim() : "",
        city: typeof city === "string" ? city.trim() : "",
        state: typeof state === "string" ? state.trim() : "",
        pincode: typeof pincode === "string" ? pincode.trim() : "",
      },
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    logServerError("api.customers.POST", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : `Unable to create customer. ${error instanceof Error ? error.message : ""}`, status);
  }
}
