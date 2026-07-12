# Summit Sensory Gym — Internal CPQ Platform

This is the Version 1 build of the internal proposal/pricing/project platform described in
`summit_sensory_gym_cpq_spec.docx`. It replaces the multi-tab Excel proposal workbook with:

- Customer, contact, and project records
- A product database with a formula-based hardware/BOM calculator (fulfillment-only visibility)
- A proposal builder that auto-generates a clean PDF (no manual line-filtering or layout fixes)
- Proposal versioning (a sent proposal is frozen — later price changes never rewrite it)
- Third-party sourcing tracking (flags items that need outside vendor orders, with a status report)
- Freight request tracking (flags items needing a freight quote, tracks sent/received/forgotten)
- Role-based logins (Owner, Sales, Fulfillment, Installation, Accounting, Read-only)
- An audit log of key actions
- Deposit/final payment schedule per proposal, feeding QuickBooks Online invoice creation
- QuickBooks Online integration: customer matching, deposit/final/full invoice creation,
  duplicate-invoice prevention, and balance/status refresh (needs your QBO developer app
  credentials — see "Connecting QuickBooks Online" below)
- PandaDoc e-signature: sends the generated proposal PDF for signature and tracks status via
  webhook (needs your PandaDoc API key — see "Connecting PandaDoc" below)

