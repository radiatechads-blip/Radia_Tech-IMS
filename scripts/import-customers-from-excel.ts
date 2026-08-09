import "dotenv/config";
import path from "path";
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";

const workbookPath = "c:/Users/dell/OneDrive/Desktop/PartyReport.xlsx";
const states = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function buildUniqueEmail(name: string, index: number): string {
  const slug = normalizeName(name) || `customer${index}`;
  return `${slug}${index}@local.invalid`;
}

function splitAddress(addressText: string) {
  const cleaned = normalizeWhitespace(addressText.replace(/\r/g, " ").replace(/\n/g, " "));
  if (!cleaned) {
    return { address: "", city: "", state: "", pincode: "" };
  }

  const pincodeMatch = cleaned.match(/\b(\d{6})\b/);
  const pincode = pincodeMatch?.[1] ?? "";
  let textWithoutPin = cleaned;
  if (pincode) {
    textWithoutPin = textWithoutPin.replace(pincode, "").replace(/\s{2,}/g, " ").trim();
  }

  let state = "";
  for (const candidate of states) {
    const regex = new RegExp(`\\b${candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(textWithoutPin)) {
      state = candidate;
      textWithoutPin = textWithoutPin.replace(regex, " ").replace(/\s{2,}/g, " ").trim();
      break;
    }
  }

  const segments = textWithoutPin
    .split(/[\n,]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  let city = "";
  let address = "";

  if (segments.length > 1) {
    city = segments[segments.length - 1];
    address = segments.slice(0, -1).join(", ").trim();
  } else if (segments.length === 1) {
    city = segments[0];
  }

  return {
    address: normalizeWhitespace(address),
    city: normalizeWhitespace(city),
    state: normalizeWhitespace(state),
    pincode,
  };
}

async function main() {
  const filePath = path.resolve(workbookPath);
  const workbook = XLSX.read(filePath, { type: "file" });
  const sheetName = workbook.SheetNames.find((name) => name.toLowerCase().includes("party")) ?? workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

  const existingCustomers = await prisma.customer.findMany();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let index = 1;

  for (const row of rows) {
    const name = toText(row.Name || row.name);
    if (!name) {
      skipped += 1;
      continue;
    }

    const email = toText(row.Email || row.email);
    const phone = toText(row["Phone No."] || row.phone || row.Phone);
    const gstin = toText(row.GSTIN || row.gstin);
    const addressText = toText(row.Address || row.address);
    const parsedAddress = splitAddress(addressText);

    const existingCustomer = existingCustomers.find((customer) => {
      const customerName = normalizeName(customer.name || "");
      if (email && customer.email && customer.email.toLowerCase() === email.toLowerCase()) {
        return true;
      }
      return customerName && customerName === normalizeName(name);
    });

    if (existingCustomer) {
      if (!existingCustomer.id) {
        skipped += 1;
        continue;
      }

      const nextPhone = phone || existingCustomer.phone || "";
      const nextEmail = email || existingCustomer.email || "";
      const nextGstin = gstin || existingCustomer.gstin || "";
      const nextAddress = parsedAddress.address || existingCustomer.address || "";
      const nextCity = parsedAddress.city || existingCustomer.city || "";
      const nextState = parsedAddress.state || existingCustomer.state || "";
      const nextPincode = parsedAddress.pincode || existingCustomer.pincode || "";

      await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          name: existingCustomer.name || name,
          phone: nextPhone,
          email: nextEmail,
          gstin: nextGstin,
          address: nextAddress,
          city: nextCity,
          state: nextState,
          pincode: nextPincode,
        },
      });
      updated += 1;
      existingCustomers.splice(existingCustomers.indexOf(existingCustomer), 1, {
        ...existingCustomer,
        name: existingCustomer.name || name,
        phone: nextPhone,
        email: nextEmail,
        gstin: nextGstin,
        address: nextAddress,
        city: nextCity,
        state: nextState,
        pincode: nextPincode,
      });
    } else {
      const createEmail = email || buildUniqueEmail(name, index);
      const createdCustomer = await prisma.customer.create({
        data: {
          name,
          contactPerson: "",
          phone,
          email: createEmail,
          gstin,
          address: parsedAddress.address,
          city: parsedAddress.city,
          state: parsedAddress.state,
          pincode: parsedAddress.pincode,
        },
      });
      created += 1;
      existingCustomers.push(createdCustomer);
      index += 1;
    }
  }

  console.log(`Import complete. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
