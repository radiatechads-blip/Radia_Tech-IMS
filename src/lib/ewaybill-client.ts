/**
 * E-Way Bill API client — server-side only. Never import this from a
 * client component; it holds credentials and does the RSA/AES handshake.
 *
 * Configure via environment variables (see .env.example):
 *   EWB_BASE_URL        e.g. https://api.<your-gsp>.com/ewb  or the NIC
 *                        production/sandbox host your provider gave you
 *   EWB_CLIENT_ID       client-id header value
 *   EWB_CLIENT_SECRET   client-secret header value
 *   EWB_GSTIN           your GSTIN
 *   EWB_USERNAME        API username created on the e-way bill portal
 *   EWB_PASSWORD        API password
 *   EWB_PUBLIC_KEY_PATH filesystem path to the .pem public key certificate
 *                        your provider gave you at API registration
 *
 * NOTE ON PROVIDERS: field/header names below follow the NIC EWB-API
 * Technical Document (action/username/password/app_key, sek, authtoken,
 * client-id/client-secret/gstin headers). If you're integrating through a
 * GSP wrapper (Cleartax, MasterGST, Vayana, Adaequare, etc.) rather than
 * direct NIC access, check their onboarding docs for the exact base URL
 * and any extra header (e.g. a "Subscription Key"/"x-api-key") — the
 * crypto handshake itself is identical across all of them since they all
 * sit in front of the same NIC backend.
 */

import fs from "fs";
import path from "path";
import {
    aesDecrypt,
    aesEncrypt,
    generateAppKey,
    rsaEncrypt,
} from "./ewaybill-crypto";

interface EwbSession {
  authToken: string;
  sekKey: Buffer; // decrypted session key, ready for AES use
  expiresAt: number; // epoch ms
}

let cachedSession: EwbSession | null = null;

function readEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function getRequiredEnv(name: string, ...fallbackNames: string[]): string {
  const value = readEnv(name, ...fallbackNames);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function resolveEwbConfig() {
  const configuredBaseUrl = readEnv(
    "EWB_BASE_URL",
    "EWAY_BILL_API_BASE_URL",
    "EWAY_BILL_BASE_URL",
    "EWAY_BILL_API_URL"
  );
  const baseUrl = configuredBaseUrl
    ? configuredBaseUrl.replace(/\/+$/, "")
    : "https://apisandbox.whitebooks.in";

  const normalizedBaseUrl = isWhiteBooksBaseUrl(baseUrl)
    ? baseUrl.replace(/^https:\/\/api\.whitebooks\.in/i, "https://apisandbox.whitebooks.in")
    : baseUrl;

  return {
    baseUrl: normalizedBaseUrl,
    clientId: readEnv("EWB_CLIENT_ID", "EWAY_BILL_CLIENT_ID"),
    clientSecret: readEnv("EWB_CLIENT_SECRET", "EWAY_BILL_CLIENT_SECRET"),
    gstin: readEnv("EWB_GSTIN", "EWAY_BILL_GSTIN"),
    username: readEnv("EWB_USERNAME", "EWAY_BILL_USERNAME"),
    password: readEnv("EWB_PASSWORD", "EWAY_BILL_PASSWORD"),
    email: readEnv("EWB_EMAIL", "EWAY_BILL_EMAIL", "EWB_USERNAME", "EWAY_BILL_USERNAME"),
    ipAddress: readEnv("EWB_IP_ADDRESS", "EWAY_BILL_IP_ADDRESS"),
    skipAuth: readEnv("EWB_SKIP_AUTH") === "true" || readEnv("EWB_SKIP_AUTH") === "1",
  };
}

function isWhiteBooksBaseUrl(baseUrl: string): boolean {
  return /whitebooks/i.test(baseUrl);
}

export function buildEwbAuthenticateUrl(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  if (isWhiteBooksBaseUrl(normalizedBaseUrl)) {
    const config = resolveEwbConfig();
    const params = new URLSearchParams({
      email: config.email || config.username || "",
      username: config.username || "",
      password: config.password || "",
    });
    return `${normalizedBaseUrl}/ewaybillapi/v1.03/authenticate?${params.toString()}`;
  }

  return `${normalizedBaseUrl}/authenticate`;
}

export function buildEwbGenerateUrl(baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  if (isWhiteBooksBaseUrl(normalizedBaseUrl)) {
    const config = resolveEwbConfig();
    const params = new URLSearchParams({
      email: config.email || config.username || "",
    });
    return `${normalizedBaseUrl}/ewaybillapi/v1.03/ewayapi/genewaybill?${params.toString()}`;
  }

  return `${normalizedBaseUrl}/GenerateEWayBill`;
}

export function extractAuthTokenFromResponse(text: string): string | null {
  if (!text || !text.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const nested = typeof record.data === "object" && record.data ? record.data as Record<string, unknown> : undefined;
      const candidate = [record.accessToken, record.token, record.authToken, nested?.accessToken, nested?.token, nested?.authToken]
        .find((value): value is string => typeof value === "string" && value.trim().length > 0);
      return candidate ?? null;
    }
  } catch {
    // fall through to string-based token detection below
  }

  const tokenMatch = text.match(/"?(accessToken|token|authToken)"?\s*[:=]\s*"?([^"\s,}]+)"?/i);
  return tokenMatch?.[2] ?? null;
}

