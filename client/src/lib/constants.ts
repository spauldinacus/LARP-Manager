export const HERITAGES = [
  {
    id: "ar-nura",
    name: "Ar-Nura",
    body: 8,
    stamina: 12,
    icon: "zap",
    description: "The eldest heritage, claiming to be firstborn with vast empires and ancient libraries",
    costumeRequirements: "Pointed ears",
    benefit: "Corruption Resistance - Spend 10 Stamina to negate a point of Corruption (except when returning from death)",
    weakness: "Arcane Susceptibility - Take double damage from Magic attacks",
    secondarySkills: ["First Aid", "Bard", "Herbalism", "Meditation"]
  },
  {
    id: "human",
    name: "Human",
    body: 10,
    stamina: 10,
    icon: "user",
    description: "The most populous and widespread people throughout the realm",
    costumeRequirements: "None",
    benefit: "Human - No inherent benefit or weakness",
    weakness: "Human - No inherent benefit or weakness",
    secondarySkills: ["First Aid", "Farming", "Lumberjack", "Mining"]
  },
  {
    id: "stoneborn",
    name: "Stoneborn",
    body: 15,
    stamina: 5,
    icon: "mountain",
    description: "Sturdy and stoic people from beneath the mountains, known for craftsmanship",
    costumeRequirements: "A full beard minimum 6 inches long (all genders)",
    benefit: "One More Hammer - Reduce crafting time by 5 minutes for Alchemy, Smithing, Cooking, and Trapper skills",
    weakness: "Arcane Disruption - Spend double Stamina to cast spells",
    secondarySkills: ["Blacksmithing", "Cooking", "Lumberjack", "Mining"]
  },
  {
    id: "ughol",
    name: "Ughol",
    body: 12,
    stamina: 8,
    icon: "leaf",
    description: "Commonly called greenskins, they band together in motley crews for protection",
    costumeRequirements: "Green or grey skin",
    benefit: "Regeneration - Regain 1 Body per minute (as long as not in Bleed Out)",
    weakness: "Weak to Corruption - Take 2 points of Corruption instead of 1",
    secondarySkills: ["Quick Search", "Scavenging", "Taunt", "Trapper"]
  },
  {
    id: "rystarri",
    name: "Rystarri",
    body: 12,
    stamina: 8,
    icon: "moon",
    description: "A nomadic feline people known as Bringers of the Lost",
    costumeRequirements: "Cat ears or feline mask, with a tail attached to exterior of clothing",
    benefit: "Claws - Always equipped with unarmed claws that inflict 2 base damage",
    weakness: "Call of the Far Realms - Bleeding Out period is only 1 minute long",
    secondarySkills: ["Herbalism", "Intercept", "Mercantile", "Scavenging"]
  }
] as const;

export const CULTURES = {
  "ar-nura": [
    { 
      id: "eisolae", 
      name: "Eisolae",
      primarySkills: ["Meditation", "Lore (Magic)"],
      secondarySkills: ["Scribe", "First Aid"]
    },
    { 
      id: "jhaniada", 
      name: "Jhani'ada",
      primarySkills: ["Weapon Focus (Medium)", "Armor Training (Light)"],
      secondarySkills: ["Courage", "Parry"]
    },
    { 
      id: "viskela", 
      name: "Viskela",
      primarySkills: ["Bard", "Socialite"],
      secondarySkills: ["Wealth", "Mercantile"]
    }
  ],
  "human": [
    { 
      id: "erdanian", 
      name: "Erdanian",
      primarySkills: ["Weapon Focus (Medium)", "Armor Training (Light)"],
      secondarySkills: ["Courage", "Shield"]
    },
    { 
      id: "khemasuri", 
      name: "Khemasuri",
      primarySkills: ["Socialite", "Wealth"],
      secondarySkills: ["Bard", "Mercantile"]
    },
    { 
      id: "saronean", 
      name: "Saronean",
      primarySkills: ["Weapon Focus (Bow)", "Herbalism"],
      secondarySkills: ["Hunting", "Alertness"]
    },
    { 
      id: "vyaldur", 
      name: "Vyaldur",
      primarySkills: ["Trapper", "Scavenging"],
      secondarySkills: ["Lockpicking", "Quick Search"]
    }
  ],
  "stoneborn": [
    { 
      id: "dargadian", 
      name: "Dargadian",
      primarySkills: ["Weapon Focus (Medium)", "Armor Training (Medium)"],
      secondarySkills: ["Blacksmithing", "Toughness"]
    },
    { 
      id: "akhunrasi", 
      name: "Akhunrasi",
      primarySkills: ["Blacksmithing", "Mining"],
      secondarySkills: ["Armor Smithing", "Weapon Smithing"]
    },
    { 
      id: "kahrnuthaen", 
      name: "Kahrnuthaen",
      primarySkills: ["Lore (Engineering)", "Scavenging"],
      secondarySkills: ["Fortify Armor", "Alchemy"]
    }
  ],
  "ughol": [
    { 
      id: "gragrimn", 
      name: "Gragrimn",
      primarySkills: ["Weapon Focus (Medium)", "Intimidation"],
      secondarySkills: ["Brutal Blow", "Knockback"]
    },
    { 
      id: "skraata", 
      name: "Skraata",
      primarySkills: ["Hide", "Stealth"],
      secondarySkills: ["Backstab", "Weapon Focus (Small)"]
    },
    { 
      id: "voruk", 
      name: "Voruk",
      primarySkills: ["Hunting", "Herbalism"],
      secondarySkills: ["Weapon Focus (Bow)", "Lore (Nature)"]
    }
  ],
  "rystarri": [
    { 
      id: "maolawki", 
      name: "Maolawki",
      primarySkills: ["Meditation", "Dodge"],
      secondarySkills: ["Weapon Focus (Unarmed)", "Iron Will"]
    },
    { 
      id: "yarowi", 
      name: "Yarowi",
      primarySkills: ["Trader", "Mercantile"],
      secondarySkills: ["Socialite", "Wealth"]
    }
  ]
} as const;

