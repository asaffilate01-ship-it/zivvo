// AA-style 200-point inspection checklist
// 12 sections, each with weighted point items.
export type CheckResult = "pass" | "advisory" | "fail" | "na";

export interface ChecklistItem {
  id: string;
  label: string;
  points: number;
}

export interface ChecklistSection {
  id: string;
  title: string;
  icon: string;
  items: ChecklistItem[];
}

const mk = (prefix: string, labels: string[], pts = 1): ChecklistItem[] =>
  labels.map((l, i) => ({ id: `${prefix}_${i + 1}`, label: l, points: pts }));

export const INSPECTION_CHECKLIST: ChecklistSection[] = [
  {
    id: "exterior",
    title: "Exterior & Bodywork",
    icon: "🚗",
    items: mk("ext", [
      "Front bumper condition", "Rear bumper condition", "Bonnet alignment & paint", "Boot/tailgate alignment",
      "Front-left wing", "Front-right wing", "Rear-left quarter panel", "Rear-right quarter panel",
      "Driver door panel", "Passenger door panel", "Rear driver door", "Rear passenger door",
      "Roof condition", "Sunroof seal & operation", "Front windscreen (no cracks)", "Rear windscreen",
      "Side windows (4)", "Door mirrors & power fold", "Headlights condition", "Tail lights condition",
      "Indicator lenses", "Fog lights (front/rear)", "Number plates secure & legible",
      "Paint depth uniform (gauge test)", "No respray evidence"
    ], 1),
  },
  {
    id: "interior",
    title: "Interior & Trim",
    icon: "🪑",
    items: mk("int", [
      "Driver seat condition & adjusters", "Passenger seat condition", "Rear seats condition",
      "Seat belts (all) & retractors", "Steering wheel wear", "Dashboard cracks/wear",
      "Door cards & handles", "Headlining condition", "Carpet condition (no damp)",
      "Boot lining condition", "Glovebox & centre console", "Sun visors & vanity mirrors",
      "Interior lights (all)", "Pedal rubber wear", "Gear knob & gaiter"
    ], 1),
  },
  {
    id: "engine",
    title: "Engine Bay",
    icon: "⚙️",
    items: mk("eng", [
      "Engine starts cleanly", "Idle smooth & stable", "No abnormal smoke (cold start)",
      "No abnormal smoke (warm)", "No oil leaks visible", "No coolant leaks visible",
      "No fuel leaks", "Oil level & condition", "Coolant level & colour",
      "Brake fluid level", "Power steering fluid", "Washer fluid",
      "Drive belts condition", "Hoses condition (no perish)", "Battery condition & terminals",
      "Engine mounts intact", "Air filter housing", "Service intervals up to date",
      "Cambelt/chain status known", "No warning lights on dash",
      "VIN matches V5C", "Engine number visible", "Underbonnet wiring tidy",
      "Bonnet struts hold", "Bulkhead clean (no impact)"
    ], 2),
  },
  {
    id: "transmission",
    title: "Transmission & Clutch",
    icon: "🔧",
    items: mk("trn", [
      "Clutch pedal feel (manual)", "Gear selection smooth (1-6)", "Reverse engages cleanly",
      "Auto box shifts smoothly", "No gearbox whine", "No clutch slip on test",
      "Diff/driveshaft no clunks", "4WD engages (if applicable)", "Gear linkage tight", "Clutch fluid level"
    ], 2),
  },
  {
    id: "brakes",
    title: "Brakes",
    icon: "🛑",
    items: mk("brk", [
      "Front discs condition & thickness", "Rear discs/drums condition", "Front pad life (>30%)",
      "Rear pad life (>30%)", "Handbrake holds on incline", "ABS warning light off",
      "Brake pedal firm (no air)", "No pulling under braking", "Brake lines/hoses condition", "EPB function (if fitted)"
    ], 2),
  },
  {
    id: "suspension",
    title: "Suspension & Steering",
    icon: "🔩",
    items: mk("sus", [
      "Front shocks (no leaks)", "Rear shocks (no leaks)", "Coil springs intact",
      "Bounce test all corners", "Wishbones & bushes", "Anti-roll bar links",
      "Track rod ends", "Steering rack gaiters", "Power steering function",
      "Wheel bearings (no rumble)", "CV joints (no clicking)", "Ride height level"
    ], 2),
  },
  {
    id: "electrics",
    title: "Electrics & Electronics",
    icon: "💡",
    items: mk("elc", [
      "All exterior lights work", "Indicators & hazards", "Brake lights",
      "Reverse lights", "Horn", "Wipers (front & rear)",
      "Washers spray correctly", "Electric windows (all)", "Central locking",
      "Key fob remote", "Alarm/immobiliser", "Infotainment system",
      "Reversing camera/sensors", "Bluetooth/USB connectivity", "Sat-nav function",
      "Speaker check (all)", "Dashboard illumination", "Cigarette/USB sockets working"
    ], 1),
  },
  {
    id: "ac_heat",
    title: "Climate & Heating",
    icon: "❄️",
    items: mk("ac", [
      "A/C blows cold (<8°C)", "Heater blows hot", "All blower speeds work",
      "Vent direction controls", "Demist front operation", "Demist rear operation",
      "Heated seats (if fitted)", "Heated steering (if fitted)", "Cabin filter condition", "No unusual smells"
    ], 1),
  },
  {
    id: "tyres",
    title: "Wheels & Tyres",
    icon: "🛞",
    items: mk("tyr", [
      "Front-left tread depth", "Front-right tread depth", "Rear-left tread depth",
      "Rear-right tread depth", "Spare/space-saver present", "Tyres matched & legal",
      "No sidewall damage", "Wheel condition (no kerbing)", "Locking wheel nut key", "Correct pressures"
    ], 2),
  },
  {
    id: "underbody",
    title: "Underbody & Chassis",
    icon: "🏗️",
    items: mk("und", [
      "Chassis rails straight", "Sills no corrosion", "Floor pans solid",
      "Subframes secure", "Exhaust system condition", "Catalytic converter present",
      "Fuel tank/lines secure", "No accident repair evidence", "Jacking points sound",
      "Underseal condition", "Spare wheel well dry", "No major rust"
    ], 2),
  },
  {
    id: "road_test",
    title: "Road Test",
    icon: "🛣️",
    items: mk("rt", [
      "Cold start performance", "Acceleration smooth through gears", "Steering tracks straight",
      "No vibration at speed (70mph)", "Brakes pull up straight", "ABS engages correctly",
      "Cruise control function", "Stop/start system works", "Engine temp normal", "No unusual noises during test"
    ], 2),
  },
  {
    id: "documents",
    title: "Documents & History",
    icon: "📄",
    items: mk("doc", [
      "V5C/registration document", "MOT certificate(s)", "Service history present",
      "Service book stamped", "Receipts/invoices", "Owner's handbook",
      "Spare key present", "HPI clear (no finance)", "Mileage matches MOT history", "Previous owners count plausible"
    ], 1),
  },
];

