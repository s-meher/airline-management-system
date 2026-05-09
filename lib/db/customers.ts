import { getPool } from "@/lib/db/pool";

export interface DbCustomer {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

export async function listCustomers(): Promise<DbCustomer[]> {
  const pool = getPool();
  const res = await pool.query<DbCustomer>(
    `SELECT customer_id, first_name, last_name, email, phone
     FROM customer
     ORDER BY last_name, first_name, customer_id`,
  );
  return res.rows;
}

export async function findCustomerById(customer_id: number): Promise<DbCustomer | null> {
  const pool = getPool();
  const res = await pool.query<DbCustomer>(
    `SELECT customer_id, first_name, last_name, email, phone
     FROM customer WHERE customer_id = $1 LIMIT 1`,
    [customer_id],
  );
  return res.rows[0] ?? null;
}

export async function findCustomerByEmail(email: string): Promise<DbCustomer | null> {
  const pool = getPool();
  const res = await pool.query<DbCustomer>(
    `SELECT customer_id, first_name, last_name, email, phone
     FROM customer
     WHERE lower(trim(email)) = lower(trim($1))
     LIMIT 1`,
    [email],
  );
  return res.rows[0] ?? null;
}

export async function findLoginRow(email: string): Promise<
  | (DbCustomer & {
      password_hash: string | null;
    })
  | null
> {
  const pool = getPool();
  const res = await pool.query<DbCustomer & { password_hash: string | null }>(
    `SELECT customer_id, first_name, last_name, email, phone, password_hash
     FROM customer
     WHERE lower(trim(email)) = lower(trim($1))
     LIMIT 1`,
    [email],
  );
  return res.rows[0] ?? null;
}

export async function createCustomerWithPassword(input: {
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
}): Promise<DbCustomer> {
  const pool = getPool();
  const res = await pool.query<DbCustomer>(
    `INSERT INTO customer (first_name, last_name, email, password_hash)
     VALUES ($1,$2,$3,$4)
     RETURNING customer_id, first_name, last_name, email, phone`,
    [input.first_name, input.last_name, input.email, input.password_hash],
  );
  return res.rows[0]!;
}
