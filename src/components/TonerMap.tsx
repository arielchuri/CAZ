import React, { useState, useRef, useEffect, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { 
  Zap, 
  Droplets as Water, 
  Heart, 
  Utensils, 
  Radio, 
  Plus, 
  Minus, 
  RotateCcw,
  Layers,
  Leaf,
  Star,
  CloudSun,
  Wind,
  BookOpen,
  MapPin,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { cn } from "./BrutalBase";

// ─── Montclair Township Bounding Box (Exact Geographic Limits) ────
export const MONTCLAIR_BOUNDS: [[number, number], [number, number]] = [
  [-74.2420, 40.7950], // Southwest: South End / Nishuane / Orange border (40.7950° N, -74.2420° W)
  [-74.1900, 40.8750], // Northeast: Mills Reservation / MSU / Clove Rd (40.8750° N, -74.1900° W)
];

const MONTCLAIR_CENTER: [number, number] = [-74.2160, 40.8350];

// 8 Rows (A-H) and 8 Columns (1-8) covering Montclair
const GRID_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const GRID_COLS = ["1", "2", "3", "4", "5", "6", "7", "8"];

export interface MapFeature {
  id: string;
  name: string;
  scientificName?: string;
  lng: number;
  lat: number;
  gridRef: string;
  category: "infrastructure" | "foraging" | "wikipedia" | "osm_poi" | "account";
  subCategory: string;
  color: string;
  badgeBg: string;
  season?: string;
  imageUrl?: string;
  wikipediaUrl?: string;
  details: string;
  extraMeta?: string;
}

// ─── REAL & ACCURATELY POSITIONED MONTCLAIR LOCATIONS ──────────────
export const ALL_MAP_FEATURES: MapFeature[] = [
  {
    "id": "inf-msu-solar",
    "name": "MSU 50kW Emergency Solar Canopy",
    "lng": -74.198,
    "lat": 40.8624,
    "subCategory": "Microgrid Power",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "48V MPPT array charging 60kWh LiFePO4 battery storage bank at Montclair State.",
    "category": "infrastructure",
    "gridRef": "B7"
  },
  {
    "id": "inf-mills-repeater",
    "name": "Mills Reservation High Altitude Repeater",
    "lng": -74.2215,
    "lat": 40.8695,
    "subCategory": "Mesh Relay",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "details": "Solar-powered 915MHz LoRa repeater + 2m/70cm W2NJ ham radio relay on the basalt ridge.",
    "category": "infrastructure",
    "gridRef": "A4"
  },
  {
    "id": "inf-yantacaw-water",
    "name": "Yantacaw Brook Sand & UV Filtration Station",
    "lng": -74.2025,
    "lat": 40.8585,
    "subCategory": "Water Reserves",
    "color": "#3ABEAE",
    "badgeBg": "bg-[#3ABEAE]",
    "details": "3-stage gravity bio-sand filter + solar UV disinfection chamber along Yantacaw Brook.",
    "category": "infrastructure",
    "gridRef": "B7"
  },
  {
    "id": "inf-valley-clinic",
    "name": "Valley Road Emergency First Aid Clinic",
    "lng": -74.2048,
    "lat": 40.8465,
    "subCategory": "Medical Triage",
    "color": "#DF4C40",
    "badgeBg": "bg-[#DF4C40]",
    "details": "Solar-refrigerated insulin bank, antibiotics, trauma dressings, and EMT post on Valley Road.",
    "category": "infrastructure",
    "gridRef": "C6"
  },
  {
    "id": "inf-upper-depot",
    "name": "Upper Montclair Hub & Food Depot",
    "lng": -74.2085,
    "lat": 40.8433,
    "subCategory": "Mutual Aid",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "details": "Central mutual aid distribution depot, cold storage pantry, and tool library on Valley Road.",
    "category": "infrastructure",
    "gridRef": "D6"
  },
  {
    "id": "inf-upper-timber",
    "name": "Upper Montclair Timber Framing Yard",
    "lng": -74.218,
    "lat": 40.851,
    "subCategory": "Labor & Building",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "details": "Staging yard for collective volunteer labor, timber framing, and mortise-tenon joinery.",
    "category": "infrastructure",
    "gridRef": "C4"
  },
  {
    "id": "inf-anderson-cistern",
    "name": "Anderson Meadow Rainwater Cistern",
    "lng": -74.217,
    "lat": 40.841,
    "subCategory": "Water Reserves",
    "color": "#3ABEAE",
    "badgeBg": "bg-[#3ABEAE]",
    "details": "10,000L underground emergency rainwater catchment vault beneath Anderson lawn.",
    "category": "infrastructure",
    "gridRef": "D4"
  },
  {
    "id": "inf-watchung-microgrid",
    "name": "Watchung Plaza Solar Microgrid",
    "lng": -74.208,
    "lat": 40.832,
    "subCategory": "Microgrid Power",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "DC-coupled 18kW commercial rooftop solar array powering emergency communications.",
    "category": "infrastructure",
    "gridRef": "E6"
  },
  {
    "id": "inf-walnut-tools",
    "name": "Walnut Street Tool Shed & Repair Guild",
    "lng": -74.2112,
    "lat": 40.8202,
    "subCategory": "Labor & Tools",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "details": "Open-access woodworking, welding, and battery repair workshop on Walnut St.",
    "category": "infrastructure",
    "gridRef": "F5"
  },
  {
    "id": "inf-mhs-storage",
    "name": "Montclair High Emergency Battery Pack",
    "lng": -74.2123,
    "lat": 40.8231,
    "subCategory": "Microgrid Power",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "24kWh LiFePO4 battery pack backing up amphitheater emergency radios and public hall lighting.",
    "category": "infrastructure",
    "gridRef": "F5"
  },
  {
    "id": "inf-toneys-filter",
    "name": "Toney's Brook Bio-Swale Filtration",
    "lng": -74.214,
    "lat": 40.824,
    "subCategory": "Water Reserves",
    "color": "#3ABEAE",
    "badgeBg": "bg-[#3ABEAE]",
    "details": "Engineered bio-retention swale and sediment capture weir along Toney's Brook.",
    "category": "infrastructure",
    "gridRef": "F5"
  },
  {
    "id": "inf-edgemont-depot",
    "name": "Edgemont Park Aid Post & Pond Filter",
    "lng": -74.2155,
    "lat": 40.821,
    "subCategory": "Aid Station",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "Emergency water rations and neighborhood mesh dispatch relay at Edgemont Park.",
    "category": "infrastructure",
    "gridRef": "F5"
  },
  {
    "id": "inf-pine-pantry",
    "name": "Pine Street Mutual Aid Pantry",
    "lng": -74.208,
    "lat": 40.817,
    "subCategory": "Mutual Aid",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "details": "Community food share, infant supplies, and dry goods distribution locker.",
    "category": "infrastructure",
    "gridRef": "F6"
  },
  {
    "id": "inf-downtown-mesh",
    "name": "Bloomfield Ave Commercial Mesh Hub",
    "lng": -74.216,
    "lat": 40.813,
    "subCategory": "Mesh Network",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "details": "Dual-band LoRa / Wi-Fi mesh relay bridging downtown Bloomfield Ave merchants.",
    "category": "infrastructure",
    "gridRef": "G5"
  },
  {
    "id": "inf-fullerton-triage",
    "name": "South Fullerton Medical Triage Point",
    "lng": -74.2165,
    "lat": 40.8125,
    "subCategory": "Medical Triage",
    "color": "#DF4C40",
    "badgeBg": "bg-[#DF4C40]",
    "details": "Central first aid triage center, AED post, and emergency oxygen supply point.",
    "category": "infrastructure",
    "gridRef": "G4"
  },
  {
    "id": "inf-church-st-fridge",
    "name": "Church Street Community Fridge",
    "lng": -74.218,
    "lat": 40.8135,
    "subCategory": "Mutual Aid",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "details": "24/7 solar-powered community refrigerator and non-perishable pantry box.",
    "category": "infrastructure",
    "gridRef": "G4"
  },
  {
    "id": "inf-elm-metalworks",
    "name": "Elm Street Metal & Forge Guild",
    "lng": -74.21,
    "lat": 40.811,
    "subCategory": "Labor & Tools",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "details": "Blacksmithing forge, sheet metal brake, and solar frame fabrication workshop.",
    "category": "infrastructure",
    "gridRef": "G5"
  },
  {
    "id": "inf-glenfield-mesh",
    "name": "Glenfield Park Radio Mast",
    "lng": -74.205,
    "lat": 40.809,
    "subCategory": "Mesh Relay",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "details": "High-gain omni antenna linking the South End to downtown mesh nodes.",
    "category": "infrastructure",
    "gridRef": "G6"
  },
  {
    "id": "inf-south-end-battery",
    "name": "South End Community Battery Bank #2",
    "lng": -74.216,
    "lat": 40.803,
    "subCategory": "Microgrid Power",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "details": "12kWh LiFePO4 battery bank providing emergency power to South End residential refrigeration.",
    "category": "infrastructure",
    "gridRef": "H5"
  },
  {
    "id": "inf-south-spring-catchment",
    "name": "Nishuane Springhead & Cistern Vault",
    "lng": -74.218,
    "lat": 40.8005,
    "subCategory": "Water Reserves",
    "color": "#3ABEAE",
    "badgeBg": "bg-[#3ABEAE]",
    "details": "Springhead overflow collection cistern with dual gravity-fed charcoal stage filters.",
    "category": "infrastructure",
    "gridRef": "H4"
  },
  {
    "id": "inf-orange-rd-aid",
    "name": "Orange Road Aid Dispatch",
    "lng": -74.212,
    "lat": 40.805,
    "subCategory": "Aid Station",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "Neighborhood disaster coordinator dispatch and emergency battery swap station.",
    "category": "infrastructure",
    "gridRef": "H5"
  },
  {
    "id": "inf-first-mountain-beacon",
    "name": "First Mountain RF Beacon",
    "lng": -74.238,
    "lat": 40.865,
    "subCategory": "Mesh Network",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "details": "Solar repeater providing emergency link to western Essex County networks.",
    "category": "infrastructure",
    "gridRef": "A1"
  },
  {
    "id": "inf-clove-substation",
    "name": "Clove Road Emergency Switchgear",
    "lng": -74.195,
    "lat": 40.873,
    "subCategory": "Microgrid Power",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "High-capacity manual disconnect intertie at northern grid boundary.",
    "category": "infrastructure",
    "gridRef": "A8"
  },
  {
    "id": "inf-bonsal-biofilter",
    "name": "Bonsal Wetland Bio-Filter",
    "lng": -74.201,
    "lat": 40.864,
    "subCategory": "Water Reserves",
    "color": "#3ABEAE",
    "badgeBg": "bg-[#3ABEAE]",
    "details": "Constructed reed bed wetland purifying stormwater inflows naturally.",
    "category": "infrastructure",
    "gridRef": "B7"
  },
  {
    "id": "inf-bradford-shelter",
    "name": "Bradford Emergency Warming Shelter",
    "lng": -74.2013,
    "lat": 40.854,
    "subCategory": "Aid Station",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "Backup geothermal heated gymnasium and emergency community kitchen.",
    "category": "infrastructure",
    "gridRef": "C7"
  },
  {
    "id": "inf-chestnut-woodshop",
    "name": "Chestnut Street Community Woodshop",
    "lng": -74.215,
    "lat": 40.826,
    "subCategory": "Labor & Tools",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "details": "Cabinetry and solar mounting bracket woodworking center.",
    "category": "infrastructure",
    "gridRef": "E5"
  },
  {
    "id": "inf-depot-sq-charger",
    "name": "Depot Square Solar Bike Charger",
    "lng": -74.211,
    "lat": 40.8195,
    "subCategory": "Microgrid Power",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "48V e-bike and cargo tricycle solar rapid charging hub.",
    "category": "infrastructure",
    "gridRef": "F5"
  },
  {
    "id": "inf-canterbury-tank",
    "name": "Canterbury Park Water Cache",
    "lng": -74.225,
    "lat": 40.806,
    "subCategory": "Water Reserves",
    "color": "#3ABEAE",
    "badgeBg": "bg-[#3ABEAE]",
    "details": "5,000L emergency potable water storage trailer on standby.",
    "category": "infrastructure",
    "gridRef": "G3"
  },
  {
    "id": "forage-mills-blueberries",
    "name": "Highbush Blueberry",
    "scientificName": "Vaccinium corymbosum",
    "lng": -74.221,
    "lat": 40.8685,
    "subCategory": "Wild Berries",
    "color": "#8F57CB",
    "badgeBg": "bg-[#8F57CB]",
    "season": "Summer (July - August)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Vaccinium_corymbosum_002.JPG/320px-Vaccinium_corymbosum_002.JPG",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Vaccinium_corymbosum",
    "details": "Mills Reservation rocky escarpment thickets. Abundant sweet antioxidant berries on acidic basalt soil.",
    "category": "foraging",
    "gridRef": "A4"
  },
  {
    "id": "forage-chicken-mushroom",
    "name": "Chicken of the Woods",
    "scientificName": "Laetiporus sulphureus",
    "lng": -74.22,
    "lat": 40.8715,
    "subCategory": "Wild Mushrooms",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "season": "Spring to Autumn (May - Oct)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Laetiporus_sulphureus_JPG01.jpg/320px-Laetiporus_sulphureus_JPG01.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Laetiporus_sulphureus",
    "details": "Mills ancient fallen oak logs. Prime choice edible wild polypore mushroom.",
    "category": "foraging",
    "gridRef": "A4"
  },
  {
    "id": "forage-white-pine",
    "name": "Eastern White Pine",
    "scientificName": "Pinus strobus",
    "lng": -74.234,
    "lat": 40.871,
    "subCategory": "Medicinal Conifer",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "season": "Year-Round (Winter Forage)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Pinus_strobus_needles.jpg/320px-Pinus_strobus_needles.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Pinus_strobus",
    "details": "Needles rich in Vitamin C, excellent for winter tonic tea and resin salves.",
    "category": "foraging",
    "gridRef": "A2"
  },
  {
    "id": "forage-sumac",
    "name": "Staghorn Sumac",
    "scientificName": "Rhus typhina",
    "lng": -74.224,
    "lat": 40.873,
    "subCategory": "Wild Spice & Tea",
    "color": "#DF4C40",
    "badgeBg": "bg-[#DF4C40]",
    "season": "Late Summer to Autumn",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Rhus_typhina_fruit.jpg/320px-Rhus_typhina_fruit.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Rhus_typhina",
    "details": "Tart crimson fuzzy berry clusters used for citrusy sumac-ade cold infusion tea and Middle Eastern spice.",
    "category": "foraging",
    "gridRef": "A3"
  },
  {
    "id": "forage-chanterelle",
    "name": "Golden Chanterelle",
    "scientificName": "Cantharellus cibarius",
    "lng": -74.228,
    "lat": 40.865,
    "subCategory": "Wild Mushrooms",
    "color": "#FAD13E",
    "badgeBg": "bg-[#FAD13E]",
    "season": "Mid Summer to Autumn",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Cantharellus_cibarius_1.JPG/320px-Cantharellus_cibarius_1.JPG",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Cantharellus_cibarius",
    "details": "Hardwood mossy banks along Watchung ridge. Apricot aroma and buttery flavor.",
    "category": "foraging",
    "gridRef": "A3"
  },
  {
    "id": "forage-elderberry",
    "name": "American Black Elderberry",
    "scientificName": "Sambucus canadensis",
    "lng": -74.2035,
    "lat": 40.8575,
    "subCategory": "Medicinal Berries",
    "color": "#8F57CB",
    "badgeBg": "bg-[#8F57CB]",
    "season": "Late Summer (August - Sept)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Sambucus_nigra_fruits_01.jpg/320px-Sambucus_nigra_fruits_01.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Sambucus_canadensis",
    "details": "Yantacaw wetland margin. Immune-supportive elderberry syrup harvest.",
    "category": "foraging",
    "gridRef": "B6"
  },
  {
    "id": "forage-sweet-birch",
    "name": "Sweet Birch (Wintergreen)",
    "scientificName": "Betula lenta",
    "lng": -74.228,
    "lat": 40.861,
    "subCategory": "Medicinal Bark",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "season": "Spring / Autumn",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Betula_lenta_bark.jpg/320px-Betula_lenta_bark.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Betula_lenta",
    "details": "Wintergreen aromatic twigs used for pain-relieving methyl salicylate tea.",
    "category": "foraging",
    "gridRef": "B3"
  },
  {
    "id": "forage-ramps",
    "name": "Wild Ramps / Leeks",
    "scientificName": "Allium tricoccum",
    "lng": -74.2005,
    "lat": 40.863,
    "subCategory": "Wild Alliums",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "season": "Early Spring (April - May)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Allium_tricoccum_01.jpg/320px-Allium_tricoccum_01.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Allium_tricoccum",
    "details": "Rich deciduous forest floor along Bonsal preserve. Pungent garlicky wild spring onion delicacy.",
    "category": "foraging",
    "gridRef": "B7"
  },
  {
    "id": "forage-raspberry",
    "name": "American Red Raspberry",
    "scientificName": "Rubus idaeus",
    "lng": -74.219,
    "lat": 40.852,
    "subCategory": "Wild Berries",
    "color": "#DF4C40",
    "badgeBg": "bg-[#DF4C40]",
    "season": "Summer (June - July)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Rubus_idaeus_fruit.jpg/320px-Rubus_idaeus_fruit.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Rubus_idaeus",
    "details": "Sunny trailside thicket near Highland Ave. Sweet aromatic red berries.",
    "category": "foraging",
    "gridRef": "C4"
  },
  {
    "id": "forage-morel",
    "name": "Black Morel",
    "scientificName": "Morchella angusticeps",
    "lng": -74.222,
    "lat": 40.849,
    "subCategory": "Wild Mushrooms",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "season": "Early Spring (April - May)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Morchella_elata_1.jpg/320px-Morchella_elata_1.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Morchella",
    "details": "Shaded soil near Presby Iris garden borders. Prize edible gourmet hollow mushroom.",
    "category": "foraging",
    "gridRef": "C4"
  },
  {
    "id": "forage-juneberry-anderson",
    "name": "Serviceberry / Juneberry",
    "scientificName": "Amelanchier canadensis",
    "lng": -74.2165,
    "lat": 40.8415,
    "subCategory": "Fruit Trees",
    "color": "#DF4C40",
    "badgeBg": "bg-[#DF4C40]",
    "season": "Early Summer (June)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Amelanchier_lamarckii_fruit.jpg/320px-Amelanchier_lamarckii_fruit.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Amelanchier",
    "details": "Anderson Park border plantings. Sweet almond-blueberry flavored fruit.",
    "category": "foraging",
    "gridRef": "D4"
  },
  {
    "id": "forage-wood-sorrel",
    "name": "Common Wood Sorrel",
    "scientificName": "Oxalis stricta",
    "lng": -74.2155,
    "lat": 40.842,
    "subCategory": "Edible Herbs",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "season": "Spring to Autumn",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Oxalis_stricta_02.jpg/320px-Oxalis_stricta_02.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Oxalis_stricta",
    "details": "Heart-shaped clover-like leaves with bright tangy lemon oxalic acid flavor.",
    "category": "foraging",
    "gridRef": "D5"
  },
  {
    "id": "forage-mulberry",
    "name": "Red Mulberry",
    "scientificName": "Morus rubra",
    "lng": -74.207,
    "lat": 40.833,
    "subCategory": "Fruit Trees",
    "color": "#8F57CB",
    "badgeBg": "bg-[#8F57CB]",
    "season": "Summer (June - July)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Morus_rubra_fruit.JPG/320px-Morus_rubra_fruit.JPG",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Morus_rubra",
    "details": "Watchung rail embankment. Sweet juicy dark purple berries.",
    "category": "foraging",
    "gridRef": "E6"
  },
  {
    "id": "forage-garlic-mustard",
    "name": "Garlic Mustard",
    "scientificName": "Alliaria petiolata",
    "lng": -74.2095,
    "lat": 40.831,
    "subCategory": "Wild Greens",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "season": "Spring (March - May)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Alliaria_petiolata_flower.jpg/320px-Alliaria_petiolata_flower.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Alliaria_petiolata",
    "details": "Nutritious invasive green with strong garlic-horseradish zest. Foraging aids native forest restoration.",
    "category": "foraging",
    "gridRef": "E5"
  },
  {
    "id": "forage-nettle",
    "name": "Stinging Nettle",
    "scientificName": "Urtica dioica",
    "lng": -74.21234,
    "lat": 40.82308,
    "subCategory": "Wild Greens",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "season": "Early Spring (March - May)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Urtica_dioica_-_Stinging_Nettle.jpg/320px-Urtica_dioica_-_Stinging_Nettle.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Urtica_dioica",
    "details": "Toney's Brook shaded banks behind MHS amphitheater. Mineral-rich greens and cordage fiber.",
    "category": "foraging",
    "gridRef": "F5"
  },
  {
    "id": "forage-walnut-edgemont",
    "name": "Black Walnut",
    "scientificName": "Juglans nigra",
    "lng": -74.2155,
    "lat": 40.821,
    "subCategory": "Nut Trees",
    "color": "#8F57CB",
    "badgeBg": "bg-[#8F57CB]",
    "season": "Late Autumn (Sept - Nov)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Juglans_nigra_1-jeb.jpg/320px-Juglans_nigra_1-jeb.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Juglans_nigra",
    "details": "Edgemont Memorial Park grove of 12 mature black walnut trees around the pond.",
    "category": "foraging",
    "gridRef": "F5"
  },
  {
    "id": "forage-oyster",
    "name": "Pearl Oyster Mushroom",
    "scientificName": "Pleurotus ostreatus",
    "lng": -74.2145,
    "lat": 40.8205,
    "subCategory": "Wild Mushrooms",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "season": "Autumn to Mild Winter",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Pleurotus_ostreatus_01.jpg/320px-Pleurotus_ostreatus_01.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Pleurotus_ostreatus",
    "details": "Edgemont fallen willow trunks. Tender savory cluster mushroom.",
    "category": "foraging",
    "gridRef": "F5"
  },
  {
    "id": "forage-maitake",
    "name": "Maitake / Hen of the Woods",
    "scientificName": "Grifola frondosa",
    "lng": -74.225,
    "lat": 40.819,
    "subCategory": "Wild Mushrooms",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "season": "Autumn (Sept - Nov)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Grifola_frondosa_20080927_01.jpg/320px-Grifola_frondosa_20080927_01.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Grifola_frondosa",
    "details": "Found at the base of centuries-old oak along North Mountain Ave. Rich savory polypore.",
    "category": "foraging",
    "gridRef": "F3"
  },
  {
    "id": "forage-ginkgo",
    "name": "Ginkgo Biloba (Maidenhair)",
    "scientificName": "Ginkgo biloba",
    "lng": -74.2235,
    "lat": 40.814,
    "subCategory": "Medicinal Tree",
    "color": "#FAD13E",
    "badgeBg": "bg-[#FAD13E]",
    "season": "Autumn (October - Nov)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Ginkgo_biloba_leaves.jpg/320px-Ginkgo_biloba_leaves.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Ginkgo_biloba",
    "details": "South Mountain Ave & Church St. Nutrient-rich roasted nuts and medicinal leaves.",
    "category": "foraging",
    "gridRef": "G3"
  },
  {
    "id": "forage-dandelion",
    "name": "Dandelion & Wild Chicory",
    "scientificName": "Taraxacum officinale",
    "lng": -74.22,
    "lat": 40.811,
    "subCategory": "Edible Herbs",
    "color": "#FAD13E",
    "badgeBg": "bg-[#FAD13E]",
    "season": "Spring / Autumn",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Taraxacum_officinale_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-135.jpg/320px-Taraxacum_officinale_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-135.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Taraxacum",
    "details": "Nutritious bitter greens, prebiotic inulin roots, and golden spring blossom tea.",
    "category": "foraging",
    "gridRef": "G4"
  },
  {
    "id": "forage-red-clover",
    "name": "Red Clover Blossoms",
    "scientificName": "Trifolium pratense",
    "lng": -74.2045,
    "lat": 40.8085,
    "subCategory": "Wild Herbs",
    "color": "#DF4C40",
    "badgeBg": "bg-[#DF4C40]",
    "season": "Spring to Autumn",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Trifolium_pratense_080608.jpg/320px-Trifolium_pratense_080608.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Trifolium_pratense",
    "details": "Glenfield Park meadow. Sweet herbal blossom tea and nitrogen-fixing soil nourishment.",
    "category": "foraging",
    "gridRef": "G6"
  },
  {
    "id": "forage-plantain",
    "name": "Broadleaf Plantain",
    "scientificName": "Plantago major",
    "lng": -74.206,
    "lat": 40.8075,
    "subCategory": "Medicinal Herbs",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "season": "Spring to Autumn",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Plantago_major_01.jpg/320px-Plantago_major_01.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Plantago_major",
    "details": "Potent wound-healing poultice herb for bee stings, burns, and scrapes.",
    "category": "foraging",
    "gridRef": "G6"
  },
  {
    "id": "forage-persimmon-nishuane",
    "name": "American Persimmon Grove",
    "scientificName": "Diospyros virginiana",
    "lng": -74.218,
    "lat": 40.8005,
    "subCategory": "Fruit Trees",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "season": "Late Autumn (After First Frost)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Diospyros_virginiana_fruit.jpg/320px-Diospyros_virginiana_fruit.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Diospyros_virginiana",
    "details": "Nishuane Park community grove. Rich honey-custard flavored fruit when fully ripe.",
    "category": "foraging",
    "gridRef": "H4"
  },
  {
    "id": "forage-pawpaw",
    "name": "Pawpaw Grove (Wild Banana)",
    "scientificName": "Asimina triloba",
    "lng": -74.221,
    "lat": 40.7995,
    "subCategory": "Native Fruit Trees",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "season": "Autumn (September - Oct)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Asimina_triloba_fruit.jpg/320px-Asimina_triloba_fruit.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Asimina_triloba",
    "details": "Nishuane stream valley. Creamy mango-banana flavored tropical custard pulp.",
    "category": "foraging",
    "gridRef": "H4"
  },
  {
    "id": "forage-wild-garlic",
    "name": "Wild Garlic & Field Onion",
    "scientificName": "Allium vineale",
    "lng": -74.216,
    "lat": 40.7975,
    "subCategory": "Wild Alliums",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "season": "Spring / Autumn",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Allium_vineale_1.jpg/320px-Allium_vineale_1.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Allium_vineale",
    "details": "Nishuane southern border. Pungent green chives and edible underground bulbs.",
    "category": "foraging",
    "gridRef": "H5"
  },
  {
    "id": "forage-blackberry",
    "name": "Allegheny Blackberry",
    "scientificName": "Rubus allegheniensis",
    "lng": -74.232,
    "lat": 40.867,
    "subCategory": "Wild Berries",
    "color": "#8F57CB",
    "badgeBg": "bg-[#8F57CB]",
    "season": "Late Summer (July - August)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Rubus_allegheniensis_fruit.jpg/320px-Rubus_allegheniensis_fruit.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Rubus_allegheniensis",
    "details": "Thorny brambles along Watchung crest trails yielding rich, deeply flavored black fruit.",
    "category": "foraging",
    "gridRef": "A2"
  },
  {
    "id": "forage-dryad",
    "name": "Dryad's Saddle (Pheasant Back)",
    "scientificName": "Cerioporus squamosus",
    "lng": -74.204,
    "lat": 40.856,
    "subCategory": "Wild Mushrooms",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "season": "Spring (May - June)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Cerioporus_squamosus_01.jpg/320px-Cerioporus_squamosus_01.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Cerioporus_squamosus",
    "details": "Yantacaw dead boxelder trunks. Watermelon-rind aroma, tender when young.",
    "category": "foraging",
    "gridRef": "B6"
  },
  {
    "id": "forage-mullein",
    "name": "Great Mullein",
    "scientificName": "Verbascum thapsus",
    "lng": -74.21,
    "lat": 40.819,
    "subCategory": "Medicinal Herbs",
    "color": "#FAD13E",
    "badgeBg": "bg-[#FAD13E]",
    "season": "Summer to Autumn",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Verbascum_thapsus_01.jpg/320px-Verbascum_thapsus_01.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Verbascum_thapsus",
    "details": "Velvety biennial leaves used for respiratory soothing herbal teas and herbal wick torches.",
    "category": "foraging",
    "gridRef": "F5"
  },
  {
    "id": "forage-chestnut",
    "name": "Blight-Resistant American Chestnut",
    "scientificName": "Castanea dentata x",
    "lng": -74.236,
    "lat": 40.869,
    "subCategory": "Nut Trees",
    "color": "#8F57CB",
    "badgeBg": "bg-[#8F57CB]",
    "season": "Autumn (October)",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Castanea_sativa_fruit.jpg/320px-Castanea_sativa_fruit.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/American_chestnut",
    "details": "First Mountain experimental grove of hybrid sweet chestnuts.",
    "category": "foraging",
    "gridRef": "A1"
  },
  {
    "id": "forage-mugwort",
    "name": "Common Mugwort",
    "scientificName": "Artemisia vulgaris",
    "lng": -74.213,
    "lat": 40.815,
    "subCategory": "Aromatic Herbs",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "season": "Summer to Autumn",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Artemisia_vulgaris_01.jpg/320px-Artemisia_vulgaris_01.jpg",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Artemisia_vulgaris",
    "details": "Bloomfield rail siding. Aromatic bitter digestive tonic, dream herb, and moxibustion herb.",
    "category": "foraging",
    "gridRef": "G5"
  },
  {
    "id": "wiki-mills-park",
    "name": "Mills Reservation County Park",
    "lng": -74.2215,
    "lat": 40.8695,
    "subCategory": "Protected Wilderness",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Mills_Reservation",
    "details": "157-acre county park on the First Watchung Mountain ridge. Features historical basalt quarry overviews and native forest.",
    "category": "wikipedia",
    "gridRef": "A4"
  },
  {
    "id": "wiki-yantacaw-park",
    "name": "Yantacaw Brook Park",
    "lng": -74.2025,
    "lat": 40.8585,
    "subCategory": "County Parklands",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Yantacaw_Brook_Park",
    "details": "11.5-acre linear stream park with historic stone footbridges and waterfowl sanctuary.",
    "category": "wikipedia",
    "gridRef": "B7"
  },
  {
    "id": "wiki-presby-iris",
    "name": "Presby Memorial Iris Gardens",
    "lng": -74.2215,
    "lat": 40.8491,
    "subCategory": "Botanical Garden",
    "color": "#8F57CB",
    "badgeBg": "bg-[#8F57CB]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Presby_Memorial_Iris_Gardens",
    "details": "Founded in 1927 in memory of Frank Presby. Features over 10,000 individual iris plants representing 1,500 varieties.",
    "category": "wikipedia",
    "gridRef": "C4"
  },
  {
    "id": "wiki-bellevue-theater",
    "name": "Bellevue Theater (Upper Montclair)",
    "lng": -74.2135,
    "lat": 40.8433,
    "subCategory": "Tudor Landmark",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Bellevue_Theater_(New_Jersey)",
    "details": "Built in 1922 in Tudor Revival architectural style. Historic Upper Montclair community cultural hub.",
    "category": "wikipedia",
    "gridRef": "D5"
  },
  {
    "id": "wiki-anderson-park",
    "name": "Anderson Park (Olmsted Brothers)",
    "lng": -74.2165,
    "lat": 40.8415,
    "subCategory": "Historic Landscape",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Anderson_Park_(Montclair,_New_Jersey)",
    "details": "Designed in 1903 by the legendary Olmsted Brothers landscape architects. Features open meadow commons and historic tree canopy.",
    "category": "wikipedia",
    "gridRef": "D4"
  },
  {
    "id": "wiki-van-vleck",
    "name": "Van Vleck House and Gardens",
    "lng": -74.2195,
    "lat": 40.8355,
    "subCategory": "Historic Villa & Arboretum",
    "color": "#8F57CB",
    "badgeBg": "bg-[#8F57CB]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Van_Vleck_House_and_Gardens",
    "details": "Historic Italianate villa estate and private botanical garden featuring premier rhododendrons and azaleas.",
    "category": "wikipedia",
    "gridRef": "D4"
  },
  {
    "id": "wiki-watchung-plaza",
    "name": "Watchung Plaza Historic District",
    "lng": -74.208,
    "lat": 40.832,
    "subCategory": "Historic Commercial Hub",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Watchung_Plaza",
    "details": "Early 20th century town square surrounding the historic 1904 Watchung Avenue station.",
    "category": "wikipedia",
    "gridRef": "E6"
  },
  {
    "id": "wiki-edgemont-park",
    "name": "Edgemont Memorial Park",
    "lng": -74.2155,
    "lat": 40.821,
    "subCategory": "Municipal Parklands",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Edgemont_Memorial_Park",
    "details": "Picturesque park with island pond, World War I monument, and walking paths.",
    "category": "wikipedia",
    "gridRef": "F5"
  },
  {
    "id": "wiki-clark-house",
    "name": "The Clark House (Historic Library)",
    "lng": -74.2205,
    "lat": 40.82,
    "subCategory": "Victorian Landmark",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Montclair_Historical_Society",
    "details": "1894 Queen Anne Victorian mansion housing Montclair Historical Society research archives.",
    "category": "wikipedia",
    "gridRef": "F4"
  },
  {
    "id": "wiki-montclair-art-museum",
    "name": "Montclair Art Museum (MAM)",
    "lng": -74.2241,
    "lat": 40.8146,
    "subCategory": "Cultural Landmark",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Montclair_Art_Museum",
    "details": "Founded in 1914. Renowned for its American art collection and extensive Native American historical artifacts.",
    "category": "wikipedia",
    "gridRef": "G3"
  },
  {
    "id": "wiki-wellmont-theater",
    "name": "Wellmont Theater",
    "lng": -74.217,
    "lat": 40.8135,
    "subCategory": "Performing Arts",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Wellmont_Theater",
    "details": "Built in 1922 as a vaudeville theater. Historic performance and live music center on Bloomfield Ave.",
    "category": "wikipedia",
    "gridRef": "G4"
  },
  {
    "id": "wiki-crane-house",
    "name": "Crane House and Historic YWCA",
    "lng": -74.2105,
    "lat": 40.8105,
    "subCategory": "Historic Museum",
    "color": "#DF4C40",
    "badgeBg": "bg-[#DF4C40]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Crane_House_and_Historic_YWCA",
    "details": "Built in 1796 by Israel Crane. Served as African American YWCA from 1920 to 1965, pivotal in civil rights.",
    "category": "wikipedia",
    "gridRef": "G5"
  },
  {
    "id": "wiki-nishuane-park",
    "name": "Nishuane Park & Historical Spring",
    "lng": -74.218,
    "lat": 40.8005,
    "subCategory": "Historic Springs & Park",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Nishuane_Park",
    "details": "17-acre historic park featuring natural fresh spring runoff and centuries-old oak canopy.",
    "category": "wikipedia",
    "gridRef": "H4"
  },
  {
    "id": "wiki-st-lukes",
    "name": "St. Luke's Episcopal Church",
    "lng": -74.2185,
    "lat": 40.8115,
    "subCategory": "Gothic Architecture",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/St._Luke%27s_Episcopal_Church_(Montclair,_New_Jersey)",
    "details": "Historic 1889 English Gothic revival brownstone church with stained glass sanctuary.",
    "category": "wikipedia",
    "gridRef": "G4"
  },
  {
    "id": "wiki-first-congregational",
    "name": "First Congregational Church",
    "lng": -74.221,
    "lat": 40.812,
    "subCategory": "Historic Landmark",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/First_Congregational_Church_(Montclair,_New_Jersey)",
    "details": "Founded in 1870. Historic architectural landmark at S Fullerton Ave & Plymouth St.",
    "category": "wikipedia",
    "gridRef": "G4"
  },
  {
    "id": "wiki-shultz-house",
    "name": "Shultz House (The Evergreens)",
    "lng": -74.231,
    "lat": 40.837,
    "subCategory": "Victorian Estate",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Shultz_House",
    "details": "1896 time capsule mansion preserving three generations of scientific, electrical, and mechanical artifacts.",
    "category": "wikipedia",
    "gridRef": "D2"
  },
  {
    "id": "wiki-israel-crane-homestead",
    "name": "Israel Crane Homestead Site",
    "lng": -74.209,
    "lat": 40.8115,
    "subCategory": "Colonial Landmark",
    "color": "#DF4C40",
    "badgeBg": "bg-[#DF4C40]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Israel_Crane",
    "details": "Original homestead site of turnpike merchant Israel Crane, founder of Newark-Pompton Turnpike.",
    "category": "wikipedia",
    "gridRef": "G6"
  },
  {
    "id": "wiki-marlboro-inn-site",
    "name": "Marlboro Inn Historical Site",
    "lng": -74.223,
    "lat": 40.827,
    "subCategory": "Historic Site",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Marlboro_Inn",
    "details": "Site of historic 1901 Tudor inn where artist George Inness and author F. Scott Fitzgerald stayed.",
    "category": "wikipedia",
    "gridRef": "E3"
  },
  {
    "id": "wiki-carriage-house",
    "name": "Historic Carriage House & Cooperage",
    "lng": -74.21,
    "lat": 40.8095,
    "subCategory": "Historic Workshop",
    "color": "#FF9600",
    "badgeBg": "bg-[#FF9600]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Montclair_History_Center",
    "details": "19th century timber carriage barn and wooden barrel cooperage shop on Orange Rd.",
    "category": "wikipedia",
    "gridRef": "G5"
  },
  {
    "id": "wiki-womens-club",
    "name": "Montclair Women's Club Building",
    "lng": -74.222,
    "lat": 40.813,
    "subCategory": "Historic Civic Hall",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/The_Women%27s_Club_of_Montclair",
    "details": "1924 Greek Revival community clubhouse dedicated to women's suffrage and community charity.",
    "category": "wikipedia",
    "gridRef": "G4"
  },
  {
    "id": "wiki-upper-mountain-district",
    "name": "Upper Mountain Ave Historic District",
    "lng": -74.225,
    "lat": 40.845,
    "subCategory": "Historic Architecture",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Upper_Mountain_Avenue_Historic_District",
    "details": "Late 19th-century grand residential estates with panoramic views over the New York City skyline.",
    "category": "wikipedia",
    "gridRef": "D3"
  },
  {
    "id": "osm-msu-campus",
    "name": "Montclair State University Campus",
    "lng": -74.198,
    "lat": 40.8624,
    "subCategory": "University Commons",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "1 Normal Ave. Major public research university campus.",
    "category": "osm_poi",
    "gridRef": "B7"
  },
  {
    "id": "osm-msu-station",
    "name": "Montclair Heights Train Station",
    "lng": -74.196,
    "lat": 40.859,
    "subCategory": "Transit Depot",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "details": "Mountain Ave & Normal Ave. Commuter train depot.",
    "category": "osm_poi",
    "gridRef": "B8"
  },
  {
    "id": "osm-bradford-school",
    "name": "Bradford Elementary School Entrance",
    "lng": -74.20132,
    "lat": 40.85406,
    "subCategory": "Public School",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "87 Mt Hebron Rd. Bradford Elementary School main entrance and community gardens.",
    "category": "osm_poi",
    "gridRef": "C7"
  },
  {
    "id": "osm-mpl-bellevue",
    "name": "Bellevue Public Library Branch",
    "lng": -74.20457,
    "lat": 40.84069,
    "subCategory": "Public Library",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "185 Bellevue Ave. Historic Carnegie-funded library building in Upper Montclair village.",
    "category": "osm_poi",
    "gridRef": "D6"
  },
  {
    "id": "osm-train-upper",
    "name": "Upper Montclair Station (NJ Transit)",
    "lng": -74.214,
    "lat": 40.843,
    "subCategory": "Transit Depot",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "details": "Bellevue Ave & Cooper Ave. Commuter rail station with bicycle parking depot.",
    "category": "osm_poi",
    "gridRef": "D5"
  },
  {
    "id": "osm-post-upper",
    "name": "Upper Montclair Post Office",
    "lng": -74.207,
    "lat": 40.8435,
    "subCategory": "Postal Service",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "242 Bellevue Ave. Upper Montclair branch post office.",
    "category": "osm_poi",
    "gridRef": "D6"
  },
  {
    "id": "osm-fire-station-2",
    "name": "Montclair Fire Station #2",
    "lng": -74.2065,
    "lat": 40.844,
    "subCategory": "Emergency Services",
    "color": "#DF4C40",
    "badgeBg": "bg-[#DF4C40]",
    "details": "588 Valley Rd. Upper Montclair municipal firehouse and emergency EMS bay.",
    "category": "osm_poi",
    "gridRef": "D6"
  },
  {
    "id": "osm-mountain-ave-station",
    "name": "Mountain Avenue Train Station",
    "lng": -74.21,
    "lat": 40.848,
    "subCategory": "Transit Depot",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "details": "Old Mountain Road & Laurel Place commuter station.",
    "category": "osm_poi",
    "gridRef": "C5"
  },
  {
    "id": "osm-watchung-school",
    "name": "Watchung Elementary School",
    "lng": -74.202,
    "lat": 40.835,
    "subCategory": "Public School",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "14 Garden St. Public elementary school and sports fields.",
    "category": "osm_poi",
    "gridRef": "E7"
  },
  {
    "id": "osm-watchung-station",
    "name": "Watchung Avenue Train Station",
    "lng": -74.2085,
    "lat": 40.8325,
    "subCategory": "Transit Depot",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "details": "Watchung Ave & Park St commuter rail depot.",
    "category": "osm_poi",
    "gridRef": "E6"
  },
  {
    "id": "osm-buzz-aldrin-school",
    "name": "Buzz Aldrin Middle School",
    "lng": -74.212,
    "lat": 40.836,
    "subCategory": "Public School",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "173 Bellevue Ave. Named after Montclair-born Apollo 11 astronaut Buzz Aldrin.",
    "category": "osm_poi",
    "gridRef": "D5"
  },
  {
    "id": "osm-mhs",
    "name": "Montclair High School Amphitheater",
    "lng": -74.21234,
    "lat": 40.82308,
    "subCategory": "Public School & Commons",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "100 Chestnut St. Montclair High School outdoor amphitheater & community commons.",
    "category": "osm_poi",
    "gridRef": "F5"
  },
  {
    "id": "osm-edgemont-school",
    "name": "Edgemont Montessori School",
    "lng": -74.217,
    "lat": 40.822,
    "subCategory": "Public School",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "4 Edgemont Rd. Public elementary Montessori magnet school.",
    "category": "osm_poi",
    "gridRef": "F4"
  },
  {
    "id": "osm-train-walnut",
    "name": "Walnut Street Train Station",
    "lng": -74.2112,
    "lat": 40.8202,
    "subCategory": "Transit Depot",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "details": "Walnut St & Depot Square. Host site for weekly farmer's market.",
    "category": "osm_poi",
    "gridRef": "F5"
  },
  {
    "id": "osm-renaissance-school",
    "name": "Renaissance Middle School",
    "lng": -74.215,
    "lat": 40.819,
    "subCategory": "Public School",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "176 N Fullerton Ave. Public middle school campus.",
    "category": "osm_poi",
    "gridRef": "F5"
  },
  {
    "id": "osm-mpl-main",
    "name": "Montclair Public Library (Main Branch)",
    "lng": -74.2162,
    "lat": 40.8128,
    "subCategory": "Public Library",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "50 South Fullerton Ave. Public digital archives, tool library, and seed collection.",
    "category": "osm_poi",
    "gridRef": "G4"
  },
  {
    "id": "osm-municipal-bldg",
    "name": "Montclair Municipal Town Hall",
    "lng": -74.215,
    "lat": 40.811,
    "subCategory": "Civic Center",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "205 Claremont Ave. Town council chambers and municipal administration.",
    "category": "osm_poi",
    "gridRef": "G5"
  },
  {
    "id": "osm-fire-hq",
    "name": "Montclair Fire Headquarters",
    "lng": -74.212,
    "lat": 40.813,
    "subCategory": "Emergency Services",
    "color": "#DF4C40",
    "badgeBg": "bg-[#DF4C40]",
    "details": "1 Pine St. Main emergency fire dispatch and rescue apparatus bays.",
    "category": "osm_poi",
    "gridRef": "G5"
  },
  {
    "id": "osm-post-main",
    "name": "Montclair Main Post Office",
    "lng": -74.218,
    "lat": 40.812,
    "subCategory": "Postal Service",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "55 S Fullerton Ave. Central USPS sorting hub.",
    "category": "osm_poi",
    "gridRef": "G4"
  },
  {
    "id": "osm-hillside-school",
    "name": "Hillside Elementary School",
    "lng": -74.219,
    "lat": 40.808,
    "subCategory": "Public School",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "54 Orange Rd. Public magnet elementary school for performing arts.",
    "category": "osm_poi",
    "gridRef": "G4"
  },
  {
    "id": "osm-glenfield-school",
    "name": "Glenfield Middle School",
    "lng": -74.206,
    "lat": 40.808,
    "subCategory": "Public School",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "25 Maple Ave. Public visual and performing arts middle school.",
    "category": "osm_poi",
    "gridRef": "G6"
  },
  {
    "id": "osm-glenfield-park",
    "name": "Glenfield Park & Community Center",
    "lng": -74.205,
    "lat": 40.809,
    "subCategory": "Civic Center",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "details": "Maple Ave & Woodland Ave. Public athletic courts and community meeting rooms.",
    "category": "osm_poi",
    "gridRef": "G6"
  },
  {
    "id": "osm-bay-st-station",
    "name": "Bay Street Train Station",
    "lng": -74.206,
    "lat": 40.815,
    "subCategory": "Transit Depot",
    "color": "#222D2C",
    "badgeBg": "bg-[#222D2C]",
    "details": "Pine St & Bay St commuter rail depot and parking deck.",
    "category": "osm_poi",
    "gridRef": "G6"
  },
  {
    "id": "osm-nishuane-school",
    "name": "Nishuane Elementary School",
    "lng": -74.215,
    "lat": 40.7985,
    "subCategory": "Public School",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "36 Cedar Ave. South End community educational hub.",
    "category": "osm_poi",
    "gridRef": "H5"
  },
  {
    "id": "osm-fire-station-3",
    "name": "Montclair Fire Station #3",
    "lng": -74.216,
    "lat": 40.799,
    "subCategory": "Emergency Services",
    "color": "#DF4C40",
    "badgeBg": "bg-[#DF4C40]",
    "details": "Cedar Ave & Orange Rd South End fire station.",
    "category": "osm_poi",
    "gridRef": "H5"
  },
  {
    "id": "osm-canterbury-park",
    "name": "Canterbury Park & Field",
    "lng": -74.225,
    "lat": 40.805,
    "subCategory": "Public Park",
    "color": "#3CCC23",
    "badgeBg": "bg-[#3CCC23]",
    "details": "Canterbury Rd public athletic field and neighborhood park.",
    "category": "osm_poi",
    "gridRef": "H3"
  },
  {
    "id": "osm-bullock-school",
    "name": "Charles H. Bullock Elementary School",
    "lng": -74.21,
    "lat": 40.8155,
    "subCategory": "Public School",
    "color": "#005EAC",
    "badgeBg": "bg-[#005EAC]",
    "details": "55 Washington St. Green ribbon LEED-certified public school campus.",
    "category": "osm_poi",
    "gridRef": "F5"
  },
  {
    "id": "ariel-home-node",
    "name": "Ariel's Primary Home Node #742",
    "lng": -74.209,
    "lat": 40.841,
    "subCategory": "Primary Residence",
    "color": "#FAD13E",
    "badgeBg": "bg-[#FAD13E]",
    "details": "Primary base station: 4.8kWh backup, W2NJ ham station & LoRa mesh gateway.",
    "category": "account",
    "gridRef": "D6"
  },
  {
    "id": "ariel-proj-msu",
    "name": "Project: MSU Solar Array Intertie",
    "lng": -74.198,
    "lat": 40.8624,
    "subCategory": "Lead Engineering Task",
    "color": "#FAD13E",
    "badgeBg": "bg-[#FAD13E]",
    "details": "Configuring 48V MPPT charge controllers and DC-coupled battery isolation switches.",
    "category": "account",
    "gridRef": "B7"
  },
  {
    "id": "ariel-proj-mills",
    "name": "Project: Mills Tower Maintenance",
    "lng": -74.2215,
    "lat": 40.8695,
    "subCategory": "Maintenance Task",
    "color": "#FAD13E",
    "badgeBg": "bg-[#FAD13E]",
    "details": "Quarterly inspection of solar mast and RF antenna coax integrity.",
    "category": "account",
    "gridRef": "A4"
  }
];

const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

function getRelatedOsSection(feature: MapFeature): { id: string; label: string; iconName: string } | null {
  if (feature.category === "account") {
    return { id: "ariel_projects", label: "Ariel's Community Projects", iconName: "FolderGit2" };
  }
  if (feature.category === "infrastructure") {
    if (feature.subCategory.includes("Power") || feature.subCategory.includes("Solar") || feature.subCategory.includes("Battery")) {
      return { id: "power", label: "Microgrid Power", iconName: "Zap" };
    }
    if (feature.subCategory.includes("Water")) {
      return { id: "water", label: "Water Reserves", iconName: "Water" };
    }
    if (feature.subCategory.includes("Mesh") || feature.subCategory.includes("Relay")) {
      return { id: "mesh", label: "Mesh Telemetry", iconName: "Radio" };
    }
    if (feature.subCategory.includes("Labor") || feature.subCategory.includes("Tools") || feature.subCategory.includes("Building")) {
      return { id: "labor", label: "Labor & Tool Guilds", iconName: "Wrench" };
    }
    if (feature.subCategory.includes("Aid") || feature.subCategory.includes("Medical") || feature.subCategory.includes("Depot")) {
      return { id: "matcher", label: "Mutual Aid Matcher", iconName: "Heart" };
    }
  }
  if (feature.category === "foraging") {
    return { id: "nature", label: "Nature Clock & Ephemeris", iconName: "Sun" };
  }
  if (feature.category === "wikipedia" || feature.category === "osm_poi") {
    return { id: "knowledge", label: "Knowledge Base & Archives", iconName: "BookOpen" };
  }
  return null;
}

export const TonerMap: React.FC<{ isFullscreen?: boolean }> = ({ isFullscreen = false }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Category Layer Toggles (in Column Panel)
  const [showInfrastructure, setShowInfrastructure] = useState(true);
  const [showForaging, setShowForaging] = useState(true);
  const [showWikipedia, setShowWikipedia] = useState(true);
  const [showOsmPoi, setShowOsmPoi] = useState(true);
  const [showAccount, setShowAccount] = useState(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(true);

  const allLayersActive = showInfrastructure && showForaging && showWikipedia && showOsmPoi && showAccount && showWeatherOverlay;

  const handleToggleAllLayers = () => {
    const nextState = !allLayersActive;
    setShowInfrastructure(nextState);
    setShowForaging(nextState);
    setShowWikipedia(nextState);
    setShowOsmPoi(nextState);
    setShowAccount(nextState);
    setShowWeatherOverlay(nextState);
  };

  // Selected item modal state
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGridCell, setCurrentGridCell] = useState("D4");

  // Interactive Map Calibration / Coordinate Inspector
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibratedPoint, setCalibratedPoint] = useState<{ lng: number; lat: number; cell: string } | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Live Mini Wikipedia Entry State
  const [wikiExtract, setWikiExtract] = useState<string | null>(null);
  const [wikiDescription, setWikiDescription] = useState<string | null>(null);
  const [wikiThumbnail, setWikiThumbnail] = useState<string | null>(null);
  const [isWikiLoading, setIsWikiLoading] = useState(false);

  useEffect(() => {
    if (selectedFeature && selectedFeature.wikipediaUrl) {
      const match = selectedFeature.wikipediaUrl.match(/\/wiki\/(.+)$/);
      if (match && match[1]) {
        const titleSlug = match[1];
        setIsWikiLoading(true);
        setWikiExtract(null);
        setWikiDescription(null);
        setWikiThumbnail(null);

        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${titleSlug}`)
          .then((res) => {
            if (!res.ok) throw new Error("Network error");
            return res.json();
          })
          .then((data) => {
            if (data.extract) setWikiExtract(data.extract);
            if (data.description) setWikiDescription(data.description);
            if (data.thumbnail && data.thumbnail.source) setWikiThumbnail(data.thumbnail.source);
            setIsWikiLoading(false);
          })
          .catch(() => {
            setIsWikiLoading(false);
          });
      }
    } else {
      setWikiExtract(null);
      setWikiDescription(null);
      setWikiThumbnail(null);
      setIsWikiLoading(false);
    }
  }, [selectedFeature]);

  // Dynamic Screen Projections for Persistent Grid Labels & Mask
  const [columnCenters, setColumnCenters] = useState<{ col: string; x: number }[]>([]);
  const [rowCenters, setRowCenters] = useState<{ row: string; y: number }[]>([]);
  const [gridBox, setGridBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const updateGridProjection = useCallback((map: any) => {
    if (!map || !mapWrapperRef.current) return;
    const minLng = MONTCLAIR_BOUNDS[0][0];
    const minLat = MONTCLAIR_BOUNDS[0][1];
    const maxLng = MONTCLAIR_BOUNDS[1][0];
    const maxLat = MONTCLAIR_BOUNDS[1][1];

    const nw = map.project([minLng, maxLat]);
    const se = map.project([maxLng, minLat]);
    const w = se.x - nw.x;
    const h = se.y - nw.y;

    setGridBox({ x: nw.x, y: nw.y, width: w, height: h });

    // Calculate Column X Centers
    const lngStep = (maxLng - minLng) / GRID_COLS.length;
    const cols: { col: string; x: number }[] = [];
    for (let c = 0; c < GRID_COLS.length; c++) {
      const midLng = minLng + (c + 0.5) * lngStep;
      const pt = map.project([midLng, maxLat]);
      cols.push({ col: GRID_COLS[c], x: pt.x });
    }
    setColumnCenters(cols);

    // Calculate Row Y Centers
    const latStep = (maxLat - minLat) / GRID_ROWS.length;
    const rows: { row: string; y: number }[] = [];
    for (let r = 0; r < GRID_ROWS.length; r++) {
      const midLat = maxLat - (r + 0.5) * latStep;
      const pt = map.project([minLng, midLat]);
      rows.push({ row: GRID_ROWS[r], y: pt.y });
    }
    setRowCenters(rows);

    const center = map.getCenter();
    const colIdx = Math.min(7, Math.max(0, Math.floor(((center.lng - minLng) / (maxLng - minLng)) * 8)));
    const rowIdx = Math.min(7, Math.max(0, Math.floor(((maxLat - center.lat) / (maxLat - minLat)) * 8)));
    setCurrentGridCell(`${GRID_ROWS[rowIdx]}${GRID_COLS[colIdx]}`);
  }, []);

  // Initialize MapLibre: Free Zoom out to see full height, with outside masked to white
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new (maplibregl as any).Map({
      container: mapContainerRef.current,
      style: OSM_RASTER_STYLE,
      center: MONTCLAIR_CENTER,
      zoom: 12.2,
      minZoom: 10.5, // ALLOW ZOOMING OUT FREELY TO VIEW ENTIRE HEIGHT
      maxZoom: 18.0,
      bounds: MONTCLAIR_BOUNDS,
      fitBoundsOptions: { padding: 40 },
      attributionControl: false,
      // STRICT 2D: NO TILT, NO PITCH, NO ROTATION
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      touchZoomRotate: false,
      maxPitch: 0,
      minPitch: 0,
      bearing: 0,
      pitch: 0,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });

    mapRef.current = map;

    const updateMinZoomToFit = () => {
      if (!map) return;
      map.fitBounds(MONTCLAIR_BOUNDS, { padding: 25, animate: false });
      const fitZoom = map.getZoom();
      map.setMinZoom(fitZoom);
      map.resize();
      updateGridProjection(map);
    };

    map.on("load", () => {
      updateMinZoomToFit();
    });

    map.on("click", (e: any) => {
      const lng = parseFloat(e.lngLat.lng.toFixed(5));
      const lat = parseFloat(e.lngLat.lat.toFixed(5));
      
      const minLng = MONTCLAIR_BOUNDS[0][0];
      const minLat = MONTCLAIR_BOUNDS[0][1];
      const maxLng = MONTCLAIR_BOUNDS[1][0];
      const maxLat = MONTCLAIR_BOUNDS[1][1];
      const colIdx = Math.min(7, Math.max(0, Math.floor(((lng - minLng) / (maxLng - minLng)) * 8)));
      const rowIdx = Math.min(7, Math.max(0, Math.floor(((maxLat - lat) / (maxLat - minLat)) * 8)));
      const cell = `${GRID_ROWS[rowIdx]}${GRID_COLS[colIdx]}`;

      setCalibratedPoint({ lng, lat, cell });
    });

    map.on("render", () => updateGridProjection(map));
    map.on("move", () => updateGridProjection(map));
    map.on("zoom", () => updateGridProjection(map));

    const timer = setTimeout(() => {
      map.fitBounds(MONTCLAIR_BOUNDS, { padding: 40, animate: false });
      map.resize();
      updateGridProjection(map);
    }, 150);

    const handleResize = () => {
      map.resize();
      updateGridProjection(map);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync Markers with Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const activeFeatures = ALL_MAP_FEATURES.filter((f) => {
      if (f.category === "infrastructure" && !showInfrastructure) return false;
      if (f.category === "foraging" && !showForaging) return false;
      if (f.category === "wikipedia" && !showWikipedia) return false;
      if (f.category === "osm_poi" && !showOsmPoi) return false;
      if (f.category === "account" && !showAccount) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.details.toLowerCase().includes(q) || f.subCategory.toLowerCase().includes(q);
      }
      return true;
    });

    activeFeatures.forEach((f) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer group relative";
      
      let iconSymbol = "●";
      if (f.category === "foraging") iconSymbol = "🌿";
      if (f.category === "wikipedia") iconSymbol = "🏛️";
      if (f.category === "osm_poi") iconSymbol = "📍";
      if (f.category === "account") iconSymbol = "★";
      if (f.category === "infrastructure") iconSymbol = "⚡";

      el.innerHTML = `
        <div style="background-color: ${f.color}; border: 1.5px solid #222D2C; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 1px 1px 2px rgba(0,0,0,0.4); font-size: 10px; color: #FFFFFF;" class="hover:scale-125 transition-transform">
          <span>${iconSymbol}</span>
        </div>
      `;

      el.addEventListener("click", () => {
        setSelectedFeature(f);
      });

      const marker = new (maplibregl as any).Marker({ element: el })
        .setLngLat([f.lng, f.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [showInfrastructure, showForaging, showWikipedia, showOsmPoi, showAccount, searchQuery]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleReset = () => {
    mapRef.current?.fitBounds(MONTCLAIR_BOUNDS, { padding: 25, duration: 600 });
  };

  const flyToFeature = (f: MapFeature) => {
    setSelectedFeature(f);
    mapRef.current?.flyTo({ center: [f.lng, f.lat], zoom: 15, duration: 800 });
  };

  return (
    <div
      className={cn(
        "relative w-full h-full bg-[#EFECE6] overflow-hidden select-none flex min-h-[300px]",
        isFullscreen ? "h-full w-full" : "h-full"
      )}
      style={{ margin: 0, padding: 0 }}
    >
      {/* ─── COLUMN PANEL: MAP LAYERS & DIRECTORY (Left Sidebar) ────── */}
      <div className="w-64 bg-[#EFECE6] border-r border-[#222D2C] flex flex-col shrink-0 z-30 font-mono text-xs">
        {/* Panel Header with Toggle All */}
        <div className="p-2 bg-[#222D2C] text-white flex justify-between items-center shrink-0">
          <div className="font-bold uppercase flex items-center gap-1.5">
            <Layers size={13} className="text-[#FAD13E]" />
            <span>Map Layers</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleAllLayers}
              className={cn(
                "px-1.5 py-0.5 text-xs font-bold uppercase border cursor-pointer transition-colors shadow-sm",
                allLayersActive 
                  ? "bg-[#FAD13E] text-[#222D2C] border-[#FAD13E] hover:bg-[#e0c04a]" 
                  : "bg-transparent text-white border-white/40 hover:bg-white/10"
              )}
              title={allLayersActive ? "Turn All Layers Off" : "Turn All Layers On"}
            >
              {allLayersActive ? "ALL ON" : "ALL OFF"}
            </button>
            <span className="text-xs bg-white/20 px-1 py-0.5">OSM</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-1.5 border-b border-[#222D2C] bg-white shrink-0">
          <div className="flex items-center gap-1 bg-[#EFECE6] border border-[#222D2C] px-1.5 py-0.5">
            <Search size={11} className="text-[#5B6360]" />
            <input
              type="text"
              placeholder="Search fauna, nodes, articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none font-mono text-xs text-[#222D2C]"
            />
          </div>
        </div>

        {/* Toggleable Layer Rows */}
        <div className="p-1.5 border-b border-[#222D2C] flex flex-col gap-1 bg-[#FFFFFF] shrink-0">
          <LayerRow
            label="CAZ Infrastructure"
            color="bg-[#005EAC]"
            count={ALL_MAP_FEATURES.filter(f => f.category === "infrastructure").length}
            active={showInfrastructure}
            onToggle={() => setShowInfrastructure(!showInfrastructure)}
            icon={<Zap size={11} />}
          />
          <LayerRow
            label="Foraging & Fauna (Species)"
            color="bg-[#8F57CB]"
            count={ALL_MAP_FEATURES.filter(f => f.category === "foraging").length}
            active={showForaging}
            onToggle={() => setShowForaging(!showForaging)}
            icon={<Leaf size={11} />}
          />
          <LayerRow
            label="Wikipedia Landmark Articles"
            color="bg-[#222D2C]"
            count={ALL_MAP_FEATURES.filter(f => f.category === "wikipedia").length}
            active={showWikipedia}
            onToggle={() => setShowWikipedia(!showWikipedia)}
            icon={<BookOpen size={11} />}
          />
          <LayerRow
            label="OSM Public Amenities & POIs"
            color="bg-[#3CCC23]"
            count={ALL_MAP_FEATURES.filter(f => f.category === "osm_poi").length}
            active={showOsmPoi}
            onToggle={() => setShowOsmPoi(!showOsmPoi)}
            icon={<MapPin size={11} />}
          />
          <LayerRow
            label="Ariel's Tasks & Favorites"
            color="bg-[#FAD13E]"
            textColor="text-[#222D2C]"
            count={ALL_MAP_FEATURES.filter(f => f.category === "account").length}
            active={showAccount}
            onToggle={() => setShowAccount(!showAccount)}
            icon={<Star size={11} />}
          />
          <LayerRow
            label="Weather Radar & Wind HUD"
            color="bg-[#3ABEAE]"
            count={0}
            active={showWeatherOverlay}
            onToggle={() => setShowWeatherOverlay(!showWeatherOverlay)}
            icon={<Wind size={11} />}
          />
        </div>

        {/* Location Directory (Scrollable List) */}
        <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1 bg-[#EFECE6]">
          <span className="text-xs font-bold text-[#5B6360] uppercase px-1">
            Active Locations ({ALL_MAP_FEATURES.length})
          </span>
          {ALL_MAP_FEATURES.map((feat) => (
            <div
              key={feat.id}
              onClick={() => flyToFeature(feat)}
              className={cn(
                "p-1.5 border transition-colors cursor-pointer text-left flex items-center justify-between gap-1",
                selectedFeature?.id === feat.id
                  ? "bg-[#FFFFFF] border-[#005EAC] ring-1 ring-[#005EAC]"
                  : "bg-[#FFFFFF] border-[#222D2C] hover:bg-[#DFDDD7]"
              )}
            >
              <div className="min-w-0">
                <div className="font-bold text-xs text-[#222D2C] truncate leading-tight flex items-center gap-1">
                  <span className={cn("w-2 h-2 shrink-0", feat.badgeBg)} />
                  <span className="truncate">{feat.name}</span>
                </div>
                <div className="text-xs text-[#5B6360] truncate">{feat.subCategory}</div>
              </div>
              <span className="font-mono text-xs bg-[#EFECE6] border border-[#222D2C] px-1 py-0.2 shrink-0 font-bold">
                {feat.gridRef}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Status */}
        <div className="p-1.5 bg-[#DFDDD7] border-t border-[#222D2C] flex justify-between items-center text-xs font-mono text-[#5B6360] shrink-0">
          <span>BOUNDS: MONTCLAIR</span>
          <span className="font-bold text-[#222D2C]">CELL [{currentGridCell}]</span>
        </div>
      </div>

      {/* ─── MAP CANVAS & PERSISTENT STICKY GRID AREA ───────────────── */}
      <div ref={mapWrapperRef} className="flex-1 h-full relative overflow-hidden bg-[#EFECE6]">
        
        {/* MapLibre WebGL Container */}
        <div 
          ref={mapContainerRef} 
          className="absolute inset-0 w-full h-full"
          style={{ width: "100%", height: "100%" }}
        />

        {/* ─── BLANK WHITE MASK OUTSIDE THE GRID ────────────────────── */}
        {gridBox && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Top Mask */}
            <div
              className="absolute left-0 right-0 top-0 bg-[#EFECE6]"
              style={{ height: `${Math.max(0, gridBox.y)}px` }}
            />
            {/* Bottom Mask */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-[#EFECE6]"
              style={{ top: `${Math.max(0, gridBox.y + gridBox.height)}px` }}
            />
            {/* Left Mask */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#EFECE6]"
              style={{
                top: `${Math.max(0, gridBox.y)}px`,
                height: `${gridBox.height}px`,
                width: `${Math.max(0, gridBox.x)}px`,
              }}
            />
            {/* Right Mask */}
            <div
              className="absolute top-0 bottom-0 right-0 bg-[#EFECE6]"
              style={{
                top: `${Math.max(0, gridBox.y)}px`,
                height: `${gridBox.height}px`,
                left: `${Math.max(0, gridBox.x + gridBox.width)}px`,
              }}
            />
          </div>
        )}

        {/* ─── CLEAN PERSISTENT TOP COLUMN BADGES (1-8) ─────────────── */}
        <div className="absolute top-2 left-0 right-0 h-6 z-20 pointer-events-none">
          {columnCenters.map(({ col, x }) => (
            <div
              key={`sticky-col-${col}`}
              className="absolute top-0 -translate-x-1/2 font-mono text-xs font-black px-1.5 py-0.5 bg-[#FFFFFF] text-[#222D2C] border border-[#222D2C] shadow-sm leading-none"
              style={{
                left: `${Math.max(14, Math.min(window.innerWidth, x))}px`,
              }}
            >
              {col}
            </div>
          ))}
        </div>

        {/* ─── CLEAN PERSISTENT LEFT ROW BADGES (A-H) ──────────────── */}
        <div className="absolute top-0 left-2 bottom-0 w-6 z-20 pointer-events-none">
          {rowCenters.map(({ row, y }) => (
            <div
              key={`sticky-row-${row}`}
              className="absolute left-0 -translate-y-1/2 font-mono text-xs font-black px-1.5 py-0.5 bg-[#FFFFFF] text-[#222D2C] border border-[#222D2C] shadow-sm leading-none"
              style={{
                top: `${Math.max(14, y)}px`,
              }}
            >
              {row}
            </div>
          ))}
        </div>

        {/* ─── Projected Tactical Grid Lines (Internal Divisions) ──── */}
        {gridBox && (
          <div
            className="absolute pointer-events-none border-2 border-[#222D2C] z-15"
            style={{
              left: `${gridBox.x}px`,
              top: `${gridBox.y}px`,
              width: `${gridBox.width}px`,
              height: `${gridBox.height}px`,
            }}
          >
            {/* Column Dashed Lines */}
            {columnCenters.map(({ col, x }, idx) => {
              if (idx === 0) return null;
              const leftOffset = (idx / GRID_COLS.length) * gridBox.width;
              return (
                <div
                  key={`line-col-${col}`}
                  className="absolute top-0 bottom-0 border-l border-[#222D2C]/40"
                  style={{ left: `${leftOffset}px` }}
                />
              );
            })}

            {/* Row Dashed Lines */}
            {rowCenters.map(({ row, y }, idx) => {
              if (idx === 0) return null;
              const topOffset = (idx / GRID_ROWS.length) * gridBox.height;
              return (
                <div
                  key={`line-row-${row}`}
                  className="absolute left-0 right-0 border-t border-[#222D2C]/40"
                  style={{ top: `${topOffset}px` }}
                />
              );
            })}
          </div>
        )}

        {/* Real-Time Weather Overlay */}
        {showWeatherOverlay && (
          <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden z-16">
            <div className="w-full h-full bg-[radial-gradient(#3ABEAE_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
          </div>
        )}

        {/* Calibration Inspector HUD Bar */}
        {calibratedPoint && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-[#FFFFFF] border-2 border-[#222D2C] p-2 shadow-xl font-mono text-xs flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#DF4C40] rounded-full animate-ping inline-block" />
              <span className="font-bold text-[#222D2C]">PIN DROPPED:</span>
              <span className="bg-[#FAD13E] px-1 py-0.2 font-black">CELL [{calibratedPoint.cell}]</span>
              <span className="text-[#005EAC] font-bold">LAT: {calibratedPoint.lat}°N, LNG: {Math.abs(calibratedPoint.lng)}°W</span>
            </div>
            <button
              onClick={() => {
                const text = `lat: ${calibratedPoint.lat}, lng: ${calibratedPoint.lng} (Cell: ${calibratedPoint.cell})`;
                navigator.clipboard.writeText(text);
                setCopiedNotification(true);
                setTimeout(() => setCopiedNotification(false), 2000);
              }}
              className="bg-[#005EAC] hover:bg-[#004B8A] text-white px-2 py-0.5 font-bold uppercase cursor-pointer text-xs flex items-center gap-1"
            >
              {copiedNotification ? "✓ COPIED!" : "📋 COPY GPS"}
            </button>
            <button
              onClick={() => setCalibratedPoint(null)}
              className="text-[#5B6360] hover:text-[#222D2C] font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Right Controls: Zoom, Calibrate & Live Weather */}
        <div className="absolute top-2 right-2 z-25 flex flex-col items-end gap-1 font-mono text-xs">
          <div className="flex gap-1">
            <button
              onClick={() => setIsCalibrating(!isCalibrating)}
              className={cn(
                "px-2 h-6 border flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm gap-1 uppercase",
                isCalibrating ? "bg-[#DF4C40] text-white border-[#DF4C40]" : "bg-[#FFFFFF] text-[#222D2C] border-[#222D2C] hover:bg-[#EFECE6]"
              )}
              title="Click anywhere on the map to get exact GPS coordinates"
            >
              <span>🎯 CALIBRATE</span>
            </button>
            <button
              onClick={handleZoomIn}
              className="w-6 h-6 bg-[#FFFFFF] hover:bg-[#EFECE6] text-[#222D2C] border border-[#222D2C] flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm"
              title="Zoom In"
            >
              <Plus size={13} />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-6 h-6 bg-[#FFFFFF] hover:bg-[#EFECE6] text-[#222D2C] border border-[#222D2C] flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm"
              title="Zoom Out"
            >
              <Minus size={13} />
            </button>
            <button
              onClick={handleReset}
              className="w-6 h-6 bg-[#FFFFFF] hover:bg-[#EFECE6] text-[#222D2C] border border-[#222D2C] flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm"
              title="Reset View"
            >
              <RotateCcw size={11} />
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleZoomIn}
              className="w-6 h-6 bg-[#FFFFFF] hover:bg-[#EFECE6] text-[#222D2C] border border-[#222D2C] flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm"
              title="Zoom In"
            >
              <Plus size={13} />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-6 h-6 bg-[#FFFFFF] hover:bg-[#EFECE6] text-[#222D2C] border border-[#222D2C] flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm"
              title="Zoom Out (View Full Grid Height)"
            >
              <Minus size={13} />
            </button>
            <button
              onClick={handleReset}
              className="w-6 h-6 bg-[#FFFFFF] hover:bg-[#EFECE6] text-[#222D2C] border border-[#222D2C] flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm"
              title="Reset View to Entire Grid"
            >
              <RotateCcw size={11} />
            </button>
          </div>

          <div className="bg-[#FFFFFF]/95 border border-[#222D2C] p-1.5 shadow-md flex items-center gap-2 text-[#222D2C]">
            <CloudSun size={15} className="text-[#FF9600]" />
            <div>
              <div className="font-bold text-xs leading-none">MONTCLAIR: 74°F</div>
              <div className="text-xs text-[#5B6360] mt-0.5">HUMIDITY: 48% // 30.12 inHg</div>
            </div>
          </div>
        </div>

        {/* ─── DETAILED MODAL TOOLTIP / MINI WIKIPEDIA ENTRY CARD ──── */}
        {selectedFeature && (
          <div 
            className="absolute bottom-4 right-4 z-40 w-88 max-w-[calc(100vw-32px)] bg-[#FFFFFF] border-2 border-[#222D2C] p-3 shadow-2xl font-mono text-xs animate-in fade-in zoom-in duration-150 max-h-[85vh] overflow-y-auto"
            style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,0.35)" }}
          >
            {/* Header with Wikipedia Badge */}
            <div className="flex justify-between items-start border-b border-[#222D2C] pb-2 mb-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={cn("text-xs font-bold px-1.5 py-0.2 uppercase text-white", selectedFeature.badgeBg)}>
                    {selectedFeature.subCategory}
                  </span>
                  {selectedFeature.wikipediaUrl && (
                    <span className="text-xs font-bold bg-[#EFECE6] border border-[#222D2C] px-1 py-0.2 text-[#222D2C] flex items-center gap-1">
                      <span className="font-serif font-black">W</span> MINI WIKIPEDIA ENTRY
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-xs text-[#222D2C] leading-tight">{selectedFeature.name}</h3>
                {selectedFeature.scientificName && (
                  <div className="italic text-xs text-[#005EAC] font-serif font-bold mt-0.5">
                    {selectedFeature.scientificName}
                  </div>
                )}
                {wikiDescription && (
                  <div className="text-xs text-[#5B6360] font-sans mt-0.5 leading-tight">
                    {wikiDescription}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="w-5 h-5 bg-[#EFECE6] hover:bg-[#222D2C] hover:text-white border border-[#222D2C] flex items-center justify-center font-bold text-xs cursor-pointer shrink-0 ml-2"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Featured Photo / Wikimedia Commons Thumbnail */}
            {(wikiThumbnail || selectedFeature.imageUrl) && (
              <div className="w-full h-32 bg-[#EFECE6] border border-[#222D2C] mb-2 overflow-hidden relative">
                <img
                  src={wikiThumbnail || selectedFeature.imageUrl}
                  alt={selectedFeature.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1.5 py-0.5 font-mono">
                  WIKIMEDIA COMMONS
                </div>
              </div>
            )}

            {/* Mini Wikipedia Lead Summary / Extract */}
            <div className="p-2 bg-[#EFECE6] border border-[#222D2C] mb-2 font-sans text-xs leading-relaxed text-[#222D2C]">
              {isWikiLoading ? (
                <div className="flex items-center gap-1.5 text-[#5B6360] font-mono text-xs py-1">
                  <span className="w-2 h-2 bg-[#005EAC] rounded-full animate-ping" />
                  <span>Loading live Wikipedia summary...</span>
                </div>
              ) : wikiExtract ? (
                <p>{wikiExtract}</p>
              ) : (
                <p>{selectedFeature.details}</p>
              )}
            </div>

            {/* Botanical Foraging Traits */}
            {selectedFeature.season && (
              <div className="p-1.5 bg-[#FFFFFF] border border-[#222D2C] mb-2 flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-[#8F57CB]">HARVEST SEASON:</span>
                <span className="font-bold text-[#222D2C] bg-[#EFECE6] px-1.5 py-0.5">{selectedFeature.season}</span>
              </div>
            )}

            {/* Grid Coordinates & Geographic Placement */}
            <div className="text-xs text-[#5B6360] mb-2.5 flex justify-between items-center border-t border-[#222D2C]/15 pt-1.5 font-mono">
              <span className="bg-[#FAD13E] text-[#222D2C] px-1 py-0.2 font-bold">CELL [{selectedFeature.gridRef}]</span>
              <span>{selectedFeature.lat.toFixed(5)}°N, {Math.abs(selectedFeature.lng).toFixed(5)}°W</span>
            </div>

                        {/* Related CAZ OS Module Link */}
            {(() => {
              const related = getRelatedOsSection(selectedFeature);
              if (!related) return null;
              return (
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("taz-navigate-section", { detail: { sectionId: related.id } }));
                  }}
                  className="w-full mb-2 bg-[#222D2C] hover:bg-[#005EAC] text-white p-1.5 text-xs font-bold uppercase flex items-center justify-between gap-1 cursor-pointer transition-colors border border-[#222D2C]"
                >
                  <span className="flex items-center gap-1.5 text-[#FAD13E]">
                    <span>⚡ RELATED OS MODULE:</span>
                    <span className="text-white font-bold">{related.label}</span>
                  </span>
                  <span>Jump To →</span>
                </button>
              );
            })()}

            {/* Wikipedia Direct Link */}
            {selectedFeature.wikipediaUrl && (
              <a
                href={selectedFeature.wikipediaUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#005EAC] hover:bg-[#004B8A] text-white py-1.5 px-2 text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer no-underline border border-[#222D2C] transition-colors"
              >
                <span>Open Full Wikipedia Article</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function LayerRow({
  label,
  color,
  textColor = "text-white",
  count,
  active,
  onToggle,
  icon,
}: {
  label: string;
  color: string;
  textColor?: string;
  count: number;
  active: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
}) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "p-1 border flex items-center justify-between gap-1.5 cursor-pointer transition-colors",
        active ? "bg-[#FFFFFF] border-[#222D2C]" : "bg-[#DFDDD7] border-[#BCBCB8] opacity-60"
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <div className={cn("w-4 h-4 flex items-center justify-center shrink-0 text-white", color, textColor)}>
          {icon}
        </div>
        <span className="font-bold text-xs text-[#222D2C] truncate">{label}</span>
      </div>
      <span className="font-mono text-xs bg-[#EFECE6] border border-[#222D2C] px-1 py-0.2 shrink-0 font-bold">
        {count}
      </span>
    </div>
  );
}
