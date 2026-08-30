# Metamorfosis Cognitiva — Client Prospecting Command Center

A Clay-connected prospecting tool for **Cindy Hatch's** AI content-strategy consultancy.
It finds and tracks the companies most likely to **pay** for the work — AEO/GEO,
AI content governance, conversation design, bilingual AI content, and AI-readiness
content strategy. Built with Claude.

> **The pivot.** The original `jobcommandcenter.jsx` tracked jobs *Cindy applies to*.
> This tool tracks companies *that will pay Cindy* — the inverse, and the thing Clay
> is actually built for. Same design system, opposite side of the table.

---

## Why this can make money

Every prospect is tagged with **which of five service lines** fits and a **rough deal
band**, so the pipeline shows expected revenue, not just a list of names.

| Service line | What it is | Who buys it | Rough price |
|---|---|---|---|
| **AEO / GEO Audit + Roadmap** | Get the brand cited by ChatGPT / Perplexity / Gemini | CMO, Head of Growth, Head of SEO | $4k–12k audit · $3k–6k/mo |
| **AI Content Governance** | Prompt libraries, guardrails, review loops, voice/tone for LLM features | Head of Design, VP Product, Head of AI | $8k–20k · $2k–5k/mo |
| **Conversation Design** | UX content for chatbots / agents / assistants | Head of Product, Head of Design, CX | $6k–18k · day rate $600–1,000 |
| **Bilingual / Multilingual AI content** | EN/ES/FR/IT content + localization for LATAM & Europe | Head of International / Localization | $5k–15k · $75/hr+ |
| **AI-Readiness Content Strategy** | IA, taxonomy, metadata, knowledge architecture | Head of Content / Knowledge, Principal IA | $10k–25k |

Cindy's differentiators, each mapped to a service: fintech/enterprise background
(BBVA, USAA), four languages (EN/ES/FR/IT), a LATAM base/timezone, and hands-on AI
content-ops work (prompt libraries, guardrails, conversation flows).

---

## The Ideal Customer Profile (what Clay searches are built from)

**50–1,500-person AI-native or AI-adopting companies that ship user-facing AI but
have no content-design/governance function.**

**Wedges (highest conversion):**
- **Fintech & regulated industries** — need governed, compliant AI copy (her BBVA/USAA parallel)
- **LATAM, Spain, Europe** — her Spanish/French/Italian is a moat US consultants can't cross
- **Companies hiring for content design / conversation design / GEO** — the loudest possible buying signal
- **Brands whose customers ask AI tools about them** — AEO/GEO upside

**Disqualifiers:** content-farm/high-volume work, direct AI-content tooling vendors
(Writer, Jasper — they poach more than they buy), pre-revenue startups.

---

## The insight behind the seed list

**The companies in Cindy's job pipeline that are hiring for her exact skills are her
best consulting prospects.** Hiring for a skill is a public admission of *pain +
budget*. So the seed list is three groups:

1. **Warm** — from the job pipeline (Wise, JPMorgan Chase, Accor, Modern Treasury,
   Gen Digital, Blink UX). They've publicly priced the need.
2. **Net-new** — AI-agent platforms (Decagon, Sierra, Intercom/Fin) and LATAM fintech
   (Konfío, Belvo) that fit the ICP.
3. **Clay-sourced** — **Bitso** is a real live pull from Clay during setup (firmographics
   + 20 contacts, including CEO Daniel Vogel and Marketing Director Charlie Henao).

---

## The Clay loop

Clay is connected in Cindy's Claude chat (workspace: **Cindy's Workspace**). This board
is the CRM; Claude runs the enrichment.

1. **Add a prospect** (give it a domain — Clay needs a domain, not just a name).
2. **Ask Claude to enrich it:** *"enrich `konfio.mx` in Clay and find the Head of Product."*
   Claude runs Clay's `find-and-enrich-company` + contact tools on the workspace.
3. **Paste the buyer back in** (name, title, LinkedIn, email) and set stage → **Enriched**.
4. **Work the pipeline:** Contacted → Discovery Call → Proposal → Won.

> **Credits:** company + contact enrichment in Clay costs credits per record. Enrich the
> shortlist (ICP fit ≥ 88 first), not the whole universe. Data points (funding, tech
> stack, open jobs) cost extra — only add them when a specific play needs them.

---

## Files

- `ProspectingCommandCenter.jsx` — the app. A single React component in the same
  Claude-artifact runtime as the original (`window.storage` + a client-side Anthropic
  call for the fit-scorer). Paste into a Claude artifact to run.
- `jobcommandcenter-original.jsx` — the original job tracker, kept for reference.

## What the app does

- Pipeline CRM with stages, per-prospect service + deal band, ICP fit score, buying signal, buyer contact, timeline, notes.
- **Score a company** — paste website copy or a job post; Claude scores *fit-to-sell*,
  picks the service to lead with, and names the title to find in Clay.
- **Pipeline value** — sums the low end of each open deal band as a conservative estimate.
- Persists locally via `window.storage`; seeded on first run.

## Honest limits

- The app can't call Clay's API directly from the artifact sandbox — enrichment runs
  through Claude (which holds the Clay connection). The app is the system of record.
- Deal bands are estimates for prioritization, not quotes.
- Contact emails from Clay are often empty until you spend a data point to find them.
