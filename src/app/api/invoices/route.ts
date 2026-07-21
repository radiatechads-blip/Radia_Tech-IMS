import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { resolveInvoiceDate, resolveInvoiceNumber } from "@/lib/invoicePayload";
import { buildStockReductionPlan } from "@/lib/stockReduction";
import { NextResponse } from "next/server";

type DocumentType = "invoice" | "proforma" | "annexure" | "quotation";

function normalizeDocumentType(data: Record<string, unknown>): DocumentType {
  const explicit = String(data.documentType || data.billType || "").trim().toLowerCase();
  if (explicit.includes("proforma")) return "proforma";
  if (explicit.includes("annexure") || explicit.includes("long")) return "annexure";
  if (explicit.includes("quotation") || explicit.startsWith("qtn")) return "quotation";
  return "invoice";
}

function buildInvoicePayload(data: Record<string, unknown>, documentType: DocumentType, invoiceNumberOverride?: string) {
  const invoiceNumber = invoiceNumberOverride ?? resolveInvoiceNumber(data, documentType);
  const invoiceDate = resolveInvoiceDate(data);

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
            : String(data.billType || "Invoice").trim() || "Invoice",
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

function buildConversionMeta(data: Record<string, unknown>) {
  return {
    convertedToTaxInvoice: Boolean(data.convertedToTaxInvoice),
    convertedInvoiceId: typeof data.convertedInvoiceId === "string" && data.convertedInvoiceId ? data.convertedInvoiceId : null,
    convertedInvoiceNumber: typeof data.convertedInvoiceNumber === "string" && data.convertedInvoiceNumber ? data.convertedInvoiceNumber : null,
    convertedFromProforma: Boolean(data.convertedFromProforma),
    sourceProformaNumber: typeof data.sourceProformaNumber === "string" && data.sourceProformaNumber ? data.sourceProformaNumber : null,
  };
}

function buildDocumentItems(data: Record<string, unknown>) {
  if (!Array.isArray(data.items)) {
    return [] as Array<{
      description: string;
      hsn: string;
      unit: string;
      qty: number;
      rate: number;
      taxPercent: number;
      discountPercent: number;
      taxablePerUnit: number;
      taxableAmount: number;
      gstAmount: number;
      finalRatePerUnit: number;
      rowAmount: number;
    }>;
  }

  return data.items.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [] as Array<{
        description: string;
        hsn: string;
        unit: string;
        qty: number;
        rate: number;
        taxPercent: number;
        discountPercent: number;
        taxablePerUnit: number;
        taxableAmount: number;
        gstAmount: number;
        finalRatePerUnit: number;
        rowAmount: number;
      }>;
    }

    const record = item as Record<string, unknown>;
    return [
      {
        description: String(record.description || "").trim(),
        hsn: String(record.hsn || "").trim(),
        unit: String(record.unit || "").trim(),
        qty: Number(record.qty || 0),
        rate: Number(record.rate || 0),
        taxPercent: Number(record.taxPercent || 0),
        discountPercent: Number(record.discountPercent || 0),
        taxablePerUnit: Number(record.taxablePerUnit || 0),
        taxableAmount: Number(record.taxableAmount || 0),
        gstAmount: Number(record.gstAmount || 0),
        finalRatePerUnit: Number(record.finalRatePerUnit || 0),
        rowAmount: Number(record.rowAmount || 0),
      },
    ];
  });
}

async function applyStockReductionPlan(plan: Array<{ productId: string; qty: number }>) {
  for (const change of plan) {
    await prisma.product.update({
      where: { id: change.productId },
      data: { stock: { decrement: change.qty } },
    });
  }
}

async function ensureInvoiceConversionColumns() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "convertedToTaxInvoice" BOOLEAN NOT NULL DEFAULT false`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "convertedInvoiceId" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "convertedInvoiceNumber" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "convertedFromProforma" BOOLEAN NOT NULL DEFAULT false`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sourceProformaNumber" TEXT`);
}

async function writeInvoiceConversionMeta(id: string, meta: ReturnType<typeof buildConversionMeta>) {
  await ensureInvoiceConversionColumns();
  await prisma.$executeRawUnsafe(
    `UPDATE "Invoice" SET "convertedToTaxInvoice" = $1, "convertedInvoiceId" = $2, "convertedInvoiceNumber" = $3, "convertedFromProforma" = $4, "sourceProformaNumber" = $5 WHERE "id" = $6`,
    meta.convertedToTaxInvoice,
    meta.convertedInvoiceId,
    meta.convertedInvoiceNumber,
    meta.convertedFromProforma,
    meta.sourceProformaNumber,
    id,
  );
}

