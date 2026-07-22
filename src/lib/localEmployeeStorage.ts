export interface EmployeeRecord {
  id: string;
  emp_id: string;
  name: string;
  email?: string;
  mobile?: string;
  address?: string;
  aadhaar?: string;
  pan?: string;
  job_role?: string;
  department?: string;
  salary: number;
  photo_url?: string;
  createdAt?: string;
}

export interface SalaryPageDatabaseEmployee {
  id: string;
  empId: string;
  name: string;
  email?: string | null;
  mobile?: string | null;
  address?: string | null;
  aadhaar?: string | null;
  pan?: string | null;
  jobRole?: string | null;
  department?: string | null;
  salary: number;
  photoUrl?: string | null;
  createdAt?: string | null;
}

export interface SalaryPageDatabaseSalaryRecord {
  id: string;
  employeeId: string;
  amount: number;
  remark: string;
  paidAt: string;
}

export interface SalaryPageDatabaseOtherPayment {
  id: string;
  name: string;
  amount: number;
  paidAt: string;
  transactionType: string;
  mode: string;
  remark: string;
}

export interface SalaryPageDatabasePayload {
  employees: SalaryPageDatabaseEmployee[];
  salaryRecords: SalaryPageDatabaseSalaryRecord[];
  otherPayments: SalaryPageDatabaseOtherPayment[];
}

export interface SalaryRecord {
  id: string;
  employee_id: string;
  amount: number;
  remark: string;
  paid_at: string;
}

export interface OtherPaymentRecord {
  id: string;
  name: string;
  amount: number;
  paid_at: string;
  transaction_type: string;
  mode: string;
  remark: string;
}

export interface SalaryPageData {
  employees: EmployeeRecord[];
  salaryRecords: SalaryRecord[];
  otherPayments: OtherPaymentRecord[];
}

const SALARY_PAGE_DATA_EVENT = "radia-tech-salary-page-data-updated";
let memoryData: SalaryPageData = createDefaultData();
let hydrationPromise: Promise<void> | null = null;
let hasHydrated = false;

const DUMMY_EMPLOYEE_IDS = new Set([
  "EMP001",
  "EMP002",
  "EMP003",
  "EMP004",
  "EMP005",
  "EMP006",
  "EMP007",
]);
const DUMMY_EMPLOYEE_NAMES = new Set([
  "Rohit Kushwaha",
  "Priya Sharma",
  "Amit Verma",
  "Neha Gupta",
  "Vikash Singh",
  "Anjali Mehta",
  "Sandeep Yadav",
]);

export function buildSalaryPageDatabasePayload(data: SalaryPageData): SalaryPageDatabasePayload {
  return {
    employees: data.employees.map((employee) => ({
      id: employee.id,
      empId: employee.emp_id,
      name: employee.name,
      email: employee.email ?? null,
      mobile: employee.mobile ?? null,
      address: employee.address ?? null,
      aadhaar: employee.aadhaar ?? null,
      pan: employee.pan ?? null,
      jobRole: employee.job_role ?? null,
      department: employee.department ?? null,
      salary: employee.salary,
      photoUrl: employee.photo_url ?? null,
      createdAt: employee.createdAt ?? null,
    })),
    salaryRecords: data.salaryRecords.map((record) => ({
      id: record.id,
      employeeId: record.employee_id,
      amount: record.amount,
      remark: record.remark,
      paidAt: record.paid_at,
    })),
    otherPayments: data.otherPayments.map((record) => ({
      id: record.id,
      name: record.name,
      amount: record.amount,
      paidAt: record.paid_at,
      transactionType: record.transaction_type,
      mode: record.mode,
      remark: record.remark,
    })),
  };
}

function createDefaultData(): SalaryPageData {
  return {
    employees: [],
    salaryRecords: [],
    otherPayments: [],
  };
}

function isDummyEmployee(employee: EmployeeRecord): boolean {
  return DUMMY_EMPLOYEE_IDS.has(employee.emp_id) || DUMMY_EMPLOYEE_NAMES.has(employee.name);
}

