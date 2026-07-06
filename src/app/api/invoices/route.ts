import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { createInvoiceRecord, deleteInvoiceRecord, readInvoiceRecordById, readInvoiceStore, updateInvoiceRecord } from "@/lib/invoiceStorage";
import { NextResponse } from "next/server";

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

    if (invoiceId) {
      try {
        const invoice = await prisma.invoice.findUnique({
          where: { id: invoiceId },
          include: { items: true },
        });

        if (invoice) {
          return NextResponse.json(invoice);
        }
      } catch {
        const fallbackInvoice = await readInvoiceRecordById(invoiceId);
        if (fallbackInvoice) {
          return NextResponse.json(fallbackInvoice);
        }
      }

      return jsonError("Invoice not found.", 404);
    }

    try {
      const invoices = await prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        include: { items: true },
      });

      return NextResponse.json(invoices);
    } catch (error) {
      const fallbackInvoices = await readInvoiceStore();
      if (fallbackInvoices.length > 0) {
        return NextResponse.json(fallbackInvoices);
      }

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

    try {
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: String(data.invoiceNumber || "").trim(),
          invoiceDate: new Date(String(data.invoiceDate || new Date())),
          dueDate: data.dueDate ? new Date(String(data.dueDate)) : null,
          partyName: String(data.partyName || "").trim(),
          gstin: String(data.gstin || "").trim(),
          phone: String(data.phone || "").trim(),
          state: String(data.state || "").trim(),
          address: String(data.address || "").trim(),
          poDate: data.poDate ? new Date(String(data.poDate)) : null,
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
          taxableAmount: Number(data.taxableAmount || 0),
          taxAmount: Number(data.taxAmount || 0),
          grandTotal: Number(data.grandTotal || 0),
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

      return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
      const fallbackInvoice = await createInvoiceRecord({
        invoiceNumber: String(data.invoiceNumber || "").trim(),
        invoiceDate: String(data.invoiceDate || new Date().toISOString()),
        dueDate: data.dueDate ? String(data.dueDate) : null,
        partyName: String(data.partyName || "").trim(),
        gstin: String(data.gstin || "").trim(),
        phone: String(data.phone || "").trim(),
        state: String(data.state || "").trim(),
        address: String(data.address || "").trim(),
        poDate: data.poDate ? String(data.poDate) : null,
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
        taxableAmount: Number(data.taxableAmount || 0),
        taxAmount: Number(data.taxAmount || 0),
        grandTotal: Number(data.grandTotal || 0),
        items: Array.isArray(data.items) ? data.items : [],
      });

      return NextResponse.json(fallbackInvoice, { status: 201 });
    }
  } catch (error) {
    logServerError("api.invoices.POST", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 400;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to create invoice.", status);
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

    try {
      const invoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          invoiceNumber: String(data.invoiceNumber || "").trim(),
          invoiceDate: new Date(String(data.invoiceDate || new Date())),
          dueDate: data.dueDate ? new Date(String(data.dueDate)) : null,
          partyName: String(data.partyName || "").trim(),
          gstin: String(data.gstin || "").trim(),
          phone: String(data.phone || "").trim(),
          state: String(data.state || "").trim(),
          address: String(data.address || "").trim(),
          poDate: data.poDate ? new Date(String(data.poDate)) : null,
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
          taxableAmount: Number(data.taxableAmount || 0),
          taxAmount: Number(data.taxAmount || 0),
          grandTotal: Number(data.grandTotal || 0),
        },
        include: { items: true },
      });

      return NextResponse.json(invoice);
    } catch {
      const fallbackInvoice = await updateInvoiceRecord(invoiceId, {
        invoiceNumber: String(data.invoiceNumber || "").trim(),
        invoiceDate: String(data.invoiceDate || new Date().toISOString()),
        dueDate: data.dueDate ? String(data.dueDate) : null,
        partyName: String(data.partyName || "").trim(),
        gstin: String(data.gstin || "").trim(),
        phone: String(data.phone || "").trim(),
        state: String(data.state || "").trim(),
        address: String(data.address || "").trim(),
        poDate: data.poDate ? String(data.poDate) : null,
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
        taxableAmount: Number(data.taxableAmount || 0),
        taxAmount: Number(data.taxAmount || 0),
        grandTotal: Number(data.grandTotal || 0),
        items: Array.isArray(data.items) ? data.items : [],
      });

      if (!fallbackInvoice) {
        return jsonError("Invoice not found.", 404);
      }

      return NextResponse.json(fallbackInvoice);
    }
  } catch (error) {
    logServerError("api.invoices.PUT", error);
    return jsonError("Unable to update invoice.", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get("id");
    if (!invoiceId) {
      return jsonError("Invoice ID is required.", 400);
    }

    try {
      await prisma.invoice.delete({ where: { id: invoiceId } });
      return NextResponse.json({ success: true });
    } catch {
      const deleted = await deleteInvoiceRecord(invoiceId);
      if (!deleted) {
        return jsonError("Invoice not found.", 404);
      }

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    logServerError("api.invoices.DELETE", error);
    return jsonError("Unable to delete invoice.", 500);
  }
}
