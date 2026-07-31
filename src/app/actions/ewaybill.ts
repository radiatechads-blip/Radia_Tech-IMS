'use server';

type JsonObject = Record<string, unknown>;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function parseJsonSafely(text: string): unknown {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function pickString(root: JsonObject | null | undefined, keys: string[]): string {
  if (!root) {
    return '';
  }

  for (const key of keys) {
    const value = asString(root[key]);
    if (value) {
      return value;
    }
  }

  return '';
}

export async function extractAuthToken(payload: unknown): Promise<string> {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const root = payload as JsonObject;
  const nestedData = root.data && typeof root.data === 'object' ? root.data as JsonObject : null;

  return pickString(root, ['AuthToken', 'authToken', 'accessToken', 'token'])
    || pickString(nestedData, ['AuthToken', 'authToken', 'accessToken', 'token'])
    || '';
}

export async function toPortalStatus(payload: unknown): Promise<string> {
  if (!payload || typeof payload !== 'object') {
    return 'FAILED';
  }

  const root = payload as JsonObject;
  const statusValue = root.status_cd ?? root.statusCode ?? root.status ?? root.status_cd;

  if (typeof statusValue === 'number') {
    return statusValue === 1 ? 'GENERATED' : 'FAILED';
  }

  const normalized = asString(statusValue)?.toLowerCase();
  if (!normalized) {
    return 'FAILED';
  }

  if (['1', 'success', 'successful', 'generated', 'ok', 'true'].includes(normalized)) {
    return 'GENERATED';
  }

  return 'FAILED';
}

export async function getNicAuthToken(): Promise<string> {
  const authUrl = getRequiredEnv('EWAY_BILL_AUTH_URL');
  const gstin = getRequiredEnv('EWAY_BILL_GSTIN');

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Gstin: gstin,
    },
    body: JSON.stringify({
      Action: 'ACCESSTOKEN',
      Username: process.env.EWAY_BILL_USERNAME || '',
      Password: process.env.EWAY_BILL_PASSWORD || '',
      AppKey: process.env.EWAY_BILL_APP_KEY || '',
    }),
  });

  const text = await response.text();
  const payload = parseJsonSafely(text);

  if (!response.ok) {
    throw new Error(`NIC authentication failed (${response.status}): ${text}`);
  }

  const token = await extractAuthToken(payload);
  if (token) {
    return token;
  }

  throw new Error(`NIC authentication failed: ${text}`);
}

export async function submitEWayBill(payload: JsonObject) {
  const { prisma } = await import('../../lib/prisma');

  try {
    const createdRecord = await prisma.eWayBillRecord.create({
      data: {
        billNumber: asString(payload.billNumber) || '',
        documentType: asString(payload.documentType) || asString(payload.docType) || '',
        documentNo: asString(payload.documentNo) || '',
        ewayBillNumber: asString(payload.ewayBillNo) || asString(payload.ewayBillNumber) || '',
        status: 'draft',
        portalMessage: '',
        portalResponse: '',
        vehicleNumber: asString(payload.vehicleNumber) || '',
        validityDate: asString(payload.validityDate) || '',
        remarks: asString(payload.remarks) || '',
      },
    });

    const apiUrl = process.env.EWAY_BILL_API_URL || 'https://apisandbox.whitebooks.in/eway/api/v1/eway/generate';
    const authToken = process.env.EWAY_BILL_AUTH_TOKEN || await getNicAuthToken();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    const result = parseJsonSafely(text);

    if (response.ok && await toPortalStatus(result) === 'GENERATED') {
      const updatedRecord = await prisma.eWayBillRecord.update({
        where: { id: createdRecord.id },
        data: {
          status: 'generated',
          ewayBillNumber: asString((result as JsonObject)?.ewayBillNo) || asString((result as JsonObject)?.ewayBillNumber) || createdRecord.ewayBillNumber,
          portalMessage: asString((result as JsonObject)?.message) || asString((result as JsonObject)?.portalMessage) || '',
          portalResponse: text,
          validityDate: asString((result as JsonObject)?.validUpto) || asString((result as JsonObject)?.validityDate) || '',
          vehicleNumber: asString((result as JsonObject)?.vehicleNumber) || createdRecord.vehicleNumber,
          remarks: asString((result as JsonObject)?.remarks) || '',
        },
      });

      return {
        success: true,
        ewayBillNo: updatedRecord.ewayBillNumber,
        validUpto: updatedRecord.validityDate,
        data: result,
      };
    }

    await prisma.eWayBillRecord.update({
      where: { id: createdRecord.id },
      data: {
        status: 'failed',
        portalMessage: asString((result as JsonObject)?.message) || asString((result as JsonObject)?.errorDesc) || asString((result as JsonObject)?.error) || asString((result as JsonObject)?.portalMessage) || 'Failed to generate e-Way Bill',
        portalResponse: text,
      },
    });

    return {
      success: false,
      error: asString((result as JsonObject)?.message) || asString((result as JsonObject)?.errorDesc) || asString((result as JsonObject)?.error) || 'Failed to generate e-Way Bill',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database or server error';
    return { success: false, error: message };
  }
}
