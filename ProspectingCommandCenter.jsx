import { useState, useEffect, useCallback } from "react";

// ════════════════════════════════════════════════════════════════════════════
//  METAMORFOSIS COGNITIVA — CLIENT PROSPECTING COMMAND CENTER
//  ---------------------------------------------------------------------------
//  Reframe of Cindy's Job Command Center: instead of tracking jobs SHE applies
//  to, this tracks COMPANIES that will pay her for AI content-strategy work.
//  Built to pair with Clay (clay.com) for finding + enriching the prospects.
//  Developed with Claude.
// ════════════════════════════════════════════════════════════════════════════

// ─── Sales pipeline stages (replaces the job-hunt stages) ──────────────────────

const STAGES = ["Lead", "Researching", "Enriched", "Contacted", "Discovery Call", "Proposal Sent", "Negotiation", "Won", "Lost", "Nurture"];
const STAGE_COLORS = {
  "Lead":           "#64748b",
  "Researching":    "#4f46e5",
  "Enriched":       "#7c3aed",   // enriched in Clay = ready to reach out
  "Contacted":      "#0891b2",
  "Discovery Call": "#0284c7",
  "Proposal Sent":  "#d97706",
  "Negotiation":    "#f59e0b",
  "Won":            "#16a34a",
  "Lost":           "#dc2626",
  "Nurture":        "#6b7280",
};

const SOURCES = ["Clay", "Your job pipeline", "LinkedIn", "Referral", "Inbound", "Event / conference", "Cold outreach", "Other"];

// ─── The five Metamorfosis Cognitiva service lines (what you're actually selling) ─
// Each one maps to a real skill from your background and a real budget line at a
// prospect. This is the "money" layer — every prospect gets tagged with the offer
// that fits, plus a rough deal band so the pipeline shows expected revenue.

const SERVICES = [
  {
    key: "aeo-geo",
    name: "AEO / GEO Audit + Roadmap",
    blurb: "Get the brand cited by AI answer engines (ChatGPT, Perplexity, Gemini). Content + structure audit → prioritized roadmap → optional retainer.",
    buyers: ["CMO", "Head of Growth", "Head of SEO/Content Marketing", "VP Marketing"],
    band: "$4k–12k audit · $3k–6k/mo retainer",
  },
  {
    key: "content-governance",
    name: "AI Content Governance System",
    blurb: "Prompt libraries, guardrails, review loops, and a voice/tone system for LLM-powered features. Stops the brand from shipping off-brand or unsafe AI copy.",
    buyers: ["Head of Design", "Head of Content Design", "VP Product", "Head of AI/ML"],
    band: "$8k–20k build · $2k–5k/mo governance",
  },
  {
    key: "conversation-design",
    name: "Conversation Design for AI Assistants",
    blurb: "UX content for chatbots / agents / assistants: flows, error states, guardrails, explaining money & risk in plain language. Your BBVA chatbot + Wise Assistant lane.",
    buyers: ["Head of Product", "Head of Design", "Conversation Design Lead", "Head of CX"],
    band: "$6k–18k project · day rate $600–1,000",
  },
  {
    key: "bilingual-ai",
    name: "Bilingual / Multilingual AI Content",
    blurb: "EN/ES/FR/IT content + localization systems for LATAM & Europe expansion. Few AI content specialists offer four languages — this is your rare differentiator.",
    buyers: ["Head of International", "Head of Localization", "Head of Content", "VP Product"],
    band: "$5k–15k project · $75/hr+",
  },
  {
    key: "ai-readiness",
    name: "AI-Readiness Content Strategy (IA / taxonomy / metadata)",
    blurb: "Structure content so AI can retrieve and reason over it: taxonomy, IA, metadata, knowledge architecture. Your BBVA taxonomy + JPMC metadata thesis, productized.",
    buyers: ["Head of Content", "Head of Knowledge", "Principal IA", "VP Product"],
    band: "$10k–25k engagement",
  },
  {
    key: "servicenow",
    name: "ServiceNow Content Governance & Knowledge Advisory",
    blurb: "Embedded authoring standards, knowledge-base / catalog / CMDB structure, taxonomy and governance for regulated ServiceNow implementations. Your USAA-via-TCS work, resold — to the SIs who staff it or the enterprises who run it.",
    buyers: ["ServiceNow Practice Lead", "Knowledge Manager", "Delivery / Resource Manager", "Head of Platform"],
    band: "$120–200/hr contract · via SI or direct",
  },
  {
    key: "ai-training",
    name: "AI-Enablement Enterprise Training",
    blurb: "Your four-module program teaching Finance / HR / PM teams to direct and adjudicate AI output without ceding judgment. Bilingual, built on adult-learning theory. Sold per cohort to L&D and transformation teams.",
    buyers: ["Head of L&D", "Head of Transformation", "Head of Operations", "Chief People Officer"],
    band: "$8k–30k per cohort",
  },
];

// ─── Ideal Customer Profile — the filter Clay searches are built from ──────────

const ICP = {
  headline: "AI-native or AI-adopting companies shipping user-facing AI, that feel the content pain but have no content-design/governance function.",
  firmographics: [
    "50–1,500 employees (big enough to have budget, small enough to hire a specialist not a whole team)",
    "Series A → C, or a profitable scale-up",
    "Has shipped an AI feature: assistant, chatbot, agent, AI search, or a generative product",
  ],
  wedges: [
    "Fintech & regulated industries (your BBVA / USAA parallel — they need governed, compliant AI copy)",
    "LATAM & Spain & Europe (your Spanish/French/Italian is a moat US-based consultants can't cross)",
    "Companies hiring for content design, conversation design, UX writing, or GEO — the loudest possible buying signal",
    "Brands whose customers ask AI tools about them (AEO/GEO upside)",
  ],
  disqualifiers: [
    "Pure high-volume content-farm work (your screen-hours constraint)",
    "Direct competitors — AI-content tooling vendors (Writer, Jasper) buy less, poach more",
    "Pre-seed / no revenue (no budget for outside strategy)",
  ],
};

