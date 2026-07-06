"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// Matches the Customer fields collected in addCustomer/page.tsx and returned
// by /api/customers, so the invoice's Bill To section can capture (and show)
// everything a customer record has — not just a subset.
interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface ProductOption {
  id: string;
  name: string;
  hsn: string;
  unit: string;
  rate: number;
  taxPercent: number;
}

interface InvoiceItem {
  id: number;
  description: string;
  hsn: string;
  unit: string;
  qty: number;
  rate: number;
  taxPercent: number;
  discountPercent: number;
}

type TaxType = "cgst-sgst" | "igst" | "none";

// Used only until /api/customers finishes loading (or if it fails), so the
// form always has something sensible to start from.
const fallbackCustomerOptions: Customer[] = [
  {
    id: "rohit",
    name: "ROHIT KUSHWAHA",
    contactPerson: "",
    gstin: "27ABCDE1234F1Z5",
    phone: "9876543210",
    email: "",
    state: "Maharashtra",
    address: "Pune, Maharashtra",
    city: "",
    pincode: "",
  },
  {
    id: "demo",
    name: "Radiatech Electra",
    contactPerson: "",
    gstin: "27XYZAB9876C1Z2",
    phone: "8178850959",
    email: "",
    state: "Delhi",
    address: "Noida, Uttar Pradesh",
    city: "",
    pincode: "",
  },
];