export const TOTAL_POINTS = INSPECTION_CHECKLIST.reduce(
  (sum, s) => sum + s.items.reduce((a, i) => a + i.points, 0),
  0
);

export interface ChecklistEntry {
  result: CheckResult;
  notes?: string;
  photo_url?: string;
}

export type ChecklistData = Record<string, ChecklistEntry>;

export function calculateScore(data: ChecklistData): { score: number; total: number; grade: string } {
  let earned = 0;
  let possible = 0;
  for (const section of INSPECTION_CHECKLIST) {
    for (const item of section.items) {
      const entry = data[item.id];
      if (!entry || entry.result === "na") continue;
      possible += item.points;
      if (entry.result === "pass") earned += item.points;
      else if (entry.result === "advisory") earned += item.points * 0.5;
      // fail = 0
    }
  }
  // Scale to TOTAL_POINTS so grade is consistent
  const score = possible > 0 ? Math.round((earned / possible) * TOTAL_POINTS) : 0;
  const pct = TOTAL_POINTS > 0 ? (score / TOTAL_POINTS) * 100 : 0;
  let grade = "F";
  if (pct >= 90) grade = "A";
  else if (pct >= 80) grade = "B";
  else if (pct >= 70) grade = "C";
  else if (pct >= 60) grade = "D";
  else if (pct >= 50) grade = "E";
  return { score, total: TOTAL_POINTS, grade };
}