export const ARCHETYPES = [
  { 
    id: "advisor", 
    name: "Advisor", 
    description: "I give council to those in need",
    primarySkills: ["Bard", "Courage", "First Aid", "Lore (Any)", "Mercantile", "Scribe", "Socialite", "Wealth", "Weapon Focus (Staff)", "Withdraw"],
    secondarySkills: ["Intimidation", "Meditation", "Plead for Mercy"]
  },
  { 
    id: "alchemist", 
    name: "Alchemist", 
    description: "All things may be transformed",
    primarySkills: ["Alchemy", "Lore (Magic)", "Meditation", "Magic Path (Apprentice): Path of Flesh", "Magic Path (Journeyman): Path of Flesh", "Magic Path (Apprentice): Path of Thorns", "Magic Path (Journeyman): Path of Thorns", "Stored Spell", "Weapon Proficiency (Staff)", "Herbalism"],
    secondarySkills: ["Magic Path (Master): Path of Flesh", "Magic Path (Master): Path of Thorns", "First Aid"]
  },
  { 
    id: "archer", 
    name: "Archer", 
    description: "Aim straight and true",
    primarySkills: ["Alertness", "Dexterity Armor", "Hide", "Hunting", "Marksmanship", "Rapidfire", "Weapon Focus (Bow)", "Weapon Proficiency (Bow)", "Weapon Focus (Medium)", "Weapon Proficiency (Medium)"],
    secondarySkills: ["Dodge", "Stealth", "Trapper"]
  },
  { 
    id: "berserker", 
    name: "Berserker", 
    description: "Rage... building... unleashing!",
    primarySkills: ["Armor Training (Light)", "Brutal Blow", "Courage", "Intimidation", "Knockback", "Taunt", "Toughness", "Weapon Focus (Any)", "Weapon Proficiency (Large, Medium)", "Withdraw"],
    secondarySkills: ["Armor Training (Medium)", "Iron Will", "Weapon Focus (Unarmed)"]
  },
  { 
    id: "bodyguard", 
    name: "Bodyguard", 
    description: "I don't have time to bleed",
    primarySkills: ["Alertness", "Armor Training (Light)", "Courage", "First Aid", "Intercept", "Parry", "Shield", "Toughness", "Weapon Focus (Medium)", "Weapon Proficiency (Medium)"],
    secondarySkills: ["Armor Training (Medium)", "Dodge", "Intimidation"]
  },
  { 
    id: "chef", 
    name: "Chef", 
    description: "Toiling away in front of a hot stove",
    primarySkills: ["Alchemy", "Alertness", "Cooking", "Courage", "Disarm", "First Aid", "Hamstring", "Intimidation", "Mercantile", "Wealth"],
    secondarySkills: ["Herbalism", "Trader", "Weapon Focus (Small)"]
  },
  { 
    id: "courtesan", 
    name: "Courtesan", 
    description: "Serving others is a delight",
    primarySkills: ["Bard", "Cooking", "First Aid", "Healing", "Meditation", "Plead for Mercy", "Scribe", "Socialite", "Wealth", "Withdraw"],
    secondarySkills: ["Dodge", "Herbalism", "Mercantile"]
  },
  { 
    id: "ecomancer", 
    name: "Ecomancer", 
    description: "Nature is red in tooth and claw",
    primarySkills: ["Alchemy", "First Aid", "Healing", "Herbalism", "Hide", "Lore (Nature)", "Magic Path (Apprentice): Path of Flesh", "Magic Path (Journeyman): Path of Flesh", "Magic Path (Apprentice): Path of Thorns", "Magic Path (Journeyman): Path of Thorns", "Meditation", "Weapon Proficiency (Staff or Bow)"],
    secondarySkills: ["Stored Spell", "Magic Path (Master): Path of Flesh", "Magic Path (Master): Path of Thorns"]
  },
  { 
    id: "elementalist", 
    name: "Elementalist", 
    description: "Fire and ice shall bend to my will",
    primarySkills: ["Armor Training (Light)", "Magic Path (Apprentice): Path of the Chill Wind", "Magic Path (Journeyman): Path of the Chill Wind", "Magic Path (Apprentice): Path of the Eternal Flame", "Magic Path (Journeyman): Path of the Eternal Flame", "Meditation", "Socialite", "Stored Spell", "Toughness", "Weapon Proficiency (Staff)"],
    secondarySkills: ["Counterspell", "Magic Path (Master): Path of the Chill Wind", "Magic Path (Master): Path of the Eternal Flame"]
  },
  { 
    id: "entertainer", 
    name: "Entertainer", 
    description: "Perhaps you would like to hear a song?",
    primarySkills: ["Bard", "Cheat", "Dexterity Armor", "Disarm", "Dodge", "Hide", "Play Dead", "Plead for Mercy", "Socialite", "Taunt"],
    secondarySkills: ["Backstab", "Weapon Focus (Small)", "Wealth"]
  },
  { 
    id: "erudite", 
    name: "Erudite", 
    description: "Speak not wisdom to those incapable of understanding",
    primarySkills: ["Counterspell", "Lore (Magic)", "Magic Path (Apprentice): Path of Arcane Mind", "Magic Path (Journeyman): Path of Arcane Mind", "Magic Path (Apprentice): Path of Chill Wind", "Magic Path (Journeyman): Path of Chill Wind", "Magic Path (Apprentice): Path of Eternal Flame", "Magic Path (Journeyman): Path of Eternal Flame", "Stored Spell", "Wealth", "Weapon Proficiency (Staff)"],
    secondarySkills: ["Magic Path (Master): Path of Arcane Mind", "Magic Path (Master): Path of Chill Wind", "Magic Path (Master): Path of Eternal Flame"]
  },
  { 
    id: "farmer", 
    name: "Farmer", 
    description: "It's honest work",
    primarySkills: ["Bard", "Dodge", "Farming", "First Aid", "Herbalism", "Hunting", "Intimidation", "Knockback", "Plead for Mercy", "Weapon Proficiency (Polearm)"],
    secondarySkills: ["Trader", "Trapper", "Weapon Focus (Polearm or Unarmed)"]
  },
  { 
    id: "forester", 
    name: "Forester", 
    description: "The woods are lovely, dark and deep...",
    primarySkills: ["Courage", "First Aid", "Herbalism", "Hunting", "Intimidation", "Lore (Nature)", "Lumberjack", "Rapidfire", "Weapon Proficiency (Bow, Crossbow, or Medium)", "Weapon Focus (Bow, Crossbow, or Medium)"],
    secondarySkills: ["Hide", "Stealth", "Trapper"]
  },
  { 
    id: "forgewright", 
    name: "Forgewright", 
    description: "My hammer sings on steel, and crushes bone",
    primarySkills: ["Armor Smithing", "Armor Training (Medium)", "Blacksmithing", "Fortify Armor", "Mercantile", "Mining", "Scavenging", "Wealth", "Weapon Proficiency (Medium)", "Weapon Smithing"],
    secondarySkills: ["Toughness", "Weapon Focus (Small or Medium)", "Shield"]
  },
  { 
    id: "gunslinger", 
    name: "Gunslinger", 
    description: "Masters of firearms, dealing in lead",
    primarySkills: ["Alertness", "Ambidexterity", "Armor Training (Light)", "Dexterity Armor", "Hunting", "Marksmanship", "Rapidfire", "Weapon Focus (Medium, Crossbow, or Firearm)", "Weapon Proficiency (Medium, Crossbow, or Firearm)", "Withdraw"],
    secondarySkills: ["Armor Training (Medium)", "Courage", "Iron Will"]
  },
  { 
    id: "juggernaut", 
    name: "Juggernaut", 
    description: "Trust your steel",
    primarySkills: ["Armor Training (Medium)", "Armor Training (Heavy)", "Brutal Blow", "Courage", "Fortify Armor", "Knockback", "Shield", "Toughness", "Weapon Proficiency (Medium, Large, or Polearm)", "Weapon Focus (Medium, Large, or Polearm)"],
    secondarySkills: ["Intimidation", "Iron Will", "Shield Master"]
  },
  { 
    id: "merchant", 
    name: "Merchant", 
    description: "Everything and everyone has their price",
    primarySkills: ["Courage", "Intimidation", "Knockback", "Mercantile", "Plead for Mercy", "Trader", "Wealth", "Weapon Proficiency (Staff)", "Weapon Focus (Small)", "Withdraw"],
    secondarySkills: ["Scavenging", "Trapper", "Weapon Focus (Staff)"]
  },
  { 
    id: "mystic", 
    name: "Mystic", 
    description: "Master that which lies within",
    primarySkills: ["Alertness", "Dexterity Armor", "Iron Will", "Lore (Magic, Nature)", "Magic Path (Apprentice): Path of Arcane Mind", "Magic Path (Journeyman): Path of Arcane Mind", "Magic Path (Apprentice): Path of Flesh", "Magic Path (Journeyman): Path of Flesh", "Meditation", "Scribe", "Stored Spell", "Weapon Focus (Unarmed)"],
    secondarySkills: ["Courage", "Magic Path (Master): Path of Arcane Mind", "Magic Path (Master): Path of Flesh"]
  },
  { 
    id: "physician", 
    name: "Physician", 
    description: "Save lives and tend to the wellbeing of others",
    primarySkills: ["Alertness", "Blinding", "Chirurgeon", "Courage", "First Aid", "Hamstring", "Healing", "Herbalism", "Lore (Nature)", "Weapon Focus (Small)"],
    secondarySkills: ["Mercantile", "Trader", "Wealth"]
  },
  { 
    id: "rogue", 
    name: "Rogue", 
    description: "It's only wrong if you get caught",
    primarySkills: ["Ambidexterity", "Armor Training (Light)", "Backstab", "Dexterity Armor", "Hide", "Lockpicking", "Parry", "Stealth", "Weapon Proficiency (Firearms, Medium, or Thrown)", "Weapon Focus (Small, Medium, or Thrown)"],
    secondarySkills: ["Quick Search", "Knockout Strike", "Herbalism"]
  },
  { 
    id: "scholar", 
    name: "Scholar", 
    description: "Knowledge is power",
    primarySkills: ["Alertness", "Cheat", "First Aid", "Herbalism", "Hide", "Lore (Any)", "Meditation", "Scribe"],
    secondarySkills: ["Play Dead", "Wealth", "Withdraw"]
  },
  { 
    id: "scoundrel", 
    name: "Scoundrel", 
    description: "All is fair in love and war... and cards",
    primarySkills: ["Alertness", "Armor Training (Light)", "Backstab", "Cheat", "Hide", "Lockpicking", "Quick Search", "Stealth", "Weapon Proficiency (Medium or Thrown)", "Weapon Focus (Small, Medium, or Thrown)"],
    secondarySkills: ["Dexterity Armor", "Scavenging", "Withdraw"]
  },
  { 
    id: "shadowcaster", 
    name: "Shadowcaster", 
    description: "In shadows are the lost treasures of hidden knowledge",
    primarySkills: ["Courage", "Hide", "Knockout Strike", "Lore (Magic)", "Magic Path (Apprentice): Path of Shadows", "Magic Path (Journeyman): Path of Shadows", "Meditation", "Stealth", "Weapon Focus (Small)", "Withdraw"],
    secondarySkills: ["Counterspell", "Stored Spell", "Magic Path (Master): Path of Shadows"]
  },
  { 
    id: "skirmisher", 
    name: "Skirmisher", 
    description: "Keep your wits as sharp as your steel",
    primarySkills: ["Ambidexterity", "Armor Training (Light)", "Dexterity Armor", "Disarm", "Dodge", "Intercept", "Parry", "Piercing Strike", "Riposte", "Weapon Proficiency (Medium, Staff, or Polearm)", "Weapon Focus (Small, Medium, or Polearm)"],
    secondarySkills: ["Alertness", "Courage", "Taunt"]
  },
  { 
    id: "slayer", 
    name: "Slayer", 
    description: "Through the thick of battle",
    primarySkills: ["Alertness", "Armor Training (Light)", "Brutal Blow", "Courage", "Hide", "Iron Will", "Lore (Monster)", "Parry", "Weapon Focus (Medium, Large, Polearm, or Thrown)", "Weapon Proficiency (Medium, Large, Polearm, or Thrown)"],
    secondarySkills: ["Alchemy", "Hunting", "Stealth"]
  },
  { 
    id: "soldier", 
    name: "Soldier", 
    description: "One of the more common warrior types",
    primarySkills: ["Armor Training (Light)", "Armor Training (Medium)", "Brutal Blow", "Courage", "Disarm", "Parry", "Shield", "Weapon Focus (Any)", "Weapon Proficiency (Any)", "Toughness"],
    secondarySkills: ["Armor Training (Heavy)", "Dexterity Armor", "Scavenging"]
  },
  { 
    id: "spellblade", 
    name: "Spellblade", 
    description: "By steel and sorcery I slay my foes",
    primarySkills: ["Ambidexterity", "Armor Training (Light)", "Dexterity Armor", "Disarm", "Magic Path (Apprentice): Path of the Chill Wind", "Magic Path (Apprentice): Path of the Eternal Flame", "Parry", "Weapon Proficiency (Medium, or Polearm)", "Weapon Focus (Small, Medium, or Polearm)"],
    secondarySkills: ["Magic Path (Journeyman): Path of the Chill Wind", "Magic Path (Journeyman): Path of the Eternal Flame", "Intercept"]
  },
  { 
    id: "sorcerer", 
    name: "Sorcerer", 
    description: "The eldritch power of the arcane flows through my blood",
    primarySkills: ["Counterspell", "Magic Path (Apprentice): Path of Arcane Mind", "Magic Path (Journeyman): Path of Arcane Mind", "Magic Path (Apprentice): Path of Eternal Flame", "Magic Path (Journeyman): Path of Eternal Flame", "Magic Path (Apprentice): Path of Flesh", "Magic Path (Journeyman): Path of Flesh", "Meditation", "Scribe", "Stored Spell"],
    secondarySkills: ["Magic Path (Apprentice): Path of Shadows", "Magic Path (Apprentice): Path of Thorns", "Weapon Proficiency (Staff)"]
  },
  { 
    id: "thaumaturgist", 
    name: "Thaumaturgist", 
    description: "Through the arcane, I unlock powers unknown to other mortals",
    primarySkills: ["Alchemy", "Lore (Magic)", "Magic Path (Apprentice): Path of Arcane Mind", "Magic Path (Journeyman): Path of Arcane Mind", "Magic Path (Apprentice): Path of Chill Wind", "Magic Path (Journeyman): Path of Chill Wind", "Magic Path (Apprentice): Path of Shadows", "Magic Path (Journeyman): Path of Shadows", "Scribe", "Weapon Proficiency (Firearms, Staff)"],
    secondarySkills: ["Magic Path (Master): Path of Arcane Mind", "Magic Path (Master): Path of Chill Wind", "Magic Path (Master): Path of Shadows"]
  },
  { 
    id: "tinker", 
    name: "Tinker", 
    description: "Always seeking to make something new",
    primarySkills: ["Alchemy", "Alertness", "Blacksmithing", "First Aid", "Fortify Armor", "Lockpicking", "Lore (Engineering)", "Scavenging", "Trader", "Trapper"],
    secondarySkills: ["Armor Smithing", "Weapon Smithing", "Weapon Proficiency (Firearms)"]
  },
  { 
    id: "warden", 
    name: "Warden", 
    description: "The world is a dangerous place...",
    primarySkills: ["Alertness", "Armor Training (Light)", "Courage", "Dexterity Armor", "First Aid", "Herbalism", "Intercept", "Parry", "Weapon Proficiency (Medium, Staff, or Firearms)", "Weapon Focus (Medium, Staff, or Firearms)"],
    secondarySkills: ["Magic Path (Apprentice): Path of Thorns", "Magic Path (Journeyman): Path of Thorns", "Mercantile"]
  },
  { 
    id: "wizard", 
    name: "Wizard", 
    description: "Wielders of the arcane arts",
    primarySkills: ["Counterspell", "Lore (Magic)", "Magic Path (Apprentice): Path of Arcane Mind", "Magic Path (Journeyman): Path of Arcane Mind", "Magic Path (Apprentice): Path of Eternal Flame", "Magic Path (Journeyman): Path of Eternal Flame", "Magic Path (Apprentice): Path of Thorns", "Magic Path (Journeyman): Path of Thorns", "Scribe", "Stored Spell"],
    secondarySkills: ["Magic Path (Master): Path of Arcane Mind", "Magic Path (Master): Eternal Flame", "Magic Path (Master): Path of Thorns"]
  }
] as const;

