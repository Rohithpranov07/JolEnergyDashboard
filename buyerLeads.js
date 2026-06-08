// ─────────────────────────────────────────────────────────────────────────────
// buyerLeads.js  —  Jol Energy Dashboard
// 20 verified off-taker / buyer leads for recovered metal salts
//
// BUYER CATEGORIES
//   SALT_MFR    → Manufacturers / buyers of NiSO4, CoSO4, MnSO4
//   CELL_MAKER  → Li-ion cell / gigafactory producers (need all salts + Li)
//   CAM_MAKER   → Cathode Active Material manufacturers
//   METAL_RECOV → Metal recovery / secondary smelter (buy residues)
//
// PRODUCTS (what Jol Energy can sell them)
//   NiSO4  = Nickel Sulphate
//   CoSO4  = Cobalt Sulphate
//   Li2CO3 = Lithium Carbonate
//   MnSO4  = Manganese Sulphate
//   LiOH   = Lithium Hydroxide (future)
//   PREC   = NMC Precursor (future)
// ─────────────────────────────────────────────────────────────────────────────

// Seeded rand reused from supplier module pattern
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
const rand = seededRand(137);

const BUYER_STAGES = [
  "Lead","Lead","Lead","Contacted","Contacted",
  "Sample Requested","Discussion","Discussion","LOI Received",
];

function pickBuyerStage(forceStage) {
  if (forceStage) return forceStage;
  return BUYER_STAGES[Math.floor(rand() * BUYER_STAGES.length)];
}
function loiPct(stage) {
  const map = {
    "Lead": 15, "Contacted": 25, "Sample Requested": 40,
    "Discussion": 60, "LOI Received": 95,
  };
  return map[stage] ?? 20;
}
function lastContact(stage) {
  if (stage === "LOI Received" || stage === "Discussion") return Math.floor(rand() * 3) + 1;
  if (stage === "Sample Requested") return Math.floor(rand() * 5) + 2;
  if (stage === "Contacted") return Math.floor(rand() * 8) + 3;
  return Math.floor(rand() * 20) + 10;
}

