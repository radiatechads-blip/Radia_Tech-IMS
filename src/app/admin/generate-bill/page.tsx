"use client";

import AdminShell from "@/components/admin/AdminShell";
import AnnexurePreview from "@/components/admin/AnnexurePreview";
import InvoicePreview from "@/components/admin/InvoicePreview";
import ProformaInvoicePreview from "@/components/admin/ProformaInvoicePreview";
import QuotationPreview from "@/components/admin/QuotationPreview";
import { getConversionSourceLabel } from "@/lib/invoicePayload";
import { getBillTypeLabel, getDuplicateCopyInvoiceNumber, getInvoiceDuplicateFlag, getInvoiceEditRoute } from "@/lib/invoiceRoute";
import jsPDF from "jspdf";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
// NOTE: use html2canvas-pro, not html2canvas. Tailwind v4 emits modern CSS
// color functions (oklch/oklab/color-mix) for utility classes like
// bg-slate-950/70 or text-emerald-700. Plain html2canvas can't parse those
// and throws "Attempting to parse an unsupported color function", which is
// why Open PDF / Save PDF failed. html2canvas-pro is a drop-in fork that
// adds support for them.
import html2canvas from "html2canvas-pro";

import type { InvoiceSummary } from "@/lib/invoiceRoute";

// The list/detail API always includes a `documentType` field
// ("invoice" | "proforma" | "annexure") on every record, even though
// the InvoiceSummary type from invoiceRoute.ts doesn't declare it.
// We use this locally whenever we need to read or set that field.
//
// Also carries the conversion / duplication metadata we stamp onto
// records so downstream pages (and this list) can show:
//   - convertedFromProforma / sourceProformaNumber: this record was
//     created by converting a Proforma Invoice into a Tax Invoice.
//   - isDuplicate: this record was created via the "Duplicate" action.
type InvoiceWithDocType = InvoiceSummary & {
  documentType?: string;
  convertedFromProforma?: boolean;
  sourceProformaNumber?: string;
  isDuplicate?: boolean;
  convertedInvoiceNumber?: string;
};

const DOCUMENT_TYPE_OPTIONS = [
  "Quotation",
  "Tax Invoice",
  "Annexure",
  "Pending Material",
  "Party Statement",
  "Proforma Invoice",
  "Cancelled",
] as const;

type DocumentType = (typeof DOCUMENT_TYPE_OPTIONS)[number];
type InvoiceDateFilter =
  | "all"
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "thisYear"
  | "custom";
type BillHistorySearchField = "date" | "invoiceNumber" | "customerName";

const MENU_WIDTH = 192;
const MENU_HEIGHT_ESTIMATE = 280; // Adjusted to a more realistic expectation

const PAYMENT_TERMS_OPTIONS = [
  "Due on Receipt",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "Custom",
];

interface ConvertOptions {
  invoiceDate: string;
  paymentTerms: string;
  conversionNote: string;
  markOriginalConverted: boolean;
}

// Small helper: tries to read a JSON error body ({ error: "..." }) off a
// failed fetch Response and falls back to a generic message if the body
// isn't JSON or doesn't have that shape. Used so alerts show the *real*
// server-side reason (e.g. "Unknown argument `status`") instead of a
// useless generic string, which was previously hiding the actual cause
// of Cancel / Retrieve failures.
async function extractErrorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json();
    if (body && typeof body.error === "string" && body.error.trim()) {
      return body.error;
    }
  } catch {
    // response body wasn't JSON — ignore and use fallback
  }
  return fallback;
}

