# Freedom Flowers — Clay-Connected Prospecting Command Center

A hyperlocal **B2B** prospecting tool for **Cindy Hatch's** florist business, Freedom
Flowers (Guadalajara, MX). It finds local businesses and referral partners near you,
finds the right person to contact, and tracks each one from lead → **recurring account**.

> **This is not a retail POS.** Walk-ins and one-off online orders are unpredictable.
> This tool chases the reliable money a florist actually banks on. Same design system
> and structure as the original Command Center — repainted warm-botanical, pointed at
> flowers.

Built as a single-file React component (`FreedomFlowersProspecting.jsx`) that runs as a
Claude artifact: `window.storage` for persistence and a client-side Anthropic call for
the AI scorer.

---

## The money thesis

A florist makes reliable money from **relationships that repeat**, not transactions
that don't:

1. **Recurring commercial accounts** — offices, hotels, restaurants, spas, clinics on a
   weekly/biweekly fresh-flower program.
2. **Weddings & events** — high ticket, and every couple/planner/venue refers the next.
3. **Sympathy / funeral standing accounts** — steady, high-trust, recurring volume.
4. **Seasonal peaks** — Día de Muertos, Navidad, San Valentín, Día de las Madres, etc.,
   pitched *ahead* of time.

So every prospect is tagged with **which offer** fits and a **deal band**, and the
dashboard **annualizes recurring deals** — a MX$2,000/week contract shows as
~MX$104,000/year, so you can see the real worth of a weekly account next to a one-off
event.

> **Assumption:** location is set to **Guadalajara, Jalisco, MX** (inferred from
> `freedomflowers.mx` and your original tool). All price bands are placeholder MXN —
> change any of them in the `OFFERS` array. If your area is different, tell me and I'll
> re-seed.

---

## The six ICP segments (what every Clay search is built from)

| Segment | Who | Typical buyer |
|---|---|---|
| 🏢 **Recurring commercial** | Offices, boutique hotels, restaurants, spas, salons, medical/dental/law, coworking | Office Manager · GM · Facilities · Owner |
| 💍 **Event & wedding referral** | Wedding/event planners, venues, hotels w/ event space, photographers | Events Director · Wedding Coordinator · Owner |
| 🍽️ **Hospitality & experience** | Restaurants, boutique hotels, spas wanting a signature look | GM · Owner |
| 🕊️ **Sympathy channel** | Funeral homes, hospices | Funeral Director · Owner |
| 🏡 **Real estate & interiors** | Brokerages, home stagers, interior designers | Broker/Owner · Lead Stager · Designer |
| 🎁 **Corporate gifting / HR** | Holiday & employee-milestone flower programs | HR · Office Manager · Executive Assistant |

Everything is filtered to your **local area** using Clay's location filter.

---

## The offer catalog (every prospect gets ONE + a deal band)

| Offer | Structure | Placeholder band (MXN) | Annualized* |
|---|---|---|---|
| **Weekly / Biweekly Corporate Contract** | Recurring retainer | MX$1,500–4,000 / week | ≈ MX$78k–208k/yr |
| **Wedding & Event Floral Package** | Per event | MX$18,000–90,000 / event | per event |
| **Recurring Subscription (small biz / VIP)** | Monthly | MX$900–2,800 / month | ≈ MX$10.8k–33.6k/yr |
| **Sympathy / Funeral Standing Account** | Per arrangement, recurring | MX$1,200–3,800 / arrangement | ≈ MX$28.8k+/yr |
| **Corporate Gifting Program** | Seasonal + milestones | MX$25,000–180,000 / season | per season |
| **Referral Partner (planner / venue)** | Pipeline value, not direct revenue | MX$60,000–300,000 / yr referred | referred pipeline |

\* The tool computes annualized value from the offer's recurrence (weekly ×52, monthly
×12, sympathy ×24) using the **low** end of the band as a conservative estimate.

---

## The seasonal calendar (pitch *ahead* of each peak)

