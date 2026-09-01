# N5Deal Marketplace Prototype

A working prototype of an M&A marketplace with three roles: Buyer, Seller and
Platform Manager. 

- Sellers publish assets and browse buyers. 
- Buyers keep a profile with their investment interests and browse assets. 
- The Platform Manager sees everyone and can suspend participants or listings that do not follow platform rules.

## Tech stack

- Next.js
- Prisma 7
- Tailwind
- Zod
- Vitest
- Netlify

## Live demo

Deployed at: **https://magnificent-rugelach-2d25a4.netlify.app/**

There is no sign up. Use the dropdown in the header to switch between demo
users. The navigation and available actions change with the role.

Demo accounts in the seed data:

| Role | Example user | What you can do |
| --- | --- | --- |
| Seller | Vertex Holding, Bondar Capital | Publish assets, browse buyers, contact a buyer |
| Buyer | Hrytsenko Family Office, Melnyk Ventures | Edit profile, browse assets, contact a seller |
| Platform Manager | Olena Marchenko | See all participants and assets, suspend and restore |

The seed data includes one suspended seller, one suspended buyer and one
suspended asset, so the moderation flow can be checked without changing
anything first.

## Run locally

You need Node.js version >=22 and a PostgreSQL database. The project was built with
Neon, but any Postgres will work.

```bash
git clone <repository-url>
cd n5deal_app
npm install
```

Create a `.env` file in the project root:

```
DATABASE_URL="postgresql://user:password@host-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@host.region.aws.neon.tech/neondb?sslmode=require"
```

Two connection strings are needed. `DATABASE_URL` goes through the connection
pooler and is used by the application. `DIRECT_URL` bypasses the pooler and is
used by Prisma CLI for migrations and seeding, because pgbouncer in transaction
mode does not support the advisory locks that migrations need.

Then run:

```bash
npx prisma migrate deploy
npm run db:seed
npm run dev
```

The app starts on `http://localhost:3000`.

Useful scripts:

```bash
npm test           # run the unit tests
npm run test:watch # run them in watch mode
npm run db:seed    # reload demo data
npm run db:reset   # drop everything, re-apply migrations, seed again
npx prisma studio  # inspect the database in a browser
```

## Key technical decisions

### One `User` table for all three roles

**What I chose.** A single `User` table with a `role` enum, plus a separate
`BuyerProfile` table linked one to one.

**Why.** The `Inquiry` table connects two participants. With separate `Buyer`
and `Seller` tables there would be nowhere to put the foreign keys, so I would
need a polymorphic reference (`senderId` plus `senderType`). That loses
referential integrity in the database and makes every query for a sender or a
recipient more complicated. The manager also needs one list of participants
with shared search and one suspend action, which is one query on one table
instead of two queries merged in memory.

**The alternative.** Separate tables per role. This gives cleaner columns for
each role, but the cost above is higher than the benefit for this size of
project.

**The cost of my choice.** The database does not guarantee that only users with
role `BUYER` have a `BuyerProfile`. This is checked in application code. With
more roles I would reconsider.

### Buyer profile is a separate table, seller profile is not

The assignment gives the Buyer an explicit action: "create and maintain their
profile" and "describe their investment/acquisition interests". The Seller has
no such action. A seller publishes assets and contacts buyers, so a name and a
company name on the `User` row are enough. The data model follows the same
asymmetry as the requirements.

### Filter state lives in the URL

**What I chose.** Filters and search are read from `searchParams` on the server.
The page builds a Prisma `where` clause and returns rendered HTML. There is no
client state for filters.

**Why.** The assignment requires that application state survives a refresh. With
the state in the URL this works without any browser storage. A filtered view can
also be shared as a link, and the browser back button behaves correctly.
Filtering happens in the database, not in the browser, so it does not break when
the data grows.

**The alternative.** `useState` with client side filtering of a loaded array.
Faster to write, but a refresh loses the filters, which is exactly what the
requirements ask for.

**The cost of my choice.** Every filter change is a navigation and a server
request. Text search needs a debounce (350 ms), otherwise it would send one
request per keystroke.

I use `router.replace` and not `router.push`, so clicking six filter chips does
not add six entries to the browser history. In a catalog people usually press
back to leave the page, not to undo the last filter.

### Budget filter as an overlap of two ranges

A buyer has a budget range and the filter is also a range. The correct question
is not "is the buyer budget inside the filter" but "do the two ranges overlap".
Two ranges overlap when each one starts no later than the other one ends:

```ts
...(f.maxBudget !== null ? { budgetMin: { lte: f.maxBudget } } : {}),
...(f.minBudget !== null ? { budgetMax: { gte: f.minBudget } } : {}),
```

A naive version (`budgetMin >= minBudget`) would hide buyers who can actually
afford the deal.

### Moderation as status fields, not deletion

