import { createCipheriv, createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { join } from 'path';
import { extractEWayBillDisplayResult } from '../../../lib/eway/display';

type Credentials = {
  username: string;
  password: string;
  gstin: string;
  apiBaseUrl: string;
  apiPath: string;
  email?: string;
  ipAddress?: string;
  clientId?: string;
  clientSecret?: string;
};

function resolveRequestIpAddress(credentials: Partial<Credentials>) {
  const candidates = [
    credentials.ipAddress,
    readEnv('EWB_IP_ADDRESS'),
    readEnv('EWAY_BILL_IP_ADDRESS'),
    process.env.EWB_PUBLIC_IP,
    process.env.EWAY_BILL_PUBLIC_IP,
    process.env.NEXT_PUBLIC_IP,
  ];

  for (const candidate of candidates) {
    const trimmed = String(candidate || '').trim();
    if (!trimmed) continue;
    if (/^127\.|^0\.|^localhost$/i.test(trimmed)) continue;
    return trimmed;
  }

  return '';
}

type SaveCredentialsPayload = Partial<Credentials> & {
  action?: string;
};

type GeneratePayload = {
  action?: string;
  payload?: Record<string, unknown>;
};

const credentialFilePath = join(process.cwd(), 'data', 'eway-bill-credentials.json');

function readEnv(name: string) {
  return process.env[name]?.trim() || '';
}

function ensureCredentialFile() {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function readSavedCredentials(): Promise<Credentials | null> {
  try {
    ensureCredentialFile();
    const exists = existsSync(credentialFilePath);
    if (!exists) return null;
    const file = await readFile(credentialFilePath, 'utf8');
    const parsed = JSON.parse(file) as Partial<Credentials>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      username: String(parsed.username || '').trim(),
      password: String(parsed.password || '').trim(),
      gstin: String(parsed.gstin || '').trim(),
      apiBaseUrl: String(parsed.apiBaseUrl || '').trim(),
      apiPath: String(parsed.apiPath || '').trim(),
      email: String(parsed.email || '').trim(),
      ipAddress: String(parsed.ipAddress || '').trim(),
      clientId: String(parsed.clientId || '').trim(),
      clientSecret: String(parsed.clientSecret || '').trim(),
    };
  } catch {
    return null;
  }
}

async function writeSavedCredentials(credentials: Credentials) {
  ensureCredentialFile();
  await writeFile(credentialFilePath, JSON.stringify(credentials, null, 2), 'utf8');
}

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 'https://ewaybillgst.gov.in';
  return trimmed.replace(/\/$/, '');
}

function normalizeApiPath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '/api/ewaybill';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function buildPortalAuthUrl(baseUrl: string, credentials: Credentials) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const authUrl = new URL(`${normalizedBaseUrl}/ewaybillapi/v1.03/authenticate`);
  authUrl.searchParams.set('email', credentials.email || 'rohitindia249@gmail.com');
  authUrl.searchParams.set('username', credentials.username);
  authUrl.searchParams.set('password', credentials.password);
  return authUrl.toString();
}

function buildPortalTargetUrl(baseUrl: string, credentials: Credentials, apiPath: string) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedPath = normalizeApiPath(apiPath || '/ewaybillapi/v1.03/ewayapi/genewaybill');
  const targetUrl = /^https?:\/\//i.test(normalizedPath)
    ? new URL(normalizedPath)
    : new URL(normalizedPath, normalizedBaseUrl);
  targetUrl.searchParams.set('email', credentials.email || 'rohitindia249@gmail.com');
  return targetUrl.toString();
}

function deriveKey(secret: string) {
  return createHash('sha256').update(secret).digest();
}

function deriveIv(secret: string) {
  return createHash('sha256').update(secret).digest().subarray(0, 16);
}

function encryptPayload(payload: string, keySecret: string, ivSecret: string) {
  const key = deriveKey(keySecret);
  const iv = deriveIv(ivSecret);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  return encrypted.toString('base64');
}

