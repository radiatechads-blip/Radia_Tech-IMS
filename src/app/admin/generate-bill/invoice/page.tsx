"use client";
export const dynamic = "force-dynamic";

import AdminShell from "@/components/admin/AdminShell";
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
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getDuplicateCopyInvoiceNumber, getDuplicateCopyPageLabels, getInvoiceDuplicateFlag } from "@/lib/invoiceRoute";

// ────────────────────────────────────────────────────────────────────────
// Types — identical to invoice/page.tsx (file 1). The item shape/logic for
// adding items is taken strictly from file 1, not the simplified Sale table.
// ────────────────────────────────────────────────────────────────────────

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

// Shared datalist id: makes every "Item name" input a searchable dropdown of
// existing products while still accepting a freely typed custom value.
const PRODUCT_DATALIST_ID = "invoice-product-options";

// Special sentinel value used in the customer <select> to trigger the
// "Add New Customer" popup instead of selecting an actual customer.
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

export default function InvoicePage() {
  const router = useRouter();
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [sourceInvoiceId, setSourceInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    setInvoiceId(new URLSearchParams(window.location.search).get("invoiceId"));
    setSourceInvoiceId(new URLSearchParams(window.location.search).get("fromProformaId"));
  }, []);

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
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [isLoadingProformas, setIsLoadingProformas] = useState(false);
  const [importableProformas, setImportableProformas] = useState<
    { id: string; invoiceNumber: string; partyName: string; invoiceDate: string; grandTotal: number }[]
  >([]);

  // ---- Conversion / duplication metadata ----
  const [convertedFromProforma, setConvertedFromProforma] = useState(false);
  const [sourceProformaNumber, setSourceProformaNumber] = useState("");
  const [isDuplicateCopy, setIsDuplicateCopy] = useState(false);

  // ---- Add New Customer popup ----
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState(emptyNewCustomerForm);
  const [newCustomerError, setNewCustomerError] = useState("");
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [activeItemIdForNewProduct, setActiveItemIdForNewProduct] = useState<number | null>(null);

  // ---- Preview toggle: shows the exact printable/saved invoice (file 1 UI)
  // inline on screen. Regardless of this toggle, printing / PDF generation
  // always uses this same exact markup (see print CSS below).
  const [showPreview, setShowPreview] = useState(false);

  // ---- "Add Description / Add Image / Add Document" — internal invoice
  // attachments. additionalDescription is opt-in extra text that (like Notes
  // and Terms) also appears on the printed invoice once non-empty. The image
  // and document are reference attachments kept with the record but are not
  // printed on the invoice itself (same as how real invoicing apps treat
  // supporting photos/files versus the invoice content).
  const [showDescriptionField, setShowDescriptionField] = useState(false);
  const [additionalDescription, setAdditionalDescription] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedDocument, setAttachedDocument] = useState<{ name: string; dataUrl: string } | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // ── data application / lookups (identical logic to file 1) ─────────────

  const applyInvoiceData = (data: Record<string, unknown>) => {
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

    const parsedExtraDiscount = Number(data.extraDiscountAmount);
    setExtraDiscountAmount(Number.isFinite(parsedExtraDiscount) ? parsedExtraDiscount : 0);
    setRoundOffAmount(Number(data.roundOff || 0));
    setBankDetails(String(data.bankDetails || ""));
    setAuthorizedSignature(String(data.authorizedSignature || ""));
    setSignatureImage(null);

    const loadedDescription = String(data.additionalDescription || "");
    setAdditionalDescription(loadedDescription);
    setShowDescriptionField(Boolean(loadedDescription));
    setAttachedImage(data.attachedImage ? String(data.attachedImage) : null);
    setAttachedDocument(
      data.attachedDocument && typeof data.attachedDocument === "object"
        ? {
            name: String((data.attachedDocument as Record<string, unknown>).name || "Attachment"),
            dataUrl: String((data.attachedDocument as Record<string, unknown>).dataUrl || ""),
          }
        : null,
    );

    setConvertedFromProforma(Boolean(data.convertedFromProforma));
    setSourceProformaNumber(String(data.sourceProformaNumber || ""));
    setIsDuplicateCopy(Boolean(data.isDuplicate) || getInvoiceDuplicateFlag(data as Record<string, unknown>));

    const loadedItems = Array.isArray(data.items)
      ? (data.items as Record<string, unknown>[]).map((item, index) => ({
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

    setItems(
      loadedItems.length > 0
        ? loadedItems
        : [{ id: 1, description: "", hsn: "", unit: "Nos", qty: 1, rate: 0, taxPercent: 0, discountPercent: 0 }],
    );

    const incomingPartyName = String(data.partyName || "").trim().toLowerCase();
    const matchingCustomer = customers.find((customer) => customer.name.trim().toLowerCase() === incomingPartyName);

    if (matchingCustomer) {
      setSelectedCustomerId(matchingCustomer.id);
      setPartyName(matchingCustomer.name || "");
      setContactPerson(matchingCustomer.contactPerson || "");
      setGstin(matchingCustomer.gstin || "");
      setPhone(matchingCustomer.phone || "");
      setEmail(matchingCustomer.email || "");
      setState(matchingCustomer.state || "");
      setAddress(matchingCustomer.address || "");
      setCity(matchingCustomer.city || "");
      setPincode(matchingCustomer.pincode || "");
    } else {
      setSelectedCustomerId("");
    }
  };

  const handleCustomerSelect = (id: string) => {
    if (id === ADD_NEW_CUSTOMER_OPTION) {
      setNewCustomerForm(emptyNewCustomerForm);
      setNewCustomerError("");
      setShowAddCustomerModal(true);
      return;
    }

    setSelectedCustomerId(id);
    const selected = customers.find((customer) => customer.id === id);

    if (selected) {
      setPartyName(selected.name || "");
      setContactPerson(selected.contactPerson || "");
      setGstin(selected.gstin || "");
      setPhone(selected.phone || "");
      setEmail(selected.email || "");
      setState(selected.state || "");
      setAddress(selected.address || "");
      setCity(selected.city || "");
      setPincode(selected.pincode || "");
      setShipToAddress(selected.address || "");
    } else {
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

  const handleAddNewCustomerSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewCustomerError("");

    if (!newCustomerForm.name || !newCustomerForm.phone || !newCustomerForm.email) {
      setNewCustomerError("Name, phone, and email are required.");
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
      if (!response.ok) throw new Error(data.error || "Unable to add customer.");

      const createdCustomer: Customer = {
        id: String(data.id ?? ""),
        name: String(data.name ?? newCustomerForm.name ?? ""),
        contactPerson: String(data.contactPerson ?? newCustomerForm.contactPerson ?? ""),
        phone: String(data.phone ?? newCustomerForm.phone ?? ""),
        email: String(data.email ?? newCustomerForm.email ?? ""),
        gstin: String(data.gstin ?? newCustomerForm.gstin ?? ""),
        address: String(data.address ?? newCustomerForm.address ?? ""),
        city: String(data.city ?? newCustomerForm.city ?? ""),
        state: String(data.state ?? newCustomerForm.state ?? ""),
        pincode: String(data.pincode ?? newCustomerForm.pincode ?? ""),
      };

      setCustomers((current) => [createdCustomer, ...current]);

      setSelectedCustomerId(createdCustomer.id);
      setPartyName(createdCustomer.name || "");
      setContactPerson(createdCustomer.contactPerson || "");
      setGstin(createdCustomer.gstin || "");
      setPhone(createdCustomer.phone || "");
      setEmail(createdCustomer.email || "");
      setState(createdCustomer.state || "");
      setAddress(createdCustomer.address || "");
      setCity(createdCustomer.city || "");
      setPincode(createdCustomer.pincode || "");
      setShipToAddress(createdCustomer.address || "");

      setShowAddCustomerModal(false);
      setNewCustomerForm(emptyNewCustomerForm);
    } catch (submitError) {
      setNewCustomerError(submitError instanceof Error ? submitError.message : "Unable to add customer.");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const findProductByName = (name: string) =>
    productOptions.find((product) => product.name.trim().toLowerCase() === name.trim().toLowerCase());

  const openAddProductModal = (id: number, initialName = "") => {
    setActiveItemIdForNewProduct(id);
    setNewProductName(initialName);
    setShowAddProductModal(true);
  };

  const handleProductCreated = ({
    id,
    name,
    hsn,
    unit,
    price,
  }: {
    id: string;
    name: string;
    hsn: string;
    unit: string;
    price: number;
  }) => {
    setProductOptions((current) => [
      ...current,
      {
        id,
        name,
        hsn,
        unit,
        rate: price,
        taxPercent: 0,
      },
    ]);

    if (activeItemIdForNewProduct !== null) {
      setItems((current) =>
        current.map((item) =>
          item.id !== activeItemIdForNewProduct
            ? item
            : {
                ...item,
                description: name,
                hsn: hsn || item.hsn,
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
      }),
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
      }),
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

  // ── totals (identical logic to file 1) ──────────────────────────────────

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
    const discountTotal = items.reduce((sum, item) => {
      const lineTotal = item.qty * item.rate;
      return sum + (lineTotal * item.discountPercent) / 100;
    }, 0);
    const taxableBeforeExtraDiscount = Math.max(subtotal - discountTotal, 0);
    const extraDiscount = Number(extraDiscountAmount || 0);
    const taxable = Math.max(taxableBeforeExtraDiscount - extraDiscount, 0);
    const roundOff = Number(roundOffAmount || 0);
    const taxBeforeExtraDiscount = items.reduce((sum, item) => {
      const lineTotal = item.qty * item.rate;
      const discountValue = (lineTotal * item.discountPercent) / 100;
      const discountedValue = lineTotal - discountValue;
      return sum + (discountedValue * item.taxPercent) / 100;
    }, 0);
    const tax = taxableBeforeExtraDiscount > 0 ? (taxBeforeExtraDiscount / taxableBeforeExtraDiscount) * taxable : 0;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (taxType === "cgst-sgst") {
      cgst = tax / 2;
      sgst = tax / 2;
    } else if (taxType === "igst") {
      igst = tax;
    }

    const grandTotalBeforeRoundOff = taxable + tax;
    const grandTotal = grandTotalBeforeRoundOff + roundOff;
    const effectiveTaxRate = taxable > 0 ? (tax / taxable) * 100 : 0;
    const defaultTaxPercent = items.reduce((sum, item) => sum + item.taxPercent, 0) / Math.max(items.length, 1);
    const cgstRate = taxType === "cgst-sgst" ? defaultTaxPercent / 2 : 0;
    const sgstRate = taxType === "cgst-sgst" ? defaultTaxPercent / 2 : 0;
    const igstRate = taxType === "igst" ? defaultTaxPercent : 0;

    return {
      subtotal,
      discountTotal,
      extraDiscountAmount: extraDiscount,
      taxableBeforeExtraDiscount,
      taxable,
      tax,
      taxBeforeExtraDiscount,
      roundOff,
      grandTotal,
      effectiveTaxRate,
      cgst,
      sgst,
      igst,
      cgstRate,
      sgstRate,
      igstRate,
    };
  }, [items, taxType, extraDiscountAmount, roundOffAmount]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

  const numberToIndianWords = (value: number) => {
    const isNegative = value < 0;
    const absoluteValue = Math.abs(Math.round(value));
    const rupees = Math.floor(absoluteValue);
    const paise = Math.round((Math.abs(value) - Math.floor(Math.abs(value))) * 100);

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const lessThan100 = (num: number): string => {
      if (num < 10) return ones[num];
      if (num < 20) return teens[num - 10];
      const last = num % 10;
      const prefix = tens[Math.floor(num / 10)];
      return last ? `${prefix} ${ones[last]}` : prefix;
    };

    const lessThan1000 = (num: number): string => {
      if (num < 100) return lessThan100(num);
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      return remainder ? `${ones[hundred]} Hundred ${lessThan100(remainder)}` : `${ones[hundred]} Hundred`;
    };

    const convert = (num: number): string => {
      if (num === 0) return "Zero";
      if (num < 100) return lessThan100(num);
      if (num < 1000) return lessThan1000(num);

      const crore = Math.floor(num / 10000000);
      const lakh = Math.floor((num % 10000000) / 100000);
      const thousand = Math.floor((num % 100000) / 1000);
      const rest = num % 1000;

      const parts: string[] = [];
      if (crore > 0) parts.push(`${convert(crore)} Crore`);
      if (lakh > 0) parts.push(`${convert(lakh)} Lakh`);
      if (thousand > 0) parts.push(`${convert(thousand)} Thousand`);
      if (rest > 0) parts.push(lessThan1000(rest));

      return parts.join(" ");
    };

    const rupeeWords = convert(rupees);
    const prefix = isNegative ? "Minus " : "";

    if (paise > 0) {
      return `${prefix}${rupeeWords || "Zero"} Rupees And ${convert(paise)} Paise Only`;
    }

    return `${prefix}${rupeeWords || "Zero"} Rupees Only`;
  };

  const renderCompactMetricCell = (amount: number, percent: number) => {
    const formattedPercent = percent.toFixed(2).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

    return (
      <div className="leading-tight">
        <div className="font-medium text-slate-900">{formatCurrency(amount)}</div>
        <div className="text-[10px] text-slate-500">({formattedPercent}%)</div>
      </div>
    );
  };

  // ── API calls (identical logic to file 1) ───────────────────────────────

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
    if (sourceInvoiceId) {
      setIsEditing(false);
      setEditingInvoiceId(null);
      setInvoiceNumber(() => `INV-${Date.now().toString().slice(-6)}`);

      const loadConvertedInvoice = async () => {
        try {
          const response = await fetch(`/api/invoices?id=${encodeURIComponent(sourceInvoiceId)}&documentType=invoice`);
          if (!response.ok) return;

          const data = await response.json();
          if (!data) return;

          applyInvoiceData(data);
          setConvertedFromProforma(true);
          setSourceProformaNumber(String(data.invoiceNumber || ""));
        } catch {
          // ignore
        }
      };

      void loadConvertedInvoice();
      return;
    }

    if (!invoiceId) {
      setIsEditing(false);
      setEditingInvoiceId(null);
      return;
    }

    const loadInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices?id=${encodeURIComponent(invoiceId)}&documentType=invoice`);
        if (!response.ok) return;

        const data = await response.json();
        if (!data) return;

        setIsEditing(true);
        setEditingInvoiceId(String(data.id));
        setInvoiceNumber(String(data.invoiceNumber || ""));
        applyInvoiceData(data);
      } catch {
        // ignore
      }
    };

    void loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, sourceInvoiceId, customers]);

  const handleImportPI = async () => {
    if (showImportPanel) {
      setShowImportPanel(false);
      return;
    }

    setIsLoadingProformas(true);
    setShowImportPanel(true);

    try {
      const response = await fetch("/api/invoices?documentType=proforma");
      if (!response.ok) {
        throw new Error("Unable to load proforma invoices.");
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];

      const proformas = list
        .filter((invoice: Record<string, unknown>) => {
          const invoiceNumberValue = String(invoice.invoiceNumber || "").trim().toUpperCase();
          const billType = String(invoice.billType || "").trim().toLowerCase();
          return (
            billType.includes("proforma") ||
            invoiceNumberValue.startsWith("PMA") ||
            invoiceNumberValue.startsWith("PRF") ||
            invoiceNumberValue.startsWith("PF")
          );
        })
        .map((invoice: Record<string, unknown>) => ({
          id: String(invoice.id || ""),
          invoiceNumber: String(invoice.invoiceNumber || ""),
          partyName: String(invoice.partyName || ""),
          invoiceDate: String(invoice.invoiceDate || ""),
          grandTotal: Number(invoice.grandTotal || 0),
        }))
        .filter((invoice) => invoice.id)
        .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));

      setImportableProformas(proformas);
    } catch {
      setImportableProformas([]);
    } finally {
      setIsLoadingProformas(false);
    }
  };

  const importProformaInvoice = async (proformaId: string) => {
    if (!proformaId) return;

    try {
      const response = await fetch(`/api/invoices?id=${encodeURIComponent(proformaId)}&documentType=proforma`);
      if (!response.ok) {
        throw new Error("Unable to import proforma invoice.");
      }

      const data = await response.json();
      if (!data) return;

      setIsEditing(false);
      setEditingInvoiceId(null);
      setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
      applyInvoiceData(data);
      setConvertedFromProforma(true);
      setSourceProformaNumber(String(data.invoiceNumber || ""));
      setShowImportPanel(false);
    } catch {
      window.alert("Unable to import the selected proforma invoice.");
    }
  };

  const handleGenerateInvoice = async () => {
    setIsSaving(true);

    try {
      const method = isEditing && editingInvoiceId ? "PUT" : "POST";
      const url =
        isEditing && editingInvoiceId
          ? `/api/invoices?id=${encodeURIComponent(editingInvoiceId)}&documentType=invoice`
          : "/api/invoices";

      const invoiceNumberToSend = getDuplicateCopyInvoiceNumber(
        invoiceNumber.trim() || `INV-${Date.now().toString().slice(-6)}`,
        isDuplicateCopy,
      );
      const invoiceDateToSend = invoiceDate || today;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          documentType: "invoice",
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

  // Real "Share" behaviour: uses the Web Share API where available (mobile
  // browsers, most desktop browsers over HTTPS), and falls back to copying a
  // shareable summary to the clipboard everywhere else.
  const handleShareInvoice = async () => {
    setIsSharing(true);

    const shareText = `Tax Invoice ${invoiceNumber || ""} for ${partyName || "customer"} — Grand Total ${formatCurrency(
      totals.grandTotal,
    )}${dueDateValue ? ` (due ${dueDateValue})` : ""}`;

    try {
      const clipboard =
        typeof navigator !== "undefined"
          ? (navigator as Navigator & { clipboard?: { writeText: (text: string) => Promise<void> } }).clipboard
          : undefined;

      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: `Invoice ${invoiceNumber}`,
          text: shareText,
        });
      } else if (clipboard) {
        await clipboard.writeText(shareText);
        window.alert("Invoice summary copied to clipboard.");
      } else {
        window.alert(shareText);
      }
    } catch {
      // User cancelled the native share sheet, or clipboard access was
      // denied — nothing to do in either case.
    } finally {
      setIsSharing(false);
    }
  };

  const hasAnyHsn = items.some((item) => item.hsn.trim() !== "");
  const hasAnyDiscount = items.some((item) => Number(item.discountPercent) > 0);
  const previewPageLabels = getDuplicateCopyPageLabels(isDuplicateCopy);

  // ── file 2 style helpers ─────────────────────────────────────────────────

  const inputCls =
    "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 placeholder-gray-400";

  const selectCls =
    "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer";

  const labelCls = "block text-[11px] font-medium text-gray-500 mb-1";

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <AdminShell
      title={isEditing ? "Edit Tax Invoice" : "New Tax Invoice"}
      description="Fill in the details below — switch to Preview to see the exact invoice that will be saved and printed."
    >
      {/* Product suggestions datalist */}
      <datalist id={PRODUCT_DATALIST_ID}>
        {productOptions.map((product) => (
          <option key={product.id} value={product.name} />
        ))}
      </datalist>

      {/* ── Add New Customer popup (identical to file 1) ─────────────────── */}
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

            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleAddNewCustomerSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Name *</span>
                <input
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="admin-input w-full"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Contact Person</span>
                <input
                  value={newCustomerForm.contactPerson}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, contactPerson: e.target.value })}
                  className="admin-input w-full"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Phone *</span>
                <input
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="admin-input w-full"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email *</span>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="admin-input w-full"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">GSTIN</span>
                <input
                  value={newCustomerForm.gstin}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, gstin: e.target.value })}
                  className="admin-input w-full"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Address</span>
                <input
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="admin-input w-full"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
                <input
                  value={newCustomerForm.city}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                  className="admin-input w-full"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">State</span>
                <input
                  value={newCustomerForm.state}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, state: e.target.value })}
                  className="admin-input w-full"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Pincode</span>
                <input
                  value={newCustomerForm.pincode}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, pincode: e.target.value })}
                  className="admin-input w-full"
                />
              </label>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={isSavingCustomer}
                  className="inline-flex items-center justify-center rounded bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingCustomer ? "Saving…" : "Save Customer"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="inline-flex items-center justify-center rounded border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
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
        {/* ══════════════════════════════════════════════════════════════
            DATA-ENTRY SCREEN — visual language from file 2. Hidden while
            Preview is on, and always hidden while printing (the real
            printable invoice below takes over for print/PDF).
           ══════════════════════════════════════════════════════════════ */}
        <div className={`${showPreview ? "hidden" : ""} print:hidden`}>
          {/* ── Top Bar ── */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 bg-[#f4f5f8] px-4 py-2 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-gray-800">
                {isEditing ? "Edit Tax Invoice" : "Tax Invoice"}
              </span>
              {convertedFromProforma && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                  Converted from Proforma {sourceProformaNumber || "—"}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Import PI */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => void handleImportPI()}
                  className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Import PI
                  <ChevronDown size={12} />
                </button>

                {showImportPanel && (
                  <div className="absolute right-0 z-30 mt-2 w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">Select a saved proforma invoice</p>
                      <button type="button" onClick={() => setShowImportPanel(false)} className="text-sm text-slate-500 hover:text-slate-800">
                        Close
                      </button>
                    </div>

                    {isLoadingProformas ? (
                      <p className="text-sm text-slate-500">Loading proformas…</p>
                    ) : importableProformas.length === 0 ? (
                      <p className="text-sm text-slate-500">No saved proforma invoices found.</p>
                    ) : (
                      <div className="max-h-72 space-y-2 overflow-auto">
                        {importableProformas.map((proforma) => (
                          <button
                            key={proforma.id}
                            type="button"
                            onClick={() => void importProformaInvoice(proforma.id)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-red-300 hover:bg-red-50"
                          >
                            <div className="font-semibold text-slate-900">{proforma.invoiceNumber}</div>
                            <div className="text-sm text-slate-600">{proforma.partyName || "No party name"}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {proforma.invoiceDate ? new Date(proforma.invoiceDate).toLocaleDateString() : ""} • ₹
                              {Number(proforma.grandTotal || 0).toLocaleString("en-IN")}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                Preview
              </button>

              <button
                type="button"
                onClick={() => void handleGenerateInvoice()}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                <Save size={14} />
                {isSaving ? "Saving…" : isEditing ? "Update Invoice" : "Save Invoice"}
              </button>

              {/* <button
                type="button"
                onClick={() => window.print()}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Print
              </button> */}
            </div>
          </div>

          <div className="mx-auto max-w-[1400px] p-3 space-y-2">
            {/* ── Customer / Bill To ── */}
            <div className="rounded bg-white border border-gray-200 shadow-sm p-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {/* Customer selector */}
                <div className="space-y-2">
                  <div>
                    <label className={`${labelCls} text-blue-600`}>
                      Customer <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                        className={`${selectCls} border-blue-400 ring-1 ring-blue-200 pr-7`}
                      >
                        <option value="">Select customer…</option>
                        <option value={ADD_NEW_CUSTOMER_OPTION}>+ Add New Customer</option>
                        {customers.filter((c) => c.id).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Party Name</label>
                    <input value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Party name" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact Person</label>
                    <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact person" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone No." className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Address block */}
                <div className="space-y-2">
                  <div>
                    <label className={labelCls}>Address</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={labelCls}>City</label>
                      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>State</label>
                      <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Pincode</label>
                      <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="PIN" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>GSTIN</label>
                    <input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="GSTIN" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Ship To Address</label>
                    <textarea
                      value={shipToAddress}
                      onChange={(e) => setShipToAddress(e.target.value)}
                      rows={2}
                      placeholder="Shipping address"
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </div>

                {/* Invoice meta */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Invoice Number</label>
                      <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Invoice Date</label>
                      <div className="relative">
                        <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={`${inputCls} pr-7`} />
                        <CalendarDays size={13} className="absolute right-2 top-1.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Due Date</label>
                      <input type="date" value={dueDateValue} onChange={(e) => setDueDateValue(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Place of Supply</label>
                      <input value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} placeholder="—" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>PO No.</label>
                      <input value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="PO No." className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>PO Date</label>
                      <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>E-Way Bill No.</label>
                    <input value={ewayBillNo} onChange={(e) => setEwayBillNo(e.target.value)} placeholder="E-Way Bill No." className={inputCls} />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isDuplicateCopy"
                      checked={isDuplicateCopy}
                      onChange={(e) => setIsDuplicateCopy(e.target.checked)}
                      className="h-4 w-4 accent-blue-600 cursor-pointer"
                    />
                    <label htmlFor="isDuplicateCopy" className="text-[12px] text-gray-600 cursor-pointer select-none">
                      Mark as “Duplicate Copy” (unchecked = “Original for Recipient”)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Items Table — strictly file 1's item table (columns, computed
                cells, product datalist) wrapped in a file-2 style card ── */}
            <div className="rounded bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px]" style={{ minWidth: "980px" }}>
                  <thead>
                    <tr className="bg-[#e8eaf0] text-left text-slate-700">
                      <th className="border border-slate-300 px-2 py-2 font-semibold">#</th>
                      <th className="border border-slate-300 px-2 py-2 font-semibold min-w-[160px]">Item name</th>
                      <th className={`border border-slate-300 px-2 py-2 font-semibold ${hasAnyHsn ? "" : ""}`}>HSN/SAC</th>
                      <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Qty</th>
                      <th className="border border-slate-300 px-2 py-2 font-semibold">Unit</th>
                      <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Price/unit (Rs)</th>
                      <th className={`border border-slate-300 px-2 py-2 text-right font-semibold ${hasAnyDiscount ? "" : ""}`}>Disc %</th>
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
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                            <div className="flex items-center gap-2">
                              <input
                                list={PRODUCT_DATALIST_ID}
                                value={item.description}
                                onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                                placeholder="Item description"
                                className="min-w-0 flex-1 bg-transparent text-[13px] text-gray-800 focus:outline-none placeholder-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => openAddProductModal(item.id, item.description)}
                                className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 group-hover:pointer-events-auto pointer-events-none"
                              >
                                + New
                              </button>
                            </div>
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                            <input value={item.hsn} onChange={(e) => updateItem(item.id, "hsn", e.target.value)} placeholder="—" className="w-full bg-transparent text-[13px] text-gray-800 focus:outline-none" />
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                            <input
                              type="number"
                              min="0"
                              value={item.qty}
                              onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                              className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                            <div className="relative">
                              <select
                                value={item.unit}
                                onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                                className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer pr-4"
                              >
                                <option value="">—</option>
                                {UNITS.map((unit) => (
                                  <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={11} className="absolute right-0.5 top-1.5 text-gray-400 pointer-events-none" />
                            </div>
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                            <input
                              type="number"
                              min="0"
                              value={item.rate === 0 ? "" : item.rate}
                              onChange={(e) => updateItem(item.id, "rate", e.target.value)}
                              placeholder="0"
                              className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discountPercent === 0 ? "" : item.discountPercent}
                              onChange={(e) => updateItem(item.id, "discountPercent", e.target.value)}
                              placeholder="0"
                              className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.taxPercent === 0 ? "" : item.taxPercent}
                              onChange={(e) => updateItem(item.id, "taxPercent", e.target.value)}
                              placeholder="0"
                              className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(taxablePerUnit)}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(taxableAmount)}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right align-middle">{renderCompactMetricCell(gstAmount, item.taxPercent)}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(finalRate)}</td>
                          <td className="border border-slate-300 px-2 py-1.5 text-right align-middle font-semibold text-slate-900">{formatCurrency(rowTotal)}</td>
                          <td className="border border-slate-300 px-1 py-1.5 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="rounded px-1.5 py-0.5 text-[12px] font-bold text-slate-300 transition hover:bg-red-50 hover:text-red-500"
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
                      <td colSpan={14} className="border-t border-slate-100 px-3 py-2">
                        <button
                          type="button"
                          onClick={addItem}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 transition hover:text-blue-800"
                        >
                          <Plus size={13} /> Add Item
                        </button>
                      </td>
                    </tr>
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
                      <td className="border border-slate-300 px-2 py-2 text-right">
                        {formatCurrency(totals.taxableBeforeExtraDiscount + totals.taxBeforeExtraDiscount)}
                      </td>
                      <td className="border border-slate-300 px-2 py-2" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ── Bottom Section: transport / tax type / totals / notes / bank / signature ── */}
            <div className="rounded bg-white border border-gray-200 shadow-sm p-3">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Left: transport + notes/terms/bank/signature */}
                <div className="space-y-2 lg:col-span-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Transport Name</label>
                      <input value={transportName} onChange={(e) => setTransportName(e.target.value)} placeholder="Transport Name" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Vehicle Number</label>
                      <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="Vehicle Number" className={inputCls} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {!showDescriptionField && (
                      <button
                        type="button"
                        onClick={() => setShowDescriptionField(true)}
                        className="flex items-center gap-1.5 rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <AlignLeft size={13} className="text-gray-500" /> ADD DESCRIPTION
                      </button>
                    )}

                    <label className="flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors">
                      <Camera size={13} className="text-gray-500" /> ADD IMAGE
                      <input type="file" accept="image/*" onChange={handleAttachedImageUpload} className="hidden" />
                    </label>

                    <label className="flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors">
                      <FileText size={13} className="text-gray-500" /> ADD DOCUMENT
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        onChange={handleAttachedDocumentUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {showDescriptionField && (
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className={labelCls}>Additional Description</label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDescriptionField(false);
                            setAdditionalDescription("");
                          }}
                          className="text-[11px] font-semibold text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        value={additionalDescription}
                        onChange={(e) => setAdditionalDescription(e.target.value)}
                        rows={2}
                        placeholder="Extra details about this invoice…"
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  )}

                  {attachedImage && (
                    <div className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 p-2">
                      <img src={attachedImage} alt="Attached" className="h-14 w-14 rounded object-cover" />
                      <div className="flex-1 text-[12px] text-gray-600">Reference image attached</div>
                      <button type="button" onClick={removeAttachedImage} className="text-[11px] font-semibold text-red-500 hover:text-red-700">
                        Remove
                      </button>
                    </div>
                  )}

                  {attachedDocument && (
                    <div className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 p-2">
                      <FileText size={18} className="text-gray-500" />
                      <a
                        href={attachedDocument.dataUrl}
                        download={attachedDocument.name}
                        className="flex-1 truncate text-[12px] font-medium text-blue-600 hover:underline"
                      >
                        {attachedDocument.name}
                      </a>
                      <button type="button" onClick={removeAttachedDocument} className="text-[11px] font-semibold text-red-500 hover:text-red-700">
                        Remove
                      </button>
                    </div>
                  )}

                  <div>
                    <label className={labelCls}>Notes</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Thank you for your business." className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={labelCls}>Terms &amp; Conditions</label>
                    <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} placeholder="Payment due within 7 days of invoice date." className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={labelCls}>Bank Details</label>
                    <textarea value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-end">
                    <div>
                      <label className={labelCls}>Authorized Signature Label</label>
                      <input value={authorizedSignature} onChange={(e) => setAuthorizedSignature(e.target.value)} placeholder="Authorized Signatory" className={inputCls} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-24 items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
                        {signatureImage ? (
                          <img src={signatureImage} alt="Authorized signature" className="h-full w-full object-contain" />
                        ) : (
                          "Signature"
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:text-blue-800">
                          {signatureImage ? "Replace" : "Upload image"}
                          <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                        </label>
                        {signatureImage && (
                          <button type="button" onClick={removeSignatureImage} className="text-[11px] font-semibold text-red-500 hover:text-red-700 text-left">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: tax type + totals */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-300 px-2 py-1 w-fit">
                    <span className={`text-[12px] font-medium ${paymentMode.toLowerCase() !== "cash" ? "text-blue-600" : "text-gray-500"}`}>Credit</span>
                    <button
                      type="button"
                      onClick={() => setPaymentMode((current) => (current.toLowerCase() === "cash" ? "Credit" : "Cash"))}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${paymentMode.toLowerCase() === "cash" ? "bg-blue-500" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${paymentMode.toLowerCase() === "cash" ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                    <span className={`text-[12px] font-medium ${paymentMode.toLowerCase() === "cash" ? "text-blue-600" : "text-gray-500"}`}>Cash</span>
                  </div>
                  <div>
                    <label className={labelCls}>Payment Mode (custom label)</label>
                    <input value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputCls} placeholder="Credit" />
                  </div>

                  <div>
                    <label className={labelCls}>Tax Type</label>
                    <div className="relative">
                      <select value={taxType} onChange={(e) => setTaxType(e.target.value as TaxType)} className={`${selectCls} pr-7`}>
                        <option value="cgst-sgst">CGST + SGST</option>
                        <option value="igst">IGST</option>
                        <option value="none">No Tax</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="rounded border border-gray-200 bg-gray-50 p-2 text-[12px] text-gray-700 space-y-1">
                    <div className="flex items-center justify-between"><span className="text-gray-500">Taxable Amount</span><span>{formatCurrency(totals.taxableBeforeExtraDiscount)}</span></div>
                    {taxType === "cgst-sgst" && (
                      <>
                        <div className="flex items-center justify-between"><span className="text-gray-500">CGST ({totals.cgstRate.toFixed(2)}%)</span><span>{formatCurrency(totals.cgst)}</span></div>
                        <div className="flex items-center justify-between"><span className="text-gray-500">SGST ({totals.sgstRate.toFixed(2)}%)</span><span>{formatCurrency(totals.sgst)}</span></div>
                      </>
                    )}
                    {taxType === "igst" && (
                      <div className="flex items-center justify-between"><span className="text-gray-500">IGST ({totals.igstRate.toFixed(2)}%)</span><span>{formatCurrency(totals.igst)}</span></div>
                    )}
                    <div className="flex items-center justify-between font-semibold"><span className="text-gray-600">Total Tax</span><span>{formatCurrency(totals.tax)}</span></div>
                  </div>

                  <div>
                    <label className={labelCls}>Discount on Taxable Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={extraDiscountAmount === 0 ? "" : extraDiscountAmount}
                      onChange={(e) => setExtraDiscountAmount(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)}
                      placeholder="0"
                      className={`${inputCls} text-right`}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Round Off (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={roundOffAmount === 0 ? "" : roundOffAmount}
                      onChange={(e) => setRoundOffAmount(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)}
                      placeholder="0"
                      className={`${inputCls} text-right`}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-2">
                    <span className="text-[13px] font-semibold text-gray-800">Grand Total</span>
                    <span className="text-[14px] font-bold text-gray-900">{formatCurrency(totals.grandTotal)}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 leading-snug">{numberToIndianWords(totals.grandTotal)}</div>
                </div>
              </div>
            </div>

            {/* ── Action Bar ── */}
            <div className="flex items-center justify-end gap-2 pb-2">
              <button
                type="button"
                onClick={() => void handleShareInvoice()}
                disabled={isSharing}
                className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Share2 size={14} /> {isSharing ? "Sharing…" : "Share"}
              </button>

              <button
                type="button"
                onClick={() => void handleGenerateInvoice()}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded bg-blue-600 px-5 py-2 text-[13px] font-semibold text-white shadow hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                <Check size={14} />
                {isSaving ? "Saving…" : isEditing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PRINTABLE / SAVED INVOICE — this is file 1's exact invoice
            markup, untouched. It is what gets printed / saved as PDF,
            and (via the Preview toggle) can also be viewed on screen
            exactly as it will be produced.
           ══════════════════════════════════════════════════════════════ */}
        <div className={showPreview ? "block" : "hidden print:block"}>
          {showPreview && (
            <div className="mx-auto mb-3 flex max-w-[1000px] items-center justify-between px-1 print:hidden">
              <span className="text-sm font-semibold text-slate-700">Invoice Preview</span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Editing
              </button>
            </div>
          )}

          <div className="invoice-preview-shell mx-auto w-full">
            <div className="overflow-hidden rounded-2xl border-[1.5px] border-slate-300 bg-white text-slate-800 shadow-[0_8px_32px_rgba(15,23,42,0.07)] print:rounded-none print:shadow-none print:border-[1.2px]">
              {previewPageLabels.map((label, index) => (
                <div
                  key={`${label}-${index}`}
                  className={`invoice-preview-page ${index > 0 ? "mt-6 border-t border-dashed border-slate-300 pt-6 print:mt-0 print:border-t-0 print:pt-0" : ""}`}
                  style={index > 0 ? { breakBefore: "page", pageBreakBefore: "always" } : undefined}
                >
                  <div className="relative flex items-center justify-center border-b border-slate-300 bg-[#f7f9fc] px-6 py-3">
                    <h2 className="text-base font-semibold text-slate-900">Tax Invoice</h2>
                    <span className="absolute right-6 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {label}
                    </span>
                  </div>

                  {/* ── Converted-from-Proforma note ── */}
                  {convertedFromProforma && (
                    <div className="border-b border-slate-300 bg-blue-50 px-6 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                      Converted from Proforma Invoice {sourceProformaNumber || "—"}
                    </div>
                  )}

                  {/* ── company header (static) ── */}
                  <div className="flex items-start justify-between gap-4 border-b border-slate-300 bg-white px-6 pb-4 pt-4">
                    <div className="flex items-start gap-3">
                      <img src="/LOGO.png" alt="Radiatech Electra" className="h-12 w-12 rounded-md object-contain" />
                      <div>
                        <h3 className="text-xl font-bold tracking-wide text-slate-950">RADIATECH ELECTRA</h3>
                        <p className="mt-1 text-[11px] text-slate-600">
                          Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-600">
                      <div>Phone: +91 81788 50959</div>
                      <div>Email: sales@radiatech.in</div>
                      <div>GSTIN: 09DDZPK0004H1ZF</div>
                      <div>State: 09-Uttar Pradesh</div>
                    </div>
                  </div>

                  {/* ── Bill To | Invoice Details ── */}
                  <div className="grid grid-cols-1 border-b border-slate-300 sm:grid-cols-2">
                    <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r">
                      <div className="rounded-lg border border-slate-300 bg-white p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bill To:</p>
                          <select
                            value={selectedCustomerId}
                            onChange={(e) => handleCustomerSelect(e.target.value)}
                            className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 outline-none transition hover:border-slate-300 print:hidden cursor-pointer"
                          >
                            <option value="">Select customer…</option>
                            <option value={ADD_NEW_CUSTOMER_OPTION}>+ Add New Customer</option>
                            {customers.filter((c) => c.id).map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-0.5 text-[13px]">
                          <input value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Party name" className="inv-field w-full font-semibold text-slate-900" />
                          <div className={contactPerson ? "" : "print:hidden"}>
                            <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact person" className="inv-field w-full text-slate-700" />
                          </div>
                          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="inv-field w-full text-slate-700" />
                          <div className="flex gap-1">
                            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="inv-field min-w-0 flex-1 text-slate-700" />
                            <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="inv-field min-w-0 flex-1 text-slate-700" />
                            <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="PIN" className="inv-field w-16 text-slate-700" />
                          </div>
                          <div className={`flex items-center gap-1 text-slate-700 ${phone ? "" : "print:hidden"}`}>
                            <span className="shrink-0 text-slate-500">Contact No:</span>
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="—" className="inv-field min-w-0 flex-1" />
                          </div>
                          <div className={`flex items-center gap-1 text-slate-700 ${email ? "" : "print:hidden"}`}>
                            <span className="shrink-0 text-slate-500">Email:</span>
                            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="—" className="inv-field min-w-0 flex-1" />
                          </div>
                          <div className={`flex items-center gap-1 text-slate-700 ${gstin ? "" : "print:hidden"}`}>
                            <span className="shrink-0 text-slate-500">GSTIN:</span>
                            <input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="—" className="inv-field min-w-0 flex-1" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4">
                      <div className="rounded-lg border border-slate-300 bg-white p-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Invoice Details:</p>
                        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-[13px] text-slate-800">
                          <span className="whitespace-nowrap font-semibold text-slate-900">Invoice No:</span>
                          <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="inv-field w-full" />
                          <span className="font-semibold text-slate-900">Date:</span>
                          <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="inv-field w-full" />
                          <span className="whitespace-nowrap font-semibold text-slate-900">Due Date:</span>
                          <input type="date" value={dueDateValue} onChange={(e) => setDueDateValue(e.target.value)} className="inv-field w-full" />
                          <span className={`whitespace-nowrap font-semibold text-slate-900 ${poDate ? "" : "print:hidden"}`}>PO Date:</span>
                          <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} className={`inv-field w-full ${poDate ? "" : "print:hidden"}`} />
                          <span className={`whitespace-nowrap font-semibold text-slate-900 ${ewayBillNo ? "" : "print:hidden"}`}>E-way Bill No:</span>
                          <input value={ewayBillNo} onChange={(e) => setEwayBillNo(e.target.value)} placeholder="—" className={`inv-field w-full ${ewayBillNo ? "" : "print:hidden"}`} />
                          <span className={`whitespace-nowrap font-semibold text-slate-900 ${poNo ? "" : "print:hidden"}`}>PO No:</span>
                          <input value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="—" className={`inv-field w-full ${poNo ? "" : "print:hidden"}`} />
                          <span className={`whitespace-nowrap font-semibold text-slate-900 ${placeOfSupply ? "" : "print:hidden"}`}>Reference No:</span>
                          <input value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} placeholder="—" className={`inv-field w-full ${placeOfSupply ? "" : "print:hidden"}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Ship To | Transport ── */}
                  <div className="grid grid-cols-1 border-b border-slate-300 sm:grid-cols-2">
                    <div className={`border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r ${shipToAddress ? "" : "print:hidden"}`}>
                      <div className="rounded-lg border border-slate-300 bg-white p-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ship To:</p>
                        <textarea
                          value={shipToAddress}
                          onChange={(e) => setShipToAddress(e.target.value)}
                          rows={3}
                          placeholder="Shipping address"
                          className="inv-field w-full resize-none text-[13px] text-slate-800"
                        />
                      </div>
                    </div>
                    <div className={`bg-white p-4 ${transportName || vehicleNumber ? "" : "print:hidden"}`}>
                      <div className="rounded-lg border border-slate-300 bg-white p-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Transportation Details:</p>
                        <div className="space-y-1 text-[13px] text-slate-800">
                          <div className={`flex items-center gap-1 ${transportName ? "" : "print:hidden"}`}>
                            <span className="shrink-0 text-slate-500">Transport Name:</span>
                            <input value={transportName} onChange={(e) => setTransportName(e.target.value)} placeholder="—" className="inv-field min-w-0 flex-1" />
                          </div>
                          <div className={`flex items-center gap-1 ${vehicleNumber ? "" : "print:hidden"}`}>
                            <span className="shrink-0 text-slate-500">Vehicle Number:</span>
                            <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="—" className="inv-field min-w-0 flex-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Items table ── */}
                  <div className="invoice-table-wrap border-b border-slate-300 overflow-x-auto">
                    <table className="w-full border-collapse text-[12px]" style={{ minWidth: "980px" }}>
                      <thead>
                        <tr className="bg-[#bec9d9] text-left text-slate-700">
                          <th className="border border-slate-300 px-2 py-2 font-semibold">#</th>
                          <th className="border border-slate-300 px-2 py-2 font-semibold min-w-[160px]">Item name</th>
                          <th className={`border border-slate-300 px-2 py-2 font-semibold ${hasAnyHsn ? "" : "print:hidden"}`}>HSN/SAC</th>
                          <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Qty</th>
                          <th className="border border-slate-300 px-2 py-2 font-semibold">Unit</th>
                          <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Price/unit (Rs)</th>
                          <th className={`border border-slate-300 px-2 py-2 text-right font-semibold ${hasAnyDiscount ? "" : "print:hidden"}`}>Disc %</th>
                          <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Tax %</th>
                          <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Taxable/unit</th>
                          <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Taxable Amt</th>
                          <th className="border border-slate-300 px-2 py-2 text-right font-semibold">GST</th>
                          <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Final Rate</th>
                          <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Amount Total</th>
                          <th className="border border-slate-300 px-1 py-2 print:hidden" />
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
                              <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                                <input
                                  list={PRODUCT_DATALIST_ID}
                                  value={item.description}
                                  onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                                  placeholder="Item description"
                                  className="inv-field w-full"
                                />
                              </td>
                              <td className={`border border-slate-300 px-1.5 py-1.5 align-middle ${hasAnyHsn ? "" : "print:hidden"}`}>
                                <input value={item.hsn} onChange={(e) => updateItem(item.id, "hsn", e.target.value)} placeholder="—" className="inv-field w-full" />
                              </td>
                              <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.qty}
                                  onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                                  className="inv-field w-full text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>
                              <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                                <input value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)} placeholder="Nos" className="inv-field w-full" />
                              </td>
                              <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.rate === 0 ? "" : item.rate}
                                  onChange={(e) => updateItem(item.id, "rate", e.target.value)}
                                  placeholder="0"
                                  className="inv-field w-full text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>
                              <td className={`border border-slate-300 px-1.5 py-1.5 align-middle ${hasAnyDiscount ? "" : "print:hidden"}`}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={item.discountPercent === 0 ? "" : item.discountPercent}
                                  onChange={(e) => updateItem(item.id, "discountPercent", e.target.value)}
                                  placeholder="0"
                                  className="inv-field w-full text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>
                              <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={item.taxPercent === 0 ? "" : item.taxPercent}
                                  onChange={(e) => updateItem(item.id, "taxPercent", e.target.value)}
                                  placeholder="0"
                                  className="inv-field w-full text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>
                              <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(taxablePerUnit)}</td>
                              <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(taxableAmount)}</td>
                              <td className="border border-slate-300 px-2 py-1.5 text-right align-middle">{renderCompactMetricCell(gstAmount, item.taxPercent)}</td>
                              <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(finalRate)}</td>
                              <td className="border border-slate-300 px-2 py-1.5 text-right align-middle font-semibold text-slate-900">{formatCurrency(rowTotal)}</td>
                              <td className="border border-slate-300 px-1 py-1.5 text-center align-middle print:hidden">
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="rounded px-1.5 py-0.5 text-[12px] font-bold text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="print:hidden">
                          <td colSpan={14} className="border-t border-slate-100 px-3 py-2">
                            <button
                              type="button"
                              onClick={addItem}
                              className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 transition hover:text-blue-800"
                            >
                              <span className="text-[15px] leading-none">+</span> Add Item
                            </button>
                          </td>
                        </tr>
                        <tr className="bg-slate-50 font-semibold text-slate-900 text-[12px]">
                          <td className="border border-slate-300 px-2 py-2" />
                          <td className="border border-slate-300 px-2 py-2">Total</td>
                          <td className={`border border-slate-300 px-2 py-2 ${hasAnyHsn ? "" : "print:hidden"}`} />
                          <td className="border border-slate-300 px-2 py-2 text-right">{items.reduce((sum, item) => sum + item.qty, 0)}</td>
                          <td className="border border-slate-300 px-2 py-2" />
                          <td className="border border-slate-300 px-2 py-2" />
                          <td className={`border border-slate-300 px-2 py-2 ${hasAnyDiscount ? "" : "print:hidden"}`} />
                          <td className="border border-slate-300 px-2 py-2" />
                          <td className="border border-slate-300 px-2 py-2" />
                          <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount)}</td>
                          <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.taxBeforeExtraDiscount)}</td>
                          <td className="border border-slate-300 px-2 py-2" />
                          <td className="border border-slate-300 px-2 py-2 text-right">
                            {formatCurrency(totals.taxableBeforeExtraDiscount + totals.taxBeforeExtraDiscount)}
                          </td>
                          <td className="border border-slate-300 px-2 py-2 print:hidden" />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* ── Tax Summary | Totals ── */}
                  <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2">
                    <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r">
                      <div className="invoice-card rounded-lg border border-slate-300 bg-white p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tax Summary:</p>
                          <select
                            value={taxType}
                            onChange={(e) => setTaxType(e.target.value as TaxType)}
                            className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 outline-none transition hover:border-slate-300 cursor-pointer"
                          >
                            <option value="cgst-sgst">CGST + SGST</option>
                            <option value="igst">IGST</option>
                            <option value="none">No Tax</option>
                          </select>
                        </div>

                        <table className="mt-2 w-full border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-100 text-left text-slate-600">
                              <th className="border border-slate-300 px-2 py-1 font-semibold">Taxable</th>
                              {taxType === "cgst-sgst" ? (
                                <>
                                  <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST Rate</th>
                                  <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST Amt</th>
                                  <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST Rate</th>
                                  <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST Amt</th>
                                </>
                              ) : taxType === "igst" ? (
                                <>
                                  <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST Rate</th>
                                  <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST Amt</th>
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
                          {numberToIndianWords(totals.grandTotal)}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 text-[13px] text-slate-800">
                      {totals.discountTotal > 0 && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Item-wise Discount</span>
                          <span>: {formatCurrency(totals.discountTotal)}</span>
                        </div>
                      )}

                      <div className={`mt-1 flex items-center justify-between gap-2 ${extraDiscountAmount ? "" : "print:hidden"}`}>
                        <span className="text-slate-500">Discount on Taxable Amount</span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-slate-500">: ₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={extraDiscountAmount === 0 ? "" : extraDiscountAmount}
                            onChange={(e) => {
                              const numericValue = Number(e.target.value);
                              setExtraDiscountAmount(Number.isFinite(numericValue) ? numericValue : 0);
                            }}
                            placeholder="0"
                            className="inv-field w-20 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>

                      {totals.extraDiscountAmount > 0 ? (
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-slate-500">Taxable Amt (after extra disc.)</span>
                          <span>: {formatCurrency(totals.taxable)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">Taxable Amount</span>
                          <span>: {formatCurrency(totals.taxableBeforeExtraDiscount)}</span>
                        </div>
                      )}
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-slate-500">Tax</span>
                        <span>: {formatCurrency(totals.tax)}</span>
                      </div>

                      <div className={`mt-1 flex items-center justify-between gap-2 ${roundOffAmount ? "" : "print:hidden"}`}>
                        <span className="text-slate-500">Round off</span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-slate-500">: ₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={roundOffAmount === 0 ? "" : roundOffAmount}
                            onChange={(e) => {
                              const numericValue = Number(e.target.value);
                              setRoundOffAmount(Number.isFinite(numericValue) ? numericValue : 0);
                            }}
                            placeholder="0"
                            className="inv-field w-20 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-300 pt-2 text-[15px] font-semibold text-slate-950">
                        <span>Grand Total</span>
                        <span>: {formatCurrency(totals.grandTotal)}</span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-slate-500">Payment Mode</span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-slate-500">:</span>
                          <input value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="inv-field text-right" placeholder="Credit" />
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 font-semibold text-slate-900">
                        <span>Balance</span>
                        <span>: {formatCurrency(totals.grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Notes & Terms ── */}
                  <div className={`border-b border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-700 ${notes || terms || additionalDescription ? "" : "print:hidden"}`}>
                    <div className="rounded-lg border border-slate-300 bg-white p-3">
                      <div className={additionalDescription ? "" : "print:hidden"}>
                        <div className="font-semibold text-slate-900">Description</div>
                        <textarea
                          value={additionalDescription}
                          onChange={(e) => setAdditionalDescription(e.target.value)}
                          rows={2}
                          placeholder="Extra details about this invoice…"
                          className="inv-field mt-1 w-full resize-none"
                        />
                      </div>
                      <div className={`${notes ? "" : "print:hidden"} ${additionalDescription ? "mt-3" : ""}`}>
                        <div className="font-semibold text-slate-900">Notes</div>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          placeholder="Thank you for your business."
                          className="inv-field mt-1 w-full resize-none"
                        />
                      </div>
                      <div className={terms ? "mt-3" : "mt-3 print:hidden"}>
                        <div className="font-semibold text-slate-900">Terms &amp; Conditions</div>
                        <textarea
                          value={terms}
                          onChange={(e) => setTerms(e.target.value)}
                          rows={2}
                          placeholder="Payment due within 7 days of invoice date."
                          className="inv-field mt-1 w-full resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Bank Details | Signature ── */}
                  <div className="grid grid-cols-1 gap-4 bg-white p-4 sm:grid-cols-2">
                    <div>
                      <div className="invoice-card rounded-lg border border-slate-300 bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bank Details:</p>
                        <textarea
                          value={bankDetails}
                          onChange={(e) => setBankDetails(e.target.value)}
                          rows={4}
                          className="inv-field mt-2 w-full resize-none text-[12px] text-slate-700"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-end text-[13px] text-slate-700">
                      <div className="invoice-card rounded-lg border border-slate-300 bg-white p-3 text-center">
                        <div className="font-semibold text-slate-900">For Radiatech Electra:</div>
                        <div className="mx-auto mt-2 flex h-16 w-32 items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
                          {signatureImage ? (
                            <img src={signatureImage} alt="Authorized signature" className="h-full w-full object-contain" />
                          ) : (
                            "Signature"
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-3 print:hidden">
                          <label className="cursor-pointer text-[10px] font-semibold text-blue-500 transition hover:text-blue-700">
                            {signatureImage ? "Replace" : "Upload image"}
                            <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                          </label>
                          {signatureImage && (
                            <button type="button" onClick={removeSignatureImage} className="text-[10px] font-semibold text-red-400 transition hover:text-red-600">
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="mt-1">
                          <input
                            value={authorizedSignature}
                            onChange={(e) => setAuthorizedSignature(e.target.value)}
                            className="inv-field w-full text-center text-[11px] font-semibold text-slate-700"
                            placeholder="Authorized Signatory"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* print styles — identical to file 1 */}
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
              .invoice-preview-shell .invoice-card,
              .invoice-preview-shell .invoice-table-wrap {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .invoice-preview-page {
                page-break-before: auto;
                break-before: auto;
              }
              .invoice-preview-page + .invoice-preview-page {
                page-break-before: always !important;
                break-before: page !important;
              }
              .print\\:hidden {
                display: none !important;
              }
            }
          `}</style>
        </div>
      </div>
    </AdminShell>
  );
}