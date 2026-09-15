import React, { useState, useRef, useEffect } from "react";
import { 
  Users, 
  User, 
  AlertTriangle,
  Heart,
  Utensils,
  Wrench,
  Zap,
  FileText, 
  FileCode, 
  BookOpen,
  Droplets as Water,
  Plus,
  ShieldAlert,
  Pill,
  Flame,
  Stethoscope,
  Radio,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSun,
  Calendar,
  MessageSquare,
  Pin,
  List,
  Grid,
  CheckCircle2,
  Hammer,
  Sparkles,
  Cpu,
  Scissors,
  Gavel,
  Vote,
  MessageCircle,
  Hash,
  Send,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
  Activity,
  Maximize2,
  X,
  HelpCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  ChevronDown,
  Globe,
  ExternalLink,
  BatteryCharging,
  Gauge,
  TrendingUp,
  Handshake,
  Fuel,
  Wind
} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { Card, Button, cn, FileItem } from "./components/BrutalBase";
import { Sheet } from "./components/BrutalSheet";
import { TonerMap } from "./components/TonerMap";
import { 
  TransportCard, 
  TransportExpandedView, 
  type TransportEntry, 
  INITIAL_TRANSPORT_ENTRIES 
} from "./components/TransportWidget";
import { WelcomeModal } from "./components/WelcomeModal";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { SortableSection, DroppableColumn } from "./components/SortableSection";
import arielAvatar from "./assets/ariel.gif";

