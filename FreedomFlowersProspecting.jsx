import { useState, useEffect, useCallback } from "react";

// ════════════════════════════════════════════════════════════════════════════
//  FREEDOM FLOWERS — CLIENT PROSPECTING COMMAND CENTER
//  ---------------------------------------------------------------------------
//  A hyperlocal B2B prospecting tool for Cindy Hatch's florist business.
//  It finds local businesses + referral partners near Guadalajara, finds the
//  right person to contact, and tracks them from lead → RECURRING account.
//  NOT a retail POS — this is about the reliable money: recurring commercial
//  accounts, weddings/events, sympathy standing accounts, and seasonal peaks.
//  Pairs with Clay (clay.com) for finding + enriching the buyers.
//  Same design system as the original Command Center, warm-botanical repaint.
// ════════════════════════════════════════════════════════════════════════════

// ─── Warm-botanical palette (deep green · blush · cream) ───────────────────────

const T = {
  bg:        "#FAF6EF",  // cream
  bgAlt:     "#F3EBDD",  // warm sand
  panel:     "#FFFFFF",
  panelSoft: "#F7F0E6",
  ink:       "#2B3A30",  // deep green ink
  inkSoft:   "#5C6B60",
  muted:     "#98917F",
  line:      "#E7DCC9",  // warm border
  green:     "#2E4636",  // deep botanical green (brand)
  greenMid:  "#4A6B54",
  greenSoft: "#EAF0EA",
  blush:     "#D98C86",  // blush / rose accent
  blushSoft: "#F4E1DE",
  gold:      "#B8893E",
  goldSoft:  "#F3E7CE",
};

// ─── Sales pipeline stages (lead → recurring account) ──────────────────────────

const STAGES = [
  "Lead", "Researching", "Enriched", "Contacted",
  "Sample/Meeting", "Quote Sent", "Trial Order",
  "Recurring Account (Won)", "Lost", "Nurture",
];
const STAGE_COLORS = {
  "Lead":                     "#8A9A8E",
  "Researching":              "#5B7C99",
  "Enriched":                 "#7B6BA8",  // enriched in Clay = ready to reach out
  "Contacted":                "#3E8E9E",
  "Sample/Meeting":           "#C98A3C",
  "Quote Sent":               "#B8893E",
  "Trial Order":              "#C77B5A",
  "Recurring Account (Won)":  "#3E7D4F",
  "Lost":                     "#C05B4D",
  "Nurture":                  "#9A8C7A",
};
const OPEN_STAGES = ["Lead", "Researching", "Enriched", "Contacted", "Sample/Meeting", "Quote Sent", "Trial Order"];
const ENGAGED_STAGES = ["Contacted", "Sample/Meeting", "Quote Sent", "Trial Order"];

const SOURCES = ["Clay", "Walk-in / retail", "Instagram", "Referral", "Wedding directory", "Google Maps", "Event / expo", "Cold outreach", "Other"];

// ─── The six ICP segments — the filter every Clay search is built from ─────────
// A florist's reliable money is RECURRING + EVENTS + SYMPATHY + SEASONAL. These
// segments map to that. Everything is filtered to the local area (Guadalajara).

const SEGMENTS = [
  { key: "recurring-commercial", name: "Recurring commercial account", emoji: "🏢",
    blurb: "Offices, boutique hotels, restaurants, spas, salons, medical/dental/law offices, coworking — weekly/biweekly fresh arrangements.",
    buyers: ["Office Manager", "Gerente General / GM", "Facilities / Operaciones", "Dueño/a"] },
  { key: "event-referral", name: "Event & wedding referral partner", emoji: "💍",
    blurb: "Wedding & event planners, venues, hotels with event space, photographers. A RELATIONSHIP worth many sales, not one deal.",
    buyers: ["Events Director", "Wedding Coordinator", "Dueño/a"] },
  { key: "hospitality", name: "Hospitality & experience", emoji: "🍽️",
    blurb: "Restaurants, boutique hotels, spas wanting a signature weekly look at the entrance, bar, or tables.",
    buyers: ["General Manager / GM", "Dueño/a", "Gerente de A&B"] },
  { key: "sympathy", name: "Sympathy channel", emoji: "🕊️",
    blurb: "Funeral homes and hospices. Steady, recurring, high-trust standing accounts.",
    buyers: ["Director Funerario", "Dueño/a", "Gerente"] },
  { key: "realestate-interiors", name: "Real estate & interiors", emoji: "🏡",
    blurb: "Brokerages, home stagers, interior designers — closing gifts, staging, model homes.",
    buyers: ["Broker / Dueño/a", "Lead Stager", "Interior Designer"] },
  { key: "corporate-gifting", name: "Corporate gifting / HR", emoji: "🎁",
    blurb: "Holiday and employee-milestone flower programs (birthdays, anniversaries, new hires).",
    buyers: ["Recursos Humanos (HR)", "Office Manager", "Asistente Ejecutivo/a"] },
];
const segMeta = (k) => SEGMENTS.find(s => s.key === k) || { name: k, emoji: "🌿", buyers: [] };

// ─── The offer catalog — every prospect is tagged with ONE offer + a deal band ─
// Local Guadalajara price bands in MXN (sensible placeholders — adjust to taste).
// `recur` annualizes recurring offers so a weekly contract shows its REAL worth
// next to a one-off event.

const OFFERS = [
  { key: "weekly-contract",  name: "Weekly / Biweekly Corporate Contract",
    blurb: "A standing fresh-flower program — lobby, reception, tables — delivered every week or two. The florist's most reliable money.",
    band: "MX$1,500–4,000 / week", recur: 52,
    buyers: ["Office Manager", "GM / Gerente General", "Facilities"] },
  { key: "wedding-event",    name: "Wedding & Event Floral Package",
    blurb: "Ceremony + reception florals per event. High ticket, and each happy couple/planner refers the next.",
    band: "MX$18,000–90,000 / event", recur: 1,
    buyers: ["Wedding Coordinator", "Events Director", "Dueño/a"] },
  { key: "subscription",     name: "Recurring Subscription (small biz / VIP)",
    blurb: "A monthly arrangement for a boutique, salon, clinic, or a VIP home. Small ticket, sticky, predictable.",
    band: "MX$900–2,800 / month", recur: 12,
    buyers: ["Dueño/a", "Office Manager", "Gerente"] },
  { key: "sympathy-account", name: "Sympathy / Funeral Standing Account",
    blurb: "A preferred-florist arrangement with a funeral home or hospice. Per-arrangement, but steady recurring volume.",
    band: "MX$1,200–3,800 / arrangement", recur: 24,
    buyers: ["Director Funerario", "Dueño/a", "Gerente"] },
  { key: "corporate-gifting", name: "Corporate Gifting Program",
    blurb: "Holiday + employee-milestone flowers run as a program for an HR / office team. Seasonal spikes, big baskets.",
    band: "MX$25,000–180,000 / season", recur: 1,
    buyers: ["Recursos Humanos (HR)", "Office Manager", "Asistente Ejecutivo/a"] },
  { key: "referral-partner", name: "Referral Partner (planner / venue)",
    blurb: "Not a direct sale — a planner or venue that sends you couples again and again. Value = the pipeline they feed you.",
    band: "MX$60,000–300,000 / yr referred", recur: 1,
    buyers: ["Events Director", "Wedding Planner", "GM / Dueño/a"] },
];
const offerMeta = (k) => OFFERS.find(o => o.key === k) || { name: k, band: "", recur: 1, buyers: [] };

