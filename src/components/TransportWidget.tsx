import React, { useState } from "react";
import { 
  Car, 
  Package, 
  Clock, 
  MapPin, 
  Navigation, 
  Plus, 
  CheckCircle2, 
  ArrowRight, 
  Users,
  Check
} from "lucide-react";
import { Card, cn } from "./BrutalBase";

export interface TransportEntry {
  id: string;
  type: "passage" | "delivery"; // Passage (passenger) or Delivery (items)
  mode: "request" | "offer";    // Request (Need) or Offer (Available)
  title: string;
  user: string;
  timingType: "scheduled" | "anytime";
  timingDetails: string;
  destinationType: "community" | "city";
  destination: string;
  gridRef?: string;             // e.g. "B7", "C4" if in community bounds
  origin: string;
  originGridRef?: string;
  specs: string;                // e.g. "1 Seat", "Medium Box (15kg)"
  urgency: "Critical" | "Standard" | "Flexible";
  notes?: string;
  claimed?: boolean;
  claimedBy?: string;
  timestamp: string;
}

export const INITIAL_TRANSPORT_ENTRIES: TransportEntry[] = [
  {
    id: "tr-1",
    type: "passage",
    mode: "request",
    title: "Passage to Newark Penn Station",
    user: "Dave K. (Node #504)",
    timingType: "scheduled",
    timingDetails: "Today 16:45",
    destinationType: "city",
    destination: "Newark, NJ (Penn Station)",
    origin: "Upper Montclair [C4]",
    originGridRef: "C4",
    specs: "1 Passenger + Backpack",
    urgency: "Standard",
    notes: "Catching regional transit connection. Can split EV charge or barter fresh sourdough.",
    timestamp: "15m ago"
  },
  {
    id: "tr-2",
    type: "delivery",
    mode: "request",
    title: "Solar Inverter + Cable Crate to MSU Microgrid",
    user: "Ariel Churi (Node #742)",
    timingType: "scheduled",
    timingDetails: "Today 14:00",
    destinationType: "community",
    destination: "MSU Richardson Hall [B7]",
    gridRef: "B7",
    origin: "Upper Montclair Depot [C4]",
    originGridRef: "C4",
    specs: "Heavy Crate (22kg, 2x2ft)",
    urgency: "Critical",
    notes: "Priority 48V solar intertie hardware. Needs hatchback or truck bed.",
    timestamp: "32m ago"
  },
  {
    id: "tr-3",
    type: "passage",
    mode: "request",
    title: "Ride to Mills Basalt Overlook",
    user: "Hannah R. (Node #671)",
    timingType: "anytime",
    timingDetails: "Anytime before sunset",
    destinationType: "community",
    destination: "Mills Reservation Ridge [A4]",
    gridRef: "A4",
    origin: "Watchung Plaza [E5]",
    originGridRef: "E5",
    specs: "1 Passenger",
    urgency: "Flexible",
    notes: "Heading up to assist with solar antenna mast maintenance.",
    timestamp: "1h ago"
  },
  {
    id: "tr-4",
    type: "delivery",
    mode: "request",
    title: "Heritage Seed Bank & Salve Drop to Paterson Lab",
    user: "Elena R. (Node #304)",
    timingType: "anytime",
    timingDetails: "Anytime next 48h",
    destinationType: "city",
    destination: "Paterson, NJ (Maker Guild)",
    origin: "Yantacaw Herb Garden [B7]",
    originGridRef: "B7",
    specs: "Small insulated cooler (4kg)",
    urgency: "Flexible",
    notes: "Cold-tolerant heirloom seeds & calendula tinctures for regional grower network.",
    timestamp: "2h ago"
  },
  {
    id: "tr-5",
    type: "delivery",
    mode: "request",
    title: "20L Potable Water Jugs to Camp 3",
    user: "Water Squad (Node #108)",
    timingType: "scheduled",
    timingDetails: "Today 17:00",
    destinationType: "community",
    destination: "Camp 3 Field Shelter [G2]",
    gridRef: "G2",
    origin: "Nishuane Springhouse [H4]",
    originGridRef: "H4",
    specs: "2x 20L Jugs (40kg total)",
    urgency: "Critical",
    notes: "Purified gravity sand filter batch for evening dinner prep.",
    timestamp: "3h ago"
  },
  {
    id: "tr-6",
    type: "passage",
    mode: "offer",
    title: "Commuter Run: Montclair -> NYC Midtown (Port Authority)",
    user: "Rachel G. (Node #620)",
    timingType: "scheduled",
    timingDetails: "Tomorrow 07:30",
    destinationType: "city",
    destination: "New York City (Midtown)",
    origin: "Valley Rd / Bellevue [C4]",
    originGridRef: "C4",
    specs: "2 Passenger Seats Available",
    urgency: "Standard",
    notes: "Leaving 07:30 sharp via Route 3 / Lincoln Tunnel. Returns 18:30.",
    timestamp: "4h ago"
  },
  {
    id: "tr-7",
    type: "delivery",
    mode: "offer",
    title: "Cargo Bike Courier: All Community Sectors",
    user: "Leo B. (Node #772)",
    timingType: "anytime",
    timingDetails: "Anytime / On-Call",
    destinationType: "community",
    destination: "Any Sector within Community Bounds [A-H]",
    origin: "Downtown Hub [F4]",
    originGridRef: "F4",
    specs: "Up to 35kg Front Cargo Box",
    urgency: "Flexible",
    notes: "Heavy-duty electric cargo bike ready for tool, medical, or food deliveries across Montclair.",
    timestamp: "5h ago"
  }
];