export default function GenerateBillPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSummary | null>(
    null,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Preview modal: ref to the rendered invoice markup (used to build a
  // real PDF via html2canvas + jsPDF) and a busy-state for the
  // Open PDF / Save PDF buttons.
  const previewContentRef = useRef<HTMLDivElement>(null);
  const [pdfBusyAction, setPdfBusyAction] = useState<"open" | "save" | null>(
    null,
  );

  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(
    "Tax Invoice",
  );
  const [dateFilter, setDateFilter] = useState<InvoiceDateFilter>("all");
  const [searchField, setSearchField] = useState<BillHistorySearchField>(
    "invoiceNumber",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [isDocTypeMenuOpen, setIsDocTypeMenuOpen] = useState(false);
  const docTypeMenuRef = useRef<HTMLDivElement>(null);

  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; openBelow: boolean } | null>(
    null,
  );

  // Convert Proforma → Tax Invoice modal
  const [convertModalInvoice, setConvertModalInvoice] =
    useState<InvoiceSummary | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedInvoiceNumbers, setConvertedInvoiceNumbers] = useState<Record<string, string>>({});
  const [convertOptions, setConvertOptions] = useState<ConvertOptions>({
    invoiceDate: new Date().toISOString().split("T")[0],
    paymentTerms: "Due on Receipt",
    conversionNote: "",
    markOriginalConverted: true,
  });

  const normalizeInvoiceRecord = (invoice: InvoiceSummary): InvoiceSummary => {
    const meta = invoice as InvoiceWithDocType;
    const normalized = { ...invoice } as InvoiceWithDocType;

    if (typeof meta.convertedToTaxInvoice === "boolean") {
      normalized.convertedToTaxInvoice = meta.convertedToTaxInvoice;
    } else if (typeof invoice.convertedToTaxInvoice === "boolean") {
      normalized.convertedToTaxInvoice = invoice.convertedToTaxInvoice;
    }

    if (typeof meta.convertedInvoiceNumber === "string") {
      normalized.convertedInvoiceNumber = meta.convertedInvoiceNumber;
    }

    if (typeof meta.convertedInvoiceId === "string") {
      normalized.convertedInvoiceId = meta.convertedInvoiceId;
    }

    if (typeof meta.convertedFromProforma === "boolean") {
      normalized.convertedFromProforma = meta.convertedFromProforma;
    }

    if (typeof meta.sourceProformaNumber === "string") {
      normalized.sourceProformaNumber = meta.sourceProformaNumber;
    }

    const inferredDuplicate = getInvoiceDuplicateFlag(meta as InvoiceSummary);

    if (typeof meta.isDuplicate === "boolean") {
      normalized.isDuplicate = meta.isDuplicate;
    } else if (typeof invoice.isDuplicate === "boolean") {
      normalized.isDuplicate = invoice.isDuplicate;
    } else if (inferredDuplicate) {
      normalized.isDuplicate = inferredDuplicate;
    }

    return normalized as InvoiceSummary;
  };

  const loadInvoices = async () => {
    try {
      const response = await fetch("/api/invoices");
      if (!response.ok) return;
      const data = await response.json();
      const nextInvoices = Array.isArray(data)
        ? data.map((invoice) => normalizeInvoiceRecord(invoice as InvoiceSummary))
        : [];
      setInvoices(nextInvoices);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadInvoices();
    };
    void load();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        docTypeMenuRef.current &&
        !docTypeMenuRef.current.contains(event.target as Node)
      ) {
        setIsDocTypeMenuOpen(false);
      }
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setOpenActionMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!openActionMenuId) return;

    const reposition = () => {
      const trigger = document.getElementById(
        `action-trigger-${openActionMenuId}`,
      );
      if (!trigger) {
        setMenuPos(null);
        return;
      }
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openBelow = spaceBelow >= MENU_HEIGHT_ESTIMATE;
      
      // If opening below, track from bottom. If above, track from top edge.
      const top = openBelow ? rect.bottom + 4 : rect.top - 4;
      const left = Math.max(
        8,
        Math.min(window.innerWidth - MENU_WIDTH - 8, rect.right - MENU_WIDTH),
      );
      setMenuPos({ top, left, openBelow });
    };

    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [openActionMenuId]);

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleDateString("en-IN");
  };

  const getBillTypeBadge = (invoice: InvoiceSummary) => {
    const label = getBillTypeLabel(invoice);
    const invoiceMeta = invoice as InvoiceWithDocType;

    const toneClasses: Record<string, string> = {
      "Proforma Invoice": "bg-red-50 text-red-700 ring-red-600/10",
      Annexure: "bg-orange-50 text-orange-700 ring-orange-600/10",
      "Pending Material": "bg-pink-50 text-pink-700 ring-pink-600/10",
      Quotation: "bg-amber-50 text-amber-700 ring-amber-600/10",
    };
    const classes =
      toneClasses[label] ??
      "bg-emerald-50 text-emerald-700 ring-emerald-600/10";

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${classes}`}
        >
          {label}
        </span>
        {Boolean(
          invoiceMeta.convertedToTaxInvoice || invoice.convertedToTaxInvoice,
        ) && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Converted
          </span>
        )}
        {Boolean(
          invoiceMeta.convertedToTaxInvoice ||
          invoice.convertedToTaxInvoice ||
          invoiceMeta.convertedFromProforma ||
          invoice.convertedFromProforma,
        ) && (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10">
            {getBillTypeLabel(invoice) === "Quotation" ? "From Quotation" : "From Proforma"}
            {invoiceMeta.sourceProformaNumber || invoice.sourceProformaNumber
              ? ` (${invoiceMeta.sourceProformaNumber || invoice.sourceProformaNumber})`
              : ""}
          </span>
        )}
        {Boolean(invoiceMeta.isDuplicate || getInvoiceDuplicateFlag(invoiceMeta as InvoiceSummary)) && (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-400/20">
            Duplicate
          </span>
        )}
      </div>
    );
  };

  const getEditRoute = (invoice: InvoiceSummary) =>
    getInvoiceEditRoute(invoice);

  const getApiDocumentType = (
    invoice: InvoiceSummary,
  ): "invoice" | "proforma" | "annexure" | "quotation" => {
    const label = getBillTypeLabel(invoice);
    if (label === "Proforma Invoice") return "proforma";
    if (label === "Annexure") return "annexure";
    if (label === "Quotation") return "quotation";
    return "invoice";
  };

  const renderPreviewForInvoice = (invoice: InvoiceSummary) => {
    const label = getBillTypeLabel(invoice);
    if (label === "Proforma Invoice") {
      return <ProformaInvoicePreview invoice={invoice} />;
    }
    if (label === "Annexure") {
      return <AnnexurePreview invoice={invoice} />;
    }
    if (label === "Quotation") {
      return (
        <QuotationPreview
          partyName={invoice.partyName}
          contactPerson={invoice.contactPerson}
          gstin={invoice.gstin}
          phone={invoice.phone}
          email={invoice.email}
          address={invoice.address}
          city={invoice.city}
          state={invoice.state}
          pincode={invoice.pincode}
          quotationNumber={invoice.invoiceNumber}
          quotationDate={invoice.invoiceDate}
          validUntil={invoice.dueDate as string | undefined}
          poDate={invoice.poDate}
          poNo={invoice.poNo}
          placeOfSupply={invoice.placeOfSupply}
          items={invoice.items}
          taxType={invoice.taxType as "cgst-sgst" | "igst" | "none" | undefined}
          notes={invoice.notes}
          terms={invoice.terms}
          extraDiscountAmount={invoice.extraDiscountAmount}
          roundOffAmount={invoice.roundOff}
          paymentMode={invoice.paymentMode}
          authorizedSignature={invoice.authorizedSignature}
          signatureImage={invoice.signatureImage}
          bankDetails={invoice.bankDetails}
          convertedFromProforma={
            invoice.convertedFromProforma as boolean | undefined
          }
          sourceProformaNumber={
            invoice.sourceProformaNumber as string | undefined
          }
        />
      );
    }
    return <InvoicePreview invoice={invoice} />;
  };

  const openPreview = (invoice: InvoiceSummary) => {
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setSelectedInvoice(null);
  };

  const handlePrintPreview = (invoice: InvoiceSummary) => {
    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) {
      window.alert("Please allow pop-ups to open the print preview.");
      return;
    }
    const markup = renderToStaticMarkup(renderPreviewForInvoice(invoice));
    const origin = window.location.origin;
    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <base href="${origin}" />
    <title>${invoice.billType || "Tax Invoice"} Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}</style>
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    ${markup}
  </body>
</html>`;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    const triggerPrint = () => {
      const imgs = printWindow.document.images;
      let pending = imgs.length;
      if (pending === 0) {
        printWindow.print();
        return;
      }
      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        if (img.complete) {
          pending--;
        } else {
          img.addEventListener("load", () => {
            pending--;
            if (pending === 0) printWindow.print();
          });
          img.addEventListener("error", () => {
            pending--;
            if (pending === 0) printWindow.print();
          });
        }
      }
      if (pending === 0) printWindow.print();
    };
    printWindow.onload = () => window.setTimeout(triggerPrint, 600);
  };

  const buildPdfFromElement = async (element: HTMLElement) => {
    const pageElements = Array.from(element.querySelectorAll<HTMLElement>(".invoice-preview-page"));
    const pages = pageElements.length > 0 ? pageElements : [element];

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let index = 0; index < pages.length; index += 1) {
      const pageElement = pages[index];
      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;

      if (index > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "PNG", (pageWidth - imgWidth) / 2, 0, imgWidth, imgHeight);
    }

    return pdf;
  };

  const waitForImagesToLoad = (container: HTMLElement) =>
    new Promise<void>((resolve) => {
      const imgs = Array.from(container.querySelectorAll("img"));
      if (imgs.length === 0) {
        resolve();
        return;
      }
      let pending = imgs.length;
      const done = () => {
        pending -= 1;
        if (pending <= 0) resolve();
      };
      imgs.forEach((img) => {
        if (img.complete) done();
        else {
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }
      });
    });

  const renderInvoiceToPdf = async (invoice: InvoiceSummary) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.width = "896px";
    container.style.background = "#ffffff";
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(renderPreviewForInvoice(invoice));

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 50));
      await waitForImagesToLoad(container);
      return await buildPdfFromElement(container);
    } finally {
      root.unmount();
      container.remove();
    }
  };

  const handleOpenPdfFromPreview = () => {
    if (!previewContentRef.current || pdfBusyAction) return;
    const pdfWindow = window.open("", "_blank");
    if (!pdfWindow) {
      window.alert("Please allow pop-ups to open the PDF.");
      return;
    }
    pdfWindow.document.write(
      "<title>Loading PDF…</title><body style='font-family:Arial,Helvetica,sans-serif;padding:24px;color:#475569;'>Opening PDF…</body>",
    );
    setPdfBusyAction("open");
    (async () => {
      try {
        const pdf = await buildPdfFromElement(previewContentRef.current!);
        const blobUrl = pdf.output("bloburl");
        pdfWindow.location.href = blobUrl as unknown as string;
      } catch (err) {
        console.error("Open PDF failed:", err);
        pdfWindow.close();
        window.alert(
          `Could not generate the PDF.${err instanceof Error ? ` (${err.message})` : ""} Please try again.`,
        );
      } finally {
        setPdfBusyAction(null);
      }
    })();
  };

  const handleSavePdfFromPreview = async () => {
    if (!previewContentRef.current || !selectedInvoice || pdfBusyAction) return;
    setPdfBusyAction("save");
    try {
      const pdf = await buildPdfFromElement(previewContentRef.current);
      const invoiceNumberForFile = getDuplicateCopyInvoiceNumber(selectedInvoice.invoiceNumber, false) || "invoice";
      const fileName = `${invoiceNumberForFile}.pdf`.replace(/[\\/:*?"<>|]/g, "-");
      pdf.save(fileName);
    } catch (err) {
      console.error("Save PDF failed:", err);
      window.alert(
        `Could not generate the PDF.${err instanceof Error ? ` (${err.message})` : ""} Please try again.`,
      );
    } finally {
      setPdfBusyAction(null);
    }
  };

  const handleViewEdit = (invoice: InvoiceSummary) => {
    setOpenActionMenuId(null);
    router.push(getEditRoute(invoice));
  };

  const handleGenerateInvoice = (invoice: InvoiceSummary) => {
    setOpenActionMenuId(null);
    const sourceId = invoice.id ?? "";
    router.push(
      `/admin/generate-bill/invoice?sourceId=${encodeURIComponent(sourceId)}&sourceType=${encodeURIComponent(getBillTypeLabel(invoice))}`,
    );
  };

  const handleDuplicate = async (invoice: InvoiceSummary) => {
    setOpenActionMenuId(null);
    const rest = (() => {
      const { ...withoutMeta } = invoice as InvoiceWithDocType;
      delete withoutMeta.id;
      delete withoutMeta.convertedToTaxInvoice;
      delete withoutMeta.convertedInvoiceId;
      return withoutMeta;
    })();
    const payload = {
      ...rest,
      invoiceNumber: getDuplicateCopyInvoiceNumber(invoice.invoiceNumber, true),
      createdAt: new Date().toISOString(),
      status: "Active",
      convertedToTaxInvoice: false,
      convertedInvoiceId: undefined,
      isDuplicate: true,
    };
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          "Could not duplicate this document.",
        );
        window.alert(message);
        return;
      }
      await loadInvoices();
    } catch {
      window.alert("Could not duplicate this document.");
    }
  };

  const handleOpenPdf = (invoice: InvoiceSummary) => {
    setOpenActionMenuId(null);
    const pdfWindow = window.open("", "_blank");
    if (!pdfWindow) {
      window.alert("Please allow pop-ups to open the PDF.");
      return;
    }
    pdfWindow.document.write(
      "<title>Loading PDF…</title><body style='font-family:Arial,Helvetica,sans-serif;padding:24px;color:#475569;'>Opening PDF…</body>",
    );
    (async () => {
      try {
        const pdf = await renderInvoiceToPdf(invoice);
        const blobUrl = pdf.output("bloburl");
        pdfWindow.location.href = blobUrl as unknown as string;
      } catch (err) {
        console.error("Open PDF failed:", err);
        pdfWindow.close();
        window.alert(
          `Could not generate the PDF.${err instanceof Error ? ` (${err.message})` : ""} Please try again.`,
        );
      }
    })();
  };

  const handlePreview = (invoice: InvoiceSummary) => {
    setOpenActionMenuId(null);
    openPreview(invoice);
  };

  const handleCopyLink = async (invoice: InvoiceSummary) => {
    setOpenActionMenuId(null);
    const url = `${window.location.origin}${getEditRoute(invoice)}`;
    try {
      await navigator.clipboard.writeText(url);
      window.alert("Link copied to clipboard.");
    } catch {
      window.alert(url);
    }
  };

  const handleCancel = async (invoice: InvoiceSummary) => {
    setOpenActionMenuId(null);
    if (
      !window.confirm(
        `Cancel ${invoice.invoiceNumber}? It will be moved to the Cancelled category.`,
      )
    )
      return;
    try {
      const response = await fetch(
        `/api/invoices?id=${encodeURIComponent(invoice.id ?? "")}&documentType=${getApiDocumentType(invoice)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Cancelled" }),
        },
      );
      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          "Could not cancel this document.",
        );
        window.alert(message);
        return;
      }
      setInvoices((current) =>
        current.map((inv) =>
          inv.id === invoice.id ? { ...inv, status: "Cancelled" } : inv,
        ),
      );
    } catch {
      window.alert("Could not cancel this document.");
    }
  };

  const handleRetrieve = async (invoice: InvoiceSummary) => {
    setOpenActionMenuId(null);
    try {
      const response = await fetch(
        `/api/invoices?id=${encodeURIComponent(invoice.id ?? "")}&documentType=${getApiDocumentType(invoice)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Active" }),
        },
      );
      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          "Could not retrieve this document.",
        );
        window.alert(message);
        return;
      }
      setInvoices((current) =>
        current.map((inv) =>
          inv.id === invoice.id ? { ...inv, status: "Active" } : inv,
        ),
      );
    } catch {
      window.alert("Could not retrieve this document.");
    }
  };

  const handleDelete = async (invoice: InvoiceSummary) => {
    setOpenActionMenuId(null);
    if (
      !window.confirm(`Delete ${invoice.invoiceNumber}? This cannot be undone.`)
    )
      return;
    try {
      const response = await fetch(
        `/api/invoices?id=${encodeURIComponent(invoice.id ?? "")}&documentType=${getApiDocumentType(invoice)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          "Could not delete this document.",
        );
        window.alert(message);
        return;
      }
      setInvoices((current) => current.filter((inv) => inv.id !== invoice.id));
      if (selectedInvoice?.id === invoice.id) closePreview();
    } catch {
      window.alert("Could not delete this document.");
    }
  };

  const openConvertModal = (invoice: InvoiceSummary) => {
    setOpenActionMenuId(null);
    const sourceDocumentType = getBillTypeLabel(invoice) === "Quotation" ? "quotation" : "proforma";
    setConvertOptions({
      invoiceDate: new Date().toISOString().split("T")[0],
      paymentTerms: "Due on Receipt",
      conversionNote: `Converted from ${getConversionSourceLabel(sourceDocumentType)} ${invoice.invoiceNumber}`,
      markOriginalConverted: false,
    });
    setConvertModalInvoice(invoice);
  };

  const handleConvert = async () => {
    if (!convertModalInvoice) return;
    setIsConverting(true);

    const rest = (() => {
      const { ...withoutMeta } = convertModalInvoice as InvoiceWithDocType;
      delete withoutMeta.id;
      delete withoutMeta.billType;
      delete withoutMeta.documentType;
      delete withoutMeta.convertedToTaxInvoice;
      delete withoutMeta.convertedInvoiceId;
      return withoutMeta;
    })();

    const sourceInvoiceNumber = convertModalInvoice.invoiceNumber ?? "";
    const sourceDocumentType = getBillTypeLabel(convertModalInvoice) === "Quotation" ? "quotation" : "proforma";
    const taxInvoiceNumber = `TI-${sourceInvoiceNumber.replace(/^[A-Z]+-?/i, "")}`;

    const newTaxInvoice = {
      ...rest,
      documentType: "invoice",
      billType: "Tax Invoice",
      invoiceNumber: taxInvoiceNumber,
      invoiceDate: convertOptions.invoiceDate,
      paymentTerms: convertOptions.paymentTerms,
      notes: convertOptions.conversionNote
        ? `${convertOptions.conversionNote}${rest.notes ? `\n${rest.notes}` : ""}`
        : rest.notes,
      createdAt: new Date().toISOString(),
      status: "Active",
      convertedToTaxInvoice: false,
      sourceProformaNumber: sourceInvoiceNumber,
      convertedFromProforma: sourceDocumentType === "proforma",
    };

    try {
      const createRes = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTaxInvoice),
      });
      if (!createRes.ok) throw new Error("Failed to create Tax Invoice");
      const createdInvoice = (await createRes.json().catch(() => null)) as { id?: string; invoiceNumber?: string } | null;
      const createdInvoiceNumber = String(createdInvoice?.invoiceNumber || taxInvoiceNumber);

      if (createdInvoice?.id) {
        const rowKey = convertModalInvoice.id ?? convertModalInvoice.invoiceNumber ?? "";
        const conversionPayload = {
          ...convertModalInvoice,
          convertedToTaxInvoice: true,
          convertedInvoiceId: createdInvoice.id,
          convertedInvoiceNumber: createdInvoiceNumber,
          convertedFromProforma: sourceDocumentType === "proforma",
          sourceProformaNumber: sourceInvoiceNumber,
        };

        await fetch(
          `/api/invoices?id=${encodeURIComponent(convertModalInvoice.id ?? "")}&documentType=${sourceDocumentType}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(conversionPayload),
          },
        );

        setConvertedInvoiceNumbers((current) => ({
          ...current,
          [rowKey]: createdInvoiceNumber,
        }));
        setInvoices((current) =>
          current.map((inv) => {
            const invKey = inv.id ?? inv.invoiceNumber ?? "";
            return invKey === rowKey
              ? {
                  ...inv,
                  convertedToTaxInvoice: true,
                  convertedInvoiceNumber: createdInvoiceNumber,
                  convertedInvoiceId: createdInvoice.id,
                  convertedFromProforma: sourceDocumentType === "proforma",
                  sourceProformaNumber: sourceInvoiceNumber,
                }
              : inv;
          }),
        );
        window.open(
          `/admin/generate-bill/invoice?invoiceId=${encodeURIComponent(createdInvoice.id)}`,
          "_blank",
          "noopener,noreferrer",
        );
      }

      setConvertModalInvoice(null);
      window.alert(
        `${getConversionSourceLabel(sourceDocumentType)} successfully converted to Tax Invoice (${createdInvoiceNumber}).`,
      );
    } catch {
      window.alert("Conversion failed. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const getDateRangeForFilter = () => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (dateFilter === "custom") {
      if (!customStartDate || !customEndDate) {
        return null;
      }
      const start = new Date(`${customStartDate}T00:00:00`);
      const end = new Date(`${customEndDate}T23:59:59`);
      return { start, end };
    }

    if (dateFilter === "thisMonth") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return { start, end };
    }

    if (dateFilter === "lastMonth") {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end };
    }

    if (dateFilter === "thisQuarter") {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
      const start = new Date(today.getFullYear(), quarterStartMonth, 1);
      const end = new Date(today.getFullYear(), quarterStartMonth + 3, 1);
      return { start, end };
    }

    if (dateFilter === "thisYear") {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear() + 1, 0, 1);
      return { start, end };
    }

    return { start: new Date(0), end: new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate() + 1) };
  };

  const matchesDateFilter = (invoice: InvoiceSummary) => {
    if (dateFilter === "all") {
      return true;
    }

    const range = getDateRangeForFilter();
    if (!range) {
      return true;
    }

    const value = invoice.invoiceDate || invoice.createdAt;
    if (!value) {
      return false;
    }

    const invoiceDate = new Date(value);
    if (Number.isNaN(invoiceDate.getTime())) {
      return false;
    }

    return invoiceDate >= range.start && invoiceDate < range.end;
  };

  const normalizeSearchText = (value?: string | null) =>
    String(value ?? "").trim().toLowerCase();

  const matchesSearchFilter = (invoice: InvoiceSummary) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return true;
    }

    if (searchField === "date") {
      const rawDate = invoice.invoiceDate || invoice.createdAt;
      if (!rawDate) {
        return false;
      }

      const invoiceDate = new Date(rawDate);
      if (Number.isNaN(invoiceDate.getTime())) {
        return false;
      }

      const searchableValues = [
        invoiceDate.toISOString().split("T")[0],
        invoiceDate.toLocaleDateString("en-IN"),
        invoiceDate.toLocaleDateString("en-US"),
        invoiceDate.toLocaleDateString("en-GB"),
      ];

      return searchableValues.some((value) =>
        normalizeSearchText(value).includes(term),
      );
    }

    if (searchField === "invoiceNumber") {
      return normalizeSearchText(invoice.invoiceNumber).includes(term);
    }

    return normalizeSearchText(invoice.partyName).includes(term);
  };

  const baseFilteredInvoices = invoices
    .filter(matchesDateFilter)
    .filter(matchesSearchFilter);

  const filteredInvoices = selectedDocType
    ? selectedDocType === "Cancelled"
      ? baseFilteredInvoices.filter((invoice) => invoice.status === "Cancelled")
      : baseFilteredInvoices.filter(
          (invoice) =>
            getBillTypeLabel(invoice) === selectedDocType &&
            invoice.status !== "Cancelled",
        )
    : [];

  const totalAmount = filteredInvoices.reduce(
    (sum, inv) => sum + Number(inv.grandTotal || 0),
    0,
  );

  const totalLabelMap: Record<DocumentType, string> = {
    Quotation: "Total Quotation",
    "Tax Invoice": "Total Tax Invoice",
    Annexure: "Total Annexure",
    "Pending Material": "Total Pending Material",
    "Party Statement": "Total Party Statement",
    "Proforma Invoice": "Total Proforma Invoice",
    Cancelled: "Total Cancelled",
  };

  const totalColorMap: Record<DocumentType, string> = {
    Quotation: "border-amber-200 bg-amber-50 text-amber-900",
    "Tax Invoice": "border-emerald-200 bg-emerald-50 text-emerald-900",
    Annexure: "border-orange-200 bg-orange-50 text-orange-900",
    "Pending Material": "border-pink-200 bg-pink-50 text-pink-900",
    "Party Statement": "border-amber-300 bg-amber-100 text-amber-900",
    "Proforma Invoice": "border-red-200 bg-red-50 text-red-900",
    Cancelled: "border-slate-300 bg-slate-100 text-slate-900",
  };

  const totalAccentMap: Record<DocumentType, string> = {
    Quotation: "text-amber-600",
    "Tax Invoice": "text-emerald-600",
    Annexure: "text-orange-600",
    "Pending Material": "text-pink-600",
    "Party Statement": "text-amber-700",
    "Proforma Invoice": "text-red-600",
    Cancelled: "text-slate-600",
  };

  return (
    <AdminShell
      title="Generate Bill"
      description="Create quotation or invoice documents for your customers."
      action={
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/admin/generate-bill/eway-bill"
              className="inline-flex items-center rounded-xl border border-blue-300 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              E-Way Bill
            </Link>
            <Link
              href="/admin/generate-bill/e-invoice"
              className="inline-flex items-center rounded-xl border border-yellow-300 bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-yellow-600"
            >
              E-Invoice
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/admin/generate-bill/quotation"
              className="inline-flex items-center rounded-xl border border-amber-300 bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
            >
              Quotation
            </Link>
            <Link
              href="/admin/generate-bill/invoice"
              className="inline-flex items-center rounded-xl border border-emerald-300 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Tax Invoice
            </Link>
            <Link
              href="/admin/generate-bill/long-bills"
              className="inline-flex items-center rounded-xl border border-orange-300 bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              Annexure
            </Link>
            <Link
              href="/admin/generate-bill/pending-material"
              className="inline-flex items-center rounded-xl border border-pink-300 bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700"
            >
              Pending Material
            </Link>
            <Link
              href="/admin/generate-bill/party-statement"
              className="inline-flex items-center rounded-xl border border-amber-500 bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-900"
            >
              Party Statement
            </Link>
            <Link
              href="/admin/generate-bill/proforma-invoice"
              className="inline-flex items-center rounded-xl border border-red-300 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              Proforma Invoice
            </Link>
          </div>
        </div>
      }
    >
     
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Generated Billing History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pick a document type to view its generated list.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm transition ${
              searchTerm.trim() 
                ? "border-blue-300 bg-blue-50 text-blue-600" 
                : "border-slate-200 bg-white text-slate-600"
            }`}>
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 flex-shrink-0 ${searchTerm.trim() ? "text-blue-500" : "text-slate-400"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-medium">Search:</span>
              <select
                value={searchField}
                onChange={(event) =>
                  setSearchField(event.target.value as BillHistorySearchField)
                }
                className={`border-none bg-transparent font-medium outline-none ${
                  searchTerm.trim() ? "text-blue-700" : "text-slate-700"
                }`}
              >
                <option value="date">Date</option>
                <option value="invoiceNumber">Invoice Number</option>
                <option value="customerName">Customer Name</option>
              </select>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={
                  searchField === "date"
                    ? "e.g., 2026-01-15 or 15/01/2026"
                    : searchField === "invoiceNumber"
                      ? "e.g., TI-001 or QT-102"
                      : "e.g., Acme Corp or John"
                }
                className={`min-w-[200px] border-none bg-transparent font-medium outline-none ${
                  searchTerm.trim() ? "text-blue-700 placeholder:text-blue-300" : "text-slate-700 placeholder:text-slate-400"
                }`}
              />
              {searchTerm.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                  className="ml-1 flex-shrink-0 rounded-lg p-1 transition hover:bg-white/50"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 ${searchTerm.trim() ? "text-blue-500" : "text-slate-400"}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
              <span className="font-medium text-slate-700">Filter by</span>
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value as InvoiceDateFilter)}
                className="border-none bg-transparent pr-1 font-medium text-slate-700 outline-none"
              >
                <option value="all">All Sale Invoices</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisQuarter">This Quarter</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom</option>
              </select>
            </label>

            {dateFilter === "custom" && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                <label className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">From</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(event) => setCustomStartDate(event.target.value)}
                    className="border-none bg-transparent font-medium text-slate-700 outline-none"
                  />
                </label>
                <span className="text-slate-400">to</span>
                <label className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">To</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(event) => setCustomEndDate(event.target.value)}
                    className="border-none bg-transparent font-medium text-slate-700 outline-none"
                  />
                </label>
              </div>
            )}

            <div className="relative self-start" ref={docTypeMenuRef}>
              <button
                type="button"
                onClick={() => setIsDocTypeMenuOpen((open) => !open)}
                className="inline-flex min-w-[220px] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {selectedDocType ?? "Select document type"}
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 text-slate-400 transition-transform ${isDocTypeMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {isDocTypeMenuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  {DOCUMENT_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSelectedDocType(option);
                        setIsDocTypeMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition hover:bg-slate-50 ${
                        selectedDocType === option
                          ? "font-semibold text-slate-900"
                          : "text-slate-600"
                      }`}
                    >
                      {option}
                      {selectedDocType === option && (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedDocType && !loading && filteredInvoices.length > 0 && (
          <div
            className={`mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-4 ${totalColorMap[selectedDocType]}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`rounded-lg p-2 ${totalColorMap[selectedDocType]}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`h-5 w-5 ${totalAccentMap[selectedDocType]}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4h2v4zm0-6h-2V7h2v4z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path
                    d="M3 10h18M8 15h.01M12 15h.01M16 15h.01"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                  {totalLabelMap[selectedDocType]}
                </p>
                <p className="mt-0.5 text-sm font-medium opacity-80">
                  {filteredInvoices.length} document
                  {filteredInvoices.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Total Amount
              </p>
              <p
                className={`mt-0.5 text-2xl font-bold ${totalAccentMap[selectedDocType]}`}
              >
                ₹
                {totalAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Loading generated items...
          </div>
        ) : !selectedDocType ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Select a document type above to view its generated list.
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            {searchTerm.trim() ? (
              <div>
                <p className="font-medium text-slate-700">No results found</p>
                <p className="mt-2">
                  No {selectedDocType} documents match your search:
                  <br />
                  <span className="font-semibold text-slate-800">
                    {searchField === "date" ? "Date" : searchField === "invoiceNumber" ? "Invoice Number" : "Customer Name"}: &quot;{searchTerm}&quot;
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="mt-3 inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Clear search
                </button>
              </div>
            ) : (
              `No ${selectedDocType} documents generated yet.`
            )}
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                      <th className="px-4 py-3.5">ID / Bill No.</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Customer Name</th>
                      <th className="px-4 py-3.5">Type of Bill</th>
                      <th className="px-4 py-3.5">Amount</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  {filteredInvoices.map((invoice) => {
                    const isCancelled = invoice.status === "Cancelled";
                    const isMenuOpen = openActionMenuId === invoice.id;
                    const canGenerateInvoice =
                      getBillTypeLabel(invoice) !== "Tax Invoice";
                    const isProforma =
                      getBillTypeLabel(invoice) === "Proforma Invoice";
                    const isQuotation =
                      getBillTypeLabel(invoice) === "Quotation";
                    const rowKey = invoice.id ?? invoice.invoiceNumber ?? "";
                    const invoiceMeta = invoice as InvoiceWithDocType;
                    const convertedInvoiceNumber =
                      convertedInvoiceNumbers[rowKey] ||
                      invoiceMeta.convertedInvoiceNumber ||
                      "";
                    const alreadyConverted = Boolean(
                      convertedInvoiceNumber ||
                      invoiceMeta.convertedToTaxInvoice,
                    );

                    return (
                      <tr
                        key={invoice.id}
                        className={`transition duration-150 hover:bg-slate-50/50 ${isCancelled ? "opacity-60" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {getDuplicateCopyInvoiceNumber(invoice.invoiceNumber, false) || "—"}
                          </div>
                          <div className="text-xs text-slate-400">
                            #{invoice.id}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatDate(invoice.invoiceDate || invoice.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {invoice.partyName}
                        </td>
                        <td className="px-4 py-3">
                          {getBillTypeBadge(invoice)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                          ₹
                          {Number(invoice.grandTotal || 0).toLocaleString(
                            "en-IN",
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {(isProforma || isQuotation) && (
                              alreadyConverted ? (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                                    {convertedInvoiceNumber || "Converted"}
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isCancelled}
                                  onClick={() => openConvertModal(invoice)}
                                  title="Convert to Tax Invoice"
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    isCancelled
                                      ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                                      : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300"
                                  }`}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path
                                      d="M4 12h16M13 5l7 7-7 7"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  Convert
                                </button>
                              )
                            )}

                            <div
                              className="relative inline-block text-left"
                              id={`action-trigger-${invoice.id}`}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId(
                                    isMenuOpen ? null : (invoice.id ?? null),
                                  );
                                }}
                                aria-label="Open actions"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-4 w-4"
                                  fill="currentColor"
                                >
                                  <circle cx="12" cy="5" r="1.6" />
                                  <circle cx="12" cy="12" r="1.6" />
                                  <circle cx="12" cy="19" r="1.6" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {isMenuOpen &&
                            menuPos &&
                            createPortal(
                              <>
                                <div
                                  className="fixed inset-0 z-[9998]"
                                  onClick={() => setOpenActionMenuId(null)}
                                />
                                <div
                                  ref={actionMenuRef}
                                  className="fixed z-[9999] w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl"
                                  style={{
                                    top: menuPos.top,
                                    left: menuPos.left,
                                    transform: menuPos.openBelow ? "none" : "translateY(-100%)",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handlePreview(invoice)}
                                    className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    Preview
                                  </button>

                                  {!isCancelled && (
                                    <button
                                      type="button"
                                      onClick={() => handleViewEdit(invoice)}
                                      className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      View / Edit
                                    </button>
                                  )}
                                  {!isCancelled && canGenerateInvoice && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleGenerateInvoice(invoice)
                                      }
                                      className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      Generate Invoice
                                    </button>
                                  )}
                                  {!isCancelled && (
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicate(invoice)}
                                      className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      Duplicate
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleOpenPdf(invoice)}
                                    className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    Open PDF
                                  </button>

                                  {!isCancelled && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyLink(invoice)}
                                      className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      Copy Link
                                    </button>
                                  )}

                                  {!isCancelled ? (
                                    <button
                                      type="button"
                                      onClick={() => handleCancel(invoice)}
                                      className="block w-full px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
                                    >
                                      Cancel
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleRetrieve(invoice)}
                                      className="block w-full px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                                    >
                                      Retrieve
                                    </button>
                                  )}
                                  <div className="my-1 border-t border-slate-100" />
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(invoice)}
                                    className="block w-full px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>,
                              document.body,
                            )}
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>

            {isPreviewOpen &&
              selectedInvoice &&
              createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
                  <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
                      <h3 className="text-base font-semibold text-slate-800">
                        Preview
                      </h3>
                      <button
                        type="button"
                        onClick={closePreview}
                        aria-label="Close preview"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="invoice-preview-scroll flex-1 overflow-y-auto bg-slate-100 px-6 py-6">
                      <div
                        ref={previewContentRef}
                        className="mx-auto w-full max-w-4xl bg-white"
                      >
                        {renderPreviewForInvoice(selectedInvoice)}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                      <button
                        type="button"
                        onClick={handleOpenPdfFromPreview}
                        disabled={pdfBusyAction !== null}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white px-5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pdfBusyAction === "open" ? "Opening…" : "Open PDF"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintPreview(selectedInvoice)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white px-5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        Print
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePdfFromPreview}
                        disabled={pdfBusyAction !== null}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white px-5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pdfBusyAction === "save" ? "Saving…" : "Save PDF"}
                      </button>
                      <button
                        type="button"
                        onClick={closePreview}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-600 bg-rose-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <style jsx>{`
                    .invoice-preview-scroll {
                      scrollbar-width: thin;
                      scrollbar-color: #cbd5e1 transparent;
                    }
                    .invoice-preview-scroll::-webkit-scrollbar {
                      width: 8px;
                    }
                    .invoice-preview-scroll::-webkit-scrollbar-track {
                      background: transparent;
                    }
                    .invoice-preview-scroll::-webkit-scrollbar-thumb {
                      background-color: #cbd5e1;
                      border-radius: 9999px;
                    }
                    .invoice-preview-scroll::-webkit-scrollbar-thumb:hover {
                      background-color: #94a3b8;
                    }
                  `}</style>
                </div>,
                document.body,
              )}
          </>
        )}
      </div>

      {convertModalInvoice &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M4 12h16M13 5l7 7-7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Convert to Tax Invoice
                    </h3>
                    <p className="text-xs text-slate-500">
                      {convertModalInvoice.invoiceNumber}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConvertModalInvoice(null)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="mx-6 mt-4 flex items-start gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-4 w-4 shrink-0 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path
                    d="M12 16v-4M12 8h.01"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>
                  All items, amounts, and party details from{" "}
                  <strong>{convertModalInvoice.invoiceNumber}</strong> will be
                  copied into a new Tax Invoice. Original data is preserved.
                </span>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tax Invoice Date
                  </label>
                  <input
                    type="date"
                    value={convertOptions.invoiceDate}
                    onChange={(e) =>
                      setConvertOptions((prev) => ({
                        ...prev,
                        invoiceDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Payment Terms
                  </label>
                  <select
                    value={convertOptions.paymentTerms}
                    onChange={(e) =>
                      setConvertOptions((prev) => ({
                        ...prev,
                        paymentTerms: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    {PAYMENT_TERMS_OPTIONS.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Conversion Note{" "}
                    <span className="normal-case font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={convertOptions.conversionNote}
                    onChange={(e) =>
                      setConvertOptions((prev) => ({
                        ...prev,
                        conversionNote: e.target.value,
                      }))
                    }
                    placeholder="e.g. Converted after client approval on call"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={convertOptions.markOriginalConverted}
                      onChange={(e) =>
                        setConvertOptions((prev) => ({
                          ...prev,
                          markOriginalConverted: e.target.checked,
                        }))
                      }
                      className="peer h-4 w-4 rounded border-slate-300 accent-emerald-600"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Mark original document as converted
                    </p>
                    <p className="text-xs text-slate-500">
                      The original document will be marked as converted and no longer show the conversion action after this change.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isConverting ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                          strokeLinecap="round"
                        />
                      </svg>
                      Converting…
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M4 12h16M13 5l7 7-7 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Convert to Tax Invoice
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </AdminShell>
  );
}