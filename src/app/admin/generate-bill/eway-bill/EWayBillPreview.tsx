"use client";

import html2canvas from 'html2canvas-pro';
import JSBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { Printer, X } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { useEffect, useRef, useState } from 'react';

export interface FormData {
  supplyType: string;
  subType: string;
  documentType: string;
  documentNo: string;
  documentDate: string;
  transactionType: string;

  billFromName: string;
  billFromGstin: string;
  billFromState: string;

  dispatchAddress1: string;
  dispatchAddress2: string;
  dispatchPlace: string;
  dispatchPincode: string;
  dispatchState: string;

  billToName: string;
  billToGstin: string;
  billToState: string;

  shipAddress1: string;
  shipAddress2: string;
  shipPlace: string;
  shipPincode: string;
  shipState: string;

  items: {
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
  }[];

  transporterId: string;
  transporterName: string;
  approxDistance: string;

  mode: string;
  vehicleType: string;
  vehicleNo: string;
  transporterDocNo: string;
  transporterDocDate: string;
  otherAmount: string;
}

interface Props {
  data: FormData;
  onClose: () => void;
  ewayBillNumber?: string;
  generatedDate?: string;
  validUpto?: string;
}

export function resolveEwayBillNumber(data: FormData, ewayBillNumber?: string): string {
  const normalized = (ewayBillNumber || '').trim();
  if (normalized) {
    return normalized;
  }

  if (data.documentNo) {
    return `PREVIEW-${data.documentNo}`;
  }

  return 'PREVIEW-0001';
}