interface TransportCardProps {
  entries: TransportEntry[];
  onAddEntry: (entry: Omit<TransportEntry, "id" | "timestamp">) => void;
  onClaimEntry: (id: string) => void;
  isShaded?: boolean;
  onToggleShade?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onHelpClick?: (e: React.MouseEvent) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function TransportCard({
  entries,
  onAddEntry,
  onClaimEntry,
  isShaded = false,
  onToggleShade,
  isExpanded = false,
  onToggleExpand,
  onHelpClick,
  dragHandleProps
}: TransportCardProps) {
  const [activeTab, setActiveTab] = useState<"requests" | "offers">("requests");
  const [typeFilter, setTypeFilter] = useState<"all" | "passage" | "delivery">("all");
  const [timingFilter, setTimingFilter] = useState<"all" | "scheduled" | "anytime">("all");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredEntries = entries.filter((e) => {
    if (activeTab === "requests" && e.mode !== "request") return false;
    if (activeTab === "offers" && e.mode !== "offer") return false;
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    if (timingFilter !== "all" && e.timingType !== timingFilter) return false;
    return true;
  });

  const requestCount = entries.filter(e => e.mode === "request").length;
  const offerCount = entries.filter(e => e.mode === "offer").length;

  return (
    <div id="section-transport" data-section-id="transport" data-section-title="Transport & Rideshare Dispatch">
      <Card
        onClickCapture={onHelpClick}
        title="Transport & Rideshare Dispatch"
        accentColor="bg-[#0F5257] text-white"
        dragHandleProps={dragHandleProps}
        badge={
          <span className="text-xs font-mono uppercase bg-white/20 px-1.5 py-0.2 font-bold">
            {requestCount} REQS // {offerCount} OFFERS
          </span>
        }
        headerActions={
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPostModalOpen(true);
            }}
            className="bg-[#FFFFFF] hover:bg-[#EFECE6] text-[#222D2C] px-2 py-0.5 font-mono text-xs font-bold uppercase flex items-center gap-1 cursor-pointer border border-[#222D2C] h-[22px] transition-colors"
            style={{ borderRadius: 0 }}
            title="Post a ride need or delivery item"
          >
            <Plus size={11} /> Post
          </button>
        }
        hint="Decentralized passage & cargo dispatch. Post ride needs, deliveries, scheduled trips, or flexible community courier runs."
        isShaded={isShaded}
        onToggleShade={onToggleShade}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      >
        {notification && (
          <div className="bg-[#3CCC23] text-white px-2 py-1 font-mono text-xs font-bold uppercase flex items-center justify-between animate-in fade-in">
            <span>✓ {notification}</span>
            <button onClick={() => setNotification(null)} className="cursor-pointer">✕</button>
          </div>
        )}

