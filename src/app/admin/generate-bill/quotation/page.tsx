// "use client";
// import AdminShell from "@/components/admin/AdminShell";
// import QuotationPreview from "@/components/admin/QuotationPreview";
// import {
//     AlignLeft,
//     CalendarDays,
//     Check,
//     ChevronDown,
//     Plus,
//     Save,
//     Share2,
// } from "lucide-react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useEffect, useMemo, useState } from "react";

// interface Customer {
//   id: string;
//   name: string;
//   contactPerson: string;
//   phone: string;
//   email: string;
//   gstin: string;
//   address: string;
//   city: string;
//   state: string;
//   pincode: string;
// }

// interface ProductOption {
//   id: string;
//   name: string;
//   hsn: string;
//   unit: string;
//   rate: number;
//   taxPercent: number;
// }

// interface InvoiceItem {
//   id: number;
//   description: string;
//   hsn: string;
//   unit: string;
//   qty: number;
//   rate: number;
//   taxPercent: number;
//   discountPercent: number;
// }

// type TaxType = "cgst-sgst" | "igst" | "none";

// const fallbackCustomerOptions: Customer[] = [
//   {
//     id: "",
//     name: "",
//     contactPerson: "",
//     gstin: "",
//     phone: "",
//     email: "",
//     state: "",
//     address: "",
//     city: "",
//     pincode: "",
//   },
//   {
//     id: "demo",
//     name: "Radiatech Electra",
//     contactPerson: "",
//     gstin: "27XYZAB9876C1Z2",
//     phone: "8178850959",
//     email: "",
//     state: "Delhi",
//     address: "Noida, Uttar Pradesh",
//     city: "",
//     pincode: "",
//   },
// ];

// const today = new Date().toISOString().slice(0, 10);
// const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

// const PRODUCT_DATALIST_ID = "invoice-product-options";
// const ADD_NEW_CUSTOMER_OPTION = "__add_new_customer__";

// const emptyNewCustomerForm = {
//   name: "",
//   contactPerson: "",
//   phone: "",
//   email: "",
//   gstin: "",
//   address: "",
//   city: "",
//   state: "",
//   pincode: "",
// };

// const UNITS = ["Nos", "Pcs", "Kg", "L", "m", "Box", "Set"];

// export default function InvoicePage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const invoiceId = searchParams.get("invoiceId");
//   const sourceInvoiceId = searchParams.get("fromProformaId");

//   const [customers, setCustomers] = useState<Customer[]>(fallbackCustomerOptions);
//   const [selectedCustomerId, setSelectedCustomerId] = useState(fallbackCustomerOptions[0].id);
//   const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

//   const [partyName, setPartyName] = useState(fallbackCustomerOptions[0].name);
//   const [contactPerson, setContactPerson] = useState(fallbackCustomerOptions[0].contactPerson);
//   const [gstin, setGstin] = useState(fallbackCustomerOptions[0].gstin);
//   const [phone, setPhone] = useState(fallbackCustomerOptions[0].phone);
//   const [email, setEmail] = useState(fallbackCustomerOptions[0].email);
//   const [state, setState] = useState(fallbackCustomerOptions[0].state);
//   const [address, setAddress] = useState(fallbackCustomerOptions[0].address);
//   const [city, setCity] = useState(fallbackCustomerOptions[0].city);
//   const [pincode, setPincode] = useState(fallbackCustomerOptions[0].pincode);

//   const [invoiceDate, setInvoiceDate] = useState(today);
//   const [dueDateValue, setDueDateValue] = useState(dueDate);
//   const [invoiceNumber, setInvoiceNumber] = useState(() => `QTN-${Date.now().toString().slice(-6)}`);
//   const [poDate, setPoDate] = useState("");
//   const [poNo, setPoNo] = useState("");
//   const [placeOfSupply, setPlaceOfSupply] = useState("");
//   const [taxType, setTaxType] = useState<TaxType>("cgst-sgst");
//   const [items, setItems] = useState<InvoiceItem[]>([
//     { id: 1, description: "", hsn: "", unit: "", qty: 1, rate: 0, taxPercent: 0, discountPercent: 0 },
//   ]);
//   const [notes, setNotes] = useState("Thank you for your business.");
//   const [terms, setTerms] = useState("Payment due within 7 days of invoice date.");
//   const [paymentMode, setPaymentMode] = useState("Credit");
//   const [extraDiscountAmount, setExtraDiscountAmount] = useState(0);
//   const [roundOffAmount, setRoundOffAmount] = useState(0);
//   const [bankDetails, setBankDetails] = useState(
//     "Name: Punjab and Sind Bank, Plot No C1A, Sector 63, Noida\nAccount No: 15111180000370\nIFSC code: PSIB0021511\nAccount holder's name: Radiatech Electra",
//   );
//   const [authorizedSignature, setAuthorizedSignature] = useState("Authorized Signatory");
//   const [signatureImage, setSignatureImage] = useState<string | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

//   const [convertedFromProforma, setConvertedFromProforma] = useState(false);
//   const [sourceProformaNumber, setSourceProformaNumber] = useState("");
//   const [isDuplicateCopy, setIsDuplicateCopy] = useState(false);

//   const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
//   const [newCustomerForm, setNewCustomerForm] = useState(emptyNewCustomerForm);
//   const [newCustomerError, setNewCustomerError] = useState("");
//   const [isSavingCustomer, setIsSavingCustomer] = useState(false);

//   const [showPreview, setShowPreview] = useState(false);
//   const [showDescriptionField, setShowDescriptionField] = useState(false);
//   const [additionalDescription, setAdditionalDescription] = useState("");
//   const [isSharing, setIsSharing] = useState(false);

//   const applyInvoiceData = (data: Record<string, unknown>) => {
//     setInvoiceDate(String(data.invoiceDate || today).slice(0, 10));
//     setDueDateValue(String(data.dueDate || "").slice(0, 10));
//     setPartyName(String(data.partyName || ""));
//     setContactPerson(String(data.contactPerson || ""));
//     setGstin(String(data.gstin || ""));
//     setPhone(String(data.phone || ""));
//     setEmail(String(data.email || ""));
//     setState(String(data.state || ""));
//     setAddress(String(data.address || ""));
//     setCity(String(data.city || ""));
//     setPincode(String(data.pincode || ""));
//     setPoDate(String(data.poDate || "").slice(0, 10));
//     setPoNo(String(data.poNo || ""));
//     setPlaceOfSupply(String(data.placeOfSupply || ""));
//     setTaxType((data.taxType as TaxType) || "cgst-sgst");
//     setNotes(String(data.notes || ""));
//     setTerms(String(data.terms || ""));
//     setPaymentMode(String(data.paymentMode || ""));

//     const parsedExtraDiscount = Number(data.extraDiscountAmount);
//     setExtraDiscountAmount(Number.isFinite(parsedExtraDiscount) ? parsedExtraDiscount : 0);
//     setRoundOffAmount(Number(data.roundOff || 0));
//     setBankDetails(String(data.bankDetails || ""));
//     setAuthorizedSignature(String(data.authorizedSignature || ""));
//     setSignatureImage(null);

//     const loadedDescription = String(data.additionalDescription || "");
//     setAdditionalDescription(loadedDescription);
//     setShowDescriptionField(Boolean(loadedDescription));

//     setConvertedFromProforma(Boolean(data.convertedFromProforma));
//     setSourceProformaNumber(String(data.sourceProformaNumber || ""));
//     setIsDuplicateCopy(Boolean(data.isDuplicate));

//     const loadedItems = Array.isArray(data.items)
//       ? (data.items as Record<string, unknown>[]).map((item, index) => ({
//           id: index + 1,
//           description: String(item.description || ""),
//           hsn: String(item.hsn || ""),
//           unit: String(item.unit || ""),
//           qty: Number(item.qty || 0),
//           rate: Number(item.rate || 0),
//           taxPercent: Number(item.taxPercent || 0),
//           discountPercent: Number(item.discountPercent || 0),
//         }))
//       : [];

//     setItems(
//       loadedItems.length > 0
//         ? loadedItems
//         : [{ id: 1, description: "", hsn: "", unit: "Nos", qty: 1, rate: 0, taxPercent: 0, discountPercent: 0 }],
//     );

//     const incomingPartyName = String(data.partyName || "").trim().toLowerCase();
//     const matchingCustomer = customers.find((customer) => customer.name.trim().toLowerCase() === incomingPartyName);

//     if (matchingCustomer) {
//       setSelectedCustomerId(matchingCustomer.id);
//       setPartyName(matchingCustomer.name || "");
//       setContactPerson(matchingCustomer.contactPerson || "");
//       setGstin(matchingCustomer.gstin || "");
//       setPhone(matchingCustomer.phone || "");
//       setEmail(matchingCustomer.email || "");
//       setState(matchingCustomer.state || "");
//       setAddress(matchingCustomer.address || "");
//       setCity(matchingCustomer.city || "");
//       setPincode(matchingCustomer.pincode || "");
//     } else {
//       setSelectedCustomerId("");
//     }
//   };

//   const handleCustomerSelect = (id: string) => {
//     if (id === ADD_NEW_CUSTOMER_OPTION) {
//       setNewCustomerForm(emptyNewCustomerForm);
//       setNewCustomerError("");
//       setShowAddCustomerModal(true);
//       return;
//     }

//     setSelectedCustomerId(id);
//     const selected = customers.find((customer) => customer.id === id);

//     if (selected) {
//       setPartyName(selected.name || "");
//       setContactPerson(selected.contactPerson || "");
//       setGstin(selected.gstin || "");
//       setPhone(selected.phone || "");
//       setEmail(selected.email || "");
//       setState(selected.state || "");
//       setAddress(selected.address || "");
//       setCity(selected.city || "");
//       setPincode(selected.pincode || "");
//     } else {
//       setPartyName("");
//       setContactPerson("");
//       setGstin("");
//       setPhone("");
//       setEmail("");
//       setState("");
//       setAddress("");
//       setCity("");
//       setPincode("");
//     }
//   };

//   const handleAddNewCustomerSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setNewCustomerError("");

//     if (!newCustomerForm.name || !newCustomerForm.phone || !newCustomerForm.email) {
//       setNewCustomerError("Name, phone, and email are required.");
//       return;
//     }

//     setIsSavingCustomer(true);

