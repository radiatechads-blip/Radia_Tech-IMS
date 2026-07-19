import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const url = new URL(request.url);
    const productName = url.searchParams.get("name") || "";

    console.log("[API] Fetching transactions for product:", { productId, productName });

    // Fetch all invoices with items that match this product by name
    const invoices = await prisma.invoice.findMany({
      where: {
        items: {
          some: {
            description: {
              contains: productName,
              mode: "insensitive",
            },
          },
        },
      },
      select: {
        id: true,
        billType: true,
        invoiceNumber: true,
        partyName: true,
        invoiceDate: true,
        items: {
          where: {
            description: {
              contains: productName,
              mode: "insensitive",
            },
          },
          select: {
            qty: true,
            rate: true,
          },
        },
      },
      orderBy: {
        invoiceDate: "desc",
      },
    });

    console.log("[API] Found invoices:", invoices.length);

    // Transform the data for the frontend
    const transactions = invoices.flatMap((invoice) =>
      invoice.items.map((item) => ({
        id: `${invoice.id}-${item.rate}`,
        billType: invoice.billType || "Invoice",
        invoiceNumber: invoice.invoiceNumber,
        partyName: invoice.partyName,
        invoiceDate: invoice.invoiceDate,
        qty: item.qty,
        rate: item.rate,
        status: "Unpaid", // Default status - can be enhanced with payment tracking
      }))
    );

    console.log("[API] Transformed transactions:", transactions.length);
    return Response.json(transactions);
  } catch (error) {
    console.error("[API] Error fetching transactions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ 
      error: "Failed to fetch transactions",
      details: errorMessage 
    }, { status: 500 });
  }
}
