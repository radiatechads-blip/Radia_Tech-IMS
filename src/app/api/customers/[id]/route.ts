import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(customer);
  } catch (error) {
    logServerError("api.customers.id.GET", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 500;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to load customer.", status);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

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

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (typeof email === "string" && email.trim() !== existingCustomer.email) {
      const conflict = await prisma.customer.findFirst({ where: { email: email.trim(), NOT: { id } } });
      if (conflict) {
        return NextResponse.json({ error: `Email "${email.trim()}" is already used by another customer.` }, { status: 400 });
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
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

    return NextResponse.json(customer);
  } catch (error) {
    logServerError("api.customers.id.PUT", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    const isPrismaUniqueError = typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002";
    return jsonError(
      status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : isPrismaUniqueError ? "A customer with that email already exists." : "Unable to update customer.",
      status,
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("api.customers.id.DELETE", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to delete customer.", status);
  }
}