//     try {
//       const response = await fetch("/api/customers", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newCustomerForm),
//       });
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.error || "Unable to add customer.");

//       const createdCustomer: Customer = {
//         id: String(data.id ?? ""),
//         name: String(data.name ?? newCustomerForm.name ?? ""),
//         contactPerson: String(data.contactPerson ?? newCustomerForm.contactPerson ?? ""),
//         phone: String(data.phone ?? newCustomerForm.phone ?? ""),
//         email: String(data.email ?? newCustomerForm.email ?? ""),
//         gstin: String(data.gstin ?? newCustomerForm.gstin ?? ""),
//         address: String(data.address ?? newCustomerForm.address ?? ""),
//         city: String(data.city ?? newCustomerForm.city ?? ""),
//         state: String(data.state ?? newCustomerForm.state ?? ""),
//         pincode: String(data.pincode ?? newCustomerForm.pincode ?? ""),
//       };

//       setCustomers((current) => [createdCustomer, ...current]);

//       setSelectedCustomerId(createdCustomer.id);
//       setPartyName(createdCustomer.name || "");
//       setContactPerson(createdCustomer.contactPerson || "");
//       setGstin(createdCustomer.gstin || "");
//       setPhone(createdCustomer.phone || "");
//       setEmail(createdCustomer.email || "");
//       setState(createdCustomer.state || "");
//       setAddress(createdCustomer.address || "");
//       setCity(createdCustomer.city || "");
//       setPincode(createdCustomer.pincode || "");

//       setShowAddCustomerModal(false);
//       setNewCustomerForm(emptyNewCustomerForm);
//     } catch (submitError) {
//       setNewCustomerError(submitError instanceof Error ? submitError.message : "Unable to add customer.");
//     } finally {
//       setIsSavingCustomer(false);
//     }
//   };

//   const findProductByName = (name: string) =>
//     productOptions.find((product) => product.name.trim().toLowerCase() === name.trim().toLowerCase());

//   const handleItemNameChange = (id: number, value: string) => {
//     const matchedProduct = findProductByName(value);

//     setItems((current) =>
//       current.map((item) => {
//         if (item.id !== id) return item;

//         if (matchedProduct) {
//           return {
//             ...item,
//             description: matchedProduct.name,
//             hsn: matchedProduct.hsn || item.hsn,
//             unit: matchedProduct.unit || item.unit,
//             rate: matchedProduct.rate || item.rate,
//             taxPercent: matchedProduct.taxPercent || item.taxPercent,
//           };
//         }

//         return { ...item, description: value };
//       }),
//     );
//   };

//   const updateItem = (id: number, key: keyof InvoiceItem, value: string) => {
//     setItems((current) =>
//       current.map((item) => {
//         if (item.id !== id) return item;

//         if (key === "description" || key === "hsn" || key === "unit") {
//           return { ...item, [key]: value };
//         }

//         const numericValue = Number(value);
//         return { ...item, [key]: Number.isFinite(numericValue) ? numericValue : 0 };
//       }),
//     );
//   };

//   const addItem = () => {
//     setItems((current) => [
//       ...current,
//       { id: Date.now(), description: "", hsn: "", unit: "Nos", qty: 1, rate: 0, taxPercent: 0, discountPercent: 0 },
//     ]);
//   };

//   const removeItem = (id: number) => {
//     setItems((current) => current.filter((item) => item.id !== id));
//   };

//   const totals = useMemo(() => {
//     const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
//     const discountTotal = items.reduce((sum, item) => {
//       const lineTotal = item.qty * item.rate;
//       return sum + (lineTotal * item.discountPercent) / 100;
//     }, 0);
//     const taxableBeforeExtraDiscount = Math.max(subtotal - discountTotal, 0);
//     const extraDiscount = Number(extraDiscountAmount || 0);
//     const taxable = Math.max(taxableBeforeExtraDiscount - extraDiscount, 0);
//     const roundOff = Number(roundOffAmount || 0);
//     const taxBeforeExtraDiscount = items.reduce((sum, item) => {
//       const lineTotal = item.qty * item.rate;
//       const discountValue = (lineTotal * item.discountPercent) / 100;
//       const discountedValue = lineTotal - discountValue;
//       return sum + (discountedValue * item.taxPercent) / 100;
//     }, 0);
//     const tax = taxableBeforeExtraDiscount > 0 ? (taxBeforeExtraDiscount / taxableBeforeExtraDiscount) * taxable : 0;

//     let cgst = 0;
//     let sgst = 0;
//     let igst = 0;

//     if (taxType === "cgst-sgst") {
//       cgst = tax / 2;
//       sgst = tax / 2;
//     } else if (taxType === "igst") {
//       igst = tax;
//     }

//     const grandTotalBeforeRoundOff = taxable + tax;
//     const grandTotal = grandTotalBeforeRoundOff + roundOff;
//     const effectiveTaxRate = taxable > 0 ? (tax / taxable) * 100 : 0;
//     const defaultTaxPercent = items.reduce((sum, item) => sum + item.taxPercent, 0) / Math.max(items.length, 1);
//     const cgstRate = taxType === "cgst-sgst" ? defaultTaxPercent / 2 : 0;
//     const sgstRate = taxType === "cgst-sgst" ? defaultTaxPercent / 2 : 0;
//     const igstRate = taxType === "igst" ? defaultTaxPercent : 0;

//     return {
//       subtotal,
//       discountTotal,
//       extraDiscountAmount: extraDiscount,
//       taxableBeforeExtraDiscount,
//       taxable,
//       tax,
//       taxBeforeExtraDiscount,
//       roundOff,
//       grandTotal,
//       effectiveTaxRate,
//       cgst,
//       sgst,
//       igst,
//       cgstRate,
//       sgstRate,
//       igstRate,
//     };
//   }, [items, taxType, extraDiscountAmount, roundOffAmount]);

//   const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

//   const numberToIndianWords = (value: number) => {
//     const isNegative = value < 0;
//     const absoluteValue = Math.abs(Math.round(value));
//     const rupees = Math.floor(absoluteValue);
//     const paise = Math.round((Math.abs(value) - Math.floor(Math.abs(value))) * 100);

//     const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
//     const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
//     const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

//     const lessThan100 = (num: number): string => {
//       if (num < 10) return ones[num];
//       if (num < 20) return teens[num - 10];
//       const last = num % 10;
//       const prefix = tens[Math.floor(num / 10)];
//       return last ? `${prefix} ${ones[last]}` : prefix;
//     };

//     const lessThan1000 = (num: number): string => {
//       if (num < 100) return lessThan100(num);
//       const hundred = Math.floor(num / 100);
//       const remainder = num % 100;
//       return remainder ? `${ones[hundred]} Hundred ${lessThan100(remainder)}` : `${ones[hundred]} Hundred`;
//     };

//     const convert = (num: number): string => {
//       if (num === 0) return "Zero";
//       if (num < 100) return lessThan100(num);
//       if (num < 1000) return lessThan1000(num);

//       const crore = Math.floor(num / 10000000);
//       const lakh = Math.floor((num % 10000000) / 100000);
//       const thousand = Math.floor((num % 100000) / 1000);
//       const rest = num % 1000;

//       const parts: string[] = [];
//       if (crore > 0) parts.push(`${convert(crore)} Crore`);
//       if (lakh > 0) parts.push(`${convert(lakh)} Lakh`);
//       if (thousand > 0) parts.push(`${convert(thousand)} Thousand`);
//       if (rest > 0) parts.push(lessThan1000(rest));

//       return parts.join(" ");
//     };

//     const rupeeWords = convert(rupees);
//     const prefix = isNegative ? "Minus " : "";

//     if (paise > 0) {
//       return `${prefix}${rupeeWords || "Zero"} Rupees And ${convert(paise)} Paise Only`;
//     }

//     return `${prefix}${rupeeWords || "Zero"} Rupees Only`;
//   };

//   const renderCompactMetricCell = (amount: number, percent: number) => {
//     const formattedPercent = percent.toFixed(2).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

//     return (
//       <div className="leading-tight">
//         <div className="font-medium text-slate-900">{formatCurrency(amount)}</div>
//         <div className="text-[10px] text-slate-500">({formattedPercent}%)</div>
//       </div>
//     );
//   };

//   useEffect(() => {
//     const loadCustomers = async () => {
//       try {
//         const response = await fetch("/api/customers");
//         if (!response.ok) return;

//         const data = await response.json();
//         const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];

//         const normalized: Customer[] = list
//           .map((customer: Record<string, unknown>) => ({
//             id: String(customer.id ?? ""),
//             name: String(customer.name ?? ""),
//             contactPerson: String(customer.contactPerson ?? ""),
//             phone: String(customer.phone ?? ""),
//             email: String(customer.email ?? ""),
//             gstin: String(customer.gstin ?? ""),
//             address: String(customer.address ?? ""),
//             city: String(customer.city ?? ""),
//             state: String(customer.state ?? ""),
//             pincode: String(customer.pincode ?? ""),
//           }))
//           .filter((customer: Customer) => customer.id && customer.name);

//         if (normalized.length > 0) {
//           setCustomers(normalized);
//         }
//       } catch {
//         // Keep fallback
//       }
//     };

//     void loadCustomers();
//   }, []);

//   useEffect(() => {
//     const loadProducts = async () => {
//       try {
//         const response = await fetch("/api/products");
//         if (!response.ok) return;

//         const data = await response.json();
//         const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];

//         const normalized: ProductOption[] = list
//           .map((product: Record<string, unknown>) => ({
//             id: String(product.id ?? ""),
//             name: String(product.name ?? product.title ?? ""),
//             hsn: String(product.hsn ?? product.hsnCode ?? product.hsnSac ?? ""),
//             unit: String(product.unit ?? product.uom ?? "Nos"),
//             rate: Number(product.rate ?? product.price ?? product.sellingPrice ?? 0),
//             taxPercent: Number(product.taxPercent ?? product.gstRate ?? product.gst ?? 0),
//           }))
//           .filter((product: ProductOption) => product.name);

//         setProductOptions(normalized);
//       } catch {
//         // Fallback to text input
//       }
//     };

//     void loadProducts();
//   }, []);