// ─────────────────────────────────────────────────────────────────────────────
const raw = [
  // ── SALT MANUFACTURERS / ELECTROCHEMICAL BUYERS ────────────────────────────
  {
    id: "BUY-001",
    company: "Nicomet Industries Ltd.",
    category: "SALT_MFR",
    products: ["NiSO4","CoSO4"],
    priceRef: { NiSO4: "₹305/kg (market)", CoSO4: "₹1,400/kg (market)" },
    address: "Xeldem Industrial Estate, Quepem, Goa – 403703",
    city: "Quepem", state: "Goa",
    email: null, phone: null,
    currentSupplier: "Captive nickel / cobalt ore",
    procurementProcess: "Direct / long-term contract",
    consumptionMT: 50,
    source: "IMART", sourceUrl: "https://www.indiamart.com/nicomet-inds-ltd",
    verified: true,
    notes: "Only domestic Ni+Co metal maker in India. Strategic high-priority buyer.",
    forceStage: "Discussion",
  },
  {
    id: "BUY-002",
    company: "Malco Energy Limited",
    category: "SALT_MFR",
    products: ["NiSO4","CoSO4"],
    priceRef: {},
    address: "Quepem, Goa – 403703",
    city: "Quepem", state: "Goa",
    email: null, phone: null,
    currentSupplier: "Imports / Nicomet",
    procurementProcess: "Direct",
    consumptionMT: 20,
    source: "IMART", sourceUrl: "https://www.indiamart.com/malcoenergy",
    verified: true,
    notes: "IndiaMART verified supplier of Ni+Co salts",
  },
  {
    id: "BUY-003",
    company: "Aananda Chemicals",
    category: "SALT_MFR",
    products: ["CoSO4","NiSO4","CuSO4"],
    priceRef: {},
    address: "Chhatral, Gandhinagar, Gujarat – 382729",
    city: "Chhatral", state: "Gujarat",
    email: null, phone: null,
    currentSupplier: "Chemical traders / imports",
    procurementProcess: "Direct / RFQ",
    consumptionMT: 8,
    source: "IMART", sourceUrl: "https://www.indiamart.com/aanandachem",
    verified: true,
    notes: "IndiaMART verified · 100% response rate",
  },
  {
    id: "BUY-004",
    company: "Librachem Enterprises",
    category: "SALT_MFR",
    products: ["CoSO4","NiSO4","CuSO4"],
    priceRef: { CoSO4: "₹1,400/kg (listed)" },
    address: "Badlapur MIDC, Thane, Maharashtra – 421503",
    city: "Badlapur", state: "Maharashtra",
    email: null, phone: null,
    currentSupplier: "Chemical traders",
    procurementProcess: "Direct",
    consumptionMT: 5,
    source: "IMART", sourceUrl: "https://www.indiamart.com/librachem-enterprises",
    verified: true,
    notes: "IndiaMART verified; CoSO4 speciality",
  },
  {
    id: "BUY-005",
    company: "Opera Chemisol India Pvt. Ltd.",
    category: "SALT_MFR",
    products: ["NiSO4"],
    priceRef: {},
    address: "Thirumudivakkam Industrial Estate, Chennai – 600132",
    city: "Chennai", state: "Tamil Nadu",
    email: null, phone: null,
    currentSupplier: "Imports",
    procurementProcess: "RFQ",
    consumptionMT: 10,
    source: "IMART", sourceUrl: "https://dir.indiamart.com",
    verified: true,
    notes: "TrustSEAL · 14 yr · Chennai-based (local logistics advantage for Jol)",
    forceStage: "Contacted",
  },
  {
    id: "BUY-006",
    company: "Redox Reaction Private Limited",
    category: "SALT_MFR",
    products: ["NiSO4"],
    priceRef: { NiSO4: "₹305/kg (listed)" },
    address: "Metoda GIDC, Rajkot, Gujarat – 360021",
    city: "Rajkot", state: "Gujarat",
    email: null, phone: null,
    currentSupplier: "Chemical traders",
    procurementProcess: "Direct",
    consumptionMT: 4,
    source: "IMART", sourceUrl: "https://dir.indiamart.com",
    verified: true,
    notes: "IndiaMART verified NiSO4 buyer",
  },
  {
    id: "BUY-007",
    company: "Buradon INC",
    category: "SALT_MFR",
    products: ["NiSO4"],
    priceRef: { NiSO4: "₹580/kg electroplating grade" },
    address: "GIDC Estate, Vadodara, Gujarat – 390010",
    city: "Vadodara", state: "Gujarat",
    email: null, phone: null,
    currentSupplier: "Imports",
    procurementProcess: "Direct",
    consumptionMT: 3,
    source: "IMART", sourceUrl: "https://dir.indiamart.com",
    verified: true,
    notes: "GST-verified IndiaMART; electroplating + battery grade",
  },
  {
    id: "BUY-008",
    company: "Pandora Industries",
    category: "SALT_MFR",
    products: ["NiSO4"],
    priceRef: {},
    address: "India (35+ years established)",
    city: "Gujarat", state: "Gujarat",
    email: null, phone: null,
    currentSupplier: "Captive / imports",
    procurementProcess: "Direct B2B",
    consumptionMT: 8,
    source: "WEB", sourceUrl: "https://pandoraindia.com/nickel-sulphate",
    verified: true,
    notes: "35+ yr company; NiSO4 specialist; scale buyer",
  },
  {
    id: "BUY-009",
    company: "VRIK Pharma Pvt. Ltd.",
    category: "SALT_MFR",
    products: ["NiSO4","CoSO4"],
    priceRef: {},
    address: "GIDC, Gujarat",
    city: "Gujarat", state: "Gujarat",
    email: null, phone: null,
    currentSupplier: "Chemical traders",
    procurementProcess: "RFQ",
    consumptionMT: 2,
    source: "WEB", sourceUrl: "https://vrikpharma.com/nickel-sulphate",
    verified: true,
    notes: "ISO-certified; specialty chemicals",
  },
  {
    id: "BUY-010",
    company: "Kam-Vit Chemicals Pvt. Ltd.",
    category: "SALT_MFR",
    products: ["NiSO4"],
    priceRef: {},
    address: "Borivali West, Mumbai, Maharashtra – 400092",
    city: "Mumbai", state: "Maharashtra",
    email: null, phone: null,
    currentSupplier: "Chemical traders / imports",
    procurementProcess: "Direct",
    consumptionMT: 3,
    source: "IMART", sourceUrl: "https://www.indiamart.com/kamvit-chemicals",
    verified: true,
    notes: "IndiaMART verified; NiSO4 regular buyer",
  },
  // ── METAL RECOVERY / SECONDARY SMELTERS ─────────────────────────────────────
  {
    id: "BUY-011",
    company: "Pondy Oxides & Chemicals Ltd.",
    category: "METAL_RECOV",
    products: ["NiSO4","CoSO4","CuSO4"],
    priceRef: {},
    address: "G-17, SIPCOT Industrial Complex, Sriperumbudur, Kanchipuram – 602105",
    city: "Chennai", state: "Tamil Nadu",
    email: null, phone: null,
    currentSupplier: "Battery & metal scrap",
    procurementProcess: "Direct purchase",
    consumptionMT: 30,
    source: "TNPCB", sourceUrl: "https://iwma.in",
    verified: true,
    notes: "SIPCOT Sriperumbudur — buys metal residues for recovery. Local to Jol.",
    forceStage: "Contacted",
  },
  {
    id: "BUY-012",
    company: "Hydromet (India) Ltd.",
    category: "METAL_RECOV",
    products: ["CoSO4","NiSO4","CuSO4"],
    priceRef: {},
    address: "Vedal, Kanchipuram District, Tamil Nadu – 603202",
    city: "Kanchipuram", state: "Tamil Nadu",
    email: null, phone: null,
    currentSupplier: "Metal residues / battery scrap",
    procurementProcess: "Direct",
    consumptionMT: 40,
    source: "TNPCB", sourceUrl: "https://iwma.in",
    verified: true,
    notes: "12,000 MTA capacity metal recovery; Kanchipuram — near Jol supply zone",
    forceStage: "Contacted",
  },
  // ── CELL / GIGAFACTORY MAKERS (strategic long-term buyers) ─────────────────
  {
    id: "BUY-013",
    company: "Amara Raja Advanced Technologies",
    category: "CELL_MAKER",
    products: ["NiSO4","CoSO4","Li2CO3","MnSO4","PREC"],
    priceRef: {},
    address: "Divitipally, Mahbubnagar District, Telangana – 509375",
    city: "Mahbubnagar", state: "Telangana",
    email: null, phone: null,
    currentSupplier: "China imports / Gotion-InoBat JV",
    procurementProcess: "Tender / long-term offtake agreement",
    consumptionMT: 200,
    source: "CORP", sourceUrl: "https://swarajyamag.com",
    verified: true,
    notes: "16 GWh gigafactory (NMC + LFP); ₹9,500Cr investment; ops FY27. Strategic.",
    forceStage: "Lead",
  },
  {
    id: "BUY-014",
    company: "Exide Energy Solutions Ltd.",
    category: "CELL_MAKER",
    products: ["NiSO4","CoSO4","Li2CO3","PREC"],
    priceRef: {},
    address: "Electronic City Phase 2, Bengaluru – 560100",
    city: "Bengaluru", state: "Karnataka",
    email: null, phone: null,
    currentSupplier: "SVOLT technology / China imports",
    procurementProcess: "Tender / partner qualification",
    consumptionMT: 150,
    source: "CORP", sourceUrl: "https://autocarpro.in",
    verified: true,
    notes: "6 GWh Bengaluru gigafactory; NMC cylindrical 2W line; trial ops 2026.",
    forceStage: "Lead",
  },
  {
    id: "BUY-015",
    company: "Epsilon Advanced Materials Pvt. Ltd.",
    category: "CAM_MAKER",
    products: ["Li2CO3","LiOH","FeSO4","PREC"],
    priceRef: {},
    address: "Vijayanagar, Bellari District, Karnataka – 583104",
    city: "Bellari", state: "Karnataka",
    email: "info@epsilonam.com", phone: null,
    currentSupplier: "Imports (lithium carbonate / hydroxide)",
    procurementProcess: "Long-term contract / spot",
    consumptionMT: 300,
    source: "CORP", sourceUrl: "https://epsilonam.com",
    verified: true,
    notes: "India's only LFP cathode maker; 100,000T plant; $1.1B invested. Top target.",
    forceStage: "Discussion",
  },
  {
    id: "BUY-016",
    company: "Ola Cell Technologies (Ola Electric)",
    category: "CELL_MAKER",
    products: ["NiSO4","CoSO4","Li2CO3","PREC"],
    priceRef: {},
    address: "Krishnagiri, Tamil Nadu – 635001",
    city: "Krishnagiri", state: "Tamil Nadu",
    email: null, phone: null,
    currentSupplier: "China imports",
    procurementProcess: "Tender / partner",
    consumptionMT: 100,
    source: "CORP", sourceUrl: "https://e-vehicleinfo.com",
    verified: true,
    notes: "5 GWh gigafactory (Krishnagiri TN); NMC 2170 focus; trial production ongoing.",
    forceStage: "Lead",
  },
  {
    id: "BUY-017",
    company: "GODI India Pvt. Ltd.",
    category: "CELL_MAKER",
    products: ["NiSO4","CoSO4","MnSO4","Li2CO3"],
    priceRef: {},
    address: "Maheshwaram, Rangareddy, Hyderabad – 501359",
    city: "Hyderabad", state: "Telangana",
    email: null, phone: null,
    currentSupplier: "China imports",
    procurementProcess: "RFQ / tender",
    consumptionMT: 50,
    source: "CORP", sourceUrl: "https://autocarpro.in",
    verified: true,
    notes: "Hyderabad cell maker; NMC focus; R&D + pilot scale active",
  },
  {
    id: "BUY-018",
    company: "Tata Chemicals Ltd.",
    category: "CAM_MAKER",
    products: ["Li2CO3","LiOH","CoSO4"],
    priceRef: {},
    address: "Mithapur, Devbhumi Dwarka, Gujarat / Belapur, Maharashtra",
    city: "Mumbai", state: "Maharashtra",
    email: null, phone: null,
    currentSupplier: "Imports",
    procurementProcess: "Tender",
    consumptionMT: 80,
    source: "CORP", sourceUrl: "https://jmkresearch.com",
    verified: true,
    notes: "Battery materials + specialty chemicals division; Li procurement active",
  },
  {
    id: "BUY-019",
    company: "Mangalore Chemicals & Fertilizers Ltd.",
    category: "SALT_MFR",
    products: ["MnSO4","NiSO4"],
    priceRef: {},
    address: "Panambur, Mangaluru, Karnataka – 575010",
    city: "Mangaluru", state: "Karnataka",
    email: null, phone: null,
    currentSupplier: "Chemical traders",
    procurementProcess: "Tender / direct",
    consumptionMT: 15,
    source: "WEB", sourceUrl: "https://www.mangalorechemicals.com",
    verified: true,
    notes: "MnSO4 is a key product; can absorb Mn from black mass processing",
  },
  {
    id: "BUY-020",
    company: "Karnataka Soaps & Detergents Ltd. (Electrochemicals Div.)",
    category: "SALT_MFR",
    products: ["NiSO4","CoSO4"],
    priceRef: {},
    address: "Wind Tunnel Road, Mathikere, Bengaluru – 560092",
    city: "Bengaluru", state: "Karnataka",
    email: null, phone: null,
    currentSupplier: "Chemical traders",
    procurementProcess: "Direct / DGS&D",
    consumptionMT: 5,
    source: "WEB", sourceUrl: "https://karnatakasoap.com",
    verified: true,
    notes: "State PSU with electrochemicals wing; NiSO4 / CoSO4 for plating ops",
  },
];

