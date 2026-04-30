import type { Airport } from "@/lib/models/types";

export const AIRPORTS: readonly Airport[] = [
  {
    airport_code: "ORD",
    airport_name: "Chicago O'Hare International",
    city: "Chicago",
    region: "IL",
    country: "USA",
    timezone: "America/Chicago",
  },
  {
    airport_code: "SFO",
    airport_name: "San Francisco International",
    city: "San Francisco",
    region: "CA",
    country: "USA",
    timezone: "America/Los_Angeles",
  },
  {
    airport_code: "JFK",
    airport_name: "John F. Kennedy International",
    city: "New York",
    region: "NY",
    country: "USA",
    timezone: "America/New_York",
  },
];