async function resolvePortalCredentials(requestCredentials?: Partial<Credentials> | null) {
  const saved = await readSavedCredentials();
  const resolved = {
    username: String(requestCredentials?.username || readEnv('EWB_USERNAME') || readEnv('EWAY_BILL_USERNAME') || readEnv('EWAY_BILL_UserName') || readEnv('EWAY_BILL_PORTAL_USERNAME') || saved?.username || '').trim(),
    password: String(requestCredentials?.password || readEnv('EWB_PASSWORD') || readEnv('EWAY_BILL_PASSWORD') || readEnv('EWAY_BILL_Password') || readEnv('EWAY_BILL_PORTAL_PASSWORD') || saved?.password || '').trim(),
    gstin: String(requestCredentials?.gstin || readEnv('EWB_GSTIN') || readEnv('EWAY_BILL_GSTIN') || saved?.gstin || '').trim(),
    apiBaseUrl: String(requestCredentials?.apiBaseUrl || readEnv('EWB_BASE_URL') || readEnv('EWAY_BILL_API_BASE_URL') || readEnv('EWAY_BILL_API_URL') || saved?.apiBaseUrl || '').trim(),
    apiPath: String(requestCredentials?.apiPath || readEnv('EWAY_BILL_API_PATH') || readEnv('EWAY_BILL_PATH') || '/ewaybillapi/v1.03/ewayapi/genewaybill' || saved?.apiPath || '').trim(),
    email: String(requestCredentials?.email || readEnv('EWB_EMAIL') || readEnv('EWAY_BILL_EMAIL') || readEnv('EWAY_BILL_Email') || saved?.email || 'rohitindia249@gmail.com').trim(),
    ipAddress: String(requestCredentials?.ipAddress || readEnv('EWB_IP_ADDRESS') || readEnv('EWAY_BILL_IP_ADDRESS') || saved?.ipAddress || '').trim(),
    clientId: String(requestCredentials?.clientId || readEnv('EWB_CLIENT_ID') || readEnv('EWAY_BILL_CLIENT_ID') || readEnv('EWAY_BILL_Client ID') || saved?.clientId || '').trim(),
    clientSecret: String(requestCredentials?.clientSecret || readEnv('EWB_CLIENT_SECRET') || readEnv('EWAY_BILL_CLIENT_SECRET') || readEnv('EWAY_BILL_Client Secret ID') || saved?.clientSecret || '').trim(),
  } as Credentials;
  return resolved;
}