// ─── The seasonal layer — peak calendar (Guadalajara / Mexico) ─────────────────
// Each peak has a LEAD window so you pitch AHEAD of it (e.g. corporate holiday
// gifting in October). `leadWeeks` = how early to start outreach.

const PEAKS = [
  { key: "muertos",     name: "Día de Muertos",            emoji: "🌼", month: 11, day: 1,  leadWeeks: 5,
    offers: ["wedding-event", "corporate-gifting", "sympathy-account"],
    note: "Cempasúchil, altares, remembrance arrangements. Pitch venues, offices, and sympathy accounts." },
  { key: "holidays",    name: "Navidad / Fin de Año",       emoji: "🎄", month: 12, day: 12, leadWeeks: 8,
    offers: ["corporate-gifting", "weekly-contract", "wedding-event"],
    note: "Corporate holiday gifting + year-end office & hotel décor. Pitch HR/offices by early October." },
  { key: "valentines",  name: "San Valentín",               emoji: "💝", month: 2,  day: 14, leadWeeks: 6,
    offers: ["subscription", "corporate-gifting"],
    note: "Peak retail + corporate gifting. Lock hotel/restaurant table programs and VIP subscriptions early." },
  { key: "mothers",     name: "Día de las Madres (10 May)", emoji: "🌸", month: 5,  day: 10, leadWeeks: 6,
    offers: ["corporate-gifting", "subscription"],
    note: "Mexico's biggest florist day (fixed 10 May). Corporate 'gift every mom on staff' programs sell hard in April." },
  { key: "graduations", name: "Graduaciones",               emoji: "🎓", month: 6,  day: 20, leadWeeks: 5,
    offers: ["wedding-event", "corporate-gifting"],
    note: "Ceremonies + family celebrations. Pitch schools, venues, and corporate gifting." },
  { key: "admin-day",   name: "Día de la Secretaria",       emoji: "💐", month: 7,  day: 15, leadWeeks: 4,
    offers: ["corporate-gifting", "weekly-contract"],
    note: "Admin Professionals Day. An easy corporate-gifting entry into offices you can later convert to weekly contracts." },
  { key: "wedding-fall", name: "Temporada de Bodas (otoño)", emoji: "💍", month: 10, day: 15, leadWeeks: 12,
    offers: ["wedding-event", "referral-partner"],
    note: "Fall wedding peak. Booked months ahead — court planners & venues in summer, not autumn." },
];

// Which peak is coming up next, and whether its outreach window is open now.
function nextPeak(todayISO) {
  const today = new Date(todayISO + "T00:00:00");
  const y = today.getFullYear();
  const dated = PEAKS.map(p => {
    let d = new Date(y, p.month - 1, p.day);
    if (d < today) d = new Date(y + 1, p.month - 1, p.day);
    const lead = new Date(d); lead.setDate(lead.getDate() - p.leadWeeks * 7);
    return { ...p, date: d, lead };
  }).sort((a, b) => a.date - b.date);
  const next = dated[0];
  const windowOpen = today >= next.lead;
  const daysOut = Math.round((next.date - today) / 86400000);
  return { ...next, windowOpen, daysOut };
}
const monthName = (d) => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];

