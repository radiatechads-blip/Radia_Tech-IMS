import { promises as fs } from "fs";
import path from "path";

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  partyName: string;
  contactPerson: string;
  email: string;
  gstin: string;
  phone: string;
  city: string;
  pincode: string;
  state: string;
  address: string;
  poDate?: string | null;
  ewayBillNo: string;
  poNo: string;
  placeOfSupply: string;
  shipToAddress: string;
  transportName: string;
  vehicleNumber: string;
  taxType: string;
  paymentMode: string;
  notes: string;
  terms: string;
  bankDetails: string;
  authorizedSignature: string;
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
  items: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

const storagePath = path.join(process.cwd(), "data", "invoices.json");

async function ensureStore() {
  await fs.mkdir(path.dirname(storagePath), { recursive: true });
  try {
    await fs.access(storagePath);
  } catch {
    await fs.writeFile(storagePath, "[]", "utf8");
  }
}

export async function readInvoiceStore(): Promise<InvoiceRecord[]> {
  await ensureStore();
  const raw = await fs.readFile(storagePath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as InvoiceRecord[]) : [];
}

export async function writeInvoiceStore(records: InvoiceRecord[]) {
  await ensureStore();
  await fs.writeFile(storagePath, JSON.stringify(records, null, 2), "utf8");
}

export async function createInvoiceRecord(input: Omit<InvoiceRecord, "id" | "createdAt" | "updatedAt">): Promise<InvoiceRecord> {
  const now = new Date().toISOString();
  const record: InvoiceRecord = {
    ...input,
    id: `local-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };

  const records = await readInvoiceStore();
  records.unshift(record);
  await writeInvoiceStore(records);
  return record;
}

export async function readInvoiceRecordById(id: string): Promise<InvoiceRecord | null> {
  const records = await readInvoiceStore();
  return records.find((record) => record.id === id) ?? null;
}

export async function updateInvoiceRecord(id: string, input: Partial<Omit<InvoiceRecord, "id" | "createdAt" | "updatedAt">>): Promise<InvoiceRecord | null> {
  const records = await readInvoiceStore();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) {
    return null;
  }

  const updated = {
    ...records[index],
    ...input,
    updatedAt: new Date().toISOString(),
  } as InvoiceRecord;

  records[index] = updated;
  await writeInvoiceStore(records);
  return updated;
}

export async function deleteInvoiceRecord(id: string): Promise<boolean> {
  const records = await readInvoiceStore();
  const next = records.filter((record) => record.id !== id);
  if (next.length === records.length) {
    return false;
  }

  await writeInvoiceStore(next);
  return true;
}
