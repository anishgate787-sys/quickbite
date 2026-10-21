import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
const dir=path.join(process.cwd(),'data'); fs.mkdirSync(dir,{recursive:true});
const db=new Database(path.join(dir,'quickbite.db'));
db.pragma('journal_mode = WAL');
db.exec(`create table if not exists users(id integer primary key autoincrement,name text not null,email text unique not null,password text not null,role text not null default 'student',created_at text default current_timestamp);create table if not exists sessions(token text primary key,user_id integer not null,expires_at integer not null);create table if not exists menu_items(id integer primary key autoincrement,name text not null unique,price real not null,category text not null,image text not null,is_veg integer not null default 1,active integer not null default 1,created_at text default current_timestamp,updated_at text default current_timestamp);create table if not exists orders(id integer primary key autoincrement,student_id integer not null,items text not null,total real not null,slot_time text not null,txn text default '',token integer not null,status text not null default 'submitted',order_type text not null default 'canteen',created_at text default current_timestamp);create table if not exists mess_queue(id integer primary key autoincrement,label text not null,student_id integer,position integer not null,status text not null default 'waiting',created_at text default current_timestamp);`);
try{db.exec("alter table orders add column txn text default ''")}catch{}
try{db.exec("alter table orders add column status text not null default 'submitted'")}catch{}
try{db.exec("alter table orders add column order_type text not null default 'canteen'")}catch{}
try{db.exec("alter table menu_items add column is_veg integer not null default 1")}catch{}
try{db.exec("alter table menu_items add column active integer not null default 1")}catch{}
try{db.exec("alter table mess_queue add column student_id integer")}catch{}

const menuCount=(db.prepare('select count(*) count from menu_items').get() as {count:number}).count;
if(menuCount===0){
  const seed=db.prepare('insert into menu_items(name,price,category,image,is_veg) values(?,?,?,?,?)');
  const products=[
    ['Chicken Biryani',120,'Meals','https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=85',0],
    ['Paneer Tikka',110,'Meals','https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=85',1],
    ['Cheese Burger',95,'Snacks','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',1],
    ['French Fries',55,'Snacks','https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85',1],
    ['Cold Coffee',60,'Drinks','https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85',1],
    ['Margherita Pizza',130,'Meals','https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85',1]
  ];
  const transaction=db.transaction(()=>products.forEach((product)=>seed.run(...product)));
  transaction();
}
export default db;
