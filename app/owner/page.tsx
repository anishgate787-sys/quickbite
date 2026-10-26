'use client';

import { useEffect, useMemo, useState } from 'react';
import { emojiFor } from '@/lib/emoji';
import { buildSalesAnalytics } from '@/lib/sales';

type Product = { id: number; name: string; price: number; category: string; image: string; is_veg: number };
type Order = { id: number; token: number; student_name?: string; items: string; total: number; slot_time: string; status: string; created_at?: string };
type QueueEntry = { id: number; label: string; position: number; status: string };

const statuses = ['submitted', 'preparing', 'ready', 'completed', 'cancelled'];

export default function OwnerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Meals');
  const [image, setImage] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [queueLabel, setQueueLabel] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingStatuses, setPendingStatuses] = useState<Record<number, string>>({});
  const sales = useMemo(() => buildSalesAnalytics(orders), [orders]);

  async function loadProducts() { const response = await fetch('/api/menu', { cache: 'no-store' }); if (response.ok) setProducts((await response.json()).items || []); }
  async function loadOrders() { const response = await fetch('/api/orders', { cache: 'no-store' }); if (response.ok) setOrders((await response.json()).orders || []); }
  async function loadQueue() { const response = await fetch('/api/mess/queue', { cache: 'no-store' }); if (response.ok) setQueue((await response.json()).entries || []); }
  async function refresh() { await Promise.all([loadProducts(), loadOrders(), loadQueue()]); }
  useEffect(() => { refresh(); const timer = window.setInterval(() => { loadOrders(); loadQueue(); }, 10000); return () => window.clearInterval(timer); }, []);

  function clearForm() { setName(''); setPrice(''); setCategory('Meals'); setImage(''); setIsVeg(true); setEditingId(null); }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    const payload = { id: editingId, name: name.trim(), price: Number(price), category: category.trim(), image: image.trim(), isVeg };
    const response = await fetch('/api/menu', { method: editingId ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) { setNotice(data.error || 'Could not save product.'); return; }
    clearForm(); await loadProducts(); setNotice(editingId ? 'Product updated.' : 'Product added to the student menu.');
  }

  function startEdit(product: Product) { setEditingId(product.id); setName(product.name); setPrice(String(product.price)); setCategory(product.category); setImage(product.image); setIsVeg(Boolean(product.is_veg)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function deleteProduct(id: number) { const response = await fetch(`/api/menu?id=${id}`, { method: 'DELETE' }); if (response.ok) { await loadProducts(); setNotice('Product deleted.'); } }
  async function updateOrder(id: number, status: string) { const response = await fetch('/api/orders', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) }); const data = await response.json().catch(() => ({})); if (response.ok) { setPendingStatuses((current) => { const next = { ...current }; delete next[id]; return next; }); await loadOrders(); setNotice(`Order #${id} is now ${status}.`); } else setNotice(data.error || 'Could not update order.'); }
  async function addQueue(event: React.FormEvent) { event.preventDefault(); const response = await fetch('/api/mess/queue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ label: queueLabel }) }); if (response.ok) { setQueueLabel(''); await loadQueue(); } }
  async function updateQueue(id: number, status: string) { const response = await fetch('/api/mess/queue', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) }); if (response.ok) await loadQueue(); }

  function uploadImage(file: File | undefined) { if (!file) return; if (!file.type.startsWith('image/')) { setNotice('Choose an image file.'); return; } const reader = new FileReader(); reader.onload = () => setImage(String(reader.result || '')); reader.readAsDataURL(file); }
  function orderItems(order: Order) { try { return JSON.parse(order.items) as { name: string; quantity: number }[]; } catch { return []; } }

  return <main className="min-h-screen bg-[#0d0e13] px-4 py-8 text-white sm:px-8">
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><a href="/" className="logo text-xl">Quick<span className="gradient">Bite</span></a><p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-[#ff8a72]">Canteen dashboard</p><h1 className="mt-2 text-4xl font-black">Operations deck</h1><p className="mt-2 text-[#aa8982]">Manage menu, canteen orders, and the separate mess queue.</p></div><div className="flex items-center gap-3"><a href="/owner/sales" className="rounded-xl bg-[#ff5e3a] px-4 py-3 text-sm font-bold">Sales report</a><a href="/" className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold">Student view</a></div></header>
      {notice && <div className="mb-5 rounded-xl border border-[#ff5e3a]/30 bg-[#ff5e3a]/10 px-4 py-3 text-sm text-[#ffb4a3]">{notice}</div>}

      <section className="glass mb-6 overflow-hidden p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ff8a72]">Sales report</p>
            <h2 className="mt-1 text-3xl font-black">Performance analytics</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-[#aa8982]">
            {orders.length === 0 ? 'Sample preview' : `${orders.length} orders tracked`}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[{ label: 'Revenue', value: `₹${sales.totalRevenue.toFixed(0)}`, detail: 'Gross sales', accent: 'from-[#ff5e3a] to-[#ff9a6b]' }, { label: 'Avg order', value: `₹${sales.averageOrderValue.toFixed(0)}`, detail: 'Per order value', accent: 'from-[#e1037d] to-[#ff66c4]' }, { label: 'Today', value: `₹${sales.todaysRevenue.toFixed(0)}`, detail: `${sales.todaysOrders} orders`, accent: 'from-[#9647ff] to-[#b88cff]' }, { label: 'Completed', value: `₹${sales.completedRevenue.toFixed(0)}`, detail: `${sales.salesByStatus.completed ?? 0} fulfilled`, accent: 'from-[#11b981] to-[#50f1b8]' }].map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-[#14161d] p-4">
              <div className={`mb-3 h-1.5 rounded-full bg-gradient-to-r ${card.accent}`} />
              <p className="text-xs uppercase tracking-[0.18em] text-[#aa8982]">{card.label}</p>
              <p className="mt-3 text-3xl font-black">{card.value}</p>
              <p className="mt-1 text-sm text-[#aa8982]">{card.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-white/10 bg-[#14161d] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Weekly revenue trend</h3>
              <span className="text-xs uppercase tracking-[0.18em] text-[#aa8982]">Last 7 days</span>
            </div>
            <div className="flex h-40 items-end gap-3">
              {sales.salesTrend.map((point) => {
                const maxRevenue = Math.max(...sales.salesTrend.map((item) => item.revenue), 1);
                const height = `${Math.max(10, (point.revenue / maxRevenue) * 100)}%`;
                return (
                  <div key={point.label} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <div className="flex w-full items-end justify-center rounded-t-2xl bg-gradient-to-t from-[#ff5e3a] via-[#ff8571] to-[#ffc2ab]" style={{ height }} />
                    <span className="text-[10px] text-[#aa8982]">{point.label.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#14161d] p-4">
            <h3 className="text-xl font-bold">Order mix</h3>
            <div className="mt-4 space-y-4">
              {Object.entries(sales.salesByStatus).map(([status, count]) => {
                const total = sales.totalOrders || 1;
                const width = `${(count / total) * 100}%`;
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
              Peak slot: <span className="font-bold text-white">{sales.peakSlot}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-[#14161d] p-4">
            <h3 className="text-xl font-bold">Top selling items</h3>
            <div className="mt-4 space-y-3">
              {sales.topProducts.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff5e3a] to-[#e1037d] text-sm font-black text-white">{index + 1}</div>
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-[#aa8982]">{item.quantity} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#ffb4a3]">₹{item.revenue.toFixed(0)}</p>
                    <p className="text-xs text-[#aa8982]">{item.share.toFixed(0)}% share</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#14161d] p-4">
            <h3 className="text-xl font-bold">Quick insight</h3>
            <div className="mt-4 space-y-3 text-sm text-[#d8d1d4]">
              <div className="rounded-xl bg-white/5 p-3">
                <span className="text-[#aa8982]">Best performer</span>
                <p className="mt-1 text-lg font-bold text-white">{sales.topProducts[0]?.name ?? 'No sales yet'}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <span className="text-[#aa8982]">Today&apos;s sales</span>
                <p className="mt-1 text-lg font-bold text-white">₹{sales.todaysRevenue.toFixed(0)}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <span className="text-[#aa8982]">Orders in queue</span>
                <p className="mt-1 text-lg font-bold text-white">{Math.max(0, (sales.salesByStatus.submitted ?? 0) + (sales.salesByStatus.preparing ?? 0))}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <section className="glass p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#ff8a72]">Menu control</p><h2 className="mt-1 text-2xl font-bold">{editingId ? 'Edit product' : 'Add product'}</h2></div>{editingId && <button onClick={clearForm} className="text-sm text-[#ff8a72]">Cancel</button>}</div>
          <form onSubmit={saveProduct} className="space-y-4"><label className="block text-sm font-bold">Product name<input required value={name} onChange={(event) => setName(event.target.value)} className="field mt-2" placeholder="Paneer Wrap" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-bold">Price<input required min="1" type="number" value={price} onChange={(event) => setPrice(event.target.value)} className="field mt-2" placeholder="99" /></label><label className="block text-sm font-bold">Category<input required value={category} onChange={(event) => setCategory(event.target.value)} className="field mt-2" placeholder="Meals" /></label></div><label className="block text-sm font-bold">Image URL<input value={image.startsWith('data:') ? '' : image} onChange={(event) => setImage(event.target.value)} className="field mt-2" placeholder="https://..." /></label><label className="block cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-[#aa8982]">Or upload this product&apos;s image<input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} className="mt-2 block w-full text-xs" />{image.startsWith('data:') && <span className="mt-2 block text-emerald-300">Image selected and ready to save.</span>}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isVeg} onChange={(event) => setIsVeg(event.target.checked)} /> Vegetarian product</label><button className="btn w-full" type="submit">{editingId ? 'Save changes' : 'Add product'}</button></form>
        </section>

        <section className="glass p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#ff8a72]">Canteen only</p><h2 className="mt-1 text-2xl font-bold">Incoming orders</h2></div><button onClick={loadOrders} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">Refresh</button></div>{orders.length === 0 ? <p className="rounded-xl bg-white/5 p-5 text-[#aa8982]">No orders yet.</p> : <div className="space-y-3">{orders.map((order) => <article key={order.id} className="rounded-xl border border-white/10 bg-white/5 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">Token #{order.token} · {order.student_name || 'Student'}</h3><p className="mt-1 text-xs text-[#aa8982]">Pickup {order.slot_time} · {orderItems(order).map((item) => `${item.name} × ${item.quantity}`).join(', ')}</p></div><div className="text-right"><p className="font-bold text-[#ffb4a3]">₹{order.total}</p><select value={pendingStatuses[order.id] || order.status} onChange={(event) => setPendingStatuses((current) => ({ ...current, [order.id]: event.target.value }))} className="mt-2 rounded-lg bg-[#292a2f] px-2 py-2 text-xs">{statuses.map((item) => <option value={item} key={item}>{item}</option>)}</select><button type="button" onClick={() => updateOrder(order.id, pendingStatuses[order.id] || order.status)} className="ml-1 rounded-lg bg-[#ff5e3a] px-2 py-2 text-xs font-bold">Save</button></div></div></article>)}</div>}</section>
      </div>

      <section className="mt-6"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#ff8a72]">Live menu</p><h2 className="mt-1 text-2xl font-bold">Student menu products <span className="text-base text-[#aa8982]">({products.length})</span></h2></div></div>{products.length === 0 ? <div className="glass p-8 text-center text-[#aa8982]">No products available.</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{products.map((product) => <article className="glass overflow-hidden" key={product.id}><img src={product.image} alt={product.name} className="h-32 w-full object-cover" /><div className="p-3"><h3 className="truncate font-bold">{product.name}</h3><p className="text-xs text-[#aa8982]">{product.category} · {product.is_veg ? 'Veg' : 'Non-veg'}</p><p className="mt-2 font-black text-[#ffb4a3]">₹{product.price}</p><div className="mt-3 flex gap-2"><button onClick={() => startEdit(product)} className="flex-1 rounded-lg bg-white/10 px-2 py-2 text-xs font-bold">Edit</button><button onClick={() => deleteProduct(product.id)} className="flex-1 rounded-lg bg-red-500/15 px-2 py-2 text-xs font-bold text-red-200">Delete</button></div></div></article>)}</div>}</section>

      <section className="glass mt-6 p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-[#e1037d]">Mess only</p><h2 className="mt-1 text-2xl font-bold">Mess queue control</h2></div><form onSubmit={addQueue} className="flex gap-2"><input value={queueLabel} onChange={(event) => setQueueLabel(event.target.value)} className="field" placeholder="Optional label" /><button className="rounded-xl bg-[#e1037d] px-4 py-2 text-sm font-bold">Generate token</button></form></div>{queue.length === 0 ? <p className="rounded-xl bg-white/5 p-4 text-sm text-[#aa8982]">No active mess queue entries.</p> : <div className="space-y-2">{queue.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 p-3"><span><b>#{entry.position}</b> {entry.label}</span><select value={entry.status} onChange={(event) => updateQueue(entry.id, event.target.value)} className="rounded-lg bg-[#292a2f] px-3 py-2 text-xs"><option>waiting</option><option>serving</option><option>completed</option></select></div>)}</div>}</section>
    </div>
  </main>;
}