//   useEffect(() => {
//     if (sourceInvoiceId) {
//       const timeoutId = window.setTimeout(() => {
//         setIsEditing(false);
//         setEditingInvoiceId(null);
//         setInvoiceNumber(() => `QTN-${Date.now().toString().slice(-6)}`);
//       }, 0);

//         const loadConvertedInvoice = async () => {
//         try {
//           const response = await fetch(`/api/invoices?id=${encodeURIComponent(sourceInvoiceId)}&documentType=quotation`);
//           if (!response.ok) return;

//           const data = await response.json();
//           if (!data) return;

//           applyInvoiceData(data);
//           setConvertedFromProforma(true);
//           setSourceProformaNumber(String(data.invoiceNumber || ""));
//         } catch {
//           // ignore
//         }
//       };

//       void loadConvertedInvoice();
//       return () => window.clearTimeout(timeoutId);
//     }

//     if (!invoiceId) {
//       const timeoutId = window.setTimeout(() => {
//         setIsEditing(false);
//         setEditingInvoiceId(null);
//       }, 0);
//       return () => window.clearTimeout(timeoutId);
//     }

//         const loadInvoice = async () => {
//       try {
//         const response = await fetch(`/api/invoices?id=${encodeURIComponent(invoiceId)}&documentType=quotation`);
//         if (!response.ok) return;

//         const data = await response.json();
//         if (!data) return;

//         setIsEditing(true);
//         setEditingInvoiceId(String(data.id));
//         setInvoiceNumber(String(data.invoiceNumber || ""));
//         applyInvoiceData(data);
//       } catch {
//         // ignore
//       }
//     };

//     void loadInvoice();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [invoiceId, sourceInvoiceId, customers]);

//   const handleGenerateInvoice = async () => {
//     setIsSaving(true);

//     try {
//       const method = isEditing && editingInvoiceId ? "PUT" : "POST";
//       const url =
//         isEditing && editingInvoiceId
//           ? `/api/invoices?id=${encodeURIComponent(editingInvoiceId)}&documentType=quotation`
//           : "/api/invoices";

//       const invoiceNumberToSend = invoiceNumber.trim() || `QTN-${Date.now().toString().slice(-6)}`;
//       const invoiceDateToSend = invoiceDate || today;

//       const response = await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         credentials: "same-origin",
//         body: JSON.stringify({
//           documentType: "quotation",
//           invoiceNumber: invoiceNumberToSend,
//           invoiceDate: invoiceDateToSend,
//           dueDate: dueDateValue || null,
//           partyName,
//           contactPerson,
//           gstin,
//           phone,
//           email,
//           state,
//           address,
//           city,
//           pincode,
//           poDate: poDate || null,
//           poNo,
//           placeOfSupply,
//           taxType,
//           paymentMode,
//           notes,
//           terms,
//           bankDetails,
//           authorizedSignature,
//           additionalDescription,
//           convertedFromProforma,
//           sourceProformaNumber,
//           isDuplicate: isDuplicateCopy,
//           subtotal: totals.subtotal,
//           discountTotal: totals.discountTotal,
//           extraDiscountAmount: totals.extraDiscountAmount,
//           taxableAmount: totals.taxable,
//           taxAmount: totals.tax,
//           roundOff: totals.roundOff,
//           grandTotal: totals.grandTotal,
//           items: items.map((item) => {
//             const taxablePerUnit = item.rate * (1 - item.discountPercent / 100);
//             const taxableAmount = item.qty * taxablePerUnit;
//             const gstAmount = taxableAmount * (item.taxPercent / 100);
//             const finalRatePerUnit = taxablePerUnit + taxablePerUnit * (item.taxPercent / 100);
//             const rowAmount = taxableAmount + gstAmount;

//             return {
//               description: item.description,
//               hsn: item.hsn,
//               unit: item.unit,
//               qty: item.qty,
//               rate: item.rate,
//               taxPercent: item.taxPercent,
//               discountPercent: item.discountPercent,
//               taxablePerUnit,
//               taxableAmount,
//               gstAmount,
//               finalRatePerUnit,
//               rowAmount,
//             };
//           }),
//         }),
//       });

//       if (!response.ok) {
//         let message = "Unable to save invoice.";

//         try {
//           const errorData = await response.json();
//           if (errorData?.error) {
//             message = errorData.error;
//           }
//         } catch {
//           const text = await response.text().catch(() => "");
//           if (text) {
//             message = text;
//           }
//         }

//         throw new Error(`${message} (Status ${response.status})`);
//       }

//       router.push("/admin/generate-bill");
//     } catch (error) {
//       console.error(error);
//       window.alert(error instanceof Error ? error.message : "Unable to save quotation.");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = () => {
//       if (typeof reader.result === "string") {
//         setSignatureImage(reader.result);
//       }
//     };
//     reader.readAsDataURL(file);
//     event.target.value = "";
//   };

//   const removeSignatureImage = () => setSignatureImage(null);

//   const handleShareInvoice = async () => {
//     setIsSharing(true);

//     const shareText = `Quotation ${invoiceNumber || ""} for ${partyName || "customer"} — Grand Total ${formatCurrency(
//       totals.grandTotal,
//     )}${dueDateValue ? ` (due ${dueDateValue})` : ""}`;

//     try {
//       const clipboard =
//         typeof navigator !== "undefined"
//           ? (navigator as Navigator & { clipboard?: { writeText: (text: string) => Promise<void> } }).clipboard
//           : undefined;

//       if (typeof navigator !== "undefined" && "share" in navigator) {
//         await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
//           title: `Invoice ${invoiceNumber}`,
//           text: shareText,
//         });
//       } else if (clipboard) {
//         await clipboard.writeText(shareText);
//         window.alert("Invoice summary copied to clipboard.");
//       } else {
//         window.alert(shareText);
//       }
//     } catch {
//       // ignore user cancellations
//     } finally {
//       setIsSharing(false);
//     }
//   };

//   const openPreviewAsPdf = () => {
//     const node = document.querySelector(".invoice-preview-shell");
//     if (!node) {
//       window.alert("Preview not available.");
//       return;
//     }

//     const newWin = window.open("", "_blank", "noopener,noreferrer");
//     if (!newWin) {
//       window.alert("Unable to open preview; please allow popups.");
//       return;
//     }

//     const head = document.head ? document.head.innerHTML : "";
//     const html = `<!doctype html><html>${head}<body>${(node as HTMLElement).outerHTML}<script>window.onload = function(){setTimeout(function(){window.print();},200);};</script></body></html>`;
//     newWin.document.open();
//     newWin.document.write(html);
//     newWin.document.close();
//   };

//   const hasAnyHsn = items.some((item) => item.hsn.trim() !== "");
//   const hasAnyDiscount = items.some((item) => Number(item.discountPercent) > 0);

//   const inputCls =
//     "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 placeholder-gray-400";

//   const selectCls =
//     "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer";

//   const labelCls = "block text-[11px] font-medium text-gray-500 mb-1";

//   return (
//     <AdminShell
//       title={isEditing ? "Edit Quotation" : "New Quotation"}
//       description="Fill in the details below — switch to Preview to see the exact Quotation that will be saved and printed."
//     >
//       <datalist id={PRODUCT_DATALIST_ID}>
//         {productOptions.map((product) => (
//           <option key={product.id} value={product.name} />
//         ))}
//       </datalist>

//       {showAddCustomerModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 print:hidden">
//           <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
//             <div className="mb-4 flex items-center justify-between">
//               <h2 className="text-lg font-semibold text-slate-950">Add New Customer</h2>
//               <button
//                 type="button"
//                 onClick={() => setShowAddCustomerModal(false)}
//                 className="text-sm text-slate-500 hover:text-slate-800"
//               >
//                 Close
//               </button>
//             </div>

//             {newCustomerError && (
//               <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//                 {newCustomerError}
//               </div>
//             )}

//             <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleAddNewCustomerSubmit}>
//               <label className="block">
//                 <span className="mb-2 block text-sm font-semibold text-slate-700">Name *</span>
//                 <input
//                   value={newCustomerForm.name}
//                   onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
//                   className="admin-input w-full"
//                 />
//               </label>
//               <label className="block">
//                 <span className="mb-2 block text-sm font-semibold text-slate-700">Contact Person</span>
//                 <input
//                   value={newCustomerForm.contactPerson}
//                   onChange={(e) => setNewCustomerForm({ ...newCustomerForm, contactPerson: e.target.value })}
//                   className="admin-input w-full"
//                 />
//               </label>
//               <label className="block">
//                 <span className="mb-2 block text-sm font-semibold text-slate-700">Phone *</span>
//                 <input
//                   value={newCustomerForm.phone}
//                   onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
//                   className="admin-input w-full"
//                 />
//               </label>
//               <label className="block">
//                 <span className="mb-2 block text-sm font-semibold text-slate-700">Email *</span>
//                 <input
//                   type="email"
//                   value={newCustomerForm.email}
//                   onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
//                   className="admin-input w-full"
//                 />
//               </label>
//               <label className="block">
//                 <span className="mb-2 block text-sm font-semibold text-slate-700">GSTIN</span>
//                 <input
//                   value={newCustomerForm.gstin}
//                   onChange={(e) => setNewCustomerForm({ ...newCustomerForm, gstin: e.target.value })}
//                   className="admin-input w-full"
//                 />
//               </label>
//               <label className="block">
//                 <span className="mb-2 block text-sm font-semibold text-slate-700">Address</span>
//                 <input
//                   value={newCustomerForm.address}
//                   onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
//                   className="admin-input w-full"
//                 />
//               </label>
//               <label className="block">
//                 <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
//                 <input
//                   value={newCustomerForm.city}
//                   onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
//                   className="admin-input w-full"
//                 />
//               </label>
//               <label className="block">
//                 <span className="mb-2 block text-sm font-semibold text-slate-700">State</span>
//                 <input
//                   value={newCustomerForm.state}
//                   onChange={(e) => setNewCustomerForm({ ...newCustomerForm, state: e.target.value })}
//                   className="admin-input w-full"
//                 />
//               </label>
//               <label className="block">
//                 <span className="mb-2 block text-sm font-semibold text-slate-700">Pincode</span>
//                 <input
//                   value={newCustomerForm.pincode}
//                   onChange={(e) => setNewCustomerForm({ ...newCustomerForm, pincode: e.target.value })}
//                   className="admin-input w-full"
//                 />
//               </label>
//               <div className="sm:col-span-2 flex flex-wrap gap-2">
//                 <button
//                   type="submit"
//                   disabled={isSavingCustomer}
//                   className="inline-flex items-center justify-center rounded bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {isSavingCustomer ? "Saving…" : "Save Customer"}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setShowAddCustomerModal(false)}
//                   className="inline-flex items-center justify-center rounded border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       <div className="min-h-screen bg-[#e8eaf0] font-sans text-[13px]">
//         <div className={`${showPreview ? "hidden" : ""} print:hidden`}>
//           <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 bg-[#f4f5f8] px-4 py-2 shadow-sm">
//             <div className="flex items-center gap-3">
//               <span className="text-base font-semibold text-gray-800">
//                 {isEditing ? "Edit Quotation" : "Quotation"}
//               </span>
//               {convertedFromProforma && (
//                 <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
//                   Converted from Proforma {sourceProformaNumber || "—"}
//                 </span>
//               )}
//             </div>

