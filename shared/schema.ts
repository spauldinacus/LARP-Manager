import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define users table first to avoid circular references
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  playerName: text("player_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  playerNumber: text("player_number").unique(),
  title: text("title"), // Custom title for players
  chapterId: uuid("chapter_id"), // Will add references after chapters are defined
  isAdmin: boolean("is_admin").default(false).notNull(),
  roleId: uuid("role_id"), // Will add references after roles are defined
  candles: integer("candles").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const chapters = pgTable("chapters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // 2-letter chapter code
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Role and permission tables
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default("#6B7280").notNull(), // Default gray color
  isSystemRole: boolean("is_system_role").default(false).notNull(), // Cannot be deleted
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g., "users", "characters", "events", "system"
});

export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  permissionId: uuid("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
});

// Default permissions
export const defaultPermissions = [
  { name: "view_users", description: "View user list and details", category: "users" },
  { name: "edit_users", description: "Edit user information and settings", category: "users" },
  { name: "delete_users", description: "Delete user accounts", category: "users" },
  { name: "view_characters", description: "View character information", category: "characters" },
  { name: "edit_characters", description: "Edit character details and stats", category: "characters" },
  { name: "create_characters", description: "Create new characters", category: "characters" },
  { name: "delete_characters", description: "Delete characters", category: "characters" },
  { name: "view_events", description: "View events and RSVPs", category: "events" },
  { name: "create_events", description: "Create new events", category: "events" },
  { name: "edit_events", description: "Edit event details", category: "events" },
  { name: "delete_events", description: "Delete events", category: "events" },
  { name: "manage_roles", description: "Create and edit roles and permissions", category: "system" },
  { name: "manage_chapters", description: "Manage LARP chapters", category: "system" },
  { name: "manage_candles", description: "Award and spend player candles", category: "system" },
  { name: "view_admin_stats", description: "View administrative statistics", category: "system" },
] as const;

