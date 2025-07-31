export const HERITAGES = [
  {
    id: "ar-nura",
    name: "Ar-Nura",
    body: 1,
    stamina: 3,
    icon: "zap",
    description: "Masters of arcane energies, born of magical bloodlines",
    primarySkills: ["Arcane Lore", "Mysticism"],
    secondarySkills: ["Alchemy", "Ancient Languages", "Ritual Magic"]
  },
  {
    id: "human",
    name: "Human",
    body: 2,
    stamina: 2,
    icon: "user",
    description: "Adaptable and versatile, the most common heritage",
    primarySkills: ["Any Two Skills"],
    secondarySkills: ["Any Three Skills"]
  },
  {
    id: "stoneborn",
    name: "Stoneborn",
    body: 3,
    stamina: 1,
    icon: "mountain",
    description: "Hardy and resilient, carved from the mountain itself",
    primarySkills: ["Smithing", "Stoneworking"],
    secondarySkills: ["Engineering", "Mining", "Armorcrafting"]
  },
  {
    id: "ughol",
    name: "Ughol",
    body: 2,
    stamina: 2,
    icon: "leaf",
    description: "Connected to nature, with bestial features",
    primarySkills: ["Tracking", "Survival"],
    secondarySkills: ["Animal Handling", "Herbalism", "Weather Sense"]
  },
  {
    id: "rystarri",
    name: "Rystarri",
    body: 1,
    stamina: 3,
    icon: "moon",
    description: "Ethereal and mystical, touched by otherworldly forces",
    primarySkills: ["Spirit Lore", "Astrology"],
    secondarySkills: ["Divination", "Dream Walking", "Ethereal Sight"]
  }
] as const;

export const CULTURES = {
  "ar-nura": [
    { 
      id: "araean", 
      name: "Araean",
      primarySkills: ["Politics", "Trade"],
      secondarySkills: ["Etiquette", "Law", "Economics"]
    },
    { 
      id: "caldoran", 
      name: "Caldoran",
      primarySkills: ["Military Tactics", "Leadership"],
      secondarySkills: ["Strategy", "Intimidation", "Command"]
    },
    { 
      id: "drakmoran", 
      name: "Drakmoran",
      primarySkills: ["Stealth", "Information"],
      secondarySkills: ["Espionage", "Lockpicking", "Disguise"]
    },
    { 
      id: "freehold", 
      name: "Freehold",
      primarySkills: ["Crafting", "Innovation"],
      secondarySkills: ["Engineering", "Invention", "Repair"]
    },
    { 
      id: "nomad", 
      name: "Nomad",
      primarySkills: ["Survival", "Navigation"],
      secondarySkills: ["Animal Handling", "Weather Sense", "Cartography"]
    }
  ],
  "human": [
    { 
      id: "araean", 
      name: "Araean",
      primarySkills: ["Politics", "Trade"],
      secondarySkills: ["Etiquette", "Law", "Economics"]
    },
    { 
      id: "caldoran", 
      name: "Caldoran",
      primarySkills: ["Military Tactics", "Leadership"],
      secondarySkills: ["Strategy", "Intimidation", "Command"]
    },
    { 
      id: "drakmoran", 
      name: "Drakmoran",
      primarySkills: ["Stealth", "Information"],
      secondarySkills: ["Espionage", "Lockpicking", "Disguise"]
    },
    { 
      id: "freehold", 
      name: "Freehold",
      primarySkills: ["Crafting", "Innovation"],
      secondarySkills: ["Engineering", "Invention", "Repair"]
    },
    { 
      id: "nomad", 
      name: "Nomad",
      primarySkills: ["Survival", "Navigation"],
      secondarySkills: ["Animal Handling", "Weather Sense", "Cartography"]
    }
  ],
  "stoneborn": [
    { 
      id: "araean", 
      name: "Araean",
      primarySkills: ["Politics", "Trade"],
      secondarySkills: ["Etiquette", "Law", "Economics"]
    },
    { 
      id: "caldoran", 
      name: "Caldoran",
      primarySkills: ["Military Tactics", "Leadership"],
      secondarySkills: ["Strategy", "Intimidation", "Command"]
    },
    { 
      id: "drakmoran", 
      name: "Drakmoran",
      primarySkills: ["Stealth", "Information"],
      secondarySkills: ["Espionage", "Lockpicking", "Disguise"]
    },
    { 
      id: "freehold", 
      name: "Freehold",
      primarySkills: ["Crafting", "Innovation"],
      secondarySkills: ["Engineering", "Invention", "Repair"]
    },
    { 
      id: "nomad", 
      name: "Nomad",
      primarySkills: ["Survival", "Navigation"],
      secondarySkills: ["Animal Handling", "Weather Sense", "Cartography"]
    }
  ],
  "ughol": [
    { 
      id: "araean", 
      name: "Araean",
      primarySkills: ["Politics", "Trade"],
      secondarySkills: ["Etiquette", "Law", "Economics"]
    },
    { 
      id: "caldoran", 
      name: "Caldoran",
      primarySkills: ["Military Tactics", "Leadership"],
      secondarySkills: ["Strategy", "Intimidation", "Command"]
    },
    { 
      id: "drakmoran", 
      name: "Drakmoran",
      primarySkills: ["Stealth", "Information"],
      secondarySkills: ["Espionage", "Lockpicking", "Disguise"]
    },
    { 
      id: "freehold", 
      name: "Freehold",
      primarySkills: ["Crafting", "Innovation"],
      secondarySkills: ["Engineering", "Invention", "Repair"]
    },
    { 
      id: "nomad", 
      name: "Nomad",
      primarySkills: ["Survival", "Navigation"],
      secondarySkills: ["Animal Handling", "Weather Sense", "Cartography"]
    }
  ],
  "rystarri": [
    { 
      id: "araean", 
      name: "Araean",
      primarySkills: ["Politics", "Trade"],
      secondarySkills: ["Etiquette", "Law", "Economics"]
    },
    { 
      id: "caldoran", 
      name: "Caldoran",
      primarySkills: ["Military Tactics", "Leadership"],
      secondarySkills: ["Strategy", "Intimidation", "Command"]
    },
    { 
      id: "drakmoran", 
      name: "Drakmoran",
      primarySkills: ["Stealth", "Information"],
      secondarySkills: ["Espionage", "Lockpicking", "Disguise"]
    },
    { 
      id: "freehold", 
      name: "Freehold",
      primarySkills: ["Crafting", "Innovation"],
      secondarySkills: ["Engineering", "Invention", "Repair"]
    },
    { 
      id: "nomad", 
      name: "Nomad",
      primarySkills: ["Survival", "Navigation"],
      secondarySkills: ["Animal Handling", "Weather Sense", "Cartography"]
    }
  ]
} as const;