const emptyProspect = () => ({
  id: `pros-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
  company: "",
  domain: "",
  industry: "",
  size: "",
  location: "",
  source: "Clay",
  service: "conversation-design",
  icpScore: null,          // 40–99 fit against the ICP above
  dealBand: "",
  signal: "",              // the buying signal (hiring, funding, product launch…)
  stage: "Lead",
  buyerName: "",
  buyerTitle: "",
  buyerLinkedIn: "",
  buyerEmail: "",
  clayEnriched: false,     // has Clay pulled firmographics + contacts?
  dateAdded: new Date().toISOString().slice(0,10),
  nextDate: "",
  nextAction: "",
  notes: "",
  stageHistory: [],
  flagged: false,
});

// ─── Seed prospects ───────────────────────────────────────────────────────────
// Two kinds:
//   1. WARM — companies from Cindy's own job pipeline that are HIRING for exactly
//      her skills. Hiring for the skill = admitted pain + budget = best prospects.
//   2. NET-NEW — AI-native / LATAM-fintech targets that fit the ICP.
//   3. CLAY — Bitso is real, pulled live from Clay during setup (Aug 2026).

const SEED_PROSPECTS = [
  // ── CLAY-SOURCED (live pull) ──────────────────────────────────────────────
  {
    id: "clay-bitso", company: "Bitso", domain: "bitso.com",
    industry: "Financial Services (crypto/fintech)", size: "501–1,000", location: "Mexico City, MX",
    source: "Clay", service: "conversation-design", icpScore: 92,
    dealBand: "$6k–18k project · retainer upside",
    signal: "LATAM's leading digital-finance platform, 10M+ customers, Spanish-first. Regulated fintech scaling investment + crypto products = heavy need for governed, plain-language AI copy. Your BBVA/Openpay parallel is exact.",
    stage: "Enriched", buyerName: "Charlie Henao", buyerTitle: "Marketing Director",
    buyerLinkedIn: "https://www.linkedin.com/in/chenao/", buyerEmail: "",
    clayEnriched: true, dateAdded: "2026-08-30", nextDate: "2026-09-03",
    nextAction: "Pick the buyer: Charlie Henao (Marketing Dir → GEO/AEO angle) OR find Head of Design/Product for conversation-design angle. Draft a Spanish-language opener referencing their AI assistant.",
    notes: "REAL CLAY DATA. Also surfaced: Daniel Vogel (CEO & Co-Founder, in.../daniel-vogel-588bb38), José Gordillo (Sales Director). 1,045 employees, $25M–75M revenue, HQ Polanco CDMX. Local + Spanish + fintech = your strongest single lead.",
    stageHistory: [{stage:"Lead",date:"2026-08-30"},{stage:"Enriched",date:"2026-08-30"}], flagged: true,
  },
  // ── WARM (from your job pipeline — they're hiring your exact skill) ─────────
  {
    id: "warm-wise", company: "Wise", domain: "wise.com",
    industry: "Fintech (cross-border payments)", size: "5,000+", location: "London, UK",
    source: "Your job pipeline", service: "conversation-design", icpScore: 96,
    dealBand: "$8k–20k · day rate £600–1,000",
    signal: "Hiring TWO Principal AI Content Designers (Wise Assistant + FinCrime). They've publicly priced the pain at principal level. Even if the role doesn't land, they need overflow / specialist help now.",
    stage: "Contacted", buyerName: "Inez Sayer", buyerTitle: "Recruiter (→ intro to Design leadership)",
    buyerLinkedIn: "", buyerEmail: "inez.sayer@wise.com",
    clayEnriched: true, dateAdded: "2026-08-30", nextDate: "2026-09-15",
    nextAction: "Recruiter call is done. Go direct to design leadership: message Nikki Godley (Design Director) — 'saw the Principal AI Content Designer roles; whether or not the FT hire lands, happy to help with Assistant content quality as a specialist.' Pablo Solano (Product Design Lead) is a Spanish-speaking warm-in.",
    notes: "REAL CLAY DATA (Sep 10). $1B–10B revenue, 11,775 employees, 19M customers, London. Design leaders surfaced: Nikki Godley (Design Director, tenured since 2024), Hollie Lubbock (Design Director), Pablo Solano (Product Design Lead — ES), Johnny Michaelsen (Dir. Design & Research Ops), Joshua Fernandes (Head of Product). A 'no' on FT is a 'yes' for consulting — these are the people who own AI content quality.",
    stageHistory: [{stage:"Lead",date:"2026-08-30"},{stage:"Contacted",date:"2026-08-30"},{stage:"Enriched",date:"2026-09-10"}], flagged: true,
  },
  {
    id: "warm-jpmc", company: "JPMorgan Chase", domain: "jpmorganchase.com",
    industry: "Banking (enterprise)", size: "5,000+", location: "US / London",
    source: "Your job pipeline", service: "ai-readiness", icpScore: 90,
    dealBand: "$10k–25k (via a vendor/agency to clear procurement)",
    signal: "Openings for UX Conversation Designer + Principal IA (metadata thought leadership). Enterprise = long sales cycle but real budget. Better reached via a staffing/consulting partner than direct.",
    stage: "Lead", buyerName: "", buyerTitle: "Head of Content Design / IA",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30",
    nextDate: "2026-09-08", nextAction: "Use Clay to find the Content Design / IA leaders. Direct-to-enterprise is slow — consider pitching through EPAM/Slalom who already staff there.",
    notes: "Your BBVA taxonomy + metadata work is almost description-perfect for the Principal IA role. As consulting, route through a partner to skip procurement friction.",
    stageHistory: [{stage:"Lead",date:"2026-08-30"}], flagged: false,
  },
  {
    id: "warm-accor", company: "Accor", domain: "accor.com",
    industry: "Hospitality (global hotels)", size: "5,000+", location: "France",
    source: "Your job pipeline", service: "aeo-geo", icpScore: 89,
    dealBand: "$4k–12k audit · $3k–6k/mo",
    signal: "Posted a 'GEO, SEO & UX Senior Program Manager' role — GEO named explicitly in a job title, which is rare. They've budgeted for exactly your thesis. French is your advantage.",
    stage: "Enriched", buyerName: "Marie Patrigeon", buyerTitle: "Global 360 Marketing Director — ALL Accor",
    buyerLinkedIn: "https://www.linkedin.com/in/marie-patrigeon-b546a052/", buyerEmail: "", clayEnriched: true, dateAdded: "2026-08-30",
    nextDate: "2026-09-16", nextAction: "Message Marie Patrigeon in French — pitch a GEO audit of how Accor brands surface in AI answer engines vs competitors, as a complement to the GEO role they're hiring. Noemie Schneider (Content Director, EU/NA) is the content-side entry.",
    notes: "REAL CLAY DATA (Sep 10). 102k employees, hospitality giant, France. Enterprise = long cycle, so lead with a small paid GEO audit, not a big engagement. Buyers: Marie Patrigeon (Global 360 Marketing Dir, ALL Accor loyalty, France — French advantage), Noemie Schneider (Content Director Dev & Design, EU/NA), Camille Lopeo (CMO Sofitel/MGallery). Their open GEO role proves budget exists.",
    stageHistory: [{stage:"Lead",date:"2026-08-30"},{stage:"Enriched",date:"2026-09-10"}], flagged: true,
  },
  {
    id: "warm-moderntreasury", company: "Modern Treasury", domain: "moderntreasury.com",
    industry: "Fintech (payment ops)", size: "201–500", location: "San Francisco / Remote",
    source: "Your job pipeline", service: "ai-readiness", icpScore: 88,
    dealBand: "$10k–25k engagement",
    signal: "Hiring an 'AI Search and Discovery Lead' — semantic search + content intelligence + IA, exactly your BBVA taxonomy/search work. Right size for a specialist, not a whole team.",
    stage: "Lead", buyerName: "", buyerTitle: "Head of Product / AI",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30",
    nextDate: "2026-09-05", nextAction: "Clay-enrich → find Head of Product / Design. Lead with a short teardown of how their docs/product surface in AI search today.",
    notes: "Payments + AI discovery. Smaller + venture-backed = faster decision than the banks.",
    stageHistory: [{stage:"Lead",date:"2026-08-30"}], flagged: false,
  },
  {
    id: "warm-gendigital", company: "Gen Digital", domain: "gendigital.com",
    industry: "Consumer cybersecurity (Norton/Avast)", size: "5,000+", location: "Remote / London",
    source: "Your job pipeline", service: "conversation-design", icpScore: 86,
    dealBand: "$6k–18k project",
    signal: "Hiring a Staff AI Conversation Designer. Chatbot + voice IA aligns with your BBVA chatbot + Skydropx flows. Consumer-scale AI support = ongoing content need.",
    stage: "Lead", buyerName: "", buyerTitle: "Head of Design / Conversation Design",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30",
    nextDate: "2026-09-08", nextAction: "Clay-enrich the design org. Angle: guardrails + trust copy for security products (high-stakes = high value).",
    notes: "Security products explaining risk to consumers = your 'explaining money/risk in plain language' strength.",
    stageHistory: [{stage:"Lead",date:"2026-08-30"}], flagged: false,
  },
  {
    id: "warm-blink", company: "Blink UX", domain: "blinkux.com",
    industry: "UX agency", size: "201–500", location: "Remote / US",
    source: "Your job pipeline", service: "content-governance", icpScore: 87,
    dealBand: "Subcontract / white-label, $75–100/hr",
    signal: "Rejected you for a 'Content Strategist (AI Readiness)' FTE — but the role existing proves client demand. Agencies subcontract specialists constantly. Turn the 'no' into a partnership.",
    stage: "Nurture", buyerName: "", buyerTitle: "Content / Design Practice Lead",
    buyerLinkedIn: "", buyerEmail: "recruiting@blinkux.com", clayEnriched: false, dateAdded: "2026-08-30",
    nextDate: "2026-09-10", nextAction: "Warm note: 'I'm consulting on AI-readiness content now — if a client need outstrips your bench, I'd love to partner.' Agencies are recurring revenue.",
    notes: "Agency partnerships = pipeline without your own marketing. One good agency relationship can be worth more than five direct clients.",
    stageHistory: [{stage:"Lead",date:"2026-08-30"},{stage:"Nurture",date:"2026-08-30"}], flagged: true,
  },
  // ── NET-NEW (AI-native + LATAM fintech targets that fit the ICP) ────────────
  {
    id: "new-decagon", company: "Decagon", domain: "decagon.ai",
    industry: "AI customer-support agents", size: "51–200", location: "San Francisco",
    source: "Cold outreach", service: "conversation-design", icpScore: 91,
    dealBand: "$6k–18k project",
    signal: "Builds AI support agents for enterprises. Their whole product IS conversation — but they sell the engine, not the content craft. Their customers need someone who designs the actual agent voice + guardrails. Partner or direct.",
    stage: "Enriched", buyerName: "Bihan Jiang", buyerTitle: "Director of Product",
    buyerLinkedIn: "https://www.linkedin.com/in/bihanjiang/", buyerEmail: "", clayEnriched: true, dateAdded: "2026-08-30",
    nextDate: "2026-09-15", nextAction: "Message Bihan Jiang (Director of Product). Angle: their whole org is 'Agent Product Managers' with NO content-design function — offer agent voice/guardrail standards as a specialist. Jesse Zhang (CEO) for a partner play; Nick Bryan (Head of Product Marketing) for the GEO angle.",
    notes: "REAL CLAY DATA (Sep 10). 582 employees, $100–250M raised, $200–500M revenue, SF. THESIS CONFIRMED: the team is all 'Agent Product Managers' — they build the engine, no one owns content craft. That's the gap. Customers include Chime, Oura, 1-800-Flowers. Buyers: Bihan Jiang (Dir. Product), Jesse Zhang (CEO/Co-Founder), Ashwin Sreenivas (President/Co-Founder), Nick Bryan (Head of Product Marketing).",
    stageHistory: [{stage:"Lead",date:"2026-08-30"},{stage:"Researching",date:"2026-08-30"},{stage:"Enriched",date:"2026-09-10"}], flagged: true,
  },
  {
    id: "new-sierra", company: "Sierra", domain: "sierra.ai",
    industry: "AI customer-experience agents", size: "201–500", location: "San Francisco",
    source: "Cold outreach", service: "conversation-design", icpScore: 88,
    dealBand: "$6k–18k · partner referral",
    signal: "Bret Taylor's conversational-AI company. Deploys branded AI agents for big consumer brands — every deployment needs voice, tone, and guardrail design. High-growth, high-budget.",
    stage: "Researching", buyerName: "", buyerTitle: "Head of Agent Design / Solutions",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30",
    nextDate: "2026-09-06", nextAction: "Clay-enrich the solutions/design org. Angle: fractional conversation-design craft for their brand deployments.",
    notes: "Same thesis as Decagon. The AI-agent wave creates conversation-design demand faster than the talent market can fill it.",
    stageHistory: [{stage:"Lead",date:"2026-08-30"},{stage:"Researching",date:"2026-08-30"}], flagged: false,
  },
  {
    id: "new-konfio", company: "Konfío", domain: "konfio.mx",
    industry: "Fintech (SME lending, MX)", size: "1,001–5,000", location: "Polanco, Mexico City, MX",
    source: "Clay", service: "bilingual-ai", icpScore: 90,
    dealBand: "$5k–15k project · $75/hr+",
    signal: "Top-250 global fintech (CB Insights), $250M+ raised, $75–200M revenue, 1,547 employees. Publicly moving 'far beyond lending' into AI-driven tools. Spanish-first, regulated, local to you. Explaining credit in plain Spanish AI copy = your exact wedge.",
    stage: "Enriched", buyerName: "José Pablo Cervera", buyerTitle: "Sr. Director of Product",
    buyerLinkedIn: "https://www.linkedin.com/in/josé-pablo-cervera-abb10047/", buyerEmail: "",
    clayEnriched: true, dateAdded: "2026-08-30", nextDate: "2026-09-04",
    nextAction: "Warm-intro path: Guillermo Rivera Aguilar (Sr PM) is based in Guadalajara — your city. Draft a Spanish opener to José Pablo Cervera referencing a specific onboarding/credit flow; mention the local connection.",
    notes: "REAL CLAY DATA (trial run Aug 30). Decision-makers surfaced: José Pablo Cervera (Sr. Director of Product, tenured since 2024 — best entry), Omar De Ybarrondo (Head of Product, Cross Products), José Gregorio Castro Lazo (Dir. Product Engineering). Guadalajara-based Guillermo Rivera Aguilar = possible warm intro. Emails not returned — spend a Clay 'Email' data point on Cervera when ready to reach out.",
    stageHistory: [{stage:"Lead",date:"2026-08-30"},{stage:"Researching",date:"2026-08-30"},{stage:"Enriched",date:"2026-08-30"}], flagged: true,
  },
  {
    id: "new-belvo", company: "Belvo", domain: "belvo.com",
    industry: "Fintech (open banking API, LATAM)", size: "51–200", location: "Mexico City / Barcelona",
    source: "Cold outreach", service: "ai-readiness", icpScore: 87,
    dealBand: "$8k–20k engagement",
    signal: "Open-banking infrastructure across LATAM + Spain. Developer-facing + regulated. Needs governed content + docs that AI tools can retrieve. Barcelona + Mexico = Spanish, your two markets.",
    stage: "Lead", buyerName: "", buyerTitle: "Head of Content / DevRel / Product",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30",
    nextDate: "2026-09-06", nextAction: "Clay-enrich. Angle: AI-readiness of their developer docs + product content (does Perplexity/ChatGPT explain Belvo correctly today?).",
    notes: "Barcelona office = a bridge to the Spain/Europe market you keep surfacing in your job search.",
    stageHistory: [{stage:"Lead",date:"2026-08-30"}], flagged: false,
  },
  {
    id: "new-intercom", company: "Intercom (Fin)", domain: "intercom.com",
    industry: "Customer service software + AI agent", size: "1,000+", location: "Dublin / SF / Remote",
    source: "Cold outreach", service: "content-governance", icpScore: 84,
    dealBand: "$8k–20k build",
    signal: "'Fin' is their AI support agent, sold to thousands of businesses. Those businesses need help writing the content Fin draws from + governing its answers — a services gap around a hot product.",
    stage: "Lead", buyerName: "", buyerTitle: "Head of Content / Fin Product",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-08-30",
    nextDate: "2026-09-09", nextAction: "Clay-enrich. Likely better as a 'help Fin's customers' partner play than direct-to-Intercom.",
    notes: "Where a platform sells AI to non-experts, there's always a content-services layer the vendor won't staff. That layer is your business.",
    stageHistory: [{stage:"Lead",date:"2026-08-30"}], flagged: false,
  },
  // ── SERVICENOW ECOSYSTEM (from the CV — warmest, most credible vector) ─────
  {
    id: "sn-tcs", company: "TCS (Tata Consultancy Services)", domain: "tcs.com",
    industry: "IT services / ServiceNow SI", size: "10,000+", location: "Global / MX / US",
    source: "Referral", service: "servicenow", icpScore: 95,
    dealBand: "$120–200/hr contract",
    signal: "YOU ALREADY DELIVERED THROUGH THEM — the USAA ServiceNow content-governance work on your CV was via TCS. That's a warm, dormant relationship. SIs constantly need KM/content-governance specialists on the bench. Warmest lead in the whole pipeline.",
    stage: "Nurture", buyerName: "", buyerTitle: "ServiceNow Practice / Resource Lead",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-09-25",
    nextDate: "2026-09-29", nextAction: "Reconnect with your USAA-engagement contacts at TCS. Clay-find the ServiceNow practice / resourcing lead. Angle: 'available for ServiceNow content-governance & KM engagements.'",
    notes: "Warm re-engagement, not cold outreach. You have proof of Fortune-500 delivery through them. Ask your old engagement manager who staffs ServiceNow KM/content work now.",
    stageHistory: [{stage:"Nurture",date:"2026-09-25"}], flagged: true,
  },
  {
    id: "sn-glidefast", company: "GlideFast Consulting", domain: "glidefast.com",
    industry: "ServiceNow Elite Partner (pure-play)", size: "201–500", location: "US / Remote",
    source: "Cold outreach", service: "servicenow", icpScore: 90,
    dealBand: "$120–200/hr contract",
    signal: "Pure-play ServiceNow implementation partner. Every engagement needs knowledge-base + catalog content structured well — a gap generalist consultants don't fill. Your embedded-authoring-standards work is a rare, sellable specialty here.",
    stage: "Enriched", buyerName: "Syed Hassan", buyerTitle: "Service Delivery Director",
    buyerLinkedIn: "https://www.linkedin.com/in/syed-hassan-630205a2/", buyerEmail: "", clayEnriched: true, dateAdded: "2026-09-25",
    nextDate: "2026-09-30", nextAction: "Message Syed Hassan (Service Delivery Director) — the person who'd bring a content-governance specialist onto engagements. Alt door: Andrena Lombardo Silva (Dir. Talent Acquisition) for bench/contract. Pitch fractional ServiceNow KB/catalog content support.",
    notes: "REAL CLAY DATA (Sep 25). Elite ServiceNow Partner, 588 employees, $75–200M revenue, Waltham MA; now part of Everforth (NYSE: EFOR). Buyers: Syed Hassan (Service Delivery Director — best), Andrena Lombardo Silva (Dir. Talent Acquisition — staffs contractors), Michael Lombardo (Founder/CEO). Pure-play SIs are the best subcontract partners — one relationship = recurring project flow.",
    stageHistory: [{stage:"Lead",date:"2026-09-25"},{stage:"Enriched",date:"2026-09-25"}], flagged: true,
  },
  {
    id: "sn-thirdera", company: "Thirdera (a Cognizant company)", domain: "thirdera.com",
    industry: "ServiceNow Elite Partner (largest pure-play)", size: "1,001–5,000", location: "Global / US / LATAM",
    source: "Cold outreach", service: "servicenow", icpScore: 88,
    dealBand: "$120–200/hr contract",
    signal: "One of the largest pure-play ServiceNow partners, with LATAM delivery centers — Spanish + your timezone are advantages. Knowledge management is a named ServiceNow practice area they sell.",
    stage: "Lead", buyerName: "", buyerTitle: "KM Practice Lead / Resource Manager",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-09-25",
    nextDate: "2026-09-30", nextAction: "Clay-find their KM / Knowledge practice leadership, ideally LATAM-based. Spanish-language opener.",
    notes: "LATAM delivery footprint makes you an easy cultural + timezone fit. Now Cognizant-owned = bigger deal flow.",
    stageHistory: [{stage:"Lead",date:"2026-09-25"}], flagged: false,
  },
  // ── AI-ENABLEMENT TRAINING + warm reference ───────────────────────────────
  {
    id: "warm-mila", company: "MILA Stories", domain: "",
    industry: "Storytelling / conversational AI platform", size: "1–50", location: "Remote",
    source: "Referral", service: "ai-training", icpScore: 84,
    dealBand: "$8k–30k per cohort · repeat consulting",
    signal: "PAST CLIENT (Nov–Dec 2025): you designed their conversational IA and lifted engagement up to 70% / cut errors 90%. A happy past client is your best source of repeat work AND referrals. Ask for both.",
    stage: "Nurture", buyerName: "", buyerTitle: "Founder / Product Lead",
    buyerLinkedIn: "", buyerEmail: "", clayEnriched: false, dateAdded: "2026-09-25",
    nextDate: "2026-09-29", nextAction: "Warm check-in: how are the flows performing since your work? Offer a follow-on + ask who else in their network needs the same. Add domain when you have it.",
    notes: "Reference + repeat + referral, all in one. Get a testimonial while the 70%/90% results are fresh — it powers every other pitch.",
    stageHistory: [{stage:"Nurture",date:"2026-09-25"}], flagged: true,
  },
];

// ─── Persistent storage helpers ───────────────────────────────────────────────

async function loadProspects() {
  try {
    const r = await window.storage.get("mc-prospects");
    return r ? JSON.parse(r.value) : [];
  } catch { return []; }
}
async function saveProspects(rows) {
  try { await window.storage.set("mc-prospects", JSON.stringify(rows)); }
  catch (e) { console.error("Save failed", e); }
}
async function loadLog() {
  try {
    const r = await window.storage.get("mc-log");
    return r ? JSON.parse(r.value) : [];
  } catch { return []; }
}
async function saveLog(log) {
  try { await window.storage.set("mc-log", JSON.stringify(log.slice(0, 100))); } catch {}
}

// ─── AI: score a company against the Metamorfosis ICP ─────────────────────────
// Mirrors the job-scorer from the original tool, pointed at the buy side.
// Paste a company blurb / website copy / job posting and it scores FIT-TO-SELL.

async function scoreCompanyFit(companyText) {
  const prompt = `You are a B2B sales-development analyst for "Metamorfosis Cognitiva", the independent consultancy of Cindy Hatch. Cindy sells five services to companies:
1. AEO/GEO Audit + Roadmap (getting a brand cited by AI answer engines)
2. AI Content Governance (prompt libraries, guardrails, review loops, voice/tone for LLM features)
3. Conversation Design for AI assistants/chatbots/agents
4. Bilingual/Multilingual AI content (EN/ES/FR/IT) for LATAM & Europe
5. AI-Readiness Content Strategy (IA, taxonomy, metadata, knowledge architecture)

Her edge: 10+ yrs content strategy & IA; fintech/enterprise background (BBVA, USAA); bilingual EN/ES plus French & Italian; based in Guadalajara MX (LATAM timezone). Ideal clients are 50–1,500-person AI-native or AI-adopting companies (esp. fintech/regulated, and LATAM/Spain/Europe) that ship user-facing AI but lack a content-design/governance function. Companies hiring for content design / conversation design / GEO are the strongest signal.

Evaluate this company as a PROSPECT (someone who would PAY Cindy), not as an employer:
"""
${companyText.slice(0, 6000)}
"""

Return ONLY a JSON object, no markdown:
{
  "company": "name",
  "domain": "best guess domain, e.g. stripe.com",
  "industry": "short",
  "size": "employee band if inferable else empty",
  "location": "hq city/country if inferable else empty",
  "service": one of "aeo-geo" | "content-governance" | "conversation-design" | "bilingual-ai" | "ai-readiness",
  "icpScore": number 40-99 (fit-to-sell),
  "dealBand": "rough deal size range",
  "signal": "2-3 sentences: the specific reason they'd buy NOW, and which decision-maker owns it",
  "nextAction": "concrete next step (usually: which title to find in Clay + the opening angle)"
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

// ─── How Clay plugs in (the enrichment loop, documented in-app) ───────────────

const CLAY_STEPS = [
  { n: 1, t: "Add a prospect here", d: "From your job pipeline, a referral, or the AI scorer below. Give it a domain — Clay needs a domain, not just a name." },
  { n: 2, t: "Ask Claude to enrich it in Clay", d: "In chat: “enrich {domain} in Clay and find the Head of Design / Product.” Claude runs Clay’s find-and-enrich-company + contacts tools on your workspace." },
  { n: 3, t: "Paste the buyer back in", d: "Drop the returned name, title, LinkedIn and email into the prospect’s drawer, and flip Stage → Enriched. Now it’s ready for outreach." },
  { n: 4, t: "Work the pipeline", d: "Contacted → Discovery Call → Proposal → Won. The dashboard tracks expected revenue so you always know which deals to push." },
];

// ─── Sub-components (unchanged design language from the original tool) ─────────

function Badge({ label, color }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      fontSize: "10px", fontWeight: 700, padding: "2px 7px",
      borderRadius: "4px", letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          background: "#111", border: "1px solid #2a2a2a", borderRadius: "5px",
          color: "#f0f0f0", padding: "7px 10px", fontSize: "12px", outline: "none", width: "100%",
        }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: "#111", border: "1px solid #2a2a2a", borderRadius: "5px",
        color: "#f0f0f0", padding: "7px 10px", fontSize: "12px", outline: "none", width: "100%",
      }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

const serviceName = (key) => (SERVICES.find(s => s.key === key)?.name) || key;

// ─── Review modal (approve a scored prospect before it lands in the pipeline) ──

function ReviewModal({ prospect, onApprove, onDismiss }) {
  const [draft, setDraft] = useState({ ...prospect });
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px",
    }}>
      <div style={{ background: "#111", border: "1px solid #333", borderRadius: "10px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "2px" }}>
              ⚡ NEW PROSPECT — REVIEW BEFORE ADDING
            </div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#f0f0f0" }}>{draft.company}</div>
            <div style={{ fontSize: "13px", color: "#888" }}>{draft.industry} · {draft.location}</div>
            <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
              <Badge label={serviceName(draft.service)} color="#7c3aed" />
              {draft.dealBand && <Badge label={draft.dealBand} color="#16a34a" />}
            </div>
          </div>
          {draft.icpScore && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: draft.icpScore >= 88 ? "#4ade80" : "#facc15" }}>{draft.icpScore}</div>
              <div style={{ fontSize: "9px", color: "#555" }}>ICP FIT</div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {draft.signal && (
            <div style={{ background: "#0d1f0d", border: "1px solid #1a3a1a", borderRadius: "6px", padding: "10px 12px", fontSize: "12px", color: "#86efac", lineHeight: 1.6 }}>
              💡 {draft.signal}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Company" value={draft.company} onChange={v => set("company", v)} />
            <Input label="Domain" value={draft.domain} onChange={v => set("domain", v)} placeholder="company.com" />
            <Input label="Industry" value={draft.industry} onChange={v => set("industry", v)} />
            <Input label="Location" value={draft.location} onChange={v => set("location", v)} />
            <Select label="Service to sell" value={draft.service} onChange={v => set("service", v)} options={SERVICES.map(s => ({ value: s.key, label: s.name }))} />
            <Input label="Deal band" value={draft.dealBand} onChange={v => set("dealBand", v)} />
            <Select label="Source" value={draft.source} onChange={v => set("source", v)} options={SOURCES} />
            <Input label="Next action" value={draft.nextAction} onChange={v => set("nextAction", v)} />
          </div>
          {draft.domain && (
            <div style={{ background: "#12101c", border: "1px solid #2a2350", borderRadius: "6px", padding: "10px 12px", fontSize: "11px", color: "#c4b5fd", lineHeight: 1.6 }}>
              🔗 Next: ask Claude → <span style={{ color: "#e9d5ff", fontWeight: 600 }}>“enrich {draft.domain} in Clay and find the {SERVICES.find(s=>s.key===draft.service)?.buyers[0] || "buyer"}”</span>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid #1e1e1e", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onDismiss} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #333", borderRadius: "6px", color: "#666", fontSize: "12px", cursor: "pointer" }}>Skip</button>
          <button onClick={() => onApprove(draft)} style={{ padding: "8px 20px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>✓ Add to pipeline</button>
        </div>
      </div>
    </div>
  );
}

// ─── Prospect detail drawer ───────────────────────────────────────────────────

function ProspectDrawer({ prospect, onSave, onClose, onDelete }) {
  const [draft, setDraft] = useState({ ...prospect });
  const [dirty, setDirty] = useState(false);
  const update = (k, v) => { setDraft(d => ({ ...d, [k]: v })); setDirty(true); };

  const changeStage = (newStage) => {
    const history = [...(draft.stageHistory || []), { stage: newStage, date: new Date().toISOString().slice(0,10) }];
    setDraft(d => ({ ...d, stage: newStage, stageHistory: history, clayEnriched: newStage === "Enriched" ? true : d.clayEnriched }));
    setDirty(true);
  };

  const svc = SERVICES.find(s => s.key === draft.service);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "flex-end", zIndex: 900 }}>
      <div style={{ background: "#0d0d0d", borderLeft: "1px solid #222", width: "100%", maxWidth: "480px", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e1e" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#f0f0f0" }}>{draft.company}</div>
              <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{draft.industry}{draft.size ? ` · ${draft.size}` : ""}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: "18px", cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
            {STAGES.map(s => (
              <button key={s} onClick={() => changeStage(s)} style={{
                padding: "3px 9px", fontSize: "10px", fontWeight: 700, borderRadius: "4px", cursor: "pointer", border: "none",
                background: draft.stage === s ? STAGE_COLORS[s] : "#1a1a1a", color: draft.stage === s ? "#fff" : "#555",
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          {/* Service + deal */}
          <div style={{ background: "#0d1f0d", border: "1px solid #1a3a1a", borderRadius: "6px", padding: "10px 12px" }}>
            <div style={{ fontSize: "10px", color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Selling: {svc?.name}</div>
            <div style={{ fontSize: "11px", color: "#86efac", lineHeight: 1.6 }}>{svc?.blurb}</div>
            <div style={{ fontSize: "11px", color: "#4ade80", marginTop: "6px", fontWeight: 700 }}>{svc?.band}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Company" value={draft.company} onChange={v => update("company", v)} />
            <Input label="Domain" value={draft.domain} onChange={v => update("domain", v)} />
            <Input label="Industry" value={draft.industry} onChange={v => update("industry", v)} />
            <Input label="Size" value={draft.size} onChange={v => update("size", v)} placeholder="201–500" />
            <Input label="Location" value={draft.location} onChange={v => update("location", v)} />
            <Select label="Source" value={draft.source} onChange={v => update("source", v)} options={SOURCES} />
            <Select label="Service to sell" value={draft.service} onChange={v => update("service", v)} options={SERVICES.map(s => ({ value: s.key, label: s.name }))} />
            <Input label="Deal band" value={draft.dealBand} onChange={v => update("dealBand", v)} />
          </div>

          {/* Buying signal */}
          <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "12px" }}>
            <label style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>Buying signal — why they'd pay now</label>
            <textarea value={draft.signal} onChange={e => update("signal", e.target.value)} rows={3}
              style={{ marginTop: "6px", background: "#111", border: "1px solid #2a2a2a", borderRadius: "5px", color: "#f0f0f0", padding: "8px 10px", fontSize: "12px", outline: "none", resize: "vertical", width: "100%", lineHeight: 1.6 }} />
          </div>

          {/* Buyer / Clay enrichment */}
          <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>Buyer (enrich in Clay)</div>
              {draft.clayEnriched ? <Badge label="✓ Clay enriched" color="#16a34a" /> : <Badge label="not yet enriched" color="#d97706" />}
            </div>
            {draft.domain && !draft.clayEnriched && (
              <div style={{ background: "#12101c", border: "1px solid #2a2350", borderRadius: "6px", padding: "9px 11px", fontSize: "11px", color: "#c4b5fd", lineHeight: 1.6, marginBottom: "10px" }}>
                Ask Claude: <span style={{ color: "#e9d5ff", fontWeight: 600 }}>“enrich {draft.domain} in Clay and find the {svc?.buyers[0]}”</span> — then paste the result below.
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Input label="Name" value={draft.buyerName} onChange={v => update("buyerName", v)} />
              <Input label="Title" value={draft.buyerTitle} onChange={v => update("buyerTitle", v)} placeholder={svc?.buyers.join(" / ")} />
              <Input label="LinkedIn" value={draft.buyerLinkedIn} onChange={v => update("buyerLinkedIn", v)} placeholder="linkedin.com/in/..." />
              <Input label="Email" value={draft.buyerEmail} onChange={v => update("buyerEmail", v)} placeholder="name@company.com" />
            </div>
          </div>

          {/* Next step */}
          <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "12px" }}>
            <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Next step</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Input label="Date" value={draft.nextDate} onChange={v => update("nextDate", v)} type="date" />
              <Input label="Action" value={draft.nextAction} onChange={v => update("nextAction", v)} placeholder="Send opener, book discovery..." />
            </div>
          </div>

          {/* Timeline */}
          {draft.stageHistory?.length > 0 && (
            <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "12px" }}>
              <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Timeline</div>
              {draft.stageHistory.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: STAGE_COLORS[h.stage] || "#444", flexShrink: 0 }} />
                  <span style={{ fontSize: "11px", color: "#888" }}>{h.date}</span>
                  <span style={{ fontSize: "11px", color: "#ccc" }}>{h.stage}</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "12px" }}>
            <label style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</label>
            <textarea value={draft.notes} onChange={e => update("notes", e.target.value)} rows={4}
              placeholder="Discovery notes, proposal scope, objections, follow-ups..."
              style={{ marginTop: "6px", background: "#111", border: "1px solid #2a2a2a", borderRadius: "5px", color: "#f0f0f0", padding: "8px 10px", fontSize: "12px", outline: "none", resize: "vertical", width: "100%", lineHeight: 1.6 }} />
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid #1e1e1e", display: "flex", gap: "8px", justifyContent: "space-between" }}>
          <button onClick={() => onDelete(prospect.id)} style={{ padding: "7px 12px", background: "transparent", border: "1px solid #3a1a1a", borderRadius: "5px", color: "#f87171", fontSize: "11px", cursor: "pointer" }}>Delete</button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{ padding: "7px 14px", background: "transparent", border: "1px solid #2a2a2a", borderRadius: "5px", color: "#666", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => { onSave(draft); setDirty(false); }} disabled={!dirty} style={{ padding: "7px 16px", background: dirty ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "#1a1a1a", border: "none", borderRadius: "5px", color: dirty ? "#fff" : "#444", fontSize: "12px", fontWeight: 700, cursor: dirty ? "pointer" : "default" }}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main app ─────────────────────────────────────────────────────────────────

export default function ProspectingCommandCenter() {
  const [rows, setRows] = useState([]);
  const [log, setLog] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filterStage, setFilterStage] = useState("all");
  const [filterText, setFilterText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [showClay, setShowClay] = useState(false);
  const [coText, setCoText] = useState("");

  useEffect(() => {
    Promise.all([loadProspects(), loadLog()]).then(([r, l]) => {
      if (!r || r.length === 0) { setRows(SEED_PROSPECTS); saveProspects(SEED_PROSPECTS); }
      else setRows(r);
      setLog(l); setLoaded(true);
    });
  }, []);

  useEffect(() => { if (loaded) saveProspects(rows); }, [rows, loaded]);

  const addLog = useCallback((msg, type = "info") => {
    setLog(prev => {
      const next = [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 100);
      saveLog(next); return next;
    });
  }, []);

  const handleScore = async () => {
    if (!coText.trim()) return;
    setScanning(true);
    addLog("Scoring company as a prospect…", "info");
    try {
      const r = await scoreCompanyFit(coText);
      const p = {
        ...emptyProspect(),
        company: r.company || "Unknown", domain: r.domain || "", industry: r.industry || "",
        size: r.size || "", location: r.location || "", service: r.service || "conversation-design",
        icpScore: r.icpScore || null, dealBand: r.dealBand || "", signal: r.signal || "",
        nextAction: r.nextAction || "", source: "Other", stage: "Lead",
      };
      addLog(`Scored ${p.company} — ICP fit ${p.icpScore}/99`, "success");
      setReviewing(p); setCoText(""); setShowPaste(false);
    } catch (e) { addLog("Could not score that: " + e.message, "error"); }
    setScanning(false);
  };

  const approve = (draft) => {
    const p = { ...draft, stageHistory: [{ stage: draft.stage || "Lead", date: new Date().toISOString().slice(0,10) }] };
    setRows(prev => [p, ...prev]);
    addLog(`✓ Added prospect: ${p.company}`, "success");
    setReviewing(null);
  };

  const saveRow = (u) => { setRows(prev => prev.map(r => r.id === u.id ? u : r)); setSelected(u); addLog(`Updated: ${u.company}`, "info"); };
  const deleteRow = (id) => { setRows(prev => prev.filter(r => r.id !== id)); setSelected(null); addLog("Prospect removed.", "info"); };

  const filtered = rows.filter(r => {
    if (filterStage !== "all" && r.stage !== filterStage) return false;
    if (filterText) {
      const q = filterText.toLowerCase();
      if (!r.company.toLowerCase().includes(q) && !(r.industry || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Pull the low end of each deal band as a conservative "expected revenue" proxy.
  const bandLow = (b) => { const m = (b || "").replace(/[,k]/gi, m => m.toLowerCase() === "k" ? "000" : "").match(/\$?(\d{3,7})/); return m ? parseInt(m[1], 10) : 0; };
  const openStages = ["Lead","Researching","Enriched","Contacted","Discovery Call","Proposal Sent","Negotiation"];
  const stats = {
    total: rows.length,
    open: rows.filter(r => openStages.includes(r.stage)).length,
    engaged: rows.filter(r => ["Contacted","Discovery Call","Proposal Sent","Negotiation"].includes(r.stage)).length,
    won: rows.filter(r => r.stage === "Won").length,
    pipelineValue: rows.filter(r => openStages.includes(r.stage)).reduce((s, r) => s + bandLow(r.dealBand), 0),
  };

  const upcoming = rows
    .filter(r => r.nextDate && r.nextDate >= new Date().toISOString().slice(0,10))
    .sort((a,b) => a.nextDate.localeCompare(b.nextDate)).slice(0, 5);

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#f0f0f0", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        button { transition: filter 0.15s; }
        button:hover { filter: brightness(1.2); }
        input, select, textarea { font-family: inherit; }
        a { color: inherit; }
      `}</style>

      {reviewing && <ReviewModal prospect={reviewing} onApprove={approve} onDismiss={() => { addLog(`Skipped: ${reviewing.company}`, "info"); setReviewing(null); }} />}
      {selected && <ProspectDrawer prospect={selected} onSave={saveRow} onClose={() => setSelected(null)} onDelete={deleteRow} />}

      {/* Top bar */}
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: "16px", letterSpacing: "-0.02em" }}>Metamorfosis Cognitiva · Prospecting HQ</div>
          <div style={{ fontSize: "10px", color: "#444", marginTop: "1px" }}>Cindy Hatch · AI content strategy · AEO/GEO · conversation design · powered by Clay</div>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setShowClay(v => !v)} style={{ padding: "7px 14px", background: showClay ? "#1a1a1a" : "#12101c", border: "1px solid #2a2350", borderRadius: "6px", color: "#c4b5fd", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
            {showClay ? "✕ Close" : "◇ How Clay plugs in"}
          </button>
          <button onClick={() => setShowPaste(v => !v)} style={{ padding: "7px 16px", background: showPaste ? "#1a1a1a" : "linear-gradient(135deg, #7c3aed, #4f46e5)", border: showPaste ? "1px solid #2a2a2a" : "none", borderRadius: "6px", color: showPaste ? "#888" : "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
            {showPaste ? "✕ Close" : "✦ Score a company"}
          </button>
          <button onClick={() => setSelected(emptyProspect())} style={{ padding: "7px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "6px", color: "#aaa", fontSize: "12px", cursor: "pointer" }}>+ Add manually</button>
        </div>
      </div>

      {/* Clay explainer */}
      {showClay && (
        <div style={{ background: "#0b0a12", borderBottom: "1px solid #1a1a1a", padding: "16px 20px" }}>
          <div style={{ fontSize: "11px", color: "#c4b5fd", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "12px" }}>THE CLAY LOOP — FIND THE RIGHT BUYER, NOT JUST THE COMPANY</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
            {CLAY_STEPS.map(s => (
              <div key={s.n} style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "12px" }}>
                <div style={{ fontSize: "10px", color: "#7c3aed", fontWeight: 800, marginBottom: "4px" }}>STEP {s.n}</div>
                <div style={{ fontSize: "12px", color: "#e0e0e0", fontWeight: 700, marginBottom: "4px" }}>{s.t}</div>
                <div style={{ fontSize: "11px", color: "#777", lineHeight: 1.55 }}>{s.d}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "10px", lineHeight: 1.6 }}>
            Clay lives in your Claude chat (workspace: <span style={{ color: "#888" }}>Cindy's Workspace</span>). This board is your CRM; Claude runs the Clay enrichment and you log the results here. Bitso in the list below is a real live pull.
          </div>
        </div>
      )}

      {/* Score-a-company panel */}
      {showPaste && (
        <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", padding: "16px 20px" }}>
          <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "8px" }}>
            PASTE A COMPANY — website copy, a job post, or a description. I'll score fit-to-SELL against your ICP.
          </div>
          <textarea value={coText} onChange={e => setCoText(e.target.value)} placeholder="Paste company website copy, an 'about' page, or a job posting they published…" rows={6}
            style={{ width: "100%", background: "#080808", border: "1px solid #222", borderRadius: "6px", color: "#ccc", padding: "10px 12px", fontSize: "12px", lineHeight: 1.6, outline: "none", resize: "vertical", fontFamily: "inherit", marginBottom: "10px" }} />
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={handleScore} disabled={scanning || !coText.trim()} style={{ padding: "8px 18px", background: (scanning || !coText.trim()) ? "#151515" : "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", borderRadius: "6px", color: (scanning || !coText.trim()) ? "#444" : "#fff", fontSize: "12px", fontWeight: 700, cursor: (scanning || !coText.trim()) ? "default" : "pointer" }}>
              {scanning ? "Scoring…" : "Score fit-to-sell →"}
            </button>
            <span style={{ fontSize: "11px", color: "#444" }}>Scores ICP fit, picks the service to lead with, and tells you which title to find in Clay.</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", borderBottom: "1px solid #111", overflowX: "auto" }}>
        {[
          { label: "Prospects", value: stats.total, color: "#7c3aed" },
          { label: "Open pipeline", value: stats.open, color: "#4f46e5" },
          { label: "Engaged", value: stats.engaged, color: "#0891b2" },
          { label: "Won", value: stats.won, color: "#16a34a" },
          { label: "Pipeline value (low est.)", value: "$" + stats.pipelineValue.toLocaleString(), color: "#d97706" },
        ].map((s, i) => (
          <div key={i} style={{ flex: "1 0 110px", padding: "12px 16px", borderRight: "1px solid #111" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "9px", color: "#444", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "3px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{ background: "#0d0d0f", borderBottom: "1px solid #1a1a1a", padding: "10px 20px", display: "flex", gap: "16px", overflowX: "auto" }}>
          <span style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", alignSelf: "center", flexShrink: 0 }}>Upcoming</span>
          {upcoming.map(r => (
            <div key={r.id} onClick={() => setSelected(r)} style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "5px", padding: "5px 10px", cursor: "pointer", flexShrink: 0 }}>
              <span style={{ fontSize: "10px", color: "#7c3aed", fontWeight: 700, marginRight: "6px" }}>{r.nextDate}</span>
              <span style={{ fontSize: "11px", color: "#ccc" }}>{r.company}</span>
              {r.nextAction && <span style={{ fontSize: "10px", color: "#555", marginLeft: "6px" }}>— {r.nextAction.slice(0, 42)}{r.nextAction.length > 42 ? "…" : ""}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Main */}
      <div style={{ display: "flex", height: "calc(100vh - 210px)" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Filters */}
          <div style={{ padding: "12px 16px", display: "flex", gap: "8px", alignItems: "center", borderBottom: "1px solid #111", flexWrap: "wrap" }}>
            <input value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="Search company or industry…"
              style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "5px", color: "#f0f0f0", padding: "6px 10px", fontSize: "12px", outline: "none", width: "200px" }} />
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "5px", color: "#888", padding: "6px 10px", fontSize: "12px" }}>
              <option value="all">All stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ fontSize: "11px", color: "#444", marginLeft: "auto" }}>{filtered.length} prospect{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr 110px 70px 130px 90px", padding: "8px 16px", borderBottom: "1px solid #111", fontSize: "9px", color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <span>Company · Industry</span><span>Service · Deal</span><span>Stage</span><span>Fit</span><span>Buyer</span><span>Next</span>
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#333" }}>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>🎯</div>
              <div style={{ fontSize: "13px", color: "#444" }}>No prospects match.</div>
            </div>
          )}

          {filtered.map(r => (
            <div key={r.id} onClick={() => setSelected(r)}
              style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr 110px 70px 130px 90px", padding: "10px 16px", borderBottom: "1px solid #0f0f0f", cursor: "pointer", alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "#0f0f0f"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#e0e0e0", display: "flex", alignItems: "center", gap: "6px" }}>
                  {r.flagged && <span style={{ color: "#facc15" }}>★</span>}{r.company}
                  {r.clayEnriched && <span title="Clay enriched" style={{ fontSize: "9px", color: "#16a34a" }}>◆</span>}
                </div>
                <div style={{ fontSize: "11px", color: "#666", marginTop: "1px" }}>{r.industry}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#a78bfa" }}>{serviceName(r.service).replace(/ \(.*\)/, "")}</div>
                <div style={{ fontSize: "10px", color: "#4ade80" }}>{r.dealBand}</div>
              </div>
              <div><Badge label={r.stage} color={STAGE_COLORS[r.stage] || "#444"} /></div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: (r.icpScore || 0) >= 88 ? "#4ade80" : (r.icpScore ? "#facc15" : "#333") }}>{r.icpScore || "—"}</div>
              <div>
                <div style={{ fontSize: "11px", color: r.buyerName ? "#ccc" : "#444" }}>{r.buyerName || "—"}</div>
                <div style={{ fontSize: "10px", color: "#555" }}>{r.buyerTitle || ""}</div>
              </div>
              <div style={{ fontSize: "11px", color: r.nextDate ? "#7c3aed" : "#333" }}>{r.nextDate || "—"}</div>
            </div>
          ))}
        </div>

        {/* Activity log */}
        <div style={{ width: "220px", flexShrink: 0, borderLeft: "1px solid #111", overflowY: "auto", padding: "14px 12px" }}>
          <div style={{ fontSize: "9px", color: "#333", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Activity</div>
          {log.length === 0 && <div style={{ fontSize: "11px", color: "#2a2a2a" }}>No activity yet.</div>}
          {log.map((e, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "9px", color: "#333", marginBottom: "1px" }}>{e.time}</div>
              <div style={{ fontSize: "11px", lineHeight: 1.5, color: e.type === "success" ? "#4ade80" : e.type === "alert" ? "#facc15" : e.type === "error" ? "#f87171" : "#555" }}>{e.msg}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
