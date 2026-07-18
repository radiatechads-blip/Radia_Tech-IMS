import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type DocumentType = "invoice" | "proforma" | "annexure" | "quotation";

function normalizeDocumentType(data: Record<string, unknown>): DocumentType {
  const explicit = String(data.documentType || data.billType || "").trim().toLowerCase();
  if (explicit.includes("proforma")) return "proforma";
  if (explicit.includes("annexure") || explicit.includes("long")) return "annexure";
  if (explicit.includes("quotation") || explicit.startsWith("qtn")) return "quotation";
  return "invoice";
}

function buildInvoicePayload(data: Record<string, unknown>, documentType: DocumentType) {
  const invoiceNumber = String(data.invoiceNumber || data.annexureNumber || "").trim();
  if (!invoiceNumber) {
    throw new Error("Invoice number is required.");
  }

  const invoiceDateValue = String(data.invoiceDate || data.annexureDate || "").trim();
  const invoiceDate = invoiceDateValue ? new Date(invoiceDateValue) : null;
  if (!invoiceDate || Number.isNaN(invoiceDate.getTime())) {
    throw new Error("Valid invoice date is required.");
  }

  const dueDateValue = String(data.dueDate || "").trim();
  const dueDate = dueDateValue ? new Date(dueDateValue) : null;

  const poDateValue = String(data.poDate || "").trim();
  const poDate = poDateValue ? new Date(poDateValue) : null;

  const extraDiscountAmountValue = Number(data.extraDiscountAmount || 0);

  const payload = {
    documentType,
    billType:
      documentType === "proforma"
        ? "Proforma Invoice"
        : documentType === "annexure"
          ? "Annexure"
          : documentType === "quotation"
            ? "Quotation"
            : "Invoice",
    invoiceNumber,
    invoiceDate,
    dueDate,
    partyName: String(data.partyName || "").trim(),
    contactPerson: String(data.contactPerson || "").trim(),
    email: String(data.email || "").trim(),
    gstin: String(data.gstin || "").trim(),
    phone: String(data.phone || "").trim(),
    city: String(data.city || "").trim(),
    pincode: String(data.pincode || "").trim(),
    state: String(data.state || "").trim(),
    address: String(data.address || "").trim(),
    poDate,
    ewayBillNo: String(data.ewayBillNo || "").trim(),
    poNo: String(data.poNo || "").trim(),
    placeOfSupply: String(data.placeOfSupply || "").trim(),
    shipToAddress: String(data.shipToAddress || "").trim(),
    transportName: String(data.transportName || "").trim(),
    vehicleNumber: String(data.vehicleNumber || "").trim(),
    taxType: String(data.taxType || "cgst-sgst").trim(),
    paymentMode: String(data.paymentMode || "").trim(),
    notes: String(data.notes || "").trim(),
    terms: String(data.terms || "").trim(),
    bankDetails: String(data.bankDetails || "").trim(),
    authorizedSignature: String(data.authorizedSignature || "").trim(),
    subtotal: Number(data.subtotal || 0),
    discountTotal: Number(data.discountTotal || 0),
    extraDiscountAmount: Number.isFinite(extraDiscountAmountValue) ? extraDiscountAmountValue : 0,
    taxableAmount: Number(data.taxableAmount || 0),
    taxAmount: Number(data.taxAmount || 0),
    grandTotal: Number(data.grandTotal || 0),
  };

  if (documentType !== "annexure") {
    return {
      ...payload,
      roundOff: Number(data.roundOff || 0),
    };
  }

  return payload;
}