async function createDocumentRecord(data: Record<string, unknown>, documentType: DocumentType) {
  const documentItems = buildDocumentItems(data);
  const stockReductionPlan =
    documentType === "invoice" || documentType === "annexure"
      ? buildStockReductionPlan(
          documentItems.map((item) => ({
            description: String(item.description || ""),
            qty: Number(item.qty || 0),
          })),
          await prisma.product.findMany({ select: { id: true, name: true, stock: true } }),
        )
      : [];

  const conversionMeta = buildConversionMeta(data);
  const proformaConversionMeta = documentType === "proforma"
    ? conversionMeta
    : undefined;

  const existingNumbers = new Set<string>(
    (documentType === "proforma"
      ? await prisma.proformaInvoice.findMany({ select: { invoiceNumber: true } })
      : documentType === "annexure"
        ? await prisma.annexure.findMany({ select: { invoiceNumber: true } })
        : await prisma.invoice.findMany({ select: { invoiceNumber: true } }))
      .map((record) => String(record.invoiceNumber || "").trim())
      .filter(Boolean),
  );

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const payload = buildInvoicePayload(data, documentType, resolveInvoiceNumber(data, documentType, existingNumbers));

    try {
      if (documentType === "proforma") {
        const created = await prisma.proformaInvoice.create({
          data: {
            ...payload,
            ...(proformaConversionMeta ?? {}),
            invoiceDate: payload.invoiceDate,
            dueDate: payload.dueDate,
            poDate: payload.poDate,
            items: {
              create: documentItems.map((item) => ({
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
              })),
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
              create: documentItems.map((item) => ({
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
              })),
            },
          },
          include: { items: true },
        });
        await applyStockReductionPlan(stockReductionPlan);
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
            create: documentItems.map((item) => ({
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
            })),
          },
        },
        include: { items: true },
      });

      if (documentType === "invoice" || documentType === "quotation") {
        await writeInvoiceConversionMeta(created.id, conversionMeta);
        const refreshed = await prisma.invoice.findUnique({
          where: { id: created.id },
          include: { items: true },
        });
        return refreshed ? { ...refreshed, items: refreshed.items ?? [] } : { ...created, items: created.items ?? [] };
      }

      await applyStockReductionPlan(stockReductionPlan);
      return { ...created, items: created.items ?? [] };
    } catch (error) {
      const isUniqueConstraintError =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        String((error as { code?: unknown }).code) === "P2002";

      if (isUniqueConstraintError && attempt < 4) {
        existingNumbers.add(String(payload.invoiceNumber || "").trim());
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to create invoice after retrying for unique invoice numbers.");
}

async function updateDocumentRecord(id: string, data: Record<string, unknown>, documentType: DocumentType) {
  const payload = buildInvoicePayload(data, documentType);
  const itemPayload = buildDocumentItems(data);
  const conversionMeta = buildConversionMeta(data);

  if (documentType === "proforma") {
    const updated = await prisma.proformaInvoice.update({
      where: { id },
      data: {
        ...payload,
        ...(buildConversionMeta(data)),
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
  await writeInvoiceConversionMeta(updated.id, conversionMeta);
  const refreshed = await prisma.invoice.findUnique({
    where: { id: updated.id },
    include: { items: true },
  });
  return refreshed ? { ...refreshed, items: refreshed.items ?? [] } : { ...updated, items: updated.items ?? [] };
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
async function ensureDocumentStatusColumn(tableName: string) {
  await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'Active'`);
}

async function updateDocumentStatus(id: string, documentType: "invoice" | "proforma" | "annexure", status: string) {
  if (documentType === "proforma") {
    await ensureDocumentStatusColumn("ProformaInvoice");
    await prisma.$executeRawUnsafe(`UPDATE "ProformaInvoice" SET "status" = $1 WHERE "id" = $2`, status, id);
    const record = await prisma.proformaInvoice.findUnique({ where: { id }, include: { items: true } });
    return record ? { ...record, status } : null;
  }
  if (documentType === "annexure") {
    await ensureDocumentStatusColumn("Annexure");
    await prisma.$executeRawUnsafe(`UPDATE "Annexure" SET "status" = $1 WHERE "id" = $2`, status, id);
    const record = await prisma.annexure.findUnique({ where: { id }, include: { items: true } });
    return record ? { ...record, status } : null;
  }
  await ensureDocumentStatusColumn("Invoice");
  await prisma.$executeRawUnsafe(`UPDATE "Invoice" SET "status" = $1 WHERE "id" = $2`, status, id);
  const record = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });
  return record ? { ...record, status } : null;
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
      console.error("api.invoices.POST request body:", data);
      if (error instanceof Error) {
        console.error("api.invoices.POST error message:", error.message);
      }
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