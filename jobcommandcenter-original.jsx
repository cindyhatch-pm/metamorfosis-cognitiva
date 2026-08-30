import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = ["Lead", "Applied", "Recruiter Screen", "Hiring Manager", "Portfolio Review", "Panel", "Final Round", "Offer", "Rejected", "Withdrawn"];
const STAGE_COLORS = {
  "Lead":             "#64748b",
  "Applied":          "#4f46e5",
  "Recruiter Screen": "#7c3aed",
  "Hiring Manager":   "#0891b2",
  "Portfolio Review": "#0284c7",
  "Panel":            "#059669",
  "Final Round":      "#d97706",
  "Offer":            "#16a34a",
  "Rejected":         "#dc2626",
  "Withdrawn":        "#6b7280",
};

const SOURCES = ["LinkedIn", "Greenhouse", "Lever", "Workday", "Indeed", "Company site", "Referral", "Recruiter outreach", "Other"];

// Live job board URLs — confirmed returning results June 2026
const JOB_BOARD_URLS = [
  { name: "Working in Content – Content Designer", url: "https://workingincontent.com/content-designer-jobs" },
  { name: "Working in Content – UX Writer",        url: "https://workingincontent.com/ux-writer-jobs" },
  { name: "Working in Content – Content Strategist", url: "https://workingincontent.com/content-strategist-jobs" },
  { name: "Working in Content – Remote",           url: "https://workingincontent.com/content-jobs-remote" },
  { name: "Fintech Design – WoodyJobs",            url: "https://www.woodyjobs.com/fintech" },
];

// Keywords that surface staff/senior-level roles (confirmed from live search)
const SCAN_KEYWORDS = [
  "Staff Content Designer",
  "Principal Content Designer",
  "Content Design Lead",
  "Lead Content Designer",
  "Staff UX Writer",
  "Senior UX Writer",
  "Staff UX Content Strategist",
  "Content Strategist III",
  "Lead Content Strategist",
  "UX Content Strategist",
  "Content Design Manager",
  "Head of Content Design",
];

// Companies confirmed active in content design hiring
const SEARCH_TARGETS = [
  { role: "Staff Content Designer",       company: "BetterUp",      url: "https://www.betterup.com/careers" },
  { role: "Staff Content Designer",       company: "Expedia Group",  url: "https://careers.expediagroup.com/jobs" },
  { role: "Staff UX Content Strategist",  company: "Adobe",          url: "https://adobe.wd5.myworkdayjobs.com/external_experienced" },
  { role: "Senior UX Writer",             company: "Google",         url: "https://careers.google.com/jobs" },
  { role: "Senior Content Designer",      company: "Peloton",        url: "https://www.onepeloton.com/careers" },
  { role: "Lead Content Designer",        company: "Skyscanner",     url: "https://www.skyscanner.net/jobs" },
  { role: "Content Strategist III",       company: "Aquent/Remote",  url: "https://aquent.com/find-work" },
  { role: "Lead UX Writer",              company: "Xapo Bank",      url: "https://www.xapobank.com/careers" },
  { role: "Principal Content Designer",   company: "Shopify",        url: "https://www.shopify.com/careers" },
  { role: "Staff UX Writer",             company: "Figma",          url: "https://www.figma.com/careers" },
];

