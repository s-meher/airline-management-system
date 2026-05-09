import { getPool } from "@/lib/db/pool";

export interface DbCreditCard {
  credit_card_id: number;
  customer_id: number;
  billing_address_id: number;
  card_brand: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
}

export async function listCreditCards(customer_id: number): Promise<DbCreditCard[]> {
  const pool = getPool();
  const res = await pool.query<DbCreditCard>(
    `SELECT credit_card_id, customer_id, billing_address_id, card_brand, last_four, exp_month, exp_year
     FROM credit_card
     WHERE customer_id = $1
     ORDER BY credit_card_id DESC`,
    [customer_id],
  );
  return res.rows;
}

export async function createCreditCard(input: Omit<DbCreditCard, "credit_card_id">) {
  const pool = getPool();
  const res = await pool.query<DbCreditCard>(
    `INSERT INTO credit_card (customer_id, billing_address_id, card_brand, last_four, exp_month, exp_year)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING credit_card_id, customer_id, billing_address_id, card_brand, last_four, exp_month, exp_year`,
    [
      input.customer_id,
      input.billing_address_id,
      input.card_brand,
      input.last_four,
      input.exp_month,
      input.exp_year,
    ],
  );
  return res.rows[0]!;
}

export async function updateCreditCard(
  customer_id: number,
  credit_card_id: number,
  patch: Partial<Omit<DbCreditCard, "credit_card_id" | "customer_id">>,
) {
  const pool = getPool();
  const res = await pool.query<DbCreditCard>(
    `UPDATE credit_card SET
       billing_address_id = COALESCE($3, billing_address_id),
       card_brand = COALESCE($4, card_brand),
       last_four = COALESCE($5, last_four),
       exp_month = COALESCE($6, exp_month),
       exp_year = COALESCE($7, exp_year)
     WHERE customer_id = $1 AND credit_card_id = $2
     RETURNING credit_card_id, customer_id, billing_address_id, card_brand, last_four, exp_month, exp_year`,
    [
      customer_id,
      credit_card_id,
      patch.billing_address_id ?? null,
      patch.card_brand ?? null,
      patch.last_four ?? null,
      patch.exp_month ?? null,
      patch.exp_year ?? null,
    ],
  );
  return res.rows[0] ?? null;
}

export async function deleteCreditCard(customer_id: number, credit_card_id: number) {
  const pool = getPool();
  const res = await pool.query(
    `DELETE FROM credit_card WHERE customer_id = $1 AND credit_card_id = $2`,
    [customer_id, credit_card_id],
  );
  return (res.rowCount ?? 0) > 0;
}