The tool tracks a peak calendar and, on the header + stats row, always shows the **next
upcoming peak**, how many days out it is, and whether the outreach window is open (based
on each peak's lead time). Tag any prospect with a season to line it up.

| Peak | Date (Guadalajara/MX) | Pitch ~ahead | Lead offers |
|---|---|---|---|
| 🌼 **Día de Muertos** | Nov 1–2 | 5 wks | Events · Corporate gifting · Sympathy |
| 🎄 **Navidad / Fin de Año** | Dec | 8 wks | Corporate gifting · Weekly contracts |
| 💝 **San Valentín** | Feb 14 | 6 wks | Subscriptions · Corporate gifting |
| 🌸 **Día de las Madres** | **May 10 (fixed)** — Mexico's biggest florist day | 6 wks | Corporate gifting · Subscriptions |
| 🎓 **Graduaciones** | Jun | 5 wks | Events · Corporate gifting |
| 💐 **Día de la Secretaria** | Jul | 4 wks | Corporate gifting · Weekly contracts |
| 💍 **Temporada de Bodas (otoño)** | Oct | 12 wks | Weddings · Referral partners |

The **"Next peak"** button opens a panel listing exactly which open prospects to contact
for the upcoming peak (matched by season tag or by the offer that peak wants).

---

## The Clay workflow

Clay lives in your Claude chat (workspace: **Cindy's Workspace**). This board is your
CRM; Claude runs the enrichment and you log results back.

1. **Add a business** — from a walk-by, Instagram, a wedding directory, or the AI
   scorer. Give it a **domain** (Clay needs a domain, e.g. `hoteldemetria.com`, not just
   a name).
2. **Ask Claude to enrich it** — in chat: *"enrich `{domain}` in Clay and find the
   Office Manager / Events Director / GM in Guadalajara."* Claude runs Clay's
   find-and-enrich company + contacts tools on your workspace.
3. **Paste the buyer back** — drop the name / title / LinkedIn into the prospect drawer
   and flip **Stage → Enriched**. **An email address costs an extra Clay data point** —
   spend it only when you're ready to reach out.
4. **Work it to a recurring account** — Contacted → Sample/Meeting → Quote Sent → Trial
   Order → Recurring Account (Won).

### 💳 A note on Clay credits
Company + contact enrichment consume workspace credits, and **emails cost an extra data
point per contact**. Enrich a few high-fit prospects at a time, and only pull emails
when you're about to contact someone. Don't bulk-enrich the whole board on day one.

---

## The live proof (one real trial enrichment)

During setup I ran **one real Clay enrichment** on a local business so you can see the
full loop before spending more credits:

- **Hotel Demetria** (`hoteldemetria.com`) — boutique design hotel, Av. La Paz 2219,
  Guadalajara. Clay returned verified firmographics: **Hospitality · Guadalajara, MX ·
  ~26 employees · MX$10–25M revenue · LinkedIn `company/hotel-demetria`**. It's seeded as
  an **Enriched** prospect (weekly-contract offer, hospitality segment), flagged ★.
- **Honest limit:** contact enrichment returned **0 LinkedIn profiles** — small boutique
  teams often aren't on LinkedIn. So the buyer here is a **walk-in or email-data-point**
  play, not a LinkedIn pull. That's the loop working *and* showing you where a credit is
  actually worth spending.

The other ~11 seeds are **illustrative**: real, well-known Guadalajara businesses used as
example targets across all six segments, with buyer + firmographics left blank on
purpose — **enrich each in Clay to verify the company and find the real person** before
reaching out. Good candidates for your *next* real pull (they'll have richer LinkedIn
coverage): **Wizeline** (corporate gifting), **IOS Offices** (recurring commercial).

---

## What's in the app

- **Pipeline CRM** — stages: Lead → Researching → Enriched → Contacted → Sample/Meeting
  → Quote Sent → Trial Order → Recurring Account (Won) → Lost → Nurture.
- **Per-prospect fields** — business, domain, segment, offer, deal band, local area,
  season/campaign, floral fit score, buying signal, buyer name/title/LinkedIn/email,
  Clay-enriched flag, next action + date, notes, and a stage timeline.
- **AI "Score a business" panel** — paste a local business's website/about text or a
  description; it scores fit as a recurring/event floral account, picks the offer to
  lead with, tags a season, and names the **buyer title to find in Clay**.
- **"How Clay plugs in"** explainer — the four-step enrichment loop, in-app.
- **Seasonal panel** — the full peak calendar + who to contact for the next peak.
- **Stats row** — prospects · open pipeline · recurring accounts won · **annualized
  pipeline value** · next seasonal peak.

## Running it

Drop `FreedomFlowersProspecting.jsx` into a Claude artifact (or any React app that
provides `window.storage`). It seeds itself on first load and persists to
`window.storage` (`ff-prospects`, `ff-log`). The AI scorer uses a client-side Anthropic
call, matching the original tool.

## Tuning it

- **Price bands** → edit the `OFFERS` array.
- **Location / area** → change the `area` defaults + the scorer prompt.
- **Segments / buyers** → edit `SEGMENTS`.
- **Seasonal peaks** → edit `PEAKS` (dates, lead weeks, which offers each peak favors).