const emptyApp = () => ({
  id: `app-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
  role: "",
  company: "",
  source: "LinkedIn",
  url: "",
  dateFound: new Date().toISOString().slice(0,10),
  dateApplied: "",
  howApplied: "Online portal",
  stage: "Applied",
  pointOfContact: "",
  contactEmail: "",
  contactLinkedIn: "",
  response: "No response",
  salaryRange: "",
  location: "",
  remote: "Hybrid",
  notes: "",
  stageHistory: [],
  nextDate: "",
  nextAction: "",
  matchScore: null,
  jdUrl: "",
  flagged: false,
});

// ─── Real applications from LinkedIn "Applied" list (July 2026) ───────────────
const SEED_APPS = [
  // ── NEW LEADS from UX Jobs Weekly 68th Ed. (Jul 19-24, verified live) ──
  { id:"lead-wise-aiassistant", role:"Principal AI Model Designer (applied as Content Designer, Wise Assistant)", company:"Wise", source:"Other", howApplied:"Online portal", url:"https://wise.jobs/job/principal-ai-content-designer-wise-assistant-in-london-jid-3613", dateFound:"2026-07-27", dateApplied:"2026-07-27", stage:"Recruiter Screen", response:"Interview scheduled", pointOfContact:"Inez Sayer", contactEmail:"inez.sayer@wise.com", contactLinkedIn:"", salaryRange:"", location:"London", remote:"On-site", notes:"BEST MATCH (98) → CALL BOOKED. Intro call w/ Inez to discuss experience + motivations. NOTE: title came through as 'Principal AI Model Designer' (vs Content Designer, Wise Assistant) — ask about this in the call. TO DO: (1) do a test transfer in Wise app to speak as a user, (2) study case study prep (voice/guardrails/error states/explaining money), (3) prep 'why Wise' + smart questions. AI records the call — leave it on. Inez rescheduled once (was unwell); handled warmly. She asked about relocation — open to it, logistics (dogs, guttysx visa/English) only matter if offer comes.", nextAction:"INTERVIEW BOOKED: Tue Sep 1, 6:15 AM (Guadalajara) / 1:15 PM London, 30 min w/ Inez via Google Meet. Do Wise test transfer + review prep doc.", nextDate:"2026-09-01", stageHistory:[{stage:"Lead",date:"2026-07-27"},{stage:"Applied",date:"2026-07-27"},{stage:"Recruiter Screen",date:"2026-07-29"}], matchScore:98, jdUrl:"", flagged:true },
  { id:"lead-moniepoint-cd", role:"Senior Content Designer", company:"Moniepoint", source:"Other", howApplied:"", url:"https://t.ly/DA3Kr", dateFound:"2026-08-30", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Spain", remote:"Remote", notes:"FRESH (Aug 28 list). African fintech expanding into Europe. Remote from Spain. Fintech + Spanish + remote + senior CD = strong alignment with your BBVA/Openpay background. Verify still live.", nextAction:"Check listing, apply if live", nextDate:"2026-09-03", stageHistory:[], matchScore:91, jdUrl:"", flagged:true },
  { id:"lead-accor-geo", role:"GEO, SEO & UX Senior Program Manager", company:"Accor", source:"Other", howApplied:"", url:"https://t.ly/YtXIn", dateFound:"2026-08-30", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"France", remote:"On-site", notes:"FRESH (Aug 28). GEO = Generative Engine Optimization — LITERALLY your consulting specialism, in a job title. Hospitality giant, France, your French is an advantage. Rare to see GEO named explicitly in a role. High strategic fit even if PgM-flavored.", nextAction:"Review JD — this is your AEO/GEO thesis as a paid role", nextDate:"2026-09-03", stageHistory:[], matchScore:89, jdUrl:"", flagged:true },
  { id:"lead-fidelity-pucs", role:"Principal UX Content Strategist", company:"Fidelity Investments", source:"Other", howApplied:"", url:"https://t.ly/d-I0d", dateFound:"2026-08-30", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"US", remote:"On-site", notes:"FRESH (Aug 7 list, verify). Principal-level + financial services = direct parallel to your USAA work. Same tier as the Wise role. Verify still live before applying.", nextAction:"Verify listing is live, then apply", nextDate:"2026-09-03", stageHistory:[], matchScore:88, jdUrl:"", flagged:true },
  { id:"lead-jpmc-convo", role:"UX Conversation Designer", company:"JPMorgan Chase", source:"Other", howApplied:"", url:"https://t.ly/mRAy6", dateFound:"2026-08-30", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"US", remote:"On-site", notes:"FRESH (Aug 28). Conversation design at a major bank — maps to your BBVA chatbot + AI guardrails work. Same skill family as the Wise Assistant role.", nextAction:"Review and apply", nextDate:"2026-09-04", stageHistory:[], matchScore:85, jdUrl:"", flagged:false },
  { id:"lead-marriott-uxw", role:"Digital UX Writing", company:"Marriott International", source:"Other", howApplied:"", url:"https://t.ly/tBYOM", dateFound:"2026-08-30", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"US", remote:"Remote", notes:"FRESH (Aug 28). Fully remote US. Travel/hospitality — adjacent to your Expedia competitive knowledge. Remote is the key draw here.", nextAction:"Review and apply", nextDate:"2026-09-04", stageHistory:[], matchScore:79, jdUrl:"", flagged:false },
  { id:"lead-nelixair-uxw", role:"UX Writer", company:"NELIXAIR", source:"Other", howApplied:"", url:"https://t.ly/fiV-T", dateFound:"2026-08-30", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"France", remote:"Remote", notes:"FRESH (Aug 28). French company, fully remote. Your French is a genuine differentiator here — very few UX writers offer FR + ES + EN + IT.", nextAction:"Review — French-language advantage", nextDate:"2026-09-04", stageHistory:[], matchScore:77, jdUrl:"", flagged:false },
  { id:"lead-ctaima-convo", role:"Conversation Designer", company:"CTAIMA", source:"Other", howApplied:"", url:"https://t.ly/cs8D1", dateFound:"2026-08-30", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Spain", remote:"On-site", notes:"FRESH (Aug 7 list, verify). Conversation design in Spain — Spanish-language conversational AI. Smaller company. Verify still live.", nextAction:"Verify listing", nextDate:"2026-09-05", stageHistory:[], matchScore:74, jdUrl:"", flagged:false },
  { id:"lead-tiktok-capcut", role:"AI Creator Operation & Partnership Manager - CapCut", company:"TikTok / ByteDance", source:"Recruiter outreach", howApplied:"LinkedIn message", url:"", dateFound:"2026-08-26", dateApplied:"", stage:"Lead", response:"Recruiter reached out", pointOfContact:"Woody Hu", contactEmail:"hujiacheng.svwn@bytedance.com", contactLinkedIn:"", salaryRange:"TBD — asked", location:"Mexico City", remote:"On-site", notes:"VERIFIED LEGIT: LinkedIn verified badge, @bytedance.com domain, real profile (Recruitment Specialist since Aug 2025, Chengdu), posts other TikTok roles. BUT scope is creator marketing/partnerships, NOT content design/IA. CDMX-based, full-time. Replied asking for comp range + location flexibility before sending resume. Don't let it distract from Wise prep.", nextAction:"Wait for Woody's reply on comp + location", nextDate:"2026-09-02", stageHistory:[{stage:"Lead",date:"2026-08-26"}], matchScore:62, jdUrl:"", flagged:false },
  { id:"app-sunrun-nexton", role:"Spanish Localization Copywriter", company:"Sunrun (via Nexton)", source:"Other", howApplied:"Nexton platform", url:"", dateFound:"2026-07-31", dateApplied:"2026-08-11", stage:"Recruiter Screen", response:"Interview done — negotiating", pointOfContact:"Álvaro Ipucha / Sofia Castro", contactEmail:"alvaro.ipucha@nexton.dev", contactLinkedIn:"", salaryRange:"Their budget: $280–600/mo for 40h. My rate: $60–75/hr", location:"LATAM remote", remote:"Remote", notes:"Interview passed (paired round w/ UX Designer + Spanish dev). BUDGET MISMATCH: their $280–600/mo for 40h = ~$7–15/hr vs my $60–75/hr. Countered with scoped proposal: work within $600/mo at 8–10 hrs, not 40. Also asked payment structure (MX-based, US client — invoice via Nexton or Sunrun?). Sofia offered to match me with other Nexton roles — asked for senior/lead UX content strategy + IA.", nextAction:"Wait for Álvaro on scoped proposal + payment structure", nextDate:"2026-09-02", stageHistory:[{stage:"Applied",date:"2026-07-31"},{stage:"Recruiter Screen",date:"2026-08-11"}], matchScore:68, jdUrl:"", flagged:false },
  { id:"lead-wise-fincrime", role:"Principal AI Content Designer, FinCrime", company:"Wise", source:"Other", howApplied:"Online portal", url:"https://wise.jobs/job/principal-ai-content-designer-fincrime-in-london-jid-3203", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"London", remote:"On-site", notes:"[STALE — sourced Jul 27, verify still live before applying] Second Wise Principal AI Content role. FinCrime = compliance-heavy content, your insurance/fintech governance background is a direct fit. Apply to both Wise roles.", nextAction:"Apply", nextDate:"2026-07-28", stageHistory:[], matchScore:96, jdUrl:"", flagged:true },
  { id:"lead-jpmc-ia", role:"Principal Information Architect – Metadata Thought Leadership", company:"JPMorgan Chase", source:"Other", howApplied:"Online portal", url:"https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210764987", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"London", remote:"On-site", notes:"[STALE — sourced Jul 27, verify still live before applying] Almost description-perfect for your BBVA taxonomy + metadata work at 60k+ employee scale. Principal-level IA, metadata thought leadership. Apply this week.", nextAction:"Apply — lead with BBVA metadata/taxonomy case study", nextDate:"2026-07-28", stageHistory:[], matchScore:95, jdUrl:"", flagged:true },
  { id:"lead-edreams-cdm", role:"Content Design Manager", company:"eDreams ODIGEO", source:"Other", howApplied:"Online portal", url:"https://odigeo.csod.com/ux/ats/careersite/2/home/requisition/2794", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Barcelona", remote:"Hybrid", notes:"[STALE — sourced Jul 27, verify still live before applying] Travel tech + Spanish + content design leadership. Your Expedia Group competitive knowledge maps directly. Barcelona hybrid — Spanish fluency is an advantage.", nextAction:"Apply", nextDate:"2026-07-29", stageHistory:[], matchScore:91, jdUrl:"", flagged:true },
  { id:"lead-gendigital-conv", role:"Staff AI Conversation Designer", company:"Gen Digital", source:"Other", howApplied:"Online portal", url:"https://jobs.ashbyhq.com/gen-digital/ff4bacfe-d62e-421d-a455-17408194d107", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"London", remote:"On-site", notes:"[STALE — sourced Jul 27, verify still live before applying] Staff-level conversation design (Norton/Avast parent). Chatbot + voice IA aligns with your BBVA chatbot + Skydropx flows work.", nextAction:"Apply", nextDate:"2026-07-29", stageHistory:[], matchScore:88, jdUrl:"", flagged:false },
  { id:"lead-hubspot-aipd", role:"Staff AI Product Designer", company:"HubSpot", source:"Other", howApplied:"Online portal", url:"https://job-boards.greenhouse.io/hs/jobs/8022335", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Remote US", remote:"Remote", notes:"[STALE — sourced Jul 27, verify still live before applying] Was on your original consulting target list. Staff AI product design, remote US. Content-adjacent but design-heavy — assess fit against your IC strengths.", nextAction:"Review JD, decide apply vs consulting pitch", nextDate:"2026-07-30", stageHistory:[], matchScore:83, jdUrl:"", flagged:false },
  { id:"lead-solace-uxw", role:"UX Writer", company:"Solace", source:"Other", howApplied:"Online portal", url:"https://jobs.ashbyhq.com/solace/1f3c0997-899c-432d-8bd3-b2b9771866b8", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Remote US", remote:"Remote", notes:"[STALE — sourced Jul 27, verify still live before applying] Fully remote US UX writer. Healthcare navigation platform — your insurance content background transfers well.", nextAction:"Apply", nextDate:"2026-07-30", stageHistory:[], matchScore:82, jdUrl:"", flagged:false },
  { id:"lead-jpmc-cdsa", role:"Content Design Senior Associate", company:"JPMorgan Chase", source:"Other", howApplied:"Online portal", url:"https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job/210733785", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"New York, NY", remote:"On-site", notes:"[STALE — sourced Jul 27, verify still live before applying] Content design at JPMorgan — fintech, enterprise governance. Senior Associate maps to your level. Second JPMC role worth pursuing alongside the IA one.", nextAction:"Apply", nextDate:"2026-07-30", stageHistory:[], matchScore:84, jdUrl:"", flagged:false },
  { id:"lead-capitalone-cd", role:"Manager, Content Design", company:"Capital One", source:"Other", howApplied:"Online portal", url:"https://capitalone.wd12.myworkdayjobs.com/Capital_One/job/Richmond-VA/Manager--Content-Design_R247301-1", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Richmond, VA", remote:"On-site", notes:"[STALE — sourced Jul 27, verify still live before applying] Content design management at a major fintech. Your USAA financial services background is directly relevant.", nextAction:"Apply or note for reference", nextDate:"2026-07-31", stageHistory:[], matchScore:80, jdUrl:"", flagged:false },
  { id:"lead-justworks-cd", role:"Content Designer", company:"Justworks", source:"Other", howApplied:"Online portal", url:"https://boards.greenhouse.io/justworks/jobs/8071375", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"New York, NY", remote:"On-site", notes:"[STALE — sourced Jul 27, verify still live before applying] Two content designer openings at Justworks (HR/payroll SaaS). SaaS content systems — good fit, though NYC on-site may be a constraint.", nextAction:"Apply if open to relocation/remote negotiation", nextDate:"2026-07-31", stageHistory:[], matchScore:78, jdUrl:"", flagged:false },
  { id:"lead-edreams-espd", role:"Senior Product Designer", company:"eDreams ODIGEO", source:"Other", howApplied:"Online portal", url:"https://odigeo.csod.com/ux/ats/careersite/2/home/requisition/2283", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Barcelona", remote:"On-site", notes:"[STALE — sourced Jul 27, verify still live before applying] Same company as the Content Design Manager role — travel tech Barcelona. Product design leaning, assess against content focus.", nextAction:"Prioritize the Content Design Manager role over this", nextDate:"2026-08-01", stageHistory:[], matchScore:76, jdUrl:"", flagged:false },
  { id:"lead-slalom-latam", role:"Experience Design Director, CX Latin America", company:"Slalom", source:"Other", howApplied:"Online portal", url:"https://jobs.slalom.com/en_US/careersmarketplace/JobDetail/Experience-Design-Director-CX-Latin-America/2426", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Latin America", remote:"Remote", notes:"[STALE — sourced Jul 27, verify still live before applying] Director-level CX for LATAM, fully remote. Consulting firm — could bridge your consulting ambition with a stable role. Spanish/bilingual is central here.", nextAction:"Apply — strong LATAM + seniority + remote fit", nextDate:"2026-07-29", stageHistory:[], matchScore:85, jdUrl:"", flagged:true },
  { id:"lead-coupang-cs", role:"Senior Content Strategist (Core UX)", company:"Coupang", source:"Other", howApplied:"Online portal", url:"https://coupang.jobs/en/jobs?gh_jid=8068623", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Seoul", remote:"On-site", notes:"[STALE — sourced Jul 27, verify still live before applying] Content strategy at a major ecommerce platform. Your ecommerce (Coppel/Skydropx) background fits, but Seoul on-site is a hard constraint.", nextAction:"Only if open to relocation", nextDate:"2026-08-01", stageHistory:[], matchScore:75, jdUrl:"", flagged:false },
  { id:"lead-apple-uxw", role:"UX Writer, Systems", company:"Apple", source:"Other", howApplied:"Online portal", url:"https://jobs.apple.com/en-us/details/200672377-0836/ux-writer-systems", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Cupertino, CA", remote:"On-site", notes:"[STALE — sourced Jul 27, verify still live before applying] UX Writer for systems at Apple — content systems focus matches your strength. Cupertino on-site. High bar, prestige role.", nextAction:"Apply if open to relocation", nextDate:"2026-08-01", stageHistory:[], matchScore:79, jdUrl:"", flagged:false },
  { id:"lead-autodesk-conv", role:"Senior Conversational Designer (Canada Remote)", company:"Autodesk", source:"Other", howApplied:"Online portal", url:"https://autodesk.wd1.myworkdayjobs.com/en-US/Ext/job/Ontario-CAN---Remote/Senior-Conversational-Designer--Canada---Remote-_26WD99913", dateFound:"2026-07-27", dateApplied:"", stage:"Lead", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Canada", remote:"Remote", notes:"[STALE — sourced Jul 27, verify still live before applying] Conversational design, remote Canada. Chatbot/voice content — aligns with your AI conversational work. May require Canada work authorization.", nextAction:"Check work-authorization requirement before applying", nextDate:"2026-08-01", stageHistory:[], matchScore:77, jdUrl:"", flagged:false },
  // ── ACTIVE APPLICATIONS ──
  { id:"app-arrow-001", role:"Sr. Web Content Strategy & Governance Specialist (R246478)", company:"Arrow Electronics", source:"LinkedIn", howApplied:"Online portal", url:"", dateFound:"2026-07-22", dateApplied:"2026-07-22", stage:"Rejected", response:"Rejected — moved forward with other candidates", pointOfContact:"Fernando", contactEmail:"arrow@myworkday.com", contactLinkedIn:"", salaryRange:"$91k–$100k MXN/month", location:"Tlaquepaque, JAL", remote:"Hybrid", notes:"Rejected Jul 29 — after screen + preliminary questions. Note said other Arrow applications unaffected (there were none). Local hybrid role that would've been double your $50k target — but Wise is the real priority now anyway. No regret here.", nextAction:"None — let it go, energy goes to Wise", nextDate:"", stageHistory:[{stage:"Applied",date:"2026-07-22"},{stage:"Recruiter Screen",date:"2026-07-25"},{stage:"Rejected",date:"2026-07-29"}], matchScore:88, jdUrl:"", flagged:false },
  { id:"app-ltm-001", role:"Senior Technical Product Manager – AI & Content Intelligence", company:"LTM (undisclosed media client)", source:"Recruiter outreach", howApplied:"Email", url:"", dateFound:"2026-07-24", dateApplied:"2026-07-24", stage:"Recruiter Screen", response:"Recruiter reached out", pointOfContact:"Diego Brito Llamas", contactEmail:"Diego.Llamas@ltm.com", contactLinkedIn:"", salaryRange:"$9,000 USD/month (asked)", location:"Cuauhtémoc, CMX", remote:"Hybrid", notes:"Screening questions answered Jul 24. No formal PM title flagged honestly. Anchored at $9k/month — don't let that become the ceiling. Find out who the undisclosed client is.", nextAction:"Follow up if no reply by Aug 1", nextDate:"2026-08-01", stageHistory:[{stage:"Applied",date:"2026-07-24"},{stage:"Recruiter Screen",date:"2026-07-24"}], matchScore:84, jdUrl:"", flagged:true },
  { id:"app-blink-001", role:"Content Strategist (AI Readiness)", company:"Blink UX", source:"Other", howApplied:"Online portal", url:"https://workingincontent.com/jobs/blink-content-strategist-ai-readiness-17e740", dateFound:"2026-07-21", dateApplied:"2026-07-21", stage:"Rejected", response:"Rejected — moved forward with other candidates", pointOfContact:"", contactEmail:"recruiting@blinkux.com", contactLinkedIn:"", salaryRange:"$70–$100/hr", location:"Remote", remote:"Remote", notes:"Rejected Jul 27 — competitive pool. Standard 'apply again' close, not a door slam. The demand for AI Readiness content strategy confirms your consulting thesis is real. Consider pitching companies with this same need directly as a consultant.", nextAction:"Redirect energy — pitch AI-readiness consulting to a fitting company", nextDate:"", stageHistory:[{stage:"Applied",date:"2026-07-21"},{stage:"Rejected",date:"2026-07-27"}], matchScore:97, jdUrl:"", flagged:false },
  { id:"app-equalstrue-001", role:"Senior Designer", company:"EqualsTrue", source:"LinkedIn", howApplied:"Online portal", url:"", dateFound:"2026-07-20", dateApplied:"2026-07-20", stage:"Rejected", response:"Rejected — warm, keep in touch", pointOfContact:"Vero Priego", contactEmail:"vpriego@equalstrue.team", contactLinkedIn:"", salaryRange:"", location:"Remote", remote:"Remote", notes:"Warm rejection — recruiter offered to keep in touch for future roles. Worth a 2-line thank-you to keep the door open. Another screen-heavy design role that clashed with the life design anyway.", nextAction:"Send brief warm thank-you to Vero to keep relationship", nextDate:"", stageHistory:[{stage:"Applied",date:"2026-07-20"},{stage:"Rejected",date:"2026-07-28"}], matchScore:70, jdUrl:"", flagged:false },
  { id:"app-netflix-001", role:"Staff Systems Designer, Language", company:"Netflix", source:"Company site", howApplied:"Online portal", url:"", dateFound:"2026-07-21", dateApplied:"2026-07-21", stage:"Applied", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"United States", remote:"Remote", notes:"Language specialization = localization + multilingual IA. BBVA multi-market + bilingual profile is a direct match. Top priority if they call.", nextAction:"Research Netflix Language design team", nextDate:"2026-08-07", stageHistory:[{stage:"Applied",date:"2026-07-21"}], matchScore:95, jdUrl:"", flagged:true },
  { id:"app-anthropic-001", role:"Copy Lead, Claude", company:"Anthropic", source:"Company site", howApplied:"Online portal", url:"", dateFound:"2026-07-21", dateApplied:"2026-07-21", stage:"Applied", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"New York, NY", remote:"Hybrid", notes:"High volume disclaimer is standard. Copy Lead for Claude = voice and content standards for the AI product you use daily. Intimate product knowledge is a differentiator.", nextAction:"Wait — no follow-up possible", nextDate:"2026-08-14", stageHistory:[{stage:"Applied",date:"2026-07-21"}], matchScore:93, jdUrl:"", flagged:false },
  { id:"app-openai-001", role:"Executive Programs Narrative Lead", company:"OpenAI", source:"Company site", howApplied:"Online portal", url:"", dateFound:"2026-07-21", dateApplied:"2026-07-21", stage:"Applied", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"San Francisco, CA", remote:"Hybrid", notes:"OpenAI also considers you for similar roles automatically. Executive Programs = strategic narrative at C-suite level. Check careers page for other open roles.", nextAction:"Check OpenAI careers for similar roles", nextDate:"2026-08-14", stageHistory:[{stage:"Applied",date:"2026-07-21"}], matchScore:87, jdUrl:"", flagged:false },
  { id:"app-moderntreas-001", role:"AI Search and Discovery Lead", company:"Modern Treasury", source:"LinkedIn", howApplied:"Online portal", url:"", dateFound:"2026-07-22", dateApplied:"2026-07-22", stage:"Applied", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"San Francisco, CA", remote:"Remote", notes:"Fintech payments. AI Search + Discovery = semantic search, content intelligence, IA — your BBVA taxonomy + search work is directly relevant.", nextAction:"Research Modern Treasury product + team", nextDate:"2026-08-07", stageHistory:[{stage:"Applied",date:"2026-07-22"}], matchScore:88, jdUrl:"", flagged:false },
  { id:"app-rmg-001", role:"Content Designer", company:"rmg digital", source:"Other", howApplied:"Online portal", url:"https://workingincontent.com/jobs/rmg-digital-content-designer-dabf5c", dateFound:"2026-07-22", dateApplied:"2026-07-22", stage:"Applied", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"£500/day", location:"England, UK", remote:"Remote", notes:"Strong day rate. Digital agency — varied client work. Good consulting transition role.", nextAction:"Follow up if no response by Aug 1", nextDate:"2026-08-01", stageHistory:[{stage:"Applied",date:"2026-07-22"}], matchScore:85, jdUrl:"", flagged:false },
  { id:"app-epam-001", role:"UX Content Strategist / Content Designer", company:"EPAM Systems", source:"LinkedIn", howApplied:"Online portal", url:"", dateFound:"2026-07-18", dateApplied:"2026-07-18", stage:"Applied", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Mexico", remote:"Remote", notes:"Resume downloaded 1 week ago — active signal. EPAM embeds at client sites — ask who the end client is before accepting.", nextAction:"Wait — resume downloaded is a good sign", nextDate:"2026-08-01", stageHistory:[{stage:"Applied",date:"2026-07-18"}], matchScore:82, jdUrl:"", flagged:false },
  { id:"app-epam-002", role:"Lead UX Technical Designer", company:"EPAM Systems", source:"Company site", howApplied:"Online portal", url:"", dateFound:"2026-07-22", dateApplied:"2026-07-22", stage:"Applied", response:"Automated rejection", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Mexico", remote:"Remote", notes:"EPAM flagged duplicate — first application (UX Content Strategist) already under review. Both handled together.", nextAction:"Monitor first EPAM application", nextDate:"2026-08-01", stageHistory:[{stage:"Applied",date:"2026-07-22"}], matchScore:79, jdUrl:"", flagged:false },
  { id:"app-jobgether-001", role:"Content Strategist, Knowledge Architecture", company:"Unknown (via Jobgether)", source:"Other", howApplied:"Online portal", url:"", dateFound:"2026-07-22", dateApplied:"2026-07-22", stage:"Applied", response:"Automated rejection", pointOfContact:"", contactEmail:"support@jobgether.com", contactLinkedIn:"", salaryRange:"", location:"United States", remote:"Remote", notes:"Match score report available on Jobgether — check it for gap analysis. Find the actual employer — not surfaced in confirmation.", nextAction:"Log into Jobgether + check Match Feedback Report", nextDate:"2026-07-28", stageHistory:[{stage:"Applied",date:"2026-07-22"}], matchScore:86, jdUrl:"", flagged:false },
  { id:"app-agm-001", role:"AI Conversational Designer", company:"AGM Tech Solutions", source:"LinkedIn", howApplied:"Online portal", url:"", dateFound:"2026-07-22", dateApplied:"2026-07-22", stage:"Applied", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Alpharetta, GA", remote:"Hybrid", notes:"Woman and Latina-owned IT staffing firm, Inc. 5000. Conversational design = chatbot/voice IA, aligns with BBVA chatbot + Skydropx work.", nextAction:"Follow up if no response by Aug 1", nextDate:"2026-08-01", stageHistory:[{stage:"Applied",date:"2026-07-22"}], matchScore:81, jdUrl:"", flagged:false },
  { id:"app-kforce-001", role:"Content Audit & Content Optimization", company:"Kforce Inc", source:"LinkedIn", howApplied:"Online portal", url:"", dateFound:"2026-07-22", dateApplied:"2026-07-22", stage:"Applied", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Draper, UT", remote:"Remote", notes:"Staffing agency. Content audit + optimization = your core strength. Ask who the end client is if they call.", nextAction:"Wait for recruiter contact", nextDate:"2026-08-07", stageHistory:[{stage:"Applied",date:"2026-07-22"}], matchScore:78, jdUrl:"", flagged:false },
  { id:"app-alignerr-001", role:"AI Policy, Ethics & Compliance Analyst", company:"Alignerr", source:"Company site", howApplied:"Online portal", url:"", dateFound:"2026-07-21", dateApplied:"2026-07-21", stage:"Applied", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Mexico", remote:"Remote", notes:"AI policy + ethics + compliance — adjacent to your AEO/GEO consulting angle. Content governance skills transfer.", nextAction:"Research Alignerr", nextDate:"2026-08-07", stageHistory:[{stage:"Applied",date:"2026-07-21"}], matchScore:75, jdUrl:"", flagged:false },
  { id:"app-sincero-001", role:"Instructor(a) de Inteligencia Artificial", company:"Sincero Consulting", source:"LinkedIn", howApplied:"Online portal", url:"", dateFound:"2026-07-22", dateApplied:"2026-07-22", stage:"Applied", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Mexico City", remote:"On-site", notes:"Resume downloaded 3 days ago — active signal. AI instructor = your writing coaching + AI governance background. On-site CDMX may be a constraint.", nextAction:"Clarify remote options if they contact you", nextDate:"2026-08-01", stageHistory:[{stage:"Applied",date:"2026-07-22"}], matchScore:74, jdUrl:"", flagged:false },
  { id:"app-meaningful-001", role:"Growth Marketing Manager", company:"Meaningful | m8l.com", source:"Company site", howApplied:"Online portal", url:"https://supervisible.com", dateFound:"2026-07-17", dateApplied:"2026-07-17", stage:"Recruiter Screen", response:"Video sent — viewed, no reply yet", pointOfContact:"Aidan Sebastian Wilson", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Mexico City", remote:"Remote", notes:"PORTFOLIO PIECE — already banked regardless of outcome. Sent Loom analyzing supervisible.com (Mon). Aidan viewed it Monday (confirmed via TikTok view). 5 business days passed, no response yet — normal silence, not a signal. Sent a light, warm follow-up.", nextAction:"Sent follow-up — now wait, no more chasing", nextDate:"2026-08-06", stageHistory:[{stage:"Applied",date:"2026-07-17"},{stage:"Recruiter Screen",date:"2026-07-29"}], matchScore:72, jdUrl:"", flagged:false },
  { id:"app-talenthackers-001", role:"AI Operations Analyst", company:"Talent Hackers", source:"Company site", howApplied:"Online portal", url:"", dateFound:"2026-06-27", dateApplied:"2026-06-27", stage:"Applied", response:"No response", pointOfContact:"", contactEmail:"", contactLinkedIn:"", salaryRange:"", location:"Mexico", remote:"Remote", notes:"Applied 4 weeks ago — oldest in pipeline. No response. Consider archiving or one direct follow-up.", nextAction:"Archive or send one follow-up", nextDate:"2026-07-28", stageHistory:[{stage:"Applied",date:"2026-06-27"}], matchScore:70, jdUrl:"", flagged:false },
];

// ─── Persistent storage helpers ───────────────────────────────────────────────

async function loadApps() {
  try {
    const r = await window.storage.get("cindy-job-apps");
    return r ? JSON.parse(r.value) : [];
  } catch { return []; }
}

async function saveApps(apps) {
  try {
    await window.storage.set("cindy-job-apps", JSON.stringify(apps));
  } catch (e) { console.error("Save failed", e); }
}

async function loadLog() {
  try {
    const r = await window.storage.get("cindy-scan-log");
    return r ? JSON.parse(r.value) : [];
  } catch { return []; }
}

async function saveLog(log) {
  try {
    await window.storage.set("cindy-scan-log", JSON.stringify(log.slice(0, 100)));
  } catch {}
}

// ─── Real job data from live sources (verified June 19, 2026) ─────────────────
// These are pulled from confirmed live job boards: workingincontent.com, woodyjobs.com,
// indeed.com, ziprecruiter.com — searched and verified before embedding here.

// Source: https://workingincontent.com/content-jobs-remote--salary-transparency
// Fetched: July 21, 2026 — 29 live listings, 8 posted today
const LIVE_JOB_FEED = [
  {
    company: "Blink",
    role: "Content Strategist (AI Readiness)",
    url: "https://workingincontent.com/jobs/blink-content-strategist-ai-readiness-17e740",
    source: "Working in Content",
    salaryRange: "$70–$100/hr",
    location: "Remote",
    remote: "Remote",
    postedDate: "Jul 17, 2026",
    isVerified: true,
    matchScore: 97,
    notes: "AI Readiness content strategy — this is literally your consulting positioning (AEO/GEO). Could be a contract engagement OR a consulting entry point. Highest priority on this list.",
  },
  {
    company: "rmg digital",
    role: "Content Designer",
    url: "https://workingincontent.com/jobs/rmg-digital-content-designer-dabf5c",
    source: "Working in Content",
    salaryRange: "£500/day",
    location: "Remote",
    remote: "Remote",
    postedDate: "Jul 15, 2026",
    isVerified: true,
    matchScore: 88,
    notes: "Strong day rate for a content designer contract. Digital agency — likely varied client work across industries. Good fit for consulting transition.",
  },
  {
    company: "Mondo",
    role: "Senior Content Designer",
    url: "https://workingincontent.com/jobs/mondo-senior-content-designer-e0026e",
    source: "Working in Content",
    salaryRange: "$64–$69/hr",
    location: "Remote",
    remote: "Remote",
    postedDate: "Jul 3, 2026",
    isVerified: true,
    matchScore: 85,
    notes: "Staffing agency placing senior content designers. Contract remote — good income bridge while consulting pipeline builds. Apply fast, Mondo fills quickly.",
  },
  {
    company: "AudienceView",
    role: "Senior Content Strategist",
    url: "https://workingincontent.com/jobs/audienceview-senior-content-strategist-9cbeab",
    source: "Working in Content",
    salaryRange: "$90k–$115k/yr",
    location: "Remote",
    remote: "Remote",
    postedDate: "Jul 11, 2026",
    isVerified: true,
    matchScore: 82,
    notes: "Posted twice (Jul 4 + Jul 11) — they're struggling to fill it. Ticketing/events tech. Salary below your target but FTE with stability.",
  },
  {
    company: "CRAE GROUP",
    role: "UX Writer & Content Manager",
    url: "https://workingincontent.com/jobs/crae-group-ux-writer-content-manager-375c01",
    source: "Working in Content",
    salaryRange: "€35k–€70k/yr",
    location: "Remote",
    remote: "Remote",
    postedDate: "Jul 1, 2026",
    isVerified: true,
    matchScore: 80,
    notes: "European company, UX writing + content management combined role. Wide salary band suggests room to negotiate. French or Italian could be a differentiator here.",
  },
  {
    company: "RECRUITERS",
    role: "AI Content Operations Strategist",
    url: "https://workingincontent.com/jobs/recruiters-ai-content-operations-strategist-b2f3b4",
    source: "Working in Content",
    salaryRange: "€71k+/yr",
    location: "Remote",
    remote: "Remote",
    postedDate: "Jul 20, 2026",
    isVerified: true,
    matchScore: 83,
    notes: "Posted yesterday. AI content operations aligns with your GEO/AEO expertise. European contract, strong alignment with where content strategy is heading.",
  },
  {
    company: "Stoke",
    role: "Senior Content Strategist & Writer",
    url: "https://workingincontent.com/jobs/stoke-senior-content-strategist-writer-0c280e",
    source: "Working in Content",
    salaryRange: "$80/hr",
    location: "Remote",
    remote: "Remote",
    postedDate: "Jun 23, 2026",
    isVerified: true,
    matchScore: 79,
    notes: "Good hourly rate, content strategy + writing combined. Contract. Worth applying as pipeline filler.",
  },
  {
    company: "TEKsystems",
    role: "UX Content Writer",
    url: "https://workingincontent.com/jobs/teksystems-ux-content-writer-3e9af5",
    source: "Working in Content",
    salaryRange: "$30–$40/hr",
    location: "Remote",
    remote: "Remote",
    postedDate: "Jul 3, 2026",
    isVerified: true,
    matchScore: 72,
    notes: "Lower rate than your target but TEKsystems is a major staffing firm — good relationship to build for future higher-rate placements.",
  },
];

// ─── AI scan: scores and ranks live feed against Cindy's profile ──────────────

// Score a pasted job description against Cindy's profile
async function scoreJobDescription(jdText) {
  const prompt = `You are evaluating a job listing for Cindy Hatch: content strategist and information architect, 10+ years, content governance, taxonomy, IA, AI content operations (prompt libraries, guardrails, review loops). Fintech/enterprise background (BBVA, USAA). Bilingual EN/ES plus French and Italian. Based in Guadalajara MX. Targeting Staff/Principal/Lead IC roles. Wants remote or well-justified relocation. Physical constraint: limited screen hours, avoid roles that are pure high-volume production work.

Job description:
"""
${jdText.slice(0, 6000)}
"""

Return ONLY a JSON object, no markdown:
{
  "role": "exact job title",
  "company": "company name",
  "location": "city/country",
  "remote": "Remote" | "Hybrid" | "On-site",
  "salaryRange": "if stated, else empty string",
  "matchScore": number 40-99,
  "notes": "2-3 sentences: why it fits or doesn't, specific to her background. Name any red flags (level mismatch, production-heavy, location).",
  "nextAction": "concrete next step"
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

// Live job boards — I refresh the tracker data; these are for browsing yourself
const JOB_BOARDS = [
  { name: "Astrolabium UX Jobs", url: "https://astrolabium.substack.com/", note: "700+ jobs weekly, Fridays" },
  { name: "UX Jobs Weekly", url: "https://uxjobs.substack.com/", note: "Curated, direct ATS links" },
  { name: "Working in Content", url: "https://workingincontent.com/content-jobs-remote--salary-transparency", note: "Content roles w/ salary" },
  { name: "UX Content Collective", url: "https://uxcontent.com/jobs/", note: "Content design specific" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

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
          color: "#f0f0f0", padding: "7px 10px", fontSize: "12px", outline: "none",
          width: "100%",
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
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Review Modal (approve before applying) ───────────────────────────────────

function ReviewModal({ job, onApprove, onDismiss, onEdit }) {
  const [draft, setDraft] = useState({ ...job });
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "16px",
    }}>
      <div style={{
        background: "#111", border: "1px solid #333", borderRadius: "10px",
        width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #1e1e1e",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "2px" }}>
              ⚡ NEW ROLE FOUND — REVIEW BEFORE APPLYING
            </div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#f0f0f0" }}>{draft.role}</div>
            <div style={{ fontSize: "13px", color: "#888" }}>{draft.company} · {draft.location}</div>
            <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
              {draft.isVerified
                ? <Badge label="✓ Verified live" color="#16a34a" />
                : <Badge label="⚠ Unverified — check URL" color="#d97706" />}
              {draft.postedDate && <Badge label={`Posted ${draft.postedDate}`} color="#555" />}
              {draft.remote && <Badge label={draft.remote} color="#4f46e5" />}
            </div>
          </div>
          {draft.matchScore && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: draft.matchScore >= 90 ? "#4ade80" : "#facc15" }}>
                {draft.matchScore}
              </div>
              <div style={{ fontSize: "9px", color: "#555" }}>MATCH</div>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {draft.notes && (
            <div style={{
              background: "#0d1f0d", border: "1px solid #1a3a1a", borderRadius: "6px",
              padding: "10px 12px", fontSize: "12px", color: "#86efac", lineHeight: 1.6,
            }}>
              💡 {draft.notes}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Role title" value={draft.role} onChange={v => set("role", v)} />
            <Input label="Company" value={draft.company} onChange={v => set("company", v)} />
            <Input label="Salary range" value={draft.salaryRange} onChange={v => set("salaryRange", v)} />
            <Select label="Remote" value={draft.remote} onChange={v => set("remote", v)} options={["Remote", "Hybrid", "On-site"]} />
            <Select label="Source" value={draft.source} onChange={v => set("source", v)} options={SOURCES} />
            <Input label="Job URL" value={draft.url} onChange={v => set("url", v)} placeholder="https://..." />
            <Input label="Point of contact" value={draft.pointOfContact} onChange={v => set("pointOfContact", v)} placeholder="Name / recruiter" />
            <Input label="Contact email" value={draft.contactEmail} onChange={v => set("contactEmail", v)} placeholder="name@company.com" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</label>
            <textarea
              value={draft.notes} onChange={e => set("notes", e.target.value)}
              rows={2}
              style={{
                background: "#111", border: "1px solid #2a2a2a", borderRadius: "5px",
                color: "#f0f0f0", padding: "7px 10px", fontSize: "12px",
                outline: "none", resize: "vertical", width: "100%",
              }}
            />
          </div>

          {draft.url && (
            <a href={draft.url} target="_blank" rel="noopener noreferrer" style={{
              display: "block", textAlign: "center", padding: "8px",
              background: "#1a1a1a", border: "1px solid #333", borderRadius: "5px",
              color: "#888", fontSize: "11px", textDecoration: "none",
            }}>
              🔗 Open job posting to verify →
            </a>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: "14px 20px", borderTop: "1px solid #1e1e1e",
          display: "flex", gap: "8px", justifyContent: "flex-end",
        }}>
          <button onClick={onDismiss} style={{
            padding: "8px 16px", background: "transparent",
            border: "1px solid #333", borderRadius: "6px",
            color: "#666", fontSize: "12px", cursor: "pointer",
          }}>Skip this role</button>
          <button onClick={() => onApprove(draft)} style={{
            padding: "8px 20px",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            border: "none", borderRadius: "6px",
            color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer",
          }}>✓ Approve & log application</button>
        </div>
      </div>
    </div>
  );
}

// ─── Application detail drawer ────────────────────────────────────────────────

function AppDrawer({ app, onSave, onClose, onDelete }) {
  const [draft, setDraft] = useState({ ...app });
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const [dirty, setDirty] = useState(false);

  const update = (k, v) => { set(k, v); setDirty(true); };

  const changeStage = (newStage) => {
    const history = [...(draft.stageHistory || []), {
      stage: newStage,
      date: new Date().toISOString().slice(0,10),
    }];
    setDraft(d => ({ ...d, stage: newStage, stageHistory: history }));
    setDirty(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", justifyContent: "flex-end", zIndex: 900,
    }}>
      <div style={{
        background: "#0d0d0d", borderLeft: "1px solid #222",
        width: "100%", maxWidth: "480px", height: "100%",
        overflowY: "auto", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e1e" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#f0f0f0" }}>{draft.role}</div>
              <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{draft.company}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: "18px", cursor: "pointer" }}>✕</button>
          </div>
          {/* Stage pills */}
          <div style={{ display: "flex", gap: "6px", marginTop: "12px", flexWrap: "wrap" }}>
            {STAGES.map(s => (
              <button key={s} onClick={() => changeStage(s)} style={{
                padding: "3px 9px", fontSize: "10px", fontWeight: 700,
                borderRadius: "4px", cursor: "pointer", border: "none",
                background: draft.stage === s ? STAGE_COLORS[s] : "#1a1a1a",
                color: draft.stage === s ? "#fff" : "#555",
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          {/* Core info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Role" value={draft.role} onChange={v => update("role", v)} />
            <Input label="Company" value={draft.company} onChange={v => update("company", v)} />
            <Select label="Source" value={draft.source} onChange={v => update("source", v)} options={SOURCES} />
            <Select label="How applied" value={draft.howApplied} onChange={v => update("howApplied", v)}
              options={["Online portal", "LinkedIn Easy Apply", "Email", "Referral", "Recruiter", "Other"]} />
            <Input label="Date found" value={draft.dateFound} onChange={v => update("dateFound", v)} type="date" />
            <Input label="Date applied" value={draft.dateApplied} onChange={v => update("dateApplied", v)} type="date" />
            <Input label="Salary range" value={draft.salaryRange} onChange={v => update("salaryRange", v)} placeholder="$140k–$180k" />
            <Input label="Location" value={draft.location} onChange={v => update("location", v)} placeholder="Seattle / Remote" />
          </div>

          {/* Response */}
          <Select label="Response received" value={draft.response} onChange={v => update("response", v)}
            options={["No response", "Automated rejection", "Recruiter reached out", "Interview scheduled", "Offer received"]} />

          {/* Contact */}
          <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "12px" }}>
            <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Point of contact</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Input label="Name" value={draft.pointOfContact} onChange={v => update("pointOfContact", v)} placeholder="Recruiter / HM name" />
              <Input label="Email" value={draft.contactEmail} onChange={v => update("contactEmail", v)} placeholder="name@company.com" />
              <Input label="LinkedIn" value={draft.contactLinkedIn} onChange={v => update("contactLinkedIn", v)} placeholder="linkedin.com/in/..." />
            </div>
          </div>

          {/* Next action */}
          <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "12px" }}>
            <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Next step</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Input label="Date" value={draft.nextDate} onChange={v => update("nextDate", v)} type="date" />
              <Input label="Action" value={draft.nextAction} onChange={v => update("nextAction", v)} placeholder="Send portfolio, prep case study..." />
            </div>
          </div>

          {/* Stage history */}
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
            <textarea
              value={draft.notes} onChange={e => { update("notes", e.target.value); }}
              rows={4} placeholder="Interview prep notes, feedback, next steps, salary negotiation thoughts..."
              style={{
                marginTop: "6px", background: "#111", border: "1px solid #2a2a2a",
                borderRadius: "5px", color: "#f0f0f0", padding: "8px 10px",
                fontSize: "12px", outline: "none", resize: "vertical", width: "100%",
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Job URL */}
          <Input label="Job posting URL" value={draft.url} onChange={v => update("url", v)} placeholder="https://..." />
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px", borderTop: "1px solid #1e1e1e",
          display: "flex", gap: "8px", justifyContent: "space-between",
        }}>
          <button onClick={() => onDelete(app.id)} style={{
            padding: "7px 12px", background: "transparent",
            border: "1px solid #3a1a1a", borderRadius: "5px",
            color: "#f87171", fontSize: "11px", cursor: "pointer",
          }}>Delete</button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onClose} style={{
              padding: "7px 14px", background: "transparent",
              border: "1px solid #2a2a2a", borderRadius: "5px",
              color: "#666", fontSize: "12px", cursor: "pointer",
            }}>Cancel</button>
            <button onClick={() => { onSave(draft); setDirty(false); }} disabled={!dirty} style={{
              padding: "7px 16px",
              background: dirty ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "#1a1a1a",
              border: "none", borderRadius: "5px",
              color: dirty ? "#fff" : "#444", fontSize: "12px", fontWeight: 700, cursor: dirty ? "pointer" : "default",
            }}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main app ─────────────────────────────────────────────────────────────────

export default function JobCommandCenter() {
  const [apps, setApps] = useState([]);
  const [log, setLog] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [pendingJobs, setPendingJobs] = useState([]);       // queue for review
  const [reviewingJob, setReviewingJob] = useState(null);   // currently shown in modal
  const [selectedApp, setSelectedApp] = useState(null);     // drawer
  const [addingNew, setAddingNew] = useState(false);
  const [filterStage, setFilterStage] = useState("all");
  const [filterText, setFilterText] = useState("");
  const [tab, setTab] = useState("tracker");                // "tracker" | "scanner"
  const [loaded, setLoaded] = useState(false);

  // Load from storage on mount — seed with real applications if empty
  useEffect(() => {
    Promise.all([loadApps(), loadLog()]).then(([a, l]) => {
      if (!a || a.length === 0) {
        setApps(SEED_APPS);
        saveApps(SEED_APPS);
      } else {
        setApps(a);
      }
      setLog(l);
      setLoaded(true);
    });
  }, []);

  // Save whenever apps change
  useEffect(() => {
    if (loaded) saveApps(apps);
  }, [apps, loaded]);

  const addLog = useCallback((msg, type = "info") => {
    const entry = { msg, type, time: new Date().toLocaleTimeString() };
    setLog(prev => {
      const next = [entry, ...prev].slice(0, 100);
      saveLog(next);
      return next;
    });
  }, []);

  // ── Scanner ──

  const [jdText, setJdText] = useState("");
  const [showPaste, setShowPaste] = useState(false);

  const handleScoreJD = async () => {
    if (!jdText.trim()) return;
    setScanning(true);
    addLog("Analyzing job description against your profile…", "info");
    try {
      const r = await scoreJobDescription(jdText);
      const job = {
        ...emptyApp(),
        role: r.role || "Untitled role",
        company: r.company || "Unknown",
        source: "Other",
        url: "",
        salaryRange: r.salaryRange || "",
        location: r.location || "",
        remote: r.remote || "Hybrid",
        matchScore: r.matchScore || null,
        notes: r.notes || "",
        nextAction: r.nextAction || "",
        dateFound: new Date().toISOString().slice(0,10),
        stage: "Lead",
      };
      addLog(`Scored: ${job.role} @ ${job.company} — ${job.matchScore}/99`, "success");
      setPendingJobs(prev => [...prev, job]);
      setJdText("");
      setShowPaste(false);
    } catch (e) {
      addLog("Could not analyze that: " + e.message, "error");
    }
    setScanning(false);
  };

  // Show first pending job when queue has items and modal is not open
  useEffect(() => {
    if (pendingJobs.length > 0 && !reviewingJob) {
      setReviewingJob(pendingJobs[0]);
      setPendingJobs(prev => prev.slice(1));
    }
  }, [pendingJobs, reviewingJob]);

  const handleApprove = (draft) => {
    const app = {
      ...draft,
      dateApplied: new Date().toISOString().slice(0,10),
      stage: "Applied",
      stageHistory: [{ stage: "Applied", date: new Date().toISOString().slice(0,10) }],
    };
    setApps(prev => [app, ...prev]);
    addLog(`✓ Logged: ${app.role} @ ${app.company}`, "success");
    if (app.url) window.open(app.url, "_blank");
    setReviewingJob(null);
  };

  const handleDismiss = () => {
    addLog(`Skipped: ${reviewingJob?.role} @ ${reviewingJob?.company}`, "info");
    setReviewingJob(null);
  };

  const saveApp = (updated) => {
    setApps(prev => prev.map(a => a.id === updated.id ? updated : a));
    setSelectedApp(updated);
    addLog(`Updated: ${updated.role} @ ${updated.company}`, "info");
  };

  const deleteApp = (id) => {
    setApps(prev => prev.filter(a => a.id !== id));
    setSelectedApp(null);
    addLog("Application removed.", "info");
  };

  // ── Filtering ──

  const filtered = apps.filter(a => {
    if (filterStage !== "all" && a.stage !== filterStage) return false;
    if (filterText) {
      const q = filterText.toLowerCase();
      if (!a.role.toLowerCase().includes(q) && !a.company.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ── Stats ──

  const stats = {
    total: apps.length,
    active: apps.filter(a => !["Rejected","Withdrawn","Offer"].includes(a.stage)).length,
    interviews: apps.filter(a => ["Recruiter Screen","Hiring Manager","Portfolio Review","Panel","Final Round"].includes(a.stage)).length,
    offers: apps.filter(a => a.stage === "Offer").length,
  };

  // ── Upcoming dates ──

  const upcoming = apps
    .filter(a => a.nextDate && a.nextDate >= new Date().toISOString().slice(0,10))
    .sort((a,b) => a.nextDate.localeCompare(b.nextDate))
    .slice(0, 5);

  const responseRate = apps.length > 0
    ? Math.round(apps.filter(a => a.response !== "No response").length / apps.length * 100)
    : 0;

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

      {/* Review modal */}
      {reviewingJob && (
        <ReviewModal
          job={reviewingJob}
          onApprove={handleApprove}
          onDismiss={handleDismiss}
        />
      )}

      {/* App drawer */}
      {selectedApp && (
        <AppDrawer
          app={selectedApp}
          onSave={saveApp}
          onClose={() => setSelectedApp(null)}
          onDelete={deleteApp}
        />
      )}

      {/* Top bar */}
      <div style={{
        background: "#0d0d0d", borderBottom: "1px solid #1a1a1a",
        padding: "14px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: "12px", flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: "16px", letterSpacing: "-0.02em" }}>
            Job Search HQ
          </div>
          <div style={{ fontSize: "10px", color: "#444", marginTop: "1px" }}>Cindy Hatch · Staff Content Designer</div>
        </div>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {pendingJobs.length > 0 && (
            <span style={{
              background: "#7c3aed", color: "#fff",
              fontSize: "10px", fontWeight: 700, padding: "3px 8px",
              borderRadius: "10px",
            }}>
              {pendingJobs.length} pending review
            </span>
          )}
          <button onClick={() => setShowPaste(v => !v)} style={{
            padding: "7px 16px",
            background: showPaste ? "#1a1a1a" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
            border: showPaste ? "1px solid #2a2a2a" : "none",
            borderRadius: "6px", color: showPaste ? "#888" : "#fff",
            fontSize: "12px", fontWeight: 700, cursor: "pointer",
          }}>
            {showPaste ? "✕ Close" : "✦ Score a job description"}
          </button>
          <button onClick={() => { setSelectedApp(null); setAddingNew(true); setSelectedApp(emptyApp()); }} style={{
            padding: "7px 14px", background: "#1a1a1a",
            border: "1px solid #2a2a2a", borderRadius: "6px",
            color: "#aaa", fontSize: "12px", cursor: "pointer",
          }}>+ Add manually</button>
          <button onClick={() => {
            const merged = [...SEED_APPS];
            apps.forEach(a => { if (!merged.find(m => m.id === a.id)) merged.push(a); });
            setApps(merged); saveApps(merged);
            addLog(`Loaded ${SEED_APPS.length} tracked applications.`, "success");
          }} style={{
            padding: "7px 14px", background: "#1a1a1a",
            border: "1px solid #2a2a2a", borderRadius: "6px",
            color: "#aaa", fontSize: "12px", cursor: "pointer",
          }}>↺ Load my applications</button>
        </div>
      </div>

      {/* Paste JD panel */}
      {showPaste && (
        <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", padding: "16px 20px" }}>
          <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "8px" }}>
            PASTE A JOB DESCRIPTION — I'll score it against your profile
          </div>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Paste the full job description here…"
            rows={6}
            style={{
              width: "100%", background: "#080808", border: "1px solid #222",
              borderRadius: "6px", color: "#ccc", padding: "10px 12px",
              fontSize: "12px", lineHeight: 1.6, outline: "none", resize: "vertical",
              fontFamily: "inherit", marginBottom: "10px",
            }}
          />
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={handleScoreJD} disabled={scanning || !jdText.trim()} style={{
              padding: "8px 18px",
              background: (scanning || !jdText.trim()) ? "#151515" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              border: "none", borderRadius: "6px",
              color: (scanning || !jdText.trim()) ? "#444" : "#fff",
              fontSize: "12px", fontWeight: 700,
              cursor: (scanning || !jdText.trim()) ? "default" : "pointer",
            }}>
              {scanning ? "Analyzing…" : "Score it →"}
            </button>
            <span style={{ fontSize: "11px", color: "#444" }}>
              Scores fit, flags concerns, then goes to review before it lands in the tracker.
            </span>
          </div>

          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #1a1a1a" }}>
            <div style={{ fontSize: "10px", color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Live boards — browse and paste what looks good
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {JOB_BOARDS.map(b => (
                <a key={b.name} href={b.url} target="_blank" rel="noopener noreferrer" style={{
                  background: "#111", border: "1px solid #222", borderRadius: "6px",
                  padding: "8px 12px", textDecoration: "none", display: "block",
                }}>
                  <div style={{ fontSize: "11px", color: "#93c5fd", fontWeight: 600 }}>{b.name} ↗</div>
                  <div style={{ fontSize: "10px", color: "#444", marginTop: "2px" }}>{b.note}</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: "flex", borderBottom: "1px solid #111", overflowX: "auto" }}>
        {[
          { label: "Applications", value: stats.total, color: "#7c3aed" },
          { label: "Active", value: stats.active, color: "#4f46e5" },
          { label: "In interviews", value: stats.interviews, color: "#0891b2" },
          { label: "Offers", value: stats.offers, color: "#16a34a" },
          { label: "Response rate", value: responseRate + "%", color: "#d97706" },
        ].map((s, i) => (
          <div key={i} style={{ flex: "1 0 90px", padding: "12px 16px", borderRight: "1px solid #111" }}>
            <div style={{ fontSize: "22px", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "9px", color: "#444", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "3px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming reminders */}
      {upcoming.length > 0 && (
        <div style={{
          background: "#0d0d0f", borderBottom: "1px solid #1a1a1a",
          padding: "10px 20px", display: "flex", gap: "16px", overflowX: "auto",
        }}>
          <span style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", alignSelf: "center", flexShrink: 0 }}>Upcoming</span>
          {upcoming.map(a => (
            <div key={a.id} onClick={() => setSelectedApp(a)} style={{
              background: "#111", border: "1px solid #2a2a2a", borderRadius: "5px",
              padding: "5px 10px", cursor: "pointer", flexShrink: 0,
            }}>
              <span style={{ fontSize: "10px", color: "#7c3aed", fontWeight: 700, marginRight: "6px" }}>{a.nextDate}</span>
              <span style={{ fontSize: "11px", color: "#ccc" }}>{a.company}</span>
              {a.nextAction && <span style={{ fontSize: "10px", color: "#555", marginLeft: "6px" }}>— {a.nextAction}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div style={{ display: "flex", height: "calc(100vh - 180px)" }}>

        {/* Tracker table */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Filters */}
          <div style={{
            padding: "12px 16px", display: "flex", gap: "8px",
            alignItems: "center", borderBottom: "1px solid #111", flexWrap: "wrap",
          }}>
            <input
              value={filterText} onChange={e => setFilterText(e.target.value)}
              placeholder="Search role or company…"
              style={{
                background: "#111", border: "1px solid #2a2a2a", borderRadius: "5px",
                color: "#f0f0f0", padding: "6px 10px", fontSize: "12px",
                outline: "none", width: "180px",
              }}
            />
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{
              background: "#111", border: "1px solid #2a2a2a", borderRadius: "5px",
              color: "#888", padding: "6px 10px", fontSize: "12px",
            }}>
              <option value="all">All stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ fontSize: "11px", color: "#444", marginLeft: "auto" }}>
              {filtered.length} application{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.5fr 100px 110px 120px 110px 80px",
            padding: "8px 16px", borderBottom: "1px solid #111",
            fontSize: "9px", color: "#444", textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            <span>Role · Company</span>
            <span>Source · How applied</span>
            <span>Stage</span>
            <span>Date applied</span>
            <span>Point of contact</span>
            <span>Response</span>
            <span>Next date</span>
          </div>

          {/* Rows */}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#333" }}>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>📋</div>
              <div style={{ fontSize: "13px", color: "#444" }}>No applications yet.</div>
              <div style={{ fontSize: "11px", color: "#333", marginTop: "6px" }}>
                Scan for roles or add one manually to get started.
              </div>
            </div>
          )}

          {filtered.map(app => (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 100px 110px 120px 110px 80px",
                padding: "10px 16px", borderBottom: "1px solid #0f0f0f",
                cursor: "pointer", alignItems: "center",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#0f0f0f"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#e0e0e0" }}>{app.role}</div>
                <div style={{ fontSize: "11px", color: "#666", marginTop: "1px" }}>{app.company}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#888" }}>{app.source}</div>
                <div style={{ fontSize: "10px", color: "#555" }}>{app.howApplied}</div>
              </div>
              <div>
                <Badge label={app.stage} color={STAGE_COLORS[app.stage] || "#444"} />
              </div>
              <div style={{ fontSize: "11px", color: "#666" }}>{app.dateApplied || "—"}</div>
              <div>
                <div style={{ fontSize: "11px", color: "#888" }}>{app.pointOfContact || "—"}</div>
                <div style={{ fontSize: "10px", color: "#555" }}>{app.contactEmail || ""}</div>
              </div>
              <div style={{ fontSize: "11px", color: app.response === "No response" ? "#444" : "#86efac" }}>
                {app.response}
              </div>
              <div style={{ fontSize: "11px", color: app.nextDate ? "#7c3aed" : "#333" }}>
                {app.nextDate || "—"}
              </div>
            </div>
          ))}
        </div>

        {/* Activity log sidebar */}
        <div style={{
          width: "220px", flexShrink: 0, borderLeft: "1px solid #111",
          overflowY: "auto", padding: "14px 12px",
        }}>
          <div style={{ fontSize: "9px", color: "#333", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Activity</div>
          {log.length === 0 && <div style={{ fontSize: "11px", color: "#2a2a2a" }}>No activity yet.</div>}
          {log.map((e, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "9px", color: "#333", marginBottom: "1px" }}>{e.time}</div>
              <div style={{
                fontSize: "11px", lineHeight: 1.5,
                color: e.type === "success" ? "#4ade80" : e.type === "alert" ? "#facc15" : e.type === "error" ? "#f87171" : "#555",
              }}>{e.msg}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