function normalizeRemotePayload(payload: unknown): SalaryPageData | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const parsed = payload as {
    employees?: Array<Record<string, unknown>>;
    salaryRecords?: Array<Record<string, unknown>>;
    otherPayments?: Array<Record<string, unknown>>;
  };

  const employees = (parsed.employees ?? []).map((employee) => ({
    id: String(employee.id ?? ""),
    emp_id: String(employee.empId ?? employee.emp_id ?? ""),
    name: String(employee.name ?? ""),
    email: typeof employee.email === "string" ? employee.email : undefined,
    mobile: typeof employee.mobile === "string" ? employee.mobile : undefined,
    address: typeof employee.address === "string" ? employee.address : undefined,
    aadhaar: typeof employee.aadhaar === "string" ? employee.aadhaar : undefined,
    pan: typeof employee.pan === "string" ? employee.pan : undefined,
    job_role: typeof employee.jobRole === "string" ? employee.jobRole : undefined,
    department: typeof employee.department === "string" ? employee.department : undefined,
    salary: Number(employee.salary ?? 0),
    photo_url: typeof employee.photoUrl === "string" ? employee.photoUrl : undefined,
    createdAt: typeof employee.createdAt === "string" ? employee.createdAt : undefined,
  }));

  const salaryRecords = (parsed.salaryRecords ?? []).map((record) => ({
    id: String(record.id ?? ""),
    employee_id: String(record.employeeId ?? record.employee_id ?? ""),
    amount: Number(record.amount ?? 0),
    remark: String(record.remark ?? ""),
    paid_at: String(record.paidAt ?? record.paid_at ?? new Date().toISOString()),
  }));

  const otherPayments = (parsed.otherPayments ?? []).map((record) => ({
    id: String(record.id ?? ""),
    name: String(record.name ?? ""),
    amount: Number(record.amount ?? 0),
    paid_at: String(record.paidAt ?? record.paid_at ?? new Date().toISOString()),
    transaction_type: String(record.transactionType ?? record.transaction_type ?? ""),
    mode: String(record.mode ?? ""),
    remark: String(record.remark ?? ""),
  }));

  return {
    employees: employees.filter((employee) => !isDummyEmployee(employee)),
    salaryRecords,
    otherPayments,
  };
}

function emitDataUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SALARY_PAGE_DATA_EVENT));
  }
}

function setMemoryData(data: SalaryPageData) {
  memoryData = {
    employees: data.employees.filter((employee) => !isDummyEmployee(employee)),
    salaryRecords: data.salaryRecords,
    otherPayments: data.otherPayments,
  };
  emitDataUpdated();
}

async function hydrateFromDatabase(force = false) {
  if (typeof window === "undefined") {
    return;
  }

  if (!force && hasHydrated) {
    return;
  }

  if (!force && hydrationPromise) {
    await hydrationPromise;
    return;
  }

  hydrationPromise = (async () => {
    try {
      const response = await fetch("/api/admin/salary-page-data");
      if (!response.ok) {
        return;
      }

      const result = (await response.json()) as { payload?: unknown };
      const remoteData = normalizeRemotePayload(result.payload);
      if (remoteData) {
        setMemoryData(remoteData);
        hasHydrated = true;
      }
    } catch {
      // Ignore hydrate failures.
    }
  })();

  await hydrationPromise;
  hydrationPromise = null;
}

function readStorage(): SalaryPageData {
  if (typeof window === "undefined") {
    return memoryData;
  }

  if (!hasHydrated) {
    void hydrateFromDatabase();
  }

  return memoryData;
}

function writeStorage(data: SalaryPageData) {
  setMemoryData(data);
  void saveSalaryPageData(data);
}

export async function refreshSalaryPageData(): Promise<SalaryPageData> {
  await hydrateFromDatabase(true);
  return memoryData;
}

export async function saveSalaryPageData(data: SalaryPageData): Promise<SalaryPageData> {
  const payload = buildSalaryPageDatabasePayload(data);

  try {
    const baseUrl =
      typeof window !== "undefined" && typeof window.location !== "undefined" && window.location.origin
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000";

    const endpoint = new URL("/api/admin/salary-page-data", baseUrl).toString();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to save salary page data");
    }

    const result = (await response.json()) as { ok?: boolean };
    if (result.ok !== true) {
      throw new Error("Failed to save salary page data");
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to save salary page data");
  }

  setMemoryData(data);
  if (typeof window !== "undefined") {
    void hydrateFromDatabase(true);
  }
  return data;
}

export function getStoredEmployees(): EmployeeRecord[] {
  return readStorage().employees;
}

export function getStoredSalaryRecords(employeeId?: string): SalaryRecord[] {
  const data = readStorage();
  if (!employeeId) {
    return data.salaryRecords;
  }

  return data.salaryRecords.filter((record) => record.employee_id === employeeId);
}

