export type StockReductionCandidate = {
  id?: string;
  name?: string | null;
  stock?: number | null;
};

export type StockReductionItem = {
  description?: string | null;
  qty?: number | null;
};

export function buildStockReductionPlan(items: StockReductionItem[], products: StockReductionCandidate[]) {
  const plan: Array<{ productId: string; qty: number }> = [];

  for (const item of items) {
    const description = String(item.description || "").trim().toLowerCase();
    const qty = Number(item.qty || 0);

    if (!description || qty <= 0) {
      continue;
    }

    const matchedProduct = products.find((product) => String(product.name || "").trim().toLowerCase() === description);
    if (!matchedProduct?.id) {
      continue;
    }

    if (Number(matchedProduct.stock || 0) < qty) {
      throw new Error(`Insufficient stock for product ${matchedProduct.name || matchedProduct.id}`);
    }

    plan.push({ productId: matchedProduct.id, qty });
  }

  return plan;
}