function parsePreviewDate(value: Date | string | null | undefined): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = (value ?? '').toString().trim();
  if (!text) {
    return null;
  }

  const ddMMyyyyMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (ddMMyyyyMatch) {
    const [, dayText, monthText, yearText, hourText, minuteText, secondText, meridiem] = ddMMyyyyMatch;
    const day = parseInt(dayText, 10);
    const month = parseInt(monthText, 10) - 1;
    const year = parseInt(yearText, 10);
    let hours = parseInt(hourText || '0', 10);
    const minutes = parseInt(minuteText || '0', 10);
    const seconds = parseInt(secondText || '0', 10);

    if (meridiem) {
      const normalizedMeridiem = meridiem.toUpperCase();
      if (normalizedMeridiem === 'PM' && hours < 12) {
        hours += 12;
      }
      if (normalizedMeridiem === 'AM' && hours === 12) {
        hours = 0;
      }
    }

    return new Date(year, month, day, hours, minutes, seconds);
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatPreviewGeneratedDate(value: Date | string | null | undefined): string {
  const source = parsePreviewDate(value);
  if (!source) {
    return '';
  }

  const day = String(source.getDate()).padStart(2, '0');
  const month = String(source.getMonth() + 1).padStart(2, '0');
  const year = String(source.getFullYear());
  const meridiem = source.getHours() < 12 ? 'AM' : 'PM';
  const hours12 = source.getHours() % 12 || 12;
  const hours = String(hours12).padStart(2, '0');
  const minutes = String(source.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes} ${meridiem}`;
}

export function formatPreviewValidUpto(value: Date | string | null | undefined): string {
  const source = parsePreviewDate(value);
  if (!source) {
    return '';
  }

  const day = String(source.getDate()).padStart(2, '0');
  const month = String(source.getMonth() + 1).padStart(2, '0');
  const year = String(source.getFullYear());
  return `${day}/${month}/${year}`;
}

export function buildTransportDocumentDetails(transporterDocNo: string, transporterDocDate: string) {
  return {
    transporterDocNo: (transporterDocNo || '').trim(),
    transporterDocDate: (transporterDocDate || '').trim(),
  };
}

export function formatTransporterDisplay(transporterId: string, transporterName: string) {
  const id = (transporterId || '').trim();
  const name = (transporterName || '').trim();

  if (id && name) {
    return `${id} - ${name}`;
  }

  if (id) {
    return id;
  }

  if (name) {
    return name;
  }

  return '-';
}

const GREEN = '#cad5e2';
const LIGHT_GREEN = '#f4f7fa';

function calcTotals(data: FormData) {
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCessAdvit = 0;
  let totalCessNon = 0;

  for (const item of data.items) {
    const tv = parseFloat(item.taxableValue) || 0;
    const cgstRate = parseFloat(item.cgstSgst) || 0;
    const igstRate = parseFloat(item.igst) || 0;
    const cessRate = parseFloat(item.cessAdvit) || 0;
    const cessNon = parseFloat(item.cessNonAdvit) || 0;

    totalTaxable += tv;
    totalCgst += (tv * cgstRate) / 100;
    totalSgst += (tv * cgstRate) / 100;
    totalIgst += (tv * igstRate) / 100;
    totalCessAdvit += (tv * cessRate) / 100;
    totalCessNon += cessNon;
  }

  const otherAmt = parseFloat(data.otherAmount) || 0;
  const totalInv = totalTaxable + totalCgst + totalSgst + totalIgst + totalCessAdvit + totalCessNon + otherAmt;

  return {
    totalTaxable: totalTaxable.toFixed(2),
    totalCgst: totalCgst.toFixed(2),
    totalSgst: totalSgst.toFixed(2),
    totalIgst: totalIgst.toFixed(2),
    totalCessAdvit: totalCessAdvit.toFixed(2),
    totalCessNon: totalCessNon.toFixed(2),
    totalInv: totalInv.toFixed(2),
  };
}

const now = new Date();


function calculateItemTaxes(item: FormData['items'][0]) {
  const taxableValue = parseFloat(item.taxableValue) || 0;
  const cgstRate = item.cgstSgst === '-Select' ? 0 : parseFloat(item.cgstSgst) || 0;
  const igstRate = item.igst === '-Select' ? 0 : parseFloat(item.igst) || 0;
  const cessRate = item.cessAdvit === '-Select' ? 0 : parseFloat(item.cessAdvit) || 0;
  const cessNonAdvit = parseFloat(item.cessNonAdvit) || 0;

  const cgstAmount = (taxableValue * cgstRate) / 100;
  const sgstAmount = (taxableValue * cgstRate) / 100;
  const igstAmount = (taxableValue * igstRate) / 100;
  const cessAmount = (taxableValue * cessRate) / 100;

  return {
    cgstRate,
    sgstRate: cgstRate,
    igstRate,
    cessRate,
    cgstAmount: cgstAmount.toFixed(2),
    sgstAmount: sgstAmount.toFixed(2),
    igstAmount: igstAmount.toFixed(2),
    cessAmount: cessAmount.toFixed(2),
    cessNonAdvit: cessNonAdvit.toFixed(2),
    itemTotal: (taxableValue + cgstAmount + sgstAmount + igstAmount + cessAmount + cessNonAdvit).toFixed(2),
  };
}

function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || !value) {
      return;
    }

    try {
      JSBarcode(ref.current, value, {
        format: 'CODE128',
        width: 2,
        height: 52,
        displayValue: true,
        text: value,
        margin: 6,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch (error) {
      console.error('Unable to render barcode', error);
    }
  }, [value]);

  return <svg ref={ref} className="w-full max-w-[240px] h-20" />;
}

function QRCode({ ewbNo, generatedDate, generatedBy }: { ewbNo: string; generatedDate: string; generatedBy: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const qrData = `${ewbNo.replace(/\s/g, '')}/${generatedBy}/${generatedDate}`;

  useEffect(() => {
    if (!qrData) {
      setDataUrl(null);
      return;
    }

    QRCodeLib.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then(setDataUrl)
      .catch((error) => {
        console.error('Unable to render QR code', error);
      });
  }, [qrData]);

  return (
    <div className="flex flex-col items-center gap-1">
      {dataUrl ? (
        <img src={dataUrl} alt="E-Way Bill QR Code" className="w-24 h-24" />
      ) : (
        <div className="w-24 h-24 border border-gray-200 rounded bg-white" />
      )}
    </div>
  );
}

export default function EWayBillPreview({ data, onClose, ewayBillNumber, generatedDate, validUpto }: Props) {
  const totals = calcTotals(data);
  const ewbNo = resolveEwayBillNumber(data, ewayBillNumber);
  const generatedBy = data.billFromGstin || '';
  const modeLabel = data.mode.charAt(0).toUpperCase() + data.mode.slice(1);
  const typeLabel = `${data.supplyType.charAt(0).toUpperCase() + data.supplyType.slice(1)}-${data.subType.charAt(0).toUpperCase() + data.subType.slice(1)}`;
  const previewGeneratedDate = formatPreviewGeneratedDate(generatedDate);
  const previewValidUpto = formatPreviewValidUpto(validUpto);

  const handlePrint = async () => {
    const previewElement = document.getElementById('ewb-print');
    if (!previewElement) {
      window.alert('Unable to prepare the e-way bill preview for printing.');
      return;
    }

    try {
      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank', 'width=900,height=1200');
      if (!printWindow) {
        window.alert('Please allow pop-ups to open the print preview.');
        return;
      }

      printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>E-Way Bill Preview</title>
    <style>
      @page { size: A4; margin: 8mm; }
      html, body { margin: 0; padding: 0; background: #fff; }
      body { display: flex; justify-content: center; align-items: flex-start; }
      img { width: 100%; height: auto; max-width: 210mm; }
      @media print {
        body { display: block; padding: 0; margin: 0; }
        img { max-width: 100%; width: 100%; margin: 0; }
      }
    </style>
  </head>
  <body>
    <img src="${imgData}" alt="E-Way Bill Preview" />
  </body>
</html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.setTimeout(() => printWindow.print(), 600);
    } catch (error) {
      console.error('Unable to create print image for e-way bill preview', error);
      window.alert('Unable to prepare the print preview. Please try again.');
    }
  };

  const handleDownload = async () => {
    const previewElement = document.getElementById('ewb-print');
    if (!previewElement) {
      window.alert('Unable to prepare the e-way bill preview for download.');
      return;
    }

    try {
      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const widthRatio = usableWidth / canvas.width;
      const heightRatio = usableHeight / canvas.height;
      const scale = Math.min(widthRatio, heightRatio);
      const imgWidth = canvas.width * scale;
      const imgHeight = canvas.height * scale;
      const x = (pageWidth - imgWidth) / 2;
      const y = margin;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      const fileName = `eway-bill-${ewbNo.replace(/\s+/g, '-') || 'preview'}.pdf`;
      const pdfBlob = pdf.output('blob');
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      const pdfWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer');

      if (!pdfWindow) {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      window.setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 10000);
    } catch (error) {
      console.error('Unable to create PDF for e-way bill preview', error);
      window.alert('Unable to create the PDF preview. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6">
      <div className="bg-gray-100 rounded-lg shadow-2xl w-full max-w-4xl mx-4">
        {/* Preview controls */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#cad5e2] rounded-t-lg">
          <span className="text-[#000000] font-semibold text-sm">E-Way Bill Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
            >
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
            >
              <Printer size={13} />
              Print
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
            >
              <X size={13} />
              Close
            </button>
          </div>
        </div>

        {/* Bill Document */}
        <div
          id="ewb-print"
          className="mx-auto my-4 w-full max-w-[210mm] rounded border border-gray-700 bg-white p-6 text-xs font-sans text-black print:mx-0 print:my-0 print:border-0 print:p-0"
          style={{ fontFamily: 'Arial, sans-serif', minHeight: '297mm' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex-1" />
            <div className="flex-1 flex justify-center">
              <h1 className="text-3xl font-bold text-center text-black">E-Way Bill</h1>
            </div>
            <div className="flex-1 flex justify-end">
              <div className="flex flex-col items-center">
                <QRCode ewbNo={ewbNo} generatedDate={previewGeneratedDate} generatedBy={generatedBy} />
              </div>
            </div>
          </div>

          {/* Section 1 - E-Way Bill Details */}
          <BillSection num="1" title="E-WAY BILL Details" />
          <table className="w-full border-collapse mb-3" style={{ border: '1px solid #ccc' }}>
            <tbody>
              <tr>
                <td className="px-2 py-1.5 border border-gray-300 w-1/3">
                  E-Way Bill No: <strong>{ewbNo}</strong>
                </td>
                <td className="px-2 py-1.5 border border-gray-300 w-1/3">
                  Generated Date: <strong>{previewGeneratedDate}</strong>
                </td>
                <td className="px-2 py-1.5 border border-gray-300 w-1/3">
                  Generated By: <strong>{generatedBy}</strong>
                </td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 border border-gray-300">
                  Mode: <strong>{modeLabel}</strong>
                </td>
                <td className="px-2 py-1.5 border border-gray-300">
                  Approx Distance: <strong>{data.approxDistance}km</strong>
                </td>
                <td className="px-2 py-1.5 border border-gray-300">
                  Valid Upto: <strong>{previewValidUpto}</strong>
                </td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 border border-gray-300">
                  Type: <strong>{typeLabel}</strong>
                </td>
                <td className="px-2 py-1.5 border border-gray-300" colSpan={1}>
                  Document Details: <strong>{data.documentType}-{data.documentNo} {data.documentDate}</strong>
                </td>
                <td className="px-2 py-1.5 border border-gray-300">
                  Transaction type: <strong>{data.transactionType}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section 2 - Address */}
          <BillSection num="2" title="Address Details" />
          <table className="w-full border-collapse mb-3" style={{ border: '1px solid #ccc' }}>
            <thead>
              <tr>
                <th
                  className="px-3 py-1.5 text-left text-black text-xs w-1/2"
                  style={{ background: GREEN }}
                >
                  From
                </th>
                <th
                  className="px-3 py-1.5 text-left text-black text-xs w-1/2"
                  style={{ background: GREEN }}
                >
                  To
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border border-gray-300 align-top">
                  <div>GSTIN: <strong>{data.billFromGstin || ''}</strong></div>
                  <div>{data.billFromName || ''}</div>
                  <div>{data.billFromState || ''}</div>
                  <div className="mt-3 text-black">::Dispatch From::</div>
                  <div className="text-black text-xs mt-1">
                    {data.dispatchAddress1}{data.dispatchAddress2 ? `, ${data.dispatchAddress2}` : ''}
                    {data.dispatchPlace ? `, ${data.dispatchPlace}` : ''}
                    {data.dispatchPincode ? ` - ${data.dispatchPincode}` : ''}
                    {data.dispatchState ? `, ${data.dispatchState}` : ''}
                  </div>
                </td>
                <td className="px-3 py-2 border border-gray-300 align-top">
                  <div>GSTIN: <strong>{data.billToGstin || ''}</strong></div>
                  <div>{data.billToName || ''}</div>
                  <div>{data.billToState || ''}</div>
                  <div className="mt-3 text-black">::Ship To::</div>
                  <div className="text-black text-xs mt-1">
                    {data.shipAddress1}{data.shipAddress2 ? `, ${data.shipAddress2}` : ''}
                    {data.shipPlace ? `, ${data.shipPlace}` : ''}
                    {data.shipPincode ? ` - ${data.shipPincode}` : ''}
                    {data.shipState ? `, ${data.shipState}` : ''}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section 3 - Goods Details */}
          <BillSection num="3" title="Goods Details" />
          <table className="w-full border-collapse mb-1" style={{ border: '1px solid #ccc' }}>
            <thead>
              <tr style={{ background: GREEN }} className="text-black text-xs">
                <th className="border border-gray-400 px-2 py-1.5 text-center" rowSpan={2}>HSN Code</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center" rowSpan={2}>Product Name &amp; Desc</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center" rowSpan={2}>Qty</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center" rowSpan={2}>Taxable Amt</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center" colSpan={2}>CGST</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center" colSpan={2}>SGST</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center" colSpan={2}>IGST</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center" colSpan={2}>Cess</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center">Non.Adv</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center">Item Total</th>
              </tr>
              <tr style={{ background: GREEN }} className="text-black text-xs">
                <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">%</th>
                <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Amt</th>
                <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">%</th>
                <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Amt</th>
                <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">%</th>
                <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Amt</th>
                <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">%</th>
                <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Amt</th>
                <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Amt</th>
                <th className="border border-gray-400 px-1 py-1 text-center text-[10px]">Amt</th>
              </tr>
            </thead>
            <tbody>
              {data.items.filter(i => i.name || i.hsn).length === 0 ? (
                <tr>
                  <td colSpan={20} className="text-center text-black py-4 border border-gray-300">No items added</td>
                </tr>
              ) : (
                data.items.filter(i => i.name || i.hsn).map((item, idx) => {
                  const taxes = calculateItemTaxes(item);
                  return (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs">{item.hsn}</td>
                      <td className="border border-gray-300 px-2 py-1 text-xs">{item.name}{item.description ? ` - ${item.description}` : ''}</td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-xs">{item.quantity}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right text-xs">{item.taxableValue || '0'}</td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-xs">{taxes.cgstRate}%</td>
                      <td className="border border-gray-300 px-1 py-1 text-right text-xs">{taxes.cgstAmount}</td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-xs">{taxes.sgstRate}%</td>
                      <td className="border border-gray-300 px-1 py-1 text-right text-xs">{taxes.sgstAmount}</td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-xs">{taxes.igstRate}%</td>
                      <td className="border border-gray-300 px-1 py-1 text-right text-xs">{taxes.igstAmount}</td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-xs">{taxes.cessRate}%</td>
                      <td className="border border-gray-300 px-1 py-1 text-right text-xs">{taxes.cessAmount}</td>
                      <td className="border border-gray-300 px-1 py-1 text-right text-xs">{taxes.cessNonAdvit}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right text-xs font-semibold">{taxes.itemTotal}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Totals */}
          <table className="w-full border-collapse mb-3" style={{ border: '1px solid #ccc' }}>
            <thead>
              <tr style={{ background: LIGHT_GREEN }} className="text-xs font-bold text-black">
                <th className="border border-gray-300 px-2 py-1.5 text-center">Tot. Tax'ble Amt</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center">CGST Amt</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center">SGST Amt</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center">IGST Amt</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center">Cess Amt</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center">Cess Non.Advol Amt</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center">Other Amt</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center" colSpan={2}>Tot. Inv. Amt</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-center font-semibold">
                <td className="border border-gray-300 px-2 py-1.5">{totals.totalTaxable}</td>
                <td className="border border-gray-300 px-2 py-1.5">{totals.totalCgst}</td>
                <td className="border border-gray-300 px-2 py-1.5">{totals.totalSgst}</td>
                <td className="border border-gray-300 px-2 py-1.5">{totals.totalIgst}</td>
                <td className="border border-gray-300 px-2 py-1.5">{totals.totalCessAdvit}</td>
                <td className="border border-gray-300 px-2 py-1.5">{totals.totalCessNon}</td>
                <td className="border border-gray-300 px-2 py-1.5">{(parseFloat(data.otherAmount) || 0).toFixed(2)}</td>
                <td className="border border-gray-300 px-2 py-1.5" colSpan={2}>{totals.totalInv}</td>
              </tr>
            </tbody>
          </table>

          {/* Section 4 - Transportation */}
          <BillSection num="4" title="Transportation Details" />
          <table className="w-full border-collapse mb-3" style={{ border: '1px solid #ccc' }}>
            <tbody>
              <tr>
                <td className="px-3 py-1.5 border border-gray-300 w-1/2">
                  Transport ID &amp; Name: <strong>{formatTransporterDisplay(data.transporterId, data.transporterName)}</strong>
                </td>
                <td className="px-3 py-1.5 border border-gray-300 w-1/2">
                  Transport Doc. No. &amp; Date: <strong>{data.transporterDocNo || '-'} {data.transporterDocDate}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section 5 - Vehicle Details */}
          <BillSection num="5" title="Vehicle Details" />
          <table className="w-full border-collapse mb-5" style={{ border: '1px solid #ccc' }}>
            <thead>
              <tr style={{ background: GREEN }} className="text-black text-xs font-bold text-center">
                <th className="border border-gray-400 px-2 py-1.5">Mode</th>
                <th className="border border-gray-400 px-2 py-1.5">Vehicle / Transport Doc. No. &amp; Date</th>
                <th className="border border-gray-400 px-2 py-1.5">From</th>
                <th className="border border-gray-400 px-2 py-1.5">Entered Date</th>
                <th className="border border-gray-400 px-2 py-1.5">Entered By</th>
                <th className="border border-gray-400 px-2 py-1.5">CEWB No. (If any)</th>
                <th className="border border-gray-400 px-2 py-1.5">Multi Veh. Info (if any)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-center">
                <td className="border border-gray-300 px-2 py-3 text-sm">{modeLabel}</td>
                <td className="border border-gray-300 px-2 py-3">{data.vehicleNo}</td>
                <td className="border border-gray-300 px-2 py-3">{data.dispatchState || data.billFromState}</td>
                <td className="border border-gray-300 px-2 py-3">{previewGeneratedDate}</td>
                <td className="border border-gray-300 px-2 py-3">{data.billFromName}</td>
                <td className="border border-gray-300 px-2 py-3">-</td>
                <td className="border border-gray-300 px-2 py-3">-</td>
              </tr>
            </tbody>
          </table>

          {/* Barcode */}
          <div className="flex flex-col items-center mt-2">
            <Barcode value={ewbNo.replace(/\s/g, '')} />
            
          </div>
        </div>
      </div>
    </div>
  );
}

function BillSection({ num, title }: { num: string; title: string }) {
  return (
    <div
      className="text-black font-bold text-xs px-3 py-1.5 mb-0"
      style={{ background: GREEN }}
    >
      {num}. {title}
    </div>
  );
}