// "use client";

// import AdminShell from "@/components/admin/AdminShell";
// import { getDuplicateCopyInvoiceNumber } from "@/lib/invoiceRoute";
// import { Calendar, Info, Plus, RefreshCw, Trash2 } from 'lucide-react';
// import { useSearchParams } from 'next/navigation';
// import { Suspense, useEffect, useState } from 'react';
// import EWayBillPreview from "./EWayBillPreview";

// interface ItemRow {
//   id: number;
//   name: string;
//   description: string;
//   hsn: string;
//   quantity: string;
//   unit: string;
//   taxableValue: string;
//   cgstSgst: string;
//   igst: string;
//   cessAdvit: string;
//   cessNonAdvit: string;
// }

// const initialItem: ItemRow = {
//   id: 1,
//   name: '',
//   description: '',
//   hsn: '',
//   quantity: '',
//   unit: '',
//   taxableValue: '',
//   cgstSgst: '-Select',
//   igst: '-Select',
//   cessAdvit: '-Select',
//   cessNonAdvit: '0',
// };

// // --- E-Way Bill (NIC) payload mapping helpers ---
// // GST state codes, keyed by the uppercase state names used in this form's
// // `states` dropdown. Used to translate the human-readable state into the
// // numeric fromStateCode/toStateCode the EWB API requires.
// const STATE_CODE_BY_NAME: Record<string, number> = {
//   'JAMMU AND KASHMIR': 1,
//   'HIMACHAL PRADESH': 2,
//   'PUNJAB': 3,
//   'CHANDIGARH': 4,
//   'UTTARAKHAND': 5,
//   'HARYANA': 6,
//   'DELHI': 7,
//   'RAJASTHAN': 8,
//   'UTTAR PRADESH': 9,
//   'BIHAR': 10,
//   'SIKKIM': 11,
//   'ARUNACHAL PRADESH': 12,
//   'NAGALAND': 13,
//   'MANIPUR': 14,
//   'MIZORAM': 15,
//   'TRIPURA': 16,
//   'MEGHALAYA': 17,
//   'ASSAM': 18,
//   'WEST BENGAL': 19,
//   'JHARKHAND': 20,
//   'ODISHA': 21,
//   'CHHATTISGARH': 22,
//   'MADHYA PRADESH': 23,
//   'GUJARAT': 24,
//   'MAHARASHTRA': 27,
//   'KARNATAKA': 29,
//   'GOA': 30,
//   'KERALA': 32,
//   'TAMIL NADU': 33,
//   'PUDUCHERRY': 34,
//   'ANDAMAN AND NICOBAR ISLANDS': 35,
//   'TELANGANA': 36,
//   'ANDHRA PRADESH': 37,
//   'LADAKH': 38,
// };

// // Maps this form's free-text sub-type radio values to the numeric
// // subSupplyType codes defined in the EWB-API technical document.
// const SUB_SUPPLY_TYPE_CODE: Record<string, string> = {
//   supply: '1',
//   export: '3',
//   'job view': '4', // "Job Work" in this form
//   'skd/ckd/cxd': '9',
//   'reciyent not known': '11', // "Recipient Not Known"
//   'for own use': '5',
//   'exhibition or fairs': '12',
//   'line sales': '10',
//   others: '8',
// };

// // Maps this form's Document Type dropdown to the docType codes the EWB
// // API accepts. Credit/Debit Note have no dedicated EWB doc-type code, so
// // they fall back to "OTH" (Others) per common practice.
// const DOC_TYPE_CODE: Record<string, string> = {
//   'Delivery Challan': 'CHL',
//   'Tax Invoice': 'INV',
//   'Bill of Supply': 'BIL',
//   'Credit Note': 'OTH',
//   'Debit Note': 'OTH',
// };

// const TRANSACTION_TYPE_CODE: Record<string, number> = {
//   'Regular': 1,
//   'Bill To - Ship To': 2,
//   'Bill From - Dispatch From': 3,
//   'Combination of 2 and 3': 4,
// };

// // "All" / the garbled "Ship or Ship Chin Roed/Rail" option in this form's
// // Mode radio group don't map cleanly to the 4 official EWB transport modes
// // (1=Road, 2=Rail, 3=Air, 4=Ship) — adjust this mapping if your real radio
// // labels differ from the placeholder text below.
// const TRANS_MODE_CODE: Record<string, string> = {
//   road: '1',
//   rail: '2',
//   all: '3',
//   'ship or ship chin roed/rail': '4',
// };

// function stateCode(stateName: string): number {
//   return STATE_CODE_BY_NAME[stateName?.toUpperCase()] ?? 0;
// }

// function gstRateOf(value: string): number {
//   if (!value || value === '-Select') return 0;
//   const n = parseFloat(value);
//   return Number.isFinite(n) ? n : 0;
// }

// function formatDateForDisplay(value?: string | Date | null): string {
//   const source = value ? new Date(value) : new Date();
//   if (Number.isNaN(source.getTime())) {
//     return '';
//   }

//   const day = String(source.getDate()).padStart(2, '0');
//   const month = String(source.getMonth() + 1).padStart(2, '0');
//   const year = String(source.getFullYear());
//   return `${day}/${month}/${year}`;
// }

// function EWayBillFormContent() {
//   const [supplyType, setSupplyType] = useState<'outward' | 'inward'>('outward');
//   const [subType, setSubType] = useState('supply');
//   const searchParams = useSearchParams();
//   const [documentType, setDocumentType] = useState(
//     searchParams.get('documentType') || 'Delivery Challan',
//   );
//   const [documentNo, setDocumentNo] = useState('');
//   const [documentDate, setDocumentDate] = useState(formatDateForDisplay());
//   const [transactionType, setTransactionType] = useState('Regular');

//   const [billFromName, setBillFromName] = useState('Radiatech Electra');
//   const [billFromGstin, setBillFromGstin] = useState('29AAGCB1286Q000');
//   const [billFromState, setBillFromState] = useState('KARNATAKA');

//   const [dispatchAddress1, setDispatchAddress1] = useState('A 287, Basement, Sector-69');
//   const [dispatchAddress2, setDispatchAddress2] = useState('Transport Nagar');
//   const [dispatchPlace, setDispatchPlace] = useState('KARNATAKA');
//   const [dispatchPincode, setDispatchPincode] = useState('560064');
//   const [dispatchState, setDispatchState] = useState('KARNATAKA');

//   const [billToName, setBillToName] = useState('');
//   const [billToGstin, setBillToGstin] = useState('');
//   const [billToState, setBillToState] = useState('');

//   const [shipAddress1, setShipAddress1] = useState('');
//   const [shipAddress2, setShipAddress2] = useState('');
//   const [shipPlace, setShipPlace] = useState('');
//   const [shipPincode, setShipPincode] = useState('');
//   const [shipState, setShipState] = useState('');
//   const [items, setItems] = useState<ItemRow[]>([{ ...initialItem }]);

//   const [transporterId, setTransporterId] = useState('');
//   const [transporterName, setTransporterName] = useState('');
//   const [approxDistance, setApproxDistance] = useState('');

//   const [mode, setMode] = useState('');
//   const [vehicleType, setVehicleType] = useState('regular');
//   const [vehicleNo, setVehicleNo] = useState('');
//   const [transporterDocDate, setTransporterDocDate] = useState(formatDateForDisplay());

//   const [otherAmount, setOtherAmount] = useState('0.00');
//   const [showPreview, setShowPreview] = useState(false);
//   const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);
//   const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

//   // Real e-way bill submission state
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);
//   const [submitResult, setSubmitResult] = useState<{
//     ewbNo?: string | number;
//     ewbDate?: string;
//     validUpto?: string;
//   } | null>(null);

//   // Fetch invoices on component mount
//   useEffect(() => {
//     const fetchInvoices = async () => {
//       setIsLoadingInvoices(true);
//       try {
//         const response = await fetch('/api/invoices');
//         if (response.ok) {
//           const data = await response.json();
//           setAvailableInvoices(Array.isArray(data) ? data : []);
//         }
//       } catch (error) {
//         console.error('Failed to fetch invoices:', error);
//       } finally {
//         setIsLoadingInvoices(false);
//       }
//     };
//     fetchInvoices();
//   }, []);

//   // Handle invoice selection to auto-populate form
//   const handleInvoiceSelect = (invoiceNumber: string) => {
//     if (!invoiceNumber) {
//       // Clear form if no invoice selected
//       setDocumentNo('');
//       setDocumentDate(formatDateForDisplay());
//       return;
//     }

//     const invoice = availableInvoices.find(inv => inv.invoiceNumber === invoiceNumber);
//     if (!invoice) return;

//     // Set document details
//     const billNumber = getDuplicateCopyInvoiceNumber(invoice.invoiceNumber, false);
//     setDocumentNo(billNumber || '');
//     setDocumentDate(invoice.invoiceDate ? formatDateForDisplay(invoice.invoiceDate) : formatDateForDisplay());
//     setDocumentType('Tax Invoice');

//     // Set Bill To (customer) details
//     setBillToName(invoice.partyName || '');
//     setBillToGstin(invoice.gstin || '');
//     setBillToState(invoice.state || '');

//     // Set Ship To address
//     setShipAddress1(invoice.address || '');
//     setShipPlace(invoice.city || '');
//     setShipPincode(invoice.pincode || '');
//     setShipState(invoice.state || '');

