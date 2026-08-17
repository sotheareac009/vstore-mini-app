import mysql from "mysql2/promise";
const c = await mysql.createConnection({host:"194.59.164.32",port:3306,
  user:"u554116939_uat",password:"0@zG&Xi0:Le",database:"u554116939_uat",connectTimeout:15000});
const [rows] = await c.query(`
  SELECT t.term_id id, t.name, t.slug, tt.parent, tt.count
  FROM wp_terms t JOIN wp_term_taxonomy tt ON tt.term_id=t.term_id
  WHERE tt.taxonomy='product_cat' ORDER BY tt.parent, tt.count DESC`);
const byParent = new Map();
for (const r of rows) { if(!byParent.has(r.parent)) byParent.set(r.parent, []); byParent.get(r.parent).push(r); }
const name = new Map(rows.map(r=>[r.id, r.name]));
function walk(parent, depth) {
  for (const r of byParent.get(parent) ?? []) {
    console.log(`${"    ".repeat(depth)}${r.name}  [${r.slug}]  (${r.count})`);
    walk(r.id, depth+1);
  }
}
console.log(`total categories: ${rows.length}\n`);
walk(0, 0);
await c.end();
