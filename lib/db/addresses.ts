import { getPool } from "@/lib/db/pool";

export interface DbAddress {
  address_id: number;
  customer_id: number;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
}

export async function listAddresses(customer_id: number): Promise<DbAddress[]> {
  const pool = getPool();
  const res = await pool.query<DbAddress>(
    `SELECT address_id, customer_id, line1, line2, city, region, postal_code, country, is_primary
     FROM address
     WHERE customer_id = $1
     ORDER BY is_primary DESC, address_id DESC`,
    [customer_id],
  );
  return res.rows;
}

export async function createAddress(input: Omit<DbAddress, "address_id">) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (input.is_primary) {
      await client.query(`UPDATE address SET is_primary = FALSE WHERE customer_id = $1`, [
        input.customer_id,
      ]);
    }
    const res = await client.query<DbAddress>(
      `INSERT INTO address (customer_id, line1, line2, city, region, postal_code, country, is_primary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING address_id, customer_id, line1, line2, city, region, postal_code, country, is_primary`,
      [
        input.customer_id,
        input.line1,
        input.line2,
        input.city,
        input.region,
        input.postal_code,
        input.country,
        input.is_primary,
      ],
    );
    await client.query("COMMIT");
    return res.rows[0]!;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function updateAddress(
  customer_id: number,
  address_id: number,
  patch: Partial<Omit<DbAddress, "address_id" | "customer_id">>,
) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (patch.is_primary) {
      await client.query(`UPDATE address SET is_primary = FALSE WHERE customer_id = $1`, [
        customer_id,
      ]);
    }

    const res = await client.query<DbAddress>(
      `UPDATE address SET
         line1 = COALESCE($3, line1),
         line2 = COALESCE($4, line2),
         city = COALESCE($5, city),
         region = COALESCE($6, region),
         postal_code = COALESCE($7, postal_code),
         country = COALESCE($8, country),
         is_primary = COALESCE($9, is_primary)
       WHERE customer_id = $1 AND address_id = $2
       RETURNING address_id, customer_id, line1, line2, city, region, postal_code, country, is_primary`,
      [
        customer_id,
        address_id,
        patch.line1 ?? null,
        patch.line2 ?? null,
        patch.city ?? null,
        patch.region ?? null,
        patch.postal_code ?? null,
        patch.country ?? null,
        typeof patch.is_primary === "boolean" ? patch.is_primary : null,
      ],
    );

    await client.query("COMMIT");
    return res.rows[0] ?? null;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteAddress(customer_id: number, address_id: number) {
  const pool = getPool();
  const res = await pool.query(
    `DELETE FROM address WHERE customer_id = $1 AND address_id = $2`,
    [customer_id, address_id],
  );
  return (res.rowCount ?? 0) > 0;
}

