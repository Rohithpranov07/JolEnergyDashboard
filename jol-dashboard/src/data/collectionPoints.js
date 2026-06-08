// ─────────────────────────────────────────────────────────────────────────────
// collectionPoints.js  —  Jol Energy Dashboard
// 32 Li-Ion battery collection / drop-off points with lat/lng for Leaflet map
//
// PIN TYPES
//   REGISTRY   → TNPCB / KSPCB / CPCB authorised intake point
//   PRO        → CPCB-authorised Producer Responsibility Organisation
//   INDIAMART  → GST-verified IndiaMART scrap buyer
//   FIELD      → Field-survey placeholder (pin at city-cluster offset)
//
// COLLECTION HUBS  (used for hub-and-spoke overlay)
//   HUB-CHN  →  Chennai   (13.0827, 80.2707)  radius 80 km
//   HUB-BLR  →  Bengaluru (12.9716, 77.5946)  radius 80 km
//   HUB-HYD  →  Hyderabad (17.3850, 78.4867)  radius 80 km
//
// LAT/LNG METHOD
//   REGISTRY / PRO / INDIAMART  → Google Maps lookup from published address
//   FIELD                       → City-centre ± seeded offset  (±0.03–0.05°)
// ─────────────────────────────────────────────────────────────────────────────

// Hub definitions (rendered as Leaflet circles on the map)
export const collectionHubs = [
  { id:"HUB-CHN", name:"Chennai hub",    lat:13.0827, lng:80.2707, radiusKm:80, color:"#185FA5" },
  { id:"HUB-BLR", name:"Bengaluru hub",  lat:12.9716, lng:77.5946, radiusKm:80, color:"#0F6E56" },
  { id:"HUB-HYD", name:"Hyderabad hub",  lat:17.3850, lng:78.4867, radiusKm:80, color:"#BA7517" },
];

// Hub economics (shown in sidebar table on map tab)
export const hubEconomics = [
  {
    hub:"Chennai",   collectionsPerTrip:8, avgTripsPerMonth:6,
    avgKgPerTrip:280, costPerKg:8.2,  breakevenKgMo:420,
    estMonthlyKg:1680, currency:"INR",
  },
  {
    hub:"Bengaluru", collectionsPerTrip:7, avgTripsPerMonth:5,
    avgKgPerTrip:220, costPerKg:11.0, breakevenKgMo:350,
    estMonthlyKg:1100, currency:"INR",
  },
  {
    hub:"Hyderabad", collectionsPerTrip:5, avgTripsPerMonth:4,
    avgKgPerTrip:180, costPerKg:13.5, breakevenKgMo:280,
    estMonthlyKg:720, currency:"INR",
  },
];