const today = new Date().toISOString().slice(0, 10);
const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Shared column layout for the item "table" (header row + every item row use this
// exact same set of fixed widths so everything lines up, and the whole block
// scrolls horizontally instead of wrapping onto a new line on narrow screens).
const ITEM_GRID_COLS =
  "grid-cols-[220px_120px_70px_90px_110px_80px_90px_120px_120px_110px_120px_120px_90px]";
const ITEM_ROW_MIN_WIDTH = "min-w-[1560px]";

const ITEM_COLUMN_LABELS = [
  "Item name",
  "HSN/SAC",
  "Qty",
  "Unit",
  "Rate (₹)",
  "Tax %",
  "Discount %",
  "Taxable/Unit",
  "Taxable Amt",
  "GST Amt",
  "Final Rate",
  "Amount Total",
  "",
];

// A single shared <datalist> id so every item row's "Item name" field can act
// as a searchable dropdown of existing products while still accepting a
// freely typed custom value.
const PRODUCT_DATALIST_ID = "invoice-product-options";

export default function InvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");

  // ---- Customers (fetched from /api/customers, same source as addCustomer) ----
  const [customers, setCustomers] = useState<Customer[]>(fallbackCustomerOptions);
  const [selectedCustomerId, setSelectedCustomerId] = useState(fallbackCustomerOptions[0].id);

  // ---- Products (fetched from /api/products) ----
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  const [partyName, setPartyName] = useState(fallbackCustomerOptions[0].name);
  const [contactPerson, setContactPerson] = useState(fallbackCustomerOptions[0].contactPerson);
  const [gstin, setGstin] = useState(fallbackCustomerOptions[0].gstin);
  const [phone, setPhone] = useState(fallbackCustomerOptions[0].phone);
  const [email, setEmail] = useState(fallbackCustomerOptions[0].email);
  const [state, setState] = useState(fallbackCustomerOptions[0].state);
  const [address, setAddress] = useState(fallbackCustomerOptions[0].address);
  const [city, setCity] = useState(fallbackCustomerOptions[0].city);
  const [pincode, setPincode] = useState(fallbackCustomerOptions[0].pincode);

  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDateValue, setDueDateValue] = useState(dueDate);
  const [invoiceNumber, setInvoiceNumber] = useState(() => `INV-${Date.now().toString().slice(-6)}`);
  const [poDate, setPoDate] = useState("");
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [poNo, setPoNo] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("27-Maharashtra");
  const [shipToAddress, setShipToAddress] = useState(fallbackCustomerOptions[0].address);
  const [transportName, setTransportName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("UP16GT7944");
  const [taxType, setTaxType] = useState<TaxType>("cgst-sgst");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: "Fire safety equipment", hsn: "9999", unit: "Nos", qty: 1, rate: 25000, taxPercent: 18, discountPercent: 0 },
  ]);
  const [notes, setNotes] = useState("Thank you for your business.");
  const [terms, setTerms] = useState("Payment due within 7 days of invoice date.");
  const [paymentMode, setPaymentMode] = useState("Credit");
  const [bankDetails, setBankDetails] = useState("Name: Punjab and Sind Bank, Plot No C1A, Sector 63, Noida\nAccount No: 15111180000370\nIFSC code: PSIB0021511\nAccount holder's name: Radiatech Electra");
  const [authorizedSignature, setAuthorizedSignature] = useState("Authorized Signatory");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  

  // Load real customers from the same API addCustomer writes to.
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        if (!response.ok) return;

        const data = await response.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];

        const normalized: Customer[] = list
          .map((customer: Record<string, unknown>) => ({
            id: String(customer.id ?? ""),
            name: String(customer.name ?? ""),
            contactPerson: String(customer.contactPerson ?? ""),
            phone: String(customer.phone ?? ""),
            email: String(customer.email ?? ""),
            gstin: String(customer.gstin ?? ""),
            address: String(customer.address ?? ""),
            city: String(customer.city ?? ""),
            state: String(customer.state ?? ""),
            pincode: String(customer.pincode ?? ""),
          }))
          .filter((customer: Customer) => customer.id && customer.name);

        if (normalized.length > 0) {
          setCustomers(normalized);
        }
      } catch {
        // Keep the fallback options if the request fails.
      }
    };

    void loadCustomers();
  }, []);

  // Load real products so the "Item name" field can offer a dropdown of
  // existing products (while still allowing a freely typed custom value).
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) return;

        const data = await response.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];

        const normalized: ProductOption[] = list
          .map((product: Record<string, unknown>) => ({
            id: String(product.id ?? ""),
            name: String(product.name ?? product.title ?? ""),
            hsn: String(product.hsn ?? product.hsnCode ?? product.hsnSac ?? ""),
            unit: String(product.unit ?? product.uom ?? "Nos"),
            rate: Number(product.rate ?? product.price ?? product.sellingPrice ?? 0),
            taxPercent: Number(product.taxPercent ?? product.gstRate ?? product.gst ?? 0),
          }))
          .filter((product: ProductOption) => product.name);

        setProductOptions(normalized);
      } catch {
        // No products available — the field still works as a plain text input.
      }
    };

    void loadProducts();
  }, []);

  useEffect(() => {
    if (!invoiceId) {
      setIsEditing(false);
      setEditingInvoiceId(null);
      return;
    }

    const loadInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices?id=${encodeURIComponent(invoiceId)}`);
        if (!response.ok) return;

        const data = await response.json();
        if (!data) return;

        setIsEditing(true);
        setEditingInvoiceId(data.id);
        setInvoiceNumber(String(data.invoiceNumber || ""));
        setInvoiceDate(String(data.invoiceDate || today).slice(0, 10));
        setDueDateValue(String(data.dueDate || "").slice(0, 10));
        setPartyName(String(data.partyName || ""));
        setContactPerson(String(data.contactPerson || ""));
        setGstin(String(data.gstin || ""));
        setPhone(String(data.phone || ""));
        setEmail(String(data.email || ""));
        setState(String(data.state || ""));
        setAddress(String(data.address || ""));
        setCity(String(data.city || ""));
        setPincode(String(data.pincode || ""));
        setPoDate(String(data.poDate || "").slice(0, 10));
        setEwayBillNo(String(data.ewayBillNo || ""));
        setPoNo(String(data.poNo || ""));
        setPlaceOfSupply(String(data.placeOfSupply || ""));
        setShipToAddress(String(data.shipToAddress || ""));
        setTransportName(String(data.transportName || ""));
        setVehicleNumber(String(data.vehicleNumber || ""));
        setTaxType((data.taxType as TaxType) || "cgst-sgst");
        setNotes(String(data.notes || ""));
        setTerms(String(data.terms || ""));
        setPaymentMode(String(data.paymentMode || ""));
        setBankDetails(String(data.bankDetails || ""));
        setAuthorizedSignature(String(data.authorizedSignature || ""));
        setSignatureImage(null);

        const loadedItems = Array.isArray(data.items)
          ? data.items.map((item: Record<string, unknown>, index: number) => ({
              id: index + 1,
              description: String(item.description || ""),
              hsn: String(item.hsn || ""),
              unit: String(item.unit || ""),
              qty: Number(item.qty || 0),
              rate: Number(item.rate || 0),
              taxPercent: Number(item.taxPercent || 0),
              discountPercent: Number(item.discountPercent || 0),
            }))
          : [];

        setItems(loadedItems.length > 0 ? loadedItems : [{ id: 1, description: "", hsn: "", unit: "Nos", qty: 1, rate: 0, taxPercent: 0, discountPercent: 0 }]);
      } catch {
        // ignore
      }
    };

    void loadInvoice();
  }, [invoiceId]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
    const discountTotal = items.reduce((sum, item) => {
      const lineTotal = item.qty * item.rate;
      return sum + (lineTotal * item.discountPercent) / 100;
    }, 0);
    const taxable = subtotal - discountTotal;
    const tax = items.reduce((sum, item) => {
      const lineTotal = item.qty * item.rate;
      const discountValue = (lineTotal * item.discountPercent) / 100;
      const discountedValue = lineTotal - discountValue;
      return sum + (discountedValue * item.taxPercent) / 100;
    }, 0);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (taxType === "cgst-sgst") {
      cgst = tax / 2;
      sgst = tax / 2;
    } else if (taxType === "igst") {
      igst = tax;
    }

    const grandTotal = taxable + tax;
    const effectiveTaxRate = taxable > 0 ? (tax / taxable) * 100 : 0;
    const defaultTaxPercent = items.reduce((sum, item) => sum + item.taxPercent, 0) / Math.max(items.length, 1);
    const cgstRate = taxType === "cgst-sgst" ? defaultTaxPercent / 2 : 0;
    const sgstRate = taxType === "cgst-sgst" ? defaultTaxPercent / 2 : 0;
    const igstRate = taxType === "igst" ? defaultTaxPercent : 0;

    return { subtotal, discountTotal, taxable, tax, cgst, sgst, igst, grandTotal, effectiveTaxRate, cgstRate, sgstRate, igstRate };
  }, [items, taxType]);

  const handleCustomerChange = (value: string) => {
    const selected = customers.find((option) => option.id === value);
    if (!selected) return;

    setSelectedCustomerId(value);
    setPartyName(selected.name);
    setContactPerson(selected.contactPerson);
    setGstin(selected.gstin);
    setPhone(selected.phone);
    setEmail(selected.email);
    setState(selected.state);
    setAddress(selected.address);
    setCity(selected.city);
    setPincode(selected.pincode);
    setShipToAddress(selected.address);
  };

  // Looks up a product by exact (case-insensitive) name match, so picking a
  // suggestion from the "Item name" dropdown auto-fills its other fields —
  // while still letting the user simply type their own custom item name.
  const findProductByName = (name: string) =>
    productOptions.find((product) => product.name.trim().toLowerCase() === name.trim().toLowerCase());

  const handleItemNameChange = (id: number, value: string) => {
    const matchedProduct = findProductByName(value);

    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        if (matchedProduct) {
          return {
            ...item,
            description: matchedProduct.name,
            hsn: matchedProduct.hsn || item.hsn,
            unit: matchedProduct.unit || item.unit,
            rate: matchedProduct.rate || item.rate,
            taxPercent: matchedProduct.taxPercent || item.taxPercent,
          };
        }

        return { ...item, description: value };
      })
    );
  };

  const updateItem = (id: number, key: keyof InvoiceItem, value: string) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        if (key === "description" || key === "hsn" || key === "unit") {
          return { ...item, [key]: value };
        }

        const numericValue = Number(value);
        return { ...item, [key]: Number.isFinite(numericValue) ? numericValue : 0 };
      })
    );
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      { id: Date.now(), description: "", hsn: "", unit: "Nos", qty: 1, rate: 0, taxPercent: 0, discountPercent: 0 },
    ]);
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateInvoice = async () => {
    setIsSaving(true);

    try {
      const method = isEditing && editingInvoiceId ? "PUT" : "POST";
      const url = isEditing && editingInvoiceId ? `/api/invoices?id=${encodeURIComponent(editingInvoiceId)}` : "/api/invoices";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          invoiceNumber,
          invoiceDate,
          dueDate: dueDateValue || null,
          partyName,
          contactPerson,
          gstin,
          phone,
          email,
          state,
          address,
          city,
          pincode,
          poDate: poDate || null,
          ewayBillNo,
          poNo,
          placeOfSupply,
          shipToAddress,
          transportName,
          vehicleNumber,
          taxType,
          paymentMode,
          notes,
          terms,
          bankDetails,
          authorizedSignature,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          taxableAmount: totals.taxable,
          taxAmount: totals.tax,
          grandTotal: totals.grandTotal,
          items: items.map((item) => {
            const taxablePerUnit = item.rate * (1 - item.discountPercent / 100);
            const taxableAmount = item.qty * taxablePerUnit;
            const gstAmount = taxableAmount * (item.taxPercent / 100);
            const finalRatePerUnit = taxablePerUnit + taxablePerUnit * (item.taxPercent / 100);
            const rowAmount = taxableAmount + gstAmount;

            return {
              description: item.description,
              hsn: item.hsn,
              unit: item.unit,
              qty: item.qty,
              rate: item.rate,
              taxPercent: item.taxPercent,
              discountPercent: item.discountPercent,
              taxablePerUnit,
              taxableAmount,
              gstAmount,
              finalRatePerUnit,
              rowAmount,
            };
          }),
        }),
      });

      if (!response.ok) {
        let message = "Unable to save invoice.";

        try {
          const errorData = await response.json();
          if (errorData?.error) {
            message = errorData.error;
          }
        } catch {
          const text = await response.text().catch(() => "");
          if (text) {
            message = text;
          }
        }

        throw new Error(`${message} (Status ${response.status})`);
      }

      router.push("/admin/generate-bill");
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Unable to save invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSignatureImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    // allow re-selecting the same file later
    event.target.value = "";
  };

  const removeSignatureImage = () => setSignatureImage(null);

  const handleCustomerSelect = (selectedCustomerId: string) => {
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  if (selectedCustomer) {
    setPartyName(selectedCustomer.name || "");
    setContactPerson(selectedCustomer.contactPerson || "");
    setGstin(selectedCustomer.gstin || "");
    setPhone(selectedCustomer.phone || "");
    setEmail(selectedCustomer.email || "");
    setState(selectedCustomer.state || "");
    setAddress(selectedCustomer.address || "");
    setCity(selectedCustomer.city || "");
    setPincode(selectedCustomer.pincode || "");
  } else {
    // Reset to empty values if no customer is selected
    setPartyName("");
    setContactPerson("");
    setGstin("");
    setPhone("");
    setEmail("");
    setState("");
    setAddress("");
    setCity("");
    setPincode("");
  }
};

  return (
    <AdminShell
      title="Invoice"
      description="Generate a professional invoice with editable items, shipping details, manual invoice details, and printable totals."
      action={
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateInvoice}
            disabled={isSaving}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {isSaving ? "Saving..." : isEditing ? "Update Invoice" : "Generate Invoice"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Print Invoice
          </button>
        </div>
      }
    >
      {/* ===================== Invoice Builder (full width, top) ===================== */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Invoice Builder</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Sales Invoice</h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-sm text-slate-600">
            <div className="font-semibold text-slate-900">Invoice No.</div>
            <div>{invoiceNumber}</div>
          </div>
        </div>

        {/* ---------- Bill To (mirrors every field collected in addCustomer) ---------- */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Select Customer</span>
            <select 
  value={selectedCustomerId} 
  onChange={(e) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    handleCustomerSelect(id);
  }}
  // "admin-input w-full" is the bulky/boxy class used throughout your file
  className="admin-input w-full" 
>
  <option value="">Select a Customer</option>
  {customers.map((customer) => (
    <option key={customer.id} value={customer.id}>
      {customer.name}
    </option>
  ))}
</select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Name</span>
            <input value={partyName} onChange={(event) => setPartyName(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Contact Person</span>
            <input value={contactPerson} onChange={(event) => setContactPerson(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Phone</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">GSTIN</span>
            <input value={gstin} onChange={(event) => setGstin(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Address</span>
            <input value={address} onChange={(event) => setAddress(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
            <input value={city} onChange={(event) => setCity(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">State</span>
            <input value={state} onChange={(event) => setState(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Pincode</span>
            <input value={pincode} onChange={(event) => setPincode(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Invoice No.</span>
            <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Invoice Date</span>
            <input type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Due Date</span>
            <input type="date" value={dueDateValue} onChange={(event) => setDueDateValue(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">PO Date</span>
            <input type="date" value={poDate} onChange={(event) => setPoDate(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">E-way Bill No.</span>
            <input value={ewayBillNo} onChange={(event) => setEwayBillNo(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">PO No.</span>
            <input value={poNo} onChange={(event) => setPoNo(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Place of Supply</span>
            <input value={placeOfSupply} onChange={(event) => setPlaceOfSupply(event.target.value)} className="admin-input w-full" />
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Ship To</span>
            <textarea value={shipToAddress} onChange={(event) => setShipToAddress(event.target.value)} rows={3} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Transportation Details</span>
            <div className="space-y-3">
              <input value={transportName} onChange={(event) => setTransportName(event.target.value)} placeholder="Transport Name" className="admin-input w-full" />
              <input value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value)} placeholder="Vehicle Number" className="admin-input w-full" />
            </div>
          </label>
        </div>

        {/* ---------- Items ---------- */}
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Items</h3>
              <span className="text-sm text-slate-500">
                Pick an existing product from the Item name dropdown, or type your own custom value. Scroll sideways if needed.
              </span>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
            >
              Add Item
            </button>
          </div>

          {/* Shared datalist: makes every "Item name" input a searchable dropdown
              of existing products while still accepting free-typed text. */}
          <datalist id={PRODUCT_DATALIST_ID}>
            {productOptions.map((product) => (
              <option key={product.id} value={product.name} />
            ))}
          </datalist>

          {/* Horizontally scrollable "table": header row + item rows share the exact
              same fixed column widths so nothing ever wraps to the next line. */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <div className={ITEM_ROW_MIN_WIDTH}>
              {/* Header row with a label above every field */}
              <div className={`grid ${ITEM_GRID_COLS} gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2`}>
                {ITEM_COLUMN_LABELS.map((label, index) => (
                  <span key={index} className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {label}
                  </span>
                ))}
              </div>

              {/* Item rows */}
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const taxablePerUnit = item.rate * (1 - item.discountPercent / 100);
                  const taxableAmount = item.qty * taxablePerUnit;
                  const gstAmount = taxableAmount * (item.taxPercent / 100);
                  const finalRatePerUnit = taxablePerUnit + taxablePerUnit * (item.taxPercent / 100);
                  const rowAmount = taxableAmount + gstAmount;

                  return (
                    <div key={item.id} className={`grid ${ITEM_GRID_COLS} gap-2 px-3 py-2`}>
                      <input
                        list={PRODUCT_DATALIST_ID}
                        value={item.description}
                        onChange={(event) => handleItemNameChange(item.id, event.target.value)}
                        placeholder="Item name (type or pick from list)"
                        className="admin-input w-full"
                      />
                      <input value={item.hsn} onChange={(event) => updateItem(item.id, "hsn", event.target.value)} placeholder="HSN/SAC" className="admin-input w-full" />
                      <input type="number" inputMode="numeric" min="1" value={item.qty} onChange={(event) => updateItem(item.id, "qty", event.target.value)} className="admin-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <input value={item.unit} onChange={(event) => updateItem(item.id, "unit", event.target.value)} placeholder="Unit" className="admin-input w-full" />
                      <input type="number" inputMode="numeric" min="0" value={item.rate} onChange={(event) => updateItem(item.id, "rate", event.target.value)} className="admin-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <input type="number" inputMode="numeric" min="0" max="100" value={item.taxPercent} onChange={(event) => updateItem(item.id, "taxPercent", event.target.value)} className="admin-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <input type="number" inputMode="numeric" min="0" max="100" value={item.discountPercent} onChange={(event) => updateItem(item.id, "discountPercent", event.target.value)} className="admin-input w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <input value={taxablePerUnit.toFixed(2)} readOnly className="admin-input w-full bg-slate-50" />
                      <input value={taxableAmount.toFixed(2)} readOnly className="admin-input w-full bg-slate-50" />
                      <input value={gstAmount.toFixed(2)} readOnly className="admin-input w-full bg-slate-50" />
                      <input value={finalRatePerUnit.toFixed(2)} readOnly className="admin-input w-full bg-slate-50" />
                      <input value={rowAmount.toFixed(2)} readOnly className="admin-input w-full bg-slate-50" />
                      <button type="button" onClick={() => removeItem(item.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Tax Type</span>
            <select value={taxType} onChange={(event) => setTaxType(event.target.value as TaxType)} className="admin-input w-full">
              <option value="cgst-sgst">CGST + SGST (Intra-state)</option>
              <option value="igst">IGST (Inter-state)</option>
              <option value="none">No Tax</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Payment Mode</span>
            <input value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="admin-input w-full" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Terms & Conditions</span>
            <textarea value={terms} onChange={(event) => setTerms(event.target.value)} rows={3} className="admin-input w-full" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Bank Details</span>
            <textarea value={bankDetails} onChange={(event) => setBankDetails(event.target.value)} rows={3} className="admin-input w-full" />
          </label>

          {/* ---------- Authorized Signature (text + optional image upload) ---------- */}
          <div className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Authorized Signature</span>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={authorizedSignature}
                onChange={(event) => setAuthorizedSignature(event.target.value)}
                placeholder="Signatory name / designation"
                className="admin-input min-w-[220px] flex-1"
              />
              <label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                {signatureImage ? "Replace Signature Image" : "Upload Signature Image"}
                <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
              </label>
              {signatureImage && (
                <button
                  type="button"
                  onClick={removeSignatureImage}
                  className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Remove Image
                </button>
              )}
            </div>
            {signatureImage && (
              <div className="mt-3 flex h-16 w-32 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white p-1">
                <img src={signatureImage} alt="Signature preview" className="h-full w-full object-contain" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================== Invoice Summary + Tax Invoice Preview (full width, below form) ===================== */}
      <div className="mt-6 space-y-6">
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
        <h3 className="text-lg font-semibold text-slate-950">Invoice Summary</h3>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="px-4 py-2.5 text-slate-500">Subtotal</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(totals.subtotal)}</td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <td className="px-4 py-2.5 text-slate-500">Discount</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(totals.discountTotal)}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="px-4 py-2.5 text-slate-500">Taxable Amount</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(totals.taxable)}</td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <td className="px-4 py-2.5 text-slate-500">Tax</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrency(totals.tax)}</td>
              </tr>
              <tr className="bg-slate-900">
                <td className="px-4 py-3 text-base font-semibold text-white">Grand Total</td>
                <td className="px-4 py-3 text-right text-base font-semibold text-white">{formatCurrency(totals.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

        <section className="invoice-preview-shell rounded-2xl border border-slate-200 bg-white p-3 shadow-sm print:border-[1.2px] print:border-slate-400 print:shadow-none print:p-2">
          <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border-[1.5px] border-slate-300 bg-white text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] print:border-[1.2px] print:border-slate-400 print:rounded-none print:shadow-none print:p-3 print:bg-white">
            <div className="flex items-center justify-between border-b border-slate-300 bg-[#f7f9fc] px-6 py-3">
              <h2 className="text-base font-semibold text-slate-900">Tax invoice</h2>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Original for Recipient</span>
            </div>

            <div className="flex items-start justify-between gap-4 border-b border-slate-300 bg-white px-6 pb-4 pt-4">
              <div className="flex items-start gap-3">
                <img
                  src="/LOGO.png"
                  alt="Radiatech Electra logo"
                  className="h-12 w-12 rounded-md object-contain"
                />
                <div>
                  <h3 className="text-xl font-bold tracking-wide text-slate-950">RADIATECH ELECTRA</h3>
                  <p className="mt-1 text-[11px] text-slate-600">Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301</p>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-600">
                <div>Phone: +91 81788 50959</div>
                <div>Email: sales@radiatech.in</div>
                <div>GSTIN: 09DDZPK0004H1ZF</div>
                <div>State: 09-Uttar Pradesh</div>
              </div>
            </div>

            <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2">
              <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r">
                <div className="rounded-lg border border-slate-300 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bill To:</p>
                  <div className="mt-1 text-[13px] leading-5 text-slate-800">
                    <div className="font-semibold text-slate-900">{partyName}</div>
                    {contactPerson ? <div>Attn: {contactPerson}</div> : null}
                    <div>{address}</div>
                    <div>
                      {[city, state, pincode].filter(Boolean).join(", ") || "—"}
                    </div>
                    <div>Contact No: {phone || "—"}</div>
                    <div>Email: {email || "—"}</div>
                    <div>GSTIN: {gstin || "—"}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4">
                <div className="rounded-lg border border-slate-300 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Invoice Details:</p>
                  <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[13px] text-slate-800">
                    <span className="font-semibold text-slate-900">Invoice No:</span>
                    <span>{invoiceNumber}</span>
                    <span className="font-semibold text-slate-900">Date:</span>
                    <span>{invoiceDate}</span>
                    <span className="font-semibold text-slate-900">PO Date:</span>
                    <span>{poDate || "—"}</span>
                    <span className="font-semibold text-slate-900">E-way Bill No:</span>
                    <span>{ewayBillNo || "—"}</span>
                    <span className="font-semibold text-slate-900">PO No:</span>
                    <span>{poNo || "—"}</span>
                    <span className="font-semibold text-slate-900">Place Of Supply:</span>
                    <span>{placeOfSupply || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2">
              <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r">
                <div className="rounded-lg border border-slate-300 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ship To:</p>
                  <div className="mt-1 text-[13px] text-slate-800 whitespace-pre-line">{shipToAddress || "—"}</div>
                </div>
              </div>
              <div className="bg-white p-4">
                <div className="rounded-lg border border-slate-300 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Transportation Details:</p>
                  <div className="mt-1 text-[13px] text-slate-800">
                    <div>Transport Name: {transportName || "—"}</div>
                    <div>Vehicle Number: {vehicleNumber || "—"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice-table-wrap overflow-hidden border-b border-slate-300">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                <tr className="bg-[#bec9d9] text-left text-slate-700">
                  <th className="border border-slate-300 px-2 py-2 font-semibold">#</th>
                  <th className="border border-slate-300 px-2 py-2 font-semibold">Item name</th>
                  <th className="border border-slate-300 px-2 py-2 font-semibold">HSN/SAC</th>
                  <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Quantity</th>
                  <th className="border border-slate-300 px-2 py-2 font-semibold">Unit</th>
                  <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Price/unit (Rs)</th>
                  <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Taxable Price/unit (Rs)</th>
                  <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Taxable amount (Rs)</th>
                  <th className="border border-slate-300 px-2 py-2 text-right font-semibold">GST (%)</th>
                  <th className="border border-slate-300 px-2 py-2 text-right font-semibold">GST (Rs)</th>
                  <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Final Rate (Rs)</th>
                  <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Amount Total (Rs)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const taxablePerUnit = item.rate * (1 - item.discountPercent / 100);
                  const taxableAmount = item.qty * taxablePerUnit;
                  const gstAmount = taxableAmount * (item.taxPercent / 100);
                  const finalRatePerUnit = taxablePerUnit + taxablePerUnit * (item.taxPercent / 100);
                  const rowAmount = taxableAmount + gstAmount;

                  return (
                    <tr key={item.id}>
                      <td className="border border-slate-300 px-2 py-2 align-top">{index + 1}</td>
                      <td className="border border-slate-300 px-2 py-2 align-top">{item.description || "Item description"}</td>
                      <td className="border border-slate-300 px-2 py-2 align-top">{item.hsn || "—"}</td>
                      <td className="border border-slate-300 px-2 py-2 text-right align-top">{item.qty}</td>
                      <td className="border border-slate-300 px-2 py-2 align-top">{item.unit || "—"}</td>
                      <td className="border border-slate-300 px-2 py-2 text-right align-top">{formatCurrency(item.rate)}</td>
                      <td className="border border-slate-300 px-2 py-2 text-right align-top">{formatCurrency(taxablePerUnit)}</td>
                      <td className="border border-slate-300 px-2 py-2 text-right align-top">{formatCurrency(taxableAmount)}</td>
                      <td className="border border-slate-300 px-2 py-2 text-right align-top">{item.taxPercent}%</td>
                      <td className="border border-slate-300 px-2 py-2 text-right align-top">{formatCurrency(gstAmount)}</td>
                      <td className="border border-slate-300 px-2 py-2 text-right align-top">{formatCurrency(finalRatePerUnit)}</td>
                      <td className="border border-slate-300 px-2 py-2 text-right align-top font-semibold text-slate-900">{formatCurrency(rowAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-slate-900">
                  <td className="border border-slate-300 px-2 py-2" colSpan={3}>Total</td>
                  <td className="border border-slate-300 px-2 py-2 text-right">{items.reduce((sum, item) => sum + item.qty, 0)}</td>
                  <td className="border border-slate-300 px-2 py-2" colSpan={2} />
                  <td className="border border-slate-300 px-2 py-2" />
                  <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.taxable)}</td>
                  <td className="border border-slate-300 px-2 py-2 text-right">—</td>
                  <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.tax)}</td>
                  <td className="border border-slate-300 px-2 py-2" />
                  <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.grandTotal)}</td>
                </tr>
              </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2">
              <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r">
                <div className="invoice-card rounded-lg border border-slate-300 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tax Summary:</p>
                  <label className="mt-2 mb-2 block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tax Option</span>
                    <select value={taxType} onChange={(event) => setTaxType(event.target.value as TaxType)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[12px] text-slate-700">
                      <option value="cgst-sgst">CGST + SGST</option>
                      <option value="igst">IGST</option>
                      <option value="none">No Tax</option>
                    </select>
                  </label>
                  <table className="mt-2 w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-left text-slate-600">
                        <th className="border border-slate-300 px-2 py-1 font-semibold">Taxable</th>
                        {taxType === "cgst-sgst" ? (
                          <>
                            <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST (Rate)</th>
                            <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST (Amt)</th>
                            <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST (Rate)</th>
                            <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST (Amt)</th>
                          </>
                        ) : taxType === "igst" ? (
                          <>
                            <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST (Rate)</th>
                            <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST (Amt)</th>
                          </>
                        ) : null}
                        <th className="border border-slate-300 px-2 py-1 text-right font-semibold">Total Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-[#fbfcfe]">
                        <td className="border border-slate-300 px-2 py-1 font-semibold text-slate-900">{formatCurrency(totals.taxable)}</td>
                        {taxType === "cgst-sgst" ? (
                          <>
                            <td className="border border-slate-300 px-2 py-1 text-right">{totals.cgstRate.toFixed(2)}%</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.cgst)}</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{totals.sgstRate.toFixed(2)}%</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.sgst)}</td>
                          </>
                        ) : taxType === "igst" ? (
                          <>
                            <td className="border border-slate-300 px-2 py-1 text-right">{totals.igstRate.toFixed(2)}%</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.igst)}</td>
                          </>
                        ) : null}
                        <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.tax)}</td>
                      </tr>
                      <tr className="bg-[#ce9b24] font-semibold text-slate-900">
                        <td className="border border-slate-300 px-2 py-1">TOTAL</td>
                        {taxType === "cgst-sgst" ? (
                          <>
                            <td className="border border-slate-300 px-2 py-1 text-right">—</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.cgst)}</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">—</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.sgst)}</td>
                          </>
                        ) : taxType === "igst" ? (
                          <>
                            <td className="border border-slate-300 px-2 py-1 text-right">—</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.igst)}</td>
                          </>
                        ) : null}
                        <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.tax)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-3 text-[12px] text-slate-700">
                    <span className="font-semibold text-slate-900">Invoice Amount in Words: </span>
                    {formatCurrency(totals.grandTotal)} Rupees only
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 text-[13px] text-slate-800">
                <div className="flex items-center justify-between">
                  <span>Taxable Amount</span>
                  <span>: {formatCurrency(totals.taxable)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>Tax</span>
                  <span>: {formatCurrency(totals.tax)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-300 pt-2 text-[15px] font-semibold text-slate-950">
                  <span>Grand Total</span>
                  <span>: {formatCurrency(totals.grandTotal)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span>Payment Mode</span>
                  <span>: {paymentMode}</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-semibold text-slate-900">
                  <span>Balance</span>
                  <span>: {formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-700">
              <div className="rounded-lg border border-slate-300 bg-white p-3">
                <div className="font-semibold text-slate-900">Notes</div>
                <div className="mt-1">{notes}</div>
                <div className="mt-3 font-semibold text-slate-900">Terms & Conditions</div>
                <div className="mt-1">{terms}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 bg-white p-4 sm:grid-cols-2">
              <div>
                <div className="invoice-card rounded-lg border border-slate-300 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bank Details:</p>
                  <div className="mt-2 text-[12px] text-slate-700 whitespace-pre-line">{bankDetails}</div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between text-[13px] text-slate-700">
                <div className="invoice-card rounded-lg border border-slate-300 bg-white p-3">
                  <div className="font-semibold text-slate-900">For Radiatech Electra:</div>
                  <div className="mt-2 flex h-16 w-32 items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
                    {signatureImage ? (
                      <img src={signatureImage} alt="Authorized signature" className="h-full w-full object-contain" />
                    ) : (
                      "Signature"
                    )}
                  </div>
                  <div className="mt-1 text-center text-[11px] font-semibold text-slate-700">{authorizedSignature}</div>
                </div>
              </div>
            </div>
          </div>

          <style jsx global>{`
            @media print {
              body {
                background: white !important;
                margin: 0 !important;
              }
              body * {
                visibility: hidden !important;
              }
              .invoice-preview-shell,
              .invoice-preview-shell * {
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .invoice-preview-shell {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: none !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
              }
              .invoice-preview-shell .mx-auto {
                max-width: none !important;
                width: 100% !important;
                box-shadow: none !important;
                border: 1.2px solid #cbd5e1 !important;
                border-radius: 0 !important;
                box-sizing: border-box !important;
              }
              .invoice-preview-shell .invoice-card,
              .invoice-preview-shell .invoice-table-wrap {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .print\:hidden {
                display: none !important;
              }
            }
          `}</style>
        </section>
      </div>
    </AdminShell>
  );
}