/* ------------------------------------------------------------------ types */

export type TradeId = "fabrication" | "mechanical" | "electrical";

export interface ServiceItem {
  id: string;
  name: string;
  detail: string;
}

export interface Trade {
  id: TradeId;
  index: string;
  title: string;
  eyebrow: string;
  headline: string;
  summary: string;
  image: string;
  imageAlt: string;
  deliveryMode: string;
  items: ServiceItem[];
}

export interface Sector {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface Mode {
  id: string;
  title: string;
  note: string;
}

export interface Stat {
  id: string;
  value: number;
  suffix: string;
  label: string;
  note: string;
}

export interface TextItem {
  id: string;
  text: string;
}

export interface SiteContent {
  brand: {
    name: string;
    tagline: string;
    subTagline: string;
  };
  hero: {
    badge: string;
    headline: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    image: string;
    imageAlt: string;
    footerNote: string;
  };
  ticker: TextItem[];
  stats: Stat[];
  overview: {
    eyebrow: string;
    headline: string;
    bodyA: string;
    bodyB: string;
    factALabel: string;
    factAValue: string;
    factBLabel: string;
    factBValue: string;
    closingLine: string;
    switcherNote: string;
  };
  trades: Trade[];
  coverage: {
    eyebrow: string;
    headline: string;
    body: string;
    modes: Mode[];
    image: string;
    imageAlt: string;
    sectorsHeading: string;
    sectors: Sector[];
  };
  ctaBand: {
    eyebrow: string;
    headline: string;
    body: string;
    image: string;
    imageAlt: string;
    primaryCta: string;
    secondaryLabel: string;
  };
  contact: {
    eyebrow: string;
    headline: string;
    body: string;
    email: string;
    facebookLabel: string;
    facebookUrl: string;
    facebookNote: string;
    emailNote: string;
    promiseTitle: string;
    promiseNote: string;
    formTitle: string;
    formNote: string;
    jobTypes: TextItem[];
    siteModes: TextItem[];
    successHeadline: string;
    successNote: string;
  };
  footer: {
    blurb: string;
    badge: string;
    promise: string;
    adminNote: string;
  };
}

export interface Settings {
  accent: string;
  accentPreset: string;
  passcode: string;
  demoEnquiries: boolean;
  enquiriesEmailForward: boolean;
}

export type EnquiryStatus = "new" | "quoted" | "scheduled" | "completed" | "archived";
export type EnquiryPriority = "standard" | "urgent";

export interface Enquiry {
  id: string;
  ref: string;
  createdAt: string;
  trades: TradeId[];
  jobType: string;
  siteMode: string;
  name: string;
  contact: string;
  location: string;
  details: string;
  status: EnquiryStatus;
  priority: EnquiryPriority;
  read: boolean;
  notes: string;
}

export type NewEnquiry = Pick<
  Enquiry,
  "trades" | "jobType" | "siteMode" | "name" | "contact" | "location" | "details"
> & { priority?: EnquiryPriority };

/* ---------------------------------------------------------------- helpers */

export const uid = (prefix = "id"): string =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;

export const TRADE_META: Record<TradeId, { label: string; short: string }> = {
  fabrication: { label: "Fabrication", short: "FAB" },
  mechanical: { label: "Mechanical", short: "MECH" },
  electrical: { label: "Electrical", short: "ELEC" },
};

export const STATUS_META: Record<
  EnquiryStatus,
  { label: string; dot: string; chip: string }
> = {
  new: {
    label: "New",
    dot: "bg-[#1f7a4d]",
    chip: "bg-[#1f7a4d]/10 text-[#1f7a4d] border-[#1f7a4d]/25",
  },
  quoted: {
    label: "Quoted",
    dot: "bg-[#8a6a05]",
    chip: "bg-[#8a6a05]/10 text-[#8a6a05] border-[#8a6a05]/25",
  },
  scheduled: {
    label: "Scheduled",
    dot: "bg-[#1b4f8a]",
    chip: "bg-[#1b4f8a]/10 text-[#1b4f8a] border-[#1b4f8a]/25",
  },
  completed: {
    label: "Completed",
    dot: "bg-[#3f444a]",
    chip: "bg-[#3f444a]/10 text-[#3f444a] border-[#3f444a]/25",
  },
  archived: {
    label: "Archived",
    dot: "bg-[#9aa0a8]",
    chip: "bg-[#9aa0a8]/12 text-[#6b7178] border-[#9aa0a8]/30",
  },
};

export const STATUS_ORDER: EnquiryStatus[] = [
  "new",
  "quoted",
  "scheduled",
  "completed",
  "archived",
];

export const ACCENT_PRESETS: { id: string; label: string; accent: string; bright: string }[] = [
  { id: "weld", label: "Weld Ember", accent: "#c8500e", bright: "#e8621a" },
  { id: "hi-vis", label: "Hi-Vis Amber", accent: "#a8760a", bright: "#d99b12" },
  { id: "oxide", label: "Oxide Red", accent: "#a3231c", bright: "#cf362c" },
  { id: "plant", label: "Plant Green", accent: "#1d6b45", bright: "#2a8f5d" },
  { id: "steel", label: "Steel Blue", accent: "#1b4f8a", bright: "#2a6cb3" },
];

export const formatRef = (date: Date | string, seq: number): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `NP-${ym}-${String(seq).padStart(3, "0")}`;
};

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDateTime(iso);
};

