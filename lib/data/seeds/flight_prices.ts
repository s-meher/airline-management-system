import type { FlightPrice } from "@/lib/models/types";

/** Published fares for Economy and First on representative flights */
export const FLIGHT_PRICES: readonly FlightPrice[] = [
  { flight_price_id: 1001, flight_id: 101, cabin_class: "economy", currency_code: "USD", amount: 219.0 },
  { flight_price_id: 1002, flight_id: 101, cabin_class: "first", currency_code: "USD", amount: 879.0 },
  { flight_price_id: 1003, flight_id: 102, cabin_class: "economy", currency_code: "USD", amount: 229.0 },
  { flight_price_id: 1004, flight_id: 102, cabin_class: "first", currency_code: "USD", amount: 919.0 },
  { flight_price_id: 1005, flight_id: 103, cabin_class: "economy", currency_code: "USD", amount: 269.0 },
  { flight_price_id: 1006, flight_id: 103, cabin_class: "first", currency_code: "USD", amount: 929.0 },
  { flight_price_id: 1007, flight_id: 104, cabin_class: "economy", currency_code: "USD", amount: 359.0 },
  { flight_price_id: 1008, flight_id: 104, cabin_class: "first", currency_code: "USD", amount: 1349.0 },
  { flight_price_id: 1009, flight_id: 105, cabin_class: "economy", currency_code: "USD", amount: 249.0 },
  { flight_price_id: 1010, flight_id: 105, cabin_class: "first", currency_code: "USD", amount: 889.0 },
  { flight_price_id: 1011, flight_id: 106, cabin_class: "economy", currency_code: "USD", amount: 329.0 },
  { flight_price_id: 1012, flight_id: 106, cabin_class: "first", currency_code: "USD", amount: 1199.0 },
  { flight_price_id: 1013, flight_id: 107, cabin_class: "economy", currency_code: "USD", amount: 199.0 },
  { flight_price_id: 1014, flight_id: 107, cabin_class: "first", currency_code: "USD", amount: 759.0 },
  { flight_price_id: 1015, flight_id: 108, cabin_class: "economy", currency_code: "USD", amount: 219.0 },
  { flight_price_id: 1016, flight_id: 108, cabin_class: "first", currency_code: "USD", amount: 879.0 },
  { flight_price_id: 1017, flight_id: 109, cabin_class: "economy", currency_code: "USD", amount: 269.0 },
  { flight_price_id: 1018, flight_id: 109, cabin_class: "first", currency_code: "USD", amount: 929.0 },
  { flight_price_id: 1019, flight_id: 110, cabin_class: "economy", currency_code: "USD", amount: 359.0 },
  { flight_price_id: 1020, flight_id: 110, cabin_class: "first", currency_code: "USD", amount: 1349.0 },
  { flight_price_id: 1021, flight_id: 111, cabin_class: "economy", currency_code: "USD", amount: 229.0 },
  { flight_price_id: 1022, flight_id: 111, cabin_class: "first", currency_code: "USD", amount: 899.0 },
];