//             <div className="flex flex-wrap items-center gap-2">
//               <button
//                 type="button"
//                 onClick={() => setShowPreview(true)}
//                 className="rounded border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
//               >
//                 Preview
//               </button>

//               <button
//                 type="button"
//                 onClick={() => void handleGenerateInvoice()}
//                 disabled={isSaving}
//                 className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
//               >
//                 <Save size={14} />
//                 {isSaving ? "Saving…" : isEditing ? "Update Quotation" : "Save Quotation"}
//               </button>

//               <button
//                 type="button"
//                 onClick={() => {
//                   setShowPreview(true);
//                   window.setTimeout(() => window.print(), 220);
//                 }}
//                 className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
//               >
//                 Print
//               </button>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setShowPreview(true);
//                   // open preview in a new tab and trigger print/save-as-pdf
//                   setTimeout(() => openPreviewAsPdf(), 250);
//                 }}
//                 className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
//               >
//                 Open PDF
//               </button>
//             </div>
//           </div>

//           <div className="mx-auto max-w-[1400px] p-3 space-y-2">
//             <div className="rounded bg-white border border-gray-200 shadow-sm p-3">
//               <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
//                 <div className="space-y-2">
//                   <div>
//                     <label className={`${labelCls} text-blue-600`}>
//                       Customer <span className="text-red-500">*</span>
//                     </label>
//                     <div className="relative">
//                       <select
//                         value={selectedCustomerId}
//                         onChange={(e) => handleCustomerSelect(e.target.value)}
//                         className={`${selectCls} border-blue-400 ring-1 ring-blue-200 pr-7`}
//                       >
//                         <option value="">Select customer…</option>
//                         <option value={ADD_NEW_CUSTOMER_OPTION}>+ Add New Customer</option>
//                         {customers.filter((c) => c.id).map((c) => (
//                           <option key={c.id} value={c.id}>{c.name}</option>
//                         ))}
//                       </select>
//                       <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
//                     </div>
//                   </div>
//                   <div>
//                     <label className={labelCls}>Party Name</label>
//                     <input value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Party name" className={inputCls} />
//                   </div>
//                   <div>
//                     <label className={labelCls}>Contact Person</label>
//                     <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact person" className={inputCls} />
//                   </div>
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <label className={labelCls}>Phone</label>
//                       <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone No." className={inputCls} />
//                     </div>
//                     <div>
//                       <label className={labelCls}>Email</label>
//                       <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputCls} />
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <div>
//                     <label className={labelCls}>Address</label>
//                     <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className={inputCls} />
//                   </div>
//                   <div className="grid grid-cols-3 gap-2">
//                     <div>
//                       <label className={labelCls}>City</label>
//                       <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputCls} />
//                     </div>
//                     <div>
//                       <label className={labelCls}>State</label>
//                       <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className={inputCls} />
//                     </div>
//                     <div>
//                       <label className={labelCls}>Pincode</label>
//                       <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="PIN" className={inputCls} />
//                     </div>
//                   </div>
//                   <div>
//                     <label className={labelCls}>GSTIN</label>
//                     <input value={gstin} onChange={(e) => gstin === null ? "" : setGstin(e.target.value)} placeholder="GSTIN" className={inputCls} />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <label className={labelCls}>Quotation Number</label>
//                       <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className={inputCls} />
//                     </div>
//                     <div>
//                       <label className={labelCls}>Quotation Date</label>
//                       <div className="relative">
//                         <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={`${inputCls} pr-7`} />
//                         <CalendarDays size={13} className="absolute right-2 top-1.5 text-gray-400 pointer-events-none" />
//                       </div>
//                     </div>
//                   </div>
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <label className={labelCls}>Valid Until</label>
//                       <input type="date" value={dueDateValue} onChange={(e) => setDueDateValue(e.target.value)} className={inputCls} />
//                     </div>
//                     <div>
//                       <label className={labelCls}>Place of Supply</label>
//                       <input value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} placeholder="—" className={inputCls} />
//                     </div>
//                   </div>
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <label className={labelCls}>PO No.</label>
//                       <input value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="PO No." className={inputCls} />
//                     </div>
//                     <div>
//                       <label className={labelCls}>PO Date</label>
//                       <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} className={inputCls} />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="rounded bg-white border border-gray-200 shadow-sm overflow-hidden">
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse text-[12px]" style={{ minWidth: "980px" }}>
//                   <thead>
//                     <tr className="bg-[#e8eaf0] text-left text-slate-700">
//                       <th className="border border-slate-300 px-2 py-2 font-semibold">#</th>
//                       <th className="border border-slate-300 px-2 py-2 font-semibold min-w-[160px]">Item name</th>
//                       <th className="border border-slate-300 px-2 py-2 font-semibold">HSN/SAC</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Qty</th>
//                       <th className="border border-slate-300 px-2 py-2 font-semibold">Unit</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Price/unit (Rs)</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Disc %</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Tax %</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Taxable/unit</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Taxable Amt</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">GST</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Final Rate</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Amount Total</th>
//                       <th className="border border-slate-300 px-1 py-2" />
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {items.map((item, index) => {
//                       const taxablePerUnit = item.rate * (1 - item.discountPercent / 100);
//                       const taxableAmount = item.qty * taxablePerUnit;
//                       const gstAmount = taxableAmount * (item.taxPercent / 100);
//                       const finalRate = taxablePerUnit * (1 + item.taxPercent / 100);
//                       const rowTotal = taxableAmount + gstAmount;

//                       return (
//                         <tr key={item.id} className="group hover:bg-slate-50/60 transition-colors">
//                           <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-500 align-middle">{index + 1}</td>
//                           <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
//                             <input
//                               list={PRODUCT_DATALIST_ID}
//                               value={item.description}
//                               onChange={(e) => handleItemNameChange(item.id, e.target.value)}
//                               placeholder="Item description"
//                               className="w-full bg-transparent text-[13px] text-gray-800 focus:outline-none placeholder-gray-300"
//                             />
//                           </td>
//                           <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
//                             <input value={item.hsn} onChange={(e) => updateItem(item.id, "hsn", e.target.value)} placeholder="—" className="w-full bg-transparent text-[13px] text-gray-800 focus:outline-none" />
//                           </td>
//                           <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
//                             <input
//                               type="number"
//                               min="0"
//                               value={item.qty}
//                               onChange={(e) => updateItem(item.id, "qty", e.target.value)}
//                               className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                             />
//                           </td>
//                           <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
//                             <div className="relative">
//                               <select
//                                 value={item.unit}
//                                 onChange={(e) => updateItem(item.id, "unit", e.target.value)}
//                                 className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer pr-4"
//                               >
//                                 <option value="">—</option>
//                                 {UNITS.map((u) => <option key={u}>{u}</option>)}
//                               </select>
//                               <ChevronDown size={11} className="absolute right-0.5 top-1.5 text-gray-400 pointer-events-none" />
//                             </div>
//                           </td>
//                           <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
//                             <input
//                               type="number"
//                               min="0"
//                               value={item.rate === 0 ? "" : item.rate}
//                               onChange={(e) => updateItem(item.id, "rate", e.target.value)}
//                               placeholder="0"
//                               className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                             />
//                           </td>
//                           <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
//                             <input
//                               type="number"
//                               min="0"
//                               max="100"
//                               value={item.discountPercent === 0 ? "" : item.discountPercent}
//                               onChange={(e) => updateItem(item.id, "discountPercent", e.target.value)}
//                               placeholder="0"
//                               className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                             />
//                           </td>
//                           <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
//                             <input
//                               type="number"
//                               min="0"
//                               max="100"
//                               value={item.taxPercent === 0 ? "" : item.taxPercent}
//                               onChange={(e) => updateItem(item.id, "taxPercent", e.target.value)}
//                               placeholder="0"
//                               className="w-full bg-transparent text-right text-[13px] text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                             />
//                           </td>
//                           <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(taxablePerUnit)}</td>
//                           <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(taxableAmount)}</td>
//                           <td className="border border-slate-300 px-2 py-1.5 text-right align-middle">{renderCompactMetricCell(gstAmount, item.taxPercent)}</td>
//                           <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(finalRate)}</td>
//                           <td className="border border-slate-300 px-2 py-1.5 text-right align-middle font-semibold text-slate-900">{formatCurrency(rowTotal)}</td>
//                           <td className="border border-slate-300 px-1 py-1.5 text-center align-middle">
//                             <button
//                               type="button"
//                               onClick={() => removeItem(item.id)}
//                               className="rounded px-1.5 py-0.5 text-[12px] font-bold text-slate-300 transition hover:bg-red-50 hover:text-red-500"
//                             >
//                               ×
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                   <tfoot>
//                     <tr>
//                       <td colSpan={14} className="border-t border-slate-100 px-3 py-2">
//                         <button
//                           type="button"
//                           onClick={addItem}
//                           className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 transition hover:text-blue-800"
//                         >
//                           <Plus size={13} /> Add Item
//                         </button>
//                       </td>
//                     </tr>
//                     <tr className="bg-slate-50 font-semibold text-slate-900 text-[12px]">
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2">Total</td>
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2 text-right">{items.reduce((sum, item) => sum + item.qty, 0)}</td>
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount)}</td>
//                       <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.taxBeforeExtraDiscount)}</td>
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2 text-right">
//                         {formatCurrency(totals.taxableBeforeExtraDiscount + totals.taxBeforeExtraDiscount)}
//                       </td>
//                       <td className="border border-slate-300 px-2 py-2" />
//                     </tr>
//                   </tfoot>
//                 </table>
//               </div>
//             </div>

//             <div className="rounded bg-white border border-gray-200 shadow-sm p-3">
//               <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
//                 <div className="space-y-2 lg:col-span-2">
//                   <div className="flex flex-wrap gap-2 pt-1">
//                     {!showDescriptionField && (
//                       <button
//                         type="button"
//                         onClick={() => setShowDescriptionField(true)}
//                         className="flex items-center gap-1.5 rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-100 transition-colors"
//                       >
//                         <AlignLeft size={13} className="text-gray-500" /> ADD DESCRIPTION
//                       </button>
//                     )}
//                   </div>

//                   {showDescriptionField && (
//                     <div>
//                       <div className="mb-1 flex items-center justify-between">
//                         <label className={labelCls}>Additional Description</label>
//                         <button
//                           type="button"
//                           onClick={() => {
//                             setShowDescriptionField(false);
//                             setAdditionalDescription("");
//                           }}
//                           className="text-[11px] font-semibold text-red-500 hover:text-red-700"
//                         >
//                           Remove
//                         </button>
//                       </div>
//                       <textarea
//                         value={additionalDescription}
//                         onChange={(e) => setAdditionalDescription(e.target.value)}
//                         rows={2}
//                         placeholder="Extra details about this invoice…"
//                         className={`${inputCls} resize-none`}
//                       />
//                     </div>
//                   )}

//                   <div>
//                     <label className={labelCls}>Notes</label>
//                     <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Thank you for your business." className={`${inputCls} resize-none`} />
//                   </div>
//                   <div>
//                     <label className={labelCls}>Terms &amp; Conditions</label>
//                     <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} placeholder="Payment due within 7 days of invoice date." className={`${inputCls} resize-none`} />
//                   </div>
//                   <div>
//                     <label className={labelCls}>Bank Details</label>
//                     <textarea value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
//                   </div>

//                   <div className="grid grid-cols-2 gap-2 items-end">
//                     <div>
//                       <label className={labelCls}>Authorized Signature Label</label>
//                       <input value={authorizedSignature} onChange={(e) => setAuthorizedSignature(e.target.value)} placeholder="Authorized Signatory" className={inputCls} />
//                     </div>
//                     <div className="flex items-center gap-3">
//                       <div className="flex h-14 w-24 items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
//                         {signatureImage ? (
//                           <img src={signatureImage} alt="Authorized signature" className="h-full w-full object-contain" />
//                         ) : (
//                           "Signature"
//                         )}
//                       </div>
//                       <div className="flex flex-col gap-1">
//                         <label className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:text-blue-800">
//                           {signatureImage ? "Replace" : "Upload image"}
//                           <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
//                         </label>
//                         {signatureImage && (
//                           <button type="button" onClick={removeSignatureImage} className="text-[11px] font-semibold text-red-500 hover:text-red-700 text-left">
//                             Remove
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <div className="flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-300 px-2 py-1 w-fit">
//                     <span className={`text-[12px] font-medium ${paymentMode.toLowerCase() !== "cash" ? "text-blue-600" : "text-gray-500"}`}>Credit</span>
//                     <button
//                       type="button"
//                       onClick={() => setPaymentMode((current) => (current.toLowerCase() === "cash" ? "Credit" : "Cash"))}
//                       className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${paymentMode.toLowerCase() === "cash" ? "bg-blue-500" : "bg-gray-300"}`}
//                     >
//                       <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${paymentMode.toLowerCase() === "cash" ? "translate-x-4" : "translate-x-0.5"}`} />
//                     </button>
//                     <span className={`text-[12px] font-medium ${paymentMode.toLowerCase() === "cash" ? "text-blue-600" : "text-gray-500"}`}>Cash</span>
//                   </div>
//                   <div>
//                     <label className={labelCls}>Payment Mode (custom label)</label>
//                     <input value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputCls} placeholder="Credit" />
//                   </div>

//                   <div>
//                     <label className={labelCls}>Tax Type</label>
//                     <div className="relative">
//                       <select value={taxType} onChange={(e) => setTaxType(e.target.value as TaxType)} className={`${selectCls} pr-7`}>
//                         <option value="cgst-sgst">CGST + SGST</option>
//                         <option value="igst">IGST</option>
//                         <option value="none">No Tax</option>
//                       </select>
//                       <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
//                     </div>
//                   </div>

//                   <div className="rounded border border-gray-200 bg-gray-50 p-2 text-[12px] text-gray-700 space-y-1">
//                     <div className="flex items-center justify-between"><span className="text-gray-500">Taxable Amount</span><span>{formatCurrency(totals.taxableBeforeExtraDiscount)}</span></div>
//                     {taxType === "cgst-sgst" && (
//                       <>
//                         <div className="flex items-center justify-between"><span className="text-gray-500">CGST ({totals.cgstRate.toFixed(2)}%)</span><span>{formatCurrency(totals.cgst)}</span></div>
//                         <div className="flex items-center justify-between"><span className="text-gray-500">SGST ({totals.sgstRate.toFixed(2)}%)</span><span>{formatCurrency(totals.sgst)}</span></div>
//                       </>
//                     )}
//                     {taxType === "igst" && (
//                       <div className="flex items-center justify-between"><span className="text-gray-500">IGST ({totals.igstRate.toFixed(2)}%)</span><span>{formatCurrency(totals.igst)}</span></div>
//                     )}
//                     <div className="flex items-center justify-between font-semibold"><span className="text-gray-600">Total Tax</span><span>{formatCurrency(totals.tax)}</span></div>
//                   </div>

//                   <div>
//                     <label className={labelCls}>Discount on Taxable Amount (₹)</label>
//                     <input
//                       type="number"
//                       min="0"
//                       step="0.01"
//                       value={extraDiscountAmount === 0 ? "" : extraDiscountAmount}
//                       onChange={(e) => setExtraDiscountAmount(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)}
//                       placeholder="0"
//                       className={`${inputCls} text-right`}
//                     />
//                   </div>

//                   <div>
//                     <label className={labelCls}>Round Off (₹)</label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       value={roundOffAmount === 0 ? "" : roundOffAmount}
//                       onChange={(e) => setRoundOffAmount(Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0)}
//                       placeholder="0"
//                       className={`${inputCls} text-right`}
//                     />
//                   </div>

//                   <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-2">
//                     <span className="text-[13px] font-semibold text-gray-800">Grand Total</span>
//                     <span className="text-[14px] font-bold text-gray-900">{formatCurrency(totals.grandTotal)}</span>
//                   </div>
//                   <div className="text-[11px] text-gray-500 leading-snug">{numberToIndianWords(totals.grandTotal)}</div>
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center justify-end gap-2 pb-2">
//               <button
//                 type="button"
//                 onClick={() => void handleShareInvoice()}
//                 disabled={isSharing}
//                 className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 <Share2 size={14} /> {isSharing ? "Sharing…" : "Share"}
//               </button>

//               <button
//                 type="button"
//                 onClick={() => void handleGenerateInvoice()}
//                 disabled={isSaving}
//                 className="flex items-center gap-1.5 rounded bg-blue-600 px-5 py-2 text-[13px] font-semibold text-white shadow hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-blue-400"
//               >
//                 <Check size={14} />
//                 {isSaving ? "Saving…" : isEditing ? "Update" : "Save"}
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className={showPreview ? "block" : "hidden print:block"}>
//           {showPreview && (
//             <div className="mx-auto mb-3 flex max-w-[1000px] items-center justify-between px-1 print:hidden">
//               <span className="text-sm font-semibold text-slate-700">Quotation Preview</span>
//               <div className="flex items-center gap-2">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     // open preview as PDF in new tab
//                     openPreviewAsPdf();
//                   }}
//                   className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
//                 >
//                   Open PDF
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setShowPreview(false)}
//                   className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
//                 >
//                   Back to Editing
//                 </button>
//               </div>
//             </div>
//           )}

