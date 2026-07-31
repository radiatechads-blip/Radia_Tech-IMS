import { existsSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface StoredEwayBillHistoryRecord {
  id: string;
  ewbNo: string;
  ewbDate: string;
  validUpto: string;
  billNo: string;
  docType: string;
  customerName: string;
  gstin: string;
  formData?: Record<string, unknown> | null;
  status?: string;
}

function resolveHistoryFilePath() {
  const override = process.env.EWAY_BILL_HISTORY_FILE?.trim();
  if (override) {
    return override;
  }

  return path.join(process.cwd(), 'data', 'eway-bill-history.json');
}

function ensureHistoryDirectory(filePath: string) {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export async function readStoredHistoryRecords(): Promise<StoredEwayBillHistoryRecord[]> {
  const filePath = resolveHistoryFilePath();
  if (!existsSync(filePath)) {
    return [];
  }

  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as StoredEwayBillHistoryRecord[];
  } catch {
    return [];
  }
}

export async function saveEwayBillHistoryRecord(record: StoredEwayBillHistoryRecord): Promise<StoredEwayBillHistoryRecord[]> {
  const filePath = resolveHistoryFilePath();
  ensureHistoryDirectory(filePath);

  const existing = await readStoredHistoryRecords();
  const withoutDuplicate = existing.filter((item) => item.id !== record.id);
  const next = [record, ...withoutDuplicate].slice(0, 50);
  await writeFile(filePath, JSON.stringify(next, null, 2), 'utf8');
  return next;
}