function parseNumeric(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractProviderStatusMessage(parsed: unknown) {
  const record = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  const statusValue = record?.status_desc ?? record?.statusDescription ?? record?.status ?? record?.statusCode ?? record?.status_cd;
  const candidates = [
    record?.status_desc,
    record?.statusDescription,
    record?.message,
    record?.error,
    record?.portalMessage,
    typeof statusValue === 'string' && statusValue.trim() ? `status: ${statusValue.trim()}` : null,
    typeof statusValue === 'number' ? `status: ${statusValue}` : null,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
}

function isSuccessfulPortalStatus(parsed: unknown) {
  const record = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  const statusValue = record?.status_cd ?? record?.statusCode ?? record?.status;
  if (typeof statusValue === 'number') return statusValue === 1;
  if (typeof statusValue === 'string') {
    const normalized = statusValue.trim().toLowerCase();
    if (['1', 'success', 'successfully', 'true', 'ok', 'y', 'yes'].includes(normalized)) return true;
    if (['0', 'false', 'fail', 'failed', 'error', 'no', 'n'].includes(normalized)) return false;
  }

  return true;
}

function buildBareFailureMessage(result: unknown, fallbackMessage = 'E-Way Bill request sent successfully.') {
  const payload = result && typeof result === 'object' ? result as Record<string, unknown> : {};
  const statusValue = payload.status_cd ?? payload.statusCode ?? payload.status;
  const statusText = typeof statusValue === 'string' || typeof statusValue === 'number'
    ? String(statusValue).trim()
    : '';
  const providerMessage = pickProviderErrorMessage(result, fallbackMessage);
  const normalizedFallback = fallbackMessage.trim().toLowerCase();
  const isGenericFallback = providerMessage.trim().toLowerCase() === normalizedFallback;

  if (statusText && statusText.toLowerCase() === '0' && isGenericFallback) {
    return 'Portal rejected the request without returning a bill number. Please verify the payload, document details, or portal credentials.';
  }

  return providerMessage;
}

function toStateCode(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  const str = String(value ?? '').trim().toUpperCase();
  if (!str) return '0';
  if (/^[0-9]{2}[A-Z0-9]{13}$/.test(str)) {
    return str.slice(0, 2);
  }
  const normalized = str.replace(/\s+/g, ' ');
  const mapping: Record<string, string> = {
    'ANDHRA PRADESH': '28',
    'ARUNACHAL PRADESH': '12',
    'ASSAM': '18',
    'BIHAR': '10',
    'CHHATTISGARH': '22',
    'DELHI': '07',
    'GOA': '30',
    'GUJARAT': '24',
    'HARYANA': '06',
    'HIMACHAL PRADESH': '02',
    'JHARKHAND': '20',
    'KARNATAKA': '29',
    'KERALA': '32',
    'MADHYA PRADESH': '23',
    'MAHARASHTRA': '27',
    'MANIPUR': '14',
    'MEGHALAYA': '17',
    'MIZORAM': '15',
    'NAGALAND': '13',
    'ODISHA': '21',
    'PUNJAB': '03',
    'RAJASTHAN': '08',
    'SIKKIM': '11',
    'TAMIL NADU': '33',
    'TELANGANA': '36',
    'TRIPURA': '16',
    'UTTAR PRADESH': '09',
    'UTTARAKHAND': '05',
    'WEST BENGAL': '19',
    'UP': '09',
    'TN': '33',
    'KA': '29',
    'MH': '27',
    'DL': '07',
    'HR': '06',
    'TS': '36',
  };
  return mapping[normalized] || str.replace(/[^0-9]/g, '') || '0';
}

function normalizeStateCode(value: unknown) {
  const code = toStateCode(value);
  const normalized = String(code).replace(/[^0-9]/g, '').padStart(2, '0');
  return Number(normalized);
}

function normalizeDocumentType(value: unknown) {
  const str = String(value ?? '').trim().toLowerCase();
  if (!str) return 'INV';
  if (str.includes('tax invoice') || str === 'inv') return 'INV';
  if (str.includes('delivery challan') || str === 'dc') return 'DC';
  if (str.includes('bill of supply') || str === 'bill') return 'BIL';
  if (str.includes('credit note') || str === 'cn') return 'CN';
  if (str.includes('debit note') || str === 'dn') return 'DN';
  return str.toUpperCase();
}

function normalizeSubSupplyType(value: unknown) {
  const str = String(value ?? '').trim().toLowerCase();
  if (!str) return '1';
  if (str.includes('supply')) return '1';
  if (str.includes('export')) return '2';
  if (str.includes('job')) return '3';
  if (str.includes('skd') || str.includes('ckd') || str.includes('cxd')) return '4';
  if (str.includes('recipient') || str.includes('recipient not known')) return '5';
  if (str.includes('own use')) return '6';
  if (str.includes('exhibition') || str.includes('fair')) return '7';
  if (str.includes('line sale') || str.includes('line sales')) return '8';
  if (str.includes('other')) return '9';
  return str.replace(/[^0-9]/g, '') || '1';
}

function normalizeTransactionType(value: unknown) {
  const num = parseNumeric(value);
  if ([1, 2, 3, 4].includes(num)) return num;
  const str = String(value ?? '').trim().toLowerCase();
  if (str.includes('regular')) return 1;
  if (str.includes('bill to') && str.includes('ship to')) return 2;
  if (str.includes('bill from') && str.includes('dispatch from')) return 3;
  if (str.includes('combination')) return 4;
  return 1;
}

function normalizeVehicleType(value: unknown) {
  const str = String(value ?? '').trim().toUpperCase();
  if (str.startsWith('R')) return 'R';
  if (str.startsWith('T')) return 'T';
  return 'R';
}

function normalizeTransportMode(value: unknown) {
  const num = parseNumeric(value);
  if ([1, 2, 3, 4].includes(num)) return String(num);
  const str = String(value ?? '').trim().toLowerCase();
  if (str.includes('road')) return '1';
  if (str.includes('rail')) return '2';
  if (str.includes('air')) return '3';
  if (str.includes('ship') || str.includes('sea')) return '4';
  return '1';
}

function normalizeDate(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const slashDate = raw.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/);
  if (slashDate) return raw;
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  }
  return raw;
}