Not yet built (see the spec's Open Questions / Phase 4+): vendor price auto-pull and
discount/approval workflows — these depend on decisions the spec flags as still open (which
vendors can support automated pricing, and whether any approval gate is actually needed).

## Tech stack

Next.js (React, TypeScript) + PostgreSQL, using Drizzle as the database layer (not Prisma —
Prisma's installer was blocked in the sandbox this was built in, so Drizzle was used instead;
it works the same way for our purposes and needs no extra setup). PDFs are generated with
`@react-pdf/renderer`. This stack deploys cleanly to Vercel, which is built by the same team as
Next.js.

## One-time setup: push this code to GitHub

1. Go to https://github.com/new and create a new **private** repository (e.g. `summit-cpq`).
   Don't add a README/gitignore/license — leave it empty.
2. On your own computer, open a terminal in this project folder and run:
   ```
   git init
   git add .
   git commit -m "Initial Summit Sensory Gym CPQ platform"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/summit-cpq.git
   git push -u origin main
   ```
   (GitHub will show you these exact commands on the empty repo's page too.)

## One-time setup: deploy to Vercel

1. Go to https://vercel.com and sign in (you can sign in with your GitHub account directly).
2. Click **Add New… → Project**, then select the `summit-cpq` GitHub repo you just pushed.
3. Vercel will detect it's a Next.js app automatically — you don't need to change any build
   settings. Don't click Deploy yet — first add the database (next step), since the app needs
   `DATABASE_URL` to build correctly.
4. In the same project setup screen (or afterward, under **Storage**), click **Create Database**
   and choose a Postgres option (Vercel Postgres, or Neon — either works). Connect it to the
   project. Vercel will automatically set the `DATABASE_URL` environment variable for you.
5. Under **Settings → Environment Variables**, add:
   - `SESSION_SECRET` — a long random string. Generate one by running `openssl rand -base64 32`
     in any terminal (Mac/Linux), or ask Claude/ChatGPT to generate a random 32+ character string.
6. Add two more environment variables (Settings → Environment Variables):
   - `SEED_OWNER_EMAIL` — the email you want to log in with
   - `SEED_OWNER_PASSWORD` — a temporary password (you'll change it after first login)
   - `SETUP_TOKEN` — any random string you make up (this just prevents a stranger from creating
     an account before you do)
7. Click **Deploy**. The database tables are created automatically as part of this build — no
   separate step needed.

## One-time setup: create your first login (no terminal needed)

Once your deploy finishes, visit this URL in your browser (replace with your real domain and the
`SETUP_TOKEN` value you set above):

```
https://your-vercel-domain.vercel.app/api/setup?token=YOUR_SETUP_TOKEN
```

You'll see a plain text confirmation message. That's it — go to `/login` and sign in with
`SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`, then **change your password immediately** from Account
Settings. This link is safe to visit more than once — it only ever creates the owner account if no
one has logged in yet.

## Local development (optional, for future changes)

```
npm install
cp .env.example .env.local   # fill in a local or dev DATABASE_URL and a SESSION_SECRET
npm run db:push              # creates tables
npm run db:seed              # creates a dev login
npm run dev                  # starts the app at http://localhost:3000
```

## Connecting QuickBooks Online

Once a proposal is marked **Accepted**, you can create a deposit/final/full invoice directly in
QuickBooks Online from the proposal page. To enable this:

1. Go to https://developer.intuit.com and sign in (or create a free Intuit developer account).
2. Create a new app, choose **QuickBooks Online and Payments**, and select the scopes for
   accounting.
3. Under your app's **Keys & OAuth** page, copy the **Client ID** and **Client Secret**.
4. Add a Redirect URI: `https://your-vercel-domain.vercel.app/api/qbo/callback` (use your real
   Vercel domain). You can add both a production and a `http://localhost:3000/api/qbo/callback`
   entry for local testing.
5. In Vercel (Settings → Environment Variables), add:
   - `QBO_CLIENT_ID`
   - `QBO_CLIENT_SECRET`
   - `QBO_REDIRECT_URI` — must exactly match what you entered in step 4
   - `QBO_ENVIRONMENT` — `sandbox` while testing, `production` once you're ready to invoice real
     customers (Intuit's sandbox and production companies use different URLs and credentials)
6. Redeploy, then sign in as the Owner and go to **Account Settings → Connect QuickBooks Online**.
   You'll be redirected to Intuit to authorize, then brought back here — that's it.

**Mapping products to QuickBooks items:** open a product and set its QuickBooks item ID once your
QuickBooks item list is set up (Products & Services in QBO). If a proposal's line items aren't all
mapped yet, invoices are still created, just as a single lump-sum line instead of itemized —
nothing blocks you from invoicing while item mapping is still in progress.

## Connecting PandaDoc

Sending a proposal for e-signature uploads the generated PDF to PandaDoc and emails your primary
contact a signature request.

1. Go to https://www.pandadoc.com, sign in, and open **Settings → Integrations → API**.
2. Copy your API key.
3. In Vercel, add environment variable `PANDADOC_API_KEY`.
4. (Optional but recommended) Under **Settings → API & Webhooks** in PandaDoc, add a webhook
   pointed at `https://your-vercel-domain.vercel.app/api/pandadoc/webhook` so this app
   automatically updates a proposal's status as the customer views/signs it, without you having to
   check PandaDoc directly.
5. Redeploy. On any sent proposal, the **Send for signature (PandaDoc)** button will now work.

Signature placement is currently a fixed position (bottom of the first page) — reasonable for a
single-page proposal, but if your proposals commonly run longer, open
`src/lib/pandadoc/client.ts` and adjust the `pandadoc_fields` position/page once you've seen a
real generated proposal.

## Adding products and their hardware (BOM) formulas

Each product can define:
- **Dimension fields** — the measurements a proposal-builder needs to enter for that product
  (e.g. `length_ft`).
- **BOM formulas** — one per hardware component, written as a simple math expression using those
  dimension keys plus `quantity` (the line quantity). Example: `ceil(length_ft * 2) + 4`. These
  are evaluated safely (no arbitrary code execution) and shown only to Owner/Sales/Fulfillment
  roles, never on the customer-facing PDF.

## What still needs your input before it's fully "done"

See Sections 7–9 of `summit_sensory_gym_cpq_spec.docx` for the full list. Resolved so far:
payment structure is deposit + final (defaults to 50/50, editable per proposal in the Totals &
Terms section). Still open, in priority order:

1. **Role/permission matrix** — confirm who besides you and fulfillment needs a login, and what
   they should and shouldn't see (cost/margin especially). The current roles (Owner, Sales,
   Fulfillment, Installation, Accounting, Read-only) are a starting assumption.
2. **Freight vendor capability** — which vendors could support anything beyond a manual email, so
   the freight module can move from "track manually" to "send automatically."
3. **QuickBooks Online item mapping** — once your QBO item list is set up, map each product to its
   QBO item (Products → product → QuickBooks item ID) so invoices itemize correctly instead of
   showing a single lump-sum line.
4. **Vendor price auto-pull** — needs a vendor-by-vendor review of what each supplier can actually
   support (API, price list export, or neither).