async function createDocumentRecord(data: Record<string, unknown>, documentType: DocumentType) {
  const payload = buildInvoicePayload(data, documentType);
  if (documentType === "proforma") {
    const created = await prisma.proformaInvoice.create({
      data: {
        ...payload,
        invoiceDate: payload.invoiceDate,
        dueDate: payload.dueDate,
        poDate: payload.poDate,
        items: {
          create: Array.isArray(data.items)
            ? data.items.map((item: Record<string, unknown>) => ({
                description: String(item.description || "").trim(),
                hsn: String(item.hsn || "").trim(),
                unit: String(item.unit || "").trim(),
                qty: Number(item.qty || 0),
                rate: Number(item.rate || 0),
                taxPercent: Number(item.taxPercent || 0),
                discountPercent: Number(item.discountPercent || 0),
                taxablePerUnit: Number(item.taxablePerUnit || 0),
                taxableAmount: Number(item.taxableAmount || 0),
                gstAmount: Number(item.gstAmount || 0),
                finalRatePerUnit: Number(item.finalRatePerUnit || 0),
                rowAmount: Number(item.rowAmount || 0),
              }))
            : [],
        },
      },
      include: { items: true },
    });
    return { ...created, items: created.items ?? [] };
  }

  if (documentType === "annexure") {
    const created = await prisma.annexure.create({
      data: {
        ...payload,
        invoiceDate: payload.invoiceDate,
        dueDate: payload.dueDate,
        poDate: payload.poDate,
        items: {
          create: Array.isArray(data.items)
            ? data.items.map((item: Record<string, unknown>) => ({
                description: String(item.description || "").trim(),
                hsn: String(item.hsn || "").trim(),
                unit: String(item.unit || "").trim(),
                qty: Number(item.qty || 0),
                rate: Number(item.rate || 0),
                taxPercent: Number(item.taxPercent || 0),
                discountPercent: Number(item.discountPercent || 0),
                taxablePerUnit: Number(item.taxablePerUnit || 0),
                taxableAmount: Number(item.taxableAmount || 0),
                gstAmount: Number(item.gstAmount || 0),
                finalRatePerUnit: Number(item.finalRatePerUnit || 0),
                rowAmount: Number(item.rowAmount || 0),
              }))
            : [],
        },
      },
      include: { items: true },
    });
    return { ...created, items: created.items ?? [] };
  }

  // For "invoice" and "quotation" we store in the Invoice table
  const created = await prisma.invoice.create({
    data: {
      ...payload,
      invoiceDate: payload.invoiceDate,
      dueDate: payload.dueDate,
      poDate: payload.poDate,
      items: {
        create: Array.isArray(data.items)
          ? data.items.map((item: Record<string, unknown>) => ({
              description: String(item.description || "").trim(),
              hsn: String(item.hsn || "").trim(),
              unit: String(item.unit || "").trim(),
              qty: Number(item.qty || 0),
              rate: Number(item.rate || 0),
              taxPercent: Number(item.taxPercent || 0),
              discountPercent: Number(item.discountPercent || 0),
              taxablePerUnit: Number(item.taxablePerUnit || 0),
              taxableAmount: Number(item.taxableAmount || 0),
              gstAmount: Number(item.gstAmount || 0),
              finalRatePerUnit: Number(item.finalRatePerUnit || 0),
              rowAmount: Number(item.rowAmount || 0),
            }))
          : [],
      },
    },
    include: { items: true },
  });
  return { ...created, items: created.items ?? [] };
}

async function updateDocumentRecord(id: string, data: Record<string, unknown>, documentType: DocumentType) {
  const payload = buildInvoicePayload(data, documentType);
  const itemPayload = Array.isArray(data.items)
    ? data.items.map((item: Record<string, unknown>) => ({
        description: String(item.description || "").trim(),
        hsn: String(item.hsn || "").trim(),
        unit: String(item.unit || "").trim(),
        qty: Number(item.qty || 0),
        rate: Number(item.rate || 0),
        taxPercent: Number(item.taxPercent || 0),
        discountPercent: Number(item.discountPercent || 0),
        taxablePerUnit: Number(item.taxablePerUnit || 0),
        taxableAmount: Number(item.taxableAmount || 0),
        gstAmount: Number(item.gstAmount || 0),
        finalRatePerUnit: Number(item.finalRatePerUnit || 0),
        rowAmount: Number(item.rowAmount || 0),
      }))
    : [];

  if (documentType === "proforma") {
    const updated = await prisma.proformaInvoice.update({
      where: { id },
      data: {
        ...payload,
        invoiceDate: payload.invoiceDate,
        dueDate: payload.dueDate,
        poDate: payload.poDate,
        items: {
          deleteMany: {},
          create: itemPayload,
        },
      },
      include: { items: true },
    });
    return { ...updated, items: updated.items ?? [] };
  }

  if (documentType === "annexure") {
    const updated = await prisma.annexure.update({
      where: { id },
      data: {
        ...payload,
        invoiceDate: payload.invoiceDate,
        dueDate: payload.dueDate,
        poDate: payload.poDate,
        items: {
          deleteMany: {},
          create: itemPayload,
        },
      },
      include: { items: true },
    });
    return { ...updated, items: updated.items ?? [] };
  }

  // For "invoice" and "quotation" update the Invoice table
  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      ...payload,
      invoiceDate: payload.invoiceDate,
      dueDate: payload.dueDate,
      poDate: payload.poDate,
      items: {
        deleteMany: {},
        create: itemPayload,
      },
    },
    include: { items: true },
  });
  return { ...updated, items: updated.items ?? [] };
}

