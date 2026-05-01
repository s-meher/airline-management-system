# FlightDesk — CS 425 Airline Flight Booking (Mock Demo)

FlightDesk is a **CS 425 database course project** that demonstrates an airline flight booking experience with a clean, professional UI. The current version is a **frontend demo powered by mock data** (no real database connection yet).

## Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Client-side demo stores** (React Context + `localStorage`)

## Main Features (Demo)

- **Home**: product-like overview with mock-backed summary cards
- **Search flights**: route/date filters with result cards and prices (Economy/First)
- **Flight details**: route, times, prices, and demo seat availability
- **Booking flow (mock)**: choose class → choose saved card → confirm → success state
- **Manage bookings (mock)**: list bookings by “current customer”, cancel bookings, status updates

## Running Locally

1. Install dependencies

```bash
npm install
```

2. Start the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## App Structure (High-level)

- **`app/`**: Next.js routes (App Router)
  - `app/page.tsx`: homepage
  - `app/search/page.tsx`: search form + results
  - `app/search/[flightId]/page.tsx`: flight details
  - `app/book/page.tsx`: booking wizard (mock)
  - `app/bookings/page.tsx`: manage bookings (mock)
  - `app/account/page.tsx`: my account (profile management — WIP)
- **`components/`**: reusable UI and page components
  - `components/ui/`: small UI primitives (`Card`, `Button`, `Field`)
- **`lib/models/`**: TypeScript domain types that mirror the schema
- **`lib/data/`**: mock seed “tables” + small lookup helpers
- **`lib/store/`**: client-side demo stores (bookings, etc.)
- **`lib/utils/`**: small formatting + demo helpers

## Mock Data and Schema Mapping

The UI is intentionally built to reflect a relational database design. Mock data lives in `lib/data/seeds/` and follows schema-like naming (`snake_case` fields).

Current “tables” represented:

- `airport`
- `airline`
- `customer`
- `address`
- `credit_card`
- `flight`
- `flight_price`
- `booking`
- `booking_flight`

Schema relationships reflected in the UI:

- **Customer → Addresses / Credit Cards**: saved profile data per customer
- **Credit Card → Billing Address**: `credit_card.billing_address_id`
- **Booking → Credit Card**: bookings reference saved cards via `booking.credit_card_id`
- **Booking → Flights**: multi-segment itineraries via `booking_flight`

## Notes

- **No authentication** yet. The app uses a simple “current customer” selector for demos.
- **No real payments**. The booking flow stores confirmations in `localStorage`.
- Times are displayed in **UTC** for consistent class demos.

## Future Improvements (Short List)

- Add full **My Account** management (add/edit/delete addresses and payment methods)
- Implement **connections / multi-leg search** (beyond direct flights)
- Persist demo data behind a real API + database (Postgres/MySQL)
- Add booking details pages and better itinerary presentation
- Add basic form validation and error states (still demo-friendly)
