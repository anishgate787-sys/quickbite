'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  buildDailySalesBreakdown,
  buildMonthlySalesBreakdown,
  buildSalesAnalytics,
  buildSalesSuggestions,
  type SalesOrder,
} from '@/lib/sales';

export default function OwnerSalesPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);
    const response = await fetch('/api/orders', { cache: 'no-store' });
    if (response.ok) {
      const payload = await response.json();
      setOrders((payload.orders || []) as SalesOrder[]);
    } else {
      setOrders([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    const timer = window.setInterval(loadOrders, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const analytics = useMemo(() => buildSalesAnalytics(orders), [orders]);
  const dailyBreakdown = useMemo(() => buildDailySalesBreakdown(orders), [orders]);
  const monthlyBreakdown = useMemo(() => buildMonthlySalesBreakdown(orders), [orders]);
  const suggestions = useMemo(() => buildSalesSuggestions(orders, analytics), [orders, analytics]);
  const maxDailyRevenue = Math.max(...dailyBreakdown.map((day) => day.revenue), 1);
  const maxMonthlyRevenue = Math.max(...monthlyBreakdown.map((month) => month.revenue), 1);

  return (
    <main className="min-h-screen bg-[#0d0e13] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/owner" className="logo text-xl text-white">Quick<span className="gradient">Bite</span></Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-[#ff8a72]">Owner analytics</p>
            <h1 className="mt-2 text-4xl font-black">Sales intelligence dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              {loading ? 'Refreshing...' : 'Live updates'}
            </div>
            <Link href="/owner" className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold">Back to owner</Link>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Gross revenue', value: `₹${analytics.totalRevenue.toFixed(0)}`, detail: `${analytics.totalOrders} orders total`, accent: 'from-[#ff5e3a] to-[#ff9a6b]' },
            { label: 'Average order', value: `₹${analytics.averageOrderValue.toFixed(0)}`, detail: 'Per basket value', accent: 'from-[#e1037d] to-[#ff66c4]' },
            { label: 'Today', value: `₹${analytics.todaysRevenue.toFixed(0)}`, detail: `${analytics.todaysOrders} active orders`, accent: 'from-[#9647ff] to-[#b88cff]' },
            { label: 'Best item', value: analytics.topProducts[0]?.name || 'No data yet', detail: analytics.topProducts[0] ? `${analytics.topProducts[0].quantity} sold` : 'Waiting for orders', accent: 'from-[#11b981] to-[#50f1b8]' },
          ].map((card) => (
            <div key={card.label} className="glass p-5">
              <div className={`mb-3 h-1.5 rounded-full bg-gradient-to-r ${card.accent}`} />
              <p className="text-xs uppercase tracking-[0.2em] text-[#aa8982]">{card.label}</p>
              <p className="mt-3 text-3xl font-black text-white">{card.value}</p>
              <p className="mt-2 text-sm text-[#aa8982]">{card.detail}</p>
            </div>
          ))}
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="glass p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#ff8a72]">Revenue trend</p>
                <h2 className="mt-1 text-2xl font-bold">Daily sales graph</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#aa8982]">Last 7 days</span>
            </div>

            <div className="flex h-52 items-end gap-3">
              {dailyBreakdown.length === 0 ? (
                <div className="w-full rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-[#aa8982]">
                  No daily order history yet. Sales bars will appear here as new orders are placed.
                </div>
              ) : (
                dailyBreakdown.map((day) => {
                  const height = `${Math.max(12, (day.revenue / maxDailyRevenue) * 100)}%`;
                  return (
                    <div key={day.label} className="flex flex-1 flex-col items-center justify-end gap-2">
                      <span className="text-xs font-bold text-[#ffb4a3]">₹{day.revenue}</span>
                      <div className="flex h-full w-full items-end justify-center rounded-t-2xl bg-gradient-to-t from-[#ff5e3a] via-[#ff8571] to-[#ffc2ab]" style={{ height }} />
                      <span className="text-[10px] text-[#aa8982]">{day.label.split(' ')[0]}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="glass p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#ff8a72]">Performance mix</p>
            <h2 className="mt-1 text-2xl font-bold">Order health</h2>
            <div className="mt-5 space-y-4">
              {Object.entries(analytics.salesByStatus).map(([status, count]) => {
                const width = `${(count / Math.max(analytics.totalOrders, 1)) * 100}%`;
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="capitalize text-[#aa8982]">{status}</span>
                      <span className="font-bold text-white">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <div className="h-2 rounded-full bg-gradient-to-r from-[#ff5e3a] to-[#e1037d]" style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 rounded-xl border border-[#ff8a72]/30 bg-[#ff5e3a]/10 p-3 text-sm text-[#ffd8cf]">
              Peak slot: <span className="font-bold text-white">{analytics.peakSlot}</span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="glass p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#ff8a72]">Daily detail</p>
                <h2 className="mt-1 text-2xl font-bold">Per-day breakdown</h2>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-[#aa8982]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Day</th>
                    <th className="px-4 py-3 font-semibold">Orders</th>
                    <th className="px-4 py-3 font-semibold">Revenue</th>
                    <th className="px-4 py-3 font-semibold">Best item</th>
                    <th className="px-4 py-3 font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyBreakdown.map((day) => (
                    <tr key={day.label} className="border-t border-white/10 bg-[#14161d]">
                      <td className="px-4 py-3 font-medium text-white">{day.label}</td>
                      <td className="px-4 py-3 text-[#d9d0d3]">{day.orders}</td>
                      <td className="px-4 py-3 font-bold text-[#ffb4a3]">₹{day.revenue}</td>
                      <td className="px-4 py-3 text-[#d9d0d3]">{day.topItem}</td>
                      <td className={`px-4 py-3 font-bold ${day.growth >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {day.growth >= 0 ? '+' : ''}{day.growth.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#ff8a72]">Top items</p>
            <h2 className="mt-1 text-2xl font-bold">Best sellers</h2>
            <div className="mt-4 space-y-3">
              {analytics.topProducts.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff5e3a] to-[#e1037d] text-sm font-black text-white">{index + 1}</div>
                    <div>
                      <p className="font-bold text-white">{item.name}</p>
                      <p className="text-xs text-[#aa8982]">{item.quantity} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#ffb4a3]">₹{item.revenue.toFixed(0)}</p>
                    <p className="text-xs text-[#aa8982]">{item.share.toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="glass p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#ff8a72]">Monthly summary</p>
            <h2 className="mt-1 text-2xl font-bold">Month-over-month view</h2>
            <div className="mt-4 space-y-3">
              {monthlyBreakdown.map((month) => {
                const height = `${Math.max(18, (month.revenue / maxMonthlyRevenue) * 100)}%`;
                return (
                  <div key={month.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-white">{month.label}</span>
                      <span className="text-[#aa8982]">{month.orders} orders</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#1b1d24]">
                      <div className="h-2.5 rounded-full bg-gradient-to-r from-[#ff5e3a] to-[#e1037d]" style={{ width: height }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-[#aa8982]">
                      <span>₹{month.revenue}</span>
                      <span>{month.topItem}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#ff8a72]">Growth plan</p>
            <h2 className="mt-1 text-2xl font-bold">Actionable suggestions</h2>
            <div className="mt-4 space-y-3">
              {suggestions.map((suggestion) => (
                <div key={suggestion.title} className="rounded-2xl border border-white/10 bg-[#14161d] p-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-white">{suggestion.title}</h3>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-300">{suggestion.impact}</span>
                  </div>
                  <p className="text-sm leading-6 text-[#d3c9ce]">{suggestion.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
