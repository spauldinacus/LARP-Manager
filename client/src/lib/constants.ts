export const HERITAGES = [
  {
    id: "ar-nura",
    name: "Ar-Nura",
    body: 1,
    stamina: 3,
    icon: "zap",
    description: "Masters of arcane energies, born of magical bloodlines"
  },
  {
    id: "human",
    name: "Human",
    body: 2,
    stamina: 2,
    icon: "user",
    description: "Adaptable and versatile, the most common heritage"
  },
  {
    id: "stoneborn",
    name: "Stoneborn",
    body: 3,
    stamina: 1,
    icon: "mountain",
    description: "Hardy and resilient, carved from the mountain itself"
  },
  {
    id: "ughol",
    name: "Ughol",
    body: 2,
    stamina: 2,
    icon: "leaf",
    description: "Connected to nature, with bestial features"
  },
  {
    id: "rystarri",
    name: "Rystarri",
    body: 1,
    stamina: 3,
    icon: "moon",
    description: "Ethereal and mystical, touched by otherworldly forces"
  }
] as const;

export const CULTURES = {
  "ar-nura": [
    { id: "araean", name: "Araean" },
    { id: "caldoran", name: "Caldoran" },
    { id: "drakmoran", name: "Drakmoran" },
    { id: "freehold", name: "Freehold" },
    { id: "nomad", name: "Nomad" }
  ],
  "human": [
    { id: "araean", name: "Araean" },
    { id: "caldoran", name: "Caldoran" },
    { id: "drakmoran", name: "Drakmoran" },
    { id: "freehold", name: "Freehold" },
    { id: "nomad", name: "Nomad" }
  ],
  "stoneborn": [
    { id: "araean", name: "Araean" },
    { id: "caldoran", name: "Caldoran" },
    { id: "drakmoran", name: "Drakmoran" },
    { id: "freehold", name: "Freehold" },
    { id: "nomad", name: "Nomad" }
  ],
  "ughol": [
    { id: "araean", name: "Araean" },
    { id: "caldoran", name: "Caldoran" },
    { id: "drakmoran", name: "Drakmoran" },
    { id: "freehold", name: "Freehold" },
    { id: "nomad", name: "Nomad" }
  ],
  "rystarri": [
    { id: "araean", name: "Araean" },
    { id: "caldoran", name: "Caldoran" },
    { id: "drakmoran", name: "Drakmoran" },
    { id: "freehold", name: "Freehold" },
    { id: "nomad", name: "Nomad" }
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