//           <div className="invoice-preview-shell mx-auto w-full px-1 py-2 print:px-0">
//             <QuotationPreview
//               partyName={partyName}
//               contactPerson={contactPerson}
//               gstin={gstin}
//               phone={phone}
//               email={email}
//               address={address}
//               city={city}
//               state={state}
//               pincode={pincode}
//               quotationNumber={invoiceNumber}
//               quotationDate={invoiceDate}
//               validUntil={dueDateValue}
//               poDate={poDate}
//               poNo={poNo}
//               placeOfSupply={placeOfSupply}
//               items={items.map((item) => ({
//                 description: item.description,
//                 hsn: item.hsn,
//                 unit: item.unit,
//                 qty: item.qty,
//                 rate: item.rate,
//                 taxPercent: item.taxPercent,
//                 discountPercent: item.discountPercent,
//               }))}
//               taxType={taxType}
//               notes={notes}
//               terms={terms}
//               additionalDescription={additionalDescription}
//               extraDiscountAmount={extraDiscountAmount}
//               roundOffAmount={roundOffAmount}
//               paymentMode={paymentMode}
//               authorizedSignature={authorizedSignature}
//               signatureImage={signatureImage}
//               convertedFromProforma={convertedFromProforma}
//               sourceProformaNumber={sourceProformaNumber}
//               isDuplicateCopy={isDuplicateCopy}
//               isEditing={isEditing}
//               bankDetails={bankDetails}
//             />
//           </div>

//           <div className="invoice-preview-shell mx-auto w-full hidden">
//             <div className="overflow-hidden rounded-2xl border-[1.5px] border-slate-300 bg-white text-slate-800 shadow-[0_8px_32px_rgba(15,23,42,0.07)] print:rounded-none print:shadow-none print:border-[1.2px]">
//               <div className="relative flex items-center justify-center border-b border-slate-300 bg-[#f7f9fc] px-6 py-3">
//                 <h2 className="text-base font-semibold text-slate-900">Quotation </h2>
//               </div>

