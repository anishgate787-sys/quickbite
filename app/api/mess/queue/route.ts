import db from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET() {
  const entries = db.prepare("select * from mess_queue where status!='completed' order by position asc, id asc").all();
  const user = await currentUser();
  const myEntry = user?.role === 'student' ? db.prepare("select * from mess_queue where student_id=? and status!='completed' order by id desc limit 1").get(user.id) || null : null;
  return Response.json({ entries, myEntry });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Sign in required to generate a queue number.' }, { status: 401 });
  const body = await req.json();
  const isStudent = user.role === 'student';
  const existing = isStudent ? db.prepare("select * from mess_queue where student_id=? and status!='completed' order by id desc limit 1").get(user.id) : null;
  if (existing) return Response.json({ entry: existing, existing: true });
  const label = String(body.label || '').trim() || user.name || 'Mess visitor';
  const max = (db.prepare('select max(position) position from mess_queue where status!=\'completed\'').get() as { position: number | null })?.position || 0;
  const result = db.prepare('insert into mess_queue(label,student_id,position) values(?,?,?)').run(label, isStudent ? user.id : null, max + 1);
  const entry = db.prepare('select * from mess_queue where id=?').get(result.lastInsertRowid);
  return Response.json({ entry }, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== 'owner') return Response.json({ error: 'Owner sign in required.' }, { status: 401 });
  const body = await req.json();
  const id = Number(body.id);
  const status = String(body.status || 'waiting');
  if (!['waiting', 'serving', 'completed'].includes(status)) return Response.json({ error: 'Invalid queue status.' }, { status: 400 });
  const result = db.prepare('update mess_queue set status=? where id=?').run(status, id);
  if (!result.changes) return Response.json({ error: 'Queue entry not found.' }, { status: 404 });
  return Response.json({ ok: true });
}
