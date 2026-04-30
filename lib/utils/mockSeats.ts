/**
 * Deterministic seat availability for demos.
 *
 * This intentionally stays OUTSIDE the domain model (no DB yet), but provides
 * a realistic “capacity summary” for the flight details UI.
 */
export function getSeatCapacitySummary(flight_id: number) {
  // Small, plausible jet configs for demo
  const economy_capacity = 150 + (flight_id % 4) * 12; // 150–186
  const first_capacity = 16 + (flight_id % 3) * 4; // 16–24

  // Deterministic “sold” counts that look believable
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

