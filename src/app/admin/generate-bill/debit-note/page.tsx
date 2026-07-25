"use client";
export const dynamic = "force-dynamic";

import AdminShell from "@/components/admin/AdminShell";
import DNPreview from "@/components/admin/DNPreview";
import ProductCreateModal from "@/components/admin/ProductCreateModal";
import {
  AlignLeft,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  FileText,
  Plus,
  Save,
  Share2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { getDuplicateCopyInvoiceNumber, getDuplicateCopyPageLabels, getInvoiceDuplicateFlag } from "@/lib/invoiceRoute";

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

const fallbackCustomerOptions: Customer[] = [
  {
    id: "",
    name: "",
    contactPerson: "",
    gstin: "",
    phone: "",
    email: "",
    state: "",
    address: "",
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
const PRODUCT_DATALIST_ID = "debit-note-product-options";
const ADD_NEW_CUSTOMER_OPTION = "__add_new_customer__";

const emptyNewCustomerForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstin: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

const UNITS = [
  { value: "MTR", label: "MTR" },
  { value: "PCS", label: "PCS" },
  { value: "FEET", label: "FEET" },
  { value: "KG", label: "KG" },
  { value: "PKT", label: "PKT" },
  { value: "LOT", label: "LOT" },
  { value: "NMR", label: "NOS" },
  { value: "PAIR", label: "PAIR" },
  { value: "LTR", label: "LTR" },
  { value: "ROLLS", label: "ROLLS" },
];

function DebitNotePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");

  const [customers, setCustomers] = useState<Customer[]>(fallbackCustomerOptions);
  const [selectedCustomerId, setSelectedCustomerId] = useState(fallbackCustomerOptions[0].id);
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
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [poNo, setPoNo] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [shipToAddress, setShipToAddress] = useState(fallbackCustomerOptions[0].address);
  const [transportName, setTransportName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [taxType, setTaxType] = useState<TaxType>("cgst-sgst");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: "", hsn: "", unit: "", qty: 1, rate: 0, taxPercent: 0, discountPercent: 0 },
  ]);
  const [notes, setNotes] = useState("Thank you for your business.");
  const [terms, setTerms] = useState("Payment due within 7 days of invoice date.");
  const [paymentMode, setPaymentMode] = useState("Credit");
  const [extraDiscountAmount, setExtraDiscountAmount] = useState(0);
  const [roundOffAmount, setRoundOffAmount] = useState(0);
  const [bankDetails, setBankDetails] = useState(
    "Name: Punjab and Sind Bank, Plot No C1A, Sector 63, Noida\nAccount No: 15111180000370\nIFSC code: PSIB0021511\nAccount holder's name: Radiatech Electra",
  );
  const [authorizedSignature, setAuthorizedSignature] = useState("Authorized Signatory");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState(emptyNewCustomerForm);
  const [newCustomerError, setNewCustomerError] = useState("");
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [activeItemIdForNewProduct, setActiveItemIdForNewProduct] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDescriptionField, setShowDescriptionField] = useState(false);
  const [additionalDescription, setAdditionalDescription] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedDocument, setAttachedDocument] = useState<{ name: string; dataUrl: string } | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [convertedFromProforma, setConvertedFromProforma] = useState(false);
  const [sourceProformaNumber, setSourceProformaNumber] = useState("");
  const [isDuplicateCopy, setIsDuplicateCopy] = useState(false);

  useEffect(() => {
    void fetch("/api/customers")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          const nextCustomers = data as Customer[];
          setCustomers(nextCustomers.length ? nextCustomers : fallbackCustomerOptions);
        }
      })
      .catch(() => undefined);

    void fetch("/api/products")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          setProductOptions(data as ProductOption[]);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!invoiceId) {
      return;
    }

    const loadInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices?id=${encodeURIComponent(invoiceId)}&documentType=invoice`);
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        if (!data) {
          return;
        }
        setIsEditing(true);
        setEditingInvoiceId(invoiceId);
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
        setExtraDiscountAmount(Number(data.extraDiscountAmount || 0));
        setRoundOffAmount(Number(data.roundOff || 0));
        setBankDetails(String(data.bankDetails || ""));
        setAuthorizedSignature(String(data.authorizedSignature || ""));
        setSignatureImage(null);
        setAdditionalDescription(String(data.additionalDescription || ""));
        setShowDescriptionField(Boolean(String(data.additionalDescription || "")));
        setAttachedImage(null);
        setAttachedDocument(null);
        setConvertedFromProforma(Boolean(data.convertedFromProforma));
        setSourceProformaNumber(String(data.sourceProformaNumber || ""));
        setIsDuplicateCopy(Boolean(data.isDuplicate || getInvoiceDuplicateFlag(data as { invoiceNumber?: string | null; isDuplicate?: boolean | null })));
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
        setItems(loadedItems.length ? loadedItems : [{ id: 1, description: "", hsn: "", unit: "", qty: 1, rate: 0, taxPercent: 0, discountPercent: 0 }]);
      } catch {
        // ignore
      }
    };

    void loadInvoice();
  }, [invoiceId]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
    const discountTotal = items.reduce((sum, item) => sum + (item.qty * item.rate * item.discountPercent) / 100, 0);
    const taxableBeforeExtraDiscount = subtotal - discountTotal;
    const taxBeforeExtraDiscount = items.reduce((sum, item) => {
      const taxableAmount = item.qty * item.rate * (1 - item.discountPercent / 100);
      return sum + taxableAmount * (item.taxPercent / 100);
    }, 0);
    const taxable = taxableBeforeExtraDiscount - extraDiscountAmount;
    const tax = taxType === "none"
      ? 0
      : taxType === "igst"
        ? taxBeforeExtraDiscount
        : taxBeforeExtraDiscount;
    const roundOff = roundOffAmount;
    const grandTotal = taxable + tax + roundOff;
    const cgstRate = taxType === "cgst-sgst" ? (items[0]?.taxPercent || 0) / 2 : 0;
    const sgstRate = cgstRate;
    const igstRate = taxType === "igst" ? (items[0]?.taxPercent || 0) : 0;
    const cgst = tax / 2;
    const sgst = tax / 2;
    const igst = tax;

    return {
      subtotal,
      discountTotal,
      taxableBeforeExtraDiscount,
      taxBeforeExtraDiscount,
      extraDiscountAmount,
      taxable,
      tax,
      roundOff,
      grandTotal,
      cgstRate,
      sgstRate,
      igstRate,
      cgst,
      sgst,
      igst,
    };
  }, [items, taxType, extraDiscountAmount, roundOffAmount]);

  const handleCustomerSelect = (value: string) => {
    setSelectedCustomerId(value);
    if (value === ADD_NEW_CUSTOMER_OPTION) {
      setShowAddCustomerModal(true);
      return;
    }
    const selected = customers.find((customer) => customer.id === value);
    if (!selected) return;
    setPartyName(selected.name);
    setContactPerson(selected.contactPerson);
    setPhone(selected.phone);
    setEmail(selected.email);
    setGstin(selected.gstin);
    setState(selected.state);
    setAddress(selected.address);
    setCity(selected.city);
    setPincode(selected.pincode);
  };

  const handleAddNewCustomerSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.phone || !newCustomerForm.email) {
      setNewCustomerError("Name, phone and email are required.");
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
      if (!response.ok) {
        throw new Error(data.error || "Unable to save customer.");
      }
      setCustomers((current) => [data, ...current]);
      setSelectedCustomerId(data.id);
      setPartyName(data.name);
      setContactPerson(data.contactPerson);
      setPhone(data.phone);
      setEmail(data.email);
      setGstin(data.gstin);
      setState(data.state);
      setAddress(data.address);
      setCity(data.city);
      setPincode(data.pincode);
      setShowAddCustomerModal(false);
    } catch (error) {
      setNewCustomerError(error instanceof Error ? error.message : "Unable to save customer.");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleItemNameChange = (itemId: number, value: string) => {
    setItems((current) => current.map((item) => item.id === itemId ? { ...item, description: value } : item));
  };

  const updateItem = (itemId: number, field: keyof InvoiceItem, value: string) => {
    setItems((current) => current.map((item) => {
      const nextItem = { ...item };
      if (field === "qty" || field === "rate" || field === "taxPercent" || field === "discountPercent") {
        nextItem[field] = Number(value) as never;
      } else {
        nextItem[field] = value as never;
      }
      return item.id === itemId ? nextItem : item;
    }));
  };

  const addItem = () => {
    setItems((current) => [...current, { id: Date.now(), description: "", hsn: "", unit: "", qty: 1, rate: 0, taxPercent: 0, discountPercent: 0 }]);
  };

  const removeItem = (itemId: number) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const openAddProductModal = (itemId: number, currentName: string) => {
    setActiveItemIdForNewProduct(itemId);
    setNewProductName(currentName);
    setShowAddProductModal(true);
  };

  const handleProductCreated = async (product: { id: string; name: string; sku?: string; hsn: string; unit: string; price: number; categoryId?: string; rate?: number; taxPercent?: number }) => {
    setShowAddProductModal(false);
    setProductOptions((current) => [...current, {
      id: product.id,
      name: product.name,
      hsn: product.hsn ?? "",
      unit: product.unit ?? "",
      rate: product.rate ?? product.price ?? 0,
      taxPercent: product.taxPercent ?? 0,
    }]);
    setItems((current) => current.map((item) => item.id === activeItemIdForNewProduct ? {
      ...item,
      description: product.name,
      hsn: product.hsn ?? "",
      unit: product.unit ?? "",
      rate: product.rate ?? product.price ?? item.rate,
      taxPercent: product.taxPercent ?? item.taxPercent,
    } : item));
  };

  const formatCurrency = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const numberToIndianWords = (value: number) => {
    const rupees = Math.floor(value);
    const paise = Math.round((value - rupees) * 100);
    return `${rupees.toLocaleString("en-IN")} rupees${paise ? ` and ${paise} paise` : ""}`;
  };

  const renderCompactMetricCell = (amount: number, rate: number) => {
    if (rate <= 0) return <span className="text-slate-400">—</span>;
    return (
      <span className="flex flex-col items-end leading-tight">
        <span>{formatCurrency(amount)}</span>
        <span className="text-[9px] text-slate-400">({rate.toFixed(2)}%)</span>
      </span>
    );
  };

  const handleGenerateInvoice = async () => {
    setIsSaving(true);
    try {
      const method = isEditing && editingInvoiceId ? "PUT" : "POST";
      const url = isEditing && editingInvoiceId ? `/api/invoices?id=${encodeURIComponent(editingInvoiceId)}&documentType=invoice` : "/api/invoices";
      const invoiceNumberToSend = invoiceNumber.trim() ? getDuplicateCopyInvoiceNumber(invoiceNumber.trim(), isDuplicateCopy) : "";
      const invoiceDateToSend = invoiceDate || today;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          documentType: "invoice",
          billType: "Debit Note",
          invoiceNumber: invoiceNumberToSend,
          invoiceDate: invoiceDateToSend,
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
          additionalDescription,
          attachedImage,
          attachedDocument,
          convertedFromProforma,
          sourceProformaNumber,
          isDuplicate: isDuplicateCopy,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          extraDiscountAmount: totals.extraDiscountAmount,
          taxableAmount: totals.taxable,
          taxAmount: totals.tax,
          roundOff: totals.roundOff,
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
        let message = "Unable to save debit note.";
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
      window.alert(error instanceof Error ? error.message : "Unable to save debit note.");
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
    event.target.value = "";
  };

  const removeSignatureImage = () => setSignatureImage(null);

  const handleAttachedImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeAttachedImage = () => setAttachedImage(null);

  const handleAttachedDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachedDocument({ name: file.name, dataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeAttachedDocument = () => setAttachedDocument(null);

  const handleShareInvoice = async () => {
    setIsSharing(true);
    const shareText = `Debit Note ${invoiceNumber || ""} for ${partyName || "customer"} — Grand Total ${formatCurrency(totals.grandTotal)}${dueDateValue ? ` (due ${dueDateValue})` : ""}`;
    try {
      const clipboard = typeof navigator !== "undefined" ? (navigator as Navigator & { clipboard?: { writeText: (text: string) => Promise<void> } }).clipboard : undefined;
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({ title: `Debit Note ${invoiceNumber}`, text: shareText });
      } else if (clipboard) {
        await clipboard.writeText(shareText);
        window.alert("Debit note summary copied to clipboard.");
      } else {
        window.alert(shareText);
      }
    } catch {
      // ignore
    } finally {
      setIsSharing(false);
    }
  };

  const previewPageLabels = getDuplicateCopyPageLabels(isDuplicateCopy);
  const previewInvoice = useMemo(() => ({
    billType: "Debit Note",
    partyName,
    contactPerson,
    address,
    city,
    state,
    pincode,
    phone,
    email,
    gstin,
    invoiceNumber,
    invoiceDate,
    createdAt: invoiceDate,
    poDate,
    ewayBillNo,
    poNo,
    placeOfSupply,
    shipToAddress,
    transportName,
    vehicleNumber,
    taxType,
    extraDiscountAmount,
    roundOff: roundOffAmount,
    paymentMode,
    notes,
    terms,
    bankDetails,
    signatureImage,
    authorizedSignature,
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      hsn: item.hsn,
      qty: item.qty,
      rate: item.rate,
      unit: item.unit,
      discountPercent: item.discountPercent,
      taxPercent: item.taxPercent,
    })),
  }), [address, authorizedSignature, bankDetails, city, contactPerson, email, extraDiscountAmount, gstin, invoiceDate, invoiceNumber, items, notes, partyName, paymentMode, phone, placeOfSupply, pincode, poDate, poNo, roundOffAmount, shipToAddress, signatureImage, state, taxType, terms, transportName, vehicleNumber, ewayBillNo]);

  const inputCls = "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 placeholder-gray-400";
  const selectCls = "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer";
  const labelCls = "block text-[11px] font-medium text-gray-500 mb-1";

  return (
    <AdminShell title={isEditing ? "Edit Debit Note" : "New Debit Note"} description="Fill in the details below — switch to Preview to see the exact debit note that will be saved and printed.">
      <datalist id={PRODUCT_DATALIST_ID}>
        {productOptions.map((product) => (
          <option key={product.id} value={product.name} />
        ))}
      </datalist>

      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 print:hidden">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Add New Customer</h2>
              <button type="button" onClick={() => setShowAddCustomerModal(false)} className="text-sm text-slate-500 hover:text-slate-800">Close</button>
            </div>
            {newCustomerError && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{newCustomerError}</div>}
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleAddNewCustomerSubmit}>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Name *</span><input value={newCustomerForm.name} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })} className="admin-input w-full" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Contact Person</span><input value={newCustomerForm.contactPerson} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, contactPerson: e.target.value })} className="admin-input w-full" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Phone *</span><input value={newCustomerForm.phone} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })} className="admin-input w-full" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email *</span><input type="email" value={newCustomerForm.email} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })} className="admin-input w-full" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">GSTIN</span><input value={newCustomerForm.gstin} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, gstin: e.target.value })} className="admin-input w-full" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Address</span><input value={newCustomerForm.address} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })} className="admin-input w-full" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">City</span><input value={newCustomerForm.city} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })} className="admin-input w-full" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">State</span><input value={newCustomerForm.state} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, state: e.target.value })} className="admin-input w-full" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Pincode</span><input value={newCustomerForm.pincode} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, pincode: e.target.value })} className="admin-input w-full" /></label>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <button type="submit" disabled={isSavingCustomer} className="inline-flex items-center justify-center rounded bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">{isSavingCustomer ? "Saving…" : "Save Customer"}</button>
                <button type="button" onClick={() => setShowAddCustomerModal(false)} className="inline-flex items-center justify-center rounded border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ProductCreateModal open={showAddProductModal} initialName={newProductName} onClose={() => setShowAddProductModal(false)} onProductCreated={handleProductCreated} />

      <div className="min-h-screen bg-[#e8eaf0] font-sans text-[13px]">
        <div className={`${showPreview ? "hidden" : ""} print:hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 bg-[#f4f5f8] px-4 py-2 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-gray-800">{isEditing ? "Edit Debit Note" : "Debit Note"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setShowPreview(true)} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">Preview</button>
              <button type="button" onClick={() => void handleGenerateInvoice()} disabled={isSaving} className="flex items-center gap-1.5 rounded bg-fuchsia-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:bg-fuchsia-400"><Save size={14} />{isSaving ? "Saving…" : isEditing ? "Update Debit Note" : "Save Debit Note"}</button>
            </div>
          </div>

          <div className="mx-auto max-w-[1400px] p-3 space-y-2">
            <div className="rounded bg-white border border-gray-200 shadow-sm p-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="space-y-2">
                  <div>
                    <label className={`${labelCls} text-blue-600`}>Customer <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select value={selectedCustomerId} onChange={(e) => handleCustomerSelect(e.target.value)} className={`${selectCls} border-blue-400 ring-1 ring-blue-200 pr-7`}>
                        <option value="">Select customer…</option>
                        <option value={ADD_NEW_CUSTOMER_OPTION}>+ Add New Customer</option>
                        {customers.filter((c) => c.id).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div><label className={labelCls}>Party Name</label><input value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Party name" className={inputCls} /></div>
                  <div><label className={labelCls}>Contact Person</label><input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact person" className={inputCls} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}>Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone No." className={inputCls} /></div>
                    <div><label className={labelCls}>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputCls} /></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div><label className={labelCls}>Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className={inputCls} /></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className={labelCls}>City</label><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputCls} /></div>
                    <div><label className={labelCls}>State</label><input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className={inputCls} /></div>
                    <div><label className={labelCls}>Pincode</label><input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="PIN" className={inputCls} /></div>
                  </div>
                  <div><label className={labelCls}>GSTIN</label><input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="GSTIN" className={inputCls} /></div>
                  <div><label className={labelCls}>Ship To Address</label><textarea value={shipToAddress} onChange={(e) => setShipToAddress(e.target.value)} rows={2} placeholder="Shipping address" className={`${inputCls} resize-none`} /></div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}>Return Number</label><input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className={inputCls} /></div>
                    <div><label className={labelCls}>Return  Date</label><div className="relative"><input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={`${inputCls} pr-7`} /><CalendarDays size={13} className="absolute right-2 top-1.5 text-gray-400 pointer-events-none" /></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}>Place of Supply</label><input value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} placeholder="—" className={inputCls} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}>Bill No.</label><input value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="Bill No." className={inputCls} /></div>
                    <div><label className={labelCls}>Bill Date</label><input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} className={inputCls} /></div>
                  </div>
                  <div><label className={labelCls}>E-Way Bill No.</label><input value={ewayBillNo} onChange={(e) => setEwayBillNo(e.target.value)} placeholder="E-Way Bill No." className={inputCls} /></div>
                  <div className="flex items-center gap-2 pt-1"><input type="checkbox" id="isDuplicateCopy" checked={isDuplicateCopy} onChange={(e) => setIsDuplicateCopy(e.target.checked)} className="h-4 w-4 accent-blue-600 cursor-pointer" /><label htmlFor="isDuplicateCopy" className="text-[12px] text-gray-600 cursor-pointer select-none">Mark as “Duplicate Copy” (unchecked = “Original for Recipient”)</label></div>
                </div>
              </div>
            </div>

            <div className="rounded bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px]" style={{ minWidth: "980px" }}>
                  <thead>
                    <tr className="bg-[#e8eaf0] text-left text-slate-700">
                      <th className="border border-slate-300 px-2 py-2 font-semibold">#</th>
                      <th className="border border-slate-300 px-2 py-2 font-semibold min-w-[160px]">Item name</th>
                      <th className="border border-slate-300 px-2 py-2 font-semibold">HSN/SAC</th>
                      <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Qty</th>
                      <th className="border border-slate-300 px-2 py-2 font-semibold">Unit</th>
                      <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Price/unit (Rs)</th>
                      <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Disc %</th>
                      <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Tax %</th>
                      <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Taxable/unit</th>
                      <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Taxable Amt</th>
                      <th className="border border-slate-300 px-2 py-2 text-right font-semibold">GST</th>
                      <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Final Rate</th>
                      <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Amount Total</th>
                      <th className="border border-slate-300 px-1 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const taxablePerUnit = item.rate * (1 - item.discountPercent / 100);
                      const taxableAmount = item.qty * taxablePerUnit;
                      const gstAmount = taxableAmount * (item.taxPercent / 100);
                      const finalRate = taxablePerUnit * (1 + item.taxPercent / 100);
                      const rowTotal = taxableAmount + gstAmount;
                      return (
                        <tr key={item.id} className="group hover:bg-slate-50/60 transition-colors">
                          <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-500 align-middle">{index + 1}</td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle"><div className="flex items-center gap-2"><input list={PRODUCT_DATALIST_ID} value={item.description} onChange={(e) => handleItemNameChange(item.id, e.target.value)} placeholder="Item description" className="min-w-0 flex-1 bg-transparent text-[13px] text-gray-800 focus:outline-none placeholder-gray-300" /><button type="button" onClick={() => openAddProductModal(item.id, item.description)} className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 group-hover:pointer-events-auto pointer-events-none">+ New</button></div></td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle"><input value={item.hsn} onChange={(e) => updateItem(item.id, "hsn", e.target.value)} placeholder="—" className="w-full bg-transparent text-[13px] text-gray-800 focus:outline-none" /></td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle"><input type="number" min="0" value={item.qty} onChange={(e) => updateItem(item.id, "qty", e.target.value)} className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle"><div className="relative"><select value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer pr-4"><option value="">—</option>{UNITS.map((unit) => (<option key={unit.value} value={unit.value}>{unit.label}</option>))}</select><ChevronDown size={11} className="absolute right-0.5 top-1.5 text-gray-400 pointer-events-none" /></div></td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle"><input type="number" min="0" value={item.rate === 0 ? "" : item.rate} onChange={(e) => updateItem(item.id, "rate", e.target.value)} placeholder="0" className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle"><input type="number" min="0" max="100" value={item.discountPercent === 0 ? "" : item.discountPercent} onChange={(e) => updateItem(item.id, "discountPercent", e.target.value)} placeholder="0" className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle"><input type="number" min="0" max="100" value={item.taxPercent === 0 ? "" : item.taxPercent} onChange={(e) => updateItem(item.id, "taxPercent", e.target.value)} placeholder="0" className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(taxablePerUnit)}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(taxableAmount)}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right align-middle">{renderCompactMetricCell(gstAmount, item.taxPercent)}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(finalRate)}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right align-middle font-semibold text-slate-900">{formatCurrency(rowTotal)}</td>
                          <td className="border border-slate-300 px-1 py-1.5 text-center align-middle"><button type="button" onClick={() => removeItem(item.id)} className="rounded px-1.5 py-0.5 text-[12px] font-bold text-slate-300 transition hover:bg-red-50 hover:text-red-500">×</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr><td colSpan={14} className="border-t border-slate-100 px-3 py-2"><button type="button" onClick={addItem} className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 transition hover:text-blue-800"><Plus size={13} /> Add Item</button></td></tr>
                    <tr className="bg-slate-50 font-semibold text-slate-900 text-[12px]">
                      <td className="border border-slate-300 px-2 py-2" />
                      <td className="border border-slate-300 px-2 py-2">Total</td>
                      <td className="border border-slate-300 px-2 py-2" />
                      <td className="border border-slate-300 px-2 py-2 text-right">{items.reduce((sum, item) => sum + item.qty, 0)}</td>
                      <td className="border border-slate-300 px-2 py-2" />
                      <td className="border border-slate-300 px-2 py-2" />
                      <td className="border border-slate-300 px-2 py-2" />
                      <td className="border border-slate-300 px-2 py-2" />
                      <td className="border border-slate-300 px-2 py-2" />
                      <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount)}</td>
                      <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.taxBeforeExtraDiscount)}</td>
                      <td className="border border-slate-300 px-2 py-2" />
                      <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount + totals.taxBeforeExtraDiscount)}</td>
                      <td className="border border-slate-300 px-2 py-2" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="rounded bg-white border border-gray-200 shadow-sm p-3">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-2 lg:col-span-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className={labelCls}>Transport Name</label><input value={transportName} onChange={(e) => setTransportName(e.target.value)} placeholder="Transport Name" className={inputCls} /></div>
                    <div><label className={labelCls}>Vehicle Number</label><input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="Vehicle Number" className={inputCls} /></div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {!showDescriptionField && <button type="button" onClick={() => setShowDescriptionField(true)} className="flex items-center gap-1.5 rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors"><AlignLeft size={13} className="text-gray-500" /> ADD DESCRIPTION</button>}
                    <label className="flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors"><Camera size={13} className="text-gray-500" /> ADD IMAGE<input type="file" accept="image/*" onChange={handleAttachedImageUpload} className="hidden" /></label>
                    <label className="flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors"><FileText size={13} className="text-gray-500" /> ADD DOCUMENT<input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={handleAttachedDocumentUpload} className="hidden" /></label>
                  </div>
                  {showDescriptionField && <div><div className="mb-1 flex items-center justify-between"><label className={labelCls}>Additional Description</label><button type="button" onClick={() => { setShowDescriptionField(false); setAdditionalDescription(""); }} className="text-[11px] font-semibold text-red-500 hover:text-red-700">Remove</button></div><textarea value={additionalDescription} onChange={(e) => setAdditionalDescription(e.target.value)} rows={2} placeholder="Extra details about this debit note…" className={`${inputCls} resize-none`} /></div>}
                  {attachedImage && <div className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 p-2"><img src={attachedImage} alt="Attached" className="h-14 w-14 rounded object-cover" /><div className="flex-1 text-[12px] text-gray-600">Reference image attached</div><button type="button" onClick={removeAttachedImage} className="text-[11px] font-semibold text-red-500 hover:text-red-700">Remove</button></div>}
                  {attachedDocument && <div className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 p-2"><FileText size={18} className="text-gray-500" /><a href={attachedDocument.dataUrl} download={attachedDocument.name} className="flex-1 truncate text-[12px] font-medium text-blue-600 hover:underline">{attachedDocument.name}</a><button type="button" onClick={removeAttachedDocument} className="text-[11px] font-semibold text-red-500 hover:text-red-700">Remove</button></div>}
                  <div><label className={labelCls}>Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Thank you for your business." className={`${inputCls} resize-none`} /></div>
                  <div><label className={labelCls}>Terms &amp; Conditions</label><textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} placeholder="Payment due within 7 days of invoice date." className={`${inputCls} resize-none`} /></div>
                  <div><label className={labelCls}>Bank Details</label><textarea value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} rows={4} className={`${inputCls} resize-none`} /></div>
                  <div className="grid grid-cols-2 gap-2 items-end"><div><label className={labelCls}>Authorized Signature Label</label><input value={authorizedSignature} onChange={(e) => setAuthorizedSignature(e.target.value)} placeholder="Authorized Signatory" className={inputCls} /></div><div className="flex items-center gap-3"><div className="flex h-14 w-24 items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">{signatureImage ? <img src={signatureImage} alt="Authorized signature" className="h-full w-full object-contain" /> : "Signature"}</div><div className="flex flex-col gap-1"><label className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:text-blue-800">{signatureImage ? "Replace" : "Upload image"}<input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" /></label>{signatureImage && <button type="button" onClick={removeSignatureImage} className="text-[11px] font-semibold text-red-500 hover:text-red-700 text-left">Remove</button>}</div></div></div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-300 px-2 py-1 w-fit"><span className={`text-[12px] font-medium ${paymentMode.toLowerCase() !== "cash" ? "text-blue-600" : "text-gray-500"}`}>Credit</span><button type="button" onClick={() => setPaymentMode((current) => (current.toLowerCase() === "cash" ? "Credit" : "Cash"))} className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${paymentMode.toLowerCase() === "cash" ? "bg-blue-500" : "bg-gray-300"}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${paymentMode.toLowerCase() === "cash" ? "translate-x-4" : "translate-x-0.5"}`} /></button><span className={`text-[12px] font-medium ${paymentMode.toLowerCase() === "cash" ? "text-blue-600" : "text-gray-500"}`}>Cash</span></div>
                  <div><label className={labelCls}>Payment Mode (custom label)</label><input value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputCls} placeholder="Credit" /></div>
                  <div><label className={labelCls}>Tax Type</label><div className="relative"><select value={taxType} onChange={(e) => setTaxType(e.target.value as TaxType)} className={`${selectCls} pr-7`}><option value="cgst-sgst">CGST + SGST</option><option value="igst">IGST</option><option value="none">No Tax</option></select><ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none" /></div></div>
                  <div className="rounded border border-gray-200 bg-gray-50 p-2 text-[12px] text-gray-700 space-y-1"><div className="flex items-center justify-between"><span className="text-gray-500">Taxable Amount</span><span>{formatCurrency(totals.taxableBeforeExtraDiscount)}</span></div>{taxType === "cgst-sgst" && <><div className="flex items-center justify-between"><span className="text-gray-500">CGST ({totals.cgstRate.toFixed(2)}%)</span><span>{formatCurrency(totals.cgst)}</span></div><div className="flex items-center justify-between"><span className="text-gray-500">SGST ({totals.sgstRate.toFixed(2)}%)</span><span>{formatCurrency(totals.sgst)}</span></div></>}{taxType === "igst" && <div className="flex items-center justify-between"><span className="text-gray-500">IGST ({totals.igstRate.toFixed(2)}%)</span><span>{formatCurrency(totals.igst)}</span></div>}<div className="flex items-center justify-between font-semibold"><span className="text-gray-600">Total Tax</span><span>{formatCurrency(totals.tax)}</span></div></div>
                  <div><label className={labelCls}>Discount on Taxable Amount (₹)</label><input type="number" min="0" step="0.01" value={extraDiscountAmount === 0 ? "" : extraDiscountAmount} onChange={(e) => setExtraDiscountAmount(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)} placeholder="0" className={`${inputCls} text-right`} /></div>
                  <div><label className={labelCls}>Round Off (₹)</label><input type="number" step="0.01" value={roundOffAmount === 0 ? "" : roundOffAmount} onChange={(e) => setRoundOffAmount(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)} placeholder="0" className={`${inputCls} text-right`} /></div>
                  <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-2"><span className="text-[13px] font-semibold text-gray-800">Grand Total</span><span className="text-[14px] font-bold text-gray-900">{formatCurrency(totals.grandTotal)}</span></div>
                  <div className="text-[11px] text-gray-500 leading-snug">{numberToIndianWords(totals.grandTotal)}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pb-2">
              <button type="button" onClick={() => void handleShareInvoice()} disabled={isSharing} className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"><Share2 size={14} /> {isSharing ? "Sharing…" : "Share"}</button>
              <button type="button" onClick={() => void handleGenerateInvoice()} disabled={isSaving} className="flex items-center gap-1.5 rounded bg-fuchsia-600 px-5 py-2 text-[13px] font-semibold text-white shadow hover:bg-fuchsia-700 transition-colors disabled:cursor-not-allowed disabled:bg-fuchsia-400"><Check size={14} />{isSaving ? "Saving…" : isEditing ? "Update" : "Save"}</button>
            </div>
          </div>
        </div>

        <div className={showPreview ? "block" : "hidden print:block"}>
          {showPreview && <div className="mx-auto mb-3 flex max-w-[1000px] items-center justify-between px-1 print:hidden"><span className="text-sm font-semibold text-slate-700">Debit Note Preview</span><button type="button" onClick={() => setShowPreview(false)} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">Back to Editing</button></div>}
          {showPreview && <DNPreview invoice={previewInvoice} taxType={taxType} pageLabels={previewPageLabels} />}
        </div>
      </div>
    </AdminShell>
  );
}

export default function DebitNotePage() {
  return (
    <Suspense fallback={<div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading debit note editor…</div>}>
      <DebitNotePageContent />
    </Suspense>
  );
}