//     // Populate items from invoice
//     if (invoice.items && Array.isArray(invoice.items)) {
//       const mappedItems = invoice.items.map((item: any, idx: number) => ({
//         id: idx + 1,
//         name: item.description || '',
//         description: item.description || '',
//         hsn: item.hsn || '',
//         quantity: String(item.qty || ''),
//         unit: item.unit || 'Nos',
//         taxableValue: String(item.rate * item.qty || ''),
//         cgstSgst: item.taxType === 'cgst-sgst' ? '9' : '-Select',
//         igst: item.taxType === 'igst' ? '18' : '-Select',
//         cessAdvit: '-Select',
//         cessNonAdvit: '0',
//       }));
//       setItems(mappedItems.length > 0 ? mappedItems : [{ ...initialItem }]);
//     }

//     // Set transport details if available
//     setTransporterName(invoice.transportName || '');
//     setVehicleNo(invoice.vehicleNumber || '');
//   };

//   const addItem = () => {
//     setItems(prev => [...prev, { ...initialItem, id: Date.now() }]);
//   };

//   const removeItem = (id: number) => {
//     setItems(prev => prev.filter(item => item.id !== id));
//   };

//   const updateItem = (id: number, field: keyof ItemRow, value: string) => {
//     setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
//   };

//   // Calculate totals in real-time
//   const calculateTotals = () => {
//     let totalTaxable = 0;
//     let totalCgst = 0;
//     let totalSgst = 0;
//     let totalIgst = 0;
//     let totalCessAdvit = 0;
//     let totalCessNon = 0;

//     items.forEach(item => {
//       const taxableValue = parseFloat(item.taxableValue) || 0;
//       const cgstRate = item.cgstSgst === '-Select' ? 0 : parseFloat(item.cgstSgst) || 0;
//       const igstRate = item.igst === '-Select' ? 0 : parseFloat(item.igst) || 0;
//       const cessRate = item.cessAdvit === '-Select' ? 0 : parseFloat(item.cessAdvit) || 0;
//       const cessNonRate = parseFloat(item.cessNonAdvit) || 0;

//       totalTaxable += taxableValue;
//       totalCgst += (taxableValue * cgstRate) / 100;
//       totalSgst += (taxableValue * cgstRate) / 100;
//       totalIgst += (taxableValue * igstRate) / 100;
//       totalCessAdvit += (taxableValue * cessRate) / 100;
//       totalCessNon += cessNonRate;
//     });

//     const otherAmt = parseFloat(otherAmount) || 0;
//     const totalInvoice = totalTaxable + totalCgst + totalSgst + totalIgst + totalCessAdvit + totalCessNon + otherAmt;

//     return {
//       totalTaxable: totalTaxable.toFixed(2),
//       totalCgst: totalCgst.toFixed(2),
//       totalSgst: totalSgst.toFixed(2),
//       totalIgst: totalIgst.toFixed(2),
//       totalCessAdvit: totalCessAdvit.toFixed(2),
//       totalCessNon: totalCessNon.toFixed(2),
//       totalInvoice: totalInvoice.toFixed(2),
//     };
//   };

//   const totals = calculateTotals();

//   // Builds the request body in the exact shape the NIC EWB "GenerateEWayBill"
//   // API expects, from this form's current state.
//   const buildEwayBillPayload = () => {
//     const t = calculateTotals();
//     return {
//       supplyType: supplyType === 'outward' ? 'O' : 'I',
//       subSupplyType: SUB_SUPPLY_TYPE_CODE[subType] ?? '8',
//       subSupplyDesc: '',
//       docType: DOC_TYPE_CODE[documentType] ?? 'OTH',
//       docNo: documentNo,
//       docDate: documentDate,

//       fromGstin: billFromGstin,
//       fromTrdName: billFromName,
//       fromAddr1: dispatchAddress1,
//       fromAddr2: dispatchAddress2,
//       fromPlace: dispatchPlace,
//       fromPincode: parseInt(dispatchPincode, 10) || 0,
//       fromStateCode: stateCode(dispatchState || billFromState),
//       actFromStateCode: stateCode(dispatchState || billFromState),

//       toGstin: billToGstin,
//       toTrdName: billToName,
//       toAddr1: shipAddress1,
//       toAddr2: shipAddress2,
//       toPlace: shipPlace,
//       toPincode: parseInt(shipPincode, 10) || 0,
//       toStateCode: stateCode(shipState || billToState),
//       actToStateCode: stateCode(shipState || billToState),

//       transactionType: TRANSACTION_TYPE_CODE[transactionType] ?? 1,
//       otherValue: parseFloat(otherAmount) || 0,
//       totalValue: parseFloat(t.totalTaxable),
//       cgstValue: parseFloat(t.totalCgst),
//       sgstValue: parseFloat(t.totalSgst),
//       igstValue: parseFloat(t.totalIgst),
//       cessValue: parseFloat(t.totalCessAdvit),
//       totInvValue: parseFloat(t.totalInvoice),

//       transMode: TRANS_MODE_CODE[mode] ?? '1',
//       transDistance: approxDistance,
//       transporterName,
//       transporterId,
//       transDocNo: '',
//       transDocDate: transporterDocDate,
//       vehicleNo,
//       vehicleType: vehicleType === 'regular' ? 'R' : 'O',

//       itemList: items.map((item) => ({
//         productName: item.name,
//         productDesc: item.description,
//         hsnCode: item.hsn,
//         quantity: parseFloat(item.quantity) || 0,
//         qtyUnit: item.unit,
//         taxableAmount: parseFloat(item.taxableValue) || 0,
//         cgstRate: gstRateOf(item.cgstSgst),
//         sgstRate: gstRateOf(item.cgstSgst),
//         igstRate: gstRateOf(item.igst),
//         cessRate: gstRateOf(item.cessAdvit),
//         cessNonAdvol: parseFloat(item.cessNonAdvit) || 0,
//       })),
//     };
//   };

//   // Submits the built payload to our own backend route, which holds the
//   // GSTIN/GSP credentials and does the RSA/AES handshake with the real NIC
//   // e-way bill system. The browser never talks to NIC directly.
//   const handleSubmit = async () => {
//     setIsSubmitting(true);
//     setSubmitError(null);
//     setSubmitResult(null);
//     try {
//       const payload = buildEwayBillPayload();
//       const res = await fetch('/api/eway-bill/generate', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         throw new Error(data?.error || `Request failed with status ${res.status}`);
//       }
//       setSubmitResult({
//         ewbNo: data.ewayBillNo ?? data.ewbNo,
//         ewbDate: data.ewayBillDate ?? data.ewbDate,
//         validUpto: data.validUpto,
//       });
//     } catch (err: any) {
//       setSubmitError(err?.message || 'Failed to generate e-way bill.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const subTypes = ['Supply', 'Export', 'Job View', 'SKD/CKD/Cxd', 'Reciyent Not Known', 'For Own Use', 'Exhibition or Fairs', 'Line Sales', 'Others'];

//   const states = [
//     'UTTAR PRADESH','ANDHRA PRADESH', 'ASSAM', 'BIHAR', 'GUJARAT', 'HARYANA', 'KARNATAKA',
//     'KERALA', 'MADHYA PRADESH', 'MAHARASHTRA', 'RAJASTHAN', 'TAMIL NADU',
//     'TELANGANA',  'WEST BENGAL',
//   ];

//   const gstRates = ['-Select', '0', '0.1', '0.25', '1', '1.5', '3', '5', '6', '7.5', '9', '12', '14', '18', '28'];

//   return (
//     <AdminShell
//       title="E-Way Bill Entry"
//       description="Create a new e-way bill. Fill in all the required fields marked with * to proceed."
//     >
//       <div className="p-3 space-y-3">

//         {/* Transaction Details */}
//         <section className="bg-white border border-gray-300 rounded shadow-sm">
//           <SectionHeader title="Transaction Details" />
//           <div className="p-3 space-y-3">
//             <div className="flex flex-wrap gap-6 items-center">
//               <div className="flex items-center gap-2">
//                 <span className="font-semibold text-gray-700">Supply Type <Req /></span>
//                 <label className="flex items-center gap-1 cursor-pointer">
//                   <input type="radio" name="supplyType" value="outward" checked={supplyType === 'outward'} onChange={() => setSupplyType('outward')} className="accent-blue-600" />
//                   <span>Outward</span>
//                 </label>
//                 <label className="flex items-center gap-1 cursor-pointer">
//                   <input type="radio" name="supplyType" value="inward" checked={supplyType === 'inward'} onChange={() => setSupplyType('inward')} className="accent-blue-600" />
//                   <span>Inward</span>
//                 </label>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className="font-semibold text-gray-700">Sub Type <InfoIcon /></span>
//                 <div className="flex flex-wrap gap-2">
//                   {subTypes.map(st => (
//                     <label key={st} className="flex items-center gap-1 cursor-pointer">
//                       <input type="radio" name="subType" value={st.toLowerCase()} checked={subType === st.toLowerCase()} onChange={() => setSubType(st.toLowerCase())} className="accent-blue-600" />
//                       <span>{st}</span>
//                     </label>
//                   ))}
//                 </div>
//               </div>
//             </div>
//             <div className="flex flex-wrap gap-6 items-center">
//               <FieldGroup label="Document Type" required>
//                 <select value={documentType} onChange={e => setDocumentType(e.target.value)} className={inputCls}>
//                   <option>Delivery Challan</option>
//                   <option>Tax Invoice</option>
//                   <option>Bill of Supply</option>
//                   <option>Credit Note</option>
//                   <option>Debit Note</option>
//                 </select>
//               </FieldGroup>
//               <FieldGroup label="Document No">
//                 <div className="flex items-center gap-1">
//                   <select value={documentNo} onChange={e => handleInvoiceSelect(e.target.value)} className={`${inputCls} flex-1`}>
//                     <option value="">-- Select Invoice --</option>
//                     {isLoadingInvoices ? (
//                       <option disabled>Loading invoices...</option>
//                     ) : (
//                       availableInvoices.map(inv => {
//                         const billNumber = getDuplicateCopyInvoiceNumber(inv.invoiceNumber, false);
//                         return (
//                           <option key={inv.id} value={inv.invoiceNumber}>
//                             {billNumber || 'No bill number'}
//                           </option>
//                         );
//                       })
//                     )}
//                   </select>
//                   <InfoIcon />
//                 </div>
//               </FieldGroup>
//               <FieldGroup label="Document Date" required>
//                 <div className="flex items-center gap-1">
//                   <input
//                     value={documentDate}
//                     onChange={e => setDocumentDate(e.target.value)}
//                     className={`${inputCls} w-28`}
//                     placeholder="DD/MM/YYYY"
//                     maxLength={10}
//                   />
//                   <Calendar size={14} className="text-gray-500 cursor-pointer" />
//                 </div>
//               </FieldGroup>
//               <FieldGroup label="Transaction Type" required>
//                 <div className="flex items-center gap-1">
//                   <select value={transactionType} onChange={e => setTransactionType(e.target.value)} className={inputCls}>
//                     <option>Regular</option>
//                     <option>Bill To - Ship To</option>
//                     <option>Bill From - Dispatch From</option>
//                     <option>Combination of 2 and 3</option>
//                   </select>
//                   <InfoIcon />
//                 </div>
//               </FieldGroup>
//             </div>
//           </div>
//         </section>

