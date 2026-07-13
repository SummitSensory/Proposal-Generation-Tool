// AUTO-GENERATED starter option bundles, pulled from a real Adventure Series proposal
// (Treetop ABA Therapy Center, R-3MBL2Z-20x10) plus the legacy workbook's option list.
// Quantities are FIXED defaults for v1 -- they do not scale with structure dimensions yet.
// Review these on the Proposal Options page and adjust quantities/items as needed.
// Soar/Flex/Scape/Safe are seeded as empty shells (no reliable source data) -- add their
// bundle items yourself on the Proposal Options page.

export type SeedOptionItem = { sku: string; quantity: string };
export type SeedOption = {
  key: string;
  series: "adventure" | "soar" | "flex" | "scape" | "safe";
  label: string;
  description: string;
  sortOrder: number;
  items: SeedOptionItem[];
};

export const seedOptions: SeedOption[] = [
  {
    key: "adv_monkey_bars",
    series: "adventure",
    label: "Monkey Bars",
    description: "Adds monkey bar rungs and the monkey-bar HSS half bay. Default quantities match a 20'x10' structure -- adjust for other sizes.",
    sortOrder: 1,
    items: [
      { sku: "P-2330", quantity: "19" },
      { sku: "A-2420", quantity: "2" },
    ],
  },
  {
    key: "adv_ladder_access",
    series: "adventure",
    label: "Ladder Access",
    description: "Footless ladder leg and inner ladder sleeve for climbing access.",
    sortOrder: 2,
    items: [
      { sku: "P-2531", quantity: "2" },
      { sku: "A-2253", quantity: "2" },
    ],
  },
  {
    key: "adv_zip_line",
    series: "adventure",
    label: "Zip Line",
    description: "Full zip line kit: HSS tube, collars, wiring, cable cover, trolley, eye bolt, cable sleeve.",
    sortOrder: 3,
    items: [
      { sku: "P-2024", quantity: "4" },
      { sku: "A-2530", quantity: "8" },
      { sku: "ZIPLINE-WIRE", quantity: "2" },
      { sku: "SSTBW515", quantity: "2" },
      { sku: "ZIPLINE-TROLLEY", quantity: "2" },
      { sku: "6820H-LP-ZP", quantity: "4" },
      { sku: "B01MRLJ93K", quantity: "2" },
    ],
  },
  {
    key: "adv_climbing_wall",
    series: "adventure",
    label: "Climbing Wall & Safety Accessories",
    description: "Frame-mounted climbing wall with climbing holds, carabiners, and webbing slings.",
    sortOrder: 4,
    items: [
      { sku: "SSG-SA-CFM", quantity: "1" },
      { sku: "B0CDVDZSB1", quantity: "4" },
      { sku: "RDC6015-B", quantity: "4" },
    ],
  },
  {
    key: "adv_dual_trolley",
    series: "adventure",
    label: "Dual Trolley System",
    description: "9' aluminum rail trolley system. Rail length/quantities should be adjusted to match structure length.",
    sortOrder: 5,
    items: [
      { sku: "TR2000-A09", quantity: "14" },
      { sku: "TRT2001", quantity: "14" },
      { sku: "TRN2016", quantity: "28" },
      { sku: "TRH2005", quantity: "42" },
    ],
  },
  {
    key: "adv_column_wrap_safety",
    series: "adventure",
    label: "Adventure Column Wrap & Safety Padding",
    description: "Column wrap and U-shaped safety padding for posts and ladder legs.",
    sortOrder: 6,
    items: [
      { sku: "SSCW67", quantity: "2" },
      { sku: "SSUSP67", quantity: "4" },
      { sku: "SSUSP72", quantity: "2" },
    ],
  },
  {
    key: "adv_quick_shift_bracket",
    series: "adventure",
    label: "Quick Shift Saddle Bracket Hardware",
    description: "Swing/swivel hardware for Quick Shift Saddle Brackets.",
    sortOrder: 7,
    items: [
      { sku: "P-2124", quantity: "4" },
      { sku: "6820H-LDD", quantity: "4" },
      { sku: "B0C4Y8XSNB", quantity: "6" },
      { sku: "6820H-LP", quantity: "14" },
    ],
  },
  {
    key: "soar_mats_accessories",
    series: "soar",
    label: "Mats & Accessories",
    description: "Add Soar mat/accessory line items here (no starter data yet -- edit this option to add items).",
    sortOrder: 1,
    items: [],
  },
  {
    key: "flex_tracking_rail",
    series: "flex",
    label: "Tracking Rail System",
    description: "Add Flex tracking rail line items here (no starter data yet -- edit this option to add items).",
    sortOrder: 1,
    items: [],
  },
  {
    key: "flex_safety_padding",
    series: "flex",
    label: "Safety Padding",
    description: "Add Flex safety padding line items here (no starter data yet -- edit this option to add items).",
    sortOrder: 2,
    items: [],
  },
  {
    key: "scape_foundation_system",
    series: "scape",
    label: "Summit Foundation System",
    description: "Add Scape flooring-protection line items here (no starter data yet -- edit this option to add items).",
    sortOrder: 1,
    items: [],
  },
  {
    key: "safe_install_hardware",
    series: "safe",
    label: "Installation Hardware",
    description: "Add Summit Safe installation hardware line items here (no starter data yet -- edit this option to add items).",
    sortOrder: 1,
    items: [],
  },
];
