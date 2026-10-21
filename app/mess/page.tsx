'use client';

import { useEffect, useState } from 'react';

type QueueEntry = { id: number; label: string; position: number; status: string };

export default function MessQueuePage() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [myEntry, setMyEntry] = useState<QueueEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function loadQueue() {
    const response = await fetch('/api/mess/queue', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      setEntries(data.entries || []);
      setMyEntry(data.myEntry || null);
    }
  }

  async function generateNumber() {
    setBusy(true);
    const response = await fetch('/api/mess/queue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) { setMessage(data.error || 'Please sign in first.'); return; }
    setMyEntry(data.entry);
    setMessage(data.existing ? 'You already have an active mess queue number.' : `Your mess queue number is #${data.entry.position}.`);
    loadQueue();
  }

  useEffect(() => { loadQueue(); const timer = window.setInterval(loadQueue, 10000); return () => window.clearInterval(timer); }, []);

  return <main className="min-h-screen bg-[#0d0e13] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-xl"><a href="/" className="text-sm text-[#ff8a72]">← Back to canteen</a><div className="mt-8 flex items-center justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff8a72]">Mess only</p><h1 className="mt-2 text-3xl font-black">Mess queue</h1><p className="mt-2 text-[#aa8982]">This queue is separate from canteen orders.</p></div><button onClick={loadQueue} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">Refresh</button></div>
    <section className="glass mt-6 p-6 text-center"><p className="text-xs font-bold uppercase tracking-widest text-[#e1037d]">Your queue ticket</p>{myEntry ? <><p className="mt-3 text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff5e3a] via-[#e1037d] to-[#a37dff]">#{myEntry.position}</p><p className="mt-2 text-lg font-bold">{myEntry.status === 'serving' ? 'Please proceed to the mess counter' : myEntry.status === 'waiting' ? 'You are in the waiting queue' : myEntry.status}</p><button onClick={loadQueue} className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">Check my position</button></> : <><p className="mt-4 text-[#aa8982]">Generate a number when you arrive at the mess.</p><button disabled={busy} onClick={generateNumber} className="btn mt-5 w-full">{busy ? 'Generating…' : 'Generate my queue number'}</button></>}</section>
    {message && <p className="mt-4 rounded-xl bg-white/10 p-3 text-center text-sm text-[#ffb4a3]">{message}</p>}
    <section className="glass mt-6 p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Live queue</h2><span className="text-sm text-[#aa8982]">{entries.length} waiting</span></div>{entries.length === 0 ? <p className="py-6 text-center text-[#aa8982]">No active mess queue entries.</p> : <div className="space-y-3">{entries.map((entry) => <div key={entry.id} className={`flex items-center justify-between rounded-xl p-4 ${myEntry?.id === entry.id ? 'bg-[#e1037d]/20 ring-1 ring-[#e1037d]' : 'bg-white/5'}`}><span className="font-bold">#{entry.position} · {entry.label}</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize">{entry.status}</span></div>)}</div>}</section></div></main>;
}