function normalizeGstin(value: unknown) {
  return String(value ?? '').trim().toUpperCase();
}

function getGstinStateCode(value: unknown) {
  const gstin = normalizeGstin(value);
  const prefix = gstin.slice(0, 2);
  const numeric = Number(prefix);
  return Number.isFinite(numeric) && prefix.length === 2 ? numeric : 0;
}

function isValidGstin(value: unknown) {
  const gstin = normalizeGstin(value);
  return gstin.length === 15 && /^[0-9]{2}[A-Z0-9]{13}$/.test(gstin);
}

export function validatePortalRequestBody(body: Record<string, unknown>, credentials?: Credentials) {
  const errors: string[] = [];
  const fromGstin = normalizeGstin(body.fromGstin);
  const toGstin = normalizeGstin(body.toGstin);
  const fromGstinStateCode = getGstinStateCode(fromGstin);
  const toGstinStateCode = getGstinStateCode(toGstin);
  const authenticatedGstin = normalizeGstin(credentials?.gstin || '');
  const fromStateCode = parseNumeric(body.fromStateCode || body.actFromStateCode || fromGstinStateCode);
  const toStateCode = parseNumeric(body.toStateCode || body.actToStateCode || toGstinStateCode);

  if (!isValidGstin(fromGstin)) {
    errors.push('Invalid fromGstin; GSTIN must be 15 characters and begin with the 2-digit state code.');
  }

  if (!isValidGstin(toGstin)) {
    errors.push('Invalid toGstin; GSTIN is required and must be 15 characters.');
  }

  if (authenticatedGstin && fromGstin && authenticatedGstin !== fromGstin && authenticatedGstin === toGstin) {
    errors.push(`Authenticated GSTIN (${authenticatedGstin}) must match fromGstin (${fromGstin}) or the consignee GSTIN when applicable.`);
  }

  if (!String(body.docNo || '').trim()) {
    errors.push('docNo is required.');
  }
  if (!String(body.docDate || '').trim()) {
    errors.push('docDate is required.');
  }
  if (fromStateCode === 0) {
    errors.push('fromStateCode is required and must be a valid state code.');
  }
  if (toStateCode === 0) {
    errors.push('toStateCode is required and must be a valid state code.');
  }
  if (!Array.isArray(body.itemList) || body.itemList.length === 0) {
    errors.push('itemList is required and must contain at least one item.');
  } else {
    body.itemList.forEach((item: unknown, index: number) => {
      if (!item || typeof item !== 'object') {
        errors.push(`itemList[${index}] must be an object.`);
        return;
      }
      const record = item as Record<string, unknown>;
      if (parseNumeric(record.quantity) <= 0) {
        errors.push(`itemList[${index}].quantity must be greater than zero.`);
      }
      if (parseNumeric(record.taxableAmount ?? record.taxableValue) <= 0) {
        errors.push(`itemList[${index}].taxableAmount must be greater than zero.`);
      }
    });
  }
  return errors;
}

