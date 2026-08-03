"use client";
export const dynamic = "force-dynamic";

import AdminShell from "@/components/admin/AdminShell";
import DeliveryChallen from "@/components/admin/DeliveryChallen";
import ProductCreateModal from "@/components/admin/ProductCreateModal";
import { getDuplicateCopyInvoiceNumber, getDuplicateCopyPageLabels, getInvoiceDuplicateFlag } from "@/lib/invoiceRoute";
import { CalendarDays, ChevronDown, Plus, Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

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
}

interface ChallanItem {
  id: number;
  itemName: string;
  hsn: string;
  qty: number;
  unit: string;
}

const fallbackCustomer: Customer = {
  id: "",
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

const today = new Date().toISOString().slice(0, 10);
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

export function DeliveryChallanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");
  const sourceInvoiceId = searchParams.get("sourceInvoiceId");
  const previewOnly = searchParams.get("previewOnly") === "1";
  const previewOnlyMode = Boolean(sourceInvoiceId || previewOnly);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [isDuplicateCopy, setIsDuplicateCopy] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([fallbackCustomer]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(fallbackCustomer.id);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState(emptyNewCustomerForm);
  const [newCustomerError, setNewCustomerError] = useState("");
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [activeItemIdForNewProduct, setActiveItemIdForNewProduct] = useState<number | null>(null);

  const [partyName, setPartyName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [challanDate, setChallanDate] = useState(today);
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [transportName, setTransportName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [terms, setTerms] = useState("");
  const [receivedByName, setReceivedByName] = useState("");
  const [receivedByComment, setReceivedByComment] = useState("");
  const [receivedByDate, setReceivedByDate] = useState("");
  const [receivedBySignature, setReceivedBySignature] = useState("");
  const [deliveredByName, setDeliveredByName] = useState("");
  const [deliveredByComment, setDeliveredByComment] = useState("");
  const [deliveredByDate, setDeliveredByDate] = useState(today);
  const [deliveredBySignature, setDeliveredBySignature] = useState("");
  const [authorizedSignature, setAuthorizedSignature] = useState("");
  const [items, setItems] = useState<ChallanItem[]>([
    { id: 1, itemName: "", hsn: "", qty: 10, unit: "" },
  ]);

  useEffect(() => {
    void fetch("/api/customers")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        const normalized = list
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
        if (normalized.length > 0) setCustomers(normalized);
      })
      .catch(() => undefined);

    void fetch("/api/products")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        setProductOptions(
          list
            .map((product: Record<string, unknown>) => ({
              id: String(product.id ?? ""),
              name: String(product.name ?? product.title ?? ""),
              hsn: String(product.hsn ?? product.hsnCode ?? product.hsnSac ?? ""),
              unit: String(product.unit ?? product.uom ?? "PCS"),
            }))
            .filter((product: ProductOption) => product.name),
        );
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const activeInvoiceId = sourceInvoiceId || invoiceId;
    const documentType = sourceInvoiceId ? "invoice" : "delivery-challan";

    if (!activeInvoiceId) {
      setIsEditing(false);
      setEditingInvoiceId(null);
      return;
    }

    const loadInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices?id=${encodeURIComponent(activeInvoiceId)}&documentType=${documentType}`);
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!data) {
          return;
        }

        if (sourceInvoiceId) {
          setShowPreview(true);
          setIsEditing(false);
          setEditingInvoiceId(null);
          setIsDuplicateCopy(false);
        } else {
          setIsEditing(true);
          setEditingInvoiceId(invoiceId);
          setIsDuplicateCopy(Boolean(data.isDuplicate || getInvoiceDuplicateFlag(data as { invoiceNumber?: string | null; isDuplicate?: boolean | null })));
        }

        setChallanNo(String(data.invoiceNumber || ""));
        setChallanDate(String(data.invoiceDate || today).slice(0, 10));
        setPartyName(String(data.partyName || ""));
        setAddress(String(data.address || ""));
        setCity(String(data.city || ""));
        setState(String(data.state || ""));
        setPincode(String(data.pincode || ""));
        setPhone(String(data.phone || ""));
        setEmail(String(data.email || ""));
        setGstin(String(data.gstin || ""));
        setPlaceOfSupply(String(data.placeOfSupply || ""));
        setShipToAddress(String(data.shipToAddress || ""));
        setTransportName(String(data.transportName || ""));
        setVehicleNumber(String(data.vehicleNumber || ""));
        setTerms(String(data.terms || ""));
        setReceivedByName(String(data.receivedByName || ""));
        setReceivedByComment(String(data.receivedByComment || ""));
        setReceivedByDate(String(data.receivedByDate || "").slice(0, 10));
        setReceivedBySignature(String(data.receivedBySignature || ""));
        setDeliveredByName(String(data.deliveredByName || ""));
        setDeliveredByComment(String(data.deliveredByComment || ""));
        setDeliveredByDate(String(data.deliveredByDate || "").slice(0, 10) || today);
        setDeliveredBySignature(String(data.deliveredBySignature || ""));
        setAuthorizedSignature(String(data.authorizedSignature || ""));

        const loadedItems = Array.isArray(data.items)
          ? data.items.map((item: Record<string, unknown>, index: number) => ({
              id: index + 1,
              itemName: String(item.description || ""),
              hsn: String(item.hsn || ""),
              qty: Number(item.qty || 1),
              unit: String(item.unit || ""),
            }))
          : [];

        setItems(loadedItems.length > 0 ? loadedItems : [{ id: 1, itemName: "", hsn: "", qty: 1, unit: "PCS" }]);

        const matchingCustomer = customers.find((entry) => entry.name.toLowerCase() === String(data.partyName || "").trim().toLowerCase());
        setSelectedCustomerId(matchingCustomer?.id ?? "");
      } catch {
        // ignore missing or invalid records
      }
    };

    void loadInvoice();
  }, [customers, invoiceId, sourceInvoiceId]);

  const handleCustomerSelect = (id: string) => {
    if (id === ADD_NEW_CUSTOMER_OPTION) {
      setNewCustomerForm(emptyNewCustomerForm);
      setNewCustomerError("");
      setShowAddCustomerModal(true);
      return;
    }

    setSelectedCustomerId(id);
    const customer = customers.find((entry) => entry.id === id);
    if (!customer) return;
    setPartyName(customer.name);
    setAddress(customer.address);
    setCity(customer.city);
    setState(customer.state);
    setPincode(customer.pincode);
    setPhone(customer.phone);
    setEmail(customer.email);
    setGstin(customer.gstin);
    setShipToAddress(customer.address);
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
      setAddress(createdCustomer.address || "");
      setCity(createdCustomer.city || "");
      setState(createdCustomer.state || "");
      setPincode(createdCustomer.pincode || "");
      setPhone(createdCustomer.phone || "");
      setEmail(createdCustomer.email || "");
      setGstin(createdCustomer.gstin || "");
      setShipToAddress(createdCustomer.address || "");
      setShowAddCustomerModal(false);
      setNewCustomerForm(emptyNewCustomerForm);
    } catch (submitError) {
      setNewCustomerError(submitError instanceof Error ? submitError.message : "Unable to add customer.");
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
      },
    ]);

    if (activeItemIdForNewProduct !== null) {
      setItems((current) =>
        current.map((item) =>
          item.id !== activeItemIdForNewProduct
            ? item
            : {
                ...item,
                itemName: name,
                hsn: hsn || item.hsn,
                unit: unit || item.unit,
              },
        ),
      );
    }

    setActiveItemIdForNewProduct(null);
    setShowAddProductModal(false);
  };

  const handleItemNameChange = (id: number, value: string) => {
    const product = productOptions.find((entry) => entry.name.toLowerCase() === value.trim().toLowerCase());
    setItems((current) => current.map((item) => item.id === id
      ? { ...item, itemName: value, hsn: product?.hsn ?? item.hsn, unit: product?.unit ?? item.unit }
      : item));
  };

  const totals = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);

  const updateItem = (id: number, field: keyof ChallanItem, value: string | number) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    setItems((current) => [...current, { id: Date.now(), itemName: "", hsn: "", qty: 1, unit: "PCS" }]);
  };

  const removeItem = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const method = isEditing && editingInvoiceId ? "PUT" : "POST";
      const url = isEditing && editingInvoiceId
        ? `/api/invoices?id=${encodeURIComponent(editingInvoiceId)}&documentType=delivery-challan`
        : "/api/invoices";

      const invoiceNumberToSend = challanNo.trim() ? getDuplicateCopyInvoiceNumber(challanNo.trim(), isDuplicateCopy) : "";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "delivery-challan",
          billType: "Delivery Challan",
          invoiceNumber: invoiceNumberToSend,
          invoiceDate: challanDate,
          partyName,
          address,
          city,
          state,
          pincode,
          phone,
          email,
          gstin,
          placeOfSupply,
          shipToAddress,
          transportName,
          vehicleNumber,
          receivedByName,
          receivedByComment,
          receivedByDate,
          receivedBySignature,
          deliveredByName,
          deliveredByComment,
          deliveredByDate,
          deliveredBySignature,
          terms,
          authorizedSignature,
          isDuplicate: isDuplicateCopy,
          items: items.map((item) => ({ description: item.itemName, hsn: item.hsn, qty: item.qty, unit: item.unit })),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(typeof body?.error === "string" ? body.error : "Unable to save delivery challan.");
      }
      router.push("/admin/generate-bill");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to save delivery challan.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = "w-full rounded border border-gray-300 bg-white px-2 py-1 text-[13px] text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300";
  const labelCls = "mb-1 block text-[11px] font-medium text-gray-500";

  return (
    <AdminShell
      title="Delivery Challan"
      description="Fill in the details below, then switch to Preview to review the delivery challan before saving."
    >
      <datalist id="delivery-challan-product-options">
        {productOptions.map((product) => <option key={product.id} value={product.name} />)}
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
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Customer Name</label>
                <input value={newCustomerForm.name} onChange={(event) => setNewCustomerForm((current) => ({ ...current, name: event.target.value }))} className={inputCls} required />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Contact Person</label>
                <input value={newCustomerForm.contactPerson} onChange={(event) => setNewCustomerForm((current) => ({ ...current, contactPerson: event.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Phone</label>
                <input value={newCustomerForm.phone} onChange={(event) => setNewCustomerForm((current) => ({ ...current, phone: event.target.value }))} className={inputCls} required />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Email</label>
                <input type="email" value={newCustomerForm.email} onChange={(event) => setNewCustomerForm((current) => ({ ...current, email: event.target.value }))} className={inputCls} required />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">GSTIN</label>
                <input value={newCustomerForm.gstin} onChange={(event) => setNewCustomerForm((current) => ({ ...current, gstin: event.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Address</label>
                <input value={newCustomerForm.address} onChange={(event) => setNewCustomerForm((current) => ({ ...current, address: event.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">City</label>
                <input value={newCustomerForm.city} onChange={(event) => setNewCustomerForm((current) => ({ ...current, city: event.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">State</label>
                <input value={newCustomerForm.state} onChange={(event) => setNewCustomerForm((current) => ({ ...current, state: event.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Pincode</label>
                <input value={newCustomerForm.pincode} onChange={(event) => setNewCustomerForm((current) => ({ ...current, pincode: event.target.value }))} className={inputCls} />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddCustomerModal(false)} className="inline-flex items-center justify-center rounded border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSavingCustomer} className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400">{isSavingCustomer ? "Saving..." : "Save Customer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ProductCreateModal open={showAddProductModal} initialName={newProductName} onClose={() => setShowAddProductModal(false)} onProductCreated={handleProductCreated} />
      <div className="min-h-screen bg-[#e8eaf0] font-sans text-[13px]">
        <div className={`${showPreview || previewOnlyMode ? "hidden" : ""} print:hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 bg-[#f4f5f8] px-4 py-2 shadow-sm">
            <span className="text-base font-semibold text-gray-800">Delivery Challan</span>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setShowPreview(true)} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
                Preview
              </button>
              <button type="button" onClick={() => void handleSave()} disabled={isSaving} className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400">
                <Save size={14} /> {isSaving ? "Saving..." : "Save Challan"}
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-[1400px] space-y-2 p-3">
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <div>
                  <label className={`${labelCls} text-blue-600`}>Customer</label>
                  <div className="relative">
                    <select value={selectedCustomerId} onChange={(event) => handleCustomerSelect(event.target.value)} className={`${inputCls} appearance-none pr-7`}>
                      <option value="">Select customer...</option>
                      <option value={ADD_NEW_CUSTOMER_OPTION}>+ Add New Customer</option>
                      {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1.5 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Delivery Challan for</label>
                  <input value={partyName} onChange={(e) => setPartyName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>City</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <input value={state} onChange={(e) => setState(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Pincode</label>
                    <input value={pincode} onChange={(e) => setPincode(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>GSTIN</label>
                    <input value={gstin} onChange={(e) => setGstin(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Challan No.</label>
                    <input value={challanNo} onChange={(e) => setChallanNo(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Date</label>
                    <div className="relative">
                      <input type="date" value={challanDate} onChange={(e) => setChallanDate(e.target.value)} className={inputCls} />
                      <CalendarDays size={14} className="pointer-events-none absolute right-2 top-2.5 text-slate-400" />
                    </div>
                  </div>
                      </div>
                      <div className="col-span-2">
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
                <div>
                  <label className={labelCls}>Place of Supply</label>
                  <input value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Ship To</label>
                  <textarea value={shipToAddress} onChange={(e) => setShipToAddress(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Transport Name</label>
                    <input value={transportName} onChange={(e) => setTransportName(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Vehicle No.</label>
                    <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className={labelCls}>Terms &amp; Conditions</label>
                  <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
                </div>
              </div>
          </div>

            <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#e8eaf0] text-left text-slate-700">
                    <th className="border border-slate-300 px-2 py-2 font-semibold">#</th>
                    <th className="border border-slate-300 px-2 py-2 font-semibold">Item Name</th>
                    <th className="border border-slate-300 px-2 py-2 font-semibold">HSN/SAC</th>
                    <th className="border border-slate-300 px-2 py-2 font-semibold">Quantity</th>
                    <th className="border border-slate-300 px-2 py-2 font-semibold">Unit</th>
                    <th className="border border-slate-300 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-slate-50/60">
                      <td className="border border-slate-300 px-2 py-1.5 text-slate-500">{index + 1}</td>
                      <td className="border border-slate-300 px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <input list="delivery-challan-product-options" value={item.itemName} onChange={(e) => handleItemNameChange(item.id, e.target.value)} placeholder="Item description" className="min-w-0 flex-1 bg-transparent outline-none" />
                          <button type="button" onClick={() => openAddProductModal(item.id, item.itemName)} className="pointer-events-none rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 opacity-0 transition-opacity duration-150 hover:bg-slate-50 group-hover:pointer-events-auto group-hover:opacity-100">
                            + New
                          </button>
                        </div>
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5"><input value={item.hsn} onChange={(e) => updateItem(item.id, "hsn", e.target.value)} className="w-full bg-transparent outline-none" /></td>
                      <td className="border border-slate-300 px-2 py-1.5"><input type="number" min="0" value={item.qty} onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))} className="w-full bg-transparent text-right outline-none" /></td>
                      <td className="border border-slate-300 px-2 py-1.5"><div className="relative"><select value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)} className="w-full appearance-none bg-transparent outline-none"><option value="">—</option><option value="PCS">PCS</option><option value="MTR">MTR</option><option value="KG">KG</option><option value="NOS">NOS</option></select><ChevronDown size={11} className="pointer-events-none absolute right-0 top-1 text-gray-400" /></div></td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center"><button type="button" onClick={() => removeItem(item.id)} className="text-[12px] font-semibold text-red-500 hover:text-red-700">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between bg-[#f4f5f8] px-3 py-2 text-[12px] text-slate-600">
                <button type="button" onClick={addItem} className="flex items-center gap-1.5 font-semibold text-sky-600 hover:text-sky-700">
                  <Plus size={14} /> Add Item
                </button>
                <span>Total Quantity: {totals}</span>
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-3">
              <div className="border border-gray-200 bg-white p-3 shadow-sm">
                <label className={labelCls}>Received By</label>
                <div className="space-y-2">
                  <input value={receivedByName} onChange={(e) => setReceivedByName(e.target.value)} placeholder="Name" className={inputCls} />
                  <input value={receivedByComment} onChange={(e) => setReceivedByComment(e.target.value)} placeholder="Comment" className={inputCls} />
                  <input type="date" value={receivedByDate} onChange={(e) => setReceivedByDate(e.target.value)} className={inputCls} />
                  <input value={receivedBySignature} onChange={(e) => setReceivedBySignature(e.target.value)} placeholder="Signature" className={inputCls} />
                </div>
              </div>
              <div className="border border-gray-200 bg-white p-3 shadow-sm">
                <label className={labelCls}>Delivered By</label>
                <div className="space-y-2">
                  <input value={deliveredByName} onChange={(e) => setDeliveredByName(e.target.value)} placeholder="Name" className={inputCls} />
                  <input value={deliveredByComment} onChange={(e) => setDeliveredByComment(e.target.value)} placeholder="Comment" className={inputCls} />
                  <input type="date" value={deliveredByDate} onChange={(e) => setDeliveredByDate(e.target.value)} className={inputCls} />
                  <input value={deliveredBySignature} onChange={(e) => setDeliveredBySignature(e.target.value)} placeholder="Signature" className={inputCls} />
                </div>
              </div>
              <div className="border border-gray-200 bg-white p-3 shadow-sm">
                <label className={labelCls}>Authorized Signature</label>
                <input value={authorizedSignature} onChange={(e) => setAuthorizedSignature(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        </div>
        <div className={`${showPreview || previewOnlyMode ? "block" : "hidden"} print:block`}>
          <div className="mx-auto max-w-[1400px] p-3">
          {previewOnlyMode && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Preview only: delivery challan content is loaded from the source invoice.
            </div>
          )}
          <DeliveryChallen
            partyName={partyName}
            phone={phone}
            email={email}
            gstin={gstin}
            address={address}
            city={city}
            state={state}
            pincode={pincode}
            quotationNumber={challanNo}
            quotationDate={challanDate}
            challanNo={challanNo}
            placeOfSupply={placeOfSupply}
            shipToAddress={shipToAddress}
            shipToCity={city}
            shipToState={state}
            shipToPincode={pincode}
            transportName={transportName}
            vehicleNumber={vehicleNumber}
            receivedByName={receivedByName}
            receivedByComment={receivedByComment}
            receivedByDate={receivedByDate}
            receivedBySignature={receivedBySignature}
            deliveredByName={deliveredByName}
            deliveredByComment={deliveredByComment}
            deliveredByDate={deliveredByDate}
            deliveredBySignature={deliveredBySignature}
            terms={terms}
            authorizedSignature={authorizedSignature}
            items={items.map((item) => ({ description: item.itemName, hsn: item.hsn, qty: item.qty, unit: item.unit }))}
            pageLabels={getDuplicateCopyPageLabels(isDuplicateCopy)}
            isDuplicateCopy={isDuplicateCopy}
          />
          <div className="hidden">
          <div className="border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Delivery Challan</h3>
                <p className="text-sm text-slate-500">Prepared for {partyName || "Customer"}</p>
              </div>
              <div className="text-right text-sm text-slate-600">
                <div><span className="font-semibold">Challan No.:</span> {challanNo || "—"}</div>
                <div><span className="font-semibold">Date:</span> {challanDate || today}</div>
                <div><span className="font-semibold">Place of Supply:</span> {placeOfSupply || "—"}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded border border-slate-200 p-3">
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Delivery Challan for</h4>
                <p className="font-semibold text-slate-900">{partyName || "Customer"}</p>
                <p className="mt-1 text-sm text-slate-600">{address}</p>
                <p className="text-sm text-slate-600">{city}, {state} - {pincode}</p>
                <p className="text-sm text-slate-600">{phone}</p>
                <p className="text-sm text-slate-600">{email}</p>
              </div>
              <div className="rounded border border-slate-200 p-3">
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Ship To / Transport</h4>
                <p className="text-sm text-slate-700">{shipToAddress || "—"}</p>
                <p className="mt-2 text-sm text-slate-700">Transport Name: {transportName || "—"}</p>
                <p className="text-sm text-slate-700">Vehicle: {vehicleNumber || "—"}</p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-700">
                    <th className="border border-slate-200 px-2 py-2">#</th>
                    <th className="border border-slate-200 px-2 py-2">Item Name</th>
                    <th className="border border-slate-200 px-2 py-2">HSN</th>
                    <th className="border border-slate-200 px-2 py-2">Quantity</th>
                    <th className="border border-slate-200 px-2 py-2">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border border-slate-200 px-2 py-2 text-slate-500">{index + 1}</td>
                      <td className="border border-slate-200 px-2 py-2">{item.itemName || "—"}</td>
                      <td className="border border-slate-200 px-2 py-2">{item.hsn || "—"}</td>
                      <td className="border border-slate-200 px-2 py-2">{item.qty}</td>
                      <td className="border border-slate-200 px-2 py-2">{item.unit || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded border border-slate-200 p-3">
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Terms &amp; Conditions</h4>
                <p className="text-sm text-slate-700">{terms}</p>
              </div>
              <div className="rounded border border-slate-200 p-3">
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Authorized Signature</h4>
                <p className="text-sm font-semibold text-slate-900">{authorizedSignature || "—"}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded border border-slate-200 p-3">
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Received By</h4>
                <p className="text-sm text-slate-700">Name: {receivedByName || "—"}</p>
                <p className="text-sm text-slate-700">Comment: {receivedByComment || "—"}</p>
                <p className="text-sm text-slate-700">Date: {receivedByDate || "—"}</p>
                <p className="text-sm text-slate-700">Signature: {receivedBySignature || "—"}</p>
              </div>
              <div className="rounded border border-slate-200 p-3">
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Delivered By</h4>
                <p className="text-sm text-slate-700">Name: {deliveredByName || "—"}</p>
                <p className="text-sm text-slate-700">Comment: {deliveredByComment || "—"}</p>
                <p className="text-sm text-slate-700">Date: {deliveredByDate || "—"}</p>
                <p className="text-sm text-slate-700">Signature: {deliveredBySignature || "—"}</p>
              </div>
            </div>
          </div>
          </div>
          </div>
        </div>
      </div>
      </div>
    </AdminShell>
  );
}

export default function DeliveryChallanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#e8eaf0] p-4 text-sm text-slate-600">Loading delivery challan…</div>}>
      <DeliveryChallanPageContent />
    </Suspense>
  );
}
