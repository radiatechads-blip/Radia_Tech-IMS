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

const STORAGE_KEY = "radia-tech-salary-page-data";
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

function readStorage(): SalaryPageData {
  if (typeof window === "undefined") {
    return createDefaultData();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const data = createDefaultData();
      writeStorage(data);
      return data;
    }

    const parsed = JSON.parse(raw) as Partial<SalaryPageData>;
    const employees = Array.isArray(parsed.employees) ? (parsed.employees as EmployeeRecord[]) : [];
    const salaryRecords = Array.isArray(parsed.salaryRecords) ? (parsed.salaryRecords as SalaryRecord[]) : [];
    const otherPayments = Array.isArray(parsed.otherPayments) ? (parsed.otherPayments as OtherPaymentRecord[]) : [];
    const sanitizedEmployees = employees.filter((employee) => !isDummyEmployee(employee));

    if (sanitizedEmployees.length !== employees.length) {
      const cleanedData = { employees: sanitizedEmployees, salaryRecords, otherPayments };
      writeStorage(cleanedData);
      return cleanedData;
    }

    return {
      employees: sanitizedEmployees,
      salaryRecords,
      otherPayments,
    };
  } catch {
    return createDefaultData();
  }
}

function writeStorage(data: SalaryPageData) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage write failures.
  }
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

export function addStoredEmployee(input: Omit<EmployeeRecord, "id" | "createdAt">): EmployeeRecord {
  const data = readStorage();
  const employee: EmployeeRecord = {
    ...input,
    id: input.emp_id || `EMP${String(data.employees.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
  };

  const updatedEmployees = [employee, ...data.employees];
  writeStorage({ employees: updatedEmployees, salaryRecords: data.salaryRecords, otherPayments: data.otherPayments });
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
