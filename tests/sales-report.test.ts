import { describe, expect, it } from 'vitest';
import { buildSalesAnalytics } from '../lib/sales';

describe('sales analytics', () => {
  it('aggregates revenue and identifies top items', () => {
    const report = buildSalesAnalytics([
      {
        id: 1,
        total: 220,
        status: 'completed',
        created_at: '2026-10-26T12:00:00Z',
        slot_time: '12:30 PM',
        items: JSON.stringify([
          { name: 'Paneer Bowl', quantity: 1, price: 120 },
          { name: 'Lemon Soda', quantity: 2, price: 50 },
        ]),
      },
      {
        id: 2,
        total: 150,
        status: 'submitted',
        created_at: '2026-10-25T20:00:00Z',
        slot_time: '1:00 PM',
        items: JSON.stringify([
          { name: 'Paneer Bowl', quantity: 1, price: 120 },
          { name: 'Veg Burger', quantity: 1, price: 30 },
        ]),
      },
      {
        id: 3,
        total: 100,
        status: 'cancelled',
        created_at: '2026-10-24T10:00:00Z',
        slot_time: '6:30 PM',
        items: JSON.stringify([{ name: 'Fries', quantity: 2, price: 50 }]),
      },
    ]);

    expect(report.totalRevenue).toBe(370);
    expect(report.totalOrders).toBe(3);
    expect(report.averageOrderValue).toBeCloseTo(123.33, 2);
    expect(report.topProducts[0].name).toBe('Paneer Bowl');
    expect(report.topProducts[0].quantity).toBe(2);
    expect(report.peakSlot).toBe('12:30 PM');
    expect(report.salesByStatus.completed).toBe(1);
    expect(report.salesByStatus.cancelled).toBe(1);
  });

  it('returns sample sales data when no orders exist yet', () => {
    const report = buildSalesAnalytics([]);

    expect(report.totalOrders).toBeGreaterThan(0);
    expect(report.totalRevenue).toBeGreaterThan(0);
    expect(report.topProducts.length).toBeGreaterThan(0);
    expect(report.salesTrend.length).toBe(7);
  });
});