/* --------------------------------------------------------------- defaults */

export const DEFAULT_SETTINGS: Settings = {
  accent: "#c8500e",
  accentPreset: "weld",
  passcode: "nautic",
  demoEnquiries: true,
  enquiriesEmailForward: true,
};

export const DEFAULT_CONTENT: SiteContent = {
  brand: {
    name: "Nautic Power",
    tagline: "Fab · Mech · Elec",
    subTagline: "Fabrication, Mechanical & Electrical",
  },
  hero: {
    badge: "RURAL, CBD & REMOTE — WE COME TO YOU!",
    headline: "One team for Fabrication, Mechanical & Electrical.",
    body: "At Nautic Power, we're your one-stop shop for Fabrication, Mechanical and Electrical services, helping keep rural businesses, mining operations, farms and industrial sites running smoothly.",
    primaryCta: "Get in touch today",
    secondaryCta: "Explore all three trades",
    image: "/images/hero-rig.jpg",
    imageAlt:
      "Nautic Power mobile welding and field service truck parked on a regional industrial site",
    footerNote: "ON-SITE OR WORKSHOP · DAY OR NIGHT",
  },
  ticker: [
    { id: uid("t"), text: "RURAL, CBD & REMOTE — WE COME TO YOU" },
    { id: uid("t"), text: "ON-SITE MOBILE WELDING" },
    { id: uid("t"), text: "FIXED PLANT MAINTENANCE" },
    { id: uid("t"), text: "ELECTRICAL FAULT FINDING" },
    { id: uid("t"), text: "HYDRAULIC HOSES" },
    { id: uid("t"), text: "TEST & TAG" },
    { id: uid("t"), text: "HORSE FLOAT & TRAILER REPAIRS" },
    { id: uid("t"), text: "DAY OR NIGHT" },
  ],
  stats: [
    {
      id: uid("s"),
      value: 3,
      suffix: "",
      label: "Trades under one roof",
      note: "Fabrication · Mechanical · Electrical",
    },
    {
      id: uid("s"),
      value: 24,
      suffix: "/7",
      label: "Day or night availability",
      note: "On-site or in the workshop",
    },
    {
      id: uid("s"),
      value: 15,
      suffix: "+",
      label: "Core service lines",
      note: "Across all three trades",
    },
    {
      id: uid("s"),
      value: 4,
      suffix: "",
      label: "Sectors kept running",
      note: "Rural, mining, industrial, CBD",
    },
  ],
  overview: {
    eyebrow: "ONE-STOP SHOP CAPABILITY",
    headline: "Reliable service. Quality workmanship. One team for all three trades.",
    bodyA:
      "Industrial breakdowns and custom site builds rarely stop at a single trade boundary. When a pump fails, a plant line stops, or equipment needs custom mounting, waiting on separate boilermakers, fitters and electricians costs valuable operating hours.",
    bodyB:
      "Nautic Power brings qualified fabrication, mechanical and electrical capabilities together in one coordinated team — ready to mobilise to your site or complete work in our workshop, day or night.",
    factALabel: "Service reach",
    factAValue: "Rural, CBD, regional & remote",
    factBLabel: "Availability",
    factBValue: "Workshop or on-site · day or night",
    closingLine: "Rural, regional and remote work welcome!",
    switcherNote: "Select a trade to preview the full scope of work.",
  },
  trades: [
    {
      id: "fabrication",
      index: "01",
      title: "Fabrication",
      eyebrow: "TRADE 01 — STEEL, ALUMINIUM & MOBILE WELDING",
      headline: "Heavy workshop fabrication & on-site mobile welding",
      summary:
        "From custom pipework and structural builds in our workshop to urgent field welding on farms, trailers and remote plant sites, every weld is built for harsh Australian working conditions.",
      image: "/images/fabrication.jpg",
      imageAlt:
        "Nautic Power boilermaker TIG welding precision steel pipework inside a clean workshop",
      deliveryMode: "Workshop & mobile field welding",
      items: [
        {
          id: uid("f"),
          name: "Pipework & structural",
          detail: "Heavy steel pipework, skids, frames, platforms and structural modifications.",
        },
        {
          id: uid("f"),
          name: "Aluminium fabrication",
          detail:
            "Clean TIG/MIG aluminium builds, canopies, tanks, trays and lightweight structural components.",
        },
        {
          id: uid("f"),
          name: "Horse float & trailer repairs",
          detail:
            "Chassis repairs, drawbars, flooring, suspension mounts, ramps and structural safety restoration.",
        },
        {
          id: uid("f"),
          name: "Workshop fabrication",
          detail: "Custom-built components, brackets, guards and heavy steelwork fabricated to spec.",
        },
        {
          id: uid("f"),
          name: "On-site mobile welding",
          detail:
            "Fully self-contained mobile welding units coming directly to your farm, mine or work site.",
        },
      ],
    },
    {
      id: "mechanical",
      index: "02",
      title: "Mechanical",
      eyebrow: "TRADE 02 — PLANT, PUMPS & HYDRAULICS",
      headline: "Fixed plant maintenance, pumps & heavy mechanical repairs",
      summary:
        "Keeping critical production equipment, pumping stations and industrial machinery operating reliably with responsive mechanical fitting, hydraulic hose replacement and preventative maintenance.",
      image: "/images/mechanical.jpg",
      imageAlt:
        "Nautic Power mechanical fitter inspecting heavy industrial water pumps and hydraulic assemblies on site",
      deliveryMode: "On-site plant & workshop repairs",
      items: [
        {
          id: uid("m"),
          name: "Fixed plant maintenance",
          detail:
            "Scheduled servicing, wear-part replacement, alignments and shutdown support for fixed plant.",
        },
        {
          id: uid("m"),
          name: "Pumps & mechanical repairs",
          detail:
            "Overhauls, seal replacements, bearing rebuilds and flow troubleshooting across water and process pumps.",
        },
        {
          id: uid("m"),
          name: "Mechanical fitting & component installation",
          detail: "Precision assembly, drives, gearboxes, shafts, bearings and mechanical retrofits.",
        },
        {
          id: uid("m"),
          name: "Hydraulic hoses",
          detail:
            "Rapid diagnosis, removal and replacement of damaged high-pressure hydraulic hoses and fittings.",
        },
        {
          id: uid("m"),
          name: "Industrial machinery installation, testing, maintenance & repairs",
          detail:
            "End-to-end commissioning, load testing, fault diagnosis and ongoing machinery upkeep.",
        },
      ],
    },
    {
      id: "electrical",
      index: "03",
      title: "Electrical",
      eyebrow: "TRADE 03 — INDUSTRIAL POWER, CONTROLS & COMPLIANCE",
      headline: "Commercial & industrial electrical installations and fault finding",
      summary:
        "Licensed electrical support covering control wiring, power distribution, rapid breakdown diagnostics and routine safety compliance for sheds, workshops, plants and commercial premises.",
      image: "/images/electrical.jpg",
      imageAlt:
        "Nautic Power electrician testing industrial PLC control panel wiring with a digital multimeter",
      deliveryMode: "24/7 fault finding & installations",
      items: [
        {
          id: uid("e"),
          name: "Electrical installations",
          detail:
            "New power circuits, switchboards, lighting, three-phase outlets and site power upgrades.",
        },
        {
          id: uid("e"),
          name: "Wiring, equipment & control systems",
          detail:
            "Motor starters, pump controllers, sensors, machinery wiring and control cabinet builds.",
        },
        {
          id: uid("e"),
          name: "Test & tag",
          detail:
            "Thorough inspection, testing and compliance tagging for portable tools and site equipment.",
        },
        {
          id: uid("e"),
          name: "Electrical fault finding",
          detail:
            "Fast, methodical diagnostics to isolate trips, control failures and intermittent breakdowns.",
        },
        {
          id: uid("e"),
          name: "Commercial & industrial electrical services",
          detail:
            "Dependable electrical maintenance, upgrades and breakdown support across commercial and plant sites.",
        },
      ],
    },
  ],
  coverage: {
    eyebrow: "RURAL, REGIONAL & REMOTE WORK WELCOME",
    headline: "On-site or in the workshop, day or night.",
    body: "Whether it's a breakdown, repairs, maintenance or a custom job, our team is ready to help — on-site or in the workshop, day or night. We come directly to you across rural properties, regional towns, CBD sites and remote mining or agricultural operations.",
    modes: [
      { id: uid("md"), title: "Breakdowns", note: "Day or night response" },
      { id: uid("md"), title: "Repairs", note: "Field or bench overhaul" },
      { id: uid("md"), title: "Maintenance", note: "Fixed plant & compliance" },
      { id: uid("md"), title: "Custom jobs", note: "Built to exact site spec" },
    ],
    image: "/images/sectors-remote.jpg",
    imageAlt:
      "Regional Australian agricultural and industrial infrastructure supported by Nautic Power",
    sectorsHeading: "Sectors we keep running smoothly",
    sectors: [
      {
        id: uid("sec"),
        code: "01",
        name: "Rural businesses & farms",
        description:
          "Bore and irrigation pumps, horse float and trailer structural repairs, shed wiring, machinery breakdowns and mobile on-farm welding.",
      },
      {
        id: uid("sec"),
        code: "02",
        name: "Mining operations",
        description:
          "Fixed plant maintenance, structural pipework, hydraulic hoses, electrical fault finding and multi-trade site support.",
      },
      {
        id: uid("sec"),
        code: "03",
        name: "Industrial sites",
        description:
          "Machinery installation, testing, control systems, custom guards and platforms, and scheduled preventative maintenance.",
      },
      {
        id: uid("sec"),
        code: "04",
        name: "CBD, commercial & workshop",
        description:
          "Custom aluminium and steel fabrication in the workshop, commercial electrical services, test and tag, and equipment repairs.",
      },
    ],
  },
  ctaBand: {
    eyebrow: "BREAKDOWN? WE COME TO YOU.",
    headline: "Get in touch with the team today and let's get the job done.",
    body: "One call covers fabrication, mechanical and electrical — so a breakdown doesn't turn into three contractors, three invoices and three waiting periods.",
    image: "/images/night-shift.jpg",
    imageAlt: "Nautic Power crew performing night-time mobile welding repairs on remote plant",
    primaryCta: "Send a job scope",
    secondaryLabel: "Email the team",
  },
  contact: {
    eyebrow: "GET IN TOUCH TODAY",
    headline: "Let's get the job done.",
    body: "Reach out directly via email, message the team on Facebook with photos or site details, or send through your job scope using the form. Rural, regional, CBD and remote enquiries welcome.",
    email: "admin@nauticpower.com.au",
    facebookLabel: "Message the team on Facebook",
    facebookUrl: "https://www.facebook.com/nauticpower",
    facebookNote:
      "Quick questions, breakdown photos or on-site location pins — message Nautic Power directly.",
    emailNote: "Ideal for quotes, drawings, plant schedules and job requests.",
    promiseTitle:
      "Reliable service. Quality workmanship. One team for all three trades.",
    promiseNote: "Available on-site or in the workshop — day or night.",
    formTitle: "Send a job scope or breakdown request",
    formNote: "Select one or multiple trades — our crew handles all three.",
    jobTypes: [
      { id: uid("jt"), text: "Breakdown / Urgent" },
      { id: uid("jt"), text: "Repairs" },
      { id: uid("jt"), text: "Maintenance" },
      { id: uid("jt"), text: "Custom Job" },
      { id: uid("jt"), text: "Installation" },
      { id: uid("jt"), text: "Quotation" },
    ],
    siteModes: [
      { id: uid("sm"), text: "On-Site — Rural / Farm" },
      { id: uid("sm"), text: "On-Site — Mining / Remote" },
      { id: uid("sm"), text: "On-Site — CBD / Industrial" },
      { id: uid("sm"), text: "In the Workshop" },
    ],
    successHeadline: "Enquiry logged with the Nautic Power team.",
    successNote:
      "Your job scope has been saved to the enquiries desk. Send the details straight to the inbox too so we can respond fast — day or night.",
  },
  footer: {
    blurb:
      "Your one-stop shop for Fabrication, Mechanical and Electrical services — helping keep rural businesses, mining operations, farms and industrial sites running smoothly.",
    badge: "Rural, CBD & Remote — We Come to You",
    promise: "Reliable service. Quality workmanship. One team for all three trades.",
    adminNote: "Staff & admin sign-in",
  },
};

