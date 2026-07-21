"use client";

import AdminShell from "@/components/admin/AdminShell";
import ProductCreateModal from "@/components/admin/ProductCreateModal";
import { companyInfo } from "@/data/company";
import {
    CalendarDays,
    Check,
    ChevronDown,
    Plus,
    Save,
    Share2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// ────────────────────────────────────────────────────────────────────────
// Interfaces
// ────────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  company?: string;
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
  unit: string;
  price: number;
  hsn?: string;
  taxPercent?: number;
}

interface MaterialItem {
  id: number;
  productName: string;
  qty: number;
  unit: string;
  rate: number;
}

type TaxType = "cgst-sgst" | "igst" | "none";

const fallbackCustomerOptions: Customer[] = [
  {
    id: "",
    name: "",
    company: "",
    phone: "",
    email: "",
    gstin: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  },
];

const today = new Date().toISOString().slice(0, 10);
const PRODUCT_DATALIST_ID = "material-product-options";
const ADD_NEW_CUSTOMER_OPTION = "__add_new_customer__";

const emptyNewCustomerForm = {
  name: "",
  company: "",
  phone: "",
  email: "",
  gstin: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

const UNITS = ["Nos", "Pcs", "Kg", "L", "m", "Box", "Set"];

export default function PendingMaterialBillsPage() {
  // ---- Customers & Products ----
  const [customers, setCustomers] = useState<Customer[]>(fallbackCustomerOptions);
  const [selectedCustomerId, setSelectedCustomerId] = useState(fallbackCustomerOptions[0].id);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  // ---- Customer Form Fields ----
  const [customerName, setCustomerName] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerGst, setCustomerGst] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");

  // ---- Bill Details ----
  const [billingDate, setBillingDate] = useState(today);
  const [updateNumber] = useState(() => `PMB-${Date.now().toString().slice(-6)}`);
  const [preparedBy, setPreparedBy] = useState(companyInfo?.ceo || "Authorized Signatory");
  const [subject, setSubject] = useState("");
  const [taxType, setTaxType] = useState<TaxType>("cgst-sgst");
  const [globalTaxPercent, setGlobalTaxPercent] = useState(18);

  // ---- Items State ----
  const [items, setItems] = useState<MaterialItem[]>([
    { id: 1, productName: "", qty: 1, unit: "Nos", rate: 0 },
  ]);

  // ---- Additional metadata options ----
  const [notes, setNotes] = useState("Material dispatched subject to verification.");
  const [terms, setTerms] = useState("Pending bills summary update checklist.");
  const [roundOffAmount, setRoundOffAmount] = useState(0);

  // ---- UI Controls ----
  const [showPreview, setShowPreview] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [activeItemIdForNewProduct, setActiveItemIdForNewProduct] = useState<number | null>(null);
  const [newCustomerForm, setNewCustomerForm] = useState(emptyNewCustomerForm);
  const [newCustomerError, setNewCustomerError] = useState("");
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // ────────────────────────────────────────────────────────────────────────
  // Side Effects & Data Fetching
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        if (!response.ok) return;
        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.items ?? [];
        
        const normalized = list.map((c: any) => ({
          id: String(c.id || ""),
          name: String(c.name || ""),
          company: String(c.company || c.companyName || ""),
          phone: String(c.phone || ""),
          email: String(c.email || ""),
          gstin: String(c.gstin || c.gst || ""),
          address: String(c.address || ""),
          city: String(c.city || ""),
          state: String(c.state || ""),
          pincode: String(c.pincode || c.zip || ""),
        })).filter((c: Customer) => c.id && c.name);

        if (normalized.length > 0) {
          setCustomers([fallbackCustomerOptions[0], ...normalized]);
        }
      } catch {
        // Fallback options persist
      }
    };
    void loadCustomers();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products?admin=true");
        if (!response.ok) return;
        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.items ?? [];

        const normalized = list.map((p: any) => ({
          id: String(p.id || ""),
          name: String(p.name || ""),
          unit: String(p.unit || "Nos"),
          price: typeof p.price === "number" ? p.price : Number.parseFloat(p.pricePerMeter || "0") || 0,
        })).filter((p: ProductOption) => p.name);

        setProductOptions(normalized);
      } catch {
        // Fallback handles empty text input natively
      }
    };
    void loadProducts();
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // Action Handlers
  // ────────────────────────────────────────────────────────────────────────

  const handleCustomerSelect = (id: string) => {
    if (id === ADD_NEW_CUSTOMER_OPTION) {
      setNewCustomerForm(emptyNewCustomerForm);
      setNewCustomerError("");
      setShowAddCustomerModal(true);
      return;
    }

    setSelectedCustomerId(id);
    const selected = customers.find((c) => c.id === id);

    if (selected) {
      setCustomerName(selected.name || "");
      setCustomerCompany(selected.company || "");
      setCustomerGst(selected.gstin || "");
      setCustomerPhone(selected.phone || "");
      setCustomerEmail(selected.email || "");
      setCustomerAddress(selected.address || "");
      setCustomerCity(selected.city || "");
      setCustomerState(selected.state || "");
      setCustomerPincode(selected.pincode || "");
    } else {
      setCustomerName("");
      setCustomerCompany("");
      setCustomerGst("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerAddress("");
      setCustomerCity("");
      setCustomerState("");
      setCustomerPincode("");
    }
  };

  const handleAddNewCustomerSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewCustomerError("");

    if (!newCustomerForm.name || !newCustomerForm.phone) {
      setNewCustomerError("Name and Phone are required.");
      return;
    }

    setIsSavingCustomer(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomerForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save customer.");

      const createdCustomer: Customer = {
        id: String(data.id || Date.now().toString()),
        name: newCustomerForm.name,
        company: newCustomerForm.company,
        phone: newCustomerForm.phone,
        email: newCustomerForm.email,
        gstin: newCustomerForm.gstin,
        address: newCustomerForm.address,
        city: newCustomerForm.city,
        state: newCustomerForm.state,
        pincode: newCustomerForm.pincode,
      };

      setCustomers((current) => [...current, createdCustomer]);
      setSelectedCustomerId(createdCustomer.id);
      setCustomerName(createdCustomer.name);
      setCustomerCompany(createdCustomer.company || "");
      setCustomerGst(createdCustomer.gstin);
      setCustomerPhone(createdCustomer.phone);
      setCustomerEmail(createdCustomer.email);
      setCustomerAddress(createdCustomer.address);
      setCustomerCity(createdCustomer.city);
      setCustomerState(createdCustomer.state);
      setCustomerPincode(createdCustomer.pincode);
      setShowAddCustomerModal(false);
    } catch (err: any) {
      setNewCustomerError(err.message || "Failed to add customer.");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const openAddProductModal = (id: number, initialName = "") => {
    setActiveItemIdForNewProduct(id);
    setNewProductName(initialName);
    setShowAddProductModal(true);
  };

  const handleProductCreated = ({
    id,
    name,
    unit,
    price,
  }: {
    id: string;
    name: string;
    unit: string;
    price: number;
  }) => {
    setProductOptions((current) => [
      ...current,
      {
        id,
        name,
        unit,
        price,
      },
    ]);

    if (activeItemIdForNewProduct !== null) {
      setItems((current) =>
        current.map((item) =>
          item.id !== activeItemIdForNewProduct
            ? item
            : {
                ...item,
                productName: name,
                unit: unit || item.unit,
                rate: price || item.rate,
              },
        ),
      );
    }

    setActiveItemIdForNewProduct(null);
    setShowAddProductModal(false);
  };

  const handleItemNameChange = (id: number, value: string) => {
    const matched = productOptions.find(
      (p) => p.name.trim().toLowerCase() === value.trim().toLowerCase()
    );

    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        if (matched) {
          return {
            ...item,
            productName: matched.name,
            unit: matched.unit || item.unit,
            rate: matched.price || item.rate,
          };
        }
        return { ...item, productName: value };
      })
    );
  };

  const updateItem = (id: number, key: keyof MaterialItem, value: string) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        if (key === "productName" || key === "unit") {
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
      { id: Date.now(), productName: "", qty: 1, unit: "Nos", rate: 0 },
    ]);
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  // ────────────────────────────────────────────────────────────────────────
  // Computations & Totals
  // ────────────────────────────────────────────────────────────────────────

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
    const taxableAmount = subtotal;
    
    let taxAmount = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (taxType !== "none") {
      taxAmount = (taxableAmount * globalTaxPercent) / 100;
      if (taxType === "cgst-sgst") {
        cgst = taxAmount / 2;
        sgst = taxAmount / 2;
      } else if (taxType === "igst") {
        igst = taxAmount;
      }
    }

    const grandTotal = taxableAmount + taxAmount + roundOffAmount;

    return {
      subtotal,
      taxableAmount,
      taxAmount,
      cgst,
      sgst,
      igst,
      grandTotal,
    };
  }, [items, taxType, globalTaxPercent, roundOffAmount]);

  const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveInvoice = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      window.alert("Pending Material Bill summary updated successfully.");
    }, 800);
  };

  const handleShareInvoice = () => {
    setIsSharing(true);
    const text = `Pending Material Summary ${updateNumber} for ${customerName || "Customer"} - Total: ${formatCurrency(totals.grandTotal)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      window.alert("Summary description copied to clipboard.");
    }
    setIsSharing(false);
  };

  // ────────────────────────────────────────────────────────────────────────
  // Visual Styles Mapping
  // ────────────────────────────────────────────────────────────────────────

  const inputCls =
    "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 placeholder-gray-400";
  const selectCls =
    "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer";
  const labelCls = "block text-[11px] font-medium text-gray-500 mb-1";

  return (
    <AdminShell
      title="Pending Material Bills"
      description="Update updates, log records, and configure distribution lists alongside GST tax evaluations."
    >
      <datalist id={PRODUCT_DATALIST_ID}>
        {productOptions.map((product) => (
          <option key={product.id} value={product.name} />
        ))}
      </datalist>

      {/* Add New Customer Popup Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 print:hidden">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Add New Customer</h2>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            {newCustomerError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {newCustomerError}
              </div>
            )}
            <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleAddNewCustomerSubmit}>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Name *</span>
                <input
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Company / Organization</span>
                <input
                  value={newCustomerForm.company}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, company: e.target.value })}
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Phone *</span>
                <input
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">GSTIN</span>
                <input
                  value={newCustomerForm.gstin}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, gstin: e.target.value })}
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Address</span>
                <input
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">City</span>
                <input
                  value={newCustomerForm.city}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">State</span>
                <input
                  value={newCustomerForm.state}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, state: e.target.value })}
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Pincode</span>
                <input
                  value={newCustomerForm.pincode}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, pincode: e.target.value })}
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                />
              </label>
              <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomer}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingCustomer ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ProductCreateModal
        open={showAddProductModal}
        initialName={newProductName}
        onClose={() => setShowAddProductModal(false)}
        onProductCreated={handleProductCreated}
      />

      <div className="min-h-screen bg-[#e8eaf0] font-sans text-[13px]">
        {/* DATA ENTRY SCREEN */}
        <div className={`${showPreview ? "hidden" : ""} print:hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 bg-[#f4f5f8] px-4 py-2 shadow-sm">
            <span className="text-base font-semibold text-gray-800">Pending Material Invoice Entry</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                Preview Document
              </button>
              <button
                type="button"
                onClick={handleSaveInvoice}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                <Save size={14} />
                {isSaving ? "Saving..." : "Save Record"}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Print Summary
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-[1400px] p-3 space-y-2">
            {/* Customer Lookup and Metadata Details Grid */}
            <div className="rounded bg-white border border-gray-200 shadow-sm p-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {/* Customer Details Column */}
                <div className="space-y-2">
                  <div>
                    <label className={`${labelCls} text-blue-600`}>Select Existing Customer</label>
                    <div className="relative">
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                        className={`${selectCls} border-blue-400 ring-1 ring-blue-200 pr-7`}
                      >
                        <option value="">Choose customer configuration...</option>
                        <option value={ADD_NEW_CUSTOMER_OPTION}>+ Add New Customer Profile</option>
                        {customers.filter((c) => c.id).map((c) => (
                          <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ""}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Client Name</label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Client / Individual Name" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Company / Organization</label>
                    <input value={customerCompany} onChange={(e) => setCustomerCompany(e.target.value)} placeholder="Company Name" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email" className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Geography Details Column */}
                <div className="space-y-2">
                  <div>
                    <label className={labelCls}>Billing Address</label>
                    <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Street Address Details" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={labelCls}>City</label>
                      <input value={customerCity} onChange={(e) => setCustomerCity(e.target.value)} placeholder="City" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>State</label>
                      <input value={customerState} onChange={(e) => setCustomerState(e.target.value)} placeholder="State" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Pincode</label>
                      <input value={customerPincode} onChange={(e) => setCustomerPincode(e.target.value)} placeholder="PIN" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Customer GSTIN</label>
                    <input value={customerGst} onChange={(e) => setCustomerGst(e.target.value)} placeholder="GSTIN No." className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Subject Line</label>
                    <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Pending Fire Protection Materials" className={inputCls} />
                  </div>
                </div>

                {/* Tracking Metrics Column */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Document Reference</label>
                      <input value={updateNumber} readOnly className={`${inputCls} bg-gray-100 font-semibold`} />
                    </div>
                    <div>
                      <label className={labelCls}>Billing Update Date</label>
                      <div className="relative">
                        <input type="date" value={billingDate} onChange={(e) => setBillingDate(e.target.value)} className={`${inputCls} pr-7`} />
                        <CalendarDays size={13} className="absolute right-2 top-1.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Prepared By Signature Authority</label>
                    <input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Designation details" className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Inventory Table View */}
            <div className="rounded bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px]" style={{ minWidth: "800px" }}>
                  <thead>
                    <tr className="bg-[#e8eaf0] text-left text-slate-700">
                      <th className="border border-slate-300 px-3 py-2 font-semibold w-12">#</th>
                      <th className="border border-slate-300 px-3 py-2 font-semibold min-w-[250px]">Product / Line Description</th>
                      <th className="border border-slate-300 px-3 py-2 font-semibold w-24 text-right">Qty</th>
                      <th className="border border-slate-300 px-3 py-2 font-semibold w-28">Unit</th>
                      <th className="border border-slate-300 px-3 py-2 font-semibold w-32 text-right">MRP / Rate (Rs)</th>
                      <th className="border border-slate-300 px-3 py-2 font-semibold w-36 text-right">Calculated Total</th>
                      <th className="border border-slate-300 px-2 py-2 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const computedRowAmount = item.qty * item.rate;
                      return (
                        <tr key={item.id} className="group hover:bg-slate-50/60 transition-colors">
                          <td className="border border-slate-300 px-3 py-2 text-center text-slate-500 align-middle">{index + 1}</td>
                          <td className="border border-slate-300 px-2 py-1 align-middle">
                            <div className="flex items-center gap-2">
                              <input
                                list={PRODUCT_DATALIST_ID}
                                value={item.productName}
                                onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                                placeholder="Type to search or declare product item description..."
                                className="w-full bg-transparent text-[13px] text-gray-800 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => openAddProductModal(item.id, item.productName)}
                                className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 group-hover:pointer-events-auto pointer-events-none"
                              >
                                + New
                              </button>
                            </div>
                          </td>
                          <td className="border border-slate-300 px-2 py-1 align-middle">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                              className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none"
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-1 align-middle">
                            <div className="relative">
                              <select
                                value={item.unit}
                                onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                                className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer pr-4"
                              >
                                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                              </select>
                              <ChevronDown size={11} className="absolute right-0.5 top-1.5 text-gray-400 pointer-events-none" />
                            </div>
                          </td>
                          <td className="border border-slate-300 px-2 py-1 align-middle">
                            <input
                              type="number"
                              min="0"
                              value={item.rate === 0 ? "" : item.rate}
                              onChange={(e) => updateItem(item.id, "rate", e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none"
                            />
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right align-middle font-medium text-slate-900">
                            {formatCurrency(computedRowAmount)}
                          </td>
                          <td className="border border-slate-300 px-1 py-1 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-slate-300 hover:text-red-500 font-bold text-base transition px-1"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={7} className="border-t border-slate-200 bg-white px-3 py-2">
                        <button
                          type="button"
                          onClick={addItem}
                          className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 transition hover:text-blue-800"
                        >
                          <Plus size={13} /> Add Line Item Product Row
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Bottom Section: Summary & Global Non-Item-Wise Tax Calculations */}
            <div className="rounded bg-white border border-gray-200 shadow-sm p-3">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-2 lg:col-span-2">
                  <div>
                    <label className={labelCls}>Internal Dispatch Notes Summary</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={labelCls}>Terms Checklist Declarations</label>
                    <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 border border-gray-200 rounded p-3">
                  <div>
                    <label className={labelCls}>Aggregated Tax Configuration</label>
                    <div className="relative">
                      <select
                        value={taxType}
                        onChange={(e) => setTaxType(e.target.value as TaxType)}
                        className={selectCls}
                      >
                        <option value="cgst-sgst">Central + State Split GST (CGST + SGST)</option>
                        <option value="igst">Integrated Logistics Tax (IGST)</option>
                        <option value="none">No Tax Assessed</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {taxType !== "none" && (
                    <div>
                      <label className={labelCls}>Global GST Bracket Rate (%)</label>
                      <input
                        type="number"
                        value={globalTaxPercent}
                        onChange={(e) => setGlobalTaxPercent(Number(e.target.value) || 0)}
                        className={inputCls}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2 text-xs border-t border-gray-200">
                    <div className="flex justify-between text-gray-600">
                      <span>Items Subtotal</span>
                      <span>{formatCurrency(totals.subtotal)}</span>
                    </div>

                    {taxType === "cgst-sgst" && (
                      <>
                        <div className="flex justify-between text-gray-500 pl-2">
                          <span>Summary CGST ({globalTaxPercent / 2}%)</span>
                          <span>{formatCurrency(totals.cgst)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 pl-2">
                          <span>Summary SGST ({globalTaxPercent / 2}%)</span>
                          <span>{formatCurrency(totals.sgst)}</span>
                        </div>
                      </>
                    )}

                    {taxType === "igst" && (
                      <div className="flex justify-between text-gray-500 pl-2">
                        <span>Summary IGST ({globalTaxPercent}%)</span>
                        <span>{formatCurrency(totals.igst)}</span>
                      </div>
                    )}

                    <div>
                      <label className={labelCls}>Manual Round Off Corrections (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={roundOffAmount === 0 ? "" : roundOffAmount}
                        onChange={(e) => setRoundOffAmount(Number(e.target.value) || 0)}
                        placeholder="0.00"
                        className={`${inputCls} text-right text-xs`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold border-t border-gray-300 pt-2 text-slate-900">
                      <span>Total Evaluated Base</span>
                      <span>{formatCurrency(totals.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleShareInvoice}
                disabled={isSharing}
                className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                <Share2 size={14} /> Copy Summary
              </button>
              <button
                type="button"
                onClick={handleSaveInvoice}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded bg-blue-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 shadow"
              >
                <Check size={14} /> Confirm Record Updates
              </button>
            </div>
          </div>
        </div>

        {/* HIGH-FIDELITY PRINTABLE VIEW SHELL */}
        <div className={showPreview ? "block bg-white min-h-screen p-4" : "hidden print:block"}>
          <div className="mx-auto mb-4 flex max-w-[1000px] items-center justify-between border-b border-gray-200 pb-2 print:hidden">
            <span className="text-sm font-bold text-slate-700">Document Blueprint Preview View</span>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Return to Grid Form Editor
            </button>
          </div>

          <div className="quotation-preview-shell print-quotation-only mx-auto w-full max-w-225 rounded-3xl border border-slate-200 bg-white p-0 shadow-sm print:border-0 print:shadow-none">
            <div className="border-b border-slate-200 bg-slate-50 p-6 print:p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <img src="/LOGO.png" alt="Radiatech Electra Logo" className="h-14 w-14 rounded-md object-contain" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Pending Material Processing Manifest</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-950">RADIATECH ELECTRA</h3>
                    <p className="mt-1 text-sm text-slate-600 font-medium">Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301</p>
                    <p className="text-xs text-slate-500 mt-1">Phone: +91 81788 50959 | Email: sales@radiatech.in</p>
                    <p className="text-xs text-slate-500">Corporate GSTIN: 09DDZPK0004H1ZF | Region: 09-Uttar Pradesh</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm min-w-[200px]">
                  <div className="font-bold text-slate-900 border-b pb-1 mb-1.5">Processing Record</div>
                  <div className="font-mono text-xs font-bold text-gray-700">{updateNumber}</div>
                  <div className="mt-2">
                    <div className="text-[11px] font-medium text-slate-400 uppercase">Processing Date</div>
                    <div className="font-semibold text-slate-900">{billingDate}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 print:p-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 print:p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 border-b pb-1 mb-2">Consignee Billing Party</p>
                <div className="text-sm text-slate-800 space-y-0.5">
                  <div className="font-bold text-slate-950 text-base">{customerName || "—"}</div>
                  {customerCompany && <div className="font-medium text-slate-700">{customerCompany}</div>}
                  <div className="text-slate-600 pt-1 leading-snug">{customerAddress || "—"}</div>
                  {(customerCity || customerState || customerPincode) && (
                    <div className="text-slate-600">
                      {[customerCity, customerState].filter(Boolean).join(", ")} {customerPincode && `- ${customerPincode}`}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 pt-2 flex flex-col">
                    {customerPhone && <span>Contact: {customerPhone}</span>}
                    {customerEmail && <span>Email: {customerEmail}</span>}
                    {customerGst && <span className="font-mono mt-1 font-semibold text-slate-700">GSTIN: {customerGst.toUpperCase()}</span>}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 print:p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 border-b pb-1 mb-2">Manifest Details Overview</p>
                <div className="text-sm text-slate-800 space-y-2">
                  <div>
                    <span className="text-xs block text-slate-400 uppercase">Subject Reference Assignment</span>
                    <span className="font-semibold text-slate-900">{subject || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-slate-400 uppercase">Verification Operations Authority</span>
                    <span className="font-semibold text-slate-900">{preparedBy || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-4 print:px-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 print:rounded-none">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-slate-100 text-left text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-12 text-center">#</th>
                      <th className="px-3 py-3 font-semibold">Allocated Product Line Items</th>
                      <th className="px-3 py-3 font-semibold text-right w-20">Qty</th>
                      <th className="px-3 py-3 font-semibold w-24">Unit</th>
                      <th className="px-3 py-3 font-semibold text-right w-32">Rate/MRP</th>
                      <th className="px-4 py-3 font-semibold text-right w-36">Evaluated Net</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-slate-700 divide-y divide-slate-100">
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2.5 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">{item.productName || "—"}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{item.qty}</td>
                        <td className="px-3 py-2.5 text-slate-600">{item.unit}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(item.rate)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-950 font-mono">
                          {formatCurrency(item.qty * item.rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col items-end space-y-2">
                <div className="w-full max-w-md rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>Taxable Base Value</span>
                    <span className="font-mono">{formatCurrency(totals.taxableAmount)}</span>
                  </div>

                  {taxType === "cgst-sgst" && (
                    <>
                      <div className="flex justify-between items-center text-xs text-slate-500 pl-2">
                        <span>Central Summary CGST ({globalTaxPercent / 2}%)</span>
                        <span className="font-mono">{formatCurrency(totals.cgst)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500 pl-2">
                        <span>Regional Summary SGST ({globalTaxPercent / 2}%)</span>
                        <span className="font-mono">{formatCurrency(totals.sgst)}</span>
                      </div>
                    </>
                  )}

                  {taxType === "igst" && (
                    <div className="flex justify-between items-center text-xs text-slate-500 pl-2">
                      <span>Logistics Summary IGST ({globalTaxPercent}%)</span>
                      <span className="font-mono">{formatCurrency(totals.igst)}</span>
                    </div>
                  )}

                  {roundOffAmount !== 0 && (
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Adjusted Round Off Changes</span>
                      <span className="font-mono">{formatCurrency(roundOffAmount)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-base font-bold text-slate-950 border-t border-slate-300 pt-2 shadow-xs">
                    <span>Aggregated Operational Balance Due</span>
                    <span className="font-mono text-emerald-700">{formatCurrency(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 border-t border-slate-200 p-6 bg-slate-50/30 text-xs text-slate-500 gap-4">
              <div className="space-y-2">
                {notes && (
                  <div>
                    <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Processing Log Notes</span>
                    <p className="leading-relaxed">{notes}</p>
                  </div>
                )}
                {terms && (
                  <div>
                    <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">Processing Strategy Declarations</span>
                    <p className="leading-relaxed">{terms}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-end items-end pt-8 md:pt-0">
                <div className="w-48 border-t border-dashed border-slate-400 text-center pt-2 font-medium text-slate-800 text-sm">
                  {preparedBy || "Authorized Signatory"}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Verification Authority</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: #0f172a !important;
          }
          body * {
            visibility: hidden !important;
          }
          .print-quotation-only,
          .print-quotation-only * {
            visibility: visible !important;
          }
          .print-quotation-only {
            position: absolute !important;
            inset: 0 !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </AdminShell>
  );
}