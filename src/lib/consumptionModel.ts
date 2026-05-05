import type { Order, OrderItem, ProductCadence } from '../types.js';

// ── Consumption Model Engine ──
// Infers purchase frequency per SKU from raw order history.

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

export function buildConsumptionModel(orders: Order[]): ProductCadence[] {
  // Flatten all order lines with their parent order date
  const allItems: (OrderItem & { orderedAt: string })[] = orders.flatMap(o =>
    o.items.map(item => ({ ...item, orderedAt: item.orderedAt || o.placedAt }))
  );

  const byProduct = groupBy(allItems, item => item.productId);

  return Object.entries(byProduct).map(([productId, entries]) => {
    // Sort chronologically
    const sorted = [...entries].sort(
      (a, b) => new Date(a.orderedAt).getTime() - new Date(b.orderedAt).getTime()
    );

    // Compute inter-purchase gaps (days)
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff =
        (new Date(sorted[i].orderedAt).getTime() -
          new Date(sorted[i - 1].orderedAt).getTime()) /
        86_400_000;
      gaps.push(diff);
    }

    const avgDays =
      gaps.length > 0
        ? gaps.reduce((a, b) => a + b, 0) / gaps.length
        : 7; // default weekly cadence for items with only 1 purchase

    const last = sorted[sorted.length - 1];
    const predictedRestockDate = new Date(
      new Date(last.orderedAt).getTime() + avgDays * 86_400_000
    );

    return {
      productId,
      productName: last.productName,
      avgDaysBetween: Math.round(avgDays * 10) / 10,
      lastOrderedAt: new Date(last.orderedAt),
      lastQty: last.quantity,
      predictedRestockDate,
      // >4 purchases = high confidence, 2–4 = medium, 1 = low
      confidence:
        sorted.length >= 4 ? 'high' : sorted.length >= 2 ? 'medium' : 'low',
      orderCount: sorted.length,
    };
  });
}

// Returns items whose predicted restock date is today or overdue (within lookahead days)
export function getRestockCandidates(
  cadences: ProductCadence[],
  today: Date,
  lookaheadDays = 1
): ProductCadence[] {
  return cadences.filter(c => {
    const daysUntilRestock =
      (c.predictedRestockDate.getTime() - today.getTime()) / 86_400_000;
    return daysUntilRestock <= lookaheadDays;
  });
}