//         {/* Bill From / Dispatch From */}
//         <div className="grid grid-cols-2 gap-3">
//           <section className="bg-white border border-gray-300 rounded shadow-sm">
//             <SectionHeader title="Bill From" />
//             <div className="p-3 space-y-2">
//               <FieldRow label="Name">
//                 <div className="flex items-center gap-1">
//                   <input value={billFromName} onChange={e => setBillFromName(e.target.value)} className={`${inputCls} flex-1`} />
//                   <button className="border border-gray-400 rounded px-1 py-0.5 text-xs hover:bg-gray-100 transition-colors">
//                     <RefreshCw size={10} />
//                   </button>
//                 </div>
//               </FieldRow>
//               <FieldRow label={<>GSTIN <Req /></>}>
//                 <div className="flex items-center gap-1">
//                   <input value={billFromGstin} onChange={e => setBillFromGstin(e.target.value)} className={`${inputCls} flex-1 bg-blue-50`} placeholder="GSTIN" />
//                   <InfoIcon />
//                 </div>
//               </FieldRow>
//               <FieldRow label={<>State <Req /></>}>
//                 <select value={billFromState} onChange={e => setBillFromState(e.target.value)} className={`${inputCls} flex-1`}>
//                   {states.map(s => <option key={s}>{s}</option>)}
//                 </select>
//               </FieldRow>
//             </div>
//           </section>

//           <section className="bg-white border border-gray-300 rounded shadow-sm">
//             <SectionHeader title="Dispatch From" />
//             <div className="p-3 space-y-2">
//               <FieldRow label="Address">
//                 <div className="flex gap-1">
//                   <input value={dispatchAddress1} onChange={e => setDispatchAddress1(e.target.value)} className={`${inputCls} flex-1`} />
//                   <input value={dispatchAddress2} onChange={e => setDispatchAddress2(e.target.value)} className={`${inputCls} flex-1`} />
//                 </div>
//               </FieldRow>
//               <FieldRow label="Place">
//                 <input value={dispatchPlace} onChange={e => setDispatchPlace(e.target.value)} className={`${inputCls} w-40`} />
//               </FieldRow>
//               <FieldRow label={<>Pincode <Req /></>}>
//                 <div className="flex items-center gap-1">
//                   <input value={dispatchPincode} onChange={e => setDispatchPincode(e.target.value)} className={`${inputCls} w-24`} />
//                   <InfoIcon />
//                   <select value={dispatchState} onChange={e => setDispatchState(e.target.value)} className={`${inputCls} flex-1`}>
//                     {states.map(s => <option key={s}>{s}</option>)}
//                   </select>
//                   <InfoIcon />
//                 </div>
//               </FieldRow>
//             </div>
//           </section>
//         </div>

//         {/* Bill To / Ship To */}
//         <div className="grid grid-cols-2 gap-3">
//           <section className="bg-white border border-gray-300 rounded shadow-sm">
//             <SectionHeader title="Bill To" />
//             <div className="p-3 space-y-2">
//               <FieldRow label="Name">
//                 <div className="flex items-center gap-1">
//                   <input value={billToName} onChange={e => setBillToName(e.target.value)} className={`${inputCls} flex-1`} />
//                   <button className="border border-gray-400 rounded px-1 py-0.5 text-xs hover:bg-gray-100 transition-colors">
//                     <RefreshCw size={10} />
//                   </button>
//                 </div>
//               </FieldRow>
//               <FieldRow label={<>GSTIN <Req /></>}>
//                 <div className="flex items-center gap-1">
//                   <input value={billToGstin} onChange={e => setBillToGstin(e.target.value)} className={`${inputCls} flex-1 bg-blue-50`} placeholder="GSTIN" />
//                   <InfoIcon />
//                 </div>
//               </FieldRow>
//               <FieldRow label={<>State <Req /></>}>
//                 <select value={billToState} onChange={e => setBillToState(e.target.value)} className={`${inputCls} flex-1`}>
//                   {states.map(s => <option key={s}>{s}</option>)}
//                 </select>
//               </FieldRow>
//             </div>
//           </section>

//           <section className="bg-white border border-gray-300 rounded shadow-sm">
//             <SectionHeader title="Ship To" />
//             <div className="p-3 space-y-2">
//               <FieldRow label="Address">
//                 <div className="flex gap-1">
//                   <input value={shipAddress1} onChange={e => setShipAddress1(e.target.value)} className={`${inputCls} flex-1`} />
//                   <input value={shipAddress2} onChange={e => setShipAddress2(e.target.value)} className={`${inputCls} flex-1`} />
//                 </div>
//               </FieldRow>
//               <FieldRow label="Place">
//                 <input value={shipPlace} onChange={e => setShipPlace(e.target.value)} className={`${inputCls} w-40`} />
//               </FieldRow>
//               <FieldRow label={<>Pincode <Req /></>}>
//                 <div className="flex items-center gap-1">
//                   <input value={shipPincode} onChange={e => setShipPincode(e.target.value)} className={`${inputCls} w-24`} />
//                   <InfoIcon />
//                   <select value={shipState} onChange={e => setShipState(e.target.value)} className={`${inputCls} flex-1`}>
//                     {states.map(s => <option key={s}>{s}</option>)}
//                   </select>
//                   <InfoIcon />
//                 </div>
//               </FieldRow>
//             </div>
//           </section>
//         </div>