export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  playerName: text("player_name").notNull(),
  heritage: text("heritage").notNull(),
  culture: text("culture").notNull(),
  archetype: text("archetype").notNull(),
  secondArchetype: text("second_archetype"), // Optional second archetype for 50 XP
  body: integer("body").notNull(),
  stamina: integer("stamina").notNull(),
  experience: integer("experience").default(0).notNull(),
  totalXpSpent: integer("total_xp_spent").default(0).notNull(),
  skills: text("skills").array().default(sql`'{}'`).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isRetired: boolean("is_retired").default(false).notNull(),
  retiredAt: timestamp("retired_at"),
  retiredBy: uuid("retired_by").references(() => users.id),
  retirementReason: text("retirement_reason"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").notNull(),
  location: text("location"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Event RSVP system for XP purchases
export const eventRsvps = pgTable("event_rsvps", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  characterId: uuid("character_id").references(() => characters.id).notNull(),
  xpPurchases: integer("xp_purchases").default(0).notNull(), // max 2
  xpCandlePurchases: integer("xp_candle_purchases").default(0).notNull(), // max 2
  attended: boolean("attended"),
  userId: uuid("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const experienceEntries = pgTable("experience_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: uuid("character_id").references(() => characters.id).notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  eventId: uuid("event_id").references(() => events.id),
  rsvpId: uuid("rsvp_id").references(() => eventRsvps.id), // link to RSVP for attendance tracking
  awardedBy: uuid("awarded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Candle transaction tracking
export const candleTransactions = pgTable("candle_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // positive for awarded, negative for spent
  reason: text("reason").notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Static milestone overrides table
export const staticMilestoneOverrides = pgTable("static_milestone_overrides", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  milestoneIndex: integer("milestone_index").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  threshold: integer("threshold").notNull(),
  iconName: text("icon_name").notNull(),
  color: text("color").notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Static achievement overrides table
export const staticAchievementOverrides = pgTable("static_achievement_overrides", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  achievementIndex: integer("achievement_index").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  rarity: text("rarity").notNull(),
  conditionType: text("condition_type").notNull(),
  conditionValue: integer("condition_value"),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Custom achievements table
export const customAchievements = pgTable("custom_achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(), // Lucide icon name
  rarity: text("rarity", { enum: ["common", "rare", "epic", "legendary"] }).notNull().default("common"),
  conditionType: text("condition_type", { 
    enum: ["skill_count", "xp_spent", "attribute_value", "manual"] 
  }).notNull(),
  conditionValue: integer("condition_value"), // For automated conditions
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Custom milestones table
export const customMilestones = pgTable("custom_milestones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  threshold: integer("threshold").notNull(), // XP threshold
  iconName: text("icon_name").notNull(), // Lucide icon name
  color: text("color").notNull().default("text-blue-600"), // Tailwind color class
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Character achievements table (tracks unlocked achievements per character)
export const characterAchievements = pgTable("character_achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: uuid("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  achievementId: uuid("achievement_id").notNull().references(() => customAchievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").default(sql`now()`).notNull(),
});

// Relations
export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [chapters.createdBy],
    references: [users.id],
  }),
  users: many(users),
}));

// Users relations moved to end of file to include role relationship

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  experienceEntries: many(experienceEntries),
  rsvps: many(eventRsvps),
  achievements: many(characterAchievements),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  experienceEntries: many(experienceEntries),
  rsvps: many(eventRsvps),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, {
    fields: [eventRsvps.eventId],
    references: [events.id],
  }),
  character: one(characters, {
    fields: [eventRsvps.characterId],
    references: [characters.id],
  }),
  user: one(users, {
    fields: [eventRsvps.userId],
    references: [users.id],
  }),
}));

export const experienceEntriesRelations = relations(experienceEntries, ({ one }) => ({
  character: one(characters, {
    fields: [experienceEntries.characterId],
    references: [characters.id],
  }),
  event: one(events, {
    fields: [experienceEntries.eventId],
    references: [events.id],
  }),
  rsvp: one(eventRsvps, {
    fields: [experienceEntries.rsvpId],
    references: [eventRsvps.id],
  }),
  awardedBy: one(users, {
    fields: [experienceEntries.awardedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  playerNumber: true, // Generated automatically
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertEventRsvpSchema = createInsertSchema(eventRsvps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExperienceEntrySchema = createInsertSchema(experienceEntries).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertCustomAchievementSchema = createInsertSchema(customAchievements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomMilestoneSchema = createInsertSchema(customMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCharacterAchievementSchema = createInsertSchema(characterAchievements).omit({
  id: true,
  unlockedAt: true,
});

// Helper function to get heritage base values from the HERITAGES data
export const HERITAGE_BASES = {
  'ar-nura': { body: 8, stamina: 12 },
  'human': { body: 10, stamina: 10 },
  'stoneborn': { body: 15, stamina: 5 },
  'ughol': { body: 12, stamina: 8 },
  'rystarri': { body: 12, stamina: 8 }
} as const;

export function getAttributeCost(currentValue: number, points: number = 1): number {
  let totalCost = 0;
  for (let i = 0; i < points; i++) {
    const valueAtThisStep = currentValue + i;
    if (valueAtThisStep < 20) totalCost += 1;
    else if (valueAtThisStep < 40) totalCost += 2;
    else if (valueAtThisStep < 60) totalCost += 3;
    else if (valueAtThisStep < 80) totalCost += 4;
    else if (valueAtThisStep < 100) totalCost += 5;
    else if (valueAtThisStep < 120) totalCost += 6;
    else if (valueAtThisStep < 140) totalCost += 7;
    else if (valueAtThisStep < 160) totalCost += 8;
    else if (valueAtThisStep < 180) totalCost += 9;
    else totalCost += 10;
  }
  return totalCost;
}

export function calculateAttributePurchaseCost(heritage: string, currentBody: number, currentStamina: number): number {
  const bases = HERITAGE_BASES[heritage as keyof typeof HERITAGE_BASES] || { body: 10, stamina: 10 };
  
  let totalCost = 0;
  
  // Body costs
  if (currentBody > bases.body) {
    for (let i = bases.body; i < currentBody; i++) {
      totalCost += getAttributeCost(i, 1);
    }
  }
  
  // Stamina costs
  if (currentStamina > bases.stamina) {
    for (let i = bases.stamina; i < currentStamina; i++) {
      totalCost += getAttributeCost(i, 1);
    }
  }
  
  return totalCost;
}

// ===========================
// GAME DATA - SINGLE SOURCE OF TRUTH
// ===========================

// All available skills in the game
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

// Heritage definitions with base attributes and secondary skills
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

// Culture definitions organized by heritage
export const CULTURES = {
  "ar-nura": [
    { 
      id: "eisolae", 
      name: "Eisolae",
    },
    { 
      id: "jhaniada", 
      name: "Jhani'ada",
    },
    { 
      id: "viskela", 
      name: "Viskela",
    }
  ],
  "human": [
    { 
      id: "erdanian", 
      name: "Erdanian",
    },
    { 
      id: "khemasuri", 
      name: "Khemasuri",
    },
    { 
      id: "saronean", 
      name: "Saronean",
    },
    { 
      id: "vyaldur", 
      name: "Vyaldur",
    }
  ],
  "stoneborn": [
    { 
      id: "dargadian", 
      name: "Dargadian",
    },
    { 
      id: "akhunrasi", 
      name: "Akhunrasi",
    },
    { 
      id: "kahrnuthaen", 
      name: "Kahrnuthaen",
    }
  ],
  "ughol": [
    { 
      id: "gragrimn", 
      name: "Gragrimn",
    },
    { 
      id: "skraata", 
      name: "Skraata",
    },
    { 
      id: "voruk", 
      name: "Voruk",
    }
  ],
  "rystarri": [
    { 
      id: "maolawki", 
      name: "Maolawki",
    },
    { 
      id: "yarowi", 
      name: "Yarowi",
    }
  ]
} as const;

// Archetype definitions with primary and secondary skills
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
    primarySkills: ["Ambidexterity", "Armor Training (Light)", "Dexterity Armor", "Disarm", "Magic Path (Apprentice): Path of Arcane Mind", "Magic Path (Journeyman): Path of Arcane Mind", "Magic Path (Apprentice): Path of Eternal Flame", "Magic Path (Journeyman): Path of Eternal Flame", "Parry", "Weapon Focus (Medium)", "Weapon Proficiency (Medium)"],
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

// Type definitions for game data
export type Heritage = typeof HERITAGES[number]["id"];
export type Culture = keyof typeof CULTURES;
export type Archetype = typeof ARCHETYPES[number]["id"];
export type Skill = typeof SKILLS[number];

// Types
export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type ExperienceEntry = typeof experienceEntries.$inferSelect;
export type InsertExperienceEntry = z.infer<typeof insertExperienceEntrySchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type CandleTransaction = typeof candleTransactions.$inferSelect;
export type InsertCandleTransaction = z.infer<typeof insertCandleTransactionSchema>;
export type StaticMilestoneOverride = typeof staticMilestoneOverrides.$inferSelect;
export type InsertStaticMilestoneOverride = z.infer<typeof insertStaticMilestoneOverrideSchema>;
export type StaticAchievementOverride = typeof staticAchievementOverrides.$inferSelect;
export type InsertStaticAchievementOverride = z.infer<typeof insertStaticAchievementOverrideSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type CustomAchievement = typeof customAchievements.$inferSelect;
export type InsertCustomAchievement = z.infer<typeof insertCustomAchievementSchema>;
export type CustomMilestone = typeof customMilestones.$inferSelect;
export type InsertCustomMilestone = z.infer<typeof insertCustomMilestoneSchema>;
export type CharacterAchievement = typeof characterAchievements.$inferSelect;
export type InsertCharacterAchievement = z.infer<typeof insertCharacterAchievementSchema>;

export const insertCandleTransactionSchema = createInsertSchema(candleTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertStaticMilestoneOverrideSchema = createInsertSchema(staticMilestoneOverrides).omit({
  id: true,
  updatedAt: true,
});

export const insertStaticAchievementOverrideSchema = createInsertSchema(staticAchievementOverrides).omit({
  id: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
});

export const candleTransactionsRelations = relations(candleTransactions, ({ one }) => ({
  user: one(users, {
    fields: [candleTransactions.userId],
    references: [users.id],
  }),
  admin: one(users, {
    fields: [candleTransactions.createdBy],
    references: [users.id],
  }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  creator: one(users, {
    fields: [roles.createdBy],
    references: [users.id],
  }),
  permissions: many(rolePermissions),
  users: many(users),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const customAchievementsRelations = relations(customAchievements, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [customAchievements.createdBy],
    references: [users.id],
  }),
  characterAchievements: many(characterAchievements),
}));

export const customMilestonesRelations = relations(customMilestones, ({ one }) => ({
  createdBy: one(users, {
    fields: [customMilestones.createdBy],
    references: [users.id],
  }),
}));

export const characterAchievementsRelations = relations(characterAchievements, ({ one }) => ({
  character: one(characters, {
    fields: [characterAchievements.characterId],
    references: [characters.id],
  }),
  achievement: one(customAchievements, {
    fields: [characterAchievements.achievementId],
    references: [customAchievements.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  chapter: one(chapters, {
    fields: [users.chapterId],
    references: [chapters.id],
  }),
  characters: many(characters),
  candleTransactions: many(candleTransactions),
}));

// ===========================
// ADDITIONAL HELPER FUNCTIONS
// ===========================

// Function to calculate skill XP cost based on heritage and archetype(s)
export function getSkillCost(skill: string, heritage: string, archetype: string, secondArchetype?: string): number {
  const heritageData = HERITAGES.find(h => h.id === heritage);
  const archetypeData = ARCHETYPES.find(a => a.id === archetype);
  const secondArchetypeData = secondArchetype ? ARCHETYPES.find(a => a.id === secondArchetype) : null;
  
  // Get all skill lists - cast readonly arrays to mutable arrays
  const heritageSecondarySkills = [...(heritageData?.secondarySkills || [])];
  const archetypePrimarySkills = [...(archetypeData?.primarySkills || [])];
  const archetypeSecondarySkills = [...(archetypeData?.secondarySkills || [])];
  const secondArchetypePrimarySkills = [...(secondArchetypeData?.primarySkills || [])];
  const secondArchetypeSecondarySkills = [...(secondArchetypeData?.secondarySkills || [])];
  
  // Check if skill is PRIMARY (5 XP) - heritage secondary OR any archetype primary
  if (heritageSecondarySkills.includes(skill) || 
      archetypePrimarySkills.includes(skill) || 
      secondArchetypePrimarySkills.includes(skill)) {
    return 5;
  }

  // Check if skill is SECONDARY (10 XP) - any archetype secondary
  if (archetypeSecondarySkills.includes(skill) || 
      secondArchetypeSecondarySkills.includes(skill)) {
    return 10;
  }

  // Otherwise it's a general skill (20 XP)
  return 20;
}