/* ------------------------------------------------------- enquiry seeding */

export const seedEnquiries = (): Enquiry[] => {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();
  const base: Omit<Enquiry, "ref">[] = [
    {
      id: uid("enq"),
      createdAt: hoursAgo(2),
      trades: ["mechanical", "fabrication"],
      jobType: "Breakdown / Urgent",
      siteMode: "On-Site — Mining / Remote",
      name: "D. Kavanagh — Ironbark Gold Operations",
      contact: "0412 884 107",
      location: "Processing Plant 3, Kununurra WA",
      details:
        "Centrifugal process pump seized overnight and took the dewatering line offline. Blown high-pressure hydraulic hose on the feed conveyor as well. Need a mechanical fitter and a welder on site together — plant is down until it is sorted.",
      status: "new",
      priority: "urgent",
      read: false,
      notes: "",
    },
    {
      id: uid("enq"),
      createdAt: hoursAgo(6),
      trades: ["electrical"],
      jobType: "Installation",
      siteMode: "On-Site — CBD / Industrial",
      name: "P. Nguyen — Meridian Commercial Fitouts",
      contact: "projects@meridianfitouts.com.au",
      location: "Brisbane CBD — Level 2 plant room",
      details:
        "Switchboard upgrade and control wiring for a new plant room, including pump controllers and motor starters. After an installation window that can work around building occupancy hours.",
      status: "new",
      priority: "standard",
      read: false,
      notes: "",
    },
    {
      id: uid("enq"),
      createdAt: hoursAgo(26),
      trades: ["electrical"],
      jobType: "Repairs",
      siteMode: "On-Site — Rural / Farm",
      name: "M. & J. Thornton — Thornton Pastoral",
      contact: "0438 220 914",
      location: "Walgett NSW — bore 4",
      details:
        "Bore pump control box tripping the RCD every time it kicks over in hot weather. Stock water is the priority. Suspect the start capacitor or a breakdown in the submersible cable, but need proper fault finding.",
      status: "quoted",
      priority: "standard",
      read: true,
      notes: "Quoted fault find + capacitor replacement. Awaiting go-ahead from owner.",
    },
    {
      id: uid("enq"),
      createdAt: hoursAgo(74),
      trades: ["fabrication"],
      jobType: "Custom Job",
      siteMode: "In the Workshop",
      name: "R. Sullivan",
      contact: "0400 517 386",
      location: "Workshop drop-off — Dubbo",
      details:
        "Horse float needs a chassis repair and new flooring after rust-through, plus a custom aluminium tool canopy for the tow vehicle. Happy to drop both at the workshop.",
      status: "scheduled",
      priority: "standard",
      read: true,
      notes: "Float booked in Thursday. Canopy measured, materials ordered.",
    },
    {
      id: uid("enq"),
      createdAt: hoursAgo(212),
      trades: ["mechanical", "electrical"],
      jobType: "Maintenance",
      siteMode: "On-Site — Industrial",
      name: "S. Okafor — Riverina Cold Storage",
      contact: "maintenance@riverinacold.com.au",
      location: "Wagga Wagga NSW",
      details:
        "Quarterly fixed plant maintenance across two compressor rooms, plus test and tag for 62 portable items and a control panel inspection on the loading dock doors.",
      status: "completed",
      priority: "standard",
      read: true,
      notes: "Completed on site. 4 items failed test and tag — replaced by client. Next visit booked.",
    },
    {
      id: uid("enq"),
      createdAt: hoursAgo(508),
      trades: ["mechanical"],
      jobType: "Quotation",
      siteMode: "On-Site — Rural / Farm",
      name: "A. Whitlam — Whitlam Agri",
      contact: "0427 663 118",
      location: "Longreach QLD",
      details:
        "Quote on replacing hydraulic hoses across two headers before the season starts, plus a look at the auger gearbox on the chaser bin.",
      status: "archived",
      priority: "standard",
      read: true,
      notes: "Client deferred to next season. Archived.",
    },
  ];

  return base.map((item, i) => ({
    ...item,
    ref: formatRef(item.createdAt, base.length - i),
  }));
};
