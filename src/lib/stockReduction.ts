export type StockReductionCandidate = {
  id?: string;
  name?: string | null;
  stock?: number | null;
};

export type StockReductionItem = {
  description?: string | null;
  qty?: number | null;
};

export function shouldApplyStockReduction(documentType: string) {
  return documentType === "invoice" || documentType === "annexure";
}

function normalizeStockMatchValue(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function buildStockReductionPlan(items: StockReductionItem[], products: StockReductionCandidate[]) {
  const plan: Array<{ productId: string; qty: number }> = [];

  for (const item of items) {
    const description = normalizeStockMatchValue(item.description);
    const qty = Number(item.qty || 0);

    if (!description || qty <= 0) {
      continue;
    }

    const matchedProduct = products.find((product) => {
      const candidateName = normalizeStockMatchValue(product.name);
      return candidateName === description || candidateName.includes(description) || description.includes(candidateName);
    });

    if (!matchedProduct?.id) {
      continue;
    }

    plan.push({ productId: matchedProduct.id, qty });
  }

  return plan;
}
