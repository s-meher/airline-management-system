import type { CreditCard } from "@/lib/models/types";

export const CREDIT_CARDS: readonly CreditCard[] = [
  {
    credit_card_id: 1,
    customer_id: 1,
    billing_address_id: 1,
    card_brand: "Visa",
    last_four: "4242",
    exp_month: 9,
    exp_year: 2028,
  },
  {
    credit_card_id: 2,
    customer_id: 1,
    billing_address_id: 2,
    card_brand: "American Express",
    last_four: "3005",
    exp_month: 4,
    exp_year: 2027,
  },
  {
    credit_card_id: 3,
    customer_id: 2,
    billing_address_id: 3,
    card_brand: "Mastercard",
    last_four: "8891",
    exp_month: 11,
    exp_year: 2029,
  },
];