function normalizeDocumentNumber(value: unknown) {
  const input = String(value ?? '').trim();
  return input
    .replace(/\s*(?:\((?:duplicate)\)|duplicate)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapItemToWhitebooksItem(item: Record<string, unknown>, isInterstate = false) {
  const qty = parseNumeric(item.quantity);
  const taxableAmount = parseNumeric(item.taxableValue ?? item.taxableAmount);
  const cgstRate = parseNumeric(item.cgstSgst ?? item.cgstRate);
  const igstRate = parseNumeric(item.igst ?? item.igstRate);
  const sgstRate = parseNumeric(item.sgstRate ?? item.cgstSgst ?? item.cgstRate) || 0;
  const cessRate = parseNumeric(item.cessAdvit ?? item.cessRate);
  const cessNonadvol = parseNumeric(item.cessNonAdvit ?? item.cessNonadvol ?? item.cessNonAdvol);
  const effectiveCgstRate = isInterstate ? 0 : cgstRate;
  const effectiveSgstRate = isInterstate ? 0 : sgstRate;
  const effectiveIgstRate = isInterstate ? (igstRate > 0 ? igstRate : cgstRate + sgstRate) : igstRate;
  return {
    productName: String(item.productName || item.name || item.description || 'Item'),
    productDesc: String(item.productDesc || item.description || item.name || 'Item'),
    hsnCode: String(item.hsn || item.hsnCode || '0').trim() || '0',
    quantity: qty || 0,
    qtyUnit: String(item.unit || 'NOS'),
    taxableAmount: taxableAmount || 0,
    sgstRate: effectiveSgstRate || 0,
    cgstRate: effectiveCgstRate || 0,
    igstRate: effectiveIgstRate || 0,
    cessRate,
    cessNonadvol,
  };
}

type ItemTotals = {
  totalValue: number;
  cgstValue: number;
  sgstValue: number;
  igstValue: number;
  cessValue: number;
  cessNonAdvolValue: number;
};

function calculateItemTotals(items: Array<Record<string, unknown>>, isInterstate = false) {
  return items.reduce<ItemTotals>(
    (totals, item) => {
      const taxableAmount = parseNumeric(item.taxableValue ?? item.taxableAmount);
      const cgstRate = parseNumeric(item.cgstSgst ?? item.cgstRate);
      const sgstRate = parseNumeric(item.sgstRate ?? item.cgstSgst ?? item.cgstRate);
      const igstRate = parseNumeric(item.igst ?? item.igstRate);
      const cessRate = parseNumeric(item.cessAdvit ?? item.cessRate);
      const cessNonadvol = parseNumeric(item.cessNonAdvit ?? item.cessNonadvol ?? item.cessNonAdvol);
      const effectiveCgstRate = isInterstate ? 0 : cgstRate;
      const effectiveSgstRate = isInterstate ? 0 : sgstRate;
      const effectiveIgstRate = isInterstate ? (igstRate > 0 ? igstRate : cgstRate + sgstRate) : igstRate;

      const cgstValue = (taxableAmount * effectiveCgstRate) / 100;
      const sgstValue = (taxableAmount * effectiveSgstRate) / 100;
      const igstValue = (taxableAmount * effectiveIgstRate) / 100;
      const cessValue = (taxableAmount * cessRate) / 100;

      totals.totalValue += taxableAmount;
      totals.cgstValue += cgstValue;
      totals.sgstValue += sgstValue;
      totals.igstValue += igstValue;
      totals.cessValue += cessValue;
      totals.cessNonAdvolValue += cessNonadvol;
      return totals;
    },
    {
      totalValue: 0,
      cgstValue: 0,
      sgstValue: 0,
      igstValue: 0,
      cessValue: 0,
      cessNonAdvolValue: 0,
    },
  );
}

export function buildPortalRequestBody(payload: Record<string, unknown>, credentials: Credentials): Record<string, unknown> {
  const normalized = payload ?? {};
  const items = Array.isArray(normalized.itemList)
    ? normalized.itemList
    : Array.isArray(normalized.items)
      ? normalized.items
      : [];
  const fromStateValue = normalized.billFromState || normalized.fromStateCode || normalized.fromState || normalized.billFromGstin || normalized.fromGstin || credentials.gstin || 0;
  const toStateValue = normalized.billToState || normalized.toStateCode || normalized.toState || normalized.billToGstin || normalized.toGstin || credentials.gstin || 0;
  const fromStateCode = normalizeStateCode(fromStateValue);
  const toStateCode = normalizeStateCode(toStateValue);
  const isInterstate = fromStateCode > 0 && toStateCode > 0 && fromStateCode !== toStateCode;
  const totals = calculateItemTotals(items as Array<Record<string, unknown>>, isInterstate);
  const otherValue = parseNumeric((normalized.otherValue ?? normalized.otherAmount) || 0);
  const taxableBaseValue = totals.totalValue;
  const taxValue = totals.cgstValue + totals.sgstValue + totals.igstValue + totals.cessValue;
  const totalValue = parseNumeric(
    (normalized.totalValue ?? normalized.totalInvoice ?? normalized.totInvValue) ?? (taxableBaseValue + taxValue + totals.cessNonAdvolValue + otherValue),
  );
  const totInvValue = parseNumeric((normalized.totInvValue ?? normalized.totalInvoice) ?? totalValue);
  const transactionType = normalizeTransactionType(normalized.transactionType);
  const transDocNo = String(normalized.transDocNo || normalized.transporterDocNo || '').trim();
  const transDocDate = transDocNo ? normalizeDate(normalized.transporterDocDate || normalized.transDocDate || '') : '';
  const requestPayload = {
    supplyType: String(normalized.supplyType === 'inward' ? 'I' : 'O'),
    subSupplyType: normalizeSubSupplyType(normalized.subSupplyType || normalized.subType || normalized.subSupplyTypeCode || normalized.subTypeCode),
    subSupplyDesc: String(normalized.subSupplyDesc || ''),
    docType: normalizeDocumentType(normalized.documentType || normalized.docType),
    docNo: normalizeDocumentNumber(normalized.documentNo || normalized.docNo || 'INV-001'),
    docDate: normalizeDate(normalized.documentDate || normalized.docDate || new Date().toLocaleDateString('en-GB')),
    fromGstin: normalizeGstin(normalized.billFromGstin || normalized.fromGstin || credentials.gstin || ''),
    fromTrdName: String(normalized.billFromName || normalized.fromTrdName || ''),
    fromAddr1: String(normalized.dispatchAddress1 || normalized.fromAddr1 || ''),
    fromAddr2: String(normalized.dispatchAddress2 || normalized.fromAddr2 || ''),
    fromPlace: String(normalized.dispatchPlace || normalized.fromPlace || ''),
    actFromStateCode: fromStateCode,
    fromPincode: parseNumeric(normalized.dispatchPincode || normalized.fromPincode || 0),
    fromStateCode: fromStateCode,
    toGstin: normalizeGstin(normalized.billToGstin || normalized.toGstin || normalized.shipToGSTIN || ''),
    toTrdName: String(normalized.billToName || normalized.toTrdName || normalized.shipToTrdName || ''),
    toAddr1: String(normalized.shipAddress1 || normalized.toAddr1 || ''),
    toAddr2: String(normalized.shipAddress2 || normalized.toAddr2 || ''),
    toPlace: String(normalized.shipPlace || normalized.toPlace || ''),
    actToStateCode: toStateCode,
    toPincode: parseNumeric(normalized.shipPincode || normalized.toPincode || 0),
    toStateCode: toStateCode,
    shipToGSTIN: normalizeGstin(normalized.shipToGSTIN || normalized.billToGstin || normalized.toGstin || ''),
    shipToTrdName: String(normalized.shipToTrdName || normalized.billToName || normalized.toTrdName || ''),
    transactionType,
    totalValue: totalValue || 0,
    cgstValue: isInterstate ? 0 : parseNumeric(normalized.cgstValue ?? normalized.cgst ?? totals.cgstValue),
    sgstValue: isInterstate ? 0 : parseNumeric(normalized.sgstValue ?? normalized.sgst ?? totals.sgstValue),
    igstValue: isInterstate ? parseNumeric(normalized.igstValue ?? normalized.igst ?? totals.igstValue) || (totalValue > 0 ? 0 : 0) : parseNumeric(normalized.igstValue ?? normalized.igst ?? totals.igstValue),
    cessValue: parseNumeric(normalized.cessValue ?? totals.cessValue),
    cessNonAdvolValue: parseNumeric(normalized.cessNonAdvolValue ?? normalized.cessNonadvol ?? totals.cessNonAdvolValue),
    totInvValue,
    otherValue,
    transMode: normalizeTransportMode(normalized.mode || normalized.transMode),
    transDistance: String(parseNumeric(normalized.approxDistance || normalized.transDistance || '100')),
    transporterName: String(normalized.transporterName || ''),
    transporterId: String(normalized.transporterId || ''),
    transDocNo,
    transDocDate,
    vehicleNo: String(normalized.vehicleNo || ''),
    vehicleType: normalizeVehicleType(normalized.vehicleType),
    itemList: items.map((item) => mapItemToWhitebooksItem(item as Record<string, unknown>, isInterstate)),
  };

  if (credentials.email || credentials.clientId || credentials.clientSecret || credentials.gstin) {
    return requestPayload;
  }

  const encryptionKey = readEnv('EWAY_BILL_ENCRYPTION_KEY');
  const encryptionIv = readEnv('EWAY_BILL_ENCRYPTION_IV');

  if (encryptionKey && encryptionIv) {
    return {
      encryptedPayload: encryptPayload(JSON.stringify(requestPayload), encryptionKey, encryptionIv),
      encryption: { algorithm: 'aes-256-cbc', encoded: true },
    };
  }

  return requestPayload;
}

async function authenticatePortal(credentials: Credentials) {
  const baseUrl = normalizeBaseUrl(credentials.apiBaseUrl || readEnv('EWAY_BILL_API_BASE_URL'));
  const authUrl = buildPortalAuthUrl(baseUrl, credentials);
  const ipAddress = resolveRequestIpAddress(credentials);
  console.log(`[EWAY_BILL] Auth IP header = ${ipAddress || '(missing)'}`);
  const response = await fetch(authUrl, {
    method: 'GET',
    headers: {
      'ip_address': ipAddress,
      'client_id': credentials.clientId || '',
      'client_secret': credentials.clientSecret || '',
      gstin: credentials.gstin,
    },
  });

  const text = await response.text();
  console.log(`[EWAY_BILL] Auth response authUrl=${authUrl} status=${response.status} text=${text}`);
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
  }

  const providerMessage = extractProviderStatusMessage(parsed);
  const successfulStatus = isSuccessfulPortalStatus(parsed);
  if (!response.ok || !successfulStatus) {
    throw new Error(providerMessage || text || 'Authentication failed.');
  }

  const token = (parsed && typeof parsed === 'object' && 'accessToken' in parsed && typeof (parsed as Record<string, unknown>).accessToken === 'string'
    ? (parsed as Record<string, unknown>).accessToken
    : null) || (parsed && typeof parsed === 'object' && 'token' in parsed && typeof (parsed as Record<string, unknown>).token === 'string'
      ? (parsed as Record<string, unknown>).token
      : null) || (parsed && typeof parsed === 'object' && 'authToken' in parsed && typeof (parsed as Record<string, unknown>).authToken === 'string'
        ? (parsed as Record<string, unknown>).authToken
        : null) || '';

  return token;
}

async function callPortal(credentials: Credentials, requestBody: unknown) {
  const baseUrl = normalizeBaseUrl(credentials.apiBaseUrl || readEnv('EWAY_BILL_API_BASE_URL'));
  const apiPath = normalizeApiPath(credentials.apiPath || readEnv('EWAY_BILL_API_PATH') || readEnv('EWAY_BILL_PATH'));
  const targetUrl = buildPortalTargetUrl(baseUrl, credentials, apiPath);
  const authToken = await authenticatePortal(credentials);

  const requestBodyText = JSON.stringify(requestBody);
  console.log(`[EWAY_BILL] Generation request targetUrl=${targetUrl} requestBody=${requestBodyText.slice(0, 2000)}`);
  const ipAddress = resolveRequestIpAddress(credentials);
  console.log(`[EWAY_BILL] Generate IP header = ${ipAddress || '(missing)'}`);
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'ip_address': ipAddress,
      'client_id': credentials.clientId || '',
      'client_secret': credentials.clientSecret || '',
      gstin: credentials.gstin,
      email: credentials.email || 'rohitindia249@gmail.com',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: requestBodyText,
  });

  const text = await response.text();
  console.log(`[EWAY_BILL] Generation response status=${response.status} text=${text}`);
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
  }

  return { response, parsed, text };
}

