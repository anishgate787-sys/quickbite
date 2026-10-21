import {cookies} from 'next/headers';
import db from '@/lib/db';
export type SessionUser={id:number;name:string;role:string};
export async function currentUser(){const token=(await cookies()).get('qb_session')?.value;if(!token)return null;return (db.prepare('select u.id,u.name,u.role from sessions s join users u on u.id=s.user_id where s.token=? and s.expires_at>?').get(token,Date.now()) as SessionUser|undefined)||null}
