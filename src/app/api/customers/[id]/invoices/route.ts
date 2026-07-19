import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const url = new URL(request.url);
    const customerNameParam = url.searchParams.get("name") || "";

    console.log("[API] Fetching invoices for customer:", { customerId, customerNameParam });

    // First, get the customer to get their name
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true },
    });

    if (!customer) {
      console.log("[API] Customer not found:", customerId);
      return Response.json({ error: "Customer not found" }, { status: 404 });
    }

    // Use provided name or fall back to customer name from DB
    const searchName = customerNameParam || customer.name;
    console.log("[API] Searching for invoices with partyName:", searchName);

    // Fetch all invoices for this customer by matching partyName (case-insensitive)
    const invoices = await prisma.invoice.findMany({
      where: {
        partyName: {
          contains: searchName,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        billType: true,
        invoiceNumber: true,
        partyName: true,
        invoiceDate: true,
        grandTotal: true,
      },
      orderBy: {
        invoiceDate: "desc",
      },
    });

    console.log("[API] Found invoices:", invoices.length);

    // Fetch payments separately to avoid relation issues
    const payments = await prisma.payment.findMany({
      where: {
        invoiceId: {
          in: invoices.map(inv => inv.id),
        },
      },
      select: {
        invoiceId: true,
        amount: true,
      },
    });

    console.log("[API] Found payments:", payments.length);

    // Create a map of paid amounts by invoiceId
    const paidAmountsMap = new Map<string, number>();
    payments.forEach((payment) => {
      const current = paidAmountsMap.get(payment.invoiceId) || 0;
      paidAmountsMap.set(payment.invoiceId, current + payment.amount);
    });

    // Transform the data with balance calculation
    const transactions = invoices.map((invoice) => {
      const paidAmount = paidAmountsMap.get(invoice.id) || 0;
      const balance = Math.max(0, invoice.grandTotal - paidAmount);

      return {
        id: invoice.id,
        billType: invoice.billType || "Invoice",
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        grandTotal: invoice.grandTotal,
        balance: balance,
      };
    });

    console.log("[API] Transformed transactions:", transactions.length);
    return Response.json(transactions);
  } catch (error) {
    console.error("[API] Error fetching customer invoices:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ 
      error: "Failed to fetch invoices",
      details: errorMessage 
    }, { status: 500 });
  }
}
