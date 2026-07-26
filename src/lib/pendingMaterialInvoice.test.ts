import assert from "node:assert/strict";
import test from "node:test";

import { mapPendingMaterialInvoiceToFormState } from "./pendingMaterialInvoice";

test("mapPendingMaterialInvoiceToFormState loads saved values into the pending-material form state", () => {
  const mapped = mapPendingMaterialInvoiceToFormState(
    {
      partyName: "Acme Industries",
      contactPerson: "Ravi Kumar",
      phone: "9876543210",
      email: "ravi@example.com",
      gstin: "29ABCDE1234F1Z5",
      address: "12 Main Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      invoiceDate: "2026-07-25",
      invoiceNumber: "PMB-000123",
      authorizedSignature: "Head Accounts",
      notes: "Dispatch verified",
      terms: "Payment due in 7 days",
      roundOff: 5,
      taxType: "igst",
      items: [
        {
          description: "Fire alarm panel",
          qty: 3,
          unit: "Nos",
          rate: 2500,
          taxPercent: 18,
        },
      ],
    },
    "2026-07-26",
    "PMB-999999",
    "Authorized Signatory",
    "Material dispatched subject to verification.",
    "Pending bills summary update checklist.",
  );

  assert.equal(mapped.customerName, "Ravi Kumar");
  assert.equal(mapped.customerCompany, "Acme Industries");
  assert.equal(mapped.customerPhone, "9876543210");
  assert.equal(mapped.customerEmail, "ravi@example.com");
  assert.equal(mapped.customerGst, "29ABCDE1234F1Z5");
  assert.equal(mapped.billingDate, "2026-07-25");
  assert.equal(mapped.invoiceNumber, "PMB-000123");
  assert.equal(mapped.preparedBy, "Head Accounts");
  assert.equal(mapped.notes, "Dispatch verified");
  assert.equal(mapped.terms, "Payment due in 7 days");
  assert.equal(mapped.roundOffAmount, 5);
  assert.equal(mapped.taxType, "igst");
  assert.equal(mapped.globalTaxPercent, 18);
  assert.equal(mapped.items[0]?.productName, "Fire alarm panel");
  assert.equal(mapped.items[0]?.qty, 3);
  assert.equal(mapped.items[0]?.rate, 2500);
});