Participants and assets have a `status`, a `suspensionReason` and a
`statusChangedAt`. A suspended participant disappears from the public listing
but stays visible to the manager.

Two rules that follow from this:

Assets of a suspended seller are hidden from the public catalog even when the
asset itself is still `PUBLISHED`. This condition is part of the base `where`
clause, so it cannot be forgotten:

```ts
{ status: "PUBLISHED", seller: { status: "ACTIVE" } }
```

The same visibility conditions are repeated on the detail pages. Without them a
suspended asset would still open through a direct link. A hidden item returns
404 and not a message like "this asset is suspended", because moderation should
not be observable from the outside.

The one exception is the owner. A seller sees their own suspended assets with
the reason on the "My assets" page. Hiding it from the owner would leave the
person guessing why their listing disappeared.

### No authentication, but role checks are real

**What I chose.** There is no sign up or login. The current user is stored in a
cookie and switched from the header.

**Why a cookie and not React context or localStorage.** Most pages are server
components, so they need to know the current user during rendering. A cookie is
readable on the server with `cookies()`, survives a refresh, and has the same
shape as a real session. Swapping it for NextAuth would only change
`lib/session.ts`, not the pages.

**What is still checked.** Server actions verify the role on the server, not
only by hiding buttons in the UI. A server action is a public endpoint and can
be called directly. `getCurrentUser` also checks that the user is still
`ACTIVE`, so a participant suspended during a session immediately loses access.

**How I would do real authentication.** NextAuth with an email provider, the
role stored in the session token, and the same `requireUser(role)` helper called
from every server action. The permission checks would stay where they are now.

### Contact is a form, not a chat

An inquiry is a single message stored in the `Inquiry` table. Both sides see
their inquiries on one page, split into received and sent. There is no real time
chat and no replies.

The recipient is not taken from the form. The form only sends an asset id or a
buyer id, and the server resolves the recipient from the database using the same
visibility rules. This also covers a race: if the listing was suspended while
the message was being typed, the inquiry is rejected at send time.

Sending the same inquiry twice about the same asset is blocked, so the button
cannot be used to spam.

### Validation with Zod on the server

The same schema describes the form and validates the data inside the server
action. HTML attributes like `required` are only hints for the browser and can
be removed in devtools.

Some rules cannot be expressed in HTML at all, for example EBITDA must not be
greater than annual revenue, and the upper budget must not be lower than the
lower one. These are cross field checks in the Zod schema.

### Design tokens instead of hardcoded colors

Colors, borders and radii are defined once in `globals.css` as theme variables,
and reused as classes like `card`, `field`, `pill`, `btn-primary`. Changing the
palette is one file, not fifty. The class name also explains intent, while
`bg-[#3b49e8]` only says a value.

### Prisma 7 with a driver adapter

Prisma 7 requires a driver adapter, and the connection string moved from the
schema to `prisma.config.ts`. This turned out to fit the Neon setup well: the
CLI uses the direct connection for migrations, and the application uses the
pooled connection through `PrismaPg`.

The Prisma client instance is cached on `globalThis` in development, otherwise
every hot reload would open a new connection pool and the database would run out
of connections.

### Asset matching by rule-based scoring

Every buyer profile page shows suggested assets, ranked by how well each listing
fits that mandate. The scoring lives in `lib/matching.ts` and runs on four
signals with different weights:

| Signal | Weight | Why this weight |
| --- | --- | --- |
| Industry | 40 | The strongest filter in M&A. A healthcare-only buyer will not look at a metal plant at any price. |
| Budget overlap | 30 | A deal that does not fit the budget cannot happen. |
| Deal type | 20 | Important, but buyers are often flexible on structure. |
| Region | 10 | The softest constraint of the four. |

An asset needs at least the industry weight to appear at all, so a listing that
only shares a region is not suggested. Without that threshold the list would
just be every asset in a near random order, and nobody would trust it.

Each suggestion shows the reasons it was picked. A recommendation the user
cannot explain is a recommendation they will not act on.

I deliberately did not use an external LLM API here. A weighted score is
deterministic, explainable, needs no API key for a reviewer to run the project,
and cannot invent a match that does not exist. I call it relevance scoring and
not AI in the interface, because that is what it is.

The current version loads all published assets and scores them in memory. On 15
rows this is cheaper than expressing the scoring in SQL. With real data volume
the scoring would move into the query.

### Testing

Tests cover the pure functions where a silent bug would be expensive:
`lib/filters.ts`, `lib/matching.ts` and `lib/validation.ts`. There is no
database in the tests, so they run in milliseconds.

What they protect:

- The platform rule that assets of a suspended seller never reach the public
  catalog. If someone removes that condition from the base `where` clause, a
  test fails.
- The budget filter as a range overlap, including a price sitting exactly on the
  boundary.