const emptyProspect = () => ({
  id: `ff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  business: "",
  domain: "",
  segment: "recurring-commercial",
  offer: "weekly-contract",
  dealBand: "",
  area: "Guadalajara, MX",
  season: "year-round",
  fitScore: null,            // 40–99 fit as a recurring/event floral account
  signal: "",                // the buying signal (new location, event space, hiring…)
  stage: "Lead",
  source: "Clay",
  buyerName: "",
  buyerTitle: "",
  buyerLinkedIn: "",
  buyerEmail: "",
  clayEnriched: false,
  dateAdded: new Date().toISOString().slice(0, 10),
  nextDate: "",
  nextAction: "",
  notes: "",
  stageHistory: [],
  flagged: false,
});

// ─── Seed prospects — local, across all six segments ───────────────────────────
// ★ REAL = pulled live from Clay during setup. The rest are ILLUSTRATIVE: they
//   are real, well-known Guadalajara businesses used as example targets, but
//   their buyer + firmographics are NOT verified — enrich each in Clay to
//   confirm the company and find the actual person before you reach out.

const SEED_PROSPECTS = [
  // ── ★ REAL — live Clay pull (Aug 30 2026) ────────────────────────────────────
  {
    id: "clay-demetria", business: "Hotel Demetria", domain: "hoteldemetria.com",
    segment: "hospitality", offer: "weekly-contract", dealBand: "MX$1,500–4,000 / week",
    area: "Av. La Paz 2219, Guadalajara, Jalisco", season: "year-round", fitScore: 90,
    signal: "Boutique design hotel with restaurant, rooftop bar and event/gallery space — exactly the 'signature weekly look' buyer, PLUS a wedding/event referral channel. Small, design-led, owner-close: a florist who nails the aesthetic becomes the house florist.",
    stage: "Enriched", source: "Clay", buyerName: "", buyerTitle: "General Manager / Events Director",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: true, dateAdded: "2026-08-30", nextDate: "2026-09-03",
    nextAction: "Buyer contact not on LinkedIn (26-person team). Walk in with a sample arrangement OR spend one Clay 'Email' data point once you ID the GM. Lead with a weekly lobby/restaurant program; mention event florals as the upsell.",
    notes: "★ REAL CLAY DATA (trial run Aug 30 2026). Verified firmographics: Hospitality, Guadalajara MX, ~26 employees, MX$10–25M revenue, HQ Av. La Paz 2219 (44140), LinkedIn: linkedin.com/company/hotel-demetria. HONEST LIMIT: contact enrichment returned 0 LinkedIn profiles — small boutique teams often aren't on LinkedIn, so the buyer here is a walk-in / email-data-point play, not a LinkedIn pull. This is the loop working AND showing you where a credit is worth spending.",
    stageHistory: [{ stage: "Lead", date: "2026-08-30" }, { stage: "Researching", date: "2026-08-30" }, { stage: "Enriched", date: "2026-08-30" }],
    flagged: true,
  },
  // ── Recurring commercial ─────────────────────────────────────────────────────
  {
    id: "ill-ios", business: "IOS OFFICES (Guadalajara)", domain: "iosoffices.com",
    segment: "recurring-commercial", offer: "weekly-contract", dealBand: "MX$1,500–4,000 / week",
    area: "Andares / Américas, Guadalajara", season: "year-round", fitScore: 88,
    signal: "Premium coworking + private offices across GDL. High-traffic lobbies and meeting floors that need to look alive weekly. One account = multiple locations. Office Manager owns the aesthetics budget.",
    stage: "Lead", source: "Google Maps", buyerName: "", buyerTitle: "Office Manager / Community Manager",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30", nextDate: "2026-09-04",
    nextAction: "Enrich iosoffices.com in Clay → find the Community/Office Manager for the Guadalajara sites. Pitch a per-location weekly program with a volume rate.",
    notes: "Illustrative target (real GDL coworking brand). Multi-site = land one, expand to all floors.",
    stageHistory: [{ stage: "Lead", date: "2026-08-30" }], flagged: true,
  },
  {
    id: "ill-alcalde", business: "Alcalde (restaurant)", domain: "alcalde.com.mx",
    segment: "hospitality", offer: "subscription", dealBand: "MX$900–2,800 / month",
    area: "Av. México, Guadalajara", season: "year-round", fitScore: 84,
    signal: "Acclaimed fine-dining restaurant where presentation is the product. A signature entrance + bar arrangement refreshed weekly reinforces the brand. Chef/owner-led — decisions are fast if the look is right.",
    stage: "Researching", source: "Instagram", buyerName: "", buyerTitle: "Owner / Gerente General",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30", nextDate: "2026-09-05",
    nextAction: "Enrich alcalde.com.mx → find owner/GM. Drop a sample arrangement mid-week; propose a monthly subscription that can scale to weekly.",
    notes: "Illustrative target (real acclaimed GDL restaurant). Fine dining = repeatable, design-sensitive buyer.",
    stageHistory: [{ stage: "Lead", date: "2026-08-30" }, { stage: "Researching", date: "2026-08-30" }], flagged: false,
  },
  {
    id: "ill-dental", business: "Clínica Dental Providencia", domain: "",
    segment: "recurring-commercial", offer: "subscription", dealBand: "MX$900–2,800 / month",
    area: "Providencia, Guadalajara", season: "year-round", fitScore: 76,
    signal: "Upscale dental/medical office in an affluent neighborhood. A calm, fresh waiting room is a patient-experience upgrade they'll pay a small monthly fee for. Easy 'yes', very sticky once in place.",
    stage: "Lead", source: "Google Maps", buyerName: "", buyerTitle: "Office Manager / Dueño/a",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30", nextDate: "2026-09-09",
    nextAction: "Find the practice's domain first (Clay needs a domain). Then enrich → Office Manager. Lead with a low-commitment monthly subscription.",
    notes: "Illustrative placeholder (representative of dozens of Providencia/Chapalita clinics). Cluster-prospect the whole neighborhood.",
    stageHistory: [{ stage: "Lead", date: "2026-08-30" }], flagged: false,
  },
  // ── Event & wedding referral partners ────────────────────────────────────────
  {
    id: "ill-vibbo", business: "Vibbo Weddings (planner)", domain: "",
    segment: "event-referral", offer: "referral-partner", dealBand: "MX$60,000–300,000 / yr referred",
    area: "Guadalajara / Zapopan", season: "wedding-fall", fitScore: 91,
    signal: "Wedding planner books many events a year and needs a florist they can trust to make THEM look good. One strong planner relationship = a steady stream of high-ticket wedding packages with no marketing spend on your side.",
    stage: "Lead", source: "Wedding directory", buyerName: "", buyerTitle: "Lead Planner / Owner",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30", nextDate: "2026-09-06",
    nextAction: "Find domain/IG, enrich in Clay → owner. Offer a planner rate + a styled-shoot collaboration so they have portfolio images of your work.",
    notes: "Illustrative placeholder (representative GDL planner). Referral partners are the highest-leverage relationships in this whole board — court a few well.",
    stageHistory: [{ stage: "Lead", date: "2026-08-30" }], flagged: true,
  },
  {
    id: "ill-fusion", business: "Terraza / Salón de eventos (venue)", domain: "",
    segment: "event-referral", offer: "referral-partner", dealBand: "MX$60,000–300,000 / yr referred",
    area: "Zapopan, Guadalajara", season: "wedding-fall", fitScore: 87,
    signal: "An event venue's in-house 'preferred florist' slot is worth dozens of events a year. Venues want reliability and a florist who won't damage the space. Get on the preferred list = recurring event pipeline.",
    stage: "Lead", source: "Referral", buyerName: "", buyerTitle: "Events Director / Venue Manager",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30", nextDate: "2026-09-10",
    nextAction: "Identify 3–4 real GDL venues, enrich each → Events Director. Ask to join the preferred-vendor list; bring photos + a walkthrough offer.",
    notes: "Illustrative placeholder. Aim for the preferred-vendor list at 3–5 venues before high season.",
    stageHistory: [{ stage: "Lead", date: "2026-08-30" }], flagged: false,
  },
  // ── Sympathy channel ─────────────────────────────────────────────────────────
  {
    id: "ill-gayosso", business: "Gayosso (funeral homes)", domain: "gayosso.com",
    segment: "sympathy", offer: "sympathy-account", dealBand: "MX$1,200–3,800 / arrangement",
    area: "Guadalajara (multiple)", season: "year-round", fitScore: 85,
    signal: "Established funeral group with steady daily need for coronas/arreglos. A preferred-florist standing account is recurring, high-trust volume — the most predictable non-retail revenue a florist can hold.",
    stage: "Lead", source: "Google Maps", buyerName: "", buyerTitle: "Gerente de sucursal / Director Funerario",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30", nextDate: "2026-09-11",
    nextAction: "Enrich gayosso.com → local branch manager for Guadalajara. Propose a preferred-florist standing account with same-day turnaround and a set catalog.",
    notes: "Illustrative target (real national funeral brand). High trust required, but the steadiest volume on this board once you're in.",
    stageHistory: [{ stage: "Lead", date: "2026-08-30" }], flagged: false,
  },
  // ── Real estate & interiors ──────────────────────────────────────────────────
  {
    id: "ill-coldwell", business: "Coldwell Banker (GDL brokerage)", domain: "coldwellbanker.com.mx",
    segment: "realestate-interiors", offer: "subscription", dealBand: "MX$900–2,800 / month",
    area: "Guadalajara / Zapopan", season: "year-round", fitScore: 78,
    signal: "Brokerages buy closing gifts and stage model homes/offices. A standing arrangement in the office + a closing-gift bundle turns every sale into a flower order. Brokers refer their staging + client-gift needs.",
    stage: "Lead", source: "Google Maps", buyerName: "", buyerTitle: "Broker / Oficina Manager",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30", nextDate: "2026-09-12",
    nextAction: "Enrich → office broker/manager. Pitch two things: an office subscription + a per-closing gift program (recurring by transaction volume).",
    notes: "Illustrative target (real brokerage brand). Two revenue lines from one relationship: office subscription + closing gifts.",
    stageHistory: [{ stage: "Lead", date: "2026-08-30" }], flagged: false,
  },
  {
    id: "ill-interior", business: "Estudio de Interiorismo (designer)", domain: "",
    segment: "realestate-interiors", offer: "referral-partner", dealBand: "MX$60,000–300,000 / yr referred",
    area: "Guadalajara", season: "year-round", fitScore: 74,
    signal: "Interior designers style model homes, launches, and client reveals — all flower moments. A designer who trusts your aesthetic hands you recurring project work and referrals to their affluent clients.",
    stage: "Lead", source: "Instagram", buyerName: "", buyerTitle: "Lead Designer / Owner",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30", nextDate: "2026-09-13",
    nextAction: "Find studio IG/domain, enrich → owner. Offer a styled collaboration for their next reveal; become their go-to for launches.",
    notes: "Illustrative placeholder. Design-led referral partner; aesthetic match matters more than price here.",
    stageHistory: [{ stage: "Lead", date: "2026-08-30" }], flagged: false,
  },
  // ── Corporate gifting / HR ───────────────────────────────────────────────────
  {
    id: "ill-wizeline", business: "Wizeline (tech, GDL)", domain: "wizeline.com",
    segment: "corporate-gifting", offer: "corporate-gifting", dealBand: "MX$25,000–180,000 / season",
    area: "Guadalajara (tech corridor)", season: "holidays", fitScore: 82,
    signal: "Large Guadalajara-based tech employer with a real HR/people budget and a culture of employee perks. Milestone + holiday flower programs (birthdays, anniversaries, Día de las Madres for staff) scale across hundreds of employees.",
    stage: "Lead", source: "Clay", buyerName: "", buyerTitle: "People / HR / Office Manager",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30", nextDate: "2026-10-01",
    nextAction: "Enrich wizeline.com in Clay → People Ops / Office Manager in Guadalajara. Pitch a holiday gifting program NOW (October) to land the December spend.",
    notes: "Illustrative target (real GDL tech company, likely rich LinkedIn coverage — a good second Clay pull). Big HR headcount = program-scale gifting. Season-tagged 'holidays'.",
    stageHistory: [{ stage: "Lead", date: "2026-08-30" }], flagged: true,
  },
  {
    id: "ill-spa", business: "Spa / Salón de belleza (boutique)", domain: "",
    segment: "hospitality", offer: "subscription", dealBand: "MX$900–2,800 / month",
    area: "Chapalita / Providencia, Guadalajara", season: "year-round", fitScore: 79,
    signal: "Boutique spas and salons sell atmosphere. A monthly signature arrangement at reception is a cheap, high-visibility brand upgrade — and their clientele is exactly who buys flowers for themselves.",
    stage: "Lead", source: "Instagram", buyerName: "", buyerTitle: "Owner / Gerente",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30", nextDate: "2026-09-16",
    nextAction: "Shortlist 4–5 real boutique spas/salons, enrich → owner. Lead with a monthly subscription + a referral card for their clients.",
    notes: "Illustrative placeholder. Also a retail funnel: their clients become your VIP subscription buyers.",
    stageHistory: [{ stage: "Lead", date: "2026-08-30" }], flagged: false,
  },
];

// ─── Persistent storage helpers ────────────────────────────────────────────────

async function loadProspects() {
  try { const r = await window.storage.get("ff-prospects"); return r ? JSON.parse(r.value) : []; }
  catch { return []; }
}
async function saveProspects(rows) {
  try { await window.storage.set("ff-prospects", JSON.stringify(rows)); }
  catch (e) { console.error("Save failed", e); }
}
async function loadLog() {
  try { const r = await window.storage.get("ff-log"); return r ? JSON.parse(r.value) : []; }
  catch { return []; }
}
async function saveLog(log) {
  try { await window.storage.set("ff-log", JSON.stringify(log.slice(0, 100))); } catch {}
}

// ─── AI: score a local business as a floral account ────────────────────────────
// Paste a business's website/about text or a description. It scores fit as a
// RECURRING/EVENT floral account, picks the offer to lead with, tags a season,
// and names the buyer TITLE to find in Clay.

async function scoreBusinessFit(businessText) {
  const prompt = `You are a sales-development analyst for "Freedom Flowers", Cindy Hatch's florist business in Guadalajara, Jalisco, Mexico. Freedom Flowers does NOT chase retail walk-ins — it sells RECURRING and EVENT floral accounts to local businesses and referral partners. The six offers are:
1. weekly-contract — Weekly/Biweekly Corporate Flower Contract (a standing fresh-flower program, recurring retainer)
2. wedding-event — Wedding & Event Floral Package (per event)
3. subscription — Recurring Subscription for a small business or VIP (monthly)
4. sympathy-account — Sympathy / Funeral Standing Account (per arrangement, recurring volume)
5. corporate-gifting — Corporate Gifting Program (holiday + employee-milestone flowers)
6. referral-partner — Referral Partner: a wedding/event planner or venue that refers couples repeatedly (pipeline value, not a direct sale)

The six prospect SEGMENTS: recurring-commercial (offices, hotels, restaurants, spas, salons, medical/dental/law, coworking), event-referral (planners, venues, photographers), hospitality (restaurants, boutique hotels, spas wanting a signature look), sympathy (funeral homes, hospices), realestate-interiors (brokerages, stagers, designers), corporate-gifting (HR / office gifting programs).

Everything is LOCAL to Guadalajara. Seasonal peaks that matter: Día de Muertos (Nov), Navidad/holidays (Dec), San Valentín (Feb), Día de las Madres (10 May — Mexico's biggest florist day), graduaciones (Jun), Día de la Secretaria (Jul), fall wedding season (Oct).

Evaluate this business as a PROSPECT that would PAY Freedom Flowers for a recurring or event floral relationship:
"""
${businessText.slice(0, 6000)}
"""

Return ONLY a JSON object, no markdown:
{
  "business": "name",
  "domain": "best guess domain, e.g. hoteldemetria.com (Clay needs a domain)",
  "segment": one of "recurring-commercial" | "event-referral" | "hospitality" | "sympathy" | "realestate-interiors" | "corporate-gifting",
  "offer": one of "weekly-contract" | "wedding-event" | "subscription" | "sympathy-account" | "corporate-gifting" | "referral-partner",
  "area": "neighborhood/city if inferable, else Guadalajara, MX",
  "season": one of "year-round" | "muertos" | "holidays" | "valentines" | "mothers" | "graduations" | "admin-day" | "wedding-fall",
  "dealBand": "realistic local MXN band, matching the chosen offer",
  "fitScore": number 40-99 (fit as a recurring/event floral account),
  "signal": "2-3 sentences: the specific reason they'd buy, and what recurring/event value they represent",
  "buyerTitle": "the exact TITLE to find in Clay (e.g. Office Manager, Events Director, GM, HR)",
  "nextAction": "concrete next step (usually: enrich {domain} in Clay to find the {buyerTitle}, plus the opening angle)"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  const m = text.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Could not parse response");
  return JSON.parse(m[0]);
}

// ─── How Clay plugs in (the enrichment loop, documented in-app) ────────────────

const CLAY_STEPS = [
  { n: 1, t: "Add a business here", d: "From a walk-by, Instagram, a wedding directory, or the AI scorer. Give it a DOMAIN — Clay needs a domain (hoteldemetria.com), not just a name." },
  { n: 2, t: "Ask Claude to enrich it in Clay", d: "In chat: “enrich {domain} in Clay and find the Office Manager / Events Director / GM in Guadalajara.” Claude runs Clay's find-and-enrich tools on your workspace." },
  { n: 3, t: "Paste the buyer back in", d: "Drop the returned name, title, LinkedIn into the drawer and flip Stage → Enriched. Note: an EMAIL costs an extra Clay data point — spend it only when you're ready to reach out." },
  { n: 4, t: "Work it to a recurring account", d: "Contacted → Sample/Meeting → Quote → Trial Order → Recurring Account. The dashboard annualizes recurring deals so you see real worth." },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function Badge({ label, color }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}55`,
      fontSize: "10px", fontWeight: 700, padding: "2px 7px",
      borderRadius: "4px", letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          background: T.panel, border: `1px solid ${T.line}`, borderRadius: "5px",
          color: T.ink, padding: "7px 10px", fontSize: "12px", outline: "none", width: "100%",
        }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: T.panel, border: `1px solid ${T.line}`, borderRadius: "5px",
        color: T.ink, padding: "7px 10px", fontSize: "12px", outline: "none", width: "100%",
      }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

// Pull the low end of a deal band, and annualize recurring offers.
const bandLow = (b) => { const s = (b || "").replace(/,/g, ""); const m = s.match(/(\d{3,7})/); return m ? parseInt(m[1], 10) : 0; };
const annualValue = (p) => bandLow(p.dealBand) * (offerMeta(p.offer).recur || 1);
const mxn = (n) => "MX$" + Math.round(n).toLocaleString();

// ─── Review modal (approve a scored prospect before it lands) ──────────────────

function ReviewModal({ prospect, onApprove, onDismiss }) {
  const [draft, setDraft] = useState({ ...prospect });
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const seg = segMeta(draft.segment);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(43,58,48,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
      <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "12px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(43,58,48,0.25)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", color: T.blush, fontWeight: 700, letterSpacing: "0.08em", marginBottom: "2px" }}>🌷 NEW PROSPECT — REVIEW BEFORE ADDING</div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: T.ink }}>{draft.business}</div>
            <div style={{ fontSize: "13px", color: T.inkSoft }}>{seg.emoji} {seg.name} · {draft.area}</div>
            <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
              <Badge label={offerMeta(draft.offer).name} color={T.green} />
              {draft.dealBand && <Badge label={draft.dealBand} color={T.gold} />}
            </div>
          </div>
          {draft.fitScore != null && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: draft.fitScore >= 85 ? T.greenMid : T.gold }}>{draft.fitScore}</div>
              <div style={{ fontSize: "9px", color: T.muted }}>FLORAL FIT</div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {draft.signal && (
            <div style={{ background: T.greenSoft, border: `1px solid ${T.green}33`, borderRadius: "6px", padding: "10px 12px", fontSize: "12px", color: T.green, lineHeight: 1.6 }}>
              💡 {draft.signal}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Business" value={draft.business} onChange={v => set("business", v)} />
            <Input label="Domain" value={draft.domain} onChange={v => set("domain", v)} placeholder="business.com" />
            <Select label="Segment" value={draft.segment} onChange={v => set("segment", v)} options={SEGMENTS.map(s => ({ value: s.key, label: `${s.emoji} ${s.name}` }))} />
            <Select label="Offer to lead with" value={draft.offer} onChange={v => set("offer", v)} options={OFFERS.map(o => ({ value: o.key, label: o.name }))} />
            <Input label="Deal band" value={draft.dealBand} onChange={v => set("dealBand", v)} />
            <Select label="Season / campaign" value={draft.season} onChange={v => set("season", v)} options={[{ value: "year-round", label: "🌿 Year-round" }, ...PEAKS.map(p => ({ value: p.key, label: `${p.emoji} ${p.name}` }))]} />
            <Input label="Local area" value={draft.area} onChange={v => set("area", v)} />
            <Select label="Source" value={draft.source} onChange={v => set("source", v)} options={SOURCES} />
          </div>
          {draft.domain && (
            <div style={{ background: T.blushSoft, border: `1px solid ${T.blush}55`, borderRadius: "6px", padding: "10px 12px", fontSize: "11px", color: "#8a4a44", lineHeight: 1.6 }}>
              🔗 Next: ask Claude → <span style={{ fontWeight: 700 }}>“enrich {draft.domain} in Clay and find the {draft.buyerTitle || seg.buyers[0] || "buyer"} in Guadalajara”</span>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.line}`, display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onDismiss} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${T.line}`, borderRadius: "6px", color: T.muted, fontSize: "12px", cursor: "pointer" }}>Skip</button>
          <button onClick={() => onApprove(draft)} style={{ padding: "8px 20px", background: `linear-gradient(135deg, ${T.green}, ${T.greenMid})`, border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>✓ Add to pipeline</button>
        </div>
      </div>
    </div>
  );
}

// ─── Prospect detail drawer ────────────────────────────────────────────────────

function ProspectDrawer({ prospect, onSave, onClose, onDelete }) {
  const [draft, setDraft] = useState({ ...prospect });
  const [dirty, setDirty] = useState(false);
  const update = (k, v) => { setDraft(d => ({ ...d, [k]: v })); setDirty(true); };

  const changeStage = (newStage) => {
    const history = [...(draft.stageHistory || []), { stage: newStage, date: new Date().toISOString().slice(0, 10) }];
    setDraft(d => ({ ...d, stage: newStage, stageHistory: history, clayEnriched: newStage === "Enriched" ? true : d.clayEnriched }));
    setDirty(true);
  };

  const seg = segMeta(draft.segment);
  const off = offerMeta(draft.offer);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(43,58,48,0.45)", display: "flex", justifyContent: "flex-end", zIndex: 900 }}>
      <div style={{ background: T.bg, borderLeft: `1px solid ${T.line}`, width: "100%", maxWidth: "480px", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.line}`, background: T.panel }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: T.ink }}>{draft.business}</div>
              <div style={{ fontSize: "12px", color: T.inkSoft, marginTop: "2px" }}>{seg.emoji} {seg.name} · {draft.area}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, fontSize: "18px", cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
            {STAGES.map(s => (
              <button key={s} onClick={() => changeStage(s)} style={{
                padding: "3px 9px", fontSize: "10px", fontWeight: 700, borderRadius: "4px", cursor: "pointer", border: "none",
                background: draft.stage === s ? STAGE_COLORS[s] : T.panelSoft, color: draft.stage === s ? "#fff" : T.muted,
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          {/* Offer + deal */}
          <div style={{ background: T.greenSoft, border: `1px solid ${T.green}33`, borderRadius: "6px", padding: "10px 12px" }}>
            <div style={{ fontSize: "10px", color: T.greenMid, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Selling: {off.name}</div>
            <div style={{ fontSize: "11px", color: T.green, lineHeight: 1.6 }}>{off.blurb}</div>
            <div style={{ fontSize: "11px", color: T.greenMid, marginTop: "6px", fontWeight: 700 }}>
              {off.band}{off.recur > 1 && draft.dealBand ? `  ·  ≈ ${mxn(annualValue(draft))}/yr annualized` : ""}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Business" value={draft.business} onChange={v => update("business", v)} />
            <Input label="Domain" value={draft.domain} onChange={v => update("domain", v)} />
            <Select label="Segment" value={draft.segment} onChange={v => update("segment", v)} options={SEGMENTS.map(s => ({ value: s.key, label: `${s.emoji} ${s.name}` }))} />
            <Select label="Offer to sell" value={draft.offer} onChange={v => update("offer", v)} options={OFFERS.map(o => ({ value: o.key, label: o.name }))} />
            <Input label="Deal band" value={draft.dealBand} onChange={v => update("dealBand", v)} />
            <Select label="Season / campaign" value={draft.season} onChange={v => update("season", v)} options={[{ value: "year-round", label: "🌿 Year-round" }, ...PEAKS.map(p => ({ value: p.key, label: `${p.emoji} ${p.name}` }))]} />
            <Input label="Local area" value={draft.area} onChange={v => update("area", v)} />
            <Select label="Source" value={draft.source} onChange={v => update("source", v)} options={SOURCES} />
          </div>

          {/* Buying signal */}
          <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: "12px" }}>
            <label style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Buying signal — why they'd buy now</label>
            <textarea value={draft.signal} onChange={e => update("signal", e.target.value)} rows={3}
              style={{ marginTop: "6px", background: T.panel, border: `1px solid ${T.line}`, borderRadius: "5px", color: T.ink, padding: "8px 10px", fontSize: "12px", outline: "none", resize: "vertical", width: "100%", lineHeight: 1.6 }} />
          </div>

          {/* Buyer / Clay enrichment */}
          <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Buyer (enrich in Clay)</div>
              {draft.clayEnriched ? <Badge label="✓ Clay enriched" color={T.greenMid} /> : <Badge label="not yet enriched" color={T.gold} />}
            </div>
            {draft.domain && !draft.clayEnriched && (
              <div style={{ background: T.blushSoft, border: `1px solid ${T.blush}55`, borderRadius: "6px", padding: "9px 11px", fontSize: "11px", color: "#8a4a44", lineHeight: 1.6, marginBottom: "10px" }}>
                Ask Claude: <span style={{ fontWeight: 700 }}>“enrich {draft.domain} in Clay and find the {draft.buyerTitle || seg.buyers[0]} in Guadalajara”</span> — then paste the result below. (An email costs an extra Clay data point.)
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Input label="Name" value={draft.buyerName} onChange={v => update("buyerName", v)} />
              <Input label="Title" value={draft.buyerTitle} onChange={v => update("buyerTitle", v)} placeholder={seg.buyers.join(" / ")} />
              <Input label="LinkedIn" value={draft.buyerLinkedIn} onChange={v => update("buyerLinkedIn", v)} placeholder="linkedin.com/in/..." />
              <Input label="Email" value={draft.buyerEmail} onChange={v => update("buyerEmail", v)} placeholder="name@business.com" />
            </div>
          </div>

          {/* Next step */}
          <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: "12px" }}>
            <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Next step</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Input label="Date" value={draft.nextDate} onChange={v => update("nextDate", v)} type="date" />
              <Input label="Action" value={draft.nextAction} onChange={v => update("nextAction", v)} placeholder="Drop a sample, book a meeting..." />
            </div>
          </div>

          {/* Timeline */}
          {draft.stageHistory?.length > 0 && (
            <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: "12px" }}>
              <div style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Timeline</div>
              {draft.stageHistory.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: STAGE_COLORS[h.stage] || T.muted, flexShrink: 0 }} />
                  <span style={{ fontSize: "11px", color: T.muted }}>{h.date}</span>
                  <span style={{ fontSize: "11px", color: T.inkSoft }}>{h.stage}</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: "12px" }}>
            <label style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</label>
            <textarea value={draft.notes} onChange={e => update("notes", e.target.value)} rows={4}
              placeholder="Meeting notes, quote scope, objections, follow-ups..."
              style={{ marginTop: "6px", background: T.panel, border: `1px solid ${T.line}`, borderRadius: "5px", color: T.ink, padding: "8px 10px", fontSize: "12px", outline: "none", resize: "vertical", width: "100%", lineHeight: 1.6 }} />
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.line}`, background: T.panel, display: "flex", gap: "8px", justifyContent: "space-between" }}>
          <button onClick={() => onDelete(prospect.id)} style={{ padding: "7px 12px", background: "transparent", border: `1px solid ${T.blush}66`, borderRadius: "5px", color: T.blush, fontSize: "11px", cursor: "pointer" }}>Delete</button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${T.line}`, borderRadius: "5px", color: T.muted, fontSize: "12px", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => { onSave(draft); setDirty(false); }} disabled={!dirty} style={{ padding: "7px 16px", background: dirty ? `linear-gradient(135deg, ${T.green}, ${T.greenMid})` : T.panelSoft, border: "none", borderRadius: "5px", color: dirty ? "#fff" : T.muted, fontSize: "12px", fontWeight: 700, cursor: dirty ? "pointer" : "default" }}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main app ──────────────────────────────────────────────────────────────────

