import { DATABASE_UNAVAILABLE_MESSAGE, isDatabaseUnavailableError, jsonError, logServerError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readInvoiceStore } from "@/lib/invoiceStorage";
import { NextRequest, NextResponse } from "next/server";

type Period = "day" | "month" | "year";

type InvoiceLike = {
  id: string;
  invoiceNumber: string;
  partyName: string;
  grandTotal?: number | string | null;
  invoiceDate?: string | Date | null;
  createdAt?: string | Date | null;
  items?: Array<Record<string, unknown>>;
};

type TrendPoint = {
  label: string;
  revenue: number;
  bills: number;
  soldProducts: number;
};

function normalizePeriod(value: string | null): Period {
  if (value === "day" || value === "year") return value;
  return "month";
}

function getInvoiceDate(invoice: InvoiceLike) {
  const raw = invoice.invoiceDate ?? invoice.createdAt;
  const parsed = raw ? new Date(raw as string | Date) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function buildTrendData(invoices: InvoiceLike[], period: Period): TrendPoint[] {
  const now = new Date();
  const buckets = Array.from({ length: period === "day" ? 7 : period === "month" ? 6 : 5 }, (_, index) => {
    const date = new Date(now);
    if (period === "day") {
      date.setDate(now.getDate() - (6 - index));
    } else if (period === "month") {
      date.setMonth(now.getMonth() - (5 - index));
    } else {
      date.setFullYear(now.getFullYear() - (4 - index));
    }

    const key = period === "day"
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : period === "month"
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : `${date.getFullYear()}`;

    const label = period === "day"
      ? date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
      : period === "month"
        ? date.toLocaleDateString("en-IN", { month: "short" })
        : String(date.getFullYear());

    return { key, label, revenue: 0, bills: 0, soldProducts: 0 };
  });

  for (const invoice of invoices) {
    const date = getInvoiceDate(invoice);
    const key = period === "day"
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : period === "month"
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : `${date.getFullYear()}`;

    const bucket = buckets.find((item) => item.key === key);
    if (!bucket) continue;

    const soldProducts = Array.isArray(invoice.items)
      ? invoice.items.reduce((sum, item) => sum + Number((item as Record<string, unknown>).qty || 0), 0)
      : 0;

    bucket.revenue += Number(invoice.grandTotal || 0);
    bucket.bills += 1;
    bucket.soldProducts += soldProducts;
  }

  return buckets;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = normalizePeriod(request.nextUrl.searchParams.get("period"));

  try {
    const [productCount, categoryCount, totalInquiries, unreadInquiries, recentInquiries, categoriesWithCounts, stockAggregation, customerCount] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.productCategory.count(),
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { isRead: false } }),
      prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { product: { select: { name: true } } } }),
      prisma.productCategory.findMany({
        select: { name: true, _count: { select: { products: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.aggregate({ where: { isActive: true }, _sum: { stock: true } }),
      prisma.customer.count(),
    ]);

    const totalStock = Number(stockAggregation._sum.stock ?? 0);

    let totalSoldProducts = 0;
    let totalAmount = 0;
    let recentTransactions: Array<{ id: string; invoiceNumber: string; partyName: string; grandTotal: number; invoiceDate: string; createdAt: string }> = [];
    let trendData: TrendPoint[] = [];

    try {
      const recentInvoices = await prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          invoiceNumber: true,
          partyName: true,
          grandTotal: true,
          invoiceDate: true,
          createdAt: true,
          items: { select: { qty: true } },
        },
      });

      totalSoldProducts = recentInvoices.reduce((sum, invoice) => sum + (Array.isArray(invoice.items) ? invoice.items.reduce((itemSum, item) => itemSum + Number((item as Record<string, unknown>).qty || 0), 0) : 0), 0);
      totalAmount = recentInvoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal ?? 0), 0);
      recentTransactions = recentInvoices.slice(0, 5).map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        partyName: invoice.partyName,
        grandTotal: Number(invoice.grandTotal ?? 0),
        invoiceDate: invoice.invoiceDate?.toISOString() ?? "",
        createdAt: invoice.createdAt?.toISOString() ?? "",
      }));
      trendData = buildTrendData(recentInvoices as InvoiceLike[], period);
    } catch (invoiceError) {
      if (!isDatabaseUnavailableError(invoiceError)) {
        logServerError("api.admin.stats.invoiceFallback", invoiceError);
      }

      const fallbackInvoices = await readInvoiceStore();
      totalSoldProducts = fallbackInvoices.reduce((sum, invoice) => sum + (Array.isArray(invoice.items) ? invoice.items.reduce((itemSum, item) => itemSum + Number((item as Record<string, unknown>).qty || 0), 0) : 0), 0);
      totalAmount = fallbackInvoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0);
      recentTransactions = fallbackInvoices.slice(0, 5).map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        partyName: invoice.partyName,
        grandTotal: Number(invoice.grandTotal || 0),
        invoiceDate: invoice.invoiceDate,
        createdAt: invoice.createdAt,
      }));
      trendData = buildTrendData(fallbackInvoices as InvoiceLike[], period);
    }

    return NextResponse.json({
      products: productCount,
      categories: categoryCount,
      stock: totalStock,
      customers: customerCount,
      totalSoldProducts,
      totalAmount,
      inquiries: { total: totalInquiries, unread: unreadInquiries },
      recentInquiries,
      recentTransactions,
      categoriesWithCounts: categoriesWithCounts.map((c) => ({ name: c.name, products: c._count.products })),
      businessSummary: {
        period,
        trend: trendData,
        totalRevenue: totalAmount,
        totalBills: recentTransactions.length,
        avgBillValue: recentTransactions.length ? totalAmount / recentTransactions.length : 0,
        totalSoldProducts,
      },
    });
  } catch (error) {
    logServerError("api.admin.stats.GET", error);
    const status = isDatabaseUnavailableError(error) ? 503 : 500;
    return jsonError(status === 503 ? DATABASE_UNAVAILABLE_MESSAGE : "Unable to load dashboard statistics.", status);
  }
}
