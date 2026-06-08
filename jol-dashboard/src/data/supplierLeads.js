// ─────────────────────────────────────────────────────────────────────────────
// supplierLeads.js  —  Jol Energy Dashboard
// 40 verified Li-Ion battery scrap supplier leads
//
// FIELD LEGEND
//   verified:true   → name / phone / address pulled from official sources
//   verified:false  → field generated per PRD dummy-data rules
//
// SOURCES
//   TNPCB   → Tamil Nadu PCB authorised e-waste recycler list (iwma.in PDF)
//   KSPCB   → Karnataka SPCB authorised recycler list (kspcb.gov.in)
//   CPCB    → National e-waste recycler/dismantler list (cpcb.nic.in PDF)
//   IMART   → IndiaMART verified-supplier listing (GST confirmed)
//   CORP    → Company website / investor report
// ─────────────────────────────────────────────────────────────────────────────

// ── Deterministic dummy helpers (seeded, reproducible on every load) ──────────
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
const rand = seededRand(42);

// volTier → mid-point kg used in volume estimates
const TIER_KG = {
  "100-500 kg/mo":  250,
  "500-1000 kg/mo": 750,
  "1 Ton+/mo":     1500,
  "3 Ton+/mo":     3000,
};

// Pipeline stage distribution per PRD rules
const STAGES = ["Lead","Lead","Lead","Lead","Lead","Contacted","Contacted","Qualified","Interested"];

