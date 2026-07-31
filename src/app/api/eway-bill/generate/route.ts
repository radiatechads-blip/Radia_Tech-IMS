import { Prisma } from "@/generated/prisma";
import { extractEWayBillDisplayResult } from "@/lib/eway/display";
import { generateEwayBill } from "@/lib/ewaybill-client";
import { saveEwayBillHistoryRecord } from "@/lib/ewaybillHistoryStorage";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function persistSubmissionRecord(recordId: string, payload: Record<string, unknown>, formData: unknown, responsePayload: unknown, status: string, ewayBillNumber: string) {
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

    await prisma.eWayBillFormSubmission.create({
      data: {
        id: recordId,
        documentType: typeof payload.documentType === 'string' ? payload.documentType : '',
        documentNo: typeof payload.documentNo === 'string' ? payload.documentNo : '',
        customerName: typeof payload.billToName === 'string' ? payload.billToName : '',
        gstin: typeof payload.gstin === 'string' ? payload.gstin : '',
        ewayBillNumber,
        status,
        formData: formData ? (formData as Prisma.InputJsonValue) : undefined,
        requestPayload: payload ? (payload as Prisma.InputJsonValue) : undefined,
        responsePayload: responsePayload ? (responsePayload as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    console.warn('Database persistence unavailable for e-way bill submission, falling back to disk storage.', error);
    await saveEwayBillHistoryRecord({
      id: recordId,
      ewbNo: ewayBillNumber,
      ewbDate: '',
      validUpto: '',
      billNo: typeof payload.documentNo === 'string' ? payload.documentNo : '',
      docType: typeof payload.documentType === 'string' ? payload.documentType : '',
      customerName: typeof payload.billToName === 'string' ? payload.billToName : '',
      gstin: typeof payload.gstin === 'string' ? payload.gstin : '',
      formData: typeof formData === 'object' && formData ? formData as Record<string, unknown> : null,
      status,
    });
  }
}

async function updateSubmissionStatus(recordId: string, status: string, ewayBillNumber: string, responsePayload: unknown) {
  try {
    await prisma.eWayBillFormSubmission.update({
      where: { id: recordId },
      data: {
        status,
        ewayBillNumber,
        responsePayload: responsePayload ? (responsePayload as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    console.warn('Database update unavailable for e-way bill submission, keeping disk fallback.', error);
  }
}

export function mapPortalResponseToGenerateResponse(result: unknown) {
  const displayResult = extractEWayBillDisplayResult({
    success: true,
    message: "E-Way Bill generated successfully.",
    result,
    data: result,
  });

  return {
    success: displayResult.success,
    message: displayResult.portalMessage || "E-Way Bill generated successfully.",
    ewayBillNo: displayResult.ewayBillNumber || (result as any)?.ewayBillNo || (result as any)?.EwbNo || (result as any)?.ewbNo,
    ewayBillDate: (result as any)?.ewayBillDate ?? (result as any)?.EwbDt ?? (result as any)?.ewayBillDate,
    validUpto: (result as any)?.validUpto ?? (result as any)?.EwbValidTill,
    raw: result,
    data: result,
    display: displayResult,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = body && typeof body === 'object' ? body : {};
    const formData = payload.formData && typeof payload.formData === 'object' ? payload.formData : null;
    const requestPayload = payload && typeof payload === 'object' ? payload : {};
    const recordId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    await persistSubmissionRecord(recordId, requestPayload, formData, null, 'pending', '');

    const result = await generateEwayBill(payload);

    const responsePayload = mapPortalResponseToGenerateResponse(result);
    const ewayBillNumber = typeof responsePayload.ewayBillNo === 'string' ? responsePayload.ewayBillNo : '';

    await updateSubmissionStatus(recordId, ewayBillNumber ? 'completed' : 'failed', ewayBillNumber, responsePayload);

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error("EWB generate error:", err);
    const message = err?.message || "E-way bill generation failed";
    return NextResponse.json(
      {
        success: false,
        error: message,
        message,
        raw: err?.cause ?? null,
      },
      { status: 500 }
    );
  }
}