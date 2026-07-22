import assert from "node:assert/strict";
import test from "node:test";

import { buildSalaryPageDatabasePayload, saveSalaryPageData, type SalaryPageData } from "./localEmployeeStorage";

test("buildSalaryPageDatabasePayload preserves the salary page snapshot", () => {
  const data: SalaryPageData = {
    employees: [
      {
        id: "emp-1",
        emp_id: "EMP001",
        name: "Asha",
        salary: 50000,
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    ],
    salaryRecords: [
      {
        id: "sr-1",
        employee_id: "emp-1",
        amount: 50000,
        remark: "Monthly",
        paid_at: "2024-01-15T00:00:00.000Z",
      },
    ],
    otherPayments: [
      {
        id: "op-1",
        name: "Utilities",
        amount: 1200,
        paid_at: "2024-01-16T00:00:00.000Z",
        transaction_type: "Expense",
        mode: "Cash",
        remark: "Office",
      },
    ],
  };

  const payload = buildSalaryPageDatabasePayload(data);

  assert.equal(payload.employees[0].id, "emp-1");
  assert.equal(payload.salaryRecords[0].employeeId, "emp-1");
  assert.equal(payload.otherPayments[0].name, "Utilities");
});

test("saveSalaryPageData posts the salary page snapshot to the admin API", async () => {
  const calls: Array<{ url: string; options?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), options: init });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    await saveSalaryPageData({ employees: [], salaryRecords: [], otherPayments: [] });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "/api/admin/salary-page-data");
    assert.equal(calls[0].options?.method, "POST");
    const body = JSON.parse(String(calls[0].options?.body));
    assert.deepEqual(body, { employees: [], salaryRecords: [], otherPayments: [] });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