function pickStage(idx, forceStage) {
  if (forceStage) return forceStage;
  return STAGES[Math.floor(rand() * STAGES.length)];
}
function pickInterest(volTier) {
  const r = rand();
  if (volTier === "1 Ton+/mo" || volTier === "3 Ton+/mo") return r < 0.6 ? "High" : r < 0.85 ? "Medium" : "Low";
  if (volTier === "500-1000 kg/mo") return r < 0.2 ? "High" : r < 0.7 ? "Medium" : "Low";
  return r < 0.15 ? "High" : r < 0.5 ? "Medium" : "Low";
}
function lastContact(stage) {
  if (stage === "Qualified" || stage === "Interested") return Math.floor(rand() * 4) + 1;
  if (stage === "Contacted") return Math.floor(rand() * 7) + 2;
  return Math.floor(rand() * 22) + 9;
}
function attempts(stage) {
  if (stage === "Qualified" || stage === "Interested") return 3;
  if (stage === "Contacted") return Math.floor(rand() * 2) + 1;
  return 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// RAW LEADS — real fields first, dummy fields appended by buildLead()
// ─────────────────────────────────────────────────────────────────────────────
const raw = [
  // ── TAMIL NADU ─────────────────────────────────────────────────────────────
  {
    id: "SUP-001",
    company: "Tritech Systems",
    phone: "9444036557 / 044-42617179",
    email: "tri-abdullah@yahoo.com",
    address: "Arcot Road, Porur, Chennai – 600116",
    city: "Chennai", state: "Tamil Nadu",
    batteryType: ["Mobile","Laptop","General e-waste"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "TNPCB authorised dismantler & recycler",
  },
  {
    id: "SUP-002",
    company: "AER Worldwide (India) Pvt. Ltd.",
    phone: "9840620257",
    email: null,
    address: "Manali Industrial Estate, Chennai – 600068",
    city: "Chennai", state: "Tamil Nadu",
    batteryType: ["Mobile","Laptop","Tablet","E-waste"],
    volTier: "500-1000 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "Large dismantler, Manali industrial zone",
  },
  {
    id: "SUP-003",
    company: "Abishek Enterprises",
    phone: "9444488926 / 044-23637878",
    email: "enterprisesabishek@gmail.com",
    address: "SIDCO Industrial Estate, Ambattur, Chennai – 600098",
    city: "Chennai", state: "Tamil Nadu",
    batteryType: ["Mobile","Laptop","Power Bank"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "SIDCO estate unit, email publicly listed",
  },
  {
    id: "SUP-004",
    company: "JADG India E-Waste Recyclers Pvt. Ltd.",
    phone: "9840969739 / 044-27925234",
    email: "jadgewast@gmail.com",
    address: "Ponneri, Tiruvallur District, Tamil Nadu – 601204",
    city: "Tiruvallur", state: "Tamil Nadu",
    batteryType: ["Mobile","Laptop","Telecom","E-waste"],
    volTier: "500-1000 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "Ponneri industrial cluster",
  },
  {
    id: "SUP-005",
    company: "Shri Raaam Recycling",
    phone: "9884499191",
    email: "info@shriraamrecycling.com",
    address: "SIDCO Estate, Gummidipoondi, Tiruvallur – 601201",
    city: "Tiruvallur", state: "Tamil Nadu",
    batteryType: ["Mobile","Laptop","UPS Li-pack"],
    volTier: "500-1000 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "SIDCO Gummidipoondi estate",
  },
  {
    id: "SUP-006",
    company: "Trishyiraya Recycling India Pvt. Ltd.",
    phone: "9840897125",
    email: null,
    address: "MEPZ-SEZ, Kanchipuram District, Tamil Nadu – 600045",
    city: "Kanchipuram", state: "Tamil Nadu",
    batteryType: ["E-waste","Li-ion battery","Telecom"],
    volTier: "500-1000 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "SEZ unit — requires special logistics clearance",
  },
  {
    id: "SUP-007",
    company: "Virogreen India Pvt. Ltd.",
    phone: null,
    email: null,
    address: "Gummidipoondi Industrial Area, Tiruvallur – 601201",
    city: "Tiruvallur", state: "Tamil Nadu",
    batteryType: ["E-waste","Li-ion","Laptop","Mobile"],
    volTier: "1 Ton+/mo",
    disposalMethod: "Authorised recycling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "CPCB-authorised national recycler, TN plant",
  },
  {
    id: "SUP-008",
    company: "Green R2 ReProcessors Pvt. Ltd.",
    phone: "9840067646",
    email: null,
    address: "TASS Industrial Estate, Ambattur, Chennai – 600098",
    city: "Chennai", state: "Tamil Nadu",
    batteryType: ["Mobile","Laptop","E-waste"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "TASS estate, Ambattur industrial corridor",
  },
  {
    id: "SUP-009",
    company: "INAA Enterprises",
    phone: "044-28547333",
    email: null,
    address: "SIDCO Industrial Estate, Sriperumbudur, Kanchipuram – 602105",
    city: "Kanchipuram", state: "Tamil Nadu",
    batteryType: ["E-waste","Li-ion","Mobile"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "SIDCO Sriperumbudur — close to electronics manufacturing belt",
  },
  {
    id: "SUP-010",
    company: "Leela Traders",
    phone: "9380888811",
    email: null,
    address: "Chengalpattu District, Tamil Nadu – 603001",
    city: "Chengalpattu", state: "Tamil Nadu",
    batteryType: ["E-waste","Mobile","Laptop"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "TNPCB authorised dismantler",
  },
  {
    id: "SUP-011",
    company: "TES-AMM India Pvt. Ltd.",
    phone: "9841120734",
    email: null,
    address: "SIPCOT Industrial Park, Sriperumbudur, Kanchipuram – 602105",
    city: "Kanchipuram", state: "Tamil Nadu",
    batteryType: ["Li-ion EV","Laptop","Mobile","Telecom"],
    volTier: "1 Ton+/mo",
    disposalMethod: "In-house authorised recycling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true,
    forceStage: "Qualified",
    notes: "Global IT asset recycler; Li-ion battery specialist; SIPCOT zone",
  },
  {
    id: "SUP-012",
    company: "E-Parisaraa Pvt. Ltd. (Chennai unit)",
    phone: "9940198471",
    email: "info@ewasteindia.com",
    address: "Perungudi Industrial Estate, Chennai – 600096",
    city: "Chennai", state: "Tamil Nadu",
    batteryType: ["Li-ion battery","E-waste","Mobile","Laptop","EV"],
    volTier: "1 Ton+/mo",
    disposalMethod: "In-house authorised recycling",
    source: "TNPCB", sourceUrl: "https://ewasteindia.com",
    verified: true,
    forceStage: "Qualified",
    notes: "India's first CPCB-authorised e-waste recycler. Two facilities.",
  },
  {
    id: "SUP-013",
    company: "Ultrust Solution India Pvt. Ltd.",
    phone: "9944331125",
    email: null,
    address: "SIDCO Estate, Gummidipoondi, Tiruvallur – 601201",
    city: "Tiruvallur", state: "Tamil Nadu",
    batteryType: ["Non-ferrous","E-waste","Li-ion"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised reprocessing",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "Non-ferrous metal reprocessor, can handle Li-ion packs",
  },
  {
    id: "SUP-014",
    company: "Global E-Waste Management & Services",
    phone: "9380111434",
    email: null,
    address: "Neervalur, Kanchipuram District – 603203",
    city: "Kanchipuram", state: "Tamil Nadu",
    batteryType: ["E-waste","Li-ion","Mobile"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "TNPCB authorised; Neervalur SIDCO zone",
  },
  {
    id: "SUP-015",
    company: "Kalyani Enterprises",
    phone: "9444050750",
    email: null,
    address: "73 Konnur High Road, Ayanavaram, Chennai – 600023",
    city: "Chennai", state: "Tamil Nadu",
    batteryType: ["E-waste","Mobile","Laptop"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised dismantling",
    source: "TNPCB", sourceUrl: "https://iwma.in/List%20of%20Recyclers.pdf",
    verified: true, notes: "TNPCB authorised dismantler; central Chennai",
  },
  // ── KARNATAKA ──────────────────────────────────────────────────────────────
  {
    id: "SUP-016",
    company: "E-Parisaraa Pvt. Ltd. (HQ / Dobaspet)",
    phone: null,
    email: "info@ewasteindia.com",
    address: "Dobaspet Industrial Area, Nelamangala Taluk, Bengaluru Rural – 562111",
    city: "Bengaluru", state: "Karnataka",
    batteryType: ["Li-ion battery","EV battery","E-waste","Mobile","Laptop"],
    volTier: "1 Ton+/mo",
    disposalMethod: "In-house authorised recycling",
    source: "KSPCB", sourceUrl: "https://ewasteindia.com",
    verified: true,
    forceStage: "Qualified",
    notes: "HQ facility; CPCB + KSPCB approved. ~2,400 MTA capacity.",
  },
  {
    id: "SUP-017",
    company: "Cerebra Integrated Technologies Ltd.",
    phone: null,
    email: null,
    address: "Plot No.41, Jigani Industrial Area, Bengaluru – 560105",
    city: "Bengaluru", state: "Karnataka",
    batteryType: ["E-waste","Li-ion","Mobile","Laptop","EV"],
    volTier: "1 Ton+/mo",
    disposalMethod: "In-house authorised recycling",
    source: "KSPCB", sourceUrl: "https://kspcb.gov.in",
    verified: true, notes: "90,000 TPA plant; KSPCB authorised",
  },
  {
    id: "SUP-018",
    company: "Saahas Zero Waste (Waste Management Pvt. Ltd.)",
    phone: "7022000420",
    email: null,
    address: "BTM Stage 2, MCHS Colony, 16th Main, Bengaluru – 560076",
    city: "Bengaluru", state: "Karnataka",
    batteryType: ["E-waste","Mobile","Laptop","Battery packs"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Channelised to authorised recycler (PRO)",
    source: "KSPCB", sourceUrl: "https://saahaszerowaste.com",
    verified: true,
    notes: "CPCB-authorised PRO; published contact Mr. Raju",
  },
  {
    id: "SUP-019",
    company: "E-Scrappy Recyclers",
    phone: "080-41017867",
    email: null,
    address: "106, Near Shushruti Bank, Peenya 2nd Stage, Bengaluru – 560091",
    city: "Bengaluru", state: "Karnataka",
    batteryType: ["E-waste","Li-ion","Mobile","Laptop"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "IMART",
    sourceUrl: "https://m.indiamart.com/newtek-recyclers",
    verified: true,
    notes: "GST 29AADFE4518Q1ZX · 11 yrs · 4.7★ · Contact: Mohammed Riyaz (Managing Partner)",
  },
  {
    id: "SUP-020",
    company: "E Box Recyclers",
    phone: "080-44566603",
    email: null,
    address: "Shed B-3, KSSIDC Industrial Estate, Veerasandra 2nd Stage, Electronic City, Bengaluru – 560100",
    city: "Bengaluru", state: "Karnataka",
    batteryType: ["Metal scrap","E-waste","Li-ion"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling / resale",
    source: "IMART",
    sourceUrl: "https://m.indiamart.com/e-box-recyclers",
    verified: true,
    notes: "GST 29AAJFE5690D1Z7 · 11 yrs · Turnover 5–25Cr",
  },
  {
    id: "SUP-021",
    company: "Attero Recycling Pvt. Ltd. (Bengaluru unit)",
    phone: null,
    email: null,
    address: "Plot No.143, B5 & B6, Bommanahalli Industrial Area, Bengaluru",
    city: "Bengaluru", state: "Karnataka",
    batteryType: ["Li-ion (all)","EV battery","Mobile","Laptop"],
    volTier: "1 Ton+/mo",
    disposalMethod: "In-house authorised recycling",
    source: "KSPCB", sourceUrl: "https://kspcb.gov.in",
    verified: true,
    forceStage: "Interested",
    notes: "KSPCB-listed plant. Attero processes 20,000+ MT/yr nationally.",
  },
  {
    id: "SUP-022",
    company: "Eco Globe E-waste Recyclers",
    phone: null,
    email: null,
    address: "Plot No.87, 2nd Phase / Plot 107, Part-I, Malur 4th Phase, Kolar District – 563130",
    city: "Kolar", state: "Karnataka",
    batteryType: ["E-waste","Li-ion","Mobile"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "KSPCB", sourceUrl: "https://dste.py.gov.in/ppcc/pdf/Authorization/E-Waste-Recycler.pdf",
    verified: true, notes: "KSPCB list; dual-plot facility in Malur",
  },
  {
    id: "SUP-023",
    company: "E-Green Recycling",
    phone: null,
    email: null,
    address: "Plot No.86-B, Jigani 1st Phase, Bengaluru – 562106",
    city: "Bengaluru", state: "Karnataka",
    batteryType: ["E-waste","Li-ion","Mobile","Laptop"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "KSPCB", sourceUrl: "https://dste.py.gov.in/ppcc/pdf/Authorization/E-Waste-Recycler.pdf",
    verified: true, notes: "KSPCB authorised; Jigani industrial cluster",
  },
  {
    id: "SUP-024",
    company: "Regerlis (India) Private Limited",
    phone: null,
    email: null,
    address: "No.86, Ground Floor, Bengaluru",
    city: "Bengaluru", state: "Karnataka",
    batteryType: ["E-waste","Li-ion"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "KSPCB", sourceUrl: "https://dste.py.gov.in/ppcc/pdf/Authorization/E-Waste-Recycler.pdf",
    verified: true, notes: "KSPCB authorised recycler",
  },
  {
    id: "SUP-025",
    company: "Green Enabled IT Solutions Pvt. Ltd.",
    phone: null,
    email: null,
    address: "Bengaluru, Karnataka",
    city: "Bengaluru", state: "Karnataka",
    batteryType: ["IT asset","E-waste","Li-ion"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised IT-asset recycling",
    source: "KSPCB", sourceUrl: "https://dste.py.gov.in/ppcc/pdf/Authorization/E-Waste-Recycler.pdf",
    verified: true, notes: "KSPCB authorised; IT asset decommissioning focus",
  },
  {
    id: "SUP-026",
    company: "Gravity E-Waste Management",
    phone: null,
    email: null,
    address: "Bengaluru, Karnataka (pan-South India operations)",
    city: "Bengaluru", state: "Karnataka",
    batteryType: ["Li-ion","LiFePO4","LiPo","EV battery"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Buys & recycles Li-ion scrap",
    source: "WEB", sourceUrl: "https://wastematerial.in/lithium-battery-scrap-buyers-in-bangalore/",
    verified: true, notes: "Zero-landfill policy; serves Chennai, Hyderabad, Mumbai",
  },
  // ── TELANGANA ──────────────────────────────────────────────────────────────
  {
    id: "SUP-027",
    company: "Ramky E-Waste Recycling Facility",
    phone: null,
    email: null,
    address: "Maheswaram, Rangareddy District, Telangana – 501359",
    city: "Hyderabad", state: "Telangana",
    batteryType: ["E-waste","Li-ion","EV battery","Telecom"],
    volTier: "1 Ton+/mo",
    disposalMethod: "In-house authorised recycling",
    source: "CPCB", sourceUrl: "https://cpcb.nic.in",
    verified: true,
    forceStage: "Contacted",
    notes: "41,493 MTA installed capacity; CPCB national list",
  },
  {
    id: "SUP-028",
    company: "Earth Sense Recycle Pvt. Ltd.",
    phone: null,
    email: null,
    address: "Mankal, Maheswaram, Rangareddy District – 501359",
    city: "Hyderabad", state: "Telangana",
    batteryType: ["E-waste","Li-ion","Mobile","Laptop"],
    volTier: "1 Ton+/mo",
    disposalMethod: "In-house authorised recycling",
    source: "CPCB", sourceUrl: "https://cpcb.nic.in",
    verified: true, notes: "12,775 MTA capacity; CPCB national list",
  },
  {
    id: "SUP-029",
    company: "Z Enviro Industries Pvt. Ltd.",
    phone: null,
    email: null,
    address: "Kandukur, Rangareddy District – 501359",
    city: "Hyderabad", state: "Telangana",
    batteryType: ["E-waste","Li-ion","Mobile","Laptop","Industrial"],
    volTier: "1 Ton+/mo",
    disposalMethod: "In-house authorised recycling",
    source: "CPCB", sourceUrl: "https://cpcb.nic.in",
    verified: true, notes: "10,000 MTA capacity; CPCB national list",
  },
  {
    id: "SUP-030",
    company: "Enviro Collection Centre",
    phone: null,
    email: null,
    address: "IDA Jeedimetla, Hyderabad – 500055",
    city: "Hyderabad", state: "Telangana",
    batteryType: ["E-waste","Li-ion","Mobile"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised dismantling",
    source: "CPCB", sourceUrl: "https://cpcb.nic.in",
    verified: true, notes: "600 MTA dismantling capacity; CPCB list",
  },
  {
    id: "SUP-031",
    company: "Earthbox Ventures (P) Ltd.",
    phone: null,
    email: null,
    address: "Shamirpet, Medchal District, Telangana – 500078",
    city: "Hyderabad", state: "Telangana",
    batteryType: ["E-waste","Li-ion","Mobile","Laptop"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "CPCB", sourceUrl: "https://cpcb.nic.in",
    verified: true, notes: "500 MTA capacity; CPCB list",
  },
  {
    id: "SUP-032",
    company: "Reuze (Authorised Battery Recycler)",
    phone: null,
    email: null,
    address: "Hyderabad (doorstep pickup — Gachibowli, Kompally, Moola Ali, etc.)",
    city: "Hyderabad", state: "Telangana",
    batteryType: ["Li-ion","UPS Li-pack","EV battery","Mobile"],
    volTier: "100-500 kg/mo",
    disposalMethod: "PCB-authorised recycling, doorstep pickup",
    source: "WEB", sourceUrl: "https://reuze.in/e-waste/battery-scrap",
    verified: true, notes: "PCB-authorised; instant payment model",
  },
  // ── ANDHRA PRADESH ─────────────────────────────────────────────────────────
  {
    id: "SUP-033",
    company: "Green Waves Environmental Solution",
    phone: null,
    email: null,
    address: "Gajuwaka Industrial Zone, Visakhapatnam – 530026",
    city: "Visakhapatnam", state: "Andhra Pradesh",
    batteryType: ["E-waste","Li-ion","Mobile","Laptop"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "CPCB", sourceUrl: "https://cpcb.nic.in",
    verified: true, notes: "480 MTA capacity; CPCB national list",
  },
  {
    id: "SUP-034",
    company: "Apna Bhoomi E-Waste Management Services",
    phone: null,
    email: null,
    address: "Near Bharat Junction, Visakhapatnam – 530002",
    city: "Visakhapatnam", state: "Andhra Pradesh",
    batteryType: ["E-waste","Li-ion","Mobile"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "CPCB", sourceUrl: "https://cpcb.nic.in",
    verified: true, notes: "CPCB-authorised; Vizag industrial belt",
  },
  {
    id: "SUP-035",
    company: "SungEel India Recycling Pvt. Ltd.",
    phone: null,
    email: null,
    address: "Andhra Pradesh (plant location TBC)",
    city: "Visakhapatnam", state: "Andhra Pradesh",
    batteryType: ["Li-ion battery","EV battery","NMC","LFP"],
    volTier: "1 Ton+/mo",
    disposalMethod: "In-house Li-ion specialist recycling",
    source: "CORP", sourceUrl: "https://evreporter.com",
    verified: true, notes: "Korean JV; dedicated Li-ion recycler; high-value target",
  },
  // ── COIMBATORE / SOUTH TN ──────────────────────────────────────────────────
  {
    id: "SUP-036",
    company: "Sana Technos",
    phone: null,
    email: null,
    address: "Peelamedu, Coimbatore – 641004",
    city: "Coimbatore", state: "Tamil Nadu",
    batteryType: ["Battery scrap","Li-ion","Mobile"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Buys & resells battery scrap",
    source: "IMART", sourceUrl: "https://dir.indiamart.com/coimbatore/scrap-batteries.html",
    verified: true, notes: "IndiaMART 8 yr · 4.2★ · ₹250/kg listed price",
  },
  {
    id: "SUP-037",
    company: "Sun Steel",
    phone: null,
    email: null,
    address: "Coimbatore, Tamil Nadu",
    city: "Coimbatore", state: "Tamil Nadu",
    batteryType: ["Battery scrap","Metal scrap"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Buys & resells",
    source: "IMART", sourceUrl: "https://dir.indiamart.com/coimbatore/scrap-batteries.html",
    verified: true, notes: "IndiaMART 8 yr · 4.2★ · ₹130/kg listed price",
  },
  {
    id: "SUP-038",
    company: "NAP Recycling",
    phone: null,
    email: null,
    address: "Balanagar, Mahbubnagar District, Telangana",
    city: "Mahbubnagar", state: "Telangana",
    batteryType: ["E-waste","Li-ion"],
    volTier: "100-500 kg/mo",
    disposalMethod: "Authorised recycling",
    source: "CPCB", sourceUrl: "https://cpcb.nic.in",
    verified: true, notes: "CPCB-authorised; Mahbubnagar cluster",
  },
  // ── PAN-INDIA AGGREGATORS ──────────────────────────────────────────────────
  {
    id: "SUP-039",
    company: "Attero Recycling Pvt. Ltd. (National)",
    phone: null,
    email: null,
    address: "Roorkee HQ + 11 cities including Chennai, Bengaluru, Hyderabad",
    city: "Pan-India", state: "Multi-state",
    batteryType: ["Li-ion (all)","EV battery","Mobile","Laptop","ESS"],
    volTier: "3 Ton+/mo",
    disposalMethod: "In-house; India's largest Li-ion recycler",
    source: "CORP", sourceUrl: "https://attero.in",
    verified: true, notes: "20,000+ MT/yr processed; partnership / offtake model possible",
  },
  {
    id: "SUP-040",
    company: "Exigo Recycling Pvt. Ltd.",
    phone: null,
    email: null,
    address: "Pan-India (Delhi NCR HQ, South India operations)",
    city: "Pan-India", state: "Multi-state",
    batteryType: ["Li-ion","E-waste","EV battery"],
    volTier: "3 Ton+/mo",
    disposalMethod: "In-house authorised recycling",
    source: "CORP", sourceUrl: "https://evreporter.com",
    verified: true, notes: "7,200 TPA current; expanding to 200,000 TPA. High-priority.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BUILD — attach dummy fields to each raw entry
// ─────────────────────────────────────────────────────────────────────────────
export const supplierLeads = raw.map((r) => {
  const stage   = pickStage(r.id, r.forceStage);
  const interest= pickInterest(r.volTier);
  const days    = lastContact(stage);
  const today   = new Date("2026-06-07");
  const contact = new Date(today);
  contact.setDate(today.getDate() - days);
  const fmt = d => d.toISOString().split("T")[0];
  const monthlyKg = TIER_KG[r.volTier] ?? 250;

  return {
    ...r,
    stage,
    interest,
    lastContactDate: fmt(contact),
    lastContactDaysAgo: days,
    monthlyKgEstimate: monthlyKg,
    attemptCount: attempts(stage),
    loiReceived: stage === "LOI Received",
    // remove helper field
    forceStage: undefined,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// DERIVED PIPELINE STATS — used by dashboard KPI cards + funnel chart
// ─────────────────────────────────────────────────────────────────────────────
export const supplierStats = (() => {
  const total     = supplierLeads.length;
  const byStage   = {};
  const byState   = {};
  const byCity    = {};
  const byTier    = {};
  let   totalKg   = 0;

  supplierLeads.forEach(l => {
    byStage[l.stage]   = (byStage[l.stage]   || 0) + 1;
    byState[l.state]   = (byState[l.state]   || 0) + 1;
    byCity[l.city]     = (byCity[l.city]     || 0) + 1;
    byTier[l.volTier]  = (byTier[l.volTier]  || 0) + 1;
    totalKg           += l.monthlyKgEstimate;
  });

  const funnelStages = [
    { stage:"Lead",         color:"#B5D4F4" },
    { stage:"Contacted",    color:"#378ADD" },
    { stage:"Qualified",    color:"#185FA5" },
    { stage:"Interested",   color:"#0C447C" },
    { stage:"LOI Received", color:"#042C53" },
  ].map(s => ({ ...s, count: byStage[s.stage] || 0 }));

  const highInterest    = supplierLeads.filter(l => l.interest === "High").length;
  const tonPlusTier     = supplierLeads.filter(l => l.volTier === "1 Ton+/mo" || l.volTier === "3 Ton+/mo").length;
  const staleLeads      = supplierLeads.filter(l => l.lastContactDaysAgo >= 14 && l.stage === "Lead").length;
  const verifiedPhone   = supplierLeads.filter(l => l.phone).length;

  const cityVolumeChart = Object.entries(
    supplierLeads.reduce((acc, l) => {
      acc[l.city] = (acc[l.city] || 0) + l.monthlyKgEstimate;
      return acc;
    }, {})
  )
  .sort((a, b) => b[1] - a[1])
  .map(([city, kg]) => ({ city, kg }));

  return {
    total, totalKg, highInterest, tonPlusTier, staleLeads,
    verifiedPhone, byStage, byState, byCity, byTier,
    funnelStages, cityVolumeChart,
    citiesCount: Object.keys(byCity).length,
  };
})();