export default function FreedomFlowersProspecting() {
  const [rows, setRows] = useState([]);
  const [log, setLog] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filterStage, setFilterStage] = useState("all");
  const [filterSeg, setFilterSeg] = useState("all");
  const [filterText, setFilterText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [showClay, setShowClay] = useState(false);
  const [showSeason, setShowSeason] = useState(false);
  const [bizText, setBizText] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const peak = nextPeak(today);

  useEffect(() => {
    Promise.all([loadProspects(), loadLog()]).then(([r, l]) => {
      if (!r || r.length === 0) { setRows(SEED_PROSPECTS); saveProspects(SEED_PROSPECTS); }
      else setRows(r);
      setLog(l); setLoaded(true);
    });
  }, []);

  useEffect(() => { if (loaded) saveProspects(rows); }, [rows, loaded]);

  const addLog = useCallback((msg, type = "info") => {
    setLog(prev => { const next = [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 100); saveLog(next); return next; });
  }, []);

  const handleScore = async () => {
    if (!bizText.trim()) return;
    setScanning(true);
    addLog("Scoring business as a floral account…", "info");
    try {
      const r = await scoreBusinessFit(bizText);
      const p = {
        ...emptyProspect(),
        business: r.business || "Unknown", domain: r.domain || "", segment: r.segment || "recurring-commercial",
        offer: r.offer || "weekly-contract", area: r.area || "Guadalajara, MX", season: r.season || "year-round",
        fitScore: r.fitScore ?? null, dealBand: r.dealBand || "", signal: r.signal || "",
        buyerTitle: r.buyerTitle || "", nextAction: r.nextAction || "", source: "Other", stage: "Lead",
      };
      addLog(`Scored ${p.business} — floral fit ${p.fitScore}/99`, "success");
      setReviewing(p); setBizText(""); setShowPaste(false);
    } catch (e) { addLog("Could not score that: " + e.message, "error"); }
    setScanning(false);
  };

  const approve = (draft) => {
    const p = { ...draft, stageHistory: [{ stage: draft.stage || "Lead", date: today }] };
    setRows(prev => [p, ...prev]);
    addLog(`✓ Added prospect: ${p.business}`, "success");
    setReviewing(null);
  };

  const saveRow = (u) => { setRows(prev => prev.map(r => r.id === u.id ? u : r)); setSelected(u); addLog(`Updated: ${u.business}`, "info"); };
  const deleteRow = (id) => { setRows(prev => prev.filter(r => r.id !== id)); setSelected(null); addLog("Prospect removed.", "info"); };

  const filtered = rows.filter(r => {
    if (filterStage !== "all" && r.stage !== filterStage) return false;
    if (filterSeg !== "all" && r.segment !== filterSeg) return false;
    if (filterText) {
      const q = filterText.toLowerCase();
      if (!r.business.toLowerCase().includes(q) && !segMeta(r.segment).name.toLowerCase().includes(q) && !(r.area || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = {
    total: rows.length,
    open: rows.filter(r => OPEN_STAGES.includes(r.stage)).length,
    recurring: rows.filter(r => r.stage === "Recurring Account (Won)").length,
    annualized: rows.filter(r => OPEN_STAGES.includes(r.stage)).reduce((s, r) => s + annualValue(r), 0),
  };

  // Prospects to court for the next peak: matching season tag OR an offer the peak wants.
  const peakTargets = rows.filter(r => r.season === peak.key || (peak.offers || []).includes(r.offer)).filter(r => r.stage !== "Recurring Account (Won)" && r.stage !== "Lost");

  const upcoming = rows.filter(r => r.nextDate && r.nextDate >= today).sort((a, b) => a.nextDate.localeCompare(b.nextDate)).slice(0, 5);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${T.bgAlt}; }
        ::-webkit-scrollbar-thumb { background: ${T.line}; border-radius: 3px; }
        button { transition: filter 0.15s, background 0.15s; }
        button:hover { filter: brightness(0.97); }
        input, select, textarea { font-family: inherit; }
        a { color: inherit; }
        .wordmark { font-family: 'Georgia', 'Times New Roman', serif; font-style: italic; }
      `}</style>

      {reviewing && <ReviewModal prospect={reviewing} onApprove={approve} onDismiss={() => { addLog(`Skipped: ${reviewing.business}`, "info"); setReviewing(null); }} />}
      {selected && <ProspectDrawer prospect={selected} onSave={saveRow} onClose={() => setSelected(null)} onDelete={deleteRow} />}

      {/* Top bar */}
      <div style={{ background: T.panel, borderBottom: `1px solid ${T.line}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: `linear-gradient(135deg, ${T.green}, ${T.greenMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>🌸</div>
          <div>
            <div className="wordmark" style={{ fontWeight: 700, fontSize: "19px", letterSpacing: "-0.01em", color: T.green }}>Freedom Flowers</div>
            <div style={{ fontSize: "10px", color: T.muted, marginTop: "1px" }}>Prospecting HQ · Guadalajara · recurring accounts · weddings · sympathy · seasonal · powered by Clay</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setShowSeason(v => !v)} style={{ padding: "7px 14px", background: showSeason ? T.panelSoft : T.goldSoft, border: `1px solid ${T.gold}55`, borderRadius: "6px", color: T.gold, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
            {showSeason ? "✕ Close" : `${peak.emoji} Next peak: ${peak.name}`}
          </button>
          <button onClick={() => setShowClay(v => !v)} style={{ padding: "7px 14px", background: showClay ? T.panelSoft : T.blushSoft, border: `1px solid ${T.blush}55`, borderRadius: "6px", color: T.blush, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
            {showClay ? "✕ Close" : "◇ How Clay plugs in"}
          </button>
          <button onClick={() => setShowPaste(v => !v)} style={{ padding: "7px 16px", background: showPaste ? T.panelSoft : `linear-gradient(135deg, ${T.green}, ${T.greenMid})`, border: showPaste ? `1px solid ${T.line}` : "none", borderRadius: "6px", color: showPaste ? T.inkSoft : "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
            {showPaste ? "✕ Close" : "✦ Score a business"}
          </button>
          <button onClick={() => setSelected(emptyProspect())} style={{ padding: "7px 14px", background: T.panelSoft, border: `1px solid ${T.line}`, borderRadius: "6px", color: T.inkSoft, fontSize: "12px", cursor: "pointer" }}>+ Add manually</button>
        </div>
      </div>

      {/* Seasonal panel */}
      {showSeason && (
        <div style={{ background: T.bgAlt, borderBottom: `1px solid ${T.line}`, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", color: T.gold, fontWeight: 700, letterSpacing: "0.06em" }}>THE SEASONAL CALENDAR — PITCH AHEAD OF EACH PEAK</div>
            <div style={{ fontSize: "11px", color: T.inkSoft }}>
              Next up: <b style={{ color: T.green }}>{peak.emoji} {peak.name}</b> — {monthName(peak.date)} {peak.date.getDate()} ({peak.daysOut} days out).{" "}
              {peak.windowOpen
                ? <span style={{ color: T.blush, fontWeight: 700 }}>Outreach window is OPEN — start pitching now.</span>
                : <span style={{ color: T.muted }}>Outreach window opens ~{peak.leadWeeks} weeks before.</span>}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "12px" }}>
            {PEAKS.map(p => {
              const isNext = p.key === peak.key;
              return (
                <div key={p.key} style={{ background: T.panel, border: `1px solid ${isNext ? T.gold : T.line}`, borderRadius: "6px", padding: "11px 12px", boxShadow: isNext ? `0 0 0 1px ${T.gold}55` : "none" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: T.ink, marginBottom: "3px" }}>{p.emoji} {p.name}</div>
                  <div style={{ fontSize: "10px", color: T.muted, marginBottom: "5px" }}>Pitch ~{p.leadWeeks} wks ahead · {p.offers.map(o => offerMeta(o).name.split(" ")[0]).join(", ")}</div>
                  <div style={{ fontSize: "11px", color: T.inkSoft, lineHeight: 1.5 }}>{p.note}</div>
                </div>
              );
            })}
          </div>
          <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "6px", padding: "12px" }}>
            <div style={{ fontSize: "11px", color: T.gold, fontWeight: 700, marginBottom: "8px" }}>WHO TO CONTACT FOR {peak.name.toUpperCase()} ({peakTargets.length})</div>
            {peakTargets.length === 0 && <div style={{ fontSize: "11px", color: T.muted }}>No open prospects tagged for this peak yet. Add some, or tag existing ones with this season.</div>}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {peakTargets.map(r => (
                <div key={r.id} onClick={() => setSelected(r)} style={{ background: T.panelSoft, border: `1px solid ${T.line}`, borderRadius: "5px", padding: "5px 10px", cursor: "pointer" }}>
                  <span style={{ fontSize: "11px", color: T.ink, fontWeight: 600 }}>{r.business}</span>
                  <span style={{ fontSize: "10px", color: T.muted, marginLeft: "6px" }}>{offerMeta(r.offer).name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clay explainer */}
      {showClay && (
        <div style={{ background: T.blushSoft, borderBottom: `1px solid ${T.line}`, padding: "16px 20px" }}>
          <div style={{ fontSize: "11px", color: T.blush, fontWeight: 700, letterSpacing: "0.06em", marginBottom: "12px" }}>THE CLAY LOOP — FIND THE RIGHT BUYER, NOT JUST THE BUSINESS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
            {CLAY_STEPS.map(s => (
              <div key={s.n} style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "6px", padding: "12px" }}>
                <div style={{ fontSize: "10px", color: T.blush, fontWeight: 800, marginBottom: "4px" }}>STEP {s.n}</div>
                <div style={{ fontSize: "12px", color: T.ink, fontWeight: 700, marginBottom: "4px" }}>{s.t}</div>
                <div style={{ fontSize: "11px", color: T.inkSoft, lineHeight: 1.55 }}>{s.d}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "11px", color: T.inkSoft, marginTop: "10px", lineHeight: 1.6 }}>
            Clay lives in your Claude chat (workspace: <b>Cindy's Workspace</b>). This board is your CRM; Claude runs the Clay enrichment and you log the results here. <b>Hotel Demetria</b> below is a real live Clay pull from setup — and it shows the honest limit: small teams aren't always on LinkedIn, so an email data point (or a walk-in) is sometimes the play.
          </div>
        </div>
      )}

      {/* Score-a-business panel */}
      {showPaste && (
        <div style={{ background: T.greenSoft, borderBottom: `1px solid ${T.line}`, padding: "16px 20px" }}>
          <div style={{ fontSize: "11px", color: T.greenMid, fontWeight: 700, letterSpacing: "0.06em", marginBottom: "8px" }}>
            PASTE A LOCAL BUSINESS — website/about text, or just describe it. I'll score its fit as a recurring/event floral account.
          </div>
          <textarea value={bizText} onChange={e => setBizText(e.target.value)} placeholder="e.g. 'Boutique hotel in Chapalita, 40 rooms, rooftop restaurant and a small event terrace, very design-forward Instagram…'" rows={5}
            style={{ width: "100%", background: T.panel, border: `1px solid ${T.line}`, borderRadius: "6px", color: T.ink, padding: "10px 12px", fontSize: "12px", lineHeight: 1.6, outline: "none", resize: "vertical", fontFamily: "inherit", marginBottom: "10px" }} />
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={handleScore} disabled={scanning || !bizText.trim()} style={{ padding: "8px 18px", background: (scanning || !bizText.trim()) ? T.panelSoft : `linear-gradient(135deg, ${T.green}, ${T.greenMid})`, border: "none", borderRadius: "6px", color: (scanning || !bizText.trim()) ? T.muted : "#fff", fontSize: "12px", fontWeight: 700, cursor: (scanning || !bizText.trim()) ? "default" : "pointer" }}>
              {scanning ? "Scoring…" : "Score floral fit →"}
            </button>
            <span style={{ fontSize: "11px", color: T.muted }}>Scores fit, picks the offer to lead with, tags a season, and names the buyer title to find in Clay.</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.line}`, overflowX: "auto", background: T.panel }}>
        {[
          { label: "Prospects", value: stats.total, color: T.green },
          { label: "Open pipeline", value: stats.open, color: T.greenMid },
          { label: "Recurring accounts won", value: stats.recurring, color: "#3E7D4F" },
          { label: "Annualized pipeline value", value: mxn(stats.annualized), color: T.gold },
          { label: "Next seasonal peak", value: `${peak.emoji} ${peak.name}`, sub: `${monthName(peak.date)} ${peak.date.getDate()} · ${peak.daysOut}d`, color: T.blush },
        ].map((s, i) => (
          <div key={i} style={{ flex: "1 0 130px", padding: "12px 16px", borderRight: `1px solid ${T.line}` }}>
            <div style={{ fontSize: s.sub ? "15px" : "22px", fontWeight: 900, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: "10px", color: T.muted, marginTop: "2px" }}>{s.sub}</div>}
            <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "3px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{ background: T.bgAlt, borderBottom: `1px solid ${T.line}`, padding: "10px 20px", display: "flex", gap: "16px", overflowX: "auto" }}>
          <span style={{ fontSize: "10px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", alignSelf: "center", flexShrink: 0 }}>Upcoming</span>
          {upcoming.map(r => (
            <div key={r.id} onClick={() => setSelected(r)} style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "5px", padding: "5px 10px", cursor: "pointer", flexShrink: 0 }}>
              <span style={{ fontSize: "10px", color: T.green, fontWeight: 700, marginRight: "6px" }}>{r.nextDate}</span>
              <span style={{ fontSize: "11px", color: T.ink }}>{r.business}</span>
              {r.nextAction && <span style={{ fontSize: "10px", color: T.muted, marginLeft: "6px" }}>— {r.nextAction.slice(0, 42)}{r.nextAction.length > 42 ? "…" : ""}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Main */}
      <div style={{ display: "flex", height: "calc(100vh - 230px)" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Filters */}
          <div style={{ padding: "12px 16px", display: "flex", gap: "8px", alignItems: "center", borderBottom: `1px solid ${T.line}`, flexWrap: "wrap" }}>
            <input value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="Search business, segment or area…"
              style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "5px", color: T.ink, padding: "6px 10px", fontSize: "12px", outline: "none", width: "220px" }} />
            <select value={filterSeg} onChange={e => setFilterSeg(e.target.value)} style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "5px", color: T.inkSoft, padding: "6px 10px", fontSize: "12px" }}>
              <option value="all">All segments</option>
              {SEGMENTS.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.name}</option>)}
            </select>
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: "5px", color: T.inkSoft, padding: "6px 10px", fontSize: "12px" }}>
              <option value="all">All stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ fontSize: "11px", color: T.muted, marginLeft: "auto" }}>{filtered.length} prospect{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.4fr 130px 60px 130px 90px", padding: "8px 16px", borderBottom: `1px solid ${T.line}`, fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <span>Business · Segment</span><span>Offer · Deal</span><span>Stage</span><span>Fit</span><span>Buyer</span><span>Next</span>
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: T.muted }}>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>🌷</div>
              <div style={{ fontSize: "13px" }}>No prospects match.</div>
            </div>
          )}

          {filtered.map(r => (
            <div key={r.id} onClick={() => setSelected(r)}
              style={{ display: "grid", gridTemplateColumns: "1.7fr 1.4fr 130px 60px 130px 90px", padding: "10px 16px", borderBottom: `1px solid ${T.line}`, cursor: "pointer", alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = T.panelSoft} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: T.ink, display: "flex", alignItems: "center", gap: "6px" }}>
                  {r.flagged && <span style={{ color: T.gold }}>★</span>}{r.business}
                  {r.clayEnriched && <span title="Clay enriched" style={{ fontSize: "9px", color: "#3E7D4F" }}>◆</span>}
                </div>
                <div style={{ fontSize: "11px", color: T.muted, marginTop: "1px" }}>{segMeta(r.segment).emoji} {segMeta(r.segment).name}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: T.greenMid }}>{offerMeta(r.offer).name}</div>
                <div style={{ fontSize: "10px", color: T.gold }}>{r.dealBand}{offerMeta(r.offer).recur > 1 && r.dealBand ? ` · ≈${mxn(annualValue(r))}/yr` : ""}</div>
              </div>
              <div><Badge label={r.stage} color={STAGE_COLORS[r.stage] || T.muted} /></div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: (r.fitScore || 0) >= 85 ? "#3E7D4F" : (r.fitScore ? T.gold : T.line) }}>{r.fitScore || "—"}</div>
              <div>
                <div style={{ fontSize: "11px", color: r.buyerName ? T.ink : T.muted }}>{r.buyerName || "—"}</div>
                <div style={{ fontSize: "10px", color: T.muted }}>{r.buyerTitle || ""}</div>
              </div>
              <div style={{ fontSize: "11px", color: r.nextDate ? T.green : T.muted }}>{r.nextDate || "—"}</div>
            </div>
          ))}
        </div>

        {/* Activity log */}
        <div style={{ width: "230px", flexShrink: 0, borderLeft: `1px solid ${T.line}`, overflowY: "auto", padding: "14px 12px", background: T.panel }}>
          <div style={{ fontSize: "9px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Activity</div>
          {log.length === 0 && <div style={{ fontSize: "11px", color: T.muted }}>No activity yet.</div>}
          {log.map((e, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "9px", color: T.muted, marginBottom: "1px" }}>{e.time}</div>
              <div style={{ fontSize: "11px", lineHeight: 1.5, color: e.type === "success" ? "#3E7D4F" : e.type === "alert" ? T.gold : e.type === "error" ? T.blush : T.inkSoft }}>{e.msg}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
