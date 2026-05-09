import { findCustomerById } from "@/lib/db/customers";
import { readSessionPayload } from "@/lib/auth/sessionCookie";

export async function requireCustomerSession() {
  const session = await readSessionPayload();
  if (!session) return null;
  const customer = await findCustomerById(session.customer_id);
  if (!customer || customer.email !== session.email) return null;
  return customer;
}
