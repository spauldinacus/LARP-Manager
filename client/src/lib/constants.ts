export const HERITAGES = [
  {
    id: "ar-nura",
    name: "Ar-Nura",
    body: 2,
    stamina: 4,
    icon: "zap",
    description: "Masters of arcane energies"
  },
  {
    id: "human",
    name: "Human",
    body: 3,
    stamina: 3,
    icon: "user",
    description: "Adaptable and versatile"
  },
  {
    id: "stoneborn",
    name: "Stoneborn",
    body: 4,
    stamina: 2,
    icon: "mountain",
    description: "Hardy and resilient"
  },
  {
    id: "ughol",
    name: "Ughol",
    body: 4,
    stamina: 2,
    icon: "leaf",
    description: "Connected to nature"
  },
  {
    id: "rystarri",
    name: "Rystarri",
    body: 1,
    stamina: 5,
    icon: "moon",
    description: "Ethereal and mystical"
  }
] as const;

export const CULTURES = {
  "ar-nura": [
    { id: "araean", name: "Araean" },
    { id: "caldoran", name: "Caldoran" },
    { id: "drakmoran", name: "Drakmoran" }
  ],
  "human": [
    { id: "araean", name: "Araean" },
    { id: "caldoran", name: "Caldoran" },
    { id: "drakmoran", name: "Drakmoran" },
    { id: "northern", name: "Northern" }
  ],
  "stoneborn": [
    { id: "mountain-clan", name: "Mountain Clan" },
    { id: "forge-born", name: "Forge Born" },
    { id: "stone-guard", name: "Stone Guard" }
  ],
  "ughol": [
    { id: "forest-dweller", name: "Forest Dweller" },
    { id: "plains-walker", name: "Plains Walker" },
    { id: "river-folk", name: "River Folk" }
  ],
  "rystarri": [
    { id: "moon-touched", name: "Moon Touched" },
    { id: "star-born", name: "Star Born" },
    { id: "void-walker", name: "Void Walker" }
  ]
} as const;

export const ARCHETYPES = [
  { id: "warrior", name: "Warrior", description: "Master of combat and tactics" },
  { id: "arcanist", name: "Arcanist", description: "Wielder of magical forces" },
  { id: "healer", name: "Healer", description: "Protector and mender of life" },
  { id: "scout", name: "Scout", description: "Swift and stealthy explorer" },
  { id: "craftsman", name: "Craftsman", description: "Creator of wondrous items" },
  { id: "scholar", name: "Scholar", description: "Keeper of knowledge and lore" },
  { id: "diplomat", name: "Diplomat", description: "Master of words and influence" },
  { id: "merchant", name: "Merchant", description: "Trader and negotiator" },
  { id: "performer", name: "Performer", description: "Artist and entertainer" },
  { id: "guardian", name: "Guardian", description: "Protector of the innocent" },
  { id: "hunter", name: "Hunter", description: "Tracker and predator" },
  { id: "mystic", name: "Mystic", description: "Seeker of hidden truths" }
] as const;

export type Heritage = typeof HERITAGES[number]["id"];
export type Culture = keyof typeof CULTURES;
export type Archetype = typeof ARCHETYPES[number]["id"];