async function getAllDocumentRecords(documentType?: DocumentType) {
  if (documentType === "proforma") {
    return prisma.proformaInvoice.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } });
  }
  if (documentType === "quotation") {
    return prisma.invoice.findMany({ where: { documentType: "quotation" }, orderBy: { createdAt: "desc" }, include: { items: true } });
  }
  if (documentType === "annexure") {
    return prisma.annexure.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } });
  }
  if (documentType === "invoice") {
    return prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } });
  }

  const [invoices, proformas, annexures] = await Promise.all([
    prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } }),
    prisma.proformaInvoice.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } }),
    prisma.annexure.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } }),
  ]);

  return [
    ...invoices.map((invoice) => ({ ...invoice, documentType: "invoice" })),
    ...proformas.map((invoice) => ({ ...invoice, documentType: "proforma" })),
    ...annexures.map((invoice) => ({ ...invoice, documentType: "annexure" })),
  ].sort((left, right) => new Date(String(right.createdAt)).getTime() - new Date(String(left.createdAt)).getTime());
}

async function getDocumentRecordById(id: string, documentType?: DocumentType) {
  if (documentType === "proforma") {
    return prisma.proformaInvoice.findUnique({ where: { id }, include: { items: true } });
  }
  if (documentType === "quotation") {
    return prisma.invoice.findUnique({ where: { id }, include: { items: true } });
  }
  if (documentType === "annexure") {
    return prisma.annexure.findUnique({ where: { id }, include: { items: true } });
  }
  if (documentType === "invoice") {
    return prisma.invoice.findUnique({ where: { id }, include: { items: true } });
  }

  const [invoice, proforma, annexure] = await Promise.all([
    prisma.invoice.findUnique({ where: { id }, include: { items: true } }),
    prisma.proformaInvoice.findUnique({ where: { id }, include: { items: true } }),
    prisma.annexure.findUnique({ where: { id }, include: { items: true } }),
  ]);

  return invoice ?? proforma ?? annexure;
}

async function deleteDocumentRecord(id: string, documentType: "invoice" | "proforma" | "annexure" | "quotation") {
  if (documentType === "proforma") {
    await prisma.proformaInvoice.delete({ where: { id } });
    return true;
  }
  if (documentType === "annexure") {
    await prisma.annexure.delete({ where: { id } });
    return true;
  }
  // For "invoice" and "quotation" delete from Invoice table
  await prisma.invoice.delete({ where: { id } });
  return true;
}

// Updates just the `status` field (e.g. "Active" <-> "Cancelled") on the
// correct table for the given documentType. Mirrors the same three-way
// table dispatch used by deleteDocumentRecord above: proforma / annexure
// each have their own table, and "invoice" covers Tax Invoice, Quotation,
// Pending Material, and Party Statement, which all share the Invoice
// table and are distinguished only by billType / invoiceNumber prefix.
//
// NOTE: if Cancel/Retrieve fail with a generic 500 in the UI, the most
// likely cause is that the `status` column referenced below does not
// yet exist on the Invoice / ProformaInvoice / Annexure models in
// schema.prisma. Add e.g. `status String @default("Active")` to each
// of those three models and run `npx prisma migrate dev` if so.
async function updateDocumentStatus(id: string, documentType: "invoice" | "proforma" | "annexure", status: string) {
  if (documentType === "proforma") {
    return prisma.proformaInvoice.update({ where: { id }, data: { status }, include: { items: true } });
  }
  if (documentType === "annexure") {
    return prisma.annexure.update({ where: { id }, data: { status }, include: { items: true } });
  }
  return prisma.invoice.update({ where: { id }, data: { status }, include: { items: true } });
}