function pickProviderErrorMessage(result: unknown, fallbackMessage = 'E-Way Bill request sent successfully.') {
  const payload = result && typeof result === 'object' ? result as Record<string, unknown> : {};
  const nested = payload.result && typeof payload.result === 'object' ? payload.result as Record<string, unknown> : null;
  const data = payload.data && typeof payload.data === 'object' ? payload.data as Record<string, unknown> : null;
  const nestedData = data?.result && typeof data.result === 'object' ? data.result as Record<string, unknown> : null;

  const candidates = [
    payload.portalMessage,
    payload.message,
    payload.error,
    payload.error_desc,
    payload.errorDescription,
    payload.status_desc,
    payload.statusDescription,
    nested?.portalMessage,
    nested?.message,
    nested?.error,
    nested?.error_desc,
    nested?.errorDescription,
    nested?.status_desc,
    nested?.statusDescription,
    data?.portalMessage,
    data?.message,
    data?.error,
    data?.error_desc,
    data?.errorDescription,
    data?.status_desc,
    data?.statusDescription,
    nestedData?.portalMessage,
    nestedData?.message,
    nestedData?.error,
    nestedData?.error_desc,
    nestedData?.errorDescription,
    nestedData?.status_desc,
    nestedData?.statusDescription,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return fallbackMessage;
}

export function buildEWayBillResponsePayload(result: unknown, fallbackMessage = 'E-Way Bill request sent successfully.') {
  const displayResult = extractEWayBillDisplayResult({
    success: true,
    message: fallbackMessage,
    result,
    data: result,
  });
  const providerMessage = pickProviderErrorMessage(result, fallbackMessage);
  const preferredMessage = [displayResult.portalMessage, providerMessage]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .filter((value) => value !== fallbackMessage && !/did not return a valid e-way bill/i.test(value))
    .sort((a, b) => b.length - a.length)[0];
  const bareFailureMessage = buildBareFailureMessage(result, fallbackMessage);

  return {
    success: displayResult.success,
    message: displayResult.success
      ? (displayResult.portalMessage || providerMessage || fallbackMessage)
      : (preferredMessage || bareFailureMessage || providerMessage || displayResult.portalMessage || fallbackMessage),
    result,
    data: result,
    display: displayResult,
  };
}

export async function GET() {
  try {
    const credentials = await resolvePortalCredentials(null);
    return NextResponse.json({
      success: true,
      credentials: {
        username: credentials.username,
        password: credentials.password,
        gstin: credentials.gstin,
        apiBaseUrl: credentials.apiBaseUrl,
        apiPath: credentials.apiPath,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load portal credentials.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as SaveCredentialsPayload | GeneratePayload;
    console.log('[EWAY_BILL] POST body', JSON.stringify(body));
    if (body?.action === 'save-credentials') {
      const credentials = await resolvePortalCredentials(body as Partial<Credentials>);
      await writeSavedCredentials(credentials);
      return NextResponse.json({ success: true, message: 'Credentials saved successfully.' });
    }

    const credentials = await resolvePortalCredentials(body as Partial<Credentials>);
    const generateBody = body as GeneratePayload;
    const payload = generateBody.payload && typeof generateBody.payload === 'object' ? generateBody.payload : {};
    console.log('[EWAY_BILL] POST payload', JSON.stringify(payload));
    const requestBody = buildPortalRequestBody(payload, credentials);
    const validationErrors = validatePortalRequestBody(requestBody, credentials);
    if (validationErrors.length > 0) {
      console.warn('[EWAY_BILL] Invalid e-way bill request body', validationErrors, requestBody);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid e-way bill payload. Please correct required fields.',
          errors: validationErrors,
          result: requestBody,
        },
        { status: 400 },
      );
    }

    const { response, parsed, text } = await callPortal(credentials, requestBody);

    const result = parsed && typeof parsed === 'object' ? parsed : { raw: text };
    const responsePayload = buildEWayBillResponsePayload(result);
    if (!response.ok || !responsePayload.success) {
      const message = responsePayload.message || text || 'Unable to generate e-way bill. The portal did not return a valid e-way bill number.';
      console.warn('[EWAY_BILL] Portal responded without success', {
        status: response.status,
        ok: response.ok,
        message,
        result,
        raw: text,
      });
      return NextResponse.json({ success: false, message, error: message, result }, { status: 400 });
    }

    return NextResponse.json({
      success: responsePayload.success,
      message: responsePayload.message,
      result,
      data: result,
      display: responsePayload.display,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error while processing e-way bill request.';
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}