//               <div className="flex items-start justify-between gap-4 border-b border-slate-300 bg-white px-6 pb-4 pt-4">
//                 <div className="flex items-start gap-3">
//                   <img src="/LOGO.png" alt="Radiatech Electra" className="h-12 w-12 rounded-md object-contain" />
//                   <div>
//                     <h3 className="text-xl font-bold tracking-wide text-slate-950">RADIATECH ELECTRA</h3>
//                     <p className="mt-1 text-[11px] text-slate-600">
//                       Basement, A-287, Sector 69, Noida, Gautam Buddha Nagar, Uttar Pradesh, 201301
//                     </p>
//                   </div>
//                 </div>
//                 <div className="text-right text-[11px] text-slate-600">
//                   <div>Phone: +91 81788 50959</div>
//                   <div>Email: sales@radiatech.in</div>
//                   <div>GSTIN: 09DDZPK0004H1ZF</div>
//                   <div>State: 09-Uttar Pradesh</div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 border-b border-slate-300 sm:grid-cols-2">
//                 <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r">
//                   <div className="rounded-lg border border-slate-300 bg-white p-3">
//                     <div className="mb-2 flex items-center justify-between">
//                       <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quotation To:</p>
//                       <select
//                         value={selectedCustomerId}
//                         onChange={(e) => handleCustomerSelect(e.target.value)}
//                         className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 outline-none transition hover:border-slate-300 print:hidden cursor-pointer"
//                       >
//                         <option value="">Select customer…</option>
//                         <option value={ADD_NEW_CUSTOMER_OPTION}>+ Add New Customer</option>
//                         {customers.filter((c) => c.id).map((c) => (
//                           <option key={c.id} value={c.id}>{c.name}</option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="space-y-0.5 text-[13px]">
//                       <input value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="Party name" className="inv-field w-full font-semibold text-slate-900" />
//                       <div className={contactPerson ? "" : "print:hidden"}>
//                         <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact person" className="inv-field w-full text-slate-700" />
//                       </div>
//                       <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="inv-field w-full text-slate-700" />
//                       <div className="flex gap-1">
//                         <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="inv-field min-w-0 flex-1 text-slate-700" />
//                         <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="inv-field min-w-0 flex-1 text-slate-700" />
//                         <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="PIN" className="inv-field w-16 text-slate-700" />
//                       </div>
//                       <div className={`flex items-center gap-1 text-slate-700 ${phone ? "" : "print:hidden"}`}>
//                         <span className="shrink-0 text-slate-500">Contact No:</span>
//                         <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="—" className="inv-field min-w-0 flex-1" />
//                       </div>
//                       <div className={`flex items-center gap-1 text-slate-700 ${email ? "" : "print:hidden"}`}>
//                         <span className="shrink-0 text-slate-500">Email:</span>
//                         <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="—" className="inv-field min-w-0 flex-1" />
//                       </div>
//                       <div className={`flex items-center gap-1 text-slate-700 ${gstin ? "" : "print:hidden"}`}>
//                         <span className="shrink-0 text-slate-500">GSTIN:</span>
//                         <input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="—" className="inv-field min-w-0 flex-1" />
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-white p-4">
//                   <div className="rounded-lg border border-slate-300 bg-white p-3">
//                     <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quotation Details:</p>
//                     <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-[13px] text-slate-800">
//                       <span className="whitespace-nowrap font-semibold text-slate-900">Quotation No:</span>
//                       <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="inv-field w-full" />
//                       <span className="font-semibold text-slate-900">Date:</span>
//                       <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="inv-field w-full" />
//                       <span className="whitespace-nowrap font-semibold text-slate-900">Valid Until:</span>
//                       <input type="date" value={dueDateValue} onChange={(e) => setDueDateValue(e.target.value)} className="inv-field w-full" />
//                       <span className={`whitespace-nowrap font-semibold text-slate-900 ${poDate ? "" : "print:hidden"}`}>PO Date:</span>
//                       <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} className={`inv-field w-full ${poDate ? "" : "print:hidden"}`} />
//                       <span className={`whitespace-nowrap font-semibold text-slate-900 ${poNo ? "" : "print:hidden"}`}>PO No:</span>
//                       <input value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="—" className={`inv-field w-full ${poNo ? "" : "print:hidden"}`} />
//                       <span className={`whitespace-nowrap font-semibold text-slate-900 ${placeOfSupply ? "" : "print:hidden"}`}>Reference No:</span>
//                       <input value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} placeholder="—" className={`inv-field w-full ${placeOfSupply ? "" : "print:hidden"}`} />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="invoice-table-wrap border-b border-slate-300 overflow-x-auto">
//                 <table className="w-full border-collapse text-[12px]" style={{ minWidth: "980px" }}>
//                   <thead>
//                     <tr className="bg-[#bec9d9] text-left text-slate-700">
//                       <th className="border border-slate-300 px-2 py-2 font-semibold">#</th>
//                       <th className="border border-slate-300 px-2 py-2 font-semibold min-w-[160px]">Item name</th>
//                       <th className={`border border-slate-300 px-2 py-2 font-semibold ${hasAnyHsn ? "" : "print:hidden"}`}>HSN/SAC</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Qty</th>
//                       <th className="border border-slate-300 px-2 py-2 font-semibold">Unit</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Price/unit (Rs)</th>
//                       <th className={`border border-slate-300 px-2 py-2 text-right font-semibold ${hasAnyDiscount ? "" : "print:hidden"}`}>Disc %</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Tax %</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Taxable/unit</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Taxable Amt</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">GST</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Final Rate</th>
//                       <th className="border border-slate-300 px-2 py-2 text-right font-semibold">Amount Total</th>
//                       <th className="border border-slate-300 px-1 py-2 print:hidden" />
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {items.map((item, index) => {
//                       const taxablePerUnit = item.rate * (1 - item.discountPercent / 100);
//                       const taxableAmount = item.qty * taxablePerUnit;
//                       const gstAmount = taxableAmount * (item.taxPercent / 100);
//                       const finalRate = taxablePerUnit * (1 + item.taxPercent / 100);
//                       const rowTotal = taxableAmount + gstAmount;

//                       return (
//                         <tr key={item.id} className="group hover:bg-slate-50/60 transition-colors">
//                           <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-500 align-middle">{index + 1}</td>
//                           <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
//                             <input
//                               list={PRODUCT_DATALIST_ID}
//                               value={item.description}
//                               onChange={(e) => handleItemNameChange(item.id, e.target.value)}
//                               placeholder="Item description"
//                               className="inv-field w-full"
//                             />
//                           </td>
//                           <td className={`border border-slate-300 px-1.5 py-1.5 align-middle ${hasAnyHsn ? "" : "print:hidden"}`}>
//                             <input value={item.hsn} onChange={(e) => updateItem(item.id, "hsn", e.target.value)} placeholder="—" className="inv-field w-full" />
//                           </td>
//                           <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
//                             <input
//                               type="number"
//                               min="0"
//                               value={item.qty}
//                               onChange={(e) => updateItem(item.id, "qty", e.target.value)}
//                               className="inv-field w-full text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                             />
//                           </td>
//                           <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
//                             <input value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)} placeholder="Nos" className="inv-field w-full" />
//                           </td>
//                           <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
//                             <input
//                               type="number"
//                               min="0"
//                               value={item.rate === 0 ? "" : item.rate}
//                               onChange={(e) => updateItem(item.id, "rate", e.target.value)}
//                               placeholder="0"
//                               className="inv-field w-full text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                             />
//                           </td>
//                           <td className={`border border-slate-300 px-1.5 py-1.5 align-middle ${hasAnyDiscount ? "" : "print:hidden"}`}>
//                             <input
//                               type="number"
//                               min="0"
//                               max="100"
//                               value={item.discountPercent === 0 ? "" : item.discountPercent}
//                               onChange={(e) => updateItem(item.id, "discountPercent", e.target.value)}
//                               placeholder="0"
//                               className="inv-field w-full text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                             />
//                           </td>
//                           <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
//                             <input
//                               type="number"
//                               min="0"
//                               max="100"
//                               value={item.taxPercent === 0 ? "" : item.taxPercent}
//                               onChange={(e) => updateItem(item.id, "taxPercent", e.target.value)}
//                               placeholder="0"
//                               className="inv-field w-full text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                             />
//                           </td>
//                           <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(taxablePerUnit)}</td>
//                           <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(taxableAmount)}</td>
//                           <td className="border border-slate-300 px-2 py-1.5 text-right align-middle">{renderCompactMetricCell(gstAmount, item.taxPercent)}</td>
//                           <td className="border border-slate-300 px-2 py-1.5 text-right align-middle text-slate-700">{formatCurrency(finalRate)}</td>
//                           <td className="border border-slate-300 px-2 py-1.5 text-right align-middle font-semibold text-slate-900">{formatCurrency(rowTotal)}</td>
//                           <td className="border border-slate-300 px-1 py-1.5 text-center align-middle print:hidden">
//                             <button
//                               type="button"
//                               onClick={() => removeItem(item.id)}
//                               className="rounded px-1.5 py-0.5 text-[12px] font-bold text-slate-300 transition hover:bg-red-50 hover:text-red-500"
//                             >
//                               ×
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                   <tfoot>
//                     <tr className="print:hidden">
//                       <td colSpan={14} className="border-t border-slate-100 px-3 py-2">
//                         <button
//                           type="button"
//                           onClick={addItem}
//                           className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 transition hover:text-blue-800"
//                         >
//                           <span className="text-[15px] leading-none">+</span> Add Item
//                         </button>
//                       </td>
//                     </tr>
//                     <tr className="bg-slate-50 font-semibold text-slate-900 text-[12px]">
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2">Total</td>
//                       <td className={`border border-slate-300 px-2 py-2 ${hasAnyHsn ? "" : "print:hidden"}`} />
//                       <td className="border border-slate-300 px-2 py-2 text-right">{items.reduce((sum, item) => sum + item.qty, 0)}</td>
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className={`border border-slate-300 px-2 py-2 ${hasAnyDiscount ? "" : "print:hidden"}`} />
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.taxableBeforeExtraDiscount)}</td>
//                       <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(totals.taxBeforeExtraDiscount)}</td>
//                       <td className="border border-slate-300 px-2 py-2" />
//                       <td className="border border-slate-300 px-2 py-2 text-right">
//                         {formatCurrency(totals.taxableBeforeExtraDiscount + totals.taxBeforeExtraDiscount)}
//                       </td>
//                       <td className="border border-slate-300 px-2 py-2 print:hidden" />
//                     </tr>
//                   </tfoot>
//                 </table>
//               </div>

//               <div className="grid grid-cols-1 border-b border-slate-300 bg-white sm:grid-cols-2">
//                 <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r">
//                   <div className="invoice-card rounded-lg border border-slate-300 bg-white p-3">
//                     <div className="mb-2 flex items-center justify-between">
//                       <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tax Summary:</p>
//                       <select
//                         value={taxType}
//                         onChange={(e) => setTaxType(e.target.value as TaxType)}
//                         className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 outline-none transition hover:border-slate-300 cursor-pointer"
//                       >
//                         <option value="cgst-sgst">CGST + SGST</option>
//                         <option value="igst">IGST</option>
//                         <option value="none">No Tax</option>
//                       </select>
//                     </div>

//                     <table className="mt-2 w-full border-collapse text-[11px]">
//                       <thead>
//                         <tr className="bg-slate-100 text-left text-slate-600">
//                           <th className="border border-slate-300 px-2 py-1 font-semibold">Taxable</th>
//                           {taxType === "cgst-sgst" ? (
//                             <>
//                               <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST Rate</th>
//                               <th className="border border-slate-300 px-2 py-1 text-right font-semibold">CGST Amt</th>
//                               <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST Rate</th>
//                               <th className="border border-slate-300 px-2 py-1 text-right font-semibold">SGST Amt</th>
//                             </>
//                           ) : taxType === "igst" ? (
//                             <>
//                               <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST Rate</th>
//                               <th className="border border-slate-300 px-2 py-1 text-right font-semibold">IGST Amt</th>
//                             </>
//                           ) : null}
//                           <th className="border border-slate-300 px-2 py-1 text-right font-semibold">Total Tax</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         <tr className="bg-[#fbfcfe]">
//                           <td className="border border-slate-300 px-2 py-1 font-semibold text-slate-900">{formatCurrency(totals.taxable)}</td>
//                           {taxType === "cgst-sgst" ? (
//                             <>
//                               <td className="border border-slate-300 px-2 py-1 text-right">{totals.cgstRate.toFixed(2)}%</td>
//                               <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.cgst)}</td>
//                               <td className="border border-slate-300 px-2 py-1 text-right">{totals.sgstRate.toFixed(2)}%</td>
//                               <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.sgst)}</td>
//                             </>
//                           ) : taxType === "igst" ? (
//                             <>
//                               <td className="border border-slate-300 px-2 py-1 text-right">{totals.igstRate.toFixed(2)}%</td>
//                               <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.igst)}</td>
//                             </>
//                           ) : null}
//                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.tax)}</td>
//                         </tr>
//                         <tr className="bg-[#ce9b24] font-semibold text-slate-900">
//                           <td className="border border-slate-300 px-2 py-1">TOTAL</td>
//                           {taxType === "cgst-sgst" ? (
//                             <>
//                               <td className="border border-slate-300 px-2 py-1 text-right">—</td>
//                               <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.cgst)}</td>
//                               <td className="border border-slate-300 px-2 py-1 text-right">—</td>
//                               <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.sgst)}</td>
//                             </>
//                           ) : taxType === "igst" ? (
//                             <>
//                               <td className="border border-slate-300 px-2 py-1 text-right">—</td>
//                               <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.igst)}</td>
//                             </>
//                           ) : null}
//                           <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(totals.tax)}</td>
//                         </tr>
//                       </tbody>
//                     </table>

//                     <div className="mt-3 text-[12px] text-slate-700">
//                       <span className="font-semibold text-slate-900">Quotation Amount in Words: </span>
//                       {numberToIndianWords(totals.grandTotal)}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-white p-4 text-[13px] text-slate-800">
//                   {totals.discountTotal > 0 && (
//                     <div className="flex items-center justify-between gap-2">
//                       <span className="text-slate-500">Item-wise Discount</span>
//                       <span>: {formatCurrency(totals.discountTotal)}</span>
//                     </div>
//                   )}

//                   <div className={`mt-1 flex items-center justify-between gap-2 ${extraDiscountAmount ? "" : "print:hidden"}`}>
//                     <span className="text-slate-500">Discount on Taxable Amount</span>
//                     <div className="flex items-center gap-0.5">
//                       <span className="text-slate-500">: ₹</span>
//                       <input
//                         type="number"
//                         min="0"
//                         step="0.01"
//                         value={extraDiscountAmount === 0 ? "" : extraDiscountAmount}
//                         onChange={(e) => {
//                           const numericValue = Number(e.target.value);
//                           setExtraDiscountAmount(Number.isFinite(numericValue) ? numericValue : 0);
//                         }}
//                         placeholder="0"
//                         className="inv-field w-20 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                       />
//                     </div>
//                   </div>

//                   {totals.extraDiscountAmount > 0 ? (
//                     <div className="mt-1 flex items-center justify-between gap-2">
//                       <span className="text-slate-500">Taxable Amt (after extra disc.)</span>
//                       <span>: {formatCurrency(totals.taxable)}</span>
//                     </div>
//                   ) : (
//                     <div className="flex items-center justify-between gap-2">
//                       <span className="text-slate-500">Taxable Amount</span>
//                       <span>: {formatCurrency(totals.taxableBeforeExtraDiscount)}</span>
//                     </div>
//                   )}
//                   <div className="mt-1 flex items-center justify-between gap-2">
//                     <span className="text-slate-500">Tax</span>
//                     <span>: {formatCurrency(totals.tax)}</span>
//                   </div>

//                   <div className={`mt-1 flex items-center justify-between gap-2 ${roundOffAmount ? "" : "print:hidden"}`}>
//                     <span className="text-slate-500">Round off</span>
//                     <div className="flex items-center gap-0.5">
//                       <span className="text-slate-500">: ₹</span>
//                       <input
//                         type="number"
//                         step="0.01"
//                         value={roundOffAmount === 0 ? "" : roundOffAmount}
//                         onChange={(e) => {
//                           const numericValue = Number(e.target.value);
//                           setRoundOffAmount(Number.isFinite(numericValue) ? numericValue : 0);
//                         }}
//                         placeholder="0"
//                         className="inv-field w-20 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                       />
//                     </div>
//                   </div>

//                   <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-300 pt-2 text-[15px] font-semibold text-slate-950">
//                     <span>Grand Total</span>
//                     <span>: {formatCurrency(totals.grandTotal)}</span>
//                   </div>

//                   <div className="mt-3 flex items-center justify-between gap-2">
//                     <span className="text-slate-500">Payment Mode</span>
//                     <div className="flex items-center gap-0.5">
//                       <span className="text-slate-500">:</span>
//                       <input value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="inv-field text-right" placeholder="Credit" />
//                     </div>
//                   </div>
//                   <div className="mt-1 flex items-center justify-between gap-2 font-semibold text-slate-900">
//                     <span>Balance</span>
//                     <span>: {formatCurrency(totals.grandTotal)}</span>
//                   </div>
//                 </div>
//               </div>

//               <div className={`border-b border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-700 ${notes || terms || additionalDescription ? "" : "print:hidden"}`}>
//                 <div className="rounded-lg border border-slate-300 bg-white p-3">
//                   <div className={additionalDescription ? "" : "print:hidden"}>
//                     <div className="font-semibold text-slate-900">Description</div>
//                     <textarea
//                       value={additionalDescription}
//                       onChange={(e) => setAdditionalDescription(e.target.value)}
//                       rows={2}
//                       placeholder="Extra details about this invoice…"
//                       className="inv-field mt-1 w-full resize-none"
//                     />
//                   </div>
//                   <div className={`${notes ? "" : "print:hidden"} ${additionalDescription ? "mt-3" : ""}`}>
//                     <div className="font-semibold text-slate-900">Notes</div>
//                     <textarea
//                       value={notes}
//                       onChange={(e) => setNotes(e.target.value)}
//                       rows={2}
//                       placeholder="Thank you for your business."
//                       className="inv-field mt-1 w-full resize-none"
//                     />
//                   </div>
//                   <div className={terms ? "mt-3" : "mt-3 print:hidden"}>
//                     <div className="font-semibold text-slate-900">Terms &amp; Conditions</div>
//                     <textarea
//                       value={terms}
//                       onChange={(e) => setTerms(e.target.value)}
//                       rows={2}
//                       placeholder="Payment due within 7 days of invoice date."
//                       className="inv-field mt-1 w-full resize-none"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 gap-4 bg-white p-4 sm:grid-cols-2">
//                 <div>
//                   <div className="invoice-card rounded-lg border border-slate-300 bg-slate-50 p-3">
//                     <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bank Details:</p>
//                     <textarea
//                       value={bankDetails}
//                       onChange={(e) => setBankDetails(e.target.value)}
//                       rows={4}
//                       className="inv-field mt-2 w-full resize-none text-[12px] text-slate-700"
//                     />
//                   </div>
//                 </div>
//                 <div className="flex flex-col items-end justify-end text-[13px] text-slate-700">
//                   <div className="invoice-card rounded-lg border border-slate-300 bg-white p-3 text-center">
//                     <div className="font-semibold text-slate-900">For Radiatech Electra:</div>
//                     <div className="mx-auto mt-2 flex h-16 w-32 items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
//                       {signatureImage ? (
//                         <img src={signatureImage} alt="Authorized signature" className="h-full w-full object-contain" />
//                       ) : (
//                         "Signature"
//                       )}
//                     </div>
//                     <div className="mt-2 flex items-center justify-center gap-3 print:hidden">
//                       <label className="cursor-pointer text-[10px] font-semibold text-blue-500 transition hover:text-blue-700">
//                         {signatureImage ? "Replace" : "Upload image"}
//                         <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
//                       </label>
//                       {signatureImage && (
//                         <button type="button" onClick={removeSignatureImage} className="text-[10px] font-semibold text-red-400 transition hover:text-red-600">
//                           Remove
//                         </button>
//                       )}
//                     </div>
//                     <div className="mt-1">
//                       <input
//                         value={authorizedSignature}
//                         onChange={(e) => setAuthorizedSignature(e.target.value)}
//                         className="inv-field w-full text-center text-[11px] font-semibold text-slate-700"
//                         placeholder="Authorized Signatory"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <style jsx global>{`
//             @media print {
//               body {
//                 background: white !important;
//                 margin: 0 !important;
//               }
//               body * {
//                 visibility: hidden !important;
//               }
//               .invoice-preview-shell,
//               .invoice-preview-shell * {
//                 visibility: visible !important;
//                 -webkit-print-color-adjust: exact !important;
//                 print-color-adjust: exact !important;
//               }
//               .invoice-preview-shell {
//                 position: absolute !important;
//                 left: 0 !important;
//                 top: 0 !important;
//                 width: 100% !important;
//                 max-width: none !important;
//                 box-shadow: none !important;
//                 border: none !important;
//                 padding: 0 !important;
//                 margin: 0 !important;
//                 background: white !important;
//               }
//               .invoice-preview-shell .invoice-card,
//               .invoice-preview-shell .invoice-table-wrap {
//                 page-break-inside: avoid !important;
//                 break-inside: avoid !important;
//               }
//               .print\\:hidden {
//                 display: none !important;
//               }
//             }
//           `}</style>
//         </div>
//       </div>
//     </AdminShell>
//   );
// }






"use client";
import AdminShell from "@/components/admin/AdminShell";
import {
    AlignLeft,
    CalendarDays,
    Check,
    ChevronDown,
    Plus,
    Save,
    Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

const PRODUCT_DATALIST_ID = "invoice-product-options";
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

const UNITS = ["Nos", "Pcs", "Kg", "L", "m", "Box", "Set"];

export default function InvoicePage() {
  const router = useRouter();
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [sourceInvoiceId, setSourceInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setInvoiceId(query.get("invoiceId"));
    setSourceInvoiceId(query.get("fromProformaId"));
  }, []);

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
  const [invoiceNumber, setInvoiceNumber] = useState(() => `QTN-${Date.now().toString().slice(-6)}`);
  const [poDate, setPoDate] = useState("");
  const [poNo, setPoNo] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
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

  const [convertedFromProforma, setConvertedFromProforma] = useState(false);
  const [sourceProformaNumber, setSourceProformaNumber] = useState("");
  const [isDuplicateCopy, setIsDuplicateCopy] = useState(false);

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState(emptyNewCustomerForm);
  const [newCustomerError, setNewCustomerError] = useState("");
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [showDescriptionField, setShowDescriptionField] = useState(false);
  const [additionalDescription, setAdditionalDescription] = useState("");
  const [isSharing, setIsSharing] = useState(false);

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
    setPoNo(String(data.poNo || ""));
    setPlaceOfSupply(String(data.placeOfSupply || ""));
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

    setConvertedFromProforma(Boolean(data.convertedFromProforma));
    setSourceProformaNumber(String(data.sourceProformaNumber || ""));
    setIsDuplicateCopy(Boolean(data.isDuplicate));

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
        // Keep fallback
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
        // Fallback to text input
      }
    };

    void loadProducts();
  }, []);

  useEffect(() => {
    if (sourceInvoiceId) {
      const timeoutId = window.setTimeout(() => {
        setIsEditing(false);
        setEditingInvoiceId(null);
        setInvoiceNumber(() => `QTN-${Date.now().toString().slice(-6)}`);
      }, 0);

      const loadConvertedInvoice = async () => {
        try {
          const response = await fetch(`/api/invoices?id=${encodeURIComponent(sourceInvoiceId)}&documentType=quotation`);
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
      return () => window.clearTimeout(timeoutId);
    }

    if (!invoiceId) {
      const timeoutId = window.setTimeout(() => {
        setIsEditing(false);
        setEditingInvoiceId(null);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const loadInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices?id=${encodeURIComponent(invoiceId)}&documentType=quotation`);
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

  const handleGenerateInvoice = async () => {
    setIsSaving(true);

    try {
      const method = isEditing && editingInvoiceId ? "PUT" : "POST";
      const url =
        isEditing && editingInvoiceId
          ? `/api/invoices?id=${encodeURIComponent(editingInvoiceId)}&documentType=quotation`
          : "/api/invoices";

      const invoiceNumberToSend = invoiceNumber.trim() || `QTN-${Date.now().toString().slice(-6)}`;
      const invoiceDateToSend = invoiceDate || today;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          documentType: "quotation",
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
          poNo,
          placeOfSupply,
          taxType,
          paymentMode,
          notes,
          terms,
          bankDetails,
          authorizedSignature,
          additionalDescription,
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
      window.alert(error instanceof Error ? error.message : "Unable to save quotation.");
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

  const handleShareInvoice = async () => {
    setIsSharing(true);

    const shareText = `Quotation ${invoiceNumber || ""} for ${partyName || "customer"} — Grand Total ${formatCurrency(
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
      // ignore user cancellations
    } finally {
      setIsSharing(false);
    }
  };

  const openPreviewAsPdf = () => {
    const node = document.querySelector(".invoice-preview-shell");
    if (!node) {
      window.alert("Preview not available.");
      return;
    }

    const newWin = window.open("", "_blank", "noopener,noreferrer");
    if (!newWin) {
      window.alert("Unable to open preview; please allow popups.");
      return;
    }

    const head = document.head ? document.head.innerHTML : "";
    const html = `<!doctype html><html>${head}<body>${(node as HTMLElement).outerHTML}<script>window.onload = function(){setTimeout(function(){window.print();},200);};</script></body></html>`;
    newWin.document.open();
    newWin.document.write(html);
    newWin.document.close();
  };

  const hasAnyHsn = items.some((item) => item.hsn.trim() !== "");
  const hasAnyDiscount = items.some((item) => Number(item.discountPercent) > 0);

  const inputCls =
    "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 placeholder-gray-400";

  const selectCls =
    "w-full bg-white border border-gray-300 rounded px-2 py-1 text-[13px] text-gray-800 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer";

  const labelCls = "block text-[11px] font-medium text-gray-500 mb-1";

  return (
    <AdminShell
      title={isEditing ? "Edit Quotation" : "New Quotation"}
      description="Fill in the details below — switch to Preview to see the exact Quotation that will be saved and printed."
    >
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

      <div className="min-h-screen bg-[#e8eaf0] font-sans text-[13px]">
        <div className={`${showPreview ? "hidden" : ""} print:hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 bg-[#f4f5f8] px-4 py-2 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-gray-800">
                {isEditing ? "Edit Quotation" : "Quotation"}
              </span>
              {convertedFromProforma && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                  Converted from Proforma {sourceProformaNumber || "—"}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                {isSaving ? "Saving…" : isEditing ? "Update Quotation" : "Save Quotation"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPreview(true);
                  window.setTimeout(() => window.print(), 220);
                }}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreview(true);
                  setTimeout(() => openPreviewAsPdf(), 250);
                }}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open PDF
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-[1400px] p-3 space-y-2">
            <div className="rounded bg-white border border-gray-200 shadow-sm p-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
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
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Quotation Number</label>
                      <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Quotation Date</label>
                      <div className="relative">
                        <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={`${inputCls} pr-7`} />
                        <CalendarDays size={13} className="absolute right-2 top-1.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Valid Until</label>
                      <input type="date" value={dueDateValue} onChange={(e) => setDueDateValue(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Reference No</label>
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
                          <td className="border border-slate-300 px-1.5 py-1.5 align-middle">
                            <input
                              list={PRODUCT_DATALIST_ID}
                              value={item.description}
                              onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                              placeholder="Item description"
                              className="w-full bg-transparent text-[13px] text-gray-800 focus:outline-none placeholder-gray-300"
                            />
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
                                {UNITS.map((u) => <option key={u}>{u}</option>)}
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

            <div className="rounded bg-white border border-gray-200 shadow-sm p-3">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-2 lg:col-span-2">
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

        <div className={showPreview ? "block" : "hidden print:block"}>
          {showPreview && (
            <div className="mx-auto mb-3 flex max-w-[1000px] items-center justify-between px-1 print:hidden">
              <span className="text-sm font-semibold text-slate-700">Quotation Preview</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openPreviewAsPdf();
                  }}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Open PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back to Editing
                </button>
              </div>
            </div>
          )}

          <div className="invoice-preview-shell mx-auto w-full px-1 py-2 print:px-0">
            <div className="overflow-hidden rounded-2xl border-[1.5px] border-slate-300 bg-white text-slate-800 shadow-[0_8px_32px_rgba(15,23,42,0.07)] print:rounded-none print:shadow-none print:border-[1.2px]">
              <div className="relative flex items-center justify-center border-b border-slate-300 bg-[#f7f9fc] px-6 py-3">
                <h2 className="text-base font-semibold text-slate-900">Quotation </h2>
              </div>

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

              <div className="grid grid-cols-1 border-b border-slate-300 sm:grid-cols-2">
                <div className="border-b border-slate-300 bg-slate-50 p-4 sm:border-b-0 sm:border-r">
                  <div className="rounded-lg border border-slate-300 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quotation To:</p>
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
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quotation Details:</p>
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-[13px] text-slate-800">
                      <span className="whitespace-nowrap font-semibold text-slate-900">Quotation No:</span>
                      <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="inv-field w-full" />
                      <span className="font-semibold text-slate-900">Date:</span>
                      <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="inv-field w-full" />
                      <span className="whitespace-nowrap font-semibold text-slate-900">Valid Until:</span>
                      <input type="date" value={dueDateValue} onChange={(e) => setDueDateValue(e.target.value)} className="inv-field w-full" />
                      <span className={`whitespace-nowrap font-semibold text-slate-900 ${poDate ? "" : "print:hidden"}`}>PO Date:</span>
                      <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} className={`inv-field w-full ${poDate ? "" : "print:hidden"}`} />
                      <span className={`whitespace-nowrap font-semibold text-slate-900 ${poNo ? "" : "print:hidden"}`}>PO No:</span>
                      <input value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="—" className={`inv-field w-full ${poNo ? "" : "print:hidden"}`} />
                      <span className={`whitespace-nowrap font-semibold text-slate-900 ${placeOfSupply ? "" : "print:hidden"}`}>Reference No:</span>
                      <input value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} placeholder="—" className={`inv-field w-full ${placeOfSupply ? "" : "print:hidden"}`} />
                    </div>
                  </div>
                </div>
              </div>

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
                      <span className="font-semibold text-slate-900">Quotation Amount in Words: </span>
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
              .invoice-preview-shell .invoice-card,
              .invoice-preview-shell .invoice-table-wrap {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
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