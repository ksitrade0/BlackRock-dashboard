import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'ruha_app-admin',
  password: '2144Jannat@',
  database: 'ruha_inventory',
});

export async function query(sql: string, values: any[] = []) {
  const [results] = await pool.execute(sql, values);
  return results;
}