export type SalesOrder = {
  id: number;
  total: number;
  status: string;
  created_at?: string;
  slot_time?: string;
  items?: string;
};

export type SalesProduct = {
  name: string;
  quantity: number;
  revenue: number;
  share: number;
};

export type SalesTrendPoint = {
  label: string;
  revenue: number;
};

export type SalesDaySummary = {
  label: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  topItem: string;
  growth: number;
};

export type SalesMonthSummary = {
  label: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  topItem: string;
};

export type SalesSuggestion = {
  title: string;
  detail: string;
  impact: string;
};

export type SalesAnalytics = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completedRevenue: number;
  todaysRevenue: number;
  todaysOrders: number;
  peakSlot: string;
  salesByStatus: Record<string, number>;
  topProducts: SalesProduct[];
  salesTrend: SalesTrendPoint[];
};

function safeNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseOrderItems(data: string | undefined) {
  if (!data) return [] as Array<{ name: string; quantity: number; price: number }>;

  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === 'object' && typeof item.name === 'string')
      .map((item) => ({
        name: String(item.name),
        quantity: safeNumber(item.quantity),
        price: safeNumber(item.price),
      }));
  } catch {
    return [];
  }
}

function formatDay(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const sampleOrderSeed: SalesOrder[] = [
  { id: 101, total: 260, status: 'completed', created_at: '2026-10-26T12:30:00Z', slot_time: '12:30 PM', items: JSON.stringify([{ name: 'Paneer Bowl', quantity: 1, price: 140 }, { name: 'Lemon Soda', quantity: 2, price: 60 }]) },
  { id: 102, total: 180, status: 'preparing', created_at: '2026-10-25T13:00:00Z', slot_time: '1:00 PM', items: JSON.stringify([{ name: 'Veg Burger', quantity: 2, price: 90 }]) },
  { id: 103, total: 320, status: 'ready', created_at: '2026-10-24T18:30:00Z', slot_time: '6:30 PM', items: JSON.stringify([{ name: 'Chicken Biryani', quantity: 2, price: 160 }]) },
  { id: 104, total: 150, status: 'submitted', created_at: '2026-10-23T12:00:00Z', slot_time: '12:00 PM', items: JSON.stringify([{ name: 'Cheese Pizza', quantity: 1, price: 150 }]) },
  { id: 105, total: 90, status: 'completed', created_at: '2026-10-22T19:00:00Z', slot_time: '7:00 PM', items: JSON.stringify([{ name: 'Fries', quantity: 1, price: 90 }]) },
];

function getDataSet(orders: SalesOrder[]) {
  return orders.length ? orders : sampleOrderSeed;
}

export function buildSalesAnalytics(orders: SalesOrder[]): SalesAnalytics {
  const data = getDataSet(orders);

  const statusCounts: Record<string, number> = {};
  const perProduct = new Map<string, { quantity: number; revenue: number }>();
  const slotCounts = new Map<string, number>();
  const trendMap = new Map<string, number>();

  let totalRevenue = 0;
  let completedRevenue = 0;
  let todayRevenue = 0;
  let todayOrders = 0;

  const now = new Date();
  const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);

  for (const order of data) {
    const status = String(order.status || 'submitted');
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;

    const revenue = safeNumber(order.total);
    if (status !== 'cancelled') {
      totalRevenue += revenue;
      if (status === 'completed' || status === 'ready') {
        completedRevenue += revenue;
      }
    }

    const orderDate = order.created_at ? new Date(order.created_at) : now;
    const createdKey = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()).toISOString().slice(0, 10);
    if (createdKey === todayKey) {
      todayRevenue += revenue;
      todayOrders += 1;
    }

    const slot = (order.slot_time || '').trim();
    if (slot) {
      slotCounts.set(slot, (slotCounts.get(slot) ?? 0) + 1);
    }

    const dayKey = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()).toISOString().slice(0, 10);
    trendMap.set(dayKey, (trendMap.get(dayKey) ?? 0) + (!['cancelled'].includes(status) ? revenue : 0));

    for (const item of parseOrderItems(order.items)) {
      const quantity = Math.max(0, item.quantity);
      if (!quantity) continue;
      const current = perProduct.get(item.name) ?? { quantity: 0, revenue: 0 };
      current.quantity += quantity;
      current.revenue += quantity * item.price;
      perProduct.set(item.name, current);
    }
  }

  const topProducts: SalesProduct[] = [...perProduct.entries()]
    .map(([name, item]) => ({
      name,
      quantity: item.quantity,
      revenue: item.revenue,
      share: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
    .slice(0, 5);

  const salesTrend: SalesTrendPoint[] = Array.from({ length: 7 }, (_, index) => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    current.setDate(current.getDate() - (6 - index));
    const key = current.toISOString().slice(0, 10);
    return {
      label: formatDay(current),
      revenue: trendMap.get(key) ?? 0,
    };
  });

  const peakSlot = [...slotCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '12:30 PM';

  return {
    totalRevenue,
    totalOrders: data.length,
    averageOrderValue: data.length ? totalRevenue / data.length : 0,
    completedRevenue,
    todaysRevenue: todayRevenue,
    todaysOrders: todayOrders,
    peakSlot,
    salesByStatus: statusCounts,
    topProducts,
    salesTrend,
  };
}

export function buildDailySalesBreakdown(orders: SalesOrder[]): SalesDaySummary[] {
  const data = getDataSet(orders);
  const groups = new Map<string, { revenue: number; orders: number; productCounts: Map<string, number> }>();

  for (const order of data) {
    const when = order.created_at ? new Date(order.created_at) : new Date();
    const key = new Date(when.getFullYear(), when.getMonth(), when.getDate()).toISOString().slice(0, 10);
    const bucket = groups.get(key) ?? { revenue: 0, orders: 0, productCounts: new Map<string, number>() };
    bucket.revenue += safeNumber(order.total);
    bucket.orders += 1;

    for (const item of parseOrderItems(order.items)) {
      const itemName = item.name;
      bucket.productCounts.set(itemName, (bucket.productCounts.get(itemName) ?? 0) + Math.max(1, Math.round(item.quantity || 1)));
    }

    groups.set(key, bucket);
  }

  const sorted = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const output: SalesDaySummary[] = sorted.map(([key, bucket], index) => {
    const topItem = [...bucket.productCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Mixed items';
    const previousRevenue = index > 0 ? sorted[index - 1][1].revenue : bucket.revenue;
    const growth = previousRevenue ? ((bucket.revenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      label: formatDay(new Date(`${key}T00:00:00`)),
      revenue: bucket.revenue,
      orders: bucket.orders,
      avgOrderValue: bucket.orders ? bucket.revenue / bucket.orders : 0,
      topItem,
      growth,
    };
  });

  return output.slice(-7);
}

export function buildMonthlySalesBreakdown(orders: SalesOrder[]): SalesMonthSummary[] {
  const data = getDataSet(orders);
  const groups = new Map<string, { revenue: number; orders: number; productCounts: Map<string, number> }>();

  for (const order of data) {
    const when = order.created_at ? new Date(order.created_at) : new Date();
    const key = `${when.toLocaleString('en-US', { month: 'short' })} ${when.getFullYear()}`;
    const bucket = groups.get(key) ?? { revenue: 0, orders: 0, productCounts: new Map<string, number>() };
    bucket.revenue += safeNumber(order.total);
    bucket.orders += 1;

    for (const item of parseOrderItems(order.items)) {
      const itemName = item.name;
      bucket.productCounts.set(itemName, (bucket.productCounts.get(itemName) ?? 0) + Math.max(1, Math.round(item.quantity || 1)));
    }

    groups.set(key, bucket);
  }

  return [...groups.entries()].sort((a, b) => new Date(`1 ${a[0]}`).getTime() - new Date(`1 ${b[0]}`).getTime()).map(([label, bucket]) => ({
    label,
    revenue: bucket.revenue,
    orders: bucket.orders,
    avgOrderValue: bucket.orders ? bucket.revenue / bucket.orders : 0,
    topItem: [...bucket.productCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Mixed items',
  }));
}

export function buildSalesSuggestions(orders: SalesOrder[], analytics: SalesAnalytics): SalesSuggestion[] {
  const data = getDataSet(orders);
  const bestItem = analytics.topProducts[0]?.name ?? 'Chef specials';
  const peakSlot = analytics.peakSlot || '12:30 PM';
  const todayOrders = analytics.todaysOrders || 1;

  const suggestions: SalesSuggestion[] = [
    {
      title: 'Double down on the best seller',
      detail: `${bestItem} is your strongest performer. Promote it in the hero section and bundle it with a drink to push higher order value.`,
      impact: `+${Math.max(8, Math.round((analytics.topProducts[0]?.share ?? 25) / 2))}% demand potential`,
    },
    {
      title: 'Staff the busiest slot proactively',
      detail: `Your peak flow is around ${peakSlot}. Schedule prep staff and quick-service counters before this window to reduce delays and improve completion rate.`,
      impact: `${Math.max(10, Math.round((analytics.salesByStatus.submitted ?? 1) * 12))}% faster turn-around`,
    },
    {
      title: 'Bundle for larger cart size',
      detail: `Average ticket value is ₹${analytics.averageOrderValue.toFixed(0)}. Add combo pricing or add-ons to increase basket size without adding more customers.`,
      impact: `+₹${Math.max(40, Math.round(analytics.averageOrderValue * 0.18))} per order`,
    },
  ];

  if (data.length > 0 && (analytics.salesByStatus.cancelled ?? 0) > 0) {
    suggestions.push({
      title: 'Reduce failed conversions',
      detail: 'Cancelled orders usually mean a gap in service timing or pricing clarity. Review the latest cancelled orders and update promotions or slot convenience.',
      impact: `${analytics.salesByStatus.cancelled ?? 0} cancelled orders to recover`,
    });
  }

  if (todayOrders > 0) {
    suggestions.push({
      title: 'Keep momentum strong today',
      detail: 'You already have active demand today. Keep the top two items visible and run short-window deals to convert this momentum into extra revenue.',
      impact: `₹${analytics.todaysRevenue.toFixed(0)} active today`,
    });
  }

  return suggestions.slice(0, 4);
}