export function isSuccessfulAuthResponse(text: string): boolean {
  if (!text || !text.trim()) {
    return false;
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const statusCandidate = [record.status_cd, record.status, record.statusCode, record.success]
        .find((value): value is string | number | boolean => typeof value === "string" || typeof value === "number" || typeof value === "boolean");

      if (typeof statusCandidate === "boolean") {
        return statusCandidate;
      }

      if (typeof statusCandidate === "number") {
        return statusCandidate === 1 || statusCandidate === 200;
      }

      if (typeof statusCandidate === "string") {
        return /^(1|success|successful|ok|true)$/i.test(statusCandidate);
      }
    }
  } catch {
    // fall through to plain-text heuristics
  }

  return /"status_cd"\s*:\s*"?1"?|"status"\s*:\s*"?(success|successful|ok|true)"?/i.test(text);
}

export function resolvePublicKeyPath(): string | null {
  const config = resolveEwbConfig();
  if (config.skipAuth) {
    return null;
  }

  const configuredPath = process.env.EWB_PUBLIC_KEY_PATH?.trim() || process.env.EWAY_BILL_PUBLIC_KEY_PATH?.trim();
  if (!configuredPath) {
    const fallbackPath = path.join(process.cwd(), "data", "ewaybill-public.pem");
    return fs.existsSync(fallbackPath) ? fallbackPath : null;
  }

  if (configuredPath.startsWith("http://") || configuredPath.startsWith("https://") || configuredPath.startsWith("/")) {
    const fallbackPath = path.join(process.cwd(), "data", "ewaybill-public.pem");
    return fs.existsSync(fallbackPath) ? fallbackPath : null;
  }

  return configuredPath;
}

export function resolvePublicKeyPem(): string | null {
  const config = resolveEwbConfig();
  if (config.skipAuth) {
    return null;
  }

  const pemFromEnv = process.env.EWB_PUBLIC_KEY_PEM?.trim() || process.env.EWAY_BILL_PUBLIC_KEY_PEM?.trim();
  if (pemFromEnv) {
    return pemFromEnv.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
  }

  const resolvedPath = resolvePublicKeyPath();
  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    return null;
  }

  const content = fs.readFileSync(resolvedPath);
  const text = content.toString("utf8");
  if (text.includes("BEGIN") || text.includes("END")) {
    return text;
  }

  return content.toString("base64");
}