        {/* Requests vs Offers Top Tabs */}
        <div className="flex border-b border-[#222D2C] -mx-2.5 -mt-2.5 mb-2 bg-[#DFDDD7] shrink-0">
          <button
            onClick={() => setActiveTab("requests")}
            className={cn(
              "flex-1 py-1 px-2 text-xs font-bold uppercase tracking-wider transition-colors border-none cursor-pointer flex items-center justify-center gap-1.5 font-mono leading-normal h-[28px]",
              activeTab === "requests" ? "bg-[#0F5257] text-white" : "bg-transparent text-[#5B6360] hover:text-[#222D2C]"
            )}
            style={{ borderRadius: 0 }}
          >
            <Users size={12} />
            <span>Needs Passage / Delivery ({requestCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("offers")}
            className={cn(
              "flex-1 py-1 px-2 text-xs font-bold uppercase tracking-wider transition-colors border-none cursor-pointer flex items-center justify-center gap-1.5 font-mono leading-normal h-[28px]",
              activeTab === "offers" ? "bg-[#0F5257] text-white" : "bg-transparent text-[#5B6360] hover:text-[#222D2C]"
            )}
            style={{ borderRadius: 0 }}
          >
            <Car size={12} />
            <span>Available Rides / Couriers ({offerCount})</span>
          </button>
        </div>

        {/* Filter Bar: Type & Timing */}
        <div className="flex items-center justify-between gap-1 mb-2 font-mono text-xs overflow-x-auto pb-0.5 shrink-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#5B6360] uppercase">TYPE:</span>
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "px-1.5 py-0.5 border font-bold uppercase cursor-pointer transition-colors",
                typeFilter === "all" ? "bg-[#222D2C] text-white border-[#222D2C]" : "bg-white text-[#222D2C] border-[#222D2C]"
              )}
            >
              ALL
            </button>
            <button
              onClick={() => setTypeFilter("passage")}
              className={cn(
                "px-1.5 py-0.5 border font-bold uppercase cursor-pointer transition-colors flex items-center gap-1",
                typeFilter === "passage" ? "bg-[#0F5257] text-white border-[#0F5257]" : "bg-white text-[#222D2C] border-[#222D2C]"
              )}
            >
              <Users size={10} /> PASSAGE
            </button>
            <button
              onClick={() => setTypeFilter("delivery")}
              className={cn(
                "px-1.5 py-0.5 border font-bold uppercase cursor-pointer transition-colors flex items-center gap-1",
                typeFilter === "delivery" ? "bg-[#0F5257] text-white border-[#0F5257]" : "bg-white text-[#222D2C] border-[#222D2C]"
              )}
            >
              <Package size={10} /> DELIVERY
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-bold text-[#5B6360] uppercase">TIME:</span>
            <button
              onClick={() => setTimingFilter("all")}
              className={cn(
                "px-1.5 py-0.5 border font-bold uppercase cursor-pointer transition-colors",
                timingFilter === "all" ? "bg-[#222D2C] text-white border-[#222D2C]" : "bg-white text-[#222D2C] border-[#222D2C]"
              )}
            >
              ALL
            </button>
            <button
              onClick={() => setTimingFilter("scheduled")}
              className={cn(
                "px-1.5 py-0.5 border font-bold uppercase cursor-pointer transition-colors flex items-center gap-0.5",
                timingFilter === "scheduled" ? "bg-[#005EAC] text-white border-[#005EAC]" : "bg-white text-[#222D2C] border-[#222D2C]"
              )}
              title="Set scheduled time"
            >
              <Clock size={10} /> SET TIME
            </button>
            <button
              onClick={() => setTimingFilter("anytime")}
              className={cn(
                "px-1.5 py-0.5 border font-bold uppercase cursor-pointer transition-colors flex items-center gap-0.5",
                timingFilter === "anytime" ? "bg-[#3CCC23] text-white border-[#3CCC23]" : "bg-white text-[#222D2C] border-[#222D2C]"
              )}
              title="Flexible / anytime dispatch"
            >
              ANYTIME
            </button>
          </div>
        </div>

        {/* Listings Stream */}
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-0.5">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "p-2 border transition-colors flex flex-col justify-between gap-1.5",
                  item.claimed ? "bg-[#EFECE6]/60 border-[#BCBCB8]" : "bg-[#FFFFFF] border-[#222D2C] hover:border-[#0F5257]"
                )}
                style={{ borderRadius: 0 }}
              >
                <div>
                  {/* Top line badges */}
                  <div className="flex justify-between items-start gap-1 mb-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={cn(
                        "text-xs font-mono font-bold px-1.5 py-0.2 uppercase flex items-center gap-1",
                        item.type === "passage" ? "bg-[#0F5257] text-white" : "bg-[#FF9600] text-white"
                      )}>
                        {item.type === "passage" ? <Users size={10} /> : <Package size={10} />}
                        <span>{item.type === "passage" ? "PASSAGE" : "DELIVERY"}</span>
                      </span>

                      <span className={cn(
                        "text-xs font-mono font-bold px-1.5 py-0.2 uppercase border",
                        item.destinationType === "community" 
                          ? "bg-[#EFECE6] text-[#0F5257] border-[#0F5257]" 
                          : "bg-[#005EAC]/10 text-[#005EAC] border-[#005EAC]"
                      )}>
                        {item.destinationType === "community" ? "LOCAL ZONE" : "CITY TRANSIT"}
                      </span>

                      {item.timingType === "scheduled" ? (
                        <span className="text-xs font-mono font-bold px-1 py-0.2 bg-[#005EAC] text-white flex items-center gap-0.5">
                          <Clock size={9} /> {item.timingDetails}
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold px-1 py-0.2 bg-[#3CCC23] text-white flex items-center gap-0.5">
                          ANYTIME
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-mono text-[#454C4A] bg-[#EFECE6] px-1 py-0.2 border border-[#222D2C]/20 shrink-0">
                      {item.timestamp}
                    </span>
                  </div>

                  {/* Title & Route */}
                  <div className="font-bold text-xs text-[#222D2C] leading-tight mb-1">
                    {item.title}
                  </div>

                  {/* Origin to Destination Route Indicator */}
                  <div className="p-1 bg-[#EFECE6] border border-[#222D2C]/40 font-mono text-xs flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1 min-w-0 text-[#5B6360]">
                      <MapPin size={10} className="text-[#DF4C40] shrink-0" />
                      <span className="truncate">{item.origin}</span>
                    </div>
                    <ArrowRight size={10} className="text-[#0F5257] shrink-0" />
                    <div className="flex items-center gap-1 min-w-0 font-bold text-[#222D2C]">
                      <Navigation size={10} className="text-[#0F5257] shrink-0" />
                      <span className="truncate">{item.destination}</span>
                    </div>
                  </div>

                  {/* Notes / Specs */}
                  <div className="font-mono text-xs text-[#5B6360] flex items-center justify-between">
                    <span>CAPACITY: <strong className="text-[#222D2C]">{item.specs}</strong></span>
                    {item.gridRef && (
                      <span className="text-xs font-bold bg-white border border-[#222D2C] px-1 py-0.2 text-[#0F5257]">
                        GRID [{item.gridRef}]
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-[#5B6360] font-sans mt-0.5 leading-snug line-clamp-1">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-1.5 border-t border-[#222D2C]/15 flex justify-between items-center font-mono text-xs">
                  <span className="text-[#0F5257] font-bold truncate">BY: {item.user}</span>
                  {item.claimed ? (
                    <span className="text-[#3CCC23] font-bold flex items-center gap-1">
                      <Check size={11} /> COORDINATED
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        onClaimEntry(item.id);
                        showNotification(`Coordinating ${item.type} request with ${item.user.split(" ")[0]}!`);
                      }}
                      className="bg-[#0F5257] hover:bg-[#093539] text-white px-2 py-0.5 font-bold uppercase cursor-pointer border border-[#222D2C] h-[20px] transition-colors"
                      style={{ borderRadius: 0 }}
                    >
                      {item.mode === "request" ? "Provide Passage →" : "Accept Offer →"}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center bg-[#EFECE6] border border-[#222D2C] font-mono text-xs text-[#5B6360]">
              No transport listings match the active filters.
            </div>
          )}
        </div>
      </Card>

      {/* Post Transport Request / Offer Modal */}
      {isPostModalOpen && (
        <TransportPostDialog
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onSubmit={(entryData) => {
            onAddEntry(entryData);
            setIsPostModalOpen(false);
            showNotification("Transport listing broadcasted to Sector 4 Mesh!");
          }}
        />
      )}
    </div>
  );
}

// ─── Modal Dialog for Posting Passage / Delivery Requests ─────────
interface TransportPostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<TransportEntry, "id" | "timestamp">) => void;
}

export function TransportPostDialog({ isOpen, onClose, onSubmit }: TransportPostDialogProps) {
  const [type, setType] = useState<"passage" | "delivery">("passage");
  const [mode, setMode] = useState<"request" | "offer">("request");
  const [title, setTitle] = useState("");
  const [timingType, setTimingType] = useState<"scheduled" | "anytime">("scheduled");
  const [timingDetails, setTimingDetails] = useState("Today 17:00");
  const [destinationType, setDestinationType] = useState<"community" | "city">("community");
  const [destination, setDestination] = useState("MSU Campus [B7]");
  const [origin, setOrigin] = useState("Upper Montclair [C4]");
  const [specs, setSpecs] = useState("1 Passenger");
  const [notes, setNotes] = useState("");
  const [urgency, setUrgency] = useState<"Critical" | "Standard" | "Flexible">("Standard");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) return;

    // Extract grid reference if formatted like [B7]
    const gridMatch = destination.match(/\[([A-H][1-8])\]/);
    const gridRef = gridMatch ? gridMatch[1] : undefined;

    const originGridMatch = origin.match(/\[([A-H][1-8])\]/);
    const originGridRef = originGridMatch ? originGridMatch[1] : undefined;

    onSubmit({
      type,
      mode,
      title: title.trim(),
      user: "Ariel Churi (Node #742)",
      timingType,
      timingDetails: timingType === "scheduled" ? timingDetails : "Anytime / Flexible",
      destinationType,
      destination: destination.trim(),
      gridRef,
      origin: origin.trim(),
      originGridRef,
      specs: specs.trim() || (type === "passage" ? "1 Passenger" : "Parcel"),
      urgency,
      notes: notes.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-3 animate-in fade-in">
      <div 
        className="bg-[#FFFFFF] border-3 border-[#222D2C] shadow-2xl max-w-lg w-full p-4 font-mono text-xs flex flex-col gap-3"
        style={{ borderRadius: 0, boxShadow: "6px 6px 0px 0px rgba(0,0,0,0.7)" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center bg-[#0F5257] text-white p-2.5 -m-4 mb-1 border-b-2 border-[#222D2C]">
          <div className="flex items-center gap-2">
            <Car size={15} />
            <span className="font-black text-sm uppercase tracking-tight">POST TRANSPORT / DISPATCH</span>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 cursor-pointer font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          {/* Post Mode & Category */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-[#5B6360] uppercase block mb-1">POSTING AS:</label>
              <div className="flex border border-[#222D2C]">
                <button
                  type="button"
                  onClick={() => setMode("request")}
                  className={cn(
                    "flex-1 py-1 text-xs font-bold uppercase transition-colors cursor-pointer",
                    mode === "request" ? "bg-[#0F5257] text-white" : "bg-white text-[#222D2C]"
                  )}
                >
                  Need Passage / Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setMode("offer")}
                  className={cn(
                    "flex-1 py-1 text-xs font-bold uppercase transition-colors cursor-pointer",
                    mode === "offer" ? "bg-[#0F5257] text-white" : "bg-white text-[#222D2C]"
                  )}
                >
                  Offering Ride / Courier
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#5B6360] uppercase block mb-1">TRANSPORT CATEGORY:</label>
              <div className="flex border border-[#222D2C]">
                <button
                  type="button"
                  onClick={() => {
                    setType("passage");
                    setSpecs("1 Passenger");
                  }}
                  className={cn(
                    "flex-1 py-1 text-xs font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1",
                    type === "passage" ? "bg-[#0F5257] text-white" : "bg-white text-[#222D2C]"
                  )}
                >
                  <Users size={11} /> Passage
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("delivery");
                    setSpecs("Medium Box (10kg)");
                  }}
                  className={cn(
                    "flex-1 py-1 text-xs font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1",
                    type === "delivery" ? "bg-[#FF9600] text-white" : "bg-white text-[#222D2C]"
                  )}
                >
                  <Package size={11} /> Delivery
                </button>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-[#5B6360] uppercase block mb-1">
              {type === "passage" ? "PASSAGE TITLE / PURPOSE:" : "CARGO DESCRIPTION / TITLE:"}
            </label>
            <input
              type="text"
              required
              placeholder={type === "passage" ? "e.g. Passage to Newark Penn Station" : "e.g. 48V Solar Inverter Box to MSU Microgrid"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#EFECE6] border border-[#222D2C] px-2.5 py-1 text-xs focus:outline-none focus:bg-white"
            />
          </div>

          {/* Destination Type & Destination Picker */}
          <div className="space-y-1.5 p-2 bg-[#EFECE6] border border-[#222D2C]">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#222D2C] uppercase">DESTINATION BOUNDS:</label>
              <div className="flex border border-[#222D2C] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setDestinationType("community");
                    setDestination("Upper Montclair [C4]");
                  }}
                  className={cn(
                    "px-2 py-0.5 font-bold uppercase cursor-pointer",
                    destinationType === "community" ? "bg-[#0F5257] text-white" : "bg-white text-[#222D2C]"
                  )}
                >
                  Community Bounds [A-H]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDestinationType("city");
                    setDestination("Newark, NJ");
                  }}
                  className={cn(
                    "px-2 py-0.5 font-bold uppercase cursor-pointer",
                    destinationType === "city" ? "bg-[#005EAC] text-white" : "bg-white text-[#222D2C]"
                  )}
                >
                  Destination City
                </button>
              </div>
            </div>

            {destinationType === "community" ? (
              <div className="space-y-1">
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-white border border-[#222D2C] px-2 py-1 text-xs cursor-pointer"
                >
                  <option value="Upper Montclair Depot [C4]">Upper Montclair Depot [C4]</option>
                  <option value="MSU Richardson Hall [B7]">Montclair State University (MSU) [B7]</option>
                  <option value="Mills Reservation Ridge [A4]">Mills Reservation Overlook [A4]</option>
                  <option value="Watchung Plaza Hub [E5]">Watchung Plaza [E5]</option>
                  <option value="Downtown Montclair Center [F4]">Downtown Montclair [F4]</option>
                  <option value="Nantucket Station [D5]">Nantucket Station [D5]</option>
                  <option value="Camp 3 Field Shelter [G2]">Camp 3 Field Shelter [G2]</option>
                  <option value="Nishuane Springhouse [H4]">Nishuane Park Springhouse [H4]</option>
                  <option value="All Community Bounds [A-H]">Anywhere within Community Bounds [A-H]</option>
                </select>
                <div className="text-xs text-[#5B6360]">
                  Includes fixed 500m letter/number grid coordinates calibrated to local Toner cartography.
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-white border border-[#222D2C] px-2 py-1 text-xs cursor-pointer"
                >
                  <option value="Newark, NJ (Penn Station)">Newark, NJ (Penn Station / Downtown)</option>
                  <option value="New York City (Midtown / Port Authority)">New York City, NY (Midtown / Port Authority)</option>
                  <option value="Paterson, NJ (Maker Lab)">Paterson, NJ (Maker Guild / Great Falls)</option>
                  <option value="Morristown, NJ">Morristown, NJ</option>
                  <option value="Jersey City / Hoboken, NJ">Jersey City / Hoboken, NJ</option>
                  <option value="Clifton, NJ">Clifton, NJ</option>
                </select>
                <input
                  type="text"
                  placeholder="Or enter custom regional city / address..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-white border border-[#222D2C] px-2 py-1 text-xs mt-1"
                />
              </div>
            )}
          </div>

          {/* Origin & Specs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-[#5B6360] uppercase block mb-1">ORIGIN / PICKUP AREA:</label>
              <input
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-[#EFECE6] border border-[#222D2C] px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#5B6360] uppercase block mb-1">
                {type === "passage" ? "PASSENGERS / SEATS:" : "CARGO WEIGHT & SIZE:"}
              </label>
              <input
                type="text"
                required
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder={type === "passage" ? "e.g. 1 Seat + Bag" : "e.g. 20kg Crate"}
                className="w-full bg-[#EFECE6] border border-[#222D2C] px-2 py-1 text-xs"
              />
            </div>
          </div>

          {/* Timing: Set Time vs Anytime */}
          <div className="p-2 bg-[#EFECE6] border border-[#222D2C] space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#222D2C] uppercase">TIMING REQUIREMENT:</label>
              <div className="flex border border-[#222D2C] text-xs">
                <button
                  type="button"
                  onClick={() => setTimingType("scheduled")}
                  className={cn(
                    "px-2 py-0.5 font-bold uppercase cursor-pointer flex items-center gap-1",
                    timingType === "scheduled" ? "bg-[#005EAC] text-white" : "bg-white text-[#222D2C]"
                  )}
                >
                  <Clock size={10} /> Set Time
                </button>
                <button
                  type="button"
                  onClick={() => setTimingType("anytime")}
                  className={cn(
                    "px-2 py-0.5 font-bold uppercase cursor-pointer flex items-center gap-1",
                    timingType === "anytime" ? "bg-[#3CCC23] text-white" : "bg-white text-[#222D2C]"
                  )}
                >
                  Anytime / Flexible
                </button>
              </div>
            </div>

            {timingType === "scheduled" ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Today 16:30, Tomorrow 08:00, Friday 14:00"
                  value={timingDetails}
                  onChange={(e) => setTimingDetails(e.target.value)}
                  className="flex-1 bg-white border border-[#222D2C] px-2 py-1 text-xs"
                />
              </div>
            ) : (
              <div className="text-xs text-[#5B6360]">
                Flexible delivery or passage. Can be fulfilled anytime within the next 24 to 48 hours.
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-[#5B6360] uppercase block mb-1">COORDINATION NOTES / BARTER / DETAILS:</label>
            <input
              type="text"
              placeholder="e.g. Can trade solar battery charging, heavy lifting help, or fresh produce."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#EFECE6] border border-[#222D2C] px-2.5 py-1 text-xs"
            />
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="flex gap-2 pt-2 border-t border-[#222D2C]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-[#EFECE6] text-[#222D2C] border border-[#222D2C] py-1.5 font-bold uppercase cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#0F5257] hover:bg-[#093539] text-white border border-[#222D2C] py-1.5 font-bold uppercase cursor-pointer shadow-md"
            >
              Broadcast to Mesh →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Expanded Full Screen Transport View ──────────────────────────
interface TransportExpandedViewProps {
  entries: TransportEntry[];
  onAddEntry: (entry: Omit<TransportEntry, "id" | "timestamp">) => void;
  onClaimEntry: (id: string) => void;
}

export function TransportExpandedView({ entries, onAddEntry, onClaimEntry }: TransportExpandedViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "passage" | "delivery">("all");
  const [timingFilter, setTimingFilter] = useState<"all" | "scheduled" | "anytime">("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "community" | "city">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const filteredEntries = entries.filter((e) => {
    if (activeTab === "passage" && e.type !== "passage") return false;
    if (activeTab === "delivery" && e.type !== "delivery") return false;
    if (timingFilter !== "all" && e.timingType !== timingFilter) return false;
    if (scopeFilter !== "all" && e.destinationType !== scopeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.destination.toLowerCase().includes(q) ||
        e.origin.toLowerCase().includes(q) ||
        e.user.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-3 font-mono text-xs">
      {/* Top Banner */}
      <div className="p-3 bg-[#0F5257] text-white flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Car size={18} />
          <span className="font-bold text-sm uppercase">PEER-TO-PEER TRANSPORT & CARGO DISPATCH</span>
          <span className="text-xs bg-white/20 px-2 py-0.5">
            {entries.length} ACTIVE RUNS // OFFLINE MESH DISPATCH
          </span>
        </div>
        <button
          onClick={() => setIsPostModalOpen(true)}
          className="bg-white hover:bg-[#EFECE6] text-[#0F5257] px-3 py-1 font-bold uppercase flex items-center gap-1 cursor-pointer border border-[#222D2C]"
        >
          <Plus size={13} /> Post Passage or Delivery
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border-2 border-[#222D2C] flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#5B6360] uppercase text-xs">CATEGORY:</span>
          {["all", "passage", "delivery"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-2.5 py-1 font-bold uppercase border cursor-pointer transition-colors",
                activeTab === tab ? "bg-[#0F5257] text-white border-[#0F5257]" : "bg-white text-[#222D2C] border-[#222D2C]"
              )}
            >
              {tab === "all" ? "ALL TRIPS" : tab.toUpperCase()}
            </button>
          ))}

          <span className="font-bold text-[#5B6360] uppercase text-xs ml-2">TIMING:</span>
          {["all", "scheduled", "anytime"].map((t) => (
            <button
              key={t}
              onClick={() => setTimingFilter(t as any)}
              className={cn(
                "px-2.5 py-1 font-bold uppercase border cursor-pointer transition-colors",
                timingFilter === t ? "bg-[#005EAC] text-white border-[#005EAC]" : "bg-white text-[#222D2C] border-[#222D2C]"
              )}
            >
              {t === "all" ? "ALL" : t === "scheduled" ? "SET TIME" : "ANYTIME"}
            </button>
          ))}

          <span className="font-bold text-[#5B6360] uppercase text-xs ml-2">DESTINATION:</span>
          {["all", "community", "city"].map((s) => (
            <button
              key={s}
              onClick={() => setScopeFilter(s as any)}
              className={cn(
                "px-2.5 py-1 font-bold uppercase border cursor-pointer transition-colors",
                scopeFilter === s ? "bg-[#222D2C] text-white border-[#222D2C]" : "bg-white text-[#222D2C] border-[#222D2C]"
              )}
            >
              {s === "all" ? "ALL BOUNDS" : s === "community" ? "COMMUNITY [A-H]" : "REGIONAL CITIES"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by city, grid, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#EFECE6] border border-[#222D2C] px-2.5 py-1 text-xs focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Grid of Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredEntries.map((item) => (
          <div key={item.id} className="p-3 bg-white border-2 border-[#222D2C] flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 uppercase text-white flex items-center gap-1",
                    item.type === "passage" ? "bg-[#0F5257]" : "bg-[#FF9600]"
                  )}>
                    {item.type === "passage" ? <Users size={11} /> : <Package size={11} />}
                    <span>{item.type === "passage" ? "PASSAGE NEED" : "DELIVERY NEED"}</span>
                  </span>

                  <span className={cn(
                    "text-xs font-bold px-1.5 py-0.5 uppercase border",
                    item.destinationType === "community" ? "bg-[#EFECE6] text-[#0F5257] border-[#0F5257]" : "bg-[#005EAC]/10 text-[#005EAC] border-[#005EAC]"
                  )}>
                    {item.destinationType === "community" ? "COMMUNITY BOUNDS" : "REGIONAL CITY"}
                  </span>

                  {item.timingType === "scheduled" ? (
                    <span className="text-xs font-bold px-2 py-0.5 bg-[#005EAC] text-white flex items-center gap-1">
                      <Clock size={10} /> {item.timingDetails}
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-0.5 bg-[#3CCC23] text-white">
                      ANYTIME / FLEXIBLE
                    </span>
                  )}
                </div>

                <span className="text-xs text-[#5B6360] bg-[#EFECE6] px-2 py-0.5 border border-[#222D2C]/20">
                  {item.timestamp}
                </span>
              </div>

              <h4 className="font-bold text-sm text-[#222D2C] mb-1 font-sans">{item.title}</h4>

              <div className="p-2 bg-[#EFECE6] border border-[#222D2C] space-y-1 mb-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#5B6360]">ORIGIN: <strong className="text-[#222D2C]">{item.origin}</strong></span>
                  <ArrowRight size={12} className="text-[#0F5257]" />
                  <span className="text-[#0F5257] font-bold">DESTINATION: {item.destination}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-[#5B6360] mb-1">
                <span>PAYLOAD / SEATS: <strong className="text-[#222D2C]">{item.specs}</strong></span>
                {item.gridRef && (
                  <span className="font-bold text-[#0F5257] bg-white border border-[#222D2C] px-1.5 py-0.2">
                    MAP GRID [{item.gridRef}]
                  </span>
                )}
              </div>

              {item.notes && (
                <p className="text-xs text-[#3E4846] font-sans leading-relaxed bg-[#FFFFFF] p-1.5 border border-[#222D2C]/20 mt-1">
                  {item.notes}
                </p>
              )}
            </div>

            <div className="pt-2 mt-2 border-t border-[#222D2C]/20 flex justify-between items-center text-xs">
              <span className="text-[#0F5257] font-bold">POSTED BY: {item.user}</span>
              {item.claimed ? (
                <span className="text-[#3CCC23] font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> COORDINATED
                </span>
              ) : (
                <button
                  onClick={() => onClaimEntry(item.id)}
                  className="bg-[#0F5257] hover:bg-[#093539] text-white px-3 py-1 font-bold uppercase cursor-pointer border border-[#222D2C]"
                >
                  {item.mode === "request" ? "Provide Passage / Courier →" : "Claim Ride / Courier →"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isPostModalOpen && (
        <TransportPostDialog
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onSubmit={(entryData) => {
            onAddEntry(entryData);
            setIsPostModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