- Multi select filters meaning OR and not AND.
- Invalid URL values being dropped and a reversed price range being reset.
- Empty optional money fields becoming `null` and not `0`. If this broke, an
  asset would display "EBITDA: $0" instead of "Not disclosed", and no error
  would appear anywhere.
- Cross field validation rules that HTML cannot express.


## Assumptions

The assignment is intentionally open, so I made these decisions myself.

**What an asset is.** A business or a financial asset offered for sale, with an
industry, a deal type, a region and an asking price. Revenue, EBITDA and the
stake percentage are optional, because in real M&A listings sellers do not
disclose everything. This also gives real empty states in the UI.

**Money.** Stored as integers in whole US dollars. In M&A the amounts are large
and cents are meaningless. Using `Decimal` would pull Decimal.js into the client
and add serialization work in server components for no benefit.

**Industries, deal types and regions are enums**, not lookup tables. Postgres
arrays of enums let me filter a buyer's interests with a single `hasSome` query
and no join tables. The cost is that adding an industry needs a migration, which
is acceptable for a prototype.

**Multi select filters mean OR, not AND.** Selecting Retail and Energy shows
buyers interested in either of them. This matches what people expect from filter
chips.

**Who can contact whom.** A buyer contacts a seller about a specific asset. A
seller contacts a buyer about their mandate. Users with the same role cannot
contact each other.

**What suspend means.** The participant or the listing is hidden from the public
marketplace but is not deleted. Data stays in the database and the action is
reversible. A reason is required, and the participant can see it.

**A buyer without a profile is not in the directory.** There is nothing to
search by, so an empty card would be noise. The profile page explains this.

## Edge cases handled

These were not in the assignment, but they show up quickly when you use the app:

- Invalid values in the URL, for example `?industry=BANANA`, are filtered
  against a whitelist. Without this Prisma would throw an error on the page.
- A reversed price range (min greater than max) resets the upper bound instead
  of silently returning an empty list.
- Assets of a suspended seller are hidden even when the asset is published.
- Suspended items return 404 on a direct link, not a "suspended" message.
- A seller sees their own suspended listings with the reason.
- Long strings without spaces in a description do not break the layout.
- Duplicate inquiries about the same asset are blocked.
- A listing suspended while a message is being written is rejected on send.
- Empty states are written as invitations to act, not as "no data".

## AI tools used

I used Claude as a working partner through the whole project, in a chat where I
first described my stack, my time budget and the scope decisions I had already
made.

**What it was good for.** Discussing the data model before writing any code. Writing repetitive UI code once the
pattern was decided. Reading build logs from Netlify and pointing at the actual
failing line.

**What I did myself.** All scope decisions, the data model, the choice of what
to build and what to leave out, and what things to add or fix. I reviewed every piece of code before adding it. 
Several suggestions I rejected or changed, for example the back link that
lost the filters, the form losing data after error validation and a publish directory setting that broke the Netlify build.

**How I checked the output.** I ran every feature locally after adding it, and
verified the moderation rules directly in the database with Prisma Studio.

## What I would improve with more time

**Authentication and permissions.** NextAuth with the role in the session, and a
middleware guarding the `/admin` and `/my` routes instead of a redirect in every
page component.

**More tests.** The pure logic is covered. The next layer would be integration
tests for the server actions, checking that role verification and the duplicate
inquiry rule hold. That needs a mocked Prisma client or a test database, which
is why it did not fit in the time available.

**Better matching.** The weights are my product hypothesis, not a measured
result. With usage data they should be tuned against which suggestions actually
led to an inquiry. The scoring should also move into the query once the catalog
grows past a few hundred rows.

**Real messaging.** `Conversation` and `Message` tables so both sides can reply,
plus unread counters.

**Pagination.** Right now the catalogs load every matching row. With realistic
data this needs cursor based pagination.

**Moderation history.** A separate table with every suspend and restore action,
the manager who did it and the reason. Right now restoring clears the reason.

**A shared filter component.** `AssetFilters` and `BuyerFilters` are almost
identical. I kept the duplication on purpose so each file stays readable, but
with more filters it would be worth extracting.

**Active link highlighting in the header.** The header is a server component
because it queries users, so highlighting the current page would need to split
it into two components.

## Time spent

About 10-12 hours with planning architecture, deploy (I did it first) and developing the app. 
The work was done in this order:
1. Deployment pipeline and empty project on Netlify
2. Database schema, migrations and seed data
3. Asset catalog with filters, search and detail page
4. Buyer catalog and buyer profile page
5. Demo user switching
6. Asset publishing form and the seller's own asset list
7. Buyer profile creation and editing
8. Inquiries between buyers and sellers
9. Platform manager moderation panel
10. Visual pass to match the N5Deal design
11. Asset matching for buyer profiles and unit tests
12. UX improvement for AssetForm component.