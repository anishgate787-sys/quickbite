'use client';

import { useEffect, useState } from 'react';
import { emojiFor } from '@/lib/emoji';
import { slots } from '@/lib/slots';

type Product = { id: number; name: string; price: number; category: string; image: string; emoji?: string; is_veg?: number };
type OrderItem = { name: string; quantity: number; price: number };
type Order = { id: number; token: number; items: string | OrderItem[]; total: number; slot_time: string; status: string; order_type?: string };

const statusText: Record<string, string> = { submitted: 'Order received', preparing: 'Being prepared', ready: 'Ready for pickup', completed: 'Completed', cancelled: 'Cancelled' };

function readItems(order: Order): OrderItem[] {
  try { return typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch { return []; }
}

export default function Home() {
  const [menu, setMenu] = useState<Product[]>([]);
  const [view, setView] = useState('feed');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [slot, setSlot] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const total = Object.entries(cart).reduce((sum, [name, quantity]) => sum + (menu.find((item) => item.name === name)?.price || 0) * quantity, 0);
  const filtered = menu.filter((item) => category === 'All' || item.category === category);
  const categories = ['All', ...new Set(menu.map((item) => item.category))];

  async function loadMenu() { const response = await fetch('/api/menu', { cache: 'no-store' }); if (response.ok) setMenu((await response.json()).items || []); }
  async function loadOrders() { const response = await fetch('/api/orders', { cache: 'no-store' }); if (response.ok) setOrders((await response.json()).orders || []); }
  useEffect(() => { loadMenu(); loadOrders(); const refresh = () => { loadMenu(); loadOrders(); }; window.addEventListener('focus', refresh); const timer = window.setInterval(loadOrders, 3000); return () => { window.removeEventListener('focus', refresh); window.clearInterval(timer); }; }, []);
  function add(name: string) { setCart((current) => ({ ...current, [name]: (current[name] || 0) + 1 })); setMessage(`${name} added`); window.setTimeout(() => setMessage(''), 1500); }
  async function confirm() { setBusy(true); const items = Object.entries(cart).map(([name, quantity]) => ({ name, quantity, price: menu.find((item) => item.name === name)?.price || 0 })); const response = await fetch('/api/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items, slot }) }); const data = await response.json(); setBusy(false); if (!response.ok) { setMessage(data.error || 'Please sign in first'); return; } setCart({}); setMessage(`Order confirmed · Token #${data.order.token}`); setView('orders'); loadOrders(); }

  return <>
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-[#121318ee] px-4 py-3 backdrop-blur-xl"><a href="/" className="logo text-xl">Quick<span className="gradient">Bite</span></a><span className="hidden text-xs text-[#aa8982] sm:block">Main Canteen · Ground floor</span><nav className="ml-auto flex gap-1 rounded-full bg-[#0d0e13] p-1">{['feed', 'preorder', 'orders'].map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${view === item ? 'bg-[#ff5e3a] text-white' : 'text-[#aa8982]'}`}>{item}</button>)}</nav><a href="/login" className="rounded-full bg-[#292a2f] px-3 py-2 text-xs">Sign in</a><a href="/owner" className="hidden rounded-full bg-[#292a2f] px-3 py-2 text-xs sm:block">Owner</a></header>
    <main className="mx-auto min-h-screen max-w-xl px-4 pb-24 pt-4">
      {view === 'feed' && <><div className="mb-4 flex gap-2 overflow-auto">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${category === item ? 'bg-[#ff5e3a]' : 'bg-[#292a2f] text-[#aa8982]'}`}>{item}</button>)}</div>{filtered.length === 0 ? <section className="glass p-8 text-center"><h1 className="text-2xl">Your menu is empty</h1><p className="mt-2 text-[#aa8982]">Add products from the Owner page with their correct images.</p><a href="/owner" className="btn mt-5 inline-block">Open owner menu</a></section> : <div className="space-y-4">{filtered.map((product) => <article className="glass overflow-hidden" key={product.name}><img src={product.image} alt={product.name} className="h-56 w-full object-cover"/><div className="p-4"><div className="flex justify-between"><div><h2 className="text-2xl">{product.name}</h2><p className="text-sm text-[#aa8982]">{product.category} · {product.emoji || emojiFor(product.name)}</p></div><b className="font-[Syne] text-2xl text-[#ffb4a3]">₹{product.price}</b></div><button className="btn mt-4 w-full" onClick={() => add(product.name)}>Add to order</button></div></article>)}</div>}</>}
      {view === 'preorder' && <section><h1 className="mb-4 text-3xl">Your preorder</h1><div className="glass p-4">{Object.keys(cart).length === 0 && <p className="text-[#aa8982]">Your cart is empty.</p>}{Object.entries(cart).map(([name, quantity]) => <div className="flex justify-between border-b border-white/10 py-3" key={name}><span>{emojiFor(name)} {name} × {quantity}</span><b>₹{(menu.find((item) => item.name === name)?.price || 0) * quantity}</b></div>)}<div className="mt-4 flex justify-between text-lg"><b>Total</b><b>₹{total}</b></div></div><div className="glass mt-4 p-4"><h2 className="text-xl">Choose pickup time</h2><div className="grid grid-cols-3 gap-2 py-4">{slots.map((item) => <button key={item} onClick={() => setSlot(item)} className={`rounded-xl p-3 text-xs ${slot === item ? 'bg-[#e1037d]' : 'bg-[#1a1b21]'}`}>{item}</button>)}</div><button className="btn w-full" disabled={!total || !slot} onClick={() => setView('payment')}>Proceed to payment · ₹{total}</button></div></section>}
      {view === 'payment' && <section><button className="mb-4 text-sm text-[#ff8a72]" onClick={() => setView('preorder')}>← Back</button><h1 className="text-3xl">Pay ₹{total}</h1><p className="text-[#aa8982]">Pickup {slot}</p><div className="glass mt-4 p-4 text-center"><img src="/payment-qr.jpg" alt="UPI QR" className="mx-auto w-full max-w-sm rounded-2xl bg-white p-3"/><p className="mt-3">UPI ID: <b>anishgate787-2@okicici</b></p><p className="mt-1 text-2xl text-[#ffb4a3]">Amount ₹{total}</p></div><button className="btn mt-4 w-full" disabled={busy} onClick={confirm}>{busy ? 'Confirming…' : 'I paid · confirm order'}</button></section>}
      {view === 'orders' && <section><div className="mb-4 flex items-center justify-between"><h1 className="text-3xl">My orders</h1><button onClick={loadOrders} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">Refresh</button></div>{orders.length === 0 && <div className="glass p-5 text-[#aa8982]">No orders yet.</div>}<div className="space-y-4">{orders.map((order) => <article className="glass p-5" key={order.id}><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-[#aa8982]">Token #{order.token} · Pickup {order.slot_time}</p><h2 className="mt-1 text-xl font-bold">{statusText[order.status] || order.status}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-300' : order.status === 'cancelled' ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-200'}`}>{order.status}</span></div><div className="mt-4 space-y-2 border-t border-white/10 pt-3">{readItems(order).map((item, index) => <div className="flex justify-between text-sm" key={`${item.name}-${index}`}><span>{item.name} × {item.quantity}</span><span>₹{item.price * item.quantity}</span></div>)}</div><div className="mt-4 flex justify-between font-bold"><span>Total</span><span className="text-[#ffb4a3]">₹{order.total}</span></div></article>)}</div></section>}
    </main>
    {message && <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#292a2f] px-5 py-3">{message}</div>}
    <footer className="fixed bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-[#292a2f]/95 p-2"><button className="btn" onClick={() => setView('preorder')}>Cart {Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)}</button><a className="btn bg-white/10" href="/mess">Mess queue</a></footer>
  </>;
}