// Seeded deterministic offset for field-survey points
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
const rand = seededRand(77);
function offset(base, range = 0.04) {
  return parseFloat((base + (rand() - 0.5) * range * 2).toFixed(4));
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION POINTS
// ─────────────────────────────────────────────────────────────────────────────
const raw = [
  // ── VERIFIED — PRO collection points (Saahas Zero Waste) ──────────────────
  {
    id:"CP-001", type:"PRO", verified:true,
    name:"Saahas Zero Waste — BTM Layout",
    contactPerson:"Mr. Raju", phone:"7022000420",
    address:"#21, MCHS Colony, 16th Main, BTM Stage 2, Bengaluru – 560076",
    city:"Bengaluru", state:"Karnataka",
    category:"E-waste & battery collection",
    lat:12.9132, lng:77.6101,
    nearestHub:"HUB-BLR",
    willingness:"Yes",
    source:"saahaszerowaste.com",
  },
  {
    id:"CP-002", type:"PRO", verified:true,
    name:"Saahas Zero Waste — Koramangala",
    contactPerson:"Mr. Raju", phone:"7022000420",
    address:"Koramangala Industrial Layout, Bengaluru – 560034",
    city:"Bengaluru", state:"Karnataka",
    category:"E-waste & battery collection",
    lat:12.9352, lng:77.6245,
    nearestHub:"HUB-BLR",
    willingness:"Yes",
    source:"saahaszerowaste.com",
  },
  {
    id:"CP-003", type:"PRO", verified:true,
    name:"Saahas Zero Waste — Ejipura",
    contactPerson:"Mr. Raju", phone:"7022000420",
    address:"Ejipura Main Road, Gowda Muniswamy Garden, Bengaluru – 560095",
    city:"Bengaluru", state:"Karnataka",
    category:"E-waste & battery collection",
    lat:12.9426, lng:77.6180,
    nearestHub:"HUB-BLR",
    willingness:"Yes",
    source:"saahaszerowaste.com",
  },
  {
    id:"CP-004", type:"PRO", verified:true,
    name:"Saahas Zero Waste — Begumpet (Hyderabad)",
    contactPerson:"Mr. Gnaneshwar", phone:"9866689906",
    address:"1-11-251/5, Vishnu Bhavan, Begumpet, Hyderabad – 500016",
    city:"Hyderabad", state:"Telangana",
    category:"E-waste & battery collection",
    lat:17.4399, lng:78.4601,
    nearestHub:"HUB-HYD",
    willingness:"Yes",
    source:"saahaszerowaste.com",
  },
  // ── VERIFIED — TNPCB authorised recycler intake (Chennai) ─────────────────
  {
    id:"CP-005", type:"REGISTRY", verified:true,
    name:"E-Parisaraa Pvt. Ltd. — Chennai intake",
    contactPerson:"[Verify via outreach]", phone:"9940198471",
    address:"Perungudi Industrial Estate, Chennai – 600096",
    city:"Chennai", state:"Tamil Nadu",
    category:"Authorised recycler intake",
    lat:12.9698, lng:80.2489,
    nearestHub:"HUB-CHN",
    willingness:"Yes",
    source:"TNPCB list + ewasteindia.com",
  },
  {
    id:"CP-006", type:"REGISTRY", verified:true,
    name:"Tritech Systems — Chennai",
    contactPerson:"[Verify]", phone:"9444036557",
    address:"Arcot Road, Porur, Chennai – 600116",
    city:"Chennai", state:"Tamil Nadu",
    category:"Authorised recycler intake",
    lat:13.0358, lng:80.1570,
    nearestHub:"HUB-CHN",
    willingness:"Yes",
    source:"TNPCB authorized recycler list",
  },
  {
    id:"CP-007", type:"REGISTRY", verified:true,
    name:"Abishek Enterprises — Ambattur",
    contactPerson:"[Verify]", phone:"9444488926",
    address:"SIDCO Industrial Estate, Ambattur, Chennai – 600098",
    city:"Chennai", state:"Tamil Nadu",
    category:"Authorised recycler intake",
    lat:13.0982, lng:80.1650,
    nearestHub:"HUB-CHN",
    willingness:"Yes",
    source:"TNPCB authorized recycler list",
  },
  {
    id:"CP-008", type:"REGISTRY", verified:true,
    name:"Green R2 ReProcessors — Ambattur",
    contactPerson:"[Verify]", phone:"9840067646",
    address:"TASS Industrial Estate, Ambattur, Chennai – 600098",
    city:"Chennai", state:"Tamil Nadu",
    category:"Authorised recycler intake",
    lat:13.0942, lng:80.1680,
    nearestHub:"HUB-CHN",
    willingness:"Yes",
    source:"TNPCB authorized recycler list",
  },
  {
    id:"CP-009", type:"REGISTRY", verified:true,
    name:"Kalyani Enterprises — Ayanavaram",
    contactPerson:"[Verify]", phone:"9444050750",
    address:"73 Konnur High Road, Ayanavaram, Chennai – 600023",
    city:"Chennai", state:"Tamil Nadu",
    category:"E-waste dismantler",
    lat:13.1034, lng:80.2361,
    nearestHub:"HUB-CHN",
    willingness:"Maybe",
    source:"TNPCB dismantler list",
  },
  {
    id:"CP-010", type:"REGISTRY", verified:true,
    name:"Param Enterprises — Kovilampakkam",
    contactPerson:"[Verify]", phone:"9444029696",
    address:"Plot 3, Periyar Salai, Kovilampakkam, Chennai – 600117",
    city:"Chennai", state:"Tamil Nadu",
    category:"E-waste dismantler",
    lat:12.9420, lng:80.1896,
    nearestHub:"HUB-CHN",
    willingness:"Maybe",
    source:"TNPCB dismantler list",
  },
  // ── VERIFIED — IndiaMART scrap buyers ──────────────────────────────────────
  {
    id:"CP-011", type:"INDIAMART", verified:true,
    name:"Sana Technos — Peelamedu",
    contactPerson:"[Verify]", phone:"[Request via IndiaMART]",
    address:"Peelamedu, Coimbatore – 641004",
    city:"Coimbatore", state:"Tamil Nadu",
    category:"Battery scrap buyer",
    lat:11.0298, lng:77.0116,
    nearestHub:"HUB-CHN",
    willingness:"Yes",
    source:"IndiaMART (8yr, 4.2★, ₹250/kg listed)",
  },
  {
    id:"CP-012", type:"INDIAMART", verified:true,
    name:"Sun Steel — Coimbatore",
    contactPerson:"[Verify]", phone:"[Request via IndiaMART]",
    address:"Coimbatore, Tamil Nadu",
    city:"Coimbatore", state:"Tamil Nadu",
    category:"Battery / metal scrap buyer",
    lat:11.0215, lng:76.9978,
    nearestHub:"HUB-CHN",
    willingness:"Yes",
    source:"IndiaMART (8yr, 4.2★, ₹130/kg listed)",
  },
  {
    id:"CP-013", type:"INDIAMART", verified:true,
    name:"Adhitya Marketing and Services — Chennai",
    contactPerson:"[Verify]", phone:"[Request via IndiaMART]",
    address:"Chennai, Tamil Nadu",
    city:"Chennai", state:"Tamil Nadu",
    category:"Industrial battery scrap buyer",
    lat:13.0567, lng:80.2185,
    nearestHub:"HUB-CHN",
    willingness:"Yes",
    source:"IndiaMART (₹95/kg industrial scrap listed)",
  },
  {
    id:"CP-014", type:"INDIAMART", verified:true,
    name:"Venkateswara Metal Mart — Coimbatore",
    contactPerson:"[Verify]", phone:"[Request via IndiaMART]",
    address:"Coimbatore, Tamil Nadu",
    city:"Coimbatore", state:"Tamil Nadu",
    category:"Metal / battery scrap",
    lat:11.0138, lng:76.9702,
    nearestHub:"HUB-CHN",
    willingness:"Maybe",
    source:"IndiaMART (10yr verified)",
  },
  {
    id:"CP-015", type:"REGISTRY", verified:true,
    name:"E-Parisaraa — Hindupur (AP unit)",
    contactPerson:"[Verify]", phone:"[Verify]",
    address:"Hindupur Industrial Area, Anantapur District, AP – 515201",
    city:"Hindupur", state:"Andhra Pradesh",
    category:"Authorised recycler intake",
    lat:13.8360, lng:77.4917,
    nearestHub:"HUB-BLR",
    willingness:"Yes",
    source:"ewasteindia.com (2nd facility)",
  },
  {
    id:"CP-016", type:"PRO", verified:true,
    name:"Karo Sambhav — Bengaluru drop-off",
    contactPerson:"[Verify]", phone:"[Verify]",
    address:"Whitefield area, Bengaluru",
    city:"Bengaluru", state:"Karnataka",
    category:"PRO collection point",
    lat:12.9832, lng:77.7480,
    nearestHub:"HUB-BLR",
    willingness:"Yes",
    source:"CPCB-authorised PRO",
  },
  {
    id:"CP-017", type:"REGISTRY", verified:true,
    name:"Namma E-Waste Kendra — BBMP",
    contactPerson:"[Verify]", phone:"[Verify]",
    address:"BBMP authorised centre, Bengaluru",
    city:"Bengaluru", state:"Karnataka",
    category:"Govt collection centre",
    lat:12.9716, lng:77.5800,
    nearestHub:"HUB-BLR",
    willingness:"Yes",
    source:"BBMP-authorised e-waste kendra",
  },
  // ── FIELD-SURVEY PLACEHOLDERS — candidate to verify via Google Maps ────────
  {
    id:"CP-018", type:"FIELD", verified:false,
    name:"[Mobile repair cluster — Ritchie Street, Chennai]",
    contactPerson:"[Survey via visit/call]", phone:null,
    address:"Ritchie Street, Park Town, Chennai – 600003",
    city:"Chennai", state:"Tamil Nadu",
    category:"Mobile repair shop cluster",
    lat:offset(13.0801), lng:offset(80.2780,0.02),
    nearestHub:"HUB-CHN",
    willingness:"Maybe",
    source:"Field survey (Google Maps pin — verify)",
  },
  {
    id:"CP-019", type:"FIELD", verified:false,
    name:"[Laptop service centre — Chennai]",
    contactPerson:null, phone:null,
    address:"Nungambakkam / Vadapalani area, Chennai",
    city:"Chennai", state:"Tamil Nadu",
    category:"Laptop service centre",
    lat:offset(13.0674), lng:offset(80.2376,0.025),
    nearestHub:"HUB-CHN",
    willingness:"Maybe",
    source:"Field survey",
  },
  {
    id:"CP-020", type:"FIELD", verified:false,
    name:"[E-scooter service centre — Chennai]",
    contactPerson:null, phone:null,
    address:"GST Road / Chromepet cluster, Chennai",
    city:"Chennai", state:"Tamil Nadu",
    category:"EV service centre",
    lat:offset(13.0010), lng:offset(80.1415,0.03),
    nearestHub:"HUB-CHN",
    willingness:"Maybe",
    source:"Field survey — Ola/Ather service partner",
  },
  {
    id:"CP-021", type:"FIELD", verified:false,
    name:"[Mobile repair market — SP Road, Bengaluru]",
    contactPerson:null, phone:null,
    address:"SP Road, Shivajinagar, Bengaluru – 560001",
    city:"Bengaluru", state:"Karnataka",
    category:"Mobile / electronics market",
    lat:offset(12.9810), lng:offset(77.5975,0.018),
    nearestHub:"HUB-BLR",
    willingness:"Maybe",
    source:"Field survey",
  },
  {
    id:"CP-022", type:"FIELD", verified:false,
    name:"[Laptop service centre — Bengaluru]",
    contactPerson:null, phone:null,
    address:"Jayanagar / BTM area, Bengaluru",
    city:"Bengaluru", state:"Karnataka",
    category:"Laptop service centre",
    lat:offset(12.9252), lng:offset(77.5938,0.02),
    nearestHub:"HUB-BLR",
    willingness:"Maybe",
    source:"Field survey",
  },
  {
    id:"CP-023", type:"FIELD", verified:false,
    name:"[E-scooter service centre — Bengaluru]",
    contactPerson:null, phone:null,
    address:"Electronic City / Bommanahalli, Bengaluru",
    city:"Bengaluru", state:"Karnataka",
    category:"EV service centre",
    lat:offset(12.8399), lng:offset(77.6770,0.025),
    nearestHub:"HUB-BLR",
    willingness:"Maybe",
    source:"Field survey — Ather/Ola service hub",
  },
  {
    id:"CP-024", type:"FIELD", verified:false,
    name:"[E-rickshaw / 3-wheeler garage — Hyderabad]",
    contactPerson:null, phone:null,
    address:"Uppal / LB Nagar area, Hyderabad",
    city:"Hyderabad", state:"Telangana",
    category:"EV 3-wheeler service",
    lat:offset(17.4050), lng:offset(78.5590,0.03),
    nearestHub:"HUB-HYD",
    willingness:"Maybe",
    source:"Field survey — high 3W EV density",
  },
  {
    id:"CP-025", type:"FIELD", verified:false,
    name:"[Laptop refurbisher — Hyderabad]",
    contactPerson:null, phone:null,
    address:"Abids / Koti electronics market, Hyderabad",
    city:"Hyderabad", state:"Telangana",
    category:"Laptop refurbishment",
    lat:offset(17.3930), lng:offset(78.4786,0.02),
    nearestHub:"HUB-HYD",
    willingness:"Maybe",
    source:"Field survey",
  },
  {
    id:"CP-026", type:"FIELD", verified:false,
    name:"[UPS / inverter service company — Chennai]",
    contactPerson:null, phone:null,
    address:"Guindy Industrial Estate, Chennai – 600032",
    city:"Chennai", state:"Tamil Nadu",
    category:"UPS / inverter Li-pack service",
    lat:offset(13.0067), lng:offset(80.2206,0.022),
    nearestHub:"HUB-CHN",
    willingness:"Maybe",
    source:"Field survey — industrial Li-UPS prevalent",
  },
  {
    id:"CP-027", type:"FIELD", verified:false,
    name:"[Telecom tower battery vendor — Bengaluru]",
    contactPerson:null, phone:null,
    address:"Peenya Industrial Area, Bengaluru – 560058",
    city:"Bengaluru", state:"Karnataka",
    category:"Telecom Li-pack service",
    lat:offset(13.0284), lng:offset(77.5220,0.018),
    nearestHub:"HUB-BLR",
    willingness:"Maybe",
    source:"Field survey — Peenya telecom cluster",
  },
  {
    id:"CP-028", type:"FIELD", verified:false,
    name:"[Mobile service chain — Coimbatore]",
    contactPerson:null, phone:null,
    address:"DB Road / RS Puram, Coimbatore – 641002",
    city:"Coimbatore", state:"Tamil Nadu",
    category:"Mobile service shop",
    lat:offset(11.0048), lng:offset(76.9659,0.02),
    nearestHub:"HUB-CHN",
    willingness:"Maybe",
    source:"Field survey",
  },
  {
    id:"CP-029", type:"FIELD", verified:false,
    name:"[Mobile service chain — Madurai]",
    contactPerson:null, phone:null,
    address:"Anna Nagar / Bypass Road, Madurai – 625020",
    city:"Madurai", state:"Tamil Nadu",
    category:"Mobile service shop",
    lat:offset(9.9340), lng:offset(78.1198,0.025),
    nearestHub:"HUB-CHN",
    willingness:"Maybe",
    source:"Field survey",
  },
  {
    id:"CP-030", type:"FIELD", verified:false,
    name:"[Electronics repair market — Kochi]",
    contactPerson:null, phone:null,
    address:"MG Road / Convent Road, Ernakulam, Kochi – 682016",
    city:"Kochi", state:"Kerala",
    category:"Electronics repair market",
    lat:offset(9.9810), lng:offset(76.2990,0.022),
    nearestHub:"HUB-CHN",
    willingness:"Maybe",
    source:"Field survey",
  },
  {
    id:"CP-031", type:"FIELD", verified:false,
    name:"[Power bank wholesaler — Coimbatore]",
    contactPerson:null, phone:null,
    address:"Avinashi Road, Coimbatore – 641014",
    city:"Coimbatore", state:"Tamil Nadu",
    category:"Mobile accessory / power bank retail",
    lat:offset(11.0168), lng:offset(77.0233,0.025),
    nearestHub:"HUB-CHN",
    willingness:"Maybe",
    source:"Field survey",
  },
  {
    id:"CP-032", type:"FIELD", verified:false,
    name:"[E-scooter service hub — Hyderabad]",
    contactPerson:null, phone:null,
    address:"Kompally / Bowrampet, Hyderabad",
    city:"Hyderabad", state:"Telangana",
    category:"EV service centre",
    lat:offset(17.5300), lng:offset(78.4867,0.03),
    nearestHub:"HUB-HYD",
    willingness:"Maybe",
    source:"Field survey — Reuze noted coverage here",
  },
];

// Attach monthly kg estimate and distance-to-hub (dummy, seeded)
const CATEGORY_KG = {
  "Authorised recycler intake": 350,
  "PRO collection point": 180,
  "Govt collection centre": 120,
  "E-waste dismantler": 200,
  "Battery scrap buyer": 280,
  "Battery / metal scrap buyer": 200,
  "Industrial battery scrap buyer": 250,
  "Metal / battery scrap": 220,
  "Mobile repair shop cluster": 60,
  "Mobile repair shop": 40,
  "Laptop service centre": 80,
  "EV service centre": 160,
  "EV 3-wheeler service": 200,
  "Mobile / electronics market": 70,
  "Laptop refurbishment": 90,
  "UPS / inverter Li-pack service": 160,
  "Telecom Li-pack service": 240,
  "Mobile accessory / power bank retail": 55,
  "Electronics repair market": 65,
};

export const collectionPoints = raw.map(r => ({
  ...r,
  monthlyKgEstimate: CATEGORY_KG[r.category] ?? 100,
  distanceToHubKm: Math.round(10 + rand() * 60),
}));

// ── DERIVED STATS ──────────────────────────────────────────────────────────────
export const collectionStats = (() => {
  const total     = collectionPoints.length;
  const verified  = collectionPoints.filter(p => p.verified).length;
  const field     = total - verified;
  const byCity    = {};
  const byType    = {};
  let   totalKg   = 0;

  collectionPoints.forEach(p => {
    byCity[p.city] = (byCity[p.city] || 0) + 1;
    byType[p.type] = (byType[p.type] || 0) + 1;
    totalKg       += p.monthlyKgEstimate;
  });

  const cityVolume = Object.entries(
    collectionPoints.reduce((acc, p) => {
      acc[p.city] = (acc[p.city] || 0) + p.monthlyKgEstimate;
      return acc;
    }, {})
  ).sort((a,b)=>b[1]-a[1]).map(([city,kg])=>({city,kg}));

  return { total, verified, field, byCity, byType, totalKg, cityVolume };
})();
