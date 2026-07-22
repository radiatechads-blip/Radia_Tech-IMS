import { NextResponse } from "next/server";

import { jsonError, logServerError } from "@/lib/api";
import { prisma } from "@/lib/db";

function parsePayload(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as {
    employees?: Array<Record<string, unknown>>;
    salaryRecords?: Array<Record<string, unknown>>;
    otherPayments?: Array<Record<string, unknown>>;
  };

  return {
    employees: Array.isArray(payload.employees) ? payload.employees : [],
    salaryRecords: Array.isArray(payload.salaryRecords) ? payload.salaryRecords : [],
    otherPayments: Array.isArray(payload.otherPayments) ? payload.otherPayments : [],
  };
}

async function ensureSalaryPageTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SalaryPageEmployee" (
      "id" TEXT PRIMARY KEY,
      "empId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "email" TEXT,
      "mobile" TEXT,
      "address" TEXT,
      "aadhaar" TEXT,
      "pan" TEXT,
      "jobRole" TEXT,
      "department" TEXT,
      "salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "photoUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SalaryPageSalaryRecord" (
      "id" TEXT PRIMARY KEY,
      "employeeId" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "remark" TEXT NOT NULL DEFAULT '',
      "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SalaryPageOtherPayment" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "transactionType" TEXT NOT NULL DEFAULT '',
      "mode" TEXT NOT NULL DEFAULT '',
      "remark" TEXT NOT NULL DEFAULT ''
    )
  `);
}

export async function GET() {
  try {
    await ensureSalaryPageTables();

    const employees = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
      SELECT "id", "empId", "name", "email", "mobile", "address", "aadhaar", "pan", "jobRole", "department", "salary", "photoUrl", "createdAt"
      FROM "SalaryPageEmployee"
      ORDER BY "createdAt" DESC, "empId" ASC
    `);

    const salaryRecords = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
      SELECT "id", "employeeId", "amount", "remark", "paidAt"
      FROM "SalaryPageSalaryRecord"
      ORDER BY "paidAt" DESC, "id" ASC
    `);

    const otherPayments = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
      SELECT "id", "name", "amount", "paidAt", "transactionType", "mode", "remark"
      FROM "SalaryPageOtherPayment"
      ORDER BY "paidAt" DESC, "id" ASC
    `);

    return NextResponse.json({ payload: { employees, salaryRecords, otherPayments } });
  } catch (error) {
    logServerError("admin.salary-page-data.get", error);
    return jsonError("Unable to load salary page data", 500);
  }
}

export async function POST(request: Request) {
  try {
    const payload = parsePayload(await request.json());

    if (!payload) {
      return jsonError("Invalid payload", 400);
    }

    await ensureSalaryPageTables();

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`DELETE FROM "SalaryPageEmployee"`);
      await tx.$executeRawUnsafe(`DELETE FROM "SalaryPageSalaryRecord"`);
      await tx.$executeRawUnsafe(`DELETE FROM "SalaryPageOtherPayment"`);

      for (const employee of payload.employees) {
        await tx.$executeRawUnsafe(
          `INSERT INTO "SalaryPageEmployee" ("id", "empId", "name", "email", "mobile", "address", "aadhaar", "pan", "jobRole", "department", "salary", "photoUrl", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          String(employee.id ?? ""),
          String(employee.empId ?? employee.emp_id ?? ""),
          String(employee.name ?? ""),
          typeof employee.email === "string" ? employee.email : null,
          typeof employee.mobile === "string" ? employee.mobile : null,
          typeof employee.address === "string" ? employee.address : null,
          typeof employee.aadhaar === "string" ? employee.aadhaar : null,
          typeof employee.pan === "string" ? employee.pan : null,
          typeof employee.jobRole === "string" ? employee.jobRole : null,
          typeof employee.department === "string" ? employee.department : null,
          Number(employee.salary ?? 0),
          typeof employee.photoUrl === "string" ? employee.photoUrl : null,
          typeof employee.createdAt === "string" ? employee.createdAt : new Date().toISOString(),
        );
      }

      for (const record of payload.salaryRecords) {
        await tx.$executeRawUnsafe(
          `INSERT INTO "SalaryPageSalaryRecord" ("id", "employeeId", "amount", "remark", "paidAt")
           VALUES ($1, $2, $3, $4, $5)`,
          String(record.id ?? ""),
          String(record.employeeId ?? record.employee_id ?? ""),
          Number(record.amount ?? 0),
          String(record.remark ?? ""),
          typeof record.paidAt === "string" ? record.paidAt : new Date().toISOString(),
        );
      }

      for (const record of payload.otherPayments) {
        await tx.$executeRawUnsafe(
          `INSERT INTO "SalaryPageOtherPayment" ("id", "name", "amount", "paidAt", "transactionType", "mode", "remark")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          String(record.id ?? ""),
          String(record.name ?? ""),
          Number(record.amount ?? 0),
          typeof record.paidAt === "string" ? record.paidAt : new Date().toISOString(),
          String(record.transactionType ?? record.transaction_type ?? ""),
          String(record.mode ?? ""),
          String(record.remark ?? ""),
        );
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logServerError("admin.salary-page-data.post", error);
    return jsonError("Unable to save salary page data", 500);
  }
}