function loadPublicKey(): string {
  const publicKeyPem = resolvePublicKeyPem();
  if (!publicKeyPem) {
    throw new Error(
      "Missing EWB public key. Set EWB_PUBLIC_KEY_PEM or EWB_PUBLIC_KEY_PATH to a valid PEM public key or certificate."
    );
  }

  if (!publicKeyPem.includes("BEGIN")) {
    throw new Error(
      `The configured EWB public key does not look like a PEM certificate ` +
        `(expected a "-----BEGIN CERTIFICATE-----" or "-----BEGIN PUBLIC KEY-----" header). ` +
        `Confirm this is the exact file your GSP/NIC provided at registration.`
    );
  }

  return publicKeyPem;
}

export async function parseJsonResponseBody(res: Response, context: string): Promise<any> {
  const text = await res.text();
  if (!text || !text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const preview = text.length > 400 ? `${text.slice(0, 400)}...` : text;
    throw new Error(`${context} returned invalid JSON: ${preview}`);
  }
}

/**
 * Step 1 — Authenticate and derive the session encryption key (sek).
 * Tokens/sek are valid ~6 hours per the NIC spec; we cache and reuse
 * until shortly before expiry rather than re-authenticating every call.
 */
async function authenticate(): Promise<EwbSession> {
  const config = resolveEwbConfig();
  const baseUrl = config.baseUrl;

  if (isWhiteBooksBaseUrl(baseUrl)) {
    const authUrl = buildEwbAuthenticateUrl(baseUrl);
    const res = await fetch(authUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ip_address: config.ipAddress || process.env.EWB_PUBLIC_IP || process.env.EWAY_BILL_PUBLIC_IP || "127.0.0.1",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        gstin: config.gstin,
        email: config.email,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      const detail = text ? ` - ${text.slice(0, 400)}` : "";
      throw new Error(`EWB authenticate failed: HTTP ${res.status}${detail}`);
    }

    const token = extractAuthTokenFromResponse(text);
    if (!token && !isSuccessfulAuthResponse(text)) {
      throw new Error(`EWB authenticate returned an empty response body.`);
    }

    const session: EwbSession = {
      authToken: token ?? "",
      sekKey: Buffer.alloc(32, 0),
      expiresAt: Date.now() + (6 * 60 - 10) * 60 * 1000,
    };
    cachedSession = session;
    return session;
  }

  const publicKeyPem = loadPublicKey();
  const appKey = generateAppKey(); // 32-char plain app_key, kept locally

  const encryptedPassword = rsaEncrypt(config.password || getRequiredEnv("EWB_PASSWORD", "EWAY_BILL_PASSWORD"), publicKeyPem);
  const encryptedAppKey = rsaEncrypt(appKey, publicKeyPem);

  const res = await fetch(`${baseUrl}/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "client-id": config.clientId || getRequiredEnv("EWB_CLIENT_ID", "EWAY_BILL_CLIENT_ID"),
      "client-secret": config.clientSecret || getRequiredEnv("EWB_CLIENT_SECRET", "EWAY_BILL_CLIENT_SECRET"),
      gstin: config.gstin || getRequiredEnv("EWB_GSTIN", "EWAY_BILL_GSTIN"),
    },
    body: JSON.stringify({
      action: "ACCESSTOKEN",
      username: config.username || getRequiredEnv("EWB_USERNAME", "EWAY_BILL_USERNAME"),
      password: encryptedPassword,
      app_key: encryptedAppKey,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    const detail = errorText ? ` - ${errorText.slice(0, 400)}` : "";
    throw new Error(`EWB authenticate failed: HTTP ${res.status}${detail}`);
  }

  const json = await parseJsonResponseBody(res, "EWB authenticate");
  if (String(json.status) !== "1") {
    throw new Error(`EWB authenticate rejected: ${JSON.stringify(json)}`);
  }

  // sek arrives AES-encrypted using the plain app_key as the key.
  const appKeyBuf = Buffer.from(appKey, "utf8"); // 32 bytes -> AES-256 key
  const sekPlainB64 = aesDecrypt(json.sek, appKeyBuf);
  const sekKey = Buffer.from(sekPlainB64, "base64");

  const session: EwbSession = {
    authToken: json.authtoken,
    sekKey,
    // refresh 10 minutes before the documented 6-hour expiry, to be safe
    expiresAt: Date.now() + (6 * 60 - 10) * 60 * 1000,
  };
  cachedSession = session;
  return session;
}

async function getSession(): Promise<EwbSession> {
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession;
  }
  return authenticate();
}

/**
 * Step 2 — Generate an e-way bill.
 * Encrypts `payload` with the session key, calls the generate endpoint,
 * and decrypts the response back into a plain object.
 */
export async function generateEwayBill(payload: unknown): Promise<any> {
  const config = resolveEwbConfig();
  const baseUrl = config.baseUrl;
  let session = await getSession();

  const callOnce = async (s: EwbSession) => {
    if (isWhiteBooksBaseUrl(baseUrl)) {
      const source = (payload as Record<string, unknown>) ?? {};
      const normalizeWhitebooksDate = (value: unknown) => {
        const raw = String(value ?? "").trim();
        if (!raw) return "";
        const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
          return `${match[3]}/${match[2]}/${match[1]}`;
        }
        return raw;
      };

      const normalizeWhitebooksDocNo = (value: unknown) => {
        const raw = String(value ?? "").trim();
        if (!raw) return "";
        const compact = raw.replace(/\s+/g, "").slice(0, 16);
        return compact;
      };

      const normalizeWhitebooksTransporterId = (value: unknown) => {
        const raw = String(value ?? "").trim();
        if (!raw) return undefined;
        const digits = raw.replace(/[^0-9A-Z]/g, "");
        return digits.length > 0 ? digits : undefined;
      };

      const body = {
        supplyType: String(source.supplyType ?? "O"),
        subSupplyType: String(source.subSupplyType ?? "1"),
        docType: String(source.docType ?? "INV"),
        docNo: normalizeWhitebooksDocNo(source.docNo ?? ""),
        docDate: normalizeWhitebooksDate(source.docDate ?? ""),
        fromGstin: String(source.fromGstin ?? config.gstin ?? ""),
        toGstin: String(source.toGstin ?? ""),
        totalValue: Number(source.totalValue ?? 0),
        transMode: String(source.transMode ?? "1"),
        transDocNo: String(source.transDocNo ?? ""),
        vehicleNo: String(source.vehicleNo ?? ""),
        itemList: Array.isArray(source.itemList)
          ? source.itemList.map((item: unknown) => ({
              productName: String((item as Record<string, unknown>).productName ?? (item as Record<string, unknown>).name ?? ""),
              hsnCode: String((item as Record<string, unknown>).hsnCode ?? (item as Record<string, unknown>).hsn ?? ""),
              quantity: Number((item as Record<string, unknown>).quantity ?? 0),
              taxableAmount: Number((item as Record<string, unknown>).taxableAmount ?? (item as Record<string, unknown>).taxableValue ?? 0),
              cgstRate: Number((item as Record<string, unknown>).cgstRate ?? 0),
              sgstRate: Number((item as Record<string, unknown>).sgstRate ?? 0),
              igstRate: Number((item as Record<string, unknown>).igstRate ?? (item as Record<string, unknown>).igst ?? 0),
            }))
          : [],
      };

      const fallbackBody = {
        ...body,
        fromStateCode: Number(source.fromStateCode ?? 0),
        actFromStateCode: Number(source.actFromStateCode ?? source.fromStateCode ?? 0),
        toStateCode: Number(source.toStateCode ?? 0),
        actToStateCode: Number(source.actToStateCode ?? source.toStateCode ?? 0),
        transactionType: Number(source.transactionType ?? 1),
        otherValue: Number(source.otherValue ?? 0),
        cgstValue: Number(source.cgstValue ?? 0),
        sgstValue: Number(source.sgstValue ?? 0),
        igstValue: Number(source.igstValue ?? 0),
        cessValue: Number(source.cessValue ?? 0),
        totInvValue: Number(source.totInvValue ?? source.totalValue ?? 0),
        transDistance: String(source.transDistance ?? "100"),
        transporterName: String(source.transporterName ?? ""),
        ...(normalizeWhitebooksTransporterId(source.transporterId) ? { transporterId: normalizeWhitebooksTransporterId(source.transporterId) } : {}),
        transDocDate: String(source.transDocDate ?? ""),
        vehicleType: String(source.vehicleType ?? "R"),
        fromTrdName: String(source.fromTrdName ?? ""),
        fromAddr1: String(source.fromAddr1 ?? ""),
        fromAddr2: String(source.fromAddr2 ?? ""),
        fromPlace: String(source.fromPlace ?? ""),
        fromPincode: Number(source.fromPincode ?? 0),
        toTrdName: String(source.toTrdName ?? ""),
        toAddr1: String(source.toAddr1 ?? ""),
        toAddr2: String(source.toAddr2 ?? ""),
        toPlace: String(source.toPlace ?? ""),
        toPincode: Number(source.toPincode ?? 0),
      };

      const requestHeaders = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(s.authToken ? { Authorization: `Bearer ${s.authToken}` } : {}),
        client_id: config.clientId,
        client_secret: config.clientSecret,
        gstin: config.gstin,
        email: config.email,
        username: config.username,
        password: config.password,
        ip_address: config.ipAddress || process.env.EWB_PUBLIC_IP || process.env.EWAY_BILL_PUBLIC_IP || process.env.NEXT_PUBLIC_IP || "127.0.0.1",
      };

      console.log("[EWB] WhiteBooks generate request", {
        url: buildEwbGenerateUrl(baseUrl),
        headers: requestHeaders,
        body: fallbackBody,
      });

      const res = await fetch(buildEwbGenerateUrl(baseUrl), {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(fallbackBody),
      });

      return res;
    }

    const encryptedData = aesEncrypt(JSON.stringify(payload), s.sekKey);

    const res = await fetch(`${baseUrl}/GenerateEWayBill`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "client-id": config.clientId || getRequiredEnv("EWB_CLIENT_ID", "EWAY_BILL_CLIENT_ID"),
        "client-secret": config.clientSecret || getRequiredEnv("EWB_CLIENT_SECRET", "EWAY_BILL_CLIENT_SECRET"),
        gstin: config.gstin || getRequiredEnv("EWB_GSTIN", "EWAY_BILL_GSTIN"),
        authtoken: s.authToken,
      },
      body: JSON.stringify({
        action: "GENEWAYBILL",
        data: encryptedData,
      }),
    });

    return res;
  };

  let res = await callOnce(session);

  // If the token expired server-side (401/expired-token style response),
  // re-authenticate once and retry.
  if (res.status === 401) {
    session = await authenticate();
    res = await callOnce(session);
  }

  const responseText = await res.text().catch(() => "");

  if (!res.ok) {
    const detail = responseText ? ` - ${responseText.slice(0, 400)}` : "";
    throw new Error(`EWB generate failed: HTTP ${res.status}${detail}`);
  }

  const json = responseText ? await parseJsonResponseBody(new Response(responseText, { status: res.status, headers: res.headers }), "EWB generate") : null;

  if (isWhiteBooksBaseUrl(baseUrl)) {
    if (!json) {
      const detail = responseText ? `Provider response: ${responseText}` : "The sandbox provider returned no usable payload.";
      throw new Error(`EWB generate returned an empty response body. ${detail}`);
    }

    const statusCd = String(json.status_cd ?? json.status ?? "");
    if (statusCd && statusCd !== "1" && statusCd !== "success" && statusCd !== "true") {
      const detail = [json.status_desc, json.statusDescription, json.message, json.error?.message, json.error_desc, json.errorDescription, JSON.stringify(json)]
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim())
        .find(Boolean) ?? responseText;
      throw new Error(`EWB generate rejected: ${detail}`);
    }
    return json.data ?? json;
  }

  if (json && json.status && String(json.status) !== "1") {
    throw new Error(`EWB generate rejected: ${JSON.stringify(json)}`);
  }

  const decrypted = aesDecrypt(json.data, session.sekKey);
  return JSON.parse(decrypted);
}