export const ARCHETYPES = [
  { 
    id: "warrior", 
    name: "Warrior", 
    description: "Master of combat and tactics",
    primarySkills: ["Melee Combat", "Shield Use"],
    secondarySkills: ["Tactics", "Weapon Maintenance", "Intimidation"]
  },
  { 
    id: "arcanist", 
    name: "Arcanist", 
    description: "Wielder of magical forces",
    primarySkills: ["Arcane Magic", "Spell Lore"],
    secondarySkills: ["Alchemy", "Enchantment", "Magical Theory"]
  },
  { 
    id: "healer", 
    name: "Healer", 
    description: "Protector and mender of life",
    primarySkills: ["Healing Arts", "Herbalism"],
    secondarySkills: ["Anatomy", "Disease Treatment", "Surgery"]
  },
  { 
    id: "scout", 
    name: "Scout", 
    description: "Swift and stealthy explorer",
    primarySkills: ["Stealth", "Ranged Combat"],
    secondarySkills: ["Tracking", "Climbing", "Camouflage"]
  },
  { 
    id: "craftsman", 
    name: "Craftsman", 
    description: "Creator of wondrous items",
    primarySkills: ["Smithing", "Crafting"],
    secondarySkills: ["Engineering", "Appraisal", "Trade"]
  },
  { 
    id: "scholar", 
    name: "Scholar", 
    description: "Keeper of knowledge and lore",
    primarySkills: ["Research", "Ancient Languages"],
    secondarySkills: ["History", "Literature", "Cartography"]
  },
  { 
    id: "diplomat", 
    name: "Diplomat", 
    description: "Master of words and influence",
    primarySkills: ["Persuasion", "Etiquette"],
    secondarySkills: ["Politics", "Law", "Negotiation"]
  },
  { 
    id: "merchant", 
    name: "Merchant", 
    description: "Trader and negotiator",
    primarySkills: ["Trade", "Appraisal"],
    secondarySkills: ["Economics", "Negotiation", "Travel"]
  },
  { 
    id: "performer", 
    name: "Performer", 
    description: "Artist and entertainer",
    primarySkills: ["Performance", "Music"],
    secondarySkills: ["Storytelling", "Dance", "Acrobatics"]
  },
  { 
    id: "guardian", 
    name: "Guardian", 
    description: "Protector of the innocent",
    primarySkills: ["Protection", "Shield Use"],
    secondarySkills: ["First Aid", "Vigilance", "Courage"]
  },
  { 
    id: "hunter", 
    name: "Hunter", 
    description: "Tracker and predator",
    primarySkills: ["Tracking", "Survival"],
    secondarySkills: ["Animal Lore", "Trapping", "Butchery"]
  },
  { 
    id: "mystic", 
    name: "Mystic", 
    description: "Seeker of hidden truths",
    primarySkills: ["Mysticism", "Meditation"],
    secondarySkills: ["Spirit Lore", "Divination", "Philosophy"]
  }
] as const;

export type Heritage = typeof HERITAGES[number]["id"];
export type Culture = keyof typeof CULTURES;
export type Archetype = typeof ARCHETYPES[number]["id"];