function parseInvoicePayload(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  return data as Record<string, unknown>;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("id");
    const documentTypeParam = url.searchParams.get("documentType")?.toLowerCase();
    const documentType: DocumentType | undefined =
      documentTypeParam === "proforma" ? "proforma" : documentTypeParam === "annexure" ? "annexure" : documentTypeParam === "invoice" ? "invoice" : undefined;

    if (invoiceId) {
      const invoice = await getDocumentRecordById(invoiceId, documentType);

      if (invoice) {
        return NextResponse.json(invoice);
      }

      return jsonError("Invoice not found.", 404);
    }

    try {
      const invoices = await getAllDocumentRecords(documentType);
      return NextResponse.json(invoices);
    } catch (error) {
      logServerError("api.invoices.GET", error);
      const status = isDatabaseUnavailableError(error) ? 503 : 500;
      return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to load invoices.", status);
    }
  } catch (error) {
    logServerError("api.invoices.GET", error);
    return jsonError("Unable to load invoices.", 500);
  }
}

export async function POST(req: Request) {
  try {
    const data = parseInvoicePayload(await req.json().catch(() => null));
    if (!data) {
      return jsonError("Invalid request body.", 400);
    }

    const documentType = normalizeDocumentType(data);

    try {
      const invoice = await createDocumentRecord(data, documentType);
      return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
      logServerError("api.invoices.POST", error);
      const status = isDatabaseUnavailableError(error) ? 503 : 400;
      const message = status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : error instanceof Error && error.message ? error.message : "Unable to create invoice.";
      return jsonError(message, status);
    }
  } catch (error) {
    logServerError("api.invoices.POST", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    const message = status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : error instanceof Error && error.message ? error.message : "Unable to create invoice.";
    return jsonError(message, status);
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("id");
    const data = parseInvoicePayload(await req.json().catch(() => null));

    if (!invoiceId || !data) {
      return jsonError("Invalid request body.", 400);
    }

    const documentType = normalizeDocumentType(data);

    try {
      const invoice = await updateDocumentRecord(invoiceId, data, documentType);
      return NextResponse.json(invoice);
    } catch (error) {
      logServerError("api.invoices.PUT", error);
      return jsonError("Unable to update invoice.", 500);
    }
  } catch (error) {
    logServerError("api.invoices.PUT", error);
    return jsonError("Unable to update invoice.", 500);
  }
}

// Partial update — currently used to flip an invoice/proforma/annexure's
// `status` between "Active" and "Cancelled" (Cancel / Retrieve actions in
// the Generate Bill UI) without touching any of its other fields.
export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("id");
    const documentTypeParam = url.searchParams.get("documentType")?.toLowerCase();
    const documentType: "invoice" | "proforma" | "annexure" =
      documentTypeParam === "proforma" ? "proforma" : documentTypeParam === "annexure" ? "annexure" : "invoice";

    if (!invoiceId) {
      return jsonError("Invoice ID is required.", 400);
    }

    const data = parseInvoicePayload(await req.json().catch(() => null));
    const status = data && typeof data.status === "string" ? data.status.trim() : "";
    if (!status) {
      return jsonError("A valid 'status' value is required.", 400);
    }

    try {
      const updated = await updateDocumentStatus(invoiceId, documentType, status);
      return NextResponse.json(updated);
    } catch (error) {
      logServerError("api.invoices.PATCH", error);
      const dbUnavailable = isDatabaseUnavailableError(error);
      // In dev, surface the real Prisma/DB error message instead of a
      // generic one, so issues like a missing `status` column on the
      // model are immediately visible in the UI alert instead of only
      // in the server console.
      const detail = error instanceof Error && error.message ? error.message : undefined;
      const message = dbUnavailable
        ? DATABASE_UNAVAILABLE_MESSAGE
        : process.env.NODE_ENV !== "production" && detail
          ? `Unable to update invoice status: ${detail}`
          : "Unable to update invoice status.";
      return jsonError(message, dbUnavailable ? 503 : 500);
    }
  } catch (error) {
    logServerError("api.invoices.PATCH", error);
    return jsonError("Unable to update invoice status.", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("id");
    const documentTypeParam = url.searchParams.get("documentType")?.toLowerCase();
    const documentType: "invoice" | "proforma" | "annexure" =
      documentTypeParam === "proforma" ? "proforma" : documentTypeParam === "annexure" ? "annexure" : "invoice";

    if (!invoiceId) {
      return jsonError("Invoice ID is required.", 400);
    }

    try {
      await deleteDocumentRecord(invoiceId, documentType);
      return NextResponse.json({ success: true });
    } catch (error) {
      logServerError("api.invoices.DELETE", error);
      return jsonError("Unable to delete invoice.", 500);
    }
  } catch (error) {
    logServerError("api.invoices.DELETE", error);
    return jsonError("Unable to delete invoice.", 500);
  }
}