// Tooltip helper component
function Tip({ label, notImplemented = false, children }: { label: string; notImplemented?: boolean; children: React.ReactNode }) {
  return (
    <div className="relative group inline-flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
        <div className="bg-[#222D2C] text-[#FFFFFF] text-xs font-mono px-2 py-0.5 whitespace-nowrap border border-[#FFFFFF] shadow-md flex items-center gap-1">
          {notImplemented && <span className="bg-[#DF4C40] text-white px-1 py-0.2 text-xs font-bold">[NOT IMPLEMENTED]</span>}
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

// Data Interfaces & Constants: Labor & Tools Guild
export interface GuildTool {
  id: string;
  name: string;
  category: "Power" | "Electrical" | "Carpentry" | "Ag/Earth";
  status: "available" | "on_loan" | "maintenance";
  location?: string;
  borrower?: string;
  due?: string;
}

export interface LaborWorkOrder {
  id: string;
  title: string;
  shift: string;
  crew: number;
  lead: string;
  status: "scheduled" | "in_progress" | "completed";
  priority: "high" | "normal" | "low";
}

const INITIAL_TOOLS: GuildTool[] = [
  { id: "tl-1", name: "Stihl MS-271 20\" Farm Boss Chainsaw", category: "Power", status: "available", location: "Depot Shed B" },
  { id: "tl-2", name: "Makita 18V Brushless Combo Kit (Drill/Driver/Saw)", category: "Power", status: "on_loan", borrower: "Sarah K.", due: "Fri 18:00" },
  { id: "tl-3", name: "Fluke 87V DMM & MC4 Solar Crimper Kit", category: "Electrical", status: "available", location: "Depot Bench 1" },
  { id: "tl-4", name: "Gas Earth Auger 8\" Post Hole Digger", category: "Ag/Earth", status: "on_loan", borrower: "Agroforestry Crew", due: "Today 17:00" },
  { id: "tl-5", name: "DeWalt 12\" Sliding Compound Miter Saw", category: "Carpentry", status: "available", location: "Carpentry Bay" },
  { id: "tl-6", name: "Heavy Duty Fencing Post Pounder & Wire Grip", category: "Ag/Earth", status: "available", location: "Depot Shed A" },
];

const INITIAL_WORK_ORDERS: LaborWorkOrder[] = [
  { id: "wo-1", title: "Upper Montclair Timber Depot Framing", shift: "Sat 09:00", crew: 8, lead: "Elena R.", status: "scheduled", priority: "high" },
  { id: "wo-2", title: "Mills Tower RF Coax Inspection & Solar Wash", shift: "Today 16:30", crew: 2, lead: "Ariel C.", status: "in_progress", priority: "normal" },
  { id: "wo-3", title: "Cistern Pre-Filter Backwash & UV Inspection", shift: "Tomorrow 10:00", crew: 3, lead: "Marcus V.", status: "scheduled", priority: "normal" },
];

// Data: Microgrid Power Sources, Usage & 24h History
const POWER_SOURCES = [
  { name: "Solar MPPT Array", capacity: "2.4 kWp", output: "+1,240 W", status: "Active Peak", type: "solar" },
  { name: "Micro-Hydro Pelton", capacity: "500 W", output: "+380 W", status: "Continuous (14 L/s)", type: "hydro" },
  { name: "Honda EU2200i Backup Gen", capacity: "1.8 kW", output: "0 W", status: "Standby (95% Fuel)", type: "generator" },
];

const POWER_LOADS = [
  { name: "Cold Storage & Medical Refrigeration", draw: "-120 W", critical: true },
  { name: "915MHz LoRa Mesh Tower & Repeater", draw: "-45 W", critical: true },
  { name: "Tool Depot & Potable Well Pump", draw: "-215 W", critical: false },
];

const POWER_HISTORY_24H = [
  { time: "00h", gen: 380, load: 310 },
  { time: "03h", gen: 380, load: 290 },
  { time: "06h", gen: 520, load: 340 },
  { time: "09h", gen: 1250, load: 410 },
  { time: "12h", gen: 1820, load: 490 },
  { time: "15h", gen: 1620, load: 380 },
  { time: "18h", gen: 680, load: 430 },
  { time: "21h", gen: 380, load: 360 },
];

// Data: Neighboring Communities
export interface NeighborCommunity {
  id: string;
  name: string;
  zone: string;
  distance: string;
  direction: string;
  official: {
    name: string;
    role: string;
    callsign: string;
    channel: string;
  };
  linkDesc: string;
  surplus: string[];
  seeking: string[];
  pactStatus: string;
}

const NEIGHBOR_COMMUNITIES: NeighborCommunity[] = [
  {
    id: "paterson",
    name: "Paterson Autonomous Guild",
    zone: "Zone 01",
    distance: "6.2 mi",
    direction: "North",
    official: {
      name: "Marcus Vance",
      role: "Regional Comms & Logistics Envoy",
      callsign: "KN2-PAT-01",
      channel: "LoRa Mesh Ch 04 (915.2 MHz)",
    },
    linkDesc: "Direct 915MHz Packet Mesh Link",
    surplus: ["Milled Lumber", "Stoneground Flour", "Canning Jars"],
    seeking: ["Sterile Antibiotics", "Solar Charge Controllers"],
    pactStatus: "Active Compact",
  },
  {
    id: "bloomfield",
    name: "Bloomfield Resiliency Hub",
    zone: "Zone 03",
    distance: "3.8 mi",
    direction: "East",
    official: {
      name: "Elena Rostova",
      role: "Energy Guild & Microgrid Liaison",
      callsign: "KN2-BLM-03",
      channel: "2.4GHz PtP Wi-Fi Bridge",
    },
    linkDesc: "Directional Wi-Fi Bridge",
    surplus: ["48V LiFePO4 Cells", "12V Pure Sine Inverters"],
    seeking: ["Chainsaw Chains", "Hardwood Timber", "Seedlings"],
    pactStatus: "Active Compact",
  },
  {
    id: "newark",
    name: "Newark Ironbound Eco-Union",
    zone: "Zone 07",
    distance: "9.5 mi",
    direction: "South",
    official: {
      name: "David Chen",
      role: "Regional Agricultural Dispatcher",
      callsign: "KN2-NWK-07",
      channel: "Courier Runner / APRS 144.39",
    },
    linkDesc: "Bi-Weekly Cargo Courier / APRS",
    surplus: ["Heirloom Seed Stock", "Organic Compost", "Raw Honey"],
    seeking: ["Potable Water Tabs", "UV Sterilizer Bulbs"],
    pactStatus: "Active Compact",
  },
];

// Color Mapping for Help Mode Overlay Title Bar (matches section clicked)
const SECTION_COLOR_MAP: Record<string, { bg: string; text: string; accentBorder: string }> = {
  overview: { bg: "bg-[#005EAC]", text: "text-white", accentBorder: "border-[#005EAC]" },
  general: { bg: "bg-[#005EAC]", text: "text-white", accentBorder: "border-[#005EAC]" },
  map: { bg: "bg-[#222D2C]", text: "text-white", accentBorder: "border-[#222D2C]" },
  bulletin: { bg: "bg-[#005EAC]", text: "text-white", accentBorder: "border-[#005EAC]" },
  discussions: { bg: "bg-[#8F57CB]", text: "text-white", accentBorder: "border-[#8F57CB]" },
  about: { bg: "bg-[#222D2C]", text: "text-[#FAD13E]", accentBorder: "border-[#FAD13E]" },
  matcher: { bg: "bg-[#005EAC]", text: "text-white", accentBorder: "border-[#005EAC]" },
  transport: { bg: "bg-[#0F5257]", text: "text-white", accentBorder: "border-[#0F5257]" },
  ariel_projects: { bg: "bg-[#222D2C]", text: "text-[#FAD13E]", accentBorder: "border-[#FAD13E]" },
  calendar: { bg: "bg-[#3CCC23]", text: "text-white", accentBorder: "border-[#3CCC23]" },
  governance: { bg: "bg-[#0F3D64]", text: "text-white", accentBorder: "border-[#0F3D64]" },
  labor: { bg: "bg-[#FF9600]", text: "text-white", accentBorder: "border-[#FF9600]" },
  power: { bg: "bg-[#3CCC23]", text: "text-white", accentBorder: "border-[#3CCC23]" },
  water: { bg: "bg-[#3ABEAE]", text: "text-white", accentBorder: "border-[#3ABEAE]" },
  neighbors: { bg: "bg-[#0F5257]", text: "text-white", accentBorder: "border-[#0F5257]" },
  mesh: { bg: "bg-[#FF9600]", text: "text-white", accentBorder: "border-[#FF9600]" },
  nature: { bg: "bg-[#FAD13E]", text: "text-[#222D2C]", accentBorder: "border-[#FAD13E]" },
  comms: { bg: "bg-[#005EAC]", text: "text-white", accentBorder: "border-[#005EAC]" },
  knowledge: { bg: "bg-[#8F57CB]", text: "text-white", accentBorder: "border-[#8F57CB]" },
};

function App() {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"take" | "give">("take");
  const [bulletinViewMode, setBulletinViewMode] = useState<"pinboard" | "list">("pinboard");

  // Window Management States: Expand & Shade
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [shadedSections, setShadedSections] = useState<{ [key: string]: boolean }>({});

  // Interactive Help Mode State
  const [isHelpMode, setIsHelpMode] = useState(false);
  const [helpOverlay, setHelpOverlay] = useState<{ title: string; sectionId: string } | null>(null);

  // Welcome / Manifesto Pop-Up (triggered on first entry to site, or reopened on demand)
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem("caz_welcome_seen") !== "true";
    } catch {
      return true;
    }
  });

  // Accessibility: Large Text Mode (persisted in localStorage)
  const [isLargeText, setIsLargeText] = useState<boolean>(() => {
    try {
      return localStorage.getItem("taz_large_text") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isLargeText) {
      document.documentElement.classList.add("text-enlarged");
    } else {
      document.documentElement.classList.remove("text-enlarged");
    }
    try {
      localStorage.setItem("taz_large_text", String(isLargeText));
    } catch (err) {
      console.warn("Failed to persist large text mode", err);
    }
  }, [isLargeText]);

  // Theme Mode: "system" | "dark" | "light" (defaults to system preference)
  const [themeMode, setThemeMode] = useState<"system" | "dark" | "light">(() => {
    try {
      const saved = localStorage.getItem("taz_theme_mode");
      if (saved === "dark" || saved === "light" || saved === "system") return saved;
    } catch {}
    return "system";
  });

  const [isDarkEffective, setIsDarkEffective] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => {
      const isSystemDark = mediaQuery.matches;
      const effectiveDark = themeMode === "dark" || (themeMode === "system" && isSystemDark);
      setIsDarkEffective(effectiveDark);
      if (effectiveDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);
    try {
      localStorage.setItem("taz_theme_mode", themeMode);
    } catch {}

    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      // Cycle: system -> dark -> light -> system
      if (prev === "system") return isDarkEffective ? "light" : "dark";
      if (prev === "dark") return "light";
      return "dark";
    });
  };

  // Local Comms Filter & Message State
  const [commsFilter, setCommsFilter] = useState<"all" | "ariel" | "mesh" | "emergency">("all");
  const [newCommsMessage, setNewCommsMessage] = useState("");

  // Listen for Map navigation events
  useEffect(() => {
    const handleNav = (e: any) => {
      const sectionId = e.detail?.sectionId;
      if (!sectionId) return;
      if (expandedSection) {
        setExpandedSection(sectionId);
      } else {
        const el = document.getElementById(`section-${sectionId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-[#005EAC]");
          setTimeout(() => el.classList.remove("ring-4", "ring-[#005EAC]"), 2000);
        }
      }
    };
    window.addEventListener("taz-navigate-section", handleNav);
    return () => window.removeEventListener("taz-navigate-section", handleNav);
  }, [expandedSection]);

  const triggerSectionHelp = (title: string, sectionId: string, e?: React.MouseEvent) => {
    if (isHelpMode) {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setHelpOverlay({ title, sectionId });
    }
  };

  const toggleShade = (sectionKey: string) => {
    // Shading disabled if currently expanded
    if (expandedSection) return;
    setShadedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const toggleExpand = (sectionKey: string) => {
    if (expandedSection === sectionKey) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionKey);
      // Unshade when expanding
      setShadedSections(prev => ({ ...prev, [sectionKey]: false }));
    }
  };

  // SOS State
  const [sosProgress, setSosProgress] = useState(0);
  const [isHoldingSos, setIsHoldingSos] = useState(false);
  const sosInterval = useRef<number | null>(null);

  const handleSosStart = () => {
    setIsHoldingSos(true);
    const startTime = Date.now();
    sosInterval.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setSosProgress(progress);
      if (progress >= 100) {
        if (sosInterval.current) clearInterval(sosInterval.current);
        alert("🚨 EMERGENCY SOS BROADCASTED TO MESH NETWORK");
        setIsHoldingSos(false);
        setSosProgress(0);
      }
    }, 50);
  };

  const handleSosEnd = () => {
    setIsHoldingSos(false);
    setSosProgress(0);
    if (sosInterval.current) clearInterval(sosInterval.current);
  };

  // Config for Dynamic Top Bar when any section expands
  const SECTION_CONFIGS: { [key: string]: { title: string; color: string; subtitle: string } } = {
    map: { title: "CARTOGRAPHY", color: "bg-[#222D2C] text-white", subtitle: "// LOCAL ZONE CARTOGRAPHY — UPPER MONTCLAIR / MSU / MILLS RESERVATION" },
    matcher: { title: "MUTUAL AID", color: "bg-[#005EAC] text-white", subtitle: "// PEER-TO-PEER MUTUAL AID MATCHER — FULL DIRECTORY" },
    transport: { title: "TRANSPORT & DISPATCH", color: "bg-[#0F5257] text-white", subtitle: "// LOCAL ZONE RIDESHARE, PASSAGE & CARGO DISPATCH" },
    calendar: { title: "CALENDAR", color: "bg-[#3CCC23] text-white", subtitle: "// COMMUNITY CALENDAR, BARN RAISING & FELLOWSHIP WORKSHOPS" },
    bulletin: { title: "BULLETIN", color: "bg-[#FAD13E] !text-[#222D2C]", subtitle: "// COMMUNITY BULLETIN & NEIGHBORHOOD PIN BOARD" },
    discussions: { title: "DISCUSSIONS", color: "bg-[#8F57CB] text-white", subtitle: "// TOPICAL DELIBERATION & WORKING GROUP HUBS" },
    governance: { title: "GOVERNANCE", color: "bg-[#0F3D64] text-white", subtitle: "// DIRECT CONSENSUS DEMOCRACY & GENERAL ASSEMBLY" },
    labor: { title: "LABOR", color: "bg-[#FF9600] text-white", subtitle: "// COLLECTIVE WORK ROSTER & INFRASTRUCTURE REPAIRS" },
    power: { title: "MICROGRID", color: "bg-[#3CCC23] text-white", subtitle: "// MICROGRID TELEMETRY & SOLAR STORAGE BANK" },
    water: { title: "WATER", color: "bg-[#3ABEAE] text-white", subtitle: "// WATER RESERVES, PURITY TESTING & CATCHMENT GAUGES" },
    mesh: { title: "MESH NET", color: "bg-[#FF9600] text-white", subtitle: "// 915 MHz LORA MESH NETWORK TOPOLOGY & ROUTING" },
    nature: { title: "NATURE CLOCK", color: "bg-[#FAD13E] !text-[#222D2C]", subtitle: "// SOLAR EPHEMERIS, TIDAL CLOCK & REGIONAL WEATHER" },
    comms: { title: "COMMS", color: "bg-[#005EAC] text-white", subtitle: "// ENCRYPTED LOCAL MESH RADIO MESSENGER" },
    knowledge: { title: "KNOWLEDGE", color: "bg-[#8F57CB] text-white", subtitle: "// OFFLINE EMERGENCY KNOWLEDGE BASE & MANUALS" },
    neighbors: { title: "NEIGHBORS", color: "bg-[#0F5257] text-white", subtitle: "// REGIONAL FEDERATION, DESIGNATED ENVOYS & TRADE COMPACTS" },
    about: { title: "ABOUT CAZ", color: "bg-[#222D2C] text-white", subtitle: "// COMMUNITY AUTONOMOUS ZONE OS — ARCHITECTURAL MANIFESTO" },
  };

  const currentSectionConfig = expandedSection ? SECTION_CONFIGS[expandedSection] : null;

  // Data: Transport & Rideshare Dispatch
  const [transportEntries, setTransportEntries] = useState<TransportEntry[]>(INITIAL_TRANSPORT_ENTRIES);

  const handleAddTransport = (newEntry: Omit<TransportEntry, "id" | "timestamp">) => {
    const created: TransportEntry = {
      ...newEntry,
      id: `tr-${Date.now()}`,
      timestamp: "Just now"
    };
    setTransportEntries(prev => [created, ...prev]);
  };

  const handleClaimTransport = (id: string) => {
    setTransportEntries(prev => prev.map(item => item.id === id ? { ...item, claimed: true, claimedBy: "Ariel Churi (Node #742)" } : item));
  };

  // Data: Labor & Tools State
  const [tools, setTools] = useState<GuildTool[]>(INITIAL_TOOLS);
  const [workOrders, setWorkOrders] = useState<LaborWorkOrder[]>(INITIAL_WORK_ORDERS);
  const [selectedToolCategory, setSelectedToolCategory] = useState<string>("all");

  // State: Inter-Zone Federation Trade & Aid Dispatch Modal
  const [interZoneModal, setInterZoneModal] = useState<{
    open: boolean;
    type: "trade" | "request";
    community: NeighborCommunity;
  } | null>(null);
  const [interZoneMessage, setInterZoneMessage] = useState("");
  const [interZoneMedium, setInterZoneMedium] = useState<"mesh" | "courier">("mesh");
  const [interZoneSent, setInterZoneSent] = useState(false);

  // Data: Mutual Aid Matcher
  const needs = [
    { id: 1, type: "Water", icon: <Water size={13} />, title: "Potable Water (20L)", urgency: "Critical", user: "Camp 3", time: "10m ago", category: "water", color: "text-[#3ABEAE] border-[#3ABEAE]" },
    { id: 2, type: "Medical", icon: <Pill size={13} />, title: "Insulin (Refrigerated)", urgency: "Critical", user: "Sector B", time: "25m ago", category: "medical", color: "text-[#DF4C40] border-[#DF4C40]" },
    { id: 3, type: "Power", icon: <Zap size={13} />, title: "12V Battery Pack (LiFePO4)", urgency: "Medium", user: "Comms Tower", time: "1h ago", category: "power", color: "text-[#FF9600] border-[#FF9600]" },
    { id: 4, type: "Food", icon: <Utensils size={13} />, title: "Dry Grains / Rice (10kg)", urgency: "Low", user: "Kitchen 1", time: "2h ago", category: "food", color: "text-[#3CCC23] border-[#3CCC23]" },
    { id: 5, type: "Tools", icon: <Wrench size={13} />, title: "MC4 Solar Crimping Tool", urgency: "Medium", user: "Array #2", time: "3h ago", category: "power", color: "text-[#005EAC] border-[#005EAC]" },
  ];

  const offers = [
    { id: 1, type: "Skills", icon: <Wrench size={13} />, title: "Electrical & Inverter Diagnostics", user: "Alex (Eng)", available: "Immediate", category: "power", color: "text-[#005EAC] border-[#005EAC]" },
    { id: 2, type: "Medical", icon: <Stethoscope size={13} />, title: "Basic First Aid & Wound Dressing", user: "Nurse Sarah", available: "On-Call", category: "medical", color: "text-[#DF4C40] border-[#DF4C40]" },
    { id: 3, type: "Tools", icon: <Flame size={13} />, title: "Propane 2-Burner Stove + 2 Tanks", user: "Outpost 4", available: "Until Night", category: "food", color: "text-[#FF9600] border-[#FF9600]" },
    { id: 4, type: "Water", icon: <Water size={13} />, title: "Katadyn Gravity Filter (10L/hr)", user: "Shelter 7", available: "Shared", category: "water", color: "text-[#3ABEAE] border-[#3ABEAE]" },
  ];

  // Data: Calendar Events
  const calendarEvents = [
    {
      id: "ev-1",
      date: "SAT SEP 5",
      time: "08:00 - 13:00",
      title: "Amish-Style Timber Framing (Barn Raising)",
      type: "Group Volunteer Labor",
      tagColor: "bg-[#FF9600] text-white",
      location: "Upper Montclair Field #2",
      icon: <Hammer size={12} />,
      rsvpCount: 28,
    },
    {
      id: "ev-2",
      date: "SUN SEP 6",
      time: "17:30 - 19:30",
      title: "Weekly Fellowship & Potluck Circle",
      type: "Fellowship Meeting",
      tagColor: "bg-[#3CCC23] text-white",
      location: "Mills Reservation Overlook",
      icon: <Heart size={12} />,
      rsvpCount: 45,
    },
    {
      id: "ev-3",
      date: "TUE SEP 8",
      time: "15:00 - 18:00",
      title: "Herbal Tinctures & Salve Making",
      type: "Handcraft Workshop",
      tagColor: "bg-[#8F57CB] text-white",
      location: "Yantacaw Herb Garden",
      icon: <Scissors size={12} />,
      rsvpCount: 16,
    },
    {
      id: "ev-4",
      date: "THU SEP 10",
      time: "18:00 - 21:00",
      title: "LoRa Mesh Node Assembly & Battery Re-Celling",
      type: "Advanced Tech Workshop",
      tagColor: "bg-[#005EAC] text-white",
      location: "MSU Maker Lab (Richardson Hall)",
      icon: <Cpu size={12} />,
      rsvpCount: 22,
    },
  ];

  // Data: Bulletin / Social Board
  const bulletins = [
    {
      id: "b-1",
      title: "Community Honey & Apple Harvest",
      author: "Orchard Cooperative",
      date: "2h ago",
      tag: "COMMUNITY SURPLUS",
      tagColor: "bg-[#3CCC23] text-white",
      content: "Picked 4 crates of Gala apples and fresh comb honey. Stored in Upper Montclair pantry. Free for all families.",
      isPinned: true,
    },
    {
      id: "b-2",
      title: "Nightly Ham Radio Net (146.520 MHz)",
      author: "W2NJ Amateur Net",
      date: "5h ago",
      tag: "COMMS NOTICE",
      tagColor: "bg-[#005EAC] text-white",
      content: "Simplex check-in at 20:00. Practice emergency relay from Mills Reservation high point down to Valley Road.",
      isPinned: true,
    },
    {
      id: "b-3",
      title: "Seeking 24V Inverter for Solar Well Pump",
      author: "Water Squad",
      date: "1d ago",
      tag: "URGENT REQUEST",
      tagColor: "bg-[#DF4C40] text-white",
      content: "Main pump tripped thermal fuse. Need 1000W pure sine wave inverter to keep irrigation pressurized.",
      isPinned: false,
    },
    {
      id: "b-4",
      title: "Handmade Wool Blankets Available",
      author: "Weavers Guild",
      date: "2d ago",
      tag: "HANDCRAFT",
      tagColor: "bg-[#8F57CB] text-white",
      content: "Finished 5 heavy wool blankets from local fleece. Available for infants or elders at Clinic 1.",
      isPinned: false,
    },
  ];

  // Data: Discussion Topic Areas
  const discussionTopics = [
    {
      id: "dt-1",
      name: "General Assembly & Direct Governance",
      desc: "Proposals, quorum consensus, neighborhood charters & resource allocation",
      activeMembers: 38,
      postsCount: 142,
      unreadCount: 3,
    },
    {
      id: "dt-2",
      name: "Microgrid & Off-Grid Energy Systems",
      desc: "Solar MPPT arrays, battery banks, load balancing & inverter maintenance",
      activeMembers: 24,
      postsCount: 89,
      unreadCount: 0,
    },
    {
      id: "dt-3",
      name: "Food Sovereignty & Permaculture",
      desc: "Community orchards, seed banking, compost heaters & seasonal foraging",
      activeMembers: 31,
      postsCount: 112,
      unreadCount: 7,
    },
    {
      id: "dt-4",
      name: "Emergency Medicine, Sanitation & Triage",
      desc: "First aid supplies, medicine refrigeration, water testing & hygiene protocol",
      activeMembers: 19,
      postsCount: 64,
      unreadCount: 1,
    },
    {
      id: "dt-5",
      name: "Mesh Networking & Open Hardware",
      desc: "LoRa packet routing, firmware, antenna tuning & encrypted local mail",
      activeMembers: 29,
      postsCount: 97,
      unreadCount: 4,
    },
    {
      id: "dt-6",
      name: "Craft, Tool Guilds & Barn Raising",
      desc: "Carpentry, blacksmithing, leatherwork, welding & collective labor rosters",
      activeMembers: 22,
      postsCount: 51,
      unreadCount: 0,
    },
  ];

  // Data: Ariel Churi's Community Projects & Work Orders
  const arielProjects = [
    {
      id: "proj-1",
      title: "MSU 50kW Emergency Solar Canopy & MPPT Intertie",
      location: "Montclair State University Campus [B7]",
      role: "Lead Electrical Engineer",
      progress: 75,
      status: "Configuring 48V MPPT charge controllers and DC-coupled battery isolation switches.",
      deadline: "In Progress (Due Friday)",
      volunteers: 4,
      priority: "CRITICAL",
      priorityColor: "bg-[#DF4C40] text-white",
    },
    {
      id: "proj-2",
      title: "Mills Reservation High-Altitude LoRa Mast Maintenance",
      location: "Mills Normal Ave Basalt Overlook [A4]",
      role: "RF Systems Tech",
      progress: 90,
      status: "Quarterly inspection of solar mast, lightning arrestor, and 915MHz coax integrity.",
      deadline: "Scheduled Inspection",
      volunteers: 2,
      priority: "HIGH",
      priorityColor: "bg-[#FF9600] text-white",
    },
    {
      id: "proj-3",
      title: "Upper Montclair Timber Depot Framing & Joinery",
      location: "Valley Rd & Bellevue Ave Staging Yard [C4]",
      role: "Volunteer Crew Lead",
      progress: 40,
      status: "Staging volunteer timber framing, post mortises, and oak pegs for Saturday barn-raising.",
      deadline: "Saturday 09:00",
      volunteers: 8,
      priority: "COMMUNITY",
      priorityColor: "bg-[#3CCC23] text-white",
    },
    {
      id: "proj-4",
      title: "Nishuane Springhead Charcoal Bio-Filter Upgrade",
      location: "Nishuane Park Springhouse [H4]",
      role: "Water Systems Designer",
      progress: 20,
      status: "Sourcing activated hardwood bio-char and food-grade HDPE cistern overflow valves.",
      deadline: "Planning Phase",
      volunteers: 3,
      priority: "PLANNED",
      priorityColor: "bg-[#005EAC] text-white",
    },
  ];

  const filteredNeeds = activeFilter === "all" ? needs : needs.filter(n => n.category === activeFilter);
  const filteredOffers = activeFilter === "all" ? offers : offers.filter(o => o.category === activeFilter);


  // Canonical column layout
  const DEFAULT_COLUMNS: { [key: string]: string[] } = {
    col1: ["map", "bulletin", "discussions"],
    col2: ["about", "matcher", "transport", "ariel_projects", "governance"],
    col3: ["calendar", "labor", "power", "water", "neighbors"],
    col4: ["mesh", "nature", "comms", "knowledge"],
  };

  const STORAGE_KEY = "taz_dashboard_columns_v2";

  const [columns, setColumns] = useState<{ [key: string]: string[] }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const allKeys = ["col1", "col2", "col3", "col4"];
        const hasAllKeys = allKeys.every(k => Array.isArray(parsed[k]));
        if (hasAllKeys) {
          const allSectionIds = Object.values(parsed).flat();
          const expectedIds = Object.values(DEFAULT_COLUMNS).flat();
          const hasAllSections = expectedIds.every(id => allSectionIds.includes(id));
          if (hasAllSections) {
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load layout from localStorage", err);
    }
    return DEFAULT_COLUMNS;
  });

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const isLayoutModified = JSON.stringify(columns) !== JSON.stringify(DEFAULT_COLUMNS);

  const resetLayout = () => {
    setColumns(DEFAULT_COLUMNS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COLUMNS));
    } catch (err) {
      console.warn("Failed to reset layout in localStorage", err);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 220,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: string): string | undefined => {
    if (id in columns) return id;
    return Object.keys(columns).find(key => columns[key].includes(id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeCol = findContainer(activeId);
    const overCol = findContainer(overId);

    if (!activeCol || !overCol || activeCol === overCol) {
      return;
    }

    setColumns(prev => {
      const activeItems = [...prev[activeCol]];
      const overItems = [...prev[overCol]];

      const activeIndex = activeItems.indexOf(activeId);
      const overIndex = overItems.indexOf(overId);

      let newIndex: number;
      if (overId in prev) {
        newIndex = overItems.length;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
      }

      activeItems.splice(activeIndex, 1);
      overItems.splice(newIndex, 0, activeId);

      return {
        ...prev,
        [activeCol]: activeItems,
        [overCol]: overItems,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeCol = findContainer(activeId);
    const overCol = findContainer(overId);

    if (!activeCol || !overCol) return;

    const activeIndex = columns[activeCol].indexOf(activeId);
    const overIndex = columns[overCol].indexOf(overId);

    if (activeCol === overCol) {
      if (activeIndex !== overIndex && activeIndex !== -1 && overIndex !== -1) {
        const updated = {
          ...columns,
          [activeCol]: arrayMove(columns[activeCol], activeIndex, overIndex),
        };
        setColumns(updated);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
          console.warn("Failed to save layout", err);
        }
      } else {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
        } catch (err) {
          console.warn("Failed to save layout", err);
        }
      }
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
      } catch (err) {
        console.warn("Failed to save layout", err);
      }
    }
  };

  const renderSection = (id: string, dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>) => {
    switch (id) {
      case "map":
        return (
            <div id="section-map" data-section-id="map" data-section-title="Local Zone Cartography">
            <Card
      dragHandleProps={dragHandleProps} 
              onClickCapture={(e) => isHelpMode && triggerSectionHelp("Local Zone Cartography", "map", e)}
              title="Local Zone Cartography" 
              accentColor="bg-[#222D2C]"
              badge={<span className="text-xs font-mono uppercase bg-white/20 px-1 py-0.2">TONER</span>}
              hint="Toner map of Upper Montclair, MSU, and Mills Reservation with fixed 500m letter/number grid."
              isShaded={shadedSections["map"]}
              onToggleShade={() => toggleShade("map")}
              isExpanded={expandedSection === "map"}
              onToggleExpand={() => toggleExpand("map")}
              noBodyPadding={true}
              className="dashboard-map-card shrink-0 flex flex-col"
            >
              <div className="w-full h-full m-0 p-0 overflow-hidden flex-1 relative">
                <TonerMap isFullscreen={false} />
              </div>
            </Card>
            </div>
        );

      case "bulletin":
        return (
<div id="section-bulletin" data-section-id="bulletin" data-section-title="Community Bulletin Board">
            <Card
      dragHandleProps={dragHandleProps}
              onClickCapture={(e) => isHelpMode && triggerSectionHelp("Community Bulletin Board", "bulletin", e)}
              title="Community Bulletin Board"
              accentColor="bg-[#FAD13E] !text-[#222D2C]"
              badge={<span className="text-xs font-mono uppercase bg-black/10 px-1 py-0.2">{bulletinViewMode.toUpperCase()}</span>}
              headerActions={
                <div className="flex items-center gap-1">
                  <Tip label="Pin Board Grid View">
                    <button
                      onClick={() => setBulletinViewMode("pinboard")}
                      className={cn(
                        "w-[20px] h-[20px] flex items-center justify-center border transition-colors cursor-pointer",
                        bulletinViewMode === "pinboard" ? "bg-[#222D2C] text-white border-[#222D2C]" : "bg-white text-[#222D2C] border-[#222D2C]"
                      )}
                      style={{ borderRadius: 0 }}
                    >
                      <Grid size={11} />
                    </button>
                  </Tip>
                  <Tip label="Compact List View">
                    <button
                      onClick={() => setBulletinViewMode("list")}
                      className={cn(
                        "w-[20px] h-[20px] flex items-center justify-center border transition-colors cursor-pointer",
                        bulletinViewMode === "list" ? "bg-[#222D2C] text-white border-[#222D2C]" : "bg-white text-[#222D2C] border-[#222D2C]"
                      )}
                      style={{ borderRadius: 0 }}
                    >
                      <List size={11} />
                    </button>
                  </Tip>
                  <Tip label="Pin new flyer" notImplemented={true}>
                    <Button variant="outline" size="xs" className="h-[20px] px-1.5 text-xs !bg-white">
                      <Plus size={10} /> Pin
                    </Button>
                  </Tip>
                </div>
              }
              hint="Neighborhood notices, flyers, surplus announcements & pin board."
              isShaded={shadedSections["bulletin"]}
              onToggleShade={() => toggleShade("bulletin")}
              isExpanded={expandedSection === "bulletin"}
              onToggleExpand={() => toggleExpand("bulletin")}
            >
              {bulletinViewMode === "pinboard" ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {bulletins.map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        "p-2 border flex flex-col justify-between relative transition-transform hover:-translate-y-0.5",
                        b.isPinned ? "bg-[#FFFFFF] border-[#222D2C]" : "bg-[#EFECE6] border-[#BCBCB8]"
                      )}
                      style={{ boxShadow: "1px 1px 1px 0 rgba(128,128,128,0.25)", borderRadius: 0 }}
                    >
                      <div>
                        {b.isPinned && (
                          <div className="absolute top-1.5 right-1.5 text-[#DF4C40] flex items-center">
                            <Pin size={10} className="fill-[#DF4C40]" />
                          </div>
                        )}
                        <span className={cn("text-xs font-mono font-bold px-1 py-0.2 inline-block uppercase mb-1", b.tagColor)}>
                          {b.tag}
                        </span>
                        <div className="font-bold text-xs text-[#222D2C] leading-tight mb-1">{b.title}</div>
                        <p className="text-xs text-[#5B6360] leading-snug line-clamp-3">{b.content}</p>
                      </div>
                      <div className="font-mono text-xs text-[#909390] mt-2 pt-1 border-t border-[#222D2C]/10 flex justify-between">
                        <span>{b.author}</span>
                        <span>{b.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {bulletins.map((b) => (
                    <div
                      key={b.id}
                      className="p-1.5 bg-[#FFFFFF] border border-[#222D2C] flex items-center justify-between gap-2 hover:border-[#005EAC] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Pin size={12} className={b.isPinned ? "text-[#DF4C40] fill-[#DF4C40]" : "text-[#909390]"} />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#222D2C] truncate leading-tight">{b.title}</div>
                          <div className="font-mono text-xs text-[#5B6360]">{b.author} • {b.date}</div>
                        </div>
                      </div>
                      <span className={cn("text-xs font-mono font-bold px-1 py-0.2 shrink-0", b.tagColor)}>
                        {b.tag}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
</div>
        );

      case "discussions":
        return (
<div id="section-discussions" data-section-id="discussions" data-section-title="Discussion Topic Areas">
            <Card
              dragHandleProps={dragHandleProps}
              onClickCapture={(e: React.MouseEvent) => isHelpMode && triggerSectionHelp("Discussion Topic Areas", "discussions", e)}
              title="Discussion Topic Areas"
              accentColor="bg-[#8F57CB] text-white"
              badge={<span className="text-xs font-mono uppercase bg-white/20 px-1 py-0.2">FORUMS</span>}
              hint="Topical working groups across the mesh community."
              isShaded={shadedSections["discussions"]}
              onToggleShade={() => toggleShade("discussions")}
              isExpanded={expandedSection === "discussions"}
              onToggleExpand={() => toggleExpand("discussions")}
            >
              <div className="flex flex-col gap-1.5">
                {discussionTopics.map((topic) => (
                  <Tip key={topic.id} label={`Enter ${topic.name}`} notImplemented={true}>
                    <div className="w-full p-2 bg-[#EFECE6] border border-[#222D2C] hover:border-[#8F57CB] cursor-pointer transition-colors flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-start gap-2">
                        <div className="p-1 bg-[#FFFFFF] border border-[#222D2C] shrink-0 mt-0.5">
                          <Hash size={12} className="text-[#8F57CB]" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="font-bold text-xs text-[#222D2C] leading-tight truncate">{topic.name}</div>
                          <p className="text-xs text-[#5B6360] truncate leading-tight mt-0.5">{topic.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                        <span className="text-[#5B6360] bg-[#FFFFFF] border border-[#222D2C] px-1 py-0.5">{topic.activeMembers} peers</span>
                        {topic.unreadCount > 0 && <span className="bg-[#DF4C40] text-white px-1 py-0.5 font-bold">{topic.unreadCount} new</span>}
                      </div>
                    </div>
                  </Tip>
                ))}
              </div>
            </Card>
</div>
        );

      case "about":
        return (
            <div id="section-about" data-section-id="about" data-section-title="About CAZ OS: Non-Hierarchical Self-Management">
              <Card
      dragHandleProps={dragHandleProps}
                onClickCapture={(e) => isHelpMode && triggerSectionHelp("About CAZ OS: Non-Hierarchical Self-Management", "about", e)}
                title="About CAZ OS: Non-Hierarchical Community Self-Management"
                accentColor="bg-[#222D2C] text-white"
                badge={<span className="text-xs font-mono uppercase bg-[#FAD13E] text-[#222D2C] px-1.5 py-0.2 font-bold">ALPHA // WIP</span>}
                hint="Decentralized peer-to-peer system for community self-management without mayors, bosses, or central authority."
                isShaded={shadedSections["about"]}
                onToggleShade={() => toggleShade("about")}
                isExpanded={expandedSection === "about"}
                onToggleExpand={() => toggleExpand("about")}
              >
                <div className="space-y-2.5 text-xs text-[#222D2C] leading-snug">
                  {/* Top WIP Callout */}
                  <div className="p-2 bg-[#FAD13E]/20 border border-[#FAD13E] flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                    <div className="flex items-center gap-2 text-[#222D2C]">
                      <span className="w-2.5 h-2.5 bg-[#FF9600] rounded-full animate-ping inline-block shrink-0" />
                      <span className="font-bold">ACTIVE WORK IN PROGRESS (WIP) // SECTOR 4 LOCAL NODE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href="https://github.com/arielchuri/TAZ"
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#222D2C] hover:bg-[#005EAC] text-white px-2 py-0.5 font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>📂 GitHub Repo</span>
                      </a>
                      <button
                        data-help-toggle="true"
                        onClick={() => {
                          const next = !isHelpMode;
                          setIsHelpMode(next);
                          if (next) {
                            setHelpOverlay({ title: "CAZ OS Tutorial & Navigation", sectionId: "overview" });
                          } else {
                            setHelpOverlay(null);
                          }
                        }}
                        className={cn(
                          "px-2 py-0.5 font-bold uppercase border flex items-center gap-1 cursor-pointer transition-colors shadow-sm",
                          isHelpMode 
                            ? "bg-[#FAD13E] text-[#222D2C] border-[#222D2C] font-black animate-pulse" 
                            : "bg-[#222D2C] hover:bg-[#005EAC] text-white border-[#222D2C]"
                        )}
                      >
                        <HelpCircle size={11} className={isHelpMode ? "text-[#DF4C40]" : "text-[#FAD13E]"} />
                        <span>{isHelpMode ? "HELP: ACTIVE [ON]" : "❓ TUTORIAL HELP"}</span>
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Balanced Interior: Left = Manifesto & Pillars, Right = Open Source Hosting & Instructions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Left: Manifesto & 4 Pillars */}
                    <div className="space-y-2">
                      <div className="p-2.5 bg-[#FFFFFF] border-2 border-[#222D2C] shadow-sm">
                        <div className="font-black text-xs text-[#222D2C] uppercase mb-1 flex items-center gap-1.5 font-mono">
                          <span className="w-2 h-2 bg-[#3CCC23] inline-block" />
                          <span>Manage Your Community Without Hierarchy</span>
                        </div>
                        <p className="text-[#3E4846] text-xs leading-relaxed">
                          <strong>CAZ OS</strong> is an open-source tool for neighborhood self-management. There are <strong>no mayors, no bosses, and no centralized bureaucracies</strong>. Decisions are made through direct consensus democracy, resources are pooled through horizontal mutual aid, and labor is organized collectively (barn-raising).
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                        <div className="p-1.5 bg-[#FFFFFF] border border-[#222D2C]">
                          <div className="font-bold text-[#DF4C40] flex items-center gap-1">
                            <Vote size={11} className="text-[#DF4C40]" />
                            <span>1. DIRECT CONSENSUS</span>
                          </div>
                          <p className="text-[#5B6360] text-xs mt-0.5 leading-tight">
                            Horizontal decision-making with supermajority voting and no executive bosses.
                          </p>
                        </div>

                        <div className="p-1.5 bg-[#FFFFFF] border border-[#222D2C]">
                          <div className="font-bold text-[#005EAC] flex items-center gap-1">
                            <Heart size={11} className="text-[#005EAC]" />
                            <span>2. MUTUAL AID</span>
                          </div>
                          <p className="text-[#5B6360] text-xs mt-0.5 leading-tight">
                            Needs & offers matched bilaterally without currency, landlords, or middlemen.
                          </p>
                        </div>

                        <div className="p-1.5 bg-[#FFFFFF] border border-[#222D2C]">
                          <div className="font-bold text-[#8F57CB] flex items-center gap-1">
                            <Hammer size={11} className="text-[#8F57CB]" />
                            <span>3. BARN-RAISING</span>
                          </div>
                          <p className="text-[#5B6360] text-xs mt-0.5 leading-tight">
                            Volunteer collective labor brigades and community tool lending libraries.
                          </p>
                        </div>

                        <div className="p-1.5 bg-[#FFFFFF] border border-[#222D2C]">
                          <div className="font-bold text-[#3CCC23] flex items-center gap-1">
                            <Radio size={11} className="text-[#3CCC23]" />
                            <span>4. ZERO-CLOUD MESH</span>
                          </div>
                          <p className="text-[#5B6360] text-xs mt-0.5 leading-tight">
                            Local 915MHz LoRa & Wi-Fi mesh independent of Big Tech servers or telecom ISPs.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Open Source Hosting & Setup Guide */}
                    <div className="p-2.5 bg-[#EFECE6] border-2 border-[#222D2C] flex flex-col justify-between font-mono text-xs space-y-2">
                      <div>
                        <div className="flex justify-between items-center border-b border-[#222D2C]/20 pb-1 mb-1.5">
                          <span className="font-bold text-[#005EAC] uppercase flex items-center gap-1">
                            <Radio size={12} className="text-[#FF9600]" />
                            <span>Open-Source Self-Hosting</span>
                          </span>
                          <span className="bg-[#FAD13E] text-[#222D2C] px-1 py-0.2 font-bold text-xs">SETUP: COMING SOON</span>
                        </div>
                        <p className="text-[#3E4846] text-xs leading-snug">
                          Run self-hosted on a Raspberry Pi, solar battery laptop, or local captive Wi-Fi portal without subscriptions or cloud dependencies.
                        </p>
                        <pre className="text-xs bg-[#222D2C] text-[#3CCC23] p-1.5 mt-1.5 font-mono overflow-x-auto">
git clone https://github.com/arielchuri/TAZ.git
cd TAZ && npm install && npm run dev
                        </pre>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-[#222D2C]/15 text-xs">
                        <button 
                          onClick={() => setIsWelcomeOpen(true)}
                          className="font-bold text-[#005EAC] hover:underline cursor-pointer flex items-center gap-1"
                          title="Open 5 Pillars & Architectural Manifesto"
                        >
                          <BookOpen size={11} />
                          <span>5 Pillars Pop-up →</span>
                        </button>
                        <button 
                          onClick={() => toggleExpand("about")} 
                          className="underline font-bold hover:text-[#005EAC] cursor-pointer"
                        >
                          {expandedSection === "about" ? "Collapse ↑" : "Full Guide →"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
        );

      case "matcher":
        return (
                <div id="section-matcher" data-section-id="matcher" data-section-title="Peer-to-Peer Mutual Aid Matcher">
                  <Card
      dragHandleProps={dragHandleProps} 
                    onClickCapture={(e) => isHelpMode && triggerSectionHelp("Peer-to-Peer Mutual Aid Matcher", "matcher", e)}
                    title="Mutual Aid Matcher" 
                    accentColor="bg-[#005EAC]"
                    badge={<span className="text-xs font-mono uppercase bg-white/20 px-1 py-0.2">SEC 2.2</span>}
                    headerActions={
                      <Tip label="Post need or offer to board" notImplemented={true}>
                        <Button variant="primary" size="xs" className="!bg-[#0F3D64] hover:!bg-[#08233a] px-2 py-0.5 text-xs h-[22px]">
                          <Plus size={11} /> Post
                        </Button>
                      </Tip>
                    }
                    hint="Decentralized give/take matching protocol. Operates offline over LoRa mesh."
                    isShaded={shadedSections["matcher"]}
                    onToggleShade={() => toggleShade("matcher")}
                    isExpanded={expandedSection === "matcher"}
                    onToggleExpand={() => toggleExpand("matcher")}
                  >
                    <div className="flex border-b border-[#222D2C] -mx-2.5 -mt-2.5 mb-2 bg-[#DFDDD7] shrink-0">
                      <button
                        onClick={() => setViewMode("take")}
                        className={cn(
                          "flex-1 py-1 px-2 text-xs font-bold uppercase tracking-wider transition-colors border-none cursor-pointer flex items-center justify-center gap-1.5 font-mono leading-normal h-[28px]",
                          viewMode === "take" ? "bg-[#005EAC] text-white" : "bg-transparent text-[#5B6360] hover:text-[#222D2C]"
                        )}
                        style={{ borderRadius: 0 }}
                      >
                        <ShieldAlert size={12} />
                        <span>Needs ({needs.length})</span>
                      </button>
                      <button
                        onClick={() => setViewMode("give")}
                        className={cn(
                          "flex-1 py-1 px-2 text-xs font-bold uppercase tracking-wider transition-colors border-none cursor-pointer flex items-center justify-center gap-1.5 font-mono leading-normal h-[28px]",
                          viewMode === "give" ? "bg-[#005EAC] text-white" : "bg-transparent text-[#5B6360] hover:text-[#222D2C]"
                        )}
                        style={{ borderRadius: 0 }}
                      >
                        <Heart size={12} />
                        <span>Offers ({offers.length})</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-0.5 shrink-0">
                      <span className="text-xs font-mono font-bold text-[#5B6360] uppercase px-0.5 py-0.5">FILTER:</span>
                      <FilterChip active={activeFilter === "all"} onClick={() => setActiveFilter("all")} label="ALL" />
                      <FilterChip active={activeFilter === "water"} onClick={() => setActiveFilter("water")} icon={<Water size={10} />} label="H2O" />
                      <FilterChip active={activeFilter === "medical"} onClick={() => setActiveFilter("medical")} icon={<Pill size={10} />} label="MED" />
                      <FilterChip active={activeFilter === "power"} onClick={() => setActiveFilter("power")} icon={<Zap size={10} />} label="PWR" />
                      <FilterChip active={activeFilter === "food"} onClick={() => setActiveFilter("food")} icon={<Utensils size={10} />} label="FOOD" />
                    </div>

                    <div className="flex flex-col gap-1.5 overflow-y-auto max-h-72 pr-0.5">
                      {viewMode === "take" ? (
                        filteredNeeds.map((item) => (
                          <div 
                            key={item.id}
                            className="p-2 bg-[#EFECE6] border border-[#222D2C] hover:border-[#005EAC] flex justify-between items-center gap-2 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={cn("p-1 bg-white border shrink-0", item.color)}>{item.icon}</div>
                              <div className="min-w-0 py-0.5">
                                <div className="font-bold text-xs text-[#222D2C] leading-tight truncate">{item.title}</div>
                                <div className="font-mono text-xs text-[#5B6360] leading-tight mt-0.5">{item.user} • {item.time}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={cn(
                                "font-mono text-xs font-bold px-1.5 py-0.5 border uppercase tracking-wider h-[20px] flex items-center",
                                item.urgency === "Critical" ? "bg-[#DF4C40]/15 text-[#DF4C40] border-[#DF4C40]" : "bg-[#FF9600]/15 text-[#9e5d00] border-[#FF9600]"
                              )}>
                                {item.urgency}
                              </span>
                              <Tip label="Fulfill request" notImplemented={true}>
                                <Button variant="primary" size="xs" className="h-[22px]">Fulfill</Button>
                              </Tip>
                            </div>
                          </div>
                        ))
                      ) : (
                        filteredOffers.map((item) => (
                          <div 
                            key={item.id}
                            className="p-2 bg-[#EFECE6] border border-[#222D2C] hover:border-[#005EAC] flex justify-between items-center gap-2 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={cn("p-1 bg-white border shrink-0", item.color)}>{item.icon}</div>
                              <div className="min-w-0 py-0.5">
                                <div className="font-bold text-xs text-[#222D2C] leading-tight truncate">{item.title}</div>
                                <div className="font-mono text-xs text-[#5B6360] leading-tight mt-0.5">{item.user} • AVAIL: {item.available}</div>
                              </div>
                            </div>
                            <Tip label="Request assistance" notImplemented={true}>
                              <Button variant="secondary" size="xs" className="shrink-0 h-[22px]">Request</Button>
                            </Tip>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
        );

      case "transport":
        return (
                <TransportCard
      dragHandleProps={dragHandleProps}
                  entries={transportEntries}
                  onAddEntry={handleAddTransport}
                  onClaimEntry={handleClaimTransport}
                  isShaded={shadedSections["transport"]}
                  onToggleShade={() => toggleShade("transport")}
                  isExpanded={expandedSection === "transport"}
                  onToggleExpand={() => toggleExpand("transport")}
                  onHelpClick={(e) => isHelpMode && triggerSectionHelp("Transport & Rideshare Dispatch", "transport", e)}
                />
        );

      case "ariel_projects":
        return (
                <div id="section-ariel_projects" data-section-id="ariel_projects" data-section-title="Ariel's Community Projects">
                  <Card
      dragHandleProps={dragHandleProps}
                    onClickCapture={(e) => isHelpMode && triggerSectionHelp("Ariel's Community Projects", "ariel_projects", e)}
                    title="Ariel's Community Projects"
                    accentColor="bg-[#222D2C] text-white"
                    badge={<span className="text-xs font-mono uppercase bg-[#FAD13E] text-[#222D2C] px-1.5 py-0.2 font-bold">{arielProjects.length} ACTIVE INITIATIVES</span>}
                    headerActions={
                      <Tip label="Log project hours or request tools">
                        <Button variant="outline" size="xs" className="!bg-white text-[#222D2C] text-xs h-[20px] px-1.5 font-bold uppercase">
                          + Log Task
                        </Button>
                      </Tip>
                    }
                    hint="Lead engineering tasks, microgrid installs, RF maintenance & volunteer coordination assigned to Ariel Churi."
                    isShaded={shadedSections["ariel_projects"]}
                    onToggleShade={() => toggleShade("ariel_projects")}
                    isExpanded={expandedSection === "ariel_projects"}
                    onToggleExpand={() => toggleExpand("ariel_projects")}
                  >
                    <div className="space-y-2 font-mono text-xs">
                      {arielProjects.map((p) => (
                        <div key={p.id} className="p-2.5 bg-[#FFFFFF] border-2 border-[#222D2C] shadow-sm hover:border-[#005EAC] transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={cn("text-xs font-bold px-1.5 py-0.2 uppercase", p.priorityColor)}>
                                {p.priority}
                              </span>
                              <span className="font-bold text-xs text-[#222D2C]">{p.title}</span>
                            </div>
                            <span className="text-xs text-[#5B6360] bg-[#EFECE6] px-1.5 py-0.2 border border-[#222D2C]/20">{p.deadline}</span>
                          </div>
                          
                          <div className="text-xs text-[#005EAC] font-bold mb-1 flex items-center gap-1">
                            <span>📍 {p.location}</span>
                            <span>• Role: {p.role}</span>
                          </div>

                          <p className="text-xs text-[#3E4846] leading-snug mb-2 font-sans">{p.status}</p>

                          <div className="space-y-1 pt-1 border-t border-[#222D2C]/15">
                            <div className="flex justify-between text-xs font-bold text-[#5B6360]">
                              <span>PROGRESS // {p.progress}% COMPLETE</span>
                              <span>{p.volunteers} VOLUNTEERS ON-CALL</span>
                            </div>
                            <div className="h-2 w-full bg-[#DFDDD7] border border-[#222D2C] p-0.2">
                              <div 
                                className="h-full bg-[#005EAC] transition-all" 
                                style={{ width: `${p.progress}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
        );

      case "governance":
        return (
                <div id="section-governance" data-section-id="governance" data-section-title="Governance & Consensus">
                  <Card
      dragHandleProps={dragHandleProps}
                    onClickCapture={(e) => isHelpMode && triggerSectionHelp("Governance & Consensus", "governance", e)}
                    title="Governance & Consensus"
                    accentColor="bg-[#0F3D64] text-white"
                    badge={<span className="text-xs font-mono uppercase bg-white/20 px-1 py-0.2">ASSEMBLY</span>}
                    hint="Direct consensus democracy: active neighborhood referendums & quorum voting."
                    isShaded={shadedSections["governance"]}
                    onToggleShade={() => toggleShade("governance")}
                    isExpanded={expandedSection === "governance"}
                    onToggleExpand={() => toggleExpand("governance")}
                  >
                    <div className="space-y-2">
                      <div className="p-2.5 bg-[#EFECE6] border border-[#222D2C]">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-xs text-[#222D2C]">Solar Array Expansion (Phase 2)</span>
                          <span className="font-mono text-xs bg-[#FAD13E] px-1 font-bold">48H LEFT</span>
                        </div>
                        <p className="text-xs text-[#5B6360] leading-snug mb-2">
                          Proposal to allocate 12 surplus 400W bifacial solar panels to Upper Montclair Community Center.
                        </p>
                        <div className="space-y-1">
                          <div className="flex justify-between font-mono text-xs font-bold">
                            <span>CONSENSUS PROGRESS (42/45 PEERS)</span>
                            <span className="text-[#3CCC23]">80% REACHED</span>
                          </div>
                          <div className="h-2.5 w-full bg-[#DFDDD7] border border-[#222D2C] p-0.2">
                            <div className="h-full bg-[#0F3D64]" style={{ width: "80%" }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Tip label="Vote on referendum" notImplemented={true}><Button variant="outline" size="xs" className="flex-1 h-[24px]">Cast Vote</Button></Tip>
                        <Tip label="Enter general assembly" notImplemented={true}><Button variant="primary" size="xs" className="flex-1 h-[24px] !bg-[#0F3D64]">Enter Assembly</Button></Tip>
                      </div>
                    </div>
                  </Card>
                </div>
        );

      case "calendar":
        return (
                <div id="section-calendar" data-section-id="calendar" data-section-title="Community Calendar & Fellowship">
                  <Card
      dragHandleProps={dragHandleProps}
                    onClickCapture={(e) => isHelpMode && triggerSectionHelp("Community Calendar & Fellowship", "calendar", e)}
                    title="Community Calendar & Fellowship"
                    accentColor="bg-[#3CCC23] text-white"
                    badge={<span className="text-xs font-mono uppercase bg-white/20 px-1 py-0.2">EVENTS</span>}
                    headerActions={
                      <Tip label="Add new gathering" notImplemented={true}>
                        <Button variant="primary" size="xs" className="!bg-[#3f9e2f] hover:!bg-[#2e7a21] px-2 py-0.5 text-xs h-[22px]">
                          <Plus size={11} /> Event
                        </Button>
                      </Tip>
                    }
                    hint="Wholesome gatherings, barn raising, fellowship potlucks & workshops."
                    isShaded={shadedSections["calendar"]}
                    onToggleShade={() => toggleShade("calendar")}
                    isExpanded={expandedSection === "calendar"}
                    onToggleExpand={() => toggleExpand("calendar")}
                  >
                    <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-0.5">
                      {calendarEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-2 bg-[#EFECE6] border border-[#222D2C] hover:border-[#3CCC23] transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-9 h-9 bg-[#FFFFFF] border border-[#222D2C] flex flex-col items-center justify-center shrink-0 font-mono">
                              <span className="text-xs font-bold text-[#DF4C40] uppercase leading-none">{ev.date.split(" ")[0]}</span>
                              <span className="text-xs font-black text-[#222D2C] leading-none mt-0.5">{ev.date.split(" ")[2]}</span>
                            </div>
                            <div className="min-w-0">
                              <span className={cn("text-xs font-mono font-bold px-1 py-0.2 uppercase leading-none inline-block", ev.tagColor)}>
                                {ev.type}
                              </span>
                              <div className="font-bold text-xs text-[#222D2C] truncate leading-tight mt-0.5">{ev.title}</div>
                              <div className="font-mono text-xs text-[#5B6360] truncate">{ev.time} • {ev.location}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="font-mono text-xs text-[#3CCC23] font-bold">{ev.rsvpCount} RSVP</span>
                            <Tip label="RSVP to event" notImplemented={true}>
                              <Button variant="primary" size="xs" className="h-[20px] px-2 text-xs !bg-[#3CCC23]">Join</Button>
                            </Tip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
        );

      case "labor":
        return (
          <div id="section-labor" data-section-id="labor" data-section-title="Labor & Tool Guilds">
            <Card
              dragHandleProps={dragHandleProps}
              onClickCapture={(e) => isHelpMode && triggerSectionHelp("Labor & Tool Guilds", "labor", e)}
              title="Labor & Tool Guilds"
              accentColor="bg-[#FF9600] text-white"
              badge={<span className="text-xs font-mono uppercase bg-white/20 px-1 py-0.2">ROSTER & DEPOT</span>}
              hint="Community work shifts, tool lending depot inventory & scheduled repairs."
              isShaded={shadedSections["labor"]}
              onToggleShade={() => toggleShade("labor")}
              isExpanded={expandedSection === "labor"}
              onToggleExpand={() => toggleExpand("labor")}
            >
              <div className="space-y-2">
                {/* Infrastructure Status Banner */}
                <div className="border border-[#222D2C] p-2 bg-[#EFECE6] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="text-[#FF9600]" size={16} />
                    <div>
                      <div className="font-bold text-xs uppercase">Infrastructure Stable</div>
                      <div className="font-mono text-xs text-[#5B6360]">0 critical orders // 3 preventative shifts</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs bg-[#3CCC23] text-white px-1.5 py-0.5 font-bold">NORMAL</span>
                </div>

                {/* Tool Guild Depot Inventory */}
                <div className="border border-[#222D2C] p-2 bg-white space-y-1.5">
                  <div className="flex justify-between items-baseline font-mono border-b border-[#222D2C]/20 pb-1">
                    <span className="text-xs font-bold uppercase text-[#222D2C] flex items-center gap-1">
                      <Hammer size={12} className="text-[#FF9600]" />
                      Tool Guild Depot
                    </span>
                    <span className="text-xs font-mono font-bold text-[#FF9600]">38 AVAILABLE • 14 ON LOAN</span>
                  </div>
                  <div className="space-y-1 pt-0.5">
                    {tools.slice(0, 4).map((tool) => (
                      <div key={tool.id} className="p-1.5 bg-[#EFECE6] border border-[#222D2C]/40 flex items-center justify-between text-xs font-mono gap-1">
                        <div className="truncate font-sans font-bold text-[#222D2C] flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 bg-[#FF9600] shrink-0" />
                          <span className="truncate">{tool.name}</span>
                        </div>
                        <div className="shrink-0 text-right">
                          {tool.status === "available" ? (
                            <span className="bg-[#3CCC23]/20 text-[#1f7314] font-bold px-1.5 py-0.2 border border-[#3CCC23]/60 text-xs uppercase">
                              AVAIL ({tool.location})
                            </span>
                          ) : (
                            <span className="bg-[#005EAC]/20 text-[#005EAC] font-bold px-1.5 py-0.2 border border-[#005EAC]/60 text-xs uppercase">
                              LOAN: {tool.borrower}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Labor Work Orders */}
                <div className="border border-[#222D2C] p-2 bg-white space-y-1">
                  <div className="flex justify-between items-baseline font-mono border-b border-[#222D2C]/20 pb-1">
                    <span className="text-xs font-bold uppercase text-[#222D2C] flex items-center gap-1">
                      <Users size={12} className="text-[#FF9600]" />
                      Active Work Crews
                    </span>
                    <span className="text-xs font-mono text-[#5B6360]">2 UPCOMING</span>
                  </div>
                  <div className="space-y-1 pt-0.5 font-mono text-xs">
                    <div className="p-1.5 bg-[#EFECE6] border border-[#222D2C]/40 flex justify-between items-center">
                      <span className="truncate font-sans text-xs text-[#222D2C]">Timber Depot Framing</span>
                      <span className="font-bold text-[#FF9600] shrink-0">SAT 09:00 (8 VOL)</span>
                    </div>
                    <div className="p-1.5 bg-[#EFECE6] border border-[#222D2C]/40 flex justify-between items-center">
                      <span className="truncate font-sans text-xs text-[#222D2C]">Mills Tower RF Coax & Wash</span>
                      <span className="font-bold text-[#005EAC] shrink-0">TODAY (ARIEL C.)</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">
                  <Button variant="yellow" size="xs" className="flex-1 h-[24px]" onClick={() => toggleExpand("labor")}>
                    Tool Depot ({tools.length})
                  </Button>
                  <Tip label="View maintenance roster" notImplemented={true}>
                    <Button variant="outline" size="xs" className="flex-1 h-[24px]">Task Board</Button>
                  </Tip>
                  <Tip label="Log volunteer hours" notImplemented={true}>
                    <Button variant="outline" size="xs" className="flex-1 h-[24px]">Log Hours</Button>
                  </Tip>
                </div>
              </div>
            </Card>
          </div>
        );

      case "power":
        return (
          <div id="section-power" data-section-id="power" data-section-title="Microgrid Power">
            <Card
              dragHandleProps={dragHandleProps} 
              onClickCapture={(e) => isHelpMode && triggerSectionHelp("Microgrid Power", "power", e)}
              title="Microgrid Power" 
              accentColor="bg-[#3CCC23] text-white"
              badge={<span className="text-xs font-mono uppercase bg-white/20 px-1 py-0.2">48V STORAGE</span>}
              hint="Solar MPPT arrays, micro-hydro intake, generator standby, telemetry & 24h load history."
              isShaded={shadedSections["power"]}
              onToggleShade={() => toggleShade("power")}
              isExpanded={expandedSection === "power"}
              onToggleExpand={() => toggleExpand("power")}
            >
              <div className="space-y-2">
                {/* Storage Bank Battery */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline font-mono border-b border-[#222D2C]/20 pb-1 px-0.5">
                    <span className="text-xs uppercase text-[#5B6360] font-semibold flex items-center gap-1">
                      <BatteryCharging size={13} className="text-[#3CCC23]" />
                      Storage Bank (LiFePO4)
                    </span>
                    <span className="text-xs font-bold text-[#222D2C] tabular-nums">8.4 / 10 kWh (84% • 51.8V)</span>
                  </div>
                  <div className="h-3 w-full bg-[#DFDDD7] border border-[#222D2C] p-0.5">
                    <div className="h-full bg-[#3CCC23]" style={{ width: "84%" }} />
                  </div>
                </div>

                {/* Power Sources Breakdown */}
                <div className="border border-[#222D2C] p-2 bg-white space-y-1.5">
                  <div className="flex justify-between items-baseline font-mono border-b border-[#222D2C]/20 pb-1">
                    <span className="text-xs font-bold uppercase text-[#222D2C] flex items-center gap-1">
                      <Zap size={12} className="text-[#3CCC23]" />
                      Power Sources
                    </span>
                    <span className="text-xs font-mono font-bold text-[#3CCC23]">+1,620 W TOTAL INFLOW</span>
                  </div>
                  <div className="space-y-1 pt-0.5 font-mono text-xs">
                    <div className="p-1 bg-[#EFECE6] border border-[#222D2C]/30 flex justify-between items-center">
                      <span className="text-[#222D2C] flex items-center gap-1">
                        <Sun size={11} className="text-[#FF9600]" />
                        Solar MPPT (2.4 kWp)
                      </span>
                      <span className="font-bold text-[#3CCC23]">+1,240 W (Peak)</span>
                    </div>
                    <div className="p-1 bg-[#EFECE6] border border-[#222D2C]/30 flex justify-between items-center">
                      <span className="text-[#222D2C] flex items-center gap-1">
                        <Water size={11} className="text-[#3ABEAE]" />
                        Micro-Hydro (500W)
                      </span>
                      <span className="font-bold text-[#3CCC23]">+380 W (14 L/s)</span>
                    </div>
                    <div className="p-1 bg-[#EFECE6] border border-[#222D2C]/30 flex justify-between items-center text-[#5B6360]">
                      <span className="flex items-center gap-1">
                        <Fuel size={11} />
                        EU2200i Generator
                      </span>
                      <span className="font-bold text-[#5B6360]">0 W (Standby 95%)</span>
                    </div>
                  </div>
                </div>

                {/* Usage / Load Telemetry */}
                <div className="border border-[#222D2C] p-2 bg-white space-y-1">
                  <div className="flex justify-between items-baseline font-mono border-b border-[#222D2C]/20 pb-1">
                    <span className="text-xs font-bold uppercase text-[#222D2C] flex items-center gap-1">
                      <Gauge size={12} className="text-[#005EAC]" />
                      Usage & Loads
                    </span>
                    <span className="text-xs font-mono font-bold text-[#005EAC]">-380 W ACTIVE LOAD</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-0.5 text-center font-mono text-xs">
                    <div className="p-1 bg-[#EFECE6] border border-[#222D2C]/30">
                      <span className="text-[#5B6360] block text-[10px] uppercase">Cold / Meds</span>
                      <span className="font-bold text-[#222D2C]">-120 W</span>
                    </div>
                    <div className="p-1 bg-[#EFECE6] border border-[#222D2C]/30">
                      <span className="text-[#5B6360] block text-[10px] uppercase">LoRa Tower</span>
                      <span className="font-bold text-[#222D2C]">-45 W</span>
                    </div>
                    <div className="p-1 bg-[#EFECE6] border border-[#222D2C]/30">
                      <span className="text-[#5B6360] block text-[10px] uppercase">Depot & Pump</span>
                      <span className="font-bold text-[#222D2C]">-215 W</span>
                    </div>
                  </div>
                  <div className="p-1 bg-[#3CCC23]/10 border border-[#3CCC23]/40 text-center font-mono text-xs font-bold text-[#1f7314] uppercase mt-1">
                    Net: +1,240 W → Surplus charging battery bank
                  </div>
                </div>

                {/* 24-Hour History Graph */}
                <div className="border border-[#222D2C] p-2 bg-white space-y-1.5">
                  <div className="flex justify-between items-baseline font-mono border-b border-[#222D2C]/20 pb-1">
                    <span className="text-xs font-bold uppercase text-[#222D2C] flex items-center gap-1">
                      <TrendingUp size={12} className="text-[#3CCC23]" />
                      24-Hr Power History (Watts)
                    </span>
                    <span className="text-[10px] font-mono text-[#5B6360]">PEAK +1.8 kW @ 12H</span>
                  </div>
                  <div className="pt-1">
                    <div className="h-16 flex items-end justify-between gap-1 bg-[#EFECE6] p-1.5 border border-[#222D2C]/40">
                      {POWER_HISTORY_24H.map((dp) => {
                        const genHeight = Math.min(Math.round((dp.gen / 2000) * 100), 100);
                        const loadHeight = Math.min(Math.round((dp.load / 2000) * 100), 100);
                        return (
                          <div key={dp.time} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                            {/* Hover tooltip */}
                            <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 bg-[#222D2C] text-white text-[10px] font-mono p-1 border border-white whitespace-nowrap pointer-events-none">
                              {dp.time} — Gen: +{dp.gen}W | Load: -{dp.load}W
                            </div>
                            <div className="w-full flex items-end justify-center gap-0.5 h-full">
                              <div 
                                className="w-2.5 bg-[#3CCC23] border border-[#222D2C]/40 transition-all hover:brightness-110" 
                                style={{ height: `${genHeight}%` }} 
                                title={`Gen: +${dp.gen}W`}
                              />
                              <div 
                                className="w-1.5 bg-[#005EAC] border border-[#222D2C]/40 transition-all hover:brightness-110" 
                                style={{ height: `${loadHeight}%` }} 
                                title={`Load: -${dp.load}W`}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-[#5B6360] mt-1">{dp.time}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center font-mono text-[10px] text-[#5B6360] pt-1 px-1">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-[#3CCC23] inline-block" /> Generation
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-[#005EAC] inline-block" /> Load
                      </span>
                      <span>28.4h Run-Time at Baseload</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-0.5">
                  <Button variant="outline" size="xs" className="flex-1 h-[24px]" onClick={() => toggleExpand("power")}>
                    Detailed Telemetry & Inverter Logs →
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case "water":
        return (
          <div id="section-water" data-section-id="water" data-section-title="Water Reserves">
            <Card
              dragHandleProps={dragHandleProps} 
              onClickCapture={(e) => isHelpMode && triggerSectionHelp("Water Reserves", "water", e)}
              title="Water Reserves" 
              accentColor="bg-[#3ABEAE] text-white"
              badge={<span className="text-xs font-mono uppercase bg-white/20 px-1 py-0.2">CISTERN & BARRELS</span>}
              hint="Potable water cistern, neighborhood rain barrels estimate & UV filtration purity."
              isShaded={shadedSections["water"]}
              onToggleShade={() => toggleShade("water")}
              isExpanded={expandedSection === "water"}
              onToggleExpand={() => toggleExpand("water")}
            >
              <div className="space-y-2">
                {/* Central Cistern */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline font-mono border-b border-[#222D2C]/20 pb-1 px-0.5">
                    <span className="text-xs uppercase text-[#5B6360] font-semibold flex items-center gap-1">
                      <Water size={13} className="text-[#3ABEAE]" />
                      Potable UV Cistern
                    </span>
                    <span className="text-xs font-bold text-[#222D2C] tabular-nums">1,240 / 2,000 L (62%)</span>
                  </div>
                  <div className="h-3 w-full bg-[#DFDDD7] border border-[#222D2C] p-0.5">
                    <div className="h-full bg-[#3ABEAE]" style={{ width: "62%" }} />
                  </div>
                </div>

                {/* Rain Barrels Estimate */}
                <div className="border border-[#222D2C] p-2 bg-white space-y-1.5">
                  <div className="flex justify-between items-baseline font-mono border-b border-[#222D2C]/20 pb-1">
                    <span className="text-xs font-bold uppercase text-[#222D2C] flex items-center gap-1">
                      <CloudRain size={12} className="text-[#005EAC]" />
                      Rain Barrels Estimate
                    </span>
                    <span className="text-xs font-mono font-bold text-[#005EAC]">~6,300 L / 8,750 L (72%)</span>
                  </div>
                  <div className="space-y-1 pt-0.5 font-mono text-xs">
                    <div className="h-2 w-full bg-[#DFDDD7] border border-[#222D2C]/40 p-0.5">
                      <div className="h-full bg-[#005EAC]" style={{ width: "72%" }} />
                    </div>
                    <div className="p-1.5 bg-[#EFECE6] border border-[#222D2C]/30 flex justify-between items-center text-xs">
                      <span className="text-[#222D2C]">42 Residential Barrels (55 gal each)</span>
                      <span className="font-bold text-[#005EAC]">72% FULL</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-0.5 text-center text-[11px]">
                      <div className="p-1 bg-[#EFECE6] border border-[#222D2C]/30">
                        <span className="text-[#5B6360] block text-[10px]">UPPER MONTCLAIR</span>
                        <span className="font-bold">18 Barrels (~2.7k L)</span>
                      </div>
                      <div className="p-1 bg-[#EFECE6] border border-[#222D2C]/30">
                        <span className="text-[#5B6360] block text-[10px]">MSU PERIMETER</span>
                        <span className="font-bold">12 Barrels (~1.8k L)</span>
                      </div>
                      <div className="p-1 bg-[#EFECE6] border border-[#222D2C]/30">
                        <span className="text-[#5B6360] block text-[10px]">MILLS SLOPE</span>
                        <span className="font-bold">12 Barrels (~1.8k L)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combined Reserves & Purity */}
                <div className="border border-[#222D2C] p-2 bg-[#EFECE6] flex justify-between items-center font-mono text-xs">
                  <div>
                    <span className="text-[#5B6360] text-[10px] uppercase block font-semibold">Total Stored Reserves</span>
                    <span className="font-bold text-sm text-[#222D2C]">7,540 L (Potable + Rain)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#5B6360] text-[10px] uppercase block font-semibold">Purity & Testing</span>
                    <span className="font-bold text-[#3CCC23] flex items-center gap-1 justify-end">
                      <CheckCircle2 size={12} /> 42 PPM TDS (SAFE)
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-0.5">
                  <Button variant="outline" size="xs" className="flex-1 h-[24px]" onClick={() => toggleExpand("water")}>
                    Inspect Filtration Stages & Census →
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case "neighbors":
        return (
          <div id="section-neighbors" data-section-id="neighbors" data-section-title="Neighboring Communities">
            <Card
              dragHandleProps={dragHandleProps} 
              onClickCapture={(e) => isHelpMode && triggerSectionHelp("Neighboring Communities", "neighbors", e)}
              title="Neighboring Communities" 
              accentColor="bg-[#0F5257] text-white"
              badge={<span className="text-xs font-mono uppercase bg-white/20 px-1 py-0.2">FEDERATION</span>}
              hint="Regional mutual aid nodes, designated community envoys, and bilateral trade compacts."
              isShaded={shadedSections["neighbors"]}
              onToggleShade={() => toggleShade("neighbors")}
              isExpanded={expandedSection === "neighbors"}
              onToggleExpand={() => toggleExpand("neighbors")}
            >
              <div className="space-y-2">
                {/* Federation Status Banner */}
                <div className="border border-[#222D2C] p-2 bg-[#EFECE6] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="text-[#0F5257]" size={16} />
                    <div>
                      <div className="font-bold text-xs uppercase">Passaic & Essex Federation</div>
                      <div className="font-mono text-xs text-[#5B6360]">3 active bilateral zones // 3 designated envoys</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs bg-[#0F5257] text-white px-1.5 py-0.5 font-bold">ALL ALLIED</span>
                </div>

                {/* Communities List */}
                <div className="space-y-2">
                  {NEIGHBOR_COMMUNITIES.map((comm) => (
                    <div key={comm.id} className="p-2 bg-white border border-[#222D2C] space-y-1.5">
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <div className="font-bold text-xs uppercase text-[#222D2C] flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-[#0F5257] inline-block shrink-0" />
                            <span>{comm.name}</span>
                          </div>
                          <div className="font-mono text-xs text-[#5B6360]">
                            {comm.zone} • {comm.distance} {comm.direction} • {comm.linkDesc}
                          </div>
                        </div>
                        <span className="font-mono text-[10px] bg-[#0F5257]/10 text-[#0F5257] border border-[#0F5257]/40 px-1 py-0.2 font-bold uppercase shrink-0">
                          {comm.pactStatus}
                        </span>
                      </div>

                      {/* Official / Envoy */}
                      <div className="p-1.5 bg-[#EFECE6] border border-[#222D2C]/30 font-mono text-xs flex justify-between items-center">
                        <div>
                          <span className="text-[#5B6360] text-[10px] block">DESIGNATED LIAISON / OFFICIAL:</span>
                          <span className="font-bold text-[#222D2C]">{comm.official.name}</span>
                          <span className="text-[#5B6360] ml-1">({comm.official.callsign})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[#5B6360] text-[10px] block">CHANNEL:</span>
                          <span className="font-bold text-[#005EAC] text-[11px]">{comm.official.channel}</span>
                        </div>
                      </div>

                      {/* Barter Status */}
                      <div className="font-mono text-[11px] space-y-0.5">
                        <div className="text-[#1f7314]">
                          <span className="font-bold uppercase text-[10px] bg-[#3CCC23]/20 px-1 py-0.2 mr-1">SURPLUS:</span>
                          {comm.surplus.join(", ")}
                        </div>
                        <div className="text-[#b86e0c]">
                          <span className="font-bold uppercase text-[10px] bg-[#FF9600]/20 px-1 py-0.2 mr-1">SEEKING:</span>
                          {comm.seeking.join(", ")}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1.5 pt-1 border-t border-[#222D2C]/20">
                        <Button 
                          variant="yellow" 
                          size="xs" 
                          className="flex-1 h-[22px] text-xs font-mono font-bold flex items-center justify-center gap-1"
                          onClick={() => {
                            setInterZoneMessage(`Propose bilateral barter of ${comm.surplus[0]} for our surplus.`);
                            setInterZoneSent(false);
                            setInterZoneModal({ open: true, type: "trade", community: comm });
                          }}
                        >
                          <Handshake size={11} /> Propose Trade
                        </Button>
                        <Button 
                          variant="outline" 
                          size="xs" 
                          className="flex-1 h-[22px] text-xs font-mono font-bold flex items-center justify-center gap-1"
                          onClick={() => {
                            setInterZoneMessage(`Urgent request for mutual aid support from ${comm.name}.`);
                            setInterZoneSent(false);
                            setInterZoneModal({ open: true, type: "request", community: comm });
                          }}
                        >
                          <ExternalLink size={11} /> Request Aid
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer button */}
                <div className="pt-0.5">
                  <Button variant="outline" size="xs" className="w-full h-[24px]" onClick={() => toggleExpand("neighbors")}>
                    Regional Federation Protocols & Courier Schedule →
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case "mesh":
        return (
                <div id="section-mesh" data-section-id="mesh" data-section-title="Mesh Network Telemetry">
                  <Card
      dragHandleProps={dragHandleProps} 
                    onClickCapture={(e) => isHelpMode && triggerSectionHelp("Mesh Network Telemetry", "mesh", e)}
                    title="Mesh Network Telemetry" 
                    accentColor="bg-[#FF9600] text-white"
                    isShaded={shadedSections["mesh"]}
                    onToggleShade={() => toggleShade("mesh")}
                    isExpanded={expandedSection === "mesh"}
                    onToggleExpand={() => toggleExpand("mesh")}
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline font-mono border-b border-[#222D2C]/20 pb-1 px-0.5">
                        <span className="text-xs uppercase text-[#5B6360] font-semibold">Connected Peers</span>
                        <span className="text-xs font-bold text-[#222D2C] tabular-nums">42 NODES ACTIVE</span>
                      </div>

                      <div className="h-9 bg-[#EFECE6] border border-[#222D2C] flex items-end gap-1 p-1">
                        {[40, 20, 60, 40, 90, 40, 70, 40, 20, 50, 40, 80, 40, 65, 30, 85].map((h, i) => (
                          <div key={i} className="flex-1 bg-[#FF9600]" style={{ height: `${h}%` }} />
                        ))}
                      </div>

                      <div className="p-1 bg-[#EFECE6] border border-[#222D2C] font-mono text-xs flex justify-between text-[#222D2C] px-1">
                        <span>LORA: 98% RX</span>
                        <span>PING: 42ms</span>
                        <span>915.0 MHz</span>
                      </div>
                    </div>
                  </Card>
                </div>
        );

      case "nature":
        return (
                <div id="section-nature" data-section-id="nature" data-section-title="Nature Clock & Weather">
                  <Card
      dragHandleProps={dragHandleProps} 
                    onClickCapture={(e) => isHelpMode && triggerSectionHelp("Nature Clock & Weather", "nature", e)}
                    title="Nature Clock & Weather" 
                    accentColor="bg-[#FAD13E] !text-[#222D2C]"
                    isShaded={shadedSections["nature"]}
                    onToggleShade={() => toggleShade("nature")}
                    isExpanded={expandedSection === "nature"}
                    onToggleExpand={() => toggleExpand("nature")}
                  >
                    <div className="space-y-2">
                      <div className="p-1.5 bg-[#EFECE6] border border-[#222D2C] flex justify-between items-center font-mono">
                        <div className="flex items-center gap-1.5">
                          <CloudSun size={15} className="text-[#FF9600]" />
                          <div>
                            <div className="text-xs font-bold text-[#222D2C] leading-none">74°F (23°C)</div>
                            <div className="text-xs text-[#5B6360]">PARTLY CLOUDY</div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-[#5B6360] leading-tight">
                          <div>WIND: WNW 8MPH</div>
                          <div>HUMIDITY: 48%</div>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-mono text-[#5B6360] uppercase block mb-1 font-semibold">5-DAY REGIONAL FORECAST</span>
                        <div className="grid grid-cols-5 gap-1 font-mono text-xs text-center">
                          <div className="border border-[#222D2C] p-1 bg-[#EFECE6]">
                            <div className="font-bold text-[#5B6360]">MON</div>
                            <Sun size={10} className="mx-auto my-0.5 text-[#FF9600]" />
                            <div className="font-bold text-[#222D2C]">76°</div>
                          </div>
                          <div className="border border-[#222D2C] p-1 bg-[#EFECE6]">
                            <div className="font-bold text-[#5B6360]">TUE</div>
                            <CloudSun size={10} className="mx-auto my-0.5 text-[#FF9600]" />
                            <div className="font-bold text-[#222D2C]">78°</div>
                          </div>
                          <div className="border border-[#222D2C] p-1 bg-[#EFECE6]">
                            <div className="font-bold text-[#3ABEAE]">WED</div>
                            <CloudRain size={10} className="mx-auto my-0.5 text-[#3ABEAE]" />
                            <div className="font-bold text-[#222D2C]">68°</div>
                          </div>
                          <div className="border border-[#222D2C] p-1 bg-[#EFECE6]">
                            <div className="font-bold text-[#5B6360]">THU</div>
                            <Cloud size={10} className="mx-auto my-0.5 text-[#5B6360]" />
                            <div className="font-bold text-[#222D2C]">72°</div>
                          </div>
                          <div className="border border-[#222D2C] p-1 bg-[#EFECE6]">
                            <div className="font-bold text-[#5B6360]">FRI</div>
                            <Sun size={10} className="mx-auto my-0.5 text-[#FF9600]" />
                            <div className="font-bold text-[#222D2C]">75°</div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-[#222D2C]/20 font-mono text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span>SUNRISE: 06:14</span>
                          <span className="font-bold text-[#005EAC]">SOLAR NOON: 13:02</span>
                          <span>SUNSET: 19:42</span>
                        </div>
                        <div className="h-2.5 w-full border border-[#222D2C] flex overflow-hidden">
                          <div className="w-[20%] bg-[#222D2C]" />
                          <div className="w-[60%] bg-[#FAD13E] relative">
                            <div className="absolute left-[65%] top-0 bottom-0 w-1 bg-white animate-pulse" />
                          </div>
                          <div className="w-[20%] bg-[#222D2C]" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
        );

      case "comms":
        return (
                <div id="section-comms" data-section-id="comms" data-section-title="Local Comms & Messenger">
                  <Card
      dragHandleProps={dragHandleProps}
                    onClickCapture={(e) => isHelpMode && triggerSectionHelp("Local Comms & Messenger", "comms", e)}
                    title="Local Comms & Messenger"
                    accentColor="bg-[#005EAC] text-white"
                    badge={<span className="text-xs font-mono uppercase bg-white/20 px-1 py-0.2 font-bold">LORA MESH</span>}
                    hint="Encrypted local mesh messaging channels, Ariel Churi's project logs & emergency broadcast dispatch."
                    isShaded={shadedSections["comms"]}
                    onToggleShade={() => toggleShade("comms")}
                    isExpanded={expandedSection === "comms"}
                    onToggleExpand={() => toggleExpand("comms")}
                  >
                    <div className="space-y-2 text-xs font-mono">
                      {/* Comms Channel Filter Bar */}
                      <div className="flex gap-1 overflow-x-auto pb-0.5">
                        <button
                          onClick={() => setCommsFilter("all")}
                          className={cn(
                            "px-1.5 py-0.5 text-xs font-bold uppercase border cursor-pointer transition-colors shrink-0",
                            commsFilter === "all" ? "bg-[#222D2C] text-white border-[#222D2C]" : "bg-white text-[#222D2C] border-[#222D2C]"
                          )}
                        >
                          ALL CHANNELS
                        </button>
                        <button
                          onClick={() => setCommsFilter("ariel")}
                          className={cn(
                            "px-1.5 py-0.5 text-xs font-bold uppercase border cursor-pointer transition-colors shrink-0 flex items-center gap-1",
                            commsFilter === "ariel" ? "bg-[#FAD13E] text-[#222D2C] border-[#222D2C] font-black" : "bg-white text-[#222D2C] border-[#222D2C] hover:bg-[#FAD13E]/30"
                          )}
                        >
                          <span>★ ARIEL'S THREADS</span>
                        </button>
                        <button
                          onClick={() => setCommsFilter("mesh")}
                          className={cn(
                            "px-1.5 py-0.5 text-xs font-bold uppercase border cursor-pointer transition-colors shrink-0",
                            commsFilter === "mesh" ? "bg-[#222D2C] text-white border-[#222D2C]" : "bg-white text-[#222D2C] border-[#222D2C]"
                          )}
                        >
                          MESH #1
                        </button>
                        <button
                          onClick={() => setCommsFilter("emergency")}
                          className={cn(
                            "px-1.5 py-0.5 text-xs font-bold uppercase border cursor-pointer transition-colors shrink-0",
                            commsFilter === "emergency" ? "bg-[#DF4C40] text-white border-[#DF4C40]" : "bg-white text-[#DF4C40] border-[#DF4C40]"
                          )}
                        >
                          ALERT
                        </button>
                      </div>

                      {/* Message Stream */}
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                        {/* Thread 1: Ariel's MSU Telemetry */}
                        {(commsFilter === "all" || commsFilter === "ariel" || commsFilter === "mesh") && (
                          <div className="p-2 bg-[#FFFFFF] border border-[#222D2C] space-y-0.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-[#005EAC] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-[#FAD13E] rounded-full inline-block" />
                                Ariel Churi (Node #742)
                              </span>
                              <span className="text-[#5B6360]">16:11 // [B7]</span>
                            </div>
                            <p className="text-xs text-[#222D2C] font-sans leading-tight">
                              MSU Solar Intertie testing at 48.2V MPPT. Feeding +1.2kW into campus storage bank.
                            </p>
                          </div>
                        )}

                        {/* Thread 2: Ariel's Mills Coax Log */}
                        {(commsFilter === "all" || commsFilter === "ariel" || commsFilter === "mesh") && (
                          <div className="p-2 bg-[#FFFFFF] border border-[#222D2C] space-y-0.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-[#005EAC] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-[#FAD13E] rounded-full inline-block" />
                                Ariel Churi (Node #742)
                              </span>
                              <span className="text-[#5B6360]">14:22 // [A4]</span>
                            </div>
                            <p className="text-xs text-[#222D2C] font-sans leading-tight">
                              Mills high-altitude repeater coax checked. 98% packet RX on 915MHz channel 1.
                            </p>
                          </div>
                        )}

                        {/* Thread 3: Ariel's Tool Shed Log */}
                        {(commsFilter === "all" || commsFilter === "ariel") && (
                          <div className="p-2 bg-[#FFFFFF] border border-[#222D2C] space-y-0.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-[#005EAC] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-[#FAD13E] rounded-full inline-block" />
                                Ariel Churi (Node #742)
                              </span>
                              <span className="text-[#5B6360]">Yesterday // [F5]</span>
                            </div>
                            <p className="text-xs text-[#222D2C] font-sans leading-tight">
                              Delivering spare soldering iron and multimeter to Walnut Street Repair Guild.
                            </p>
                          </div>
                        )}

                        {/* Thread 4: Elena Rostova */}
                        {(commsFilter === "all" || commsFilter === "mesh") && (
                          <div className="p-2 bg-[#EFECE6] border border-[#222D2C] space-y-0.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-[#222D2C]">Elena Rostova (Node #304)</span>
                              <span className="text-[#5B6360]">15:45 // [C6]</span>
                            </div>
                            <p className="text-xs text-[#3E4846] font-sans leading-tight">
                              First aid clinic restocked with trauma dressings on Valley Road.
                            </p>
                          </div>
                        )}

                        {/* Thread 5: Emergency Broadcast */}
                        {(commsFilter === "all" || commsFilter === "emergency") && (
                          <div className="p-2 bg-[#DF4C40]/15 border border-[#DF4C40] space-y-0.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-[#DF4C40]">EMERGENCY BROADCAST</span>
                              <span className="text-[#5B6360]">12:00 // REGIONAL</span>
                            </div>
                            <p className="text-xs text-[#222D2C] font-sans leading-tight">
                              Weather ephemeris: Light evening showers approaching from WNW. Rain barrels open.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Quick Compose Input */}
                      <div className="flex gap-1 pt-1 border-t border-[#222D2C]/20">
                        <input
                          type="text"
                          placeholder="Broadcast to local mesh as Ariel Churi..."
                          value={newCommsMessage}
                          onChange={(e) => setNewCommsMessage(e.target.value)}
                          className="flex-1 bg-white border border-[#222D2C] px-2 py-1 text-xs font-sans focus:outline-none focus:border-[#005EAC]"
                        />
                        <button
                          onClick={() => {
                            if (newCommsMessage.trim()) {
                              setNewCommsMessage("");
                            }
                          }}
                          className="bg-[#005EAC] hover:bg-[#004B8A] text-white px-2 py-1 text-xs font-bold uppercase cursor-pointer"
                        >
                          <Send size={11} />
                        </button>
                      </div>
                    </div>
                  </Card>
                </div>
        );

      case "knowledge":
        return (
                <div id="section-knowledge" data-section-id="knowledge" data-section-title="Knowledge Base">
                  <Card
      dragHandleProps={dragHandleProps} 
                    onClickCapture={(e) => isHelpMode && triggerSectionHelp("Knowledge Base", "knowledge", e)}
                    title="Knowledge Base" 
                    accentColor="bg-[#8F57CB] text-white"
                    isShaded={shadedSections["knowledge"]}
                    onToggleShade={() => toggleShade("knowledge")}
                    isExpanded={expandedSection === "knowledge"}
                    onToggleExpand={() => toggleExpand("knowledge")}
                  >
                    <div className="space-y-1">
                      <FileItem name="Solar_Repair_v2.pdf" size="2.4MB" icon={<FileText size={12} />} />
                      <FileItem name="Mesh_Protocol.md" size="12KB" icon={<FileCode size={12} />} />
                      <FileItem name="Local_Herb_Guide.pdf" size="5.1MB" icon={<BookOpen size={12} />} />
                    </div>
                    <Tip label="Search offline wiki documents" notImplemented={true}>
                      <Button variant="outline" size="xs" className="w-full mt-1 py-0.5 text-xs h-[22px]">Browse All Docs</Button>
                    </Tip>
                  </Card>
                </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn("min-h-screen w-full bg-[#EFECE6] text-[#222D2C] flex flex-col font-sans selection:bg-[#005EAC] selection:text-white overflow-x-hidden", isLargeText && "text-enlarged")}>
      {/* ─── Top Sticky Navigation Bar (Height 40px, pinned at top) ──── */}
      <header 
        className={cn(
          "sticky top-0 z-50 h-[40px] border-b-2 border-[#222D2C] px-2 md:px-3 py-1 flex items-center shrink-0 select-none transition-colors duration-200 shadow-md",
          currentSectionConfig ? currentSectionConfig.color : "bg-[#005EAC] text-[#FFFFFF]"
        )}
      >
        {/* ─── 1-COLUMN SIZE TITLE BAR (< 1000px) ─── */}
        <div className="titlebar-mobile">
          {/* 1. MESH CAZ (Clickable to open Manifesto) */}
          <button
            onClick={() => setIsWelcomeOpen(true)}
            className="flex items-center gap-1 shrink-0 bg-transparent border-none p-0 cursor-pointer text-left hover:opacity-85"
            title="View CAZ Manifesto & 5 Core Pillars"
          >
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-black/40 text-white tracking-widest uppercase h-[24px] flex items-center">
              MESH
            </span>
            <span className="text-sm font-black uppercase tracking-tight leading-none text-white">
              CAZ
            </span>
          </button>

          {/* 2. Dropdown for 4 info chips */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                className="flex items-center gap-1 border border-[#222D2C] px-1.5 py-0.5 bg-white text-[#222D2C] font-mono text-xs font-bold uppercase h-[24px] cursor-pointer hover:bg-[#EFECE6] transition-colors shrink-0 shadow-sm"
                style={{ borderRadius: 0 }}
                title="View 4 Mesh Status Chips"
              >
                <span className="w-1.5 h-1.5 bg-[#3CCC23] rounded-full animate-pulse" />
                <span>STATUS</span>
                <ChevronDown size={11} className="text-[#5B6360]" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="w-56 bg-[#EFECE6] border-2 border-[#222D2C] p-2 z-[99999] shadow-lg flex flex-col gap-1.5"
                sideOffset={6}
                align="center"
                style={{ borderRadius: 0 }}
              >
                <div className="font-mono text-xs font-bold uppercase text-[#5B6360] pb-1 border-b border-[#222D2C]/20 flex justify-between items-center">
                  <span>TELEMETRY STATUS</span>
                  <span className="text-[#3CCC23] font-bold">4/4 ACTIVE</span>
                </div>
                <div className="grid grid-cols-2 gap-1 font-mono">
                  <StatusBadge icon={<Zap size={11} className="text-[#FAD13E]" />} label="PWR" value="84%" />
                  <StatusBadge icon={<Water size={11} className="text-[#3ABEAE]" />} label="H2O" value="1.2kL" />
                  <StatusBadge icon={<Users size={11} className="text-[#3CCC23]" />} label="PEERS" value="42" />
                  <StatusBadge icon={<Radio size={11} className="text-[#005EAC]" />} label="LORA" value="98%" />
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          {/* Actions Group: ? for help, Triangle + SOS, Avatar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Manifesto button for mobile */}
            <Tip label="CAZ Manifesto & 5 Pillars">
              <button
                onClick={() => setIsWelcomeOpen(true)}
                aria-label="Open CAZ Manifesto"
                className="w-[24px] h-[24px] flex items-center justify-center bg-white border border-[#222D2C] text-[#005EAC] hover:bg-[#EFECE6] cursor-pointer"
                style={{ borderRadius: 0 }}
                title="CAZ Manifesto & 5 Core Pillars"
              >
                <BookOpen size={13} />
              </button>
            </Tip>

            {/* 3. Question mark only for help */}
            <button
              onClick={() => {
                const nextState = !isHelpMode;
                setIsHelpMode(nextState);
                if (!nextState) setHelpOverlay(null);
              }}
              className={cn(
                "w-[24px] h-[24px] flex items-center justify-center cursor-pointer border font-mono text-xs font-black shadow-sm transition-colors",
                isHelpMode ? "bg-[#FAD13E] text-[#222D2C] border-[#222D2C] ring-2 ring-[#222D2C]" : "bg-white text-[#222D2C] border-[#222D2C] hover:bg-[#FAD13E]"
              )}
              style={{ borderRadius: 0 }}
              data-help-toggle="true"
              title="Click to toggle Help Mode: tap any section for tutorial info"
            >
              <HelpCircle size={13} className={isHelpMode ? "text-[#DF4C40] animate-bounce" : "text-[#005EAC]"} />
            </button>
            {/* Theme Toggle: Sun / Moon */}
            <Tip label={themeMode === "system" ? `Theme: System (${isDarkEffective ? "Dark" : "Light"})` : themeMode === "dark" ? "Theme: Dark" : "Theme: Light"}>
              <button
                onClick={toggleTheme}
                aria-label={isDarkEffective ? "Switch to light theme" : "Switch to dark theme"}
                className={cn(
                  "w-[24px] h-[24px] flex items-center justify-center cursor-pointer border transition-colors",
                  isDarkEffective
                    ? "bg-[#222D2C] text-[#FAD13E] border-[#5B6360] hover:bg-[#1A2221]"
                    : "bg-white text-[#222D2C] border-[#222D2C] hover:bg-[#EFECE6]"
                )}
                style={{ borderRadius: 0 }}
                title={`Theme Mode: ${themeMode.toUpperCase()}`}
              >
                {isDarkEffective ? <Moon size={13} className="fill-[#FAD13E]/40" /> : <Sun size={13} className="text-[#FF9600]" />}
              </button>
            </Tip>

            {/* Large Text Size Toggle */}
            <Tip label={isLargeText ? "Standard Text Size" : "Enlarge Text Size"}>
              <button
                onClick={() => setIsLargeText(prev => !prev)}
                aria-label={isLargeText ? "Switch to standard text size" : "Enlarge text size"}
                className={cn(
                  "w-[24px] h-[24px] font-mono text-xs font-black flex items-center justify-center cursor-pointer border transition-colors",
                  isLargeText
                    ? "bg-[#005EAC] text-white border-[#222D2C]"
                    : "bg-white hover:bg-[#EFECE6] text-[#222D2C] border-[#222D2C]"
                )}
                style={{ borderRadius: 0 }}
                title={isLargeText ? "Standard Text Size" : "Enlarge Text Size"}
              >
                AA
              </button>
            </Tip>

            {/* 4. Triangle + SOS */}
            {expandedSection ? (
              <button
                onClick={() => setExpandedSection(null)}
                aria-label="Restore view"
                className="h-[24px] bg-[#FFFFFF] hover:bg-[#EFECE6] text-[#222D2C] border border-[#222D2C] px-1.5 font-mono text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                style={{ borderRadius: 0 }}
                title="Restore View"
              >
                <X size={11} />
              </button>
            ) : (
              <div 
                onMouseDown={handleSosStart}
                onMouseUp={handleSosEnd}
                onMouseLeave={handleSosEnd}
                onTouchStart={handleSosStart}
                onTouchEnd={handleSosEnd}
                onTouchCancel={handleSosEnd}
                className="relative overflow-hidden cursor-pointer select-none touch-none [-webkit-touch-callout:none]"
              >
                <div 
                  className="absolute inset-0 bg-black/40 transition-all duration-75 pointer-events-none"
                  style={{ width: `${sosProgress}%` }}
                />
                <Button 
                  variant="danger" 
                  size="xs"
                  aria-label="Broadcast Emergency SOS"
                  className="relative z-10 flex items-center gap-1 bg-[#DF4C40] px-1.5 py-0 text-xs h-[24px] pointer-events-none select-none"
                >
                  <AlertTriangle size={12} />
                  <span>{isHoldingSos ? `${Math.round(sosProgress)}%` : "SOS"}</span>
                </Button>
              </div>
            )}

            {/* 5. Avatar */}
            <Tip label="Account Profile: Ariel Churi">
              <button 
                onClick={() => setIsAccountOpen(true)}
                aria-label="Open Ariel Churi account profile"
                className="w-[24px] h-[24px] flex items-center justify-center bg-[#FFFFFF] border border-[#222D2C] hover:scale-105 cursor-pointer p-0 overflow-hidden"
                style={{ borderRadius: 0 }}
                title="Ariel Churi — Account Profile"
              >
                <img src={arielAvatar} alt="Ariel Churi" className="w-full h-full object-cover" />
              </button>
            </Tip>
          </div>
        </div>

        {/* ─── DESKTOP / 2+ COLUMN TITLE BAR (>= 1000px) ─── */}
        <div className="titlebar-desktop">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWelcomeOpen(true)}
              className="flex items-center gap-2 bg-transparent border-none p-0 cursor-pointer text-left hover:opacity-85"
              title="Click to view CAZ Manifesto & 5 Core Pillars"
            >
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-black/40 text-white tracking-widest uppercase h-[24px] flex items-center">
                {currentSectionConfig ? currentSectionConfig.title : "MESH NODE"}
              </span>
              <span className="text-sm font-black uppercase tracking-tight leading-none text-white">
                CAZ OS
              </span>
            </button>
            <span className="text-xs font-mono opacity-85 hidden md:inline px-1">
              {currentSectionConfig ? currentSectionConfig.subtitle : "// SECTOR 4 AUTONOMOUS GRID"}
            </span>
          </div>

          {/* Live Status Readout */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Tip label="Microgrid battery reserve level">
              <StatusBadge icon={<Zap size={12} className="text-[#FAD13E]" />} label="PWR" value="84%" />
            </Tip>
            <Tip label="Rain catchment potable reserves">
              <StatusBadge icon={<Water size={12} className="text-[#3ABEAE]" />} label="H2O" value="1.2kL" />
            </Tip>
            <Tip label="Active local mesh peers online">
              <StatusBadge icon={<Users size={12} className="text-[#3CCC23]" />} label="PEERS" value="42" />
            </Tip>
            <Tip label="LoRa 915MHz packet reception quality">
              <StatusBadge icon={<Radio size={12} className="text-[#FFFFFF]" />} label="LORA" value="98%" />
            </Tip>
          </div>

          {/* Top Header Actions: Manifesto, Help Mode, Theme, Large Text, SOS, Restore & Account Profile */}
          <div className="flex items-center gap-2">
            {/* CAZ Manifesto / Overview Button */}
            <Tip label="CAZ Manifesto & 5 Core Pillars">
              <button
                onClick={() => setIsWelcomeOpen(true)}
                className="h-[26px] px-2 font-mono text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer border bg-white hover:bg-[#EFECE6] text-[#222D2C] border-[#222D2C] shadow-sm"
                style={{ borderRadius: 0 }}
                title="Open CAZ Manifesto & 5 Core Pillars Pop-up"
              >
                <BookOpen size={12} className="text-[#005EAC]" />
                <span className="text-xs font-mono">MANIFESTO</span>
              </button>
            </Tip>

            {/* Prominent Help Mode Toggle */}
            <button
              onClick={() => {
                const nextState = !isHelpMode;
                setIsHelpMode(nextState);
                if (!nextState) setHelpOverlay(null);
              }}
              className={cn(
                "h-[26px] px-2.5 font-mono text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer border-2 transition-all shadow-sm",
                isHelpMode 
                  ? "bg-[#FAD13E] text-[#222D2C] border-[#222D2C] ring-2 ring-[#222D2C]" 
                  : "bg-[#FFFFFF] text-[#222D2C] border-[#222D2C] hover:bg-[#FAD13E]"
              )}
              data-help-toggle="true"
              title="Click to toggle Help Mode: click any section for tutorial info"
            >
              <HelpCircle size={13} className={isHelpMode ? "text-[#DF4C40] animate-bounce" : "text-[#005EAC]"} />
              <span>{isHelpMode ? "HELP: ACTIVE [ON]" : "HELP MODE [OFF]"}</span>
            </button>
            {/* Theme Toggle: Sun / Moon */}
            <Tip label={themeMode === "system" ? `Theme: System (${isDarkEffective ? "Dark" : "Light"})` : themeMode === "dark" ? "Theme: Dark" : "Theme: Light"}>
              <button
                onClick={toggleTheme}
                aria-label={isDarkEffective ? "Switch to light theme" : "Switch to dark theme"}
                className={cn(
                  "h-[26px] px-2 font-mono text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer border transition-colors shadow-sm",
                  isDarkEffective
                    ? "bg-[#222D2C] text-[#FAD13E] border-[#5B6360] hover:bg-[#1A2221]"
                    : "bg-white text-[#222D2C] border-[#222D2C] hover:bg-[#EFECE6]"
                )}
                style={{ borderRadius: 0 }}
                title={`Theme Mode: ${themeMode.toUpperCase()}`}
              >
                {isDarkEffective ? <Moon size={12} className="fill-[#FAD13E]/40" /> : <Sun size={12} className="text-[#FF9600]" />}
                <span className="text-[11px] font-mono">{isDarkEffective ? "NIGHT" : "DAY"}</span>
              </button>
            </Tip>

            {/* Enlarge Text Size Toggle */}
            <Tip label={isLargeText ? "Switch to standard text size" : "Enlarge text size for field legibility"}>
              <button
                onClick={() => setIsLargeText(prev => !prev)}
                aria-label={isLargeText ? "Switch to standard text size" : "Enlarge text size"}
                className={cn(
                  "h-[26px] px-2 font-mono text-xs font-black uppercase flex items-center gap-1 cursor-pointer border transition-colors shadow-sm",
                  isLargeText
                    ? "bg-[#005EAC] text-white border-[#222D2C]"
                    : "bg-white hover:bg-[#EFECE6] text-[#222D2C] border-[#222D2C]"
                )}
                style={{ borderRadius: 0 }}
                title={isLargeText ? "Standard Text Size [AA]" : "Enlarge Text Size [AA]"}
              >
                <span className="tracking-tight font-black">AA</span>
                <span className="text-xs font-mono">{isLargeText ? "LARGE" : "NORM"}</span>
              </button>
            </Tip>

            {expandedSection ? (
              <button
                onClick={() => setExpandedSection(null)}
                className="h-[24px] bg-[#FFFFFF] hover:bg-[#EFECE6] text-[#222D2C] border border-[#222D2C] px-2.5 font-mono text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                style={{ borderRadius: 0 }}
                title="Restore to 3-column dashboard"
              >
                <X size={12} />
                <span>Restore View</span>
              </button>
            ) : (
              <div 
                onMouseDown={handleSosStart}
                onMouseUp={handleSosEnd}
                onMouseLeave={handleSosEnd}
                onTouchStart={handleSosStart}
                onTouchEnd={handleSosEnd}
                onTouchCancel={handleSosEnd}
                className="relative overflow-hidden cursor-pointer select-none touch-none [-webkit-touch-callout:none]"
              >
                <div 
                  className="absolute inset-0 bg-black/40 transition-all duration-75 pointer-events-none"
                  style={{ width: `${sosProgress}%` }}
                />
                <Button 
                  variant="danger" 
                  size="xs"
                  aria-label="Broadcast Emergency SOS"
                  className="relative z-10 flex items-center gap-1 bg-[#DF4C40] px-2 py-0 text-xs h-[24px] pointer-events-none select-none"
                >
                  <AlertTriangle size={12} />
                  <span>{isHoldingSos ? `HOLD (${Math.round(sosProgress)}%)` : "SOS MESH"}</span>
                </Button>
              </div>
            )}

            {/* User Account Avatar (Ariel Churi pixel art avatar) */}
            <Tip label="Account Profile: Ariel Churi">
              <button 
                onClick={() => setIsAccountOpen(true)}
                aria-label="Open Ariel Churi account profile"
                className="w-[24px] h-[24px] flex items-center justify-center bg-[#FFFFFF] border border-[#222D2C] hover:scale-105 cursor-pointer p-0 overflow-hidden"
                style={{ borderRadius: 0 }}
                title="Ariel Churi — Account Profile"
              >
                <img src={arielAvatar} alt="Ariel Churi" className="w-full h-full object-cover" />
              </button>
            </Tip>
          </div>
        </div>
      </header>

      {/* ─── WORKSPACE CONTENT ─────────────────────────────────────── */}
      {expandedSection ? (
        /* =========================================================
            EXPANDED FULL-SCREEN SECTION CONTENT
            Uses the EXACT same state & data sources as contracted views!
            ========================================================= */
        <main 
          onClickCapture={(e) => isHelpMode && triggerSectionHelp(currentSectionConfig?.title || expandedSection, expandedSection, e)}
          className={cn(
            "flex-1 w-full h-[calc(100vh-38px)] overflow-y-auto bg-[#EFECE6] p-4",
            isHelpMode && "cursor-help"
          )}
        id="main-dashboard-grid"
        >
          
          {/* EXPANDED: CARTOGRAPHY */}
          {expandedSection === "map" && (
            <div className="w-full h-full flex flex-col gap-2">
              <div className="flex-1 border border-[#222D2C] relative min-h-[500px]">
                <TonerMap isFullscreen={true} />
              </div>
              <div className="p-2.5 bg-[#FFFFFF] border border-[#222D2C] font-mono text-xs flex justify-between items-center">
                <span>SECTOR 4 COMMUNITY GRID // 8 ROWS (A-H) x 8 COLS (1-8) // CALIBRATED OSM GEOMETRY</span>
                <span className="text-[#5B6360]">UPPER MONTCLAIR, MSU, DOWNTOWN & MILLS RESERVATION</span>
              </div>
            </div>
          )}

          {/* EXPANDED: MUTUAL AID MATCHER */}
          {expandedSection === "matcher" && (
            <div className="max-w-5xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#005EAC] text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase">MUTUAL AID MATCHER (SECTION 2.2)</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 font-mono">
                    {needs.length} NEEDS // {offers.length} OFFERS
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex border border-white/30 font-mono text-xs">
                    <button
                      onClick={() => setViewMode("take")}
                      className={cn(
                        "px-2.5 py-1 font-bold uppercase transition-colors cursor-pointer",
                        viewMode === "take" ? "bg-white text-[#005EAC]" : "bg-transparent text-white hover:bg-white/10"
                      )}
                    >
                      NEEDS ({needs.length})
                    </button>
                    <button
                      onClick={() => setViewMode("give")}
                      className={cn(
                        "px-2.5 py-1 font-bold uppercase transition-colors cursor-pointer",
                        viewMode === "give" ? "bg-white text-[#005EAC]" : "bg-transparent text-white hover:bg-white/10"
                      )}
                    >
                      OFFERS ({offers.length})
                    </button>
                  </div>
                  <Tip label="Post new request to local mesh" notImplemented={true}>
                    <Button variant="primary" size="xs" className="!bg-[#0F3D64]">
                      <Plus size={12} /> Post Listing
                    </Button>
                  </Tip>
                </div>
              </div>

              {/* Category Filter Bar */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 font-mono text-xs">
                {["all", "food", "medical", "tools", "energy", "comms"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={cn(
                      "px-2.5 py-1 font-bold uppercase border transition-colors cursor-pointer",
                      activeFilter === cat 
                        ? "bg-[#222D2C] text-white border-[#222D2C]" 
                        : "bg-white text-[#222D2C] border-[#222D2C] hover:bg-[#EFECE6]"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Listings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {viewMode === "take" ? (
                  filteredNeeds.length > 0 ? (
                    filteredNeeds.map((item) => (
                      <div key={item.id} className="p-3 bg-[#FFFFFF] border-2 border-[#222D2C] flex flex-col justify-between shadow-sm">
                        <div>
                          <div className="flex justify-between items-start mb-1.5">
                            <span className={cn("text-xs font-mono font-bold px-1.5 py-0.5 uppercase text-white", item.color)}>
                              {item.category}
                            </span>
                            <span className="font-mono text-xs text-[#5B6360] bg-[#EFECE6] px-1.5 py-0.5 border border-[#222D2C]/30">
                              {item.time} // {item.urgency}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-[#222D2C] mb-1">{item.title}</h4>
                          <p className="text-xs text-[#5B6360] leading-relaxed mb-2 font-mono">{item.type} request from Sector 4 peer node.</p>
                        </div>
                        <div className="pt-2 border-t border-[#222D2C]/20 flex justify-between items-center font-mono text-xs">
                          <span className="text-[#005EAC] font-bold">BY: {item.user}</span>
                          <Tip label="Fulfill this community request" notImplemented={true}>
                            <Button variant="primary" size="xs" className="!bg-[#005EAC]">Fulfill Need →</Button>
                          </Tip>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-6 text-center bg-white border border-[#222D2C] font-mono text-xs text-[#5B6360]">
                      No needs found matching category "{activeFilter.toUpperCase()}".
                    </div>
                  )
                ) : (
                  filteredOffers.length > 0 ? (
                    filteredOffers.map((item) => (
                      <div key={item.id} className="p-3 bg-[#FFFFFF] border-2 border-[#222D2C] flex flex-col justify-between shadow-sm">
                        <div>
                          <div className="flex justify-between items-start mb-1.5">
                            <span className={cn("text-xs font-mono font-bold px-1.5 py-0.5 uppercase text-white", item.color)}>
                              {item.category}
                            </span>
                            <span className="font-mono text-xs text-[#3CCC23] font-bold bg-[#EFECE6] px-1.5 py-0.5 border border-[#222D2C]/30">
                              AVAIL: {item.available}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-[#222D2C] mb-1">{item.title}</h4>
                          <p className="text-xs text-[#5B6360] leading-relaxed mb-2 font-mono">{item.type} community surplus available for collection.</p>
                        </div>
                        <div className="pt-2 border-t border-[#222D2C]/20 flex justify-between items-center font-mono text-xs">
                          <span className="text-[#3CCC23] font-bold">OFFERED BY: {item.user}</span>
                          <Tip label="Request this community offer" notImplemented={true}>
                            <Button variant="secondary" size="xs">Claim Offer →</Button>
                          </Tip>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-6 text-center bg-white border border-[#222D2C] font-mono text-xs text-[#5B6360]">
                      No offers found matching category "{activeFilter.toUpperCase()}".
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* EXPANDED: TRANSPORT & RIDESHARE */}
          {expandedSection === "transport" && (
            <TransportExpandedView
              entries={transportEntries}
              onAddEntry={handleAddTransport}
              onClaimEntry={handleClaimTransport}
            />
          )}

          {/* EXPANDED: CALENDAR & FELLOWSHIP */}
          {expandedSection === "calendar" && (
            <div className="max-w-5xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#3CCC23] text-white flex justify-between items-center">
                <span className="font-mono text-xs font-bold uppercase">COMMUNITY CALENDAR & FELLOWSHIP SCHEDULE ({calendarEvents.length} EVENTS)</span>
                <Tip label="Add new community event" notImplemented={true}>
                  <Button variant="primary" size="xs" className="!bg-[#2e7a21]">
                    <Plus size={12} /> Propose Event
                  </Button>
                </Tip>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {calendarEvents.map((ev) => (
                  <div key={ev.id} className="p-3 bg-[#FFFFFF] border-2 border-[#222D2C] flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn("text-xs font-mono font-bold px-1.5 py-0.5 uppercase", ev.tagColor)}>
                          {ev.type}
                        </span>
                        <span className="font-mono text-xs font-bold bg-[#EFECE6] border border-[#222D2C] px-2 py-0.5">
                          {ev.date}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#222D2C] mb-1">{ev.title}</h4>
                      <p className="font-mono text-xs text-[#5B6360] mb-2">{ev.time} • {ev.location}</p>
                    </div>
                    <div className="flex justify-between items-center border-t border-[#222D2C]/20 pt-2 font-mono text-xs">
                      <span className="font-bold text-[#3CCC23]">{ev.rsvpCount} Neighbors Attending</span>
                      <Tip label="RSVP to event" notImplemented={true}>
                        <Button variant="primary" size="xs" className="!bg-[#3CCC23]">Join / RSVP</Button>
                      </Tip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXPANDED: BULLETIN */}
          {expandedSection === "bulletin" && (
            <div className="max-w-5xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#FAD13E] text-[#222D2C] flex justify-between items-center font-bold">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase">NEIGHBORHOOD BULLETIN BOARD ({bulletins.length} FLYERS)</span>
                  <span className="text-xs bg-black/10 px-2 py-0.5 font-mono uppercase">{bulletinViewMode} MODE</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex border border-[#222D2C]">
                    <button
                      onClick={() => setBulletinViewMode("pinboard")}
                      className={cn(
                        "px-2 py-1 font-mono text-xs font-bold uppercase transition-colors cursor-pointer",
                        bulletinViewMode === "pinboard" ? "bg-[#222D2C] text-white" : "bg-white text-[#222D2C]"
                      )}
                    >
                      Pinboard
                    </button>
                    <button
                      onClick={() => setBulletinViewMode("list")}
                      className={cn(
                        "px-2 py-1 font-mono text-xs font-bold uppercase transition-colors cursor-pointer",
                        bulletinViewMode === "list" ? "bg-[#222D2C] text-white" : "bg-white text-[#222D2C]"
                      )}
                    >
                      List View
                    </button>
                  </div>
                  <Tip label="Pin new flyer to board" notImplemented={true}>
                    <Button variant="primary" size="xs" className="!bg-[#222D2C] !text-white">
                      <Plus size={12} /> Pin Flyer
                    </Button>
                  </Tip>
                </div>
              </div>

              {bulletinViewMode === "pinboard" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {bulletins.map((b) => (
                    <div key={b.id} className={cn("p-3 border-2 flex flex-col justify-between shadow-sm", b.isPinned ? "bg-[#FFFFFF] border-[#222D2C]" : "bg-[#EFECE6] border-[#BCBCB8]")}>
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <span className={cn("text-xs font-mono font-bold px-1.5 py-0.5 uppercase block", b.tagColor)}>{b.tag}</span>
                          {b.isPinned && <span className="text-xs font-mono uppercase bg-[#FAD13E] px-1 font-bold">PINNED</span>}
                        </div>
                        <h4 className="font-bold text-xs text-[#222D2C] mb-1">{b.title}</h4>
                        <p className="text-xs text-[#5B6360] leading-relaxed">{b.content}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#222D2C]/20 font-mono text-xs text-[#5B6360] flex justify-between">
                        <span>{b.author}</span>
                        <span>{b.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {bulletins.map((b) => (
                    <div key={b.id} className="p-3 bg-white border border-[#222D2C] flex justify-between items-center">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-xs font-mono font-bold px-1 py-0.2 uppercase", b.tagColor)}>{b.tag}</span>
                          <span className="font-bold text-xs text-[#222D2C]">{b.title}</span>
                          {b.isPinned && <span className="text-xs font-mono bg-[#FAD13E] px-1 font-bold">PINNED</span>}
                        </div>
                        <p className="text-xs text-[#5B6360] truncate">{b.content}</p>
                      </div>
                      <div className="font-mono text-xs text-[#5B6360] shrink-0 pl-3">
                        {b.author} • {b.date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EXPANDED: DISCUSSIONS */}
          {expandedSection === "discussions" && (
            <div className="max-w-5xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#8F57CB] text-white flex justify-between items-center">
                <span className="font-mono text-xs font-bold uppercase">TOPICAL WORKING GROUP DISCUSSIONS ({discussionTopics.length} TOPICS)</span>
                <Tip label="Create new working group topic" notImplemented={true}>
                  <Button variant="primary" size="xs" className="!bg-[#5e3191]">
                    <Plus size={12} /> New Topic
                  </Button>
                </Tip>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {discussionTopics.map((t) => (
                  <div key={t.id} className="p-3 bg-[#FFFFFF] border-2 border-[#222D2C] flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-[#222D2C]">#{t.name}</h4>
                        {t.unreadCount > 0 && <span className="bg-[#DF4C40] text-white px-1.5 py-0.5 text-xs font-bold font-mono">{t.unreadCount} NEW</span>}
                      </div>
                      <p className="text-xs text-[#5B6360] leading-relaxed mb-2">{t.desc}</p>
                    </div>
                    <div className="flex justify-between items-center border-t border-[#222D2C]/20 pt-2 font-mono text-xs">
                      <span className="text-[#8F57CB] font-bold">{t.activeMembers} peers online • {t.postsCount} total posts</span>
                      <Tip label="Enter topic room" notImplemented={true}>
                        <Button variant="outline" size="xs">Enter Room →</Button>
                      </Tip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXPANDED: GOVERNANCE */}
          {expandedSection === "governance" && (
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#0F3D64] text-white flex justify-between items-center">
                <span className="font-mono text-xs font-bold uppercase">DIRECT CONSENSUS GOVERNANCE & CHARTER</span>
                <Tip label="Submit referendum proposal" notImplemented={true}>
                  <Button variant="primary" size="xs" className="!bg-[#071f33]">
                    <Plus size={12} /> New Proposal
                  </Button>
                </Tip>
              </div>
              <div className="p-4 bg-[#FFFFFF] border-2 border-[#222D2C] space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono uppercase bg-[#3CCC23] text-white px-1.5 py-0.5 font-bold">ACTIVE REFERENDUM</span>
                    <h3 className="font-bold text-base text-[#222D2C] mt-1">Solar Array Expansion Phase 2</h3>
                  </div>
                  <span className="font-mono text-xs bg-[#EFECE6] border border-[#222D2C] px-2 py-1 font-bold">48H REMAINING</span>
                </div>
                <p className="text-xs text-[#5B6360] leading-relaxed">
                  Proposal to allocate 12 surplus 400W bifacial panels to Upper Montclair Community Center and interconnect with Sector 4 Microgrid storage bank.
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-xs font-bold">
                    <span>VOTING QUORUM (42 / 45 ACTIVE PEERS)</span>
                    <span className="text-[#3CCC23]">80% SUPERMAJORITY REACHED</span>
                  </div>
                  <div className="h-4 w-full bg-[#DFDDD7] border border-[#222D2C] flex">
                    <div className="h-full bg-[#0F3D64]" style={{ width: "80%" }} />
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-[#222D2C]/20">
                  <Tip label="Cast approval vote" notImplemented={true}><Button variant="primary" size="sm" className="!bg-[#3CCC23]">Approve Proposal</Button></Tip>
                  <Tip label="Object with amendment" notImplemented={true}><Button variant="danger" size="sm">Object / Amend</Button></Tip>
                  <Tip label="Enter general assembly room" notImplemented={true}><Button variant="outline" size="sm">Enter Assembly Audio</Button></Tip>
                </div>
              </div>
            </div>
          )}

          {/* EXPANDED: LABOR & TOOL GUILDS */}
          {expandedSection === "labor" && (
            <div className="max-w-5xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#FF9600] text-white flex justify-between items-center">
                <div>
                  <span className="font-mono text-xs font-bold uppercase">COMMUNITY LABOR, WORK ORDERS & TOOL GUILDS</span>
                  <span className="font-mono text-xs bg-white/20 px-2 py-0.5 ml-2 font-bold">
                    {tools.filter(t => t.status === "available").length} AVAILABLE / {tools.length} IN DEPOT
                  </span>
                </div>
                <Tip label="Log new work order" notImplemented={true}>
                  <Button variant="primary" size="xs" className="!bg-[#b86e0c]">
                    <Plus size={12} /> Log Work Order
                  </Button>
                </Tip>
              </div>

              {/* Infrastructure Status Banner */}
              <div className="p-4 bg-white border-2 border-[#222D2C] space-y-3">
                <div className="flex items-center justify-between border-b border-[#222D2C]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="text-[#FF9600]" size={18} />
                    <div>
                      <div className="font-bold text-sm uppercase">Sector 4 Infrastructure Status: Stable</div>
                      <div className="font-mono text-xs text-[#5B6360]">0 critical work orders // 3 preventative maintenance shifts</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs bg-[#3CCC23] text-white px-2 py-0.5 font-bold">ALL SYSTEMS NORMAL</span>
                </div>

                {/* Tool Inventory Catalog */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center">
                    <h4 className="font-mono text-xs font-bold uppercase text-[#222D2C] flex items-center gap-1.5">
                      <Hammer size={14} className="text-[#FF9600]" />
                      Tool Guild Lending Catalog ({tools.length} Items)
                    </h4>
                    <div className="flex gap-1 font-mono text-xs">
                      {["all", "Power", "Electrical", "Carpentry", "Ag/Earth"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedToolCategory(cat)}
                          className={cn(
                            "px-2 py-0.5 uppercase border text-xs font-bold transition-colors cursor-pointer",
                            selectedToolCategory === cat
                              ? "bg-[#222D2C] text-white border-[#222D2C]"
                              : "bg-white text-[#222D2C] border-[#222D2C] hover:bg-[#EFECE6]"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {tools
                      .filter(t => selectedToolCategory === "all" || t.category === selectedToolCategory)
                      .map((tool) => (
                        <div key={tool.id} className="p-2.5 bg-[#EFECE6] border border-[#222D2C] flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-1 mb-1">
                              <span className="font-mono text-[10px] font-bold uppercase px-1 py-0.2 bg-[#FF9600]/20 text-[#b86e0c] border border-[#FF9600]/40">
                                {tool.category}
                              </span>
                              {tool.status === "available" ? (
                                <span className="font-mono text-[10px] bg-[#3CCC23] text-white px-1.5 py-0.2 font-bold uppercase">
                                  AVAILABLE
                                </span>
                              ) : (
                                <span className="font-mono text-[10px] bg-[#005EAC] text-white px-1.5 py-0.2 font-bold uppercase">
                                  ON LOAN
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-xs text-[#222D2C]">{tool.name}</div>
                            <div className="font-mono text-xs text-[#5B6360] mt-0.5">
                              {tool.status === "available" ? `Location: ${tool.location}` : `Borrower: ${tool.borrower} (Due: ${tool.due})`}
                            </div>
                          </div>
                          <div className="pt-2 mt-2 border-t border-[#222D2C]/20 flex justify-between items-center">
                            <span className="font-mono text-[10px] text-[#5B6360]">ID: {tool.id.toUpperCase()}</span>
                            {tool.status === "available" ? (
                              <Button 
                                variant="yellow" 
                                size="xs" 
                                className="h-[22px] text-xs font-mono font-bold"
                                onClick={() => {
                                  setTools(prev => prev.map(t => t.id === tool.id ? { ...t, status: "on_loan", borrower: "Ariel Churi", due: "In 3 Days" } : t));
                                }}
                              >
                                Check Out Tool →
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="xs" 
                                className="h-[22px] text-xs font-mono font-bold"
                                onClick={() => {
                                  setTools(prev => prev.map(t => t.id === tool.id ? { ...t, status: "available", location: "Depot Staging", borrower: undefined, due: undefined } : t));
                                }}
                              >
                                Return to Depot
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Active Work Orders */}
                <div className="space-y-2 pt-3 border-t border-[#222D2C]">
                  <h4 className="font-mono text-xs font-bold uppercase text-[#222D2C] flex items-center gap-1.5">
                    <Users size={14} className="text-[#FF9600]" />
                    Active Collective Labor Shifts & Barn-Raisings
                  </h4>
                  <div className="space-y-2 font-mono text-xs">
                    {workOrders.map((wo) => (
                      <div key={wo.id} className="p-3 bg-[#EFECE6] border border-[#222D2C] flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "font-bold text-[10px] px-1 py-0.2 uppercase text-white",
                              wo.priority === "high" ? "bg-[#DF4C40]" : "bg-[#005EAC]"
                            )}>
                              {wo.priority} PRIORITY
                            </span>
                            <span className="font-bold font-sans text-xs text-[#222D2C]">{wo.title}</span>
                          </div>
                          <div className="text-[#5B6360] text-xs">
                            Shift: {wo.shift} • Crew Size: {wo.crew} Volunteers • Lead: {wo.lead}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="primary" 
                            size="xs" 
                            className="!bg-[#3CCC23] h-[24px]"
                            onClick={() => {
                              setWorkOrders(prev => prev.map(w => w.id === wo.id ? { ...w, crew: w.crew + 1 } : w));
                              alert(`✓ Registered for ${wo.title}`);
                            }}
                          >
                            RSVP to Crew ({wo.crew})
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EXPANDED: POWER / MICROGRID */}
          {expandedSection === "power" && (
            <div className="max-w-5xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#3CCC23] text-white flex justify-between items-center">
                <span className="font-mono text-xs font-bold uppercase">MICROGRID ENERGY, SOURCES & 48V STORAGE TELEMETRY</span>
                <span className="font-mono text-xs bg-white/20 px-2 py-0.5 font-bold">8.4 / 10 kWh (84% • 51.8V)</span>
              </div>
              <div className="p-4 bg-white border-2 border-[#222D2C] space-y-4 font-mono text-xs">
                {/* Generation Sources Grid */}
                <div>
                  <h4 className="font-bold text-xs text-[#222D2C] uppercase mb-2 flex items-center gap-1.5">
                    <Zap size={14} className="text-[#3CCC23]" />
                    Generation Sources Telemetry
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                      <div className="flex justify-between items-center text-[#5B6360]">
                        <span>SOLAR MPPT ARRAY</span>
                        <span className="text-[#3CCC23] font-bold">ACTIVE</span>
                      </div>
                      <div className="text-xl font-bold text-[#3CCC23] mt-1">+1,240 W</div>
                      <div className="text-[11px] text-[#5B6360] mt-1">4 strings • 148V DC • Inverter efficiency 98.2%</div>
                    </div>
                    <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                      <div className="flex justify-between items-center text-[#5B6360]">
                        <span>MICRO-HYDRO PELTON</span>
                        <span className="text-[#3CCC23] font-bold">CONTINUOUS</span>
                      </div>
                      <div className="text-xl font-bold text-[#3CCC23] mt-1">+380 W</div>
                      <div className="text-[11px] text-[#5B6360] mt-1">14 L/s stream head • 22m pressure head • 48V alternator</div>
                    </div>
                    <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                      <div className="flex justify-between items-center text-[#5B6360]">
                        <span>EU2200i GENERATOR</span>
                        <span className="text-[#5B6360] font-bold">STANDBY</span>
                      </div>
                      <div className="text-xl font-bold text-[#222D2C] mt-1">0 W</div>
                      <div className="text-[11px] text-[#5B6360] mt-1">Gasoline reserve 95% full • Auto-start ready if SOC &lt; 20%</div>
                    </div>
                  </div>
                </div>

                {/* Baseload & Consumption */}
                <div>
                  <h4 className="font-bold text-xs text-[#222D2C] uppercase mb-2 flex items-center gap-1.5">
                    <Gauge size={14} className="text-[#005EAC]" />
                    Current Load Consumption & Runtime
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                      <div className="text-[#5B6360]">CRITICAL PRESERVATION</div>
                      <div className="text-base font-bold text-[#DF4C40] mt-1">-120 W</div>
                      <div className="text-[11px] text-[#5B6360] mt-1">Insulin & vaccine refrigeration • Vaccine cold chest</div>
                    </div>
                    <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                      <div className="text-[#5B6360]">COMMS REPEATER TOWER</div>
                      <div className="text-base font-bold text-[#005EAC] mt-1">-45 W</div>
                      <div className="text-[11px] text-[#5B6360] mt-1">Mills tower 915MHz repeater • Mesh router backbone</div>
                    </div>
                    <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                      <div className="text-[#5B6360]">TOOL DEPOT & WELL PUMP</div>
                      <div className="text-base font-bold text-[#222D2C] mt-1">-215 W</div>
                      <div className="text-[11px] text-[#5B6360] mt-1">Battery charging bench • Cistern UV sterilizer pump</div>
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#3CCC23]/10 border border-[#3CCC23] mt-2 flex justify-between items-center text-xs">
                    <span className="font-bold text-[#1f7314]">NET CHARGE RATE: +1,240 W INFLOW INTO BATTERY BANK</span>
                    <span className="font-bold text-[#222D2C]">ESTIMATED RUNTIME: 28.4 HOURS AT BASELOAD</span>
                  </div>
                </div>

                {/* 24-Hour Telemetry History Table */}
                <div>
                  <h4 className="font-bold text-xs text-[#222D2C] uppercase mb-2 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-[#3CCC23]" />
                    24-Hour Historical Generation & Load Ledger
                  </h4>
                  <div className="border border-[#222D2C] overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#222D2C] text-white">
                          <th className="p-2 border-r border-white/20">INTERVAL</th>
                          <th className="p-2 border-r border-white/20">SOLAR MPPT</th>
                          <th className="p-2 border-r border-white/20">HYDRO</th>
                          <th className="p-2 border-r border-white/20">TOTAL GENERATION</th>
                          <th className="p-2 border-r border-white/20">TOTAL LOAD</th>
                          <th className="p-2">NET BALANCE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {POWER_HISTORY_24H.map((row, idx) => (
                          <tr key={row.time} className={idx % 2 === 0 ? "bg-white" : "bg-[#EFECE6]"}>
                            <td className="p-2 font-bold border-r border-[#222D2C]/20">{row.time}</td>
                            <td className="p-2 border-r border-[#222D2C]/20">+{Math.max(row.gen - 380, 0)} W</td>
                            <td className="p-2 border-r border-[#222D2C]/20">+380 W</td>
                            <td className="p-2 font-bold text-[#3CCC23] border-r border-[#222D2C]/20">+{row.gen} W</td>
                            <td className="p-2 font-bold text-[#005EAC] border-r border-[#222D2C]/20">-{row.load} W</td>
                            <td className="p-2 font-bold text-[#1f7314]">
                              {row.gen - row.load >= 0 ? `+${row.gen - row.load} W` : `-${row.load - row.gen} W`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EXPANDED: WATER RESERVES */}
          {expandedSection === "water" && (
            <div className="max-w-5xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#3ABEAE] text-white flex justify-between items-center">
                <span className="font-mono text-xs font-bold uppercase">WATER RESERVES, RAIN BARRELS & UV PURIFICATION TELEMETRY</span>
                <span className="font-mono text-xs bg-white/20 px-2 py-0.5 font-bold">TOTAL RESERVES: 7,540 L</span>
              </div>
              <div className="p-4 bg-white border-2 border-[#222D2C] space-y-4 font-mono text-xs">
                {/* Cistern vs Rain Barrels Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                    <div className="text-[#5B6360] font-bold">CENTRAL POTABLE CISTERN (UV TREATED)</div>
                    <div className="text-2xl font-bold text-[#3ABEAE] mt-1">1,240 / 2,000 L</div>
                    <div className="h-3 w-full bg-[#DFDDD7] border border-[#222D2C] p-0.5 my-2">
                      <div className="h-full bg-[#3ABEAE]" style={{ width: "62%" }} />
                    </div>
                    <div className="text-[11px] text-[#5B6360]">62% capacity • TDS: 12 PPM (Safe Potable) • UV Chamber Active</div>
                  </div>
                  <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                    <div className="text-[#5B6360] font-bold">NEIGHBORHOOD RAIN BARRELS ESTIMATE</div>
                    <div className="text-2xl font-bold text-[#005EAC] mt-1">~6,300 / 8,750 L</div>
                    <div className="h-3 w-full bg-[#DFDDD7] border border-[#222D2C] p-0.5 my-2">
                      <div className="h-full bg-[#005EAC]" style={{ width: "72%" }} />
                    </div>
                    <div className="text-[11px] text-[#5B6360]">72% capacity across 42 residential barrels (55 gal each)</div>
                  </div>
                </div>

                {/* Rain Barrels Sector Breakdown */}
                <div>
                  <h4 className="font-bold text-xs text-[#222D2C] uppercase mb-2 flex items-center gap-1.5">
                    <CloudRain size={14} className="text-[#005EAC]" />
                    Residential Rain Barrel Census Breakdown
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                      <div className="font-bold text-[#222D2C]">SECTOR A: UPPER MONTCLAIR WEST</div>
                      <div className="text-lg font-bold text-[#005EAC] mt-1">18 Barrels (~2,700 L)</div>
                      <div className="text-[11px] text-[#5B6360] mt-1">Average fill level: 74% • First flush diverters clean</div>
                    </div>
                    <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                      <div className="font-bold text-[#222D2C]">SECTOR B: MSU CAMPUS PERIMETER</div>
                      <div className="text-lg font-bold text-[#005EAC] mt-1">12 Barrels (~1,800 L)</div>
                      <div className="text-[11px] text-[#5B6360] mt-1">Average fill level: 70% • Food garden drip feed enabled</div>
                    </div>
                    <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                      <div className="font-bold text-[#222D2C]">SECTOR C: MILLS RESERVATION SLOPE</div>
                      <div className="text-lg font-bold text-[#005EAC] mt-1">12 Barrels (~1,800 L)</div>
                      <div className="text-[11px] text-[#5B6360] mt-1">Average fill level: 71% • Gravity-fed slope catchment</div>
                    </div>
                  </div>
                </div>

                {/* 3-Stage Filtration Pipeline */}
                <div className="p-3 bg-[#EFECE6] border border-[#222D2C] space-y-2">
                  <div className="font-bold text-xs uppercase text-[#222D2C]">3-Stage UV Potable Water Treatment Verification</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-white border border-[#222D2C]">
                      <span className="font-bold text-[#3CCC23] block">✓ STAGE 1: FIRST-FLUSH & 5µ SEDIMENT</span>
                      <span className="text-[#5B6360]">Removes suspended particulate & roof debris. Checked weekly.</span>
                    </div>
                    <div className="p-2 bg-white border border-[#222D2C]">
                      <span className="font-bold text-[#3CCC23] block">✓ STAGE 2: ACTIVATED CARBON BLOCK</span>
                      <span className="text-[#5B6360]">Adsorbs VOCs, chlorine, and organic compounds. Pressure drop: 2 PSI.</span>
                    </div>
                    <div className="p-2 bg-white border border-[#222D2C]">
                      <span className="font-bold text-[#3CCC23] block">✓ STAGE 3: 254nm UV STERILIZATION</span>
                      <span className="text-[#5B6360]">99.99% pathogen eradication. 24W UV lamp operating continuously.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EXPANDED: NEIGHBORING COMMUNITIES */}
          {expandedSection === "neighbors" && (
            <div className="max-w-5xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#0F5257] text-white flex justify-between items-center">
                <span className="font-mono text-xs font-bold uppercase">REGIONAL FEDERATION, INTER-ZONE ENVOYS & TRADE COMPACTS</span>
                <span className="font-mono text-xs bg-white/20 px-2 py-0.5 font-bold">3 FEDERATED NODES</span>
              </div>
              <div className="p-4 bg-white border-2 border-[#222D2C] space-y-4 font-mono text-xs">
                {/* Federation Directory */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-[#222D2C] uppercase flex items-center gap-1.5">
                    <Globe size={14} className="text-[#0F5257]" />
                    Regional Zone Envoys & Bilateral Pacts
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {NEIGHBOR_COMMUNITIES.map((comm) => (
                      <div key={comm.id} className="p-3 bg-[#EFECE6] border-2 border-[#222D2C] flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-xs uppercase text-[#222D2C]">{comm.name}</span>
                            <span className="font-mono text-[10px] bg-[#0F5257] text-white px-1 font-bold">{comm.zone}</span>
                          </div>
                          <div className="text-[11px] text-[#5B6360] mb-2">{comm.distance} {comm.direction} • {comm.linkDesc}</div>
                          
                          <div className="p-2 bg-white border border-[#222D2C] space-y-1 mb-2">
                            <div className="text-[10px] text-[#5B6360]">OFFICIAL LIAISON / ENVOY:</div>
                            <div className="font-bold text-[#222D2C]">{comm.official.name}</div>
                            <div className="text-[11px] text-[#005EAC]">{comm.official.role}</div>
                            <div className="text-[10px] text-[#5B6360]">{comm.official.callsign} • {comm.official.channel}</div>
                          </div>

                          <div className="text-[11px] space-y-1">
                            <div><span className="font-bold text-[#1f7314]">SURPLUS:</span> {comm.surplus.join(", ")}</div>
                            <div><span className="font-bold text-[#b86e0c]">SEEKING:</span> {comm.seeking.join(", ")}</div>
                          </div>
                        </div>

                        <div className="pt-2 mt-2 border-t border-[#222D2C]/20 flex gap-1">
                          <Button 
                            variant="yellow" 
                            size="xs" 
                            className="flex-1 text-xs font-bold"
                            onClick={() => {
                              setInterZoneMessage(`Propose trade compact with ${comm.name}: offer battery storage/tools in exchange for ${comm.surplus[0]}.`);
                              setInterZoneSent(false);
                              setInterZoneModal({ open: true, type: "trade", community: comm });
                            }}
                          >
                            Propose Trade
                          </Button>
                          <Button 
                            variant="outline" 
                            size="xs" 
                            className="flex-1 text-xs font-bold"
                            onClick={() => {
                              setInterZoneMessage(`Aid Request to ${comm.official.name}: requesting emergency resources.`);
                              setInterZoneSent(false);
                              setInterZoneModal({ open: true, type: "request", community: comm });
                            }}
                          >
                            Request Aid
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transport & Courier Schedules */}
                <div className="p-3 bg-[#EFECE6] border border-[#222D2C] space-y-2">
                  <div className="font-bold text-xs uppercase text-[#222D2C]">Courier Dispatch & Radio Check-In Timetable</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-white border border-[#222D2C]">
                      <span className="font-bold text-[#0F5257] block">PATERSON CORRIDOR</span>
                      <span className="text-[#5B6360]">LoRa radio roll call daily at 08:00 & 20:00. Bike cargo run every Tuesday.</span>
                    </div>
                    <div className="p-2 bg-white border border-[#222D2C]">
                      <span className="font-bold text-[#0F5257] block">BLOOMFIELD CORRIDOR</span>
                      <span className="text-[#5B6360]">Continuous 2.4GHz Wi-Fi bridge. Shared microgrid telemetry sync every 60s.</span>
                    </div>
                    <div className="p-2 bg-white border border-[#222D2C]">
                      <span className="font-bold text-[#0F5257] block">NEWARK IRONBOUND CORRIDOR</span>
                      <span className="text-[#5B6360]">Cargo runner dispatch Thursday & Sunday. APRS packet beacon active.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EXPANDED: MESH NETWORK TELEMETRY */}
          {expandedSection === "mesh" && (
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#FF9600] text-white flex justify-between items-center">
                <span className="font-mono text-xs font-bold uppercase">LORA 915MHz MESH TELEMETRY (42 NODES ACTIVE)</span>
                <span className="font-mono text-xs bg-white/20 px-2 py-0.5">CHANNEL 1 // 98% PACKET HEALTH</span>
              </div>
              <div className="p-4 bg-white border-2 border-[#222D2C] space-y-3 font-mono text-xs">
                <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                  <div className="font-bold text-sm text-[#222D2C] mb-2">MESH TOPOLOGY OVERVIEW</div>
                  <div className="text-xs text-[#5B6360] leading-relaxed">
                    Connected to 42 active neighbor nodes spanning Mills Mountain Ridge, Upper Montclair village, Watchung Plaza, and South End. Average packet hop latency: 140ms.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EXPANDED: NATURE CLOCK & WEATHER */}
          {expandedSection === "nature" && (
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#FAD13E] text-[#222D2C] flex justify-between items-center font-bold">
                <span className="font-mono text-xs uppercase">NATURE CLOCK & 5-DAY EPHEMERIS</span>
                <span className="font-mono text-xs bg-black/10 px-2 py-0.5">MONTCLAIR 40.82°N, 74.21°W</span>
              </div>
              <div className="p-4 bg-white border-2 border-[#222D2C] space-y-3 font-mono text-xs">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-[#EFECE6] border border-[#222D2C]">
                    <div className="text-xs text-[#5B6360]">SUNRISE</div>
                    <div className="font-bold text-sm mt-0.5">06:24</div>
                  </div>
                  <div className="p-2 bg-[#EFECE6] border border-[#222D2C]">
                    <div className="text-xs text-[#5B6360]">SOLAR NOON</div>
                    <div className="font-bold text-sm mt-0.5">13:02</div>
                  </div>
                  <div className="p-2 bg-[#EFECE6] border border-[#222D2C]">
                    <div className="text-xs text-[#5B6360]">SUNSET</div>
                    <div className="font-bold text-sm mt-0.5">19:41</div>
                  </div>
                  <div className="p-2 bg-[#EFECE6] border border-[#222D2C]">
                    <div className="text-xs text-[#5B6360]">LUNAR PHASE</div>
                    <div className="font-bold text-sm mt-0.5">WAXING GIBBOUS</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EXPANDED: COMMS */}
          {expandedSection === "comms" && (
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#005EAC] text-white flex justify-between items-center">
                <span className="font-mono text-xs font-bold uppercase">LOCAL MESH MESSENGER // SECTOR 4 GENERAL</span>
                <span className="font-mono text-xs bg-white/20 px-2 py-0.5">12 PEERS ONLINE</span>
              </div>
              <div className="p-4 bg-white border-2 border-[#222D2C] space-y-3">
                <div className="p-3 bg-[#EFECE6] border border-[#222D2C] font-mono text-xs space-y-2">
                  <div className="text-[#005EAC] font-bold">[14:22] Mills Node #12: High-altitude repeater battery at 96% after morning sun.</div>
                  <div className="text-[#3CCC23] font-bold">[15:04] Walnut Tool Guild: Welding kit returned and sanitized. Available for loan.</div>
                  <div className="text-[#222D2C] font-bold">[16:11] Ariel Churi (Node #742): Solar array intertie check completed at MSU.</div>
                </div>
              </div>
            </div>
          )}

          {/* EXPANDED: KNOWLEDGE BASE */}
          {expandedSection === "knowledge" && (
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#8F57CB] text-white flex justify-between items-center">
                <span className="font-mono text-xs font-bold uppercase">OFFLINE KNOWLEDGE BASE & TECHNICAL MANUALS</span>
                <span className="font-mono text-xs bg-white/20 px-2 py-0.5">3 CORE MANUALS</span>
              </div>
              <div className="p-4 bg-white border-2 border-[#222D2C] space-y-2">
                <FileItem name="Solar_Repair_v2.pdf" size="2.4MB" icon={<FileText size={14} />} />
                <FileItem name="Mesh_Protocol.md" size="12KB" icon={<FileCode size={14} />} />
                <FileItem name="Local_Herb_Guide.pdf" size="5.1MB" icon={<BookOpen size={14} />} />
              </div>
            </div>
          )}

          {/* EXPANDED: ABOUT CAZ */}
          {expandedSection === "about" && (
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              <div className="p-3 bg-[#222D2C] text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase">COMMUNITY AUTONOMOUS ZONE (CAZ) OS</span>
                  <span className="text-xs font-mono uppercase bg-[#FAD13E] text-[#222D2C] px-1.5 py-0.2 font-bold">WIP // ALPHA v2.4</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsWelcomeOpen(true)}
                    className="bg-[#005EAC] hover:bg-[#004B8A] text-white px-2.5 py-0.5 font-mono text-xs font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 border border-[#222D2C]"
                  >
                    <BookOpen size={11} />
                    <span>5 Pillars Pop-up</span>
                  </button>
                  <a
                    href="https://github.com/arielchuri/TAZ"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white/20 hover:bg-white text-white hover:text-[#222D2C] px-2 py-0.5 font-mono text-xs font-bold uppercase transition-colors"
                  >
                    📂 GitHub Repo →
                  </a>
                </div>
              </div>

              {/* WIP Notice Banner */}
              <div className="p-3 bg-[#FAD13E]/20 border-2 border-[#222D2C] font-mono text-xs">
                <div className="flex items-center gap-2 text-[#222D2C] font-bold mb-1">
                  <span className="w-2.5 h-2.5 bg-[#FF9600] rounded-full animate-ping inline-block" />
                  <span>ACTIVE WORK IN PROGRESS: CALL FOR COLLABORATORS & TEST NODES</span>
                </div>
                <p className="text-[#3E4846] text-xs leading-relaxed">
                  CAZ OS is an evolving open-source prototype. We are actively refining peer synchronization protocols, mesh packet encoding, and local off-grid governance workflows. All source code is freely available under copyleft open-source licenses.
                </p>
              </div>

              <div className="p-5 bg-[#FFFFFF] border-2 border-[#222D2C] space-y-4 text-[#222D2C]">
                <div>
                  <h3 className="text-lg font-black uppercase text-[#005EAC]">Manage Your Community Without Hierarchy</h3>
                  <p className="text-xs leading-relaxed text-[#3E4846] mt-1">
                    <strong>CAZ OS</strong> is an offline-first, peer-to-peer socio-technical operating system designed for neighborhood resilience, mutual aid, and direct horizontal self-governance. Built to operate without centralized ISP backbones, municipal power grids, or cloud intermediaries, CAZ OS fuses modern open hardware with ancestral collective labor patterns.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
                  <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                    <h4 className="font-bold text-xs text-[#DF4C40] uppercase mb-1">1. Direct Consensus Democracy</h4>
                    <p className="text-xs text-[#5B6360] leading-tight">Quorum-based local direct democracy, referendums, collective labor scheduling (barn raising), and fellowship circles without executive bosses.</p>
                  </div>
                  <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                    <h4 className="font-bold text-xs text-[#005EAC] uppercase mb-1">2. Peer-to-Peer Mutual Aid</h4>
                    <p className="text-xs text-[#5B6360] leading-tight">Direct bilateral matching of physical neighborhood needs against community surpluses without currency or middlemen.</p>
                  </div>
                  <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                    <h4 className="font-bold text-xs text-[#8F57CB] uppercase mb-1">3. Barn-Raising Labor Brigades</h4>
                    <p className="text-xs text-[#5B6360] leading-tight">Amish-style volunteer collective labor brigades, reciprocal time-banking, and community tool lending libraries.</p>
                  </div>
                  <div className="p-3 bg-[#EFECE6] border border-[#222D2C]">
                    <h4 className="font-bold text-xs text-[#3CCC23] uppercase mb-1">4. Zero-Cloud Local Mesh</h4>
                    <p className="text-xs text-[#5B6360] leading-tight">Local 915MHz LoRa & Wi-Fi mesh running on renewable solar microgrids independent of Big Tech telecom ISPs.</p>
                  </div>
                </div>

                {/* Open Source Hosting & Setup Guide Block */}
                <div className="p-4 bg-[#EFECE6] border-2 border-[#222D2C] space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center border-b border-[#222D2C]/20 pb-2">
                    <h4 className="font-bold text-sm text-[#222D2C] uppercase flex items-center gap-1.5">
                      <Radio size={14} className="text-[#005EAC]" />
                      <span>Open-Source Hosting & Node Setup Instructions</span>
                    </h4>
                    <span className="text-xs bg-[#FAD13E] text-[#222D2C] px-2 py-0.5 font-bold uppercase">COMING SOON</span>
                  </div>

                  <div className="space-y-2 text-xs text-[#3E4846]">
                    <p>
                      CAZ OS is designed to be self-hosted on inexpensive local hardware without recurring subscription fees or proprietary cloud backends:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-white border border-[#222D2C]">
                        <div className="font-bold text-[#005EAC]">LOCAL RASPBERRY PI</div>
                        <p className="text-[#5B6360] mt-0.5">Run via Docker on Pi 4/5 or recycled PC attached to local home solar battery.</p>
                      </div>
                      <div className="p-2 bg-white border border-[#222D2C]">
                        <div className="font-bold text-[#3CCC23]">OFFLINE WI-FI PORTAL</div>
                        <p className="text-[#5B6360] mt-0.5">Broadcast a captive Wi-Fi portal for neighbors to connect during grid outages.</p>
                      </div>
                      <div className="p-2 bg-white border border-[#222D2C]">
                        <div className="font-bold text-[#FF9600]">LORA PACKET BRIDGE</div>
                        <p className="text-[#5B6360] mt-0.5">Attach an ESP32 915MHz radio transceiver for long-range regional packet routing.</p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white border border-[#222D2C] space-y-1 mt-2">
                      <div className="font-bold text-[#222D2C] text-xs">QUICK START CLI PREVIEW (COMING SOON):</div>
                      <pre className="text-xs bg-[#222D2C] text-[#3CCC23] p-2 overflow-x-auto font-mono">
git clone https://github.com/arielchuri/TAZ.git
cd TAZ
npm install
npm run dev # Launches local peer mesh instance
                      </pre>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      ) : (
        /* =========================================================
            STANDARD 3-COLUMN DASHBOARD WORKSPACE
            ========================================================= */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <main 
            className={cn(
              "flex-1 dashboard-grid overflow-y-auto p-2 gap-3 bg-[#EFECE6]",
              isHelpMode && "cursor-help"
            )}
            id="main-dashboard-grid"
          >
            {/* COLUMN 1 */}
            <DroppableColumn
              id="col1"
              items={columns.col1}
              className="dashboard-col-left flex flex-col gap-4"
            >
              {columns.col1.map((id) => (
                <SortableSection key={id} id={id}>
                  {(dragHandleProps) => renderSection(id, dragHandleProps)}
                </SortableSection>
              ))}
            </DroppableColumn>

            {/* COLUMNS 2, 3 & 4 */}
            <div className="dashboard-col-right flex flex-col gap-4">
              <div className="dashboard-subgrid gap-4">
                {/* COLUMN 2 */}
                <DroppableColumn
                  id="col2"
                  items={columns.col2}
                  className="dashboard-subcol-1 flex flex-col gap-4"
                >
                  {columns.col2.map((id) => (
                    <SortableSection key={id} id={id}>
                      {(dragHandleProps) => renderSection(id, dragHandleProps)}
                    </SortableSection>
                  ))}
                </DroppableColumn>

                {/* GROUP: Columns 3 & 4 */}
                <div className="dashboard-col-34-group">
                  {/* COLUMN 3 */}
                  <DroppableColumn
                    id="col3"
                    items={columns.col3}
                    className="dashboard-subcol-2 flex flex-col gap-4"
                  >
                    {columns.col3.map((id) => (
                      <SortableSection key={id} id={id}>
                        {(dragHandleProps) => renderSection(id, dragHandleProps)}
                      </SortableSection>
                    ))}
                  </DroppableColumn>

                  {/* COLUMN 4 */}
                  <DroppableColumn
                    id="col4"
                    items={columns.col4}
                    className="dashboard-subcol-3 flex flex-col gap-4"
                  >
                    {columns.col4.map((id) => (
                      <SortableSection key={id} id={id}>
                        {(dragHandleProps) => renderSection(id, dragHandleProps)}
                      </SortableSection>
                    ))}
                  </DroppableColumn>
                </div>
              </div>
            </div>
          </main>

          <DragOverlay>
            {activeDragId ? (
              <div className="w-full opacity-90 shadow-2xl scale-[1.02] transition-transform pointer-events-none border-2 border-[#005EAC]">
                {renderSection(activeDragId)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

            {/* ─── Persistent Floating Help Dock in Bottom-Right Corner ───── */}
      <div className="fixed bottom-4 right-4 z-[99998] flex flex-col items-end gap-2 pointer-events-auto">
        {!helpOverlay && (
          <button
            data-help-toggle="true"
            onClick={() => {
              setIsHelpMode(true);
              setHelpOverlay({ title: "CAZ OS Navigation & Help", sectionId: "overview" });
            }}
            className={cn(
              "px-3 py-1.5 font-mono text-xs font-black uppercase flex items-center gap-2 border-2 cursor-pointer transition-all shadow-xl",
              isHelpMode 
                ? "bg-[#FAD13E] text-[#222D2C] border-[#222D2C] ring-2 ring-[#222D2C] animate-pulse" 
                : "bg-[#222D2C] hover:bg-[#005EAC] text-white border-[#222D2C]"
            )}
            style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,0.5)" }}
          >
            <HelpCircle size={14} className={isHelpMode ? "text-[#DF4C40]" : "text-[#FAD13E]"} />
            <span>{isHelpMode ? "HELP MODE: ACTIVE" : "❓ TUTORIAL HELP"}</span>
          </button>
        )}
      </div>

      {/* ─── Floating Help Mode Active Top/Bottom Notification ───────── */}
      {isHelpMode && !helpOverlay && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[99998] bg-[#FAD13E] border-2 border-[#222D2C] px-4 py-2 shadow-2xl font-mono text-xs flex items-center gap-3 animate-bounce">
          <div className="flex items-center gap-2 font-bold text-[#222D2C]">
            <HelpCircle size={16} className="text-[#DF4C40]" />
            <span>HELP MODE ACTIVE: Click anywhere on any card to view its tutorial!</span>
          </div>
          <button
            onClick={() => setIsHelpMode(false)}
            className="bg-[#222D2C] hover:bg-[#005EAC] text-white px-2 py-0.5 text-xs font-bold uppercase cursor-pointer"
          >
            Exit ✕
          </button>
        </div>
      )}

      {/* ─── Interactive Help Mode Floating Corner Overlay ─────────── */}
      {helpOverlay && (
        <div 
          id="help-mode-overlay"
          className="fixed bottom-4 right-4 z-[99999] bg-[#FFFFFF] border-3 border-[#222D2C] p-4 shadow-2xl w-96 max-w-[calc(100vw-32px)] font-mono text-xs animate-in slide-in-from-bottom-2 duration-150"
          style={{ boxShadow: "6px 6px 0px 0px rgba(0,0,0,0.6)" }}
        >
          {/* Overlay Header with Dynamic Section Theme Color */}
          {(() => {
            const theme = SECTION_COLOR_MAP[helpOverlay.sectionId] || { bg: "bg-[#005EAC]", text: "text-white", accentBorder: "border-[#005EAC]" };
            return (
              <div className={cn(
                "flex justify-between items-center border-b-2 border-[#222D2C] pb-2 mb-2 p-2.5 -m-4 mb-3 transition-colors duration-200 select-none shadow-sm",
                theme.bg,
                theme.text
              )}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 bg-black/30 border border-white/20 shrink-0">
                    <HelpCircle size={13} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-xs uppercase tracking-tight block truncate">
                      HELP: {helpOverlay.title}
                    </span>
                    <span className="text-xs font-mono opacity-80 uppercase block">
                      // TARGET SECTION [{helpOverlay.sectionId.toUpperCase()}]
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setHelpOverlay(null);
                    setIsHelpMode(false);
                  }}
                  className="hover:opacity-80 p-1 cursor-pointer font-black text-sm transition-opacity bg-black/20 border border-white/20 hover:bg-black/40 ml-2"
                  title="Close Tutorial"
                >
                  ✕
                </button>
              </div>
            );
          })()}

          {/* Tutorial Body */}
          {(() => {
            const info = (() => {
              switch (helpOverlay.sectionId) {
                case "transport":
                  return {
                    summary: "Decentralized rideshare and item courier dispatch operating over local mesh networks.",
                    details: "Neighbors can broadcast requests for passenger passage or item delivery. Trips can be scheduled at a set time or marked flexible (anytime). Destinations can specify regional cities (Newark, NYC, Paterson) or community bounds coordinates [A-H, 1-8] on the local grid. Coordinated bilaterally without middlemen or corporate ride apps."
                  };
                case "matcher":
                  return {
                    summary: "Peer-to-Peer Mutual Aid Matcher (Section 2.2).",
                    details: "Direct bilateral exchange matching physical community needs against neighbor surpluses without currency, landlords, or corporate logistics."
                  };
                case "map":
                  return {
                    summary: "Local Zone Cartography & Toner Grid.",
                    details: "Calibrated 8x8 letter/number grid [A-H, 1-8] for Upper Montclair, Montclair State University, and Mills Reservation. Shows offline infrastructure, water filtration, and solar nodes."
                  };
                case "calendar":
                  return {
                    summary: "Community Calendar, Fellowship & Barn-Raising.",
                    details: "Collective labor schedules, Amish-style timber framing, workshops, and weekly fellowship potlucks."
                  };
                case "bulletin":
                  return {
                    summary: "Neighborhood Bulletin & Pinboard.",
                    details: "Local surplus notices, urgent repair alerts, and community announcements."
                  };
                case "governance":
                  return {
                    summary: "Direct Consensus Democracy & General Assembly.",
                    details: "Quorum-based referendum voting and non-hierarchical community self-management."
                  };
                case "labor":
                  return {
                    summary: "Collective Labor & Tool Guilds.",
                    details: "Work order rosters, active tool depot lending catalog (38 available / 14 on loan), and scheduled barn-raising and repair shifts."
                  };
                case "power":
                  return {
                    summary: "Solar Microgrid & 48V Battery Storage Telemetry.",
                    details: "Real-time battery reserve percentages, generation sources (solar MPPT, micro-hydro, backup generator), load consumption telemetry, and 24-hour historical generation/load chart."
                  };
                case "water":
                  return {
                    summary: "Potable Rain Catchment & UV Purification.",
                    details: "Central potable cistern capacity, neighborhood residential rain barrels estimate (42 barrels, ~6,300 L stored), TDS purity readouts, and daily catchment yield."
                  };
                case "neighbors":
                  return {
                    summary: "Neighboring Communities Federation & Bilateral Trade.",
                    details: "Regional inter-zone mutual aid federation, designated community envoys (Marcus Vance, Elena Rostova, David Chen), radio frequencies/links, and bilateral trade/aid request compacts."
                  };
                case "mesh":
                  return {
                    summary: "915MHz LoRa Mesh Network Telemetry.",
                    details: "Active peer node topology, packet health, signal-to-noise ratio, and hop latency."
                  };
                case "nature":
                  return {
                    summary: "Solar Ephemeris & Regional Weather.",
                    details: "Sunrise/sunset daylight curves, lunar phase, barometric trend, and 5-day forecast."
                  };
                case "comms":
                  return {
                    summary: "Encrypted Local Mesh Messenger.",
                    details: "Decentralized radio messenger channels for neighborhood announcements, Ariel Churi's project logs, and emergency dispatch."
                  };
                case "knowledge":
                  return {
                    summary: "Offline Technical Manuals & Herb Guides.",
                    details: "Locally cached emergency documentation, solar repair diagrams, and mesh firmware manuals."
                  };
                default:
                  return {
                    summary: "Community Autonomous Zone (CAZ) OS.",
                    details: "An offline-first, non-hierarchical operating system for neighborhood mutual aid, resilience, and direct consensus self-governance."
                  };
              }
            })();

            return (
              <div className="space-y-2 py-1">
                <div className="p-2 bg-[#FAD13E]/20 border border-[#FAD13E] text-[#222D2C] text-xs font-sans leading-relaxed">
                  <strong>Section Overview:</strong> {info.summary}
                </div>

                <div className="p-2.5 bg-[#EFECE6] border border-[#222D2C] text-[#3E4846] text-xs font-sans leading-relaxed">
                  {info.details}
                </div>

                <div className="flex justify-between items-center text-xs text-[#5B6360] font-mono pt-1">
                  <span>TARGET ID: [{helpOverlay.sectionId.toUpperCase()}]</span>
                  <span className="text-[#005EAC] font-bold">CLICK ANY SECTION TO INSPECT</span>
                </div>
              </div>
            );
          })()}

          {/* Footer Dismiss / Navigation */}
          <div className="flex gap-2 pt-2 border-t border-[#222D2C]/20 mt-2">
            <button
              onClick={() => setIsHelpMode(!isHelpMode)}
              className="flex-1 bg-[#EFECE6] hover:bg-[#DFDDD7] text-[#222D2C] border border-[#222D2C] py-1 text-xs font-bold uppercase cursor-pointer"
            >
              {isHelpMode ? "Exit Help Mode" : "Keep Help On"}
            </button>
            <button
              onClick={() => setHelpOverlay(null)}
              className="flex-1 bg-[#005EAC] hover:bg-[#004B8A] text-white py-1 text-xs font-bold uppercase cursor-pointer"
            >
              Dismiss ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Inter-Zone Trade / Aid Request Dispatch Modal ─────────── */}
      {interZoneModal && interZoneModal.community && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white border-2 border-[#222D2C] w-full max-w-lg shadow-2xl flex flex-col font-mono text-xs">
            {/* Header */}
            <div className="p-3 bg-[#0F5257] text-white flex justify-between items-center select-none border-b-2 border-[#222D2C]">
              <div className="flex items-center gap-2">
                <Globe size={16} />
                <span className="font-bold uppercase tracking-wider text-xs">
                  {interZoneModal.type === "trade" ? "Bilateral Trade Proposal" : "Regional Aid Request"}
                </span>
              </div>
              <button 
                onClick={() => setInterZoneModal(null)}
                className="hover:bg-white/20 p-1 text-white cursor-pointer"
                title="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3 bg-[#FFFFFF] text-[#222D2C]">
              {/* Destination & Envoy Dossier */}
              <div className="p-2.5 bg-[#EFECE6] border border-[#222D2C] space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold uppercase text-xs text-[#222D2C]">{interZoneModal.community.name}</span>
                  <span className="text-[10px] bg-[#0F5257] text-white px-1.5 py-0.2 font-bold">{interZoneModal.community.zone}</span>
                </div>
                <div className="text-[11px] text-[#5B6360]">
                  Distance: {interZoneModal.community.distance} {interZoneModal.community.direction} • {interZoneModal.community.linkDesc}
                </div>
                <div className="pt-1 border-t border-[#222D2C]/20 flex justify-between items-center text-[11px]">
                  <div>
                    <span className="text-[#5B6360]">ENVOY: </span>
                    <strong className="text-[#222D2C]">{interZoneModal.community.official.name}</strong>
                    <span className="text-[#5B6360]"> ({interZoneModal.community.official.callsign})</span>
                  </div>
                  <div className="text-[#005EAC] font-bold">
                    {interZoneModal.community.official.channel}
                  </div>
                </div>
              </div>

              {/* Surplus & Needs summary */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-[#EFECE6] border border-[#222D2C]/40">
                  <span className="text-[#1f7314] font-bold block uppercase text-[10px]">THEIR SURPLUS:</span>
                  <span>{interZoneModal.community.surplus.join(", ")}</span>
                </div>
                <div className="p-2 bg-[#EFECE6] border border-[#222D2C]/40">
                  <span className="text-[#b86e0c] font-bold block uppercase text-[10px]">THEIR SEEKING:</span>
                  <span>{interZoneModal.community.seeking.join(", ")}</span>
                </div>
              </div>

              {/* Message / Manifest Field */}
              <div className="space-y-1">
                <label className="font-bold uppercase text-xs text-[#222D2C] block">
                  {interZoneModal.type === "trade" ? "Trade Manifest & Terms" : "Resource Request Details"}
                </label>
                <textarea
                  rows={3}
                  value={interZoneMessage}
                  onChange={(e) => setInterZoneMessage(e.target.value)}
                  placeholder="Specify item quantities, exchange terms, or urgency level..."
                  className="w-full p-2 bg-white border border-[#222D2C] text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-[#0F5257] resize-none"
                />
              </div>

              {/* Dispatch Channel Selector */}
              <div className="space-y-1">
                <span className="text-[10px] text-[#5B6360] font-bold uppercase block">Transmission Medium:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInterZoneMedium("mesh")}
                    className={cn(
                      "flex-1 p-1.5 border text-center font-mono text-xs font-bold uppercase cursor-pointer",
                      interZoneMedium === "mesh"
                        ? "bg-[#0F5257] text-white border-[#0F5257]"
                        : "bg-white text-[#222D2C] border-[#222D2C] hover:bg-[#EFECE6]"
                    )}
                  >
                    Radio Mesh Packet (Fast)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterZoneMedium("courier")}
                    className={cn(
                      "flex-1 p-1.5 border text-center font-mono text-xs font-bold uppercase cursor-pointer",
                      interZoneMedium === "courier"
                        ? "bg-[#0F5257] text-white border-[#0F5257]"
                        : "bg-white text-[#222D2C] border-[#222D2C] hover:bg-[#EFECE6]"
                    )}
                  >
                    Bicycle Courier Runner
                  </button>
                </div>
              </div>

              {/* Success notice */}
              {interZoneSent && (
                <div className="p-2.5 bg-[#3CCC23]/20 border-2 border-[#3CCC23] text-[#1f7314] font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>
                    ✓ Dispatched to {interZoneModal.community.official.name} via {interZoneMedium === "mesh" ? "LoRa Mesh Packet" : "Bicycle Courier"}. ACK packet awaited.
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[#222D2C]/20">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setInterZoneModal(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="yellow" 
                  size="sm" 
                  className="flex-1 !bg-[#0F5257] !text-white hover:!bg-[#0A3A3D]"
                  onClick={() => {
                    setInterZoneSent(true);
                    setTimeout(() => {
                      setInterZoneModal(null);
                      setInterZoneSent(false);
                    }, 2500);
                  }}
                >
                  Dispatch to {interZoneModal.community.official.name} →
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Profile Slide-Over Sheet (Ariel Churi Account) ────────── */}
      <Sheet 
        isOpen={isAccountOpen} 
        onClose={() => setIsAccountOpen(false)}
      >
        <div className="space-y-4 text-left p-0.5">
          {/* User Bio Card */}
          <div className="p-3 bg-white border-2 border-[#222D2C] shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 bg-[#005EAC] border-2 border-[#222D2C] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                <img src={arielAvatar} alt="Ariel Churi" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-base font-black uppercase text-[#222D2C] leading-none">Ariel Churi</h3>
                  <span className="flex items-center gap-1 text-xs font-mono font-bold uppercase bg-[#3CCC23]/20 text-[#222D2C] border border-[#3CCC23] px-1 py-0.2">
                    <span className="w-1.5 h-1.5 bg-[#3CCC23] rounded-full animate-pulse" />
                    Mesh Sync
                  </span>
                </div>
                <div className="mt-1">
                  <span className="font-mono text-xs font-bold uppercase bg-[#FAD13E] text-[#222D2C] px-1.5 py-0.5 border border-[#222D2C] inline-block">
                    Role: Infrastructure & Grid Architecture
                  </span>
                </div>
                <div className="font-mono text-xs text-[#5B6360] mt-1 flex items-center gap-1">
                  <span>NODE #742</span>
                  <span>•</span>
                  <span>UPPER MONTCLAIR [SECTOR 4]</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Projects */}
          <div className="space-y-2 border-t border-[#222D2C] pt-3">
            <div className="flex justify-between items-center px-0.5">
              <span className="font-mono text-xs font-bold uppercase text-[#222D2C] flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-[#005EAC] text-white border border-[#222D2C] shrink-0">
                  <Wrench size={11} className="text-white" />
                </span>
                Current Projects
              </span>
              <span className="font-mono text-xs bg-[#005EAC] text-white px-1.5 py-0.2 font-bold uppercase">
                {arielProjects.length} Active
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              {arielProjects.map((p) => (
                <div key={p.id} className="p-2 bg-white border border-[#222D2C] hover:border-[#005EAC] transition-colors">
                  <div className="flex justify-between items-start gap-1 mb-1">
                    <span className="font-bold text-xs text-[#222D2C] leading-tight font-sans truncate">{p.title}</span>
                    <span className={cn("text-xs font-bold px-1.5 py-0.2 uppercase shrink-0 font-mono", p.priorityColor)}>
                      {p.priority}
                    </span>
                  </div>
                  <div className="text-xs text-[#5B6360] flex items-center justify-between mb-1.5">
                    <span>Role: {p.role}</span>
                    <span className="text-[#005EAC] font-bold">{p.progress}% Done</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#DFDDD7] border border-[#222D2C]/40 p-0.2">
                    <div className="h-full bg-[#005EAC]" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Borrowed & Loaned Items */}
          <div className="space-y-2 border-t border-[#222D2C] pt-3">
            <div className="flex justify-between items-center px-0.5">
              <span className="font-mono text-xs font-bold uppercase text-[#222D2C] flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-[#FF9600] text-white border border-[#222D2C] shrink-0">
                  <Package size={11} className="text-white" />
                </span>
                Borrowed & Loaned Items
              </span>
              <span className="font-mono text-xs bg-[#FF9600] text-white px-1.5 py-0.2 font-bold uppercase">
                4 Tracked
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              {/* Borrowed items */}
              <div className="p-2 bg-white border border-[#222D2C]">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-xs font-bold uppercase bg-[#FF9600]/20 text-[#b86e0c] border border-[#FF9600] px-1 py-0.2">
                    <ArrowDownLeft size={10} /> Borrowed by You
                  </span>
                  <span className="text-xs text-[#DF4C40] font-bold">DUE IN 2 DAYS</span>
                </div>
                <div className="font-bold text-xs text-[#222D2C] font-sans">MC4 Solar Crimping & Stripping Kit</div>
                <div className="text-xs text-[#5B6360] mt-0.5">Source: Sector 4 Tool Guild Depot • ID: #TK-08</div>
              </div>

              <div className="p-2 bg-white border border-[#222D2C]">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-xs font-bold uppercase bg-[#FF9600]/20 text-[#b86e0c] border border-[#FF9600] px-1 py-0.2">
                    <ArrowDownLeft size={10} /> Borrowed by You
                  </span>
                  <span className="text-xs text-[#5B6360] font-bold">DUE SUNDAY</span>
                </div>
                <div className="font-bold text-xs text-[#222D2C] font-sans">RF Explorer 915MHz Handheld Spectrum Analyzer</div>
                <div className="text-xs text-[#5B6360] mt-0.5">Source: Comms Guild (Node #304 - Marcus)</div>
              </div>

              {/* Loaned items */}
              <div className="p-2 bg-white border border-[#222D2C]">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-xs font-bold uppercase bg-[#005EAC]/20 text-[#005EAC] border border-[#005EAC] px-1 py-0.2">
                    <ArrowUpRight size={10} /> Loaned Out to Peer
                  </span>
                  <span className="text-xs text-[#3CCC23] font-bold">ACTIVE IN FIELD</span>
                </div>
                <div className="font-bold text-xs text-[#222D2C] font-sans">Honda EU2200i Inverter Generator (Gas/LP)</div>
                <div className="text-xs text-[#5B6360] mt-0.5">Borrower: Elena M. (Shelter 3) • Expected: Sep 12</div>
              </div>

              <div className="p-2 bg-white border border-[#222D2C]">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-xs font-bold uppercase bg-[#005EAC]/20 text-[#005EAC] border border-[#005EAC] px-1 py-0.2">
                    <ArrowUpRight size={10} /> Loaned Out to Guild
                  </span>
                  <span className="text-xs text-[#3CCC23] font-bold">DEPOT STAGING</span>
                </div>
                <div className="font-bold text-xs text-[#222D2C] font-sans">Stihl MS 271 Farm Boss 20" Chainsaw</div>
                <div className="text-xs text-[#5B6360] mt-0.5">Borrower: Timber Joinery Crew (Barn Raising Site)</div>
              </div>
            </div>
          </div>

          {/* Recent Services Used or Rendered */}
          <div className="space-y-2 border-t border-[#222D2C] pt-3">
            <div className="flex justify-between items-center px-0.5">
              <span className="font-mono text-xs font-bold uppercase text-[#222D2C] flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-[#3ABEAE] text-white border border-[#222D2C] shrink-0">
                  <Clock size={11} className="text-white" />
                </span>
                Recent Services
              </span>
              <span className="font-mono text-xs bg-[#3ABEAE] text-white px-1.5 py-0.2 font-bold uppercase">
                Mutual Aid Ledger
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              {/* Rendered */}
              <div className="p-2 bg-white border border-[#222D2C]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase bg-[#3CCC23] text-white px-1 py-0.2">
                    Rendered (Provided)
                  </span>
                  <span className="text-xs text-[#5B6360]">Yesterday</span>
                </div>
                <div className="font-bold text-xs text-[#222D2C] font-sans">Microgrid MPPT Charge Controller Firmware Flash</div>
                <div className="text-xs text-[#5B6360] mt-0.5">Recipient: Camp 3 Community Kitchen • Credited: +2.0 hrs</div>
              </div>

              <div className="p-2 bg-white border border-[#222D2C]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase bg-[#3CCC23] text-white px-1 py-0.2">
                    Rendered (Provided)
                  </span>
                  <span className="text-xs text-[#5B6360]">3 days ago</span>
                </div>
                <div className="font-bold text-xs text-[#222D2C] font-sans">Emergency Mesh Node Solar Relay Deployment</div>
                <div className="text-xs text-[#5B6360] mt-0.5">Recipient: Mills Basalt Repeater Mast • Credited: +4.0 hrs</div>
              </div>

              {/* Used */}
              <div className="p-2 bg-white border border-[#222D2C]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase bg-[#8F57CB] text-white px-1 py-0.2">
                    Services Used
                  </span>
                  <span className="text-xs font-bold text-[#3CCC23]">None Active</span>
                </div>
                <div className="font-bold text-xs text-[#222D2C] font-sans">None</div>
                <div className="text-xs text-[#5B6360] mt-0.5 font-sans leading-tight">
                  No mutual aid requests claimed or used in past 30 days. Community credit balance: +14.0 hrs.
                </div>
              </div>
            </div>
          </div>

          {/* Involvement in Community Governance */}
          <div className="space-y-2 border-t border-[#222D2C] pt-3">
            <div className="flex justify-between items-center px-0.5">
              <span className="font-mono text-xs font-bold uppercase text-[#222D2C] flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-[#0F3D64] text-white border border-[#222D2C] shrink-0">
                  <Vote size={11} className="text-white" />
                </span>
                Community Governance
              </span>
              <span className="font-mono text-xs bg-[#0F3D64] text-white px-1.5 py-0.2 font-bold uppercase">
                Consensus Delegate
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="p-2 bg-white border border-[#222D2C]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-[#222D2C] uppercase">General Assembly Status</span>
                  <span className="text-xs font-bold bg-[#3CCC23] text-white px-1 py-0.2">QUORUM CERTIFIED</span>
                </div>
                <div className="text-xs text-[#5B6360] leading-snug font-sans">
                  Active Voting Delegate for Upper Montclair District (Node #742). 100% quorum attendance across last 6 assemblies.
                </div>
              </div>

              <div className="p-2 bg-white border border-[#222D2C]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-[#222D2C] uppercase">Active Referendum Vote</span>
                  <span className="text-xs font-bold bg-[#005EAC] text-white px-1 py-0.2">VOTED: AYE / YES</span>
                </div>
                <div className="font-bold text-xs text-[#222D2C] font-sans">Solar Array Expansion (Phase 2)</div>
                <div className="text-xs text-[#3CCC23] mt-0.5 font-bold">Consensus Verified (80% supermajority reached)</div>
              </div>

              <div className="p-2 bg-white border border-[#222D2C]">
                <span className="font-bold text-xs text-[#222D2C] uppercase block mb-1">Working Group Roles</span>
                <ul className="space-y-1 text-xs text-[#3E4846] font-sans">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#0F3D64] shrink-0" />
                    <span><strong>Grid & Energy Infrastructure:</strong> Working Group Facilitator</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#0F3D64] shrink-0" />
                    <span><strong>LoRa Mesh Spectrum Allocation:</strong> Voting Member</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Registered Community Skills */}
          <div className="space-y-2 border-t border-[#222D2C] pt-3">
            <div className="flex justify-between items-center px-0.5">
              <span className="font-mono text-xs font-bold uppercase text-[#222D2C] flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-[#3CCC23] text-white border border-[#222D2C] shrink-0">
                  <CheckCircle2 size={11} className="text-white" />
                </span>
                Registered Community Skills
              </span>
              <span className="font-mono text-xs bg-[#3CCC23] text-white px-1.5 py-0.2 font-bold uppercase">
                5 Certified
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                "Microgrid Engineering & Solar Inverters",
                "Ham Radio Operator (W2NJ Net Relay)",
                "LoRa Mesh Network Deployment",
                "Wilderness First Aid & Triage",
                "Timber Framing & Carpentry"
              ].map(skill => (
                <div key={skill} className="font-mono text-xs font-bold uppercase p-2 bg-white border border-[#222D2C] leading-normal flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-[#3CCC23] shrink-0" />
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Customization & Reset (shown only if layout is modified) */}
          {isLayoutModified && (
            <div className="space-y-2 border-t-2 border-[#222D2C] pt-3 mt-4 bg-[#FAD13E]/20 p-2.5 border">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black uppercase text-[#222D2C] flex items-center gap-1.5">
                  <RotateCcw size={12} className="text-[#005EAC]" />
                  Custom Layout Active
                </span>
                <span className="font-mono text-xs font-bold uppercase bg-[#DF4C40] text-white px-1 py-0.2">
                  Rearranged
                </span>
              </div>
              <p className="text-xs text-[#5B6360] font-mono leading-tight">
                Cards have been moved from their default positions across columns.
              </p>
              <Button 
                onClick={resetLayout} 
                variant="secondary" 
                size="sm" 
                className="w-full flex items-center justify-center gap-1.5 font-mono text-xs uppercase font-bold py-1.5 !bg-white hover:!bg-[#EFECE6] !text-[#222D2C] border border-[#222D2C]"
              >
                <RotateCcw size={12} />
                Reset Layout to Default
              </Button>
            </div>
          )}

          <Tip label="Disconnect local node from mesh" notImplemented={true}>
            <Button variant="danger" size="sm" className="w-full mt-3 py-1.5">Disconnect Node</Button>
          </Tip>
        </div>
      </Sheet>

      {/* ─── CAZ Welcome & Manifesto Onboarding Pop-up ─────────────── */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
      />
    </div>
  );
}

function StatusBadge({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-1.5 border border-[#222D2C] px-2 py-0.5 bg-[#FFFFFF] font-mono text-xs h-[24px]">
      <span>{icon}</span>
      <span className="font-bold text-[#5B6360] uppercase">{label}:</span>
      <span className="font-bold text-[#222D2C]">{value}</span>
    </div>
  );
}

function FilterChip({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon?: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 border px-2 py-0.5 font-mono text-xs font-bold uppercase transition-colors cursor-pointer leading-normal h-[22px]",
        active
          ? "bg-[#005EAC] text-white border-[#005EAC]"
          : "bg-white text-[#222D2C] border-[#222D2C] hover:bg-[#EFECE6]"
      )}
      style={{ borderRadius: 0, boxShadow: "none" }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default App;
