import db from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET() {
  const items = db.prepare('select id,name,price,category,image,is_veg from menu_items where active=1 order by category,name').all();
  return Response.json({ items });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== 'owner') return Response.json({ error: 'Owner sign in required.' }, { status: 401 });
  const body = await req.json();
  const name = String(body.name || '').trim();
  const price = Number(body.price);
  const category = String(body.category || 'Other').trim() || 'Other';
  const image = String(body.image || '').trim();
  const isVeg = body.isVeg === false ? 0 : 1;
  if (!name || !Number.isFinite(price) || price <= 0 || !image) return Response.json({ error: 'Name, valid price, and image are required.' }, { status: 400 });
  try {
    const result = db.prepare('insert into menu_items(name,price,category,image,is_veg) values(?,?,?,?,?)').run(name, price, category, image, isVeg);
    return Response.json({ item: db.prepare('select id,name,price,category,image,is_veg from menu_items where id=?').get(result.lastInsertRowid) }, { status: 201 });
  } catch {
    return Response.json({ error: 'A product with this name already exists.' }, { status: 409 });
  }
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== 'owner') return Response.json({ error: 'Owner sign in required.' }, { status: 401 });
  const body = await req.json();
  const id = Number(body.id);
  const name = String(body.name || '').trim();
  const price = Number(body.price);
  const category = String(body.category || 'Other').trim() || 'Other';
  const image = String(body.image || '').trim();
  const isVeg = body.isVeg === false ? 0 : 1;
  if (!Number.isInteger(id) || !name || !Number.isFinite(price) || price <= 0 || !image) return Response.json({ error: 'Complete product details are required.' }, { status: 400 });
  try {
    const result = db.prepare('update menu_items set name=?,price=?,category=?,image=?,is_veg=?,updated_at=current_timestamp where id=?').run(name, price, category, image, isVeg, id);
    if (!result.changes) return Response.json({ error: 'Product not found.' }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'A product with this name already exists.' }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== 'owner') return Response.json({ error: 'Owner sign in required.' }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get('id'));
  const result = db.prepare('delete from menu_items where id=?').run(id);
  if (!result.changes) return Response.json({ error: 'Product not found.' }, { status: 404 });
  return Response.json({ ok: true });
}