//         {/* Item Details */}
//         <section className="bg-white border border-gray-300 rounded shadow-sm">
//           <SectionHeader title="Item Details" />
//           <div className="p-3">
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse text-xs">
//                 <thead>
//                   <tr className="bg-gray-100 border border-gray-300">
//                     <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-36">Product Name</th>
//                     <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-36">Description</th>
//                     <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-24">HSN <Req /></th>
//                     <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-24">Quantity</th>
//                     <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-20">Unit <InfoIcon /></th>
//                     <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-28">Value/Taxable Value (Rs.) <Req /></th>
//                     <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-32">CGST / SGST Rate(%) <Req /></th>
//                     <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-28">IGST Rate(%) <Req /></th>
//                     <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-28">CESS Advit Rate(%) <Req /></th>
//                     <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-28">CESS non Advit Rate <Req /></th>
//                     <th className="border border-gray-300 px-2 py-1.5 text-center w-10">
//                       <button onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white rounded p-0.5 transition-colors">
//                         <Plus size={12} />
//                       </button>
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {items.map(item => (
//                     <tr key={item.id} className="border border-gray-300 hover:bg-gray-50 transition-colors">
//                       <td className="border border-gray-300 px-1 py-1">
//                         <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Name" className={tableCellInput} />
//                       </td>
//                       <td className="border border-gray-300 px-1 py-1">
//                         <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Description" className={tableCellInput} />
//                       </td>
//                       <td className="border border-gray-300 px-1 py-1">
//                         <input value={item.hsn} onChange={e => updateItem(item.id, 'hsn', e.target.value)} className={tableCellInput} />
//                       </td>
//                       <td className="border border-gray-300 px-1 py-1">
//                         <input value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} placeholder="Quantity" className={`${tableCellInput} text-right`} />
//                       </td>
//                       <td className="border border-gray-300 px-1 py-1">
//                         <input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} placeholder="Unit" className={tableCellInput} />
//                       </td>
//                       <td className="border border-gray-300 px-1 py-1">
//                         <input value={item.taxableValue} onChange={e => updateItem(item.id, 'taxableValue', e.target.value)} className={`${tableCellInput} text-right`} />
//                       </td>
//                       <td className="border border-gray-300 px-1 py-1">
//                         <select value={item.cgstSgst} onChange={e => updateItem(item.id, 'cgstSgst', e.target.value)} className={tableCellInput}>
//                           {gstRates.map(r => <option key={r}>{r}</option>)}
//                         </select>
//                       </td>
//                       <td className="border border-gray-300 px-1 py-1">
//                         <select value={item.igst} onChange={e => updateItem(item.id, 'igst', e.target.value)} className={tableCellInput}>
//                           {gstRates.map(r => <option key={r}>{r}</option>)}
//                         </select>
//                       </td>
//                       <td className="border border-gray-300 px-1 py-1">
//                         <select value={item.cessAdvit} onChange={e => updateItem(item.id, 'cessAdvit', e.target.value)} className={tableCellInput}>
//                           {gstRates.map(r => <option key={r}>{r}</option>)}
//                         </select>
//                       </td>
//                       <td className="border border-gray-300 px-1 py-1">
//                         <select value={item.cessNonAdvit} onChange={e => updateItem(item.id, 'cessNonAdvit', e.target.value)} className={tableCellInput}>
//                           {['0', '1', '2', '3', '4', '5'].map(r => <option key={r}>{r}</option>)}
//                         </select>
//                       </td>
//                       <td className="border border-gray-300 px-1 py-1 text-center">
//                         <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 transition-colors">
//                           <Trash2 size={12} />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Totals Row */}
//             <div className="mt-3 grid grid-cols-8 gap-2 border border-gray-300 rounded p-3 bg-gradient-to-r from-green-50 to-blue-50">
//               <TotalField label={<>Total Tax Sle Amount <Req /></>} value={totals.totalTaxable} />
//               <TotalField label={<>CGST Amount <Req /></>} value={totals.totalCgst} />
//               <TotalField label={<>SGST Amount <Req /></>} value={totals.totalSgst} />
//               <TotalField label={<>IGST Amount <Req /></>} value={totals.totalIgst} />
//               <TotalField label={<>CESS Advel Amount <Req /></>} value={totals.totalCessAdvit} />
//               <TotalField label={<>CESS Non Adval Amount <InfoIcon /></>} value={totals.totalCessNon} />
//               <div className="flex flex-col gap-1">
//                 <label className="text-gray-600 font-medium leading-tight flex items-center gap-0.5">Other Amount(+-) <InfoIcon /></label>
//                 <input 
//                   value={otherAmount} 
//                   onChange={e => setOtherAmount(e.target.value)} 
//                   className={`border border-gray-300 rounded px-1.5 py-0.5 text-xs text-right bg-yellow-50 font-semibold w-full`}
//                   placeholder="0.00"
//                 />
//               </div>
//               <TotalField label={<>Total Inv. Amount <InfoIcon /></>} value={totals.totalInvoice} className="font-bold text-green-700" />
//             </div>
//           </div>
//         </section>

//         {/* Transportation Details */}
//         <section className="bg-white border border-gray-300 rounded shadow-sm">
//           <SectionHeader title="Transportation Details" />
//           <div className="p-3">
//             <div className="flex flex-wrap gap-6 items-center">
//               <FieldGroup label="Transporter ID">
//                 <div className="flex items-center gap-1">
//                   <input value={transporterId} onChange={e => setTransporterId(e.target.value)} className={`${inputCls} w-48`} />
//                   <InfoIcon />
//                 </div>
//               </FieldGroup>
//               <FieldGroup label="Transporter Name">
//                 <input value={transporterName} onChange={e => setTransporterName(e.target.value)} placeholder="Name" className={`${inputCls} w-40`} />
//               </FieldGroup>
//               <div className="flex-1" />
//               <FieldGroup label={<>Auto Aulculated PIN To PIN in KM <InfoIcon /></>}>
//                 <div className="text-blue-600 text-xs font-medium cursor-pointer hover:underline">A001</div>
//               </FieldGroup>
//               <FieldGroup label={<>Approximate Distance (in KM) <Req /></>}>
//                 <div className="flex items-center gap-1">
//                   <input value={approxDistance} onChange={e => setApproxDistance(e.target.value)} className={`${inputCls} w-24 text-right`} />
//                   <InfoIcon />
//                 </div>
//               </FieldGroup>
//             </div>
//           </div>
//         </section>

//         {/* PART-B */}
//         <section className="bg-white border border-gray-300 rounded shadow-sm">
//           <SectionHeader title="PART-B" />
//           <div className="p-3 space-y-3">
//             <div className="flex flex-wrap gap-6 items-center">
//               <div className="flex items-center gap-2">
//                 <span className="font-semibold text-gray-700">Mode</span>
//                 {['Road', 'Rail', 'All', 'Ship or Ship Chin Roed/Rail'].map(m => (
//                   <label key={m} className="flex items-center gap-1 cursor-pointer">
//                     <input type="radio" name="mode" value={m.toLowerCase()} checked={mode === m.toLowerCase()} onChange={() => setMode(m.toLowerCase())} className="accent-blue-600" />
//                     <span>{m}</span>
//                   </label>
//                 ))}
//               </div>
//               <div className="flex items-center gap-2 ml-8">
//                 <span className="font-semibold text-gray-700">Vehicle Type</span>
//                 {['Regular', 'Over Dimensional Cargo'].map(vt => (
//                   <label key={vt} className="flex items-center gap-1 cursor-pointer">
//                     <input type="radio" name="vehicleType" value={vt.toLowerCase()} checked={vehicleType === vt.toLowerCase()} onChange={() => setVehicleType(vt.toLowerCase())} className="accent-blue-600" />
//                     <span>{vt}</span>
//                   </label>
//                 ))}
//               </div>
//             </div>
//             <div className="flex flex-wrap gap-6 items-center">
//               <FieldGroup label="Vehicle No">
//                 <div className="flex items-center gap-1">
//                   <input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className={`${inputCls} w-36 bg-yellow-50`} />
//                   <InfoIcon />
//                 </div>
//               </FieldGroup>
//               <FieldGroup label="Transporter Doc. No. & Date">
//                 <div className="flex items-center gap-2">
//                   <input className={`${inputCls} w-48`} placeholder="Document No." />
//                   <input
//                     value={transporterDocDate}
//                     onChange={e => setTransporterDocDate(e.target.value)}
//                     className={`${inputCls} w-28`}
//                     placeholder="DD/MM/YYYY"
//                     maxLength={10}
//                   />
//                   <Calendar size={14} className="text-gray-500 cursor-pointer" />
//                 </div>
//               </FieldGroup>
//             </div>
//           </div>
//         </section>

//         {/* Action Buttons */}
//         <div className="flex justify-center gap-3 py-2">
//           <button onClick={() => setShowPreview(true)} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-8 py-2 rounded transition-colors shadow">
//             Preview
//           </button>
//           <button
//             onClick={handleSubmit}
//             disabled={isSubmitting}
//             className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-8 py-2 rounded transition-colors shadow"
//           >
//             {isSubmitting ? 'Generating…' : 'Submit'}
//           </button>
//           <button className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-8 py-2 rounded transition-colors shadow">
//             Exit
//           </button>
//         </div>

//         {submitResult && (
//           <div className="mx-auto max-w-xl text-center text-sm bg-green-50 border border-green-300 text-green-800 rounded px-4 py-2">
//             E-Way Bill generated successfully. E-Way Bill No: <strong>{submitResult.ewbNo}</strong>
//             {submitResult.validUpto && <> · Valid up to {submitResult.validUpto}</>}
//           </div>
//         )}
//         {submitError && (
//           <div className="mx-auto max-w-xl text-center text-sm bg-red-50 border border-red-300 text-red-800 rounded px-4 py-2">
//             {submitError}
//           </div>
//         )}

//       </div>

//       {/* Preview Modal */}
//       {showPreview && (
//         <EWayBillPreview
//           data={{
//             supplyType,
//             subType,
//             documentType,
//             documentNo,
//             documentDate,
//             transactionType,
//             billFromName,
//             billFromGstin,
//             billFromState,
//             dispatchAddress1,
//             dispatchAddress2,
//             dispatchPlace,
//             dispatchPincode,
//             dispatchState,
//             billToName,
//             billToGstin,
//             billToState,
//             shipAddress1,
//             shipAddress2,
//             shipPlace,
//             shipPincode,
//             shipState,
//             items,
//             transporterId,
//             transporterName,
//             approxDistance,
//             mode,
//             vehicleType,
//             vehicleNo,
//             transporterDocNo: '',
//             transporterDocDate,
//             otherAmount,
//           }}
//           onClose={() => setShowPreview(false)}
//         />
//       )}
//     </AdminShell>
//   );
// }

// // --- Helpers ---

// const inputCls = 'border border-gray-400 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white';
// const tableCellInput = 'w-full border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white';

// function SectionHeader({ title }: { title: string }) {
//   return (
//     <div className="bg-gradient-to-r from-purple-700 to-purple-600 text-white px-3 py-1.5 rounded-t font-semibold text-xs tracking-wide">
//       {title}
//     </div>
//   );
// }

// function Req() {
//   return <span className="text-red-500 font-bold ml-0.5">*</span>;
// }

// function InfoIcon() {
//   return <Info size={12} className="text-blue-500 cursor-pointer flex-shrink-0" />;
// }

// function FieldGroup({ label, required, children }: { label: React.ReactNode; required?: boolean; children: React.ReactNode }) {
//   return (
//     <div className="flex items-center gap-2">
//       <span className="text-gray-700 font-medium whitespace-nowrap flex items-center gap-0.5">
//         {label}
//         {required && <Req />}
//       </span>
//       {children}
//     </div>
//   );
// }

// function FieldRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
//   return (
//     <div className="flex items-start gap-3">
//       <span className="text-gray-700 font-medium w-20 flex-shrink-0 pt-0.5 flex items-center gap-0.5">{label}</span>
//       <div className="flex-1 flex items-center gap-1">{children}</div>
//     </div>
//   );
// }

// function TotalField({ label, value, className = '' }: { label: React.ReactNode; value: string; className?: string }) {
//   return (
//     <div className={`flex flex-col gap-1 ${className}`}>
//       <label className="text-gray-600 font-medium leading-tight flex items-center gap-0.5">{label}</label>
//       <input readOnly value={value} className="border border-gray-300 rounded px-1.5 py-0.5 text-xs text-right bg-gray-100 w-full font-semibold" />
//     </div>
//   );
// }

// export default function EWayBillForm() {
//   return (
//     <Suspense fallback={<div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading e-way bill form…</div>}>
//       <EWayBillFormContent />
//     </Suspense>
//   );
// }





"use client";

import AdminShell from "@/components/admin/AdminShell";
import { getDuplicateCopyInvoiceNumber } from "@/lib/invoiceRoute";
import { Calendar, Eye, History as HistoryIcon, Info, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import EWayBillPreview, { buildTransportDocumentDetails, FormData as EWayBillFormData } from "./EWayBillPreview";

interface ItemRow {
  id: number;
  name: string;
  description: string;
  hsn: string;
  quantity: string;
  unit: string;
  taxableValue: string;
  cgstSgst: string;
  igst: string;
  cessAdvit: string;
  cessNonAdvit: string;
}

// One row of the "generated e-way bills" history table.
interface EwbHistoryRecord {
  id: string;
  ewbNo: string;
  ewbDate: string;
  validUpto: string;
  billNo: string;
  docType: string;
  customerName: string;
  gstin: string;
  // Full form snapshot at the time this e-way bill was generated, so the
  // history row's Preview button can re-open EWayBillPreview with the
  // exact data that produced it.
  formData: EWayBillFormData;
}

const initialItem: ItemRow = {
  id: 1,
  name: '',
  description: '',
  hsn: '',
  quantity: '',
  unit: '',
  taxableValue: '',
  cgstSgst: '-Select',
  igst: '-Select',
  cessAdvit: '-Select',
  cessNonAdvit: '0',
};

// --- E-Way Bill (NIC) payload mapping helpers ---
// GST state codes, keyed by the uppercase state names used in this form's
// `states` dropdown. Used to translate the human-readable state into the
// numeric fromStateCode/toStateCode the EWB API requires.
const STATE_CODE_BY_NAME: Record<string, number> = {
  'JAMMU AND KASHMIR': 1,
  'HIMACHAL PRADESH': 2,
  'PUNJAB': 3,
  'CHANDIGARH': 4,
  'UTTARAKHAND': 5,
  'HARYANA': 6,
  'DELHI': 7,
  'RAJASTHAN': 8,
  'UTTAR PRADESH': 9,
  'BIHAR': 10,
  'SIKKIM': 11,
  'ARUNACHAL PRADESH': 12,
  'NAGALAND': 13,
  'MANIPUR': 14,
  'MIZORAM': 15,
  'TRIPURA': 16,
  'MEGHALAYA': 17,
  'ASSAM': 18,
  'WEST BENGAL': 19,
  'JHARKHAND': 20,
  'ODISHA': 21,
  'CHHATTISGARH': 22,
  'MADHYA PRADESH': 23,
  'GUJARAT': 24,
  'MAHARASHTRA': 27,
  'KARNATAKA': 29,
  'GOA': 30,
  'KERALA': 32,
  'TAMIL NADU': 33,
  'PUDUCHERRY': 34,
  'ANDAMAN AND NICOBAR ISLANDS': 35,
  'TELANGANA': 36,
  'ANDHRA PRADESH': 37,
  'LADAKH': 38,
};

// Maps this form's free-text sub-type radio values to the numeric
// subSupplyType codes defined in the EWB-API technical document.
const SUB_SUPPLY_TYPE_CODE: Record<string, string> = {
  supply: '1',
  export: '3',
  'job view': '4', // "Job Work" in this form
  'skd/ckd/cxd': '9',
  'reciyent not known': '11', // "Recipient Not Known"
  'for own use': '5',
  'exhibition or fairs': '12',
  'line sales': '10',
  others: '8',
};

// Maps this form's Document Type dropdown to the docType codes the EWB
// API accepts. Credit/Debit Note have no dedicated EWB doc-type code, so
// they fall back to "OTH" (Others) per common practice.
const DOC_TYPE_CODE: Record<string, string> = {
  'Delivery Challan': 'CHL',
  'Tax Invoice': 'INV',
  'Bill of Supply': 'BIL',
  'Credit Note': 'OTH',
  'Debit Note': 'OTH',
};

const TRANSACTION_TYPE_CODE: Record<string, number> = {
  'Regular': 1,
  'Bill To - Ship To': 2,
  'Bill From - Dispatch From': 3,
  'Combination of 2 and 3': 4,
};

// "All" / the garbled "Ship or Ship Chin Roed/Rail" option in this form's
// Mode radio group don't map cleanly to the 4 official EWB transport modes
// (1=Road, 2=Rail, 3=Air, 4=Ship) — adjust this mapping if your real radio
// labels differ from the placeholder text below.
const TRANS_MODE_CODE: Record<string, string> = {
  road: '1',
  rail: '2',
  all: '3',
  'ship or ship chin roed/rail': '4',
};

function stateCode(stateName: string): number {
  return STATE_CODE_BY_NAME[stateName?.toUpperCase()] ?? 0;
}

function gstRateOf(value: string): number {
  if (!value || value === '-Select') return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDateForDisplay(value?: string | Date | null): string {
  const source = value ? new Date(value) : new Date();
  if (Number.isNaN(source.getTime())) {
    return '';
  }

  const day = String(source.getDate()).padStart(2, '0');
  const month = String(source.getMonth() + 1).padStart(2, '0');
  const year = String(source.getFullYear());
  return `${day}/${month}/${year}`;
}

function EWayBillFormContent() {
  const [supplyType, setSupplyType] = useState<'outward' | 'inward'>('outward');
  const [subType, setSubType] = useState('supply');
  const searchParams = useSearchParams();
  const [documentType, setDocumentType] = useState(
    searchParams.get('documentType') || 'Delivery Challan',
  );
  const [documentNo, setDocumentNo] = useState('');
  const [documentDate, setDocumentDate] = useState(formatDateForDisplay());
  const [transactionType, setTransactionType] = useState('Regular');

  const [billFromName, setBillFromName] = useState('Radiatech Electra');
  const [billFromGstin, setBillFromGstin] = useState('29AAGCB1286Q000');
  const [billFromState, setBillFromState] = useState('KARNATAKA');

  const [dispatchAddress1, setDispatchAddress1] = useState('A 287, Basement, Sector-69');
  const [dispatchAddress2, setDispatchAddress2] = useState('Transport Nagar');
  const [dispatchPlace, setDispatchPlace] = useState('KARNATAKA');
  const [dispatchPincode, setDispatchPincode] = useState('560064');
  const [dispatchState, setDispatchState] = useState('KARNATAKA');

  const [billToName, setBillToName] = useState('');
  const [billToGstin, setBillToGstin] = useState('');
  const [billToState, setBillToState] = useState('');

  const [shipAddress1, setShipAddress1] = useState('');
  const [shipAddress2, setShipAddress2] = useState('');
  const [shipPlace, setShipPlace] = useState('');
  const [shipPincode, setShipPincode] = useState('');
  const [shipState, setShipState] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ ...initialItem }]);

  const [transporterId, setTransporterId] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [approxDistance, setApproxDistance] = useState('');

  const [mode, setMode] = useState('');
  const [vehicleType, setVehicleType] = useState('regular');
  const [vehicleNo, setVehicleNo] = useState('');
  const [transporterDocNo, setTransporterDocNo] = useState('');
  const [transporterDocDate, setTransporterDocDate] = useState(formatDateForDisplay());

  const [otherAmount, setOtherAmount] = useState('0.00');
  const [showPreview, setShowPreview] = useState(false);
  const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  // 'list' = History view (default landing view); 'form' = the e-way bill
  // entry form, only shown once "Generate E-Way Bill" is clicked.
  const [view, setView] = useState<'list' | 'form'>('list');
  const [history, setHistory] = useState<EwbHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPreviewData, setHistoryPreviewData] = useState<EWayBillFormData | null>(null);
  const [historyPreviewNumber, setHistoryPreviewNumber] = useState('');
  const [historyPreviewGeneratedDate, setHistoryPreviewGeneratedDate] = useState('');
  const [historyPreviewValidUpto, setHistoryPreviewValidUpto] = useState('');

  // Real e-way bill submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    ewbNo?: string | number;
    ewbDate?: string;
    validUpto?: string;
  } | null>(null);

  // Fetch invoices on component mount
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoadingInvoices(true);
      try {
        const response = await fetch('/api/invoices');
        if (response.ok) {
          const data = await response.json();
          setAvailableInvoices(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      } finally {
        setIsLoadingInvoices(false);
      }
    };
    fetchInvoices();
  }, []);

  const refreshHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/eway-bill/history');
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch e-way bill history:', error);
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch previously generated e-way bills for the History section.
  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch('/api/eway-bill/history');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        if (isMounted) {
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch e-way bill history:', error);
        if (isMounted) {
          setHistory([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    void loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle invoice selection to auto-populate form
  const handleInvoiceSelect = (invoiceNumber: string) => {
    if (!invoiceNumber) {
      // Clear form if no invoice selected
      setDocumentNo('');
      setDocumentDate(formatDateForDisplay());
      return;
    }

    const invoice = availableInvoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!invoice) return;

    // Set document details
    const billNumber = getDuplicateCopyInvoiceNumber(invoice.invoiceNumber, false);
    setDocumentNo(billNumber || '');
    setDocumentDate(invoice.invoiceDate ? formatDateForDisplay(invoice.invoiceDate) : formatDateForDisplay());
    setDocumentType('Tax Invoice');

    // Set Bill To (customer) details
    setBillToName(invoice.partyName || '');
    setBillToGstin(invoice.gstin || '');
    setBillToState(invoice.state || '');

    // Set Ship To address
    setShipAddress1(invoice.address || '');
    setShipPlace(invoice.city || '');
    setShipPincode(invoice.pincode || '');
    setShipState(invoice.state || '');

    // Populate items from invoice
    if (invoice.items && Array.isArray(invoice.items)) {
      const mappedItems = invoice.items.map((item: any, idx: number) => ({
        id: idx + 1,
        name: item.description || '',
        description: item.description || '',
        hsn: item.hsn || '',
        quantity: String(item.qty || ''),
        unit: item.unit || 'Nos',
        taxableValue: String(item.rate * item.qty || ''),
        cgstSgst: item.taxType === 'cgst-sgst' ? '9' : '-Select',
        igst: item.taxType === 'igst' ? '18' : '-Select',
        cessAdvit: '-Select',
        cessNonAdvit: '0',
      }));
      setItems(mappedItems.length > 0 ? mappedItems : [{ ...initialItem }]);
    }

    // Set transport details if available
    setTransporterName(invoice.transportName || '');
    setVehicleNo(invoice.vehicleNumber || '');
  };

  const addItem = () => {
    setItems(prev => [...prev, { ...initialItem, id: Date.now() }]);
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: number, field: keyof ItemRow, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Calculate totals in real-time
  const calculateTotals = () => {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCessAdvit = 0;
    let totalCessNon = 0;

    items.forEach(item => {
      const taxableValue = parseFloat(item.taxableValue) || 0;
      const cgstRate = item.cgstSgst === '-Select' ? 0 : parseFloat(item.cgstSgst) || 0;
      const igstRate = item.igst === '-Select' ? 0 : parseFloat(item.igst) || 0;
      const cessRate = item.cessAdvit === '-Select' ? 0 : parseFloat(item.cessAdvit) || 0;
      const cessNonRate = parseFloat(item.cessNonAdvit) || 0;

      totalTaxable += taxableValue;
      totalCgst += (taxableValue * cgstRate) / 100;
      totalSgst += (taxableValue * cgstRate) / 100;
      totalIgst += (taxableValue * igstRate) / 100;
      totalCessAdvit += (taxableValue * cessRate) / 100;
      totalCessNon += cessNonRate;
    });

    const otherAmt = parseFloat(otherAmount) || 0;
    const totalInvoice = totalTaxable + totalCgst + totalSgst + totalIgst + totalCessAdvit + totalCessNon + otherAmt;

    return {
      totalTaxable: totalTaxable.toFixed(2),
      totalCgst: totalCgst.toFixed(2),
      totalSgst: totalSgst.toFixed(2),
      totalIgst: totalIgst.toFixed(2),
      totalCessAdvit: totalCessAdvit.toFixed(2),
      totalCessNon: totalCessNon.toFixed(2),
      totalInvoice: totalInvoice.toFixed(2),
    };
  };

  const totals = calculateTotals();

  // Snapshot of the current form fields in the shape EWayBillPreview expects.
  // Used for the live "Preview" button and saved onto each history record.
  const transportDocDetails = buildTransportDocumentDetails(transporterDocNo, transporterDocDate);

  const formSnapshot: EWayBillFormData = {
    supplyType,
    subType,
    documentType,
    documentNo,
    documentDate,
    transactionType,
    billFromName,
    billFromGstin,
    billFromState,
    dispatchAddress1,
    dispatchAddress2,
    dispatchPlace,
    dispatchPincode,
    dispatchState,
    billToName,
    billToGstin,
    billToState,
    shipAddress1,
    shipAddress2,
    shipPlace,
    shipPincode,
    shipState,
    items,
    transporterId,
    transporterName,
    approxDistance,
    mode,
    vehicleType,
    vehicleNo,
    transporterDocNo: transportDocDetails.transporterDocNo,
    transporterDocDate: transportDocDetails.transporterDocDate,
    otherAmount,
  };

  // Builds the request body in the exact shape the NIC EWB "GenerateEWayBill"
  // API expects, from this form's current state.
  const buildEwayBillPayload = () => {
    const t = calculateTotals();
    return {
      supplyType: supplyType === 'outward' ? 'O' : 'I',
      subSupplyType: SUB_SUPPLY_TYPE_CODE[subType] ?? '8',
      subSupplyDesc: '',
      docType: DOC_TYPE_CODE[documentType] ?? 'OTH',
      docNo: documentNo,
      docDate: documentDate,

      fromGstin: billFromGstin,
      fromTrdName: billFromName,
      fromAddr1: dispatchAddress1,
      fromAddr2: dispatchAddress2,
      fromPlace: dispatchPlace,
      fromPincode: parseInt(dispatchPincode, 10) || 0,
      fromStateCode: stateCode(dispatchState || billFromState),
      actFromStateCode: stateCode(dispatchState || billFromState),

      toGstin: billToGstin,
      toTrdName: billToName,
      toAddr1: shipAddress1,
      toAddr2: shipAddress2,
      toPlace: shipPlace,
      toPincode: parseInt(shipPincode, 10) || 0,
      toStateCode: stateCode(shipState || billToState),
      actToStateCode: stateCode(shipState || billToState),

      transactionType: TRANSACTION_TYPE_CODE[transactionType] ?? 1,
      otherValue: parseFloat(otherAmount) || 0,
      totalValue: parseFloat(t.totalTaxable),
      cgstValue: parseFloat(t.totalCgst),
      sgstValue: parseFloat(t.totalSgst),
      igstValue: parseFloat(t.totalIgst),
      cessValue: parseFloat(t.totalCessAdvit),
      totInvValue: parseFloat(t.totalInvoice),

      transMode: TRANS_MODE_CODE[mode] ?? '1',
      transDistance: approxDistance,
      transporterName,
      transporterId,
      transDocNo: transportDocDetails.transporterDocNo,
      transDocDate: transportDocDetails.transporterDocDate,
      vehicleNo,
      vehicleType: vehicleType === 'regular' ? 'R' : 'O',

      itemList: items.map((item) => ({
        productName: item.name,
        productDesc: item.description,
        hsnCode: item.hsn,
        quantity: parseFloat(item.quantity) || 0,
        qtyUnit: item.unit,
        taxableAmount: parseFloat(item.taxableValue) || 0,
        cgstRate: gstRateOf(item.cgstSgst),
        sgstRate: gstRateOf(item.cgstSgst),
        igstRate: gstRateOf(item.igst),
        cessRate: gstRateOf(item.cessAdvit),
        cessNonAdvol: parseFloat(item.cessNonAdvit) || 0,
      })),
    };
  };

  // Submits the built payload to our own backend route, which holds the
  // GSTIN/GSP credentials and does the RSA/AES handshake with the real NIC
  // e-way bill system. The browser never talks to NIC directly.
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);
    try {
      const payload = buildEwayBillPayload();
      const res = await fetch('/api/eway-bill/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          formData: formSnapshot,
          documentType,
          documentNo,
          billToName,
          gstin: billToGstin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }
      const ewbNo = data.ewayBillNo ?? data.ewbNo;
      const ewbDate = data.ewayBillDate ?? data.ewbDate;
      setSubmitResult({
        ewbNo,
        ewbDate,
        validUpto: data.validUpto,
      });

      await refreshHistory();

      // Keep the local list in sync while the server-side refresh completes.
      setHistory(prev => [
        {
          id: String(ewbNo ?? Date.now()),
          ewbNo: String(ewbNo ?? ''),
          ewbDate: ewbDate ?? formatDateForDisplay(),
          validUpto: data.validUpto ?? '',
          billNo: documentNo,
          docType: documentType,
          customerName: billToName,
          gstin: billToGstin,
          formData: formSnapshot,
        },
        ...prev,
      ]);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to generate e-way bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subTypes = ['Supply', 'Export', 'Job View', 'SKD/CKD/Cxd', 'Reciyent Not Known', 'For Own Use', 'Exhibition or Fairs', 'Line Sales', 'Others'];

  const states = [
    'ANDAMAN AND NICOBAR ISLANDS',
    'ANDHRA PRADESH',
    'ARUNACHAL PRADESH',
    'ASSAM',
    'BIHAR',
    'CHANDIGARH',
    'CHHATTISGARH',
    'DADRA AND NAGAR HAVELI',
    'DAMAN AND DIU',
    'DELHI',
    'GOA',
    'GUJARAT',
    'HARYANA',
    'HIMACHAL PRADESH',
    'JAMMU AND KASHMIR',
    'JHARKHAND',
    'KARNATAKA',
    'KERALA',
    'LADAKH',
    'LAKSHADWEEP',
    'MADHYA PRADESH',
    'MAHARASHTRA',
    'MANIPUR',
    'MEGHALAYA',
    'MIZORAM',
    'NAGALAND',
    'ODISHA',
    'PUDUCHERRY',
    'PUNJAB',
    'RAJASTHAN',
    'SIKKIM',
    'TAMIL NADU',
    'TELANGANA',
    'TRIPURA',
    'UTTAR PRADESH',
    'UTTARAKHAND',
    'WEST BENGAL',
  ];

  const gstRates = ['-Select', '0', '0.1', '0.25', '1', '1.5', '3', '5', '6', '7.5', '9', '12', '14', '18', '28'];

  return (
    <AdminShell
      title={view === 'form' ? 'E-Way Bill Entry' : 'E-Way Bill'}
      description={
        view === 'form'
          ? 'Create a new e-way bill. Fill in all the required fields marked with * to proceed.'
          : 'View previously generated e-way bills, or generate a new one.'
      }
    >
      {/* History (default landing view) */}
      {view === 'list' && (
        <div className="p-3 space-y-3">
          <section className="bg-white border border-gray-300 rounded shadow-sm">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-[#cad5e2]">
              <h2 className="text-sm font-semibold text-[#000000] flex items-center gap-2">
                <HistoryIcon size={16} className="text-purple-700" />
                E-Way Bill History
              </h2>
              <button
                onClick={() => setView('form')}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-1.5 transition-colors shadow"
              >
                <Plus size={14} />
                Generate E-Way Bill
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#cad5e2] text-[#000000] uppercase text-[11px]">
                    <th className="px-3 py-2 text-left font-semibold">Date</th>
                    <th className="px-3 py-2 text-left font-semibold">Valid Upto</th>
                    <th className="px-3 py-2 text-left font-semibold">EWB No</th>
                    <th className="px-3 py-2 text-left font-semibold">Bill No</th>
                    <th className="px-3 py-2 text-left font-semibold">Type of Bill</th>
                    <th className="px-3 py-2 text-left font-semibold">Customer</th>
                    <th className="px-3 py-2 text-left font-semibold">GSTIN</th>
                    <th className="px-3 py-2 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-gray-400">Loading history…</td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-gray-400">No e-way bills generated yet.</td>
                    </tr>
                  ) : (
                    history.map(record => (
                      <tr key={record.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-[#000000]">{record.ewbDate}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[#000000]">{record.validUpto || '-'}</td>
                        <td className="px-3 py-2 font-medium text-[#000000] whitespace-nowrap">{record.ewbNo || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[#000000]">{record.billNo || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[#000000]">{record.docType}</td>
                        <td className="px-3 py-2 text-[#000000]">{record.customerName || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[#000000]">{record.gstin || '-'}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => {
                              setHistoryPreviewData(record.formData);
                              setHistoryPreviewNumber(record.ewbNo);
                              setHistoryPreviewGeneratedDate(record.ewbDate);
                              setHistoryPreviewValidUpto(record.validUpto);
                            }}
                            className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold px-3 py-1 rounded transition-colors"
                          >
                            <Eye size={11} />
                            Preview
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* E-Way Bill entry form — only opens when "Generate E-Way Bill" is clicked */}
      {view === 'form' && (
      <div className="p-3 space-y-3">

        {/* Back to history */}
        <div>
          <button
            onClick={() => {
              setView('list');
              void refreshHistory();
            }}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 hover:underline"
          >
            ← Back to History
          </button>
        </div>

        {/* Transaction Details */}
        <section className="bg-white border border-gray-300 rounded shadow-sm">
          <SectionHeader title="Transaction Details" />
          <div className="p-3 space-y-3">
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Supply Type <Req /></span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="supplyType" value="outward" checked={supplyType === 'outward'} onChange={() => setSupplyType('outward')} className="accent-blue-600" />
                  <span>Outward</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="supplyType" value="inward" checked={supplyType === 'inward'} onChange={() => setSupplyType('inward')} className="accent-blue-600" />
                  <span>Inward</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Sub Type <InfoIcon /></span>
                <div className="flex flex-wrap gap-2">
                  {subTypes.map(st => (
                    <label key={st} className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="subType" value={st.toLowerCase()} checked={subType === st.toLowerCase()} onChange={() => setSubType(st.toLowerCase())} className="accent-blue-600" />
                      <span>{st}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 items-center">
              <FieldGroup label="Document Type" required>
                <select value={documentType} onChange={e => setDocumentType(e.target.value)} className={inputCls}>
                  <option>Delivery Challan</option>
                  <option>Tax Invoice</option>
                  <option>Bill of Supply</option>
                  <option>Credit Note</option>
                  <option>Debit Note</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Document No">
                <div className="flex items-center gap-1">
                  <select value={documentNo} onChange={e => handleInvoiceSelect(e.target.value)} className={`${inputCls} flex-1`}>
                    <option value="">-- Select Invoice --</option>
                    {isLoadingInvoices ? (
                      <option disabled>Loading invoices...</option>
                    ) : (
                      availableInvoices.map(inv => {
                        const billNumber = getDuplicateCopyInvoiceNumber(inv.invoiceNumber, false);
                        return (
                          <option key={inv.id} value={inv.invoiceNumber}>
                            {billNumber || 'No bill number'}
                          </option>
                        );
                      })
                    )}
                  </select>
                  <InfoIcon />
                </div>
              </FieldGroup>
              <FieldGroup label="Document Date" required>
                <div className="flex items-center gap-1">
                  <input
                    value={documentDate}
                    onChange={e => setDocumentDate(e.target.value)}
                    className={`${inputCls} w-28`}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                  />
                  <Calendar size={14} className="text-gray-500 cursor-pointer" />
                </div>
              </FieldGroup>
              <FieldGroup label="Transaction Type" required>
                <div className="flex items-center gap-1">
                  <select value={transactionType} onChange={e => setTransactionType(e.target.value)} className={inputCls}>
                    <option>Regular</option>
                    <option>Bill To - Ship To</option>
                    <option>Bill From - Dispatch From</option>
                    <option>Combination of 2 and 3</option>
                  </select>
                  <InfoIcon />
                </div>
              </FieldGroup>
            </div>
          </div>
        </section>

        {/* Bill From / Dispatch From */}
        <div className="grid grid-cols-2 gap-3">
          <section className="bg-white border border-gray-300 rounded shadow-sm">
            <SectionHeader title="Bill From" />
            <div className="p-3 space-y-2">
              <FieldRow label="Name">
                <div className="flex items-center gap-1">
                  <input value={billFromName} onChange={e => setBillFromName(e.target.value)} className={`${inputCls} flex-1`} />
                  <button className="border border-gray-400 rounded px-1 py-0.5 text-xs hover:bg-gray-100 transition-colors">
                    <RefreshCw size={10} />
                  </button>
                </div>
              </FieldRow>
              <FieldRow label={<>GSTIN <Req /></>}>
                <div className="flex items-center gap-1">
                  <input value={billFromGstin} onChange={e => setBillFromGstin(e.target.value)} className={`${inputCls} flex-1 bg-blue-50`} placeholder="GSTIN" />
                  <InfoIcon />
                </div>
              </FieldRow>
              <FieldRow label={<>State <Req /></>}>
                <select value={billFromState} onChange={e => setBillFromState(e.target.value)} className={`${inputCls} flex-1`}>
                  {states.map(s => <option key={s}>{s}</option>)}
                </select>
              </FieldRow>
            </div>
          </section>

          <section className="bg-white border border-gray-300 rounded shadow-sm">
            <SectionHeader title="Dispatch From" />
            <div className="p-3 space-y-2">
              <FieldRow label="Address">
                <div className="flex gap-1">
                  <input value={dispatchAddress1} onChange={e => setDispatchAddress1(e.target.value)} className={`${inputCls} flex-1`} />
                  <input value={dispatchAddress2} onChange={e => setDispatchAddress2(e.target.value)} className={`${inputCls} flex-1`} />
                </div>
              </FieldRow>
              <FieldRow label="Place">
                <input value={dispatchPlace} onChange={e => setDispatchPlace(e.target.value)} className={`${inputCls} w-40`} />
              </FieldRow>
              <FieldRow label={<>Pincode <Req /></>}>
                <div className="flex items-center gap-1">
                  <input value={dispatchPincode} onChange={e => setDispatchPincode(e.target.value)} className={`${inputCls} w-24`} />
                  <InfoIcon />
                  <select value={dispatchState} onChange={e => setDispatchState(e.target.value)} className={`${inputCls} flex-1`}>
                    {states.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <InfoIcon />
                </div>
              </FieldRow>
            </div>
          </section>
        </div>

        {/* Bill To / Ship To */}
        <div className="grid grid-cols-2 gap-3">
          <section className="bg-white border border-gray-300 rounded shadow-sm">
            <SectionHeader title="Bill To" />
            <div className="p-3 space-y-2">
              <FieldRow label="Name">
                <div className="flex items-center gap-1">
                  <input value={billToName} onChange={e => setBillToName(e.target.value)} className={`${inputCls} flex-1`} />
                  <button className="border border-gray-400 rounded px-1 py-0.5 text-xs hover:bg-gray-100 transition-colors">
                    <RefreshCw size={10} />
                  </button>
                </div>
              </FieldRow>
              <FieldRow label={<>GSTIN <Req /></>}>
                <div className="flex items-center gap-1">
                  <input value={billToGstin} onChange={e => setBillToGstin(e.target.value)} className={`${inputCls} flex-1 bg-blue-50`} placeholder="GSTIN" />
                  <InfoIcon />
                </div>
              </FieldRow>
              <FieldRow label={<>State <Req /></>}>
                <select value={billToState} onChange={e => setBillToState(e.target.value)} className={`${inputCls} flex-1`}>
                  {states.map(s => <option key={s}>{s}</option>)}
                </select>
              </FieldRow>
            </div>
          </section>

          <section className="bg-white border border-gray-300 rounded shadow-sm">
            <SectionHeader title="Ship To" />
            <div className="p-3 space-y-2">
              <FieldRow label="Address">
                <div className="flex gap-1">
                  <input value={shipAddress1} onChange={e => setShipAddress1(e.target.value)} className={`${inputCls} flex-1`} />
                  <input value={shipAddress2} onChange={e => setShipAddress2(e.target.value)} className={`${inputCls} flex-1`} />
                </div>
              </FieldRow>
              <FieldRow label="Place">
                <input value={shipPlace} onChange={e => setShipPlace(e.target.value)} className={`${inputCls} w-40`} />
              </FieldRow>
              <FieldRow label={<>Pincode <Req /></>}>
                <div className="flex items-center gap-1">
                  <input value={shipPincode} onChange={e => setShipPincode(e.target.value)} className={`${inputCls} w-24`} />
                  <InfoIcon />
                  <select value={shipState} onChange={e => setShipState(e.target.value)} className={`${inputCls} flex-1`}>
                    {states.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <InfoIcon />
                </div>
              </FieldRow>
            </div>
          </section>
        </div>

        {/* Item Details */}
        <section className="bg-white border border-gray-300 rounded shadow-sm">
          <SectionHeader title="Item Details" />
          <div className="p-3">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 border border-gray-300">
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-36">Product Name</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-36">Description</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-24">HSN <Req /></th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-24">Quantity</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-20">Unit <InfoIcon /></th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-28">Value/Taxable Value (Rs.) <Req /></th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-32">CGST / SGST Rate(%) <Req /></th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-28">IGST Rate(%) <Req /></th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-28">CESS Advit Rate(%) <Req /></th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-28">CESS non Advit Rate <Req /></th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center w-10">
                      <button onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white rounded p-0.5 transition-colors">
                        <Plus size={12} />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border border-gray-300 hover:bg-gray-50 transition-colors">
                      <td className="border border-gray-300 px-1 py-1">
                        <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Name" className={tableCellInput} />
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Description" className={tableCellInput} />
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <input value={item.hsn} onChange={e => updateItem(item.id, 'hsn', e.target.value)} className={tableCellInput} />
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <input value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} placeholder="Quantity" className={`${tableCellInput} text-right`} />
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} placeholder="Unit" className={tableCellInput} />
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <input value={item.taxableValue} onChange={e => updateItem(item.id, 'taxableValue', e.target.value)} className={`${tableCellInput} text-right`} />
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <select value={item.cgstSgst} onChange={e => updateItem(item.id, 'cgstSgst', e.target.value)} className={tableCellInput}>
                          {gstRates.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <select value={item.igst} onChange={e => updateItem(item.id, 'igst', e.target.value)} className={tableCellInput}>
                          {gstRates.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <select value={item.cessAdvit} onChange={e => updateItem(item.id, 'cessAdvit', e.target.value)} className={tableCellInput}>
                          {gstRates.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <select value={item.cessNonAdvit} onChange={e => updateItem(item.id, 'cessNonAdvit', e.target.value)} className={tableCellInput}>
                          {['0', '1', '2', '3', '4', '5'].map(r => <option key={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Row */}
            <div className="mt-3 grid grid-cols-8 gap-2 border border-gray-300 rounded p-3 bg-gradient-to-r from-green-50 to-blue-50">
              <TotalField label={<>Total Tax Sle Amount <Req /></>} value={totals.totalTaxable} />
              <TotalField label={<>CGST Amount <Req /></>} value={totals.totalCgst} />
              <TotalField label={<>SGST Amount <Req /></>} value={totals.totalSgst} />
              <TotalField label={<>IGST Amount <Req /></>} value={totals.totalIgst} />
              <TotalField label={<>CESS Advel Amount <Req /></>} value={totals.totalCessAdvit} />
              <TotalField label={<>CESS Non Adval Amount <InfoIcon /></>} value={totals.totalCessNon} />
              <div className="flex flex-col gap-1">
                <label className="text-gray-600 font-medium leading-tight flex items-center gap-0.5">Other Amount(+-) <InfoIcon /></label>
                <input 
                  value={otherAmount} 
                  onChange={e => setOtherAmount(e.target.value)} 
                  className={`border border-gray-300 rounded px-1.5 py-0.5 text-xs text-right bg-yellow-50 font-semibold w-full`}
                  placeholder="0.00"
                />
              </div>
              <TotalField label={<>Total Inv. Amount <InfoIcon /></>} value={totals.totalInvoice} className="font-bold text-green-700" />
            </div>
          </div>
        </section>

        {/* Transportation Details */}
        <section className="bg-white border border-gray-300 rounded shadow-sm">
          <SectionHeader title="Transportation Details" />
          <div className="p-3">
            <div className="flex flex-wrap gap-6 items-center">
              <FieldGroup label="Transporter ID">
                <div className="flex items-center gap-1">
                  <input value={transporterId} onChange={e => setTransporterId(e.target.value)} className={`${inputCls} w-48`} />
                  <InfoIcon />
                </div>
              </FieldGroup>
              <FieldGroup label="Transporter Name">
                <input value={transporterName} onChange={e => setTransporterName(e.target.value)} placeholder="Name" className={`${inputCls} w-40`} />
              </FieldGroup>
              <div className="flex-1" />
              <FieldGroup label={<>Auto Calculated PIN To PIN in KM <InfoIcon /></>}>
                <div className="text-blue-600 text-xs font-medium cursor-pointer hover:underline">A001</div>
              </FieldGroup>
              <FieldGroup label={<>Approximate Distance (in KM) <Req /></>}>
                <div className="flex items-center gap-1">
                  <input value={approxDistance} onChange={e => setApproxDistance(e.target.value)} className={`${inputCls} w-24 text-right`} />
                  <InfoIcon />
                </div>
              </FieldGroup>
            </div>
          </div>
        </section>

        {/* PART-B */}
        <section className="bg-white border border-gray-300 rounded shadow-sm">
          <SectionHeader title="PART-B" />
          <div className="p-3 space-y-3">
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Mode</span>
                {['Road', 'Rail', 'All', 'Ship or Ship Chin Roed/Rail'].map(m => (
                  <label key={m} className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="mode" value={m.toLowerCase()} checked={mode === m.toLowerCase()} onChange={() => setMode(m.toLowerCase())} className="accent-blue-600" />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-8">
                <span className="font-semibold text-gray-700">Vehicle Type</span>
                {['Regular', 'Over Dimensional Cargo'].map(vt => (
                  <label key={vt} className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="vehicleType" value={vt.toLowerCase()} checked={vehicleType === vt.toLowerCase()} onChange={() => setVehicleType(vt.toLowerCase())} className="accent-blue-600" />
                    <span>{vt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-6 items-center">
              <FieldGroup label="Vehicle No">
                <div className="flex items-center gap-1">
                  <input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className={`${inputCls} w-36 bg-yellow-50`} />
                  <InfoIcon />
                </div>
              </FieldGroup>
              <FieldGroup label="Transporter Doc. No. & Date">
                <div className="flex items-center gap-2">
                  <input
                    value={transporterDocNo}
                    onChange={e => setTransporterDocNo(e.target.value)}
                    className={`${inputCls} w-48`}
                    placeholder="Document No."
                  />
                  <input
                    value={transporterDocDate}
                    onChange={e => setTransporterDocDate(e.target.value)}
                    className={`${inputCls} w-28`}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                  />
                  <Calendar size={14} className="text-gray-500 cursor-pointer" />
                </div>
              </FieldGroup>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 py-2">
          <button onClick={() => setShowPreview(true)} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-8 py-2 rounded transition-colors shadow">
            Preview
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-8 py-2 rounded transition-colors shadow"
          >
            {isSubmitting ? 'Generating…' : 'Submit'}
          </button>
          <button
            onClick={() => setView('list')}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-8 py-2 rounded transition-colors shadow"
          >
            Exit
          </button>
        </div>

        {submitResult && (
          <div className="mx-auto max-w-xl text-center text-sm bg-green-50 border border-green-300 text-green-800 rounded px-4 py-2">
            E-Way Bill generated successfully. E-Way Bill No: <strong>{submitResult.ewbNo}</strong>
            {submitResult.validUpto && <> · Valid up to {submitResult.validUpto}</>}
          </div>
        )}
        {submitError && (
          <div className="mx-auto max-w-xl text-center text-sm bg-red-50 border border-red-300 text-red-800 rounded px-4 py-2">
            {submitError}
          </div>
        )}

      </div>
      )}

      {/* Preview Modal — live form being edited */}
      {showPreview && (
        <EWayBillPreview
          data={formSnapshot}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Preview Modal — a past e-way bill selected from History */}
      {historyPreviewData && (
        <EWayBillPreview
          data={historyPreviewData}
          ewayBillNumber={historyPreviewNumber}
          generatedDate={historyPreviewGeneratedDate}
          validUpto={historyPreviewValidUpto}
          onClose={() => {
            setHistoryPreviewData(null);
            setHistoryPreviewNumber('');
            setHistoryPreviewGeneratedDate('');
            setHistoryPreviewValidUpto('');
          }}
        />
      )}
    </AdminShell>
  );
}

// --- Helpers ---

const inputCls = 'border border-gray-400 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white';
const tableCellInput = 'w-full border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white';

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-gradient-to-r from-purple-700 to-purple-600 text-white px-3 py-1.5 rounded-t font-semibold text-xs tracking-wide">
      {title}
    </div>
  );
}

function Req() {
  return <span className="text-red-500 font-bold ml-0.5">*</span>;
}

function InfoIcon() {
  return <Info size={12} className="text-blue-500 cursor-pointer flex-shrink-0" />;
}

function FieldGroup({ label, required, children }: { label: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-700 font-medium whitespace-nowrap flex items-center gap-0.5">
        {label}
        {required && <Req />}
      </span>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-700 font-medium w-20 flex-shrink-0 pt-0.5 flex items-center gap-0.5">{label}</span>
      <div className="flex-1 flex items-center gap-1">{children}</div>
    </div>
  );
}

function TotalField({ label, value, className = '' }: { label: React.ReactNode; value: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-gray-600 font-medium leading-tight flex items-center gap-0.5">{label}</label>
      <input readOnly value={value} className="border border-gray-300 rounded px-1.5 py-0.5 text-xs text-right bg-gray-100 w-full font-semibold" />
    </div>
  );
}

export default function EWayBillForm() {
  return (
    <Suspense fallback={<div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading e-way bill form…</div>}>
      <EWayBillFormContent />
    </Suspense>
  );
}