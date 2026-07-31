import { readStoredHistoryRecords } from '@/lib/ewaybillHistoryStorage';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export function parseJsonValue(value: unknown) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  if (typeof value === 'object') {
    return value;
  }

  return value;
}

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EWayBillFormSubmission" (
        "id" TEXT PRIMARY KEY,
        "documentType" TEXT NOT NULL DEFAULT '',
        "documentNo" TEXT NOT NULL DEFAULT '',
        "customerName" TEXT NOT NULL DEFAULT '',
        "gstin" TEXT NOT NULL DEFAULT '',
        "ewayBillNumber" TEXT NOT NULL DEFAULT '',
        "status" TEXT NOT NULL DEFAULT 'pending',
        "formData" JSONB,
        "requestPayload" JSONB,
        "responsePayload" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const rows = await prisma.eWayBillFormSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        documentType: true,
        documentNo: true,
        customerName: true,
        gstin: true,
        ewayBillNumber: true,
        status: true,
        formData: true,
        requestPayload: true,
        responsePayload: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const history = rows.map((row) => {
      const formData = parseJsonValue(row.formData);
      const responsePayload = parseJsonValue(row.responsePayload);
      const generatedDate = typeof responsePayload === 'object' && responsePayload && 'ewayBillDate' in responsePayload
        ? String((responsePayload as Record<string, unknown>).ewayBillDate || '')
        : '';
      const validUpto = typeof responsePayload === 'object' && responsePayload && 'validUpto' in responsePayload
        ? String((responsePayload as Record<string, unknown>).validUpto || '')
        : '';

      return {
        id: row.id,
        ewbNo: row.ewayBillNumber || '-',
        ewbDate: generatedDate || row.createdAt?.toISOString?.() || '',
        validUpto,
        billNo: row.documentNo || '-',
        docType: row.documentType || '-',
        customerName: row.customerName || '-',
        gstin: row.gstin || '-',
        formData,
      };
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to fetch e-way bill history from database, falling back to disk storage.', error);
    const fallbackHistory = await readStoredHistoryRecords();
    return NextResponse.json(fallbackHistory, { status: 200 });
  }
}
