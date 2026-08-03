import { NextResponse } from "next/server";

type EInvoiceRequestBody = {
  action?: string;
  payload?: Record<string, unknown>;
};

function readEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "https://apisandbox.whitebooks.in";
  return trimmed.replace(/\/+$/, "");
}

function buildWhitebooksAuthenticateUrl(baseUrl: string, email: string) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const params = new URLSearchParams({ email });
  return `${normalizedBaseUrl}/einvoice/authenticate?${params.toString()}`;
}

function buildWhitebooksGenerateUrl(baseUrl: string, email: string) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const params = new URLSearchParams({ email });
  return `${normalizedBaseUrl}/einvoice/type/GENERATE/version/V1_03?${params.toString()}`;
}

function extractWhitebooksAuthToken(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const root = payload as Record<string, unknown>;
  const nested = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;
  const candidates = [
    root.AuthToken,
    root.authToken,
    root.token,
    nested?.AuthToken,
    nested?.authToken,
    nested?.token,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as EInvoiceRequestBody;
    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
    const credentials = {
      username: readEnv("EWB_USERNAME", "EWAY_BILL_USERNAME", "WHITEBOOKS_USERNAME", "User Name", "USER_NAME"),
      password: readEnv("EWB_PASSWORD", "EWAY_BILL_PASSWORD", "WHITEBOOKS_PASSWORD", "Password"),
      gstin: readEnv("EWB_GSTIN", "EWAY_BILL_GSTIN", "WHITEBOOKS_GSTIN", "GSTIN"),
      apiBaseUrl: readEnv("EWB_BASE_URL", "EWAY_BILL_API_BASE_URL", "EWAY_BILL_API_URL", "WHITEBOOKS_BASE_URL", "EINVOICE_BASE_URL"),
      email: readEnv("EWB_EMAIL", "EWAY_BILL_EMAIL", "WHITEBOOKS_EMAIL", "EMAIL"),
      clientId: readEnv("EWB_CLIENT_ID", "EWAY_BILL_CLIENT_ID", "WHITEBOOKS_CLIENT_ID", "Client ID", "CLIENT_ID"),
      clientSecret: readEnv("EWB_CLIENT_SECRET", "EWAY_BILL_CLIENT_SECRET", "WHITEBOOKS_CLIENT_SECRET", "WHITEBOOKS_CLIENT_SECRET_ID", "Client Secret ID", "CLIENT_SECRET", "CLIENT_SECRET_ID"),
    };

    const authUrl = buildWhitebooksAuthenticateUrl(credentials.apiBaseUrl || "https://apisandbox.whitebooks.in", credentials.email || "rohitindia249@gmail.com");
    const authResponse = await fetch(authUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        gstin: credentials.gstin,
        username: credentials.username,
        password: credentials.password,
        email: credentials.email || "rohitindia249@gmail.com",
      },
    });

    const authText = await authResponse.text();
    let authParsed: unknown = null;
    try {
      authParsed = JSON.parse(authText);
    } catch {
      authParsed = { raw: authText };
    }

    if (!authResponse.ok) {
      return NextResponse.json({ success: false, message: `WhiteBooks authentication failed: ${authText}` }, { status: 400 });
    }

    const authToken = extractWhitebooksAuthToken(authParsed);
    if (!authToken) {
      return NextResponse.json({ success: false, message: "WhiteBooks authentication did not return an auth token." }, { status: 400 });
    }

    const generateUrl = buildWhitebooksGenerateUrl(credentials.apiBaseUrl || "https://apisandbox.whitebooks.in", credentials.email || "rohitindia249@gmail.com");
    const generateResponse = await fetch(generateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        gstin: credentials.gstin,
        username: credentials.username,
        password: credentials.password,
        email: credentials.email || "rohitindia249@gmail.com",
      },
      body: JSON.stringify(payload),
    });

    const generateText = await generateResponse.text();
    let generateParsed: unknown = null;
    try {
      generateParsed = JSON.parse(generateText);
    } catch {
      generateParsed = { raw: generateText };
    }

    return NextResponse.json(
      {
        success: generateResponse.ok,
        message: generateResponse.ok ? "WhiteBooks e-invoice generated successfully." : "WhiteBooks e-invoice generation failed.",
        result: generateParsed,
        raw: generateText,
      },
      { status: generateResponse.ok ? 200 : 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit WhiteBooks e-invoice.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
