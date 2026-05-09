# FlightDesk — CS 425 Airline Flight Booking

FlightDesk is a **CS 425 database course project**: an airline booking UI aligned to a relational schema, with **PostgreSQL** for search, authentication, account data, bookings, fare inventory, and API rate limiting.

## Tech Stack

- **Next.js** (App Router) and **TypeScript**
- **Tailwind CSS**
- **PostgreSQL** (see `db/schema.sql`, `docker-compose.yml`)
- **Sessions**: signed JWT in an httpOnly cookie (`flightdesk.session`), backed by bcrypt password hashes on `customer`

## Features

- **Home**: flight, airport, and booking summaries from PostgreSQL (falls back to bundled seed fixtures if the database is unreachable — for demos, keep Postgres running)
- **Search**: nonstop and one-stop itineraries with optional date range, airline filter, sort, and pagination (`GET /api/search`); per-IP rate limiting
- **Flight details**: PostgreSQL flight row; fares from `flight_price`; cabin **seat inventory** from `flight_cabin_inventory`
- **Book**: single-leg (`?flightId=`) or multi-leg (`?flightIds=1,2`); reserves seats per cabin before inserting `booking` + `booking_flight`
- **Bookings**: list and cancel for the signed-in customer; cancel releases reserved seats in a transaction
- **Register / account**: customers (with passwords), addresses, and credit cards in PostgreSQL

## Environment

Copy `.env.example` to `.env.local` and set:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Secret used to sign session JWTs (use a strong random value in production) |
| `SEED_USER_PASSWORD` | Optional; bcrypt-updates seeded customers during `db:seed` (default: `flightdesk`) |

## Database setup

1. Start Postgres (e.g. `npm run db:up` with Docker Compose).
2. Migrate and seed:

```bash
npm run db:migrate
npm run db:seed
```

Or reset schema + seed:

```bash
npm run db:reset
```

## Running the app

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. **Register** or **sign in** (after seeding, demo passwords default to `flightdesk` unless `SEED_USER_PASSWORD` was set), then search, book, and manage bookings.

## Tests

```bash
npm run test
```

## App structure

- **`app/`** — routes and API handlers (`app/api/*`)
- **`components/`** — UI (including `components/ui/`)
- **`lib/db/`** — connection pool, SQL queries, inventory, rate limits
- **`lib/data/`** — read-only TypeScript fixtures aligned with seed SQL (homepage fallback and labels where useful)
- **`lib/models/`** — shared TypeScript types

## Notes

- Times are shown in **UTC**.
- **Rate limits**: search (and other guarded routes) track requests per client IP in Postgres (`api_rate_limit`).
- **`next build`** may try to fetch remote fonts; offline builds can fail for that reason — `npm run test` and `npx tsc --noEmit` are useful checks.

## Possible extensions

- OAuth / MFA and staff roles
- Seat maps and operational schedule tooling