// Comprehensive skills list extracted from all archetypes
export const SKILLS = [
  "Alchemy", "Alertness", "Ambidexterity", "Armor Smithing", "Armor Training (Light)", 
  "Armor Training (Medium)", "Armor Training (Heavy)", "Backstab", "Bard", "Blacksmithing",
  "Blinding", "Brutal Blow", "Cheat", "Chirurgeon", "Cooking", "Counterspell", "Courage",
  "Dexterity Armor", "Disarm", "Dodge", "Farming", "First Aid", "Fortify Armor", "Hamstring",
  "Healing", "Herbalism", "Hide", "Hunting", "Intercept", "Intimidation", "Iron Will",
  "Knockback", "Knockout Strike", "Lockpicking", "Lore (Any)", "Lore (Engineering)", 
  "Lore (Magic)", "Lore (Monster)", "Lore (Nature)", "Lumberjack", "Magic Path (Apprentice): Path of Arcane Mind",
  "Magic Path (Journeyman): Path of Arcane Mind", "Magic Path (Master): Path of Arcane Mind",
  "Magic Path (Apprentice): Path of Flesh", "Magic Path (Journeyman): Path of Flesh", 
  "Magic Path (Master): Path of Flesh", "Magic Path (Apprentice): Path of Thorns",
  "Magic Path (Journeyman): Path of Thorns", "Magic Path (Master): Path of Thorns",
  "Magic Path (Apprentice): Path of the Chill Wind", "Magic Path (Journeyman): Path of the Chill Wind",
  "Magic Path (Master): Path of the Chill Wind", "Magic Path (Apprentice): Path of the Eternal Flame",
  "Magic Path (Journeyman): Path of the Eternal Flame", "Magic Path (Master): Path of the Eternal Flame",
  "Magic Path (Apprentice): Path of Shadows", "Magic Path (Journeyman): Path of Shadows",
  "Magic Path (Master): Path of Shadows", "Marksmanship", "Meditation", "Mercantile", "Mining",
  "Parry", "Piercing Strike", "Play Dead", "Plead for Mercy", "Quick Search", "Rapidfire",
  "Riposte", "Scavenging", "Scribe", "Shield", "Shield Master", "Socialite", "Stealth",
  "Stored Spell", "Taunt", "Toughness", "Trader", "Trapper", "Weapon Focus (Any)",
  "Weapon Focus (Small)", "Weapon Focus (Medium)", "Weapon Focus (Large)", "Weapon Focus (Bow)",
  "Weapon Focus (Crossbow)", "Weapon Focus (Firearms)", "Weapon Focus (Polearm)", 
  "Weapon Focus (Staff)", "Weapon Focus (Thrown)", "Weapon Focus (Unarmed)",
  "Weapon Proficiency (Small)", "Weapon Proficiency (Medium)", "Weapon Proficiency (Large)",
  "Weapon Proficiency (Bow)", "Weapon Proficiency (Crossbow)", "Weapon Proficiency (Firearms)",
  "Weapon Proficiency (Polearm)", "Weapon Proficiency (Staff)", "Weapon Proficiency (Thrown)",
  "Weapon Smithing", "Wealth", "Withdraw"
] as const;

export type Heritage = typeof HERITAGES[number]["id"];
export type Culture = keyof typeof CULTURES;
export type Archetype = typeof ARCHETYPES[number]["id"];
export type Skill = typeof SKILLS[number];