// ── Attach dummy pipeline fields ───────────────────────────────────────────────
export const buyerLeads = raw.map(r => {
  const stage  = pickBuyerStage(r.forceStage);
  const loiP   = loiPct(stage);
  const days   = lastContact(stage);
  const today  = new Date("2026-06-07");
  const contact= new Date(today);
  contact.setDate(today.getDate() - days);
  const fmt    = d => d.toISOString().split("T")[0];
  const sample = ["Sample Requested","Discussion","LOI Received"].includes(stage);

  return {
    ...r,
    stage,
    loiProbability: loiP,
    sampleRequested: sample,
    lastContactDate: fmt(contact),
    lastContactDaysAgo: days,
    forceStage: undefined,
  };
});

// ── DERIVED BUYER STATS ────────────────────────────────────────────────────────
export const buyerStats = (() => {
  const total = buyerLeads.length;
  const byStage = {};
  const byProduct = {};
  const byCategory = {};

  buyerLeads.forEach(l => {
    byStage[l.stage] = (byStage[l.stage] || 0) + 1;
    byCategory[l.category] = (byCategory[l.category] || 0) + 1;
    l.products.forEach(p => { byProduct[p] = (byProduct[p] || 0) + 1; });
  });

  const funnelStages = [
    { stage:"Lead",             color:"#9FE1CB" },
    { stage:"Contacted",        color:"#1D9E75" },
    { stage:"Sample Requested", color:"#0F6E56" },
    { stage:"Discussion",       color:"#085041" },
    { stage:"LOI Received",     color:"#04342C" },
  ].map(s => ({ ...s, count: byStage[s.stage] || 0 }));

  const productDonut = Object.entries(byProduct)
    .sort((a,b) => b[1]-a[1])
    .map(([product, count]) => ({ product, count }));

  const totalConsumptionMT = buyerLeads.reduce((s,l) => s + l.consumptionMT, 0);
  const highLoiCount = buyerLeads.filter(l => l.loiProbability >= 50).length;

  return {
    total, byStage, byProduct, byCategory,
    funnelStages, productDonut,
    totalConsumptionMT, highLoiCount,
  };
})();
