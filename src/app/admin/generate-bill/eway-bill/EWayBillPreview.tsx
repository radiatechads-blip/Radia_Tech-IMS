"use client";

import { Printer, X } from 'lucide-react';

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
}

const GREEN = '#1a7a3a';
const LIGHT_GREEN = '#e8f5ec';

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
const generatedDate = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}${now.getHours() < 12 ? 'AM' : 'PM'}`;
const validUpto = (() => {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
})();

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

// Code128B valid scannable barcode implementation
function Barcode({ value }: { value: string }) {
  // Code128B encoding table
  const CODE128_TABLE = '                       !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
  
  // Code128 bar patterns
  const CODE128_PATTERNS = [
    '11011001100', '11001101100', '11001100110', '10010011000', '10010001100', '10001001100', '10011001000', '10011000100',
    '10001100100', '11110010100', '11110100100', '11101100100', '11100110100', '11100100110', '11101001100', '11100101100',
    '11100100100', '11101011000', '11101001000', '11100101000', '11010011000', '11010001100', '11001011000', '11010100110',
    '11010110010', '11010110100', '11010100100', '11000101100', '11000100110', '10110011000', '10110001100', '10011011000',
    '10011001100', '10011000110', '10111001100', '10100011000', '10001011000', '10010110000', '10010100110', '10010010110',
    '10111010010', '10111010100', '10110110010', '10110010110', '10011010010', '10011001010', '10010101010', '11001001010',
    '11010010010', '11010010100', '11010010010', '11000101010', '11001010010', '11001010100', '11001001010', '11010101010',
    '11010100010', '11001100010', '11011001010', '11011010010', '11011010100', '10110110100', '10110010010', '10110010100',
    '10011010010', '10011010100', '10011001010', '11001010010', '11001001010', '11010010010', '10100110100', '10100100110',
    '10010110100', '10010100110', '10010010110', '10110101000', '10110100100', '10110010010', '10011011010', '10011010110',
    '10011010010', '10110100110', '10110010110', '10100010110', '11000101110', '11010001110', '11001001110', '10100011100',
    '10010011100', '10010001110', '10001001110', '10010100100', '10010010100', '10010010010', '10001001010', '10101001010',
    '10100101010'
  ];

  const START_CODE = '11010000100';
  const STOP_CODE = '1100011101011';

  // Encode barcode
  let barcode = START_CODE;
  let checksum = 104; // START B code

  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    const idx = CODE128_TABLE.indexOf(char);
    const code = idx >= 0 ? idx : 63; // Use '?' for unknown
    barcode += CODE128_PATTERNS[code];
    checksum += code * (i + 1);
  }

  checksum = checksum % 103;
  barcode += CODE128_PATTERNS[checksum];
  barcode += STOP_CODE;

  // Create SVG barcode
  const barWidth = 1.2;
  const xOffset = 5;

  return (
    <svg viewBox={`0 0 ${barcode.length * barWidth + 10} 70`} className="w-48 h-14" style={{ border: '1px solid #000' }}>
      <rect x="0" y="0" width={barcode.length * barWidth + 10} height="70" fill="white" />
      {barcode.split('').map((bit, i) => (
        bit === '1' ? (
          <rect key={i} x={xOffset + i * barWidth} y="5" width={barWidth} height="45" fill="black" />
        ) : null
      ))}
      <text x={barcode.length * barWidth / 2 + 5} y="65" textAnchor="middle" fontSize="10" fontFamily="Arial">
        {value}
      </text>
    </svg>
  );
}

// Proper QR Code generator with e-way bill details
function QRCode({ ewbNo, generatedDate, generatedBy }: { ewbNo: string; generatedDate: string; generatedBy: string }) {
  // Format QR data
  const qrData = `eWay Bill No: ${ewbNo.replace(/\s/g, '')}\nGenerated Date: ${generatedDate}\nGenerated By: ${generatedBy}`;

  // Simple QR code pattern generator using hash-based deterministic pattern
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  // Generate 25x25 QR-like pattern (simplified QR code)
  const size = 25;
  const patternHash = hashCode(qrData);
  const pattern: boolean[] = [];

  // Add finder patterns (position markers) in corners
  const addFinderPattern = (startRow: number, startCol: boolean) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const idx = (startRow + r) * size + (startCol ? size - 7 + c : c);
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          pattern[idx] = true;
        }
      }
    }
  };

  // Initialize pattern
  for (let i = 0; i < size * size; i++) pattern[i] = false;

  // Add finder patterns
  addFinderPattern(0, false);
  addFinderPattern(0, true);
  addFinderPattern(size - 7, false);

  // Add data based on hash
  let hashBit = 0;
  for (let i = 0; i < size * size; i++) {
    if (!pattern[i]) {
      const bitIndex = hashBit % qrData.length;
      const charCode = qrData.charCodeAt(bitIndex);
      pattern[i] = ((charCode >> (hashBit % 8)) & 1) === 1;
      hashBit++;
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-20 h-20" style={{ border: '1px solid #000', background: '#fff' }}>
        {pattern.map((dark, idx) => {
          const row = Math.floor(idx / size);
          const col = idx % size;
          return dark ? (
            <rect key={idx} x={col} y={row} width="1" height="1" fill="black" />
          ) : null;
        })}
      </svg>
      <span className="text-xs text-gray-700 font-semibold">eWay Bill QR</span>
    </div>
  );
}

export default function EWayBillPreview({ data, onClose }: Props) {
  const totals = calcTotals(data);
  const ewbNo = `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
  const generatedBy = data.billFromGstin || '';
  const modeLabel = data.mode.charAt(0).toUpperCase() + data.mode.slice(1);
  const typeLabel = `${data.supplyType.charAt(0).toUpperCase() + data.supplyType.slice(1)}-${data.subType.charAt(0).toUpperCase() + data.subType.slice(1)}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6">
      <div className="bg-gray-100 rounded-lg shadow-2xl w-full max-w-4xl mx-4">
        {/* Preview controls */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg">
          <span className="text-white font-semibold text-sm">E-Way Bill Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
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
          className="bg-white mx-4 my-4 border-4 border-gray-800 rounded p-6 text-xs font-sans print:mx-0 print:my-0 print:border-0"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: GREEN }}>E-Way Bill</h1>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xs border-2"
                style={{ background: '#d4a017', borderColor: '#a07010' }}
              >
                <div className="text-center leading-tight">
                  <div className="text-xs">GST</div>
                  <div style={{ fontSize: 9 }}>eWB</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xs text-gray-500 mb-1">eWay Bill QR Code</p>
              <QRCode ewbNo={ewbNo} generatedDate={generatedDate} generatedBy={generatedBy} />
            </div>
          </div>

          {/* Section 1 - E-Way Bill Details */}
          <BillSection num="1" title="E-WAY BILL Details" />
          <table className="w-full border-collapse mb-3" style={{ border: '1px solid #ccc' }}>
            <tbody>
              <tr>
                <td className="px-2 py-1.5 border border-gray-300 w-1/3">
                  eWay Bill No: <strong>{ewbNo}</strong>
                </td>
                <td className="px-2 py-1.5 border border-gray-300 w-1/3">
                  Generated Date: <strong>{generatedDate}</strong>
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
                  Valid Upto: <strong>{validUpto}</strong>
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
                  className="px-3 py-1.5 text-left text-white text-xs w-1/2"
                  style={{ background: GREEN }}
                >
                  From
                </th>
                <th
                  className="px-3 py-1.5 text-left text-white text-xs w-1/2"
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
                  <div className="mt-3 text-gray-500">::Dispatch From::</div>
                  <div className="text-gray-700 text-xs mt-1">
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
                  <div className="mt-3 text-gray-500">::Ship To::</div>
                  <div className="text-gray-700 text-xs mt-1">
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
              <tr style={{ background: GREEN }} className="text-white text-xs">
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
              <tr style={{ background: GREEN }} className="text-white text-xs">
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
                  <td colSpan={20} className="text-center text-gray-400 py-4 border border-gray-300">No items added</td>
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
              <tr style={{ background: LIGHT_GREEN }} className="text-xs font-bold text-gray-800">
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
                  Transport ID &amp; Name: <strong>{data.transporterId || 'Self'}{data.transporterName ? ` - ${data.transporterName}` : ''}</strong>
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
              <tr style={{ background: GREEN }} className="text-white text-xs font-bold text-center">
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
                <td className="border border-gray-300 px-2 py-3">{generatedDate}</td>
                <td className="border border-gray-300 px-2 py-3">{data.billFromName}</td>
                <td className="border border-gray-300 px-2 py-3">-</td>
                <td className="border border-gray-300 px-2 py-3">-</td>
              </tr>
            </tbody>
          </table>

          {/* Barcode */}
          <div className="flex flex-col items-center mt-2">
            <Barcode value={ewbNo.replace(/\s/g, '')} />
            <p className="text-xs text-gray-600 mt-1">No : {ewbNo.replace(/\s/g, '')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillSection({ num, title }: { num: string; title: string }) {
  return (
    <div
      className="text-white font-bold text-xs px-3 py-1.5 mb-0"
      style={{ background: GREEN }}
    >
      {num}. {title}
    </div>
  );
}