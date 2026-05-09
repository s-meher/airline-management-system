/** Total seats per cabin — matches seeded `flight_cabin_inventory.seats_total`. */
export function economySeatTotal(flight_id: number) {
  return 150 + (flight_id % 4) * 12;
}

export function firstSeatTotal(flight_id: number) {
  return 16 + (flight_id % 3) * 4;
}

/**
 * @deprecated Use database `flight_cabin_inventory` via API; kept for tests only.
 */
export function getSeatCapacitySummary(flight_id: number) {
  const economy_capacity = economySeatTotal(flight_id);
  const first_capacity = firstSeatTotal(flight_id);

  const economy_sold = Math.min(economy_capacity, 40 + (flight_id % 11) * 9);
  const first_sold = Math.min(first_capacity, 2 + (flight_id % 7));

  const economy_remaining = Math.max(0, economy_capacity - economy_sold);
  const first_remaining = Math.max(0, first_capacity - first_sold);

  return {
    economy_capacity,
    economy_remaining,
    first_capacity,
    first_remaining,
  };
}