export async function addStoredEmployee(input: Omit<EmployeeRecord, "id" | "createdAt">): Promise<EmployeeRecord> {
  const data = readStorage();
  const employee: EmployeeRecord = {
    ...input,
    id: input.emp_id || `EMP${String(data.employees.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
  };

  const updatedEmployees = [employee, ...data.employees];
  const updatedData = { employees: updatedEmployees, salaryRecords: data.salaryRecords, otherPayments: data.otherPayments };
  setMemoryData(updatedData);
  await saveSalaryPageData(updatedData);
  return employee;
}

export function updateStoredEmployee(employeeId: string, updates: Partial<Omit<EmployeeRecord, "id" | "createdAt">>): EmployeeRecord | null {
  const data = readStorage();
  const employeeIndex = data.employees.findIndex((item) => item.id === employeeId || item.emp_id === employeeId);

  if (employeeIndex === -1) {
    return null;
  }

  const updatedEmployee = {
    ...data.employees[employeeIndex],
    ...updates,
    id: data.employees[employeeIndex].id,
    createdAt: data.employees[employeeIndex].createdAt,
  };

  const updatedEmployees = data.employees.map((item, index) => (index === employeeIndex ? updatedEmployee : item));
  writeStorage({ employees: updatedEmployees, salaryRecords: data.salaryRecords, otherPayments: data.otherPayments });
  return updatedEmployee;
}

export function deleteStoredEmployee(employeeId: string): boolean {
  const data = readStorage();
  const filteredEmployees = data.employees.filter((item) => item.id !== employeeId && item.emp_id !== employeeId);

  if (filteredEmployees.length === data.employees.length) {
    return false;
  }

  const filteredSalaryRecords = data.salaryRecords.filter((record) => record.employee_id !== employeeId);
  writeStorage({ employees: filteredEmployees, salaryRecords: filteredSalaryRecords, otherPayments: data.otherPayments });
  return true;
}

export function addStoredSalaryRecord(employeeId: string, amount: number, remark: string, paidAt?: string): SalaryRecord {
  const data = readStorage();
  const employee = data.employees.find((item) => item.id === employeeId || item.emp_id === employeeId);

  const record: SalaryRecord = {
    id: `SR-${Date.now()}`,
    employee_id: employee?.id ?? employeeId,
    amount,
    remark,
    paid_at: paidAt || new Date().toISOString(),
  };

  const updatedEmployees = data.employees.map((item) => {
    if (item.id === record.employee_id || item.emp_id === employeeId) {
      return { ...item, salary: amount };
    }
    return item;
  });

  const updatedRecords = [record, ...data.salaryRecords];
  writeStorage({ employees: updatedEmployees, salaryRecords: updatedRecords, otherPayments: data.otherPayments });
  return record;
}

export function updateStoredSalaryRecord(recordId: string, updates: Partial<SalaryRecord>): SalaryRecord | null {
  const data = readStorage();
  const recordIndex = data.salaryRecords.findIndex((record) => record.id === recordId);

  if (recordIndex === -1) {
    return null;
  }

  const updatedRecord = {
    ...data.salaryRecords[recordIndex],
    ...updates,
  };

  const updatedRecords = data.salaryRecords.map((record, index) => (index === recordIndex ? updatedRecord : record));
  writeStorage({ employees: data.employees, salaryRecords: updatedRecords, otherPayments: data.otherPayments });
  return updatedRecord;
}

export function deleteStoredSalaryRecord(recordId: string): boolean {
  const data = readStorage();
  const filteredRecords = data.salaryRecords.filter((record) => record.id !== recordId);

  if (filteredRecords.length === data.salaryRecords.length) {
    return false;
  }

  writeStorage({ employees: data.employees, salaryRecords: filteredRecords, otherPayments: data.otherPayments });
  return true;
}
export function getStoredOtherPayments(): OtherPaymentRecord[] {
  return readStorage().otherPayments;
}

export function addStoredOtherPayment(input: Omit<OtherPaymentRecord, "id">): OtherPaymentRecord {
  const data = readStorage();
  const record: OtherPaymentRecord = {
    id: `OP-${Date.now()}`,
    ...input,
  };

  const updatedRecords = [record, ...data.otherPayments];
  writeStorage({ employees: data.employees, salaryRecords: data.salaryRecords, otherPayments: updatedRecords });
  return record;
}

export function updateStoredOtherPayment(recordId: string, updates: Partial<OtherPaymentRecord>): OtherPaymentRecord | null {
  const data = readStorage();
  const idx = data.otherPayments.findIndex((r) => r.id === recordId);
  if (idx === -1) return null;
  const updated = { ...data.otherPayments[idx], ...updates };
  const updatedRecords = data.otherPayments.map((r, i) => (i === idx ? updated : r));
  writeStorage({ employees: data.employees, salaryRecords: data.salaryRecords, otherPayments: updatedRecords });
  return updated;
}

export function deleteStoredOtherPayment(recordId: string): boolean {
  const data = readStorage();
  const filtered = data.otherPayments.filter((r) => r.id !== recordId);
  if (filtered.length === data.otherPayments.length) return false;
  writeStorage({ employees: data.employees, salaryRecords: data.salaryRecords, otherPayments: filtered });
  return true;
}
