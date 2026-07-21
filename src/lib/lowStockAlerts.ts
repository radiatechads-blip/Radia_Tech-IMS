export const LOW_STOCK_THRESHOLD = 50;

export interface LowStockAlertItem {
  id: string;
  name: string;
  stock: number;
}

export interface LowStockProductLike {
  id: string;
  name: string;
  stock?: number | null;
}

export function buildLowStockAlerts(products: LowStockProductLike[]): LowStockAlertItem[] {
  return products
    .filter((product) => Number(product.stock ?? 0) < LOW_STOCK_THRESHOLD)
    .map((product) => ({
      id: product.id,
      name: product.name,
      stock: Number(product.stock ?? 0),
    }))
    .sort((left, right) => {
      if (left.stock !== right.stock) return left.stock - right.stock;
      return left.name.localeCompare(right.name);
    });
}
