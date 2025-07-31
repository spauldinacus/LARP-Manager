import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  playerName: text("player_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  playerNumber: text("player_number").unique(),
  chapterId: uuid("chapter_id").references(() => chapters.id),
  isAdmin: boolean("is_admin").default(false).notNull(),
  candles: integer("candles").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  playerName: text("player_name").notNull(),
  heritage: text("heritage").notNull(),
  culture: text("culture").notNull(),
  archetype: text("archetype").notNull(),
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
  attended: boolean("attended").default(false).notNull(),
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

// Relations
export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [chapters.createdBy],
    references: [users.id],
  }),
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [users.chapterId],
    references: [chapters.id],
  }),
  characters: many(characters),
  createdEvents: many(events),
  awardedExperience: many(experienceEntries),
  createdChapters: many(chapters),
  candleTransactions: many(candleTransactions),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  experienceEntries: many(experienceEntries),
  rsvps: many(eventRsvps),
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

export const insertCandleTransactionSchema = createInsertSchema(candleTransactions).omit({
  id: true,
  createdAt: true,
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

// Heritage, Culture, and Archetype data for skill cost calculations
export const HERITAGES = [
  {
    id: 'ar-nura',
    name: 'Ar-Nura',
    secondarySkills: ['First Aid', 'Bard', 'Herbalism', 'Meditation'],
  },
  {
    id: 'human', 
    name: 'Human',
    secondarySkills: ['First Aid', 'Farming', 'Lumberjack', 'Mining'],
  },
  {
    id: 'stoneborn',
    name: 'Stoneborn', 
    secondarySkills: ['Blacksmithing', 'Cooking', 'Lumberjack', 'Mining'],
  },
  {
    id: 'ughol',
    name: 'Ughol',
    secondarySkills: ['Quick Search', 'Scavenging', 'Taunt', 'Trapper'],
  },
  {
    id: 'rystarri',
    name: 'Rystarri',
    secondarySkills: ['Herbalism', 'Intercept', 'Mercantile', 'Scavenging'],
  },
];

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
      secondarySkills: ["Merchant", "Metalworking"]
    }
  ],
  "ughol": [
    { 
      id: "emorvek", 
      name: "Emorvek",
      primarySkills: ["Hunting", "Survival"],
      secondarySkills: ["Cooking", "Herbalism"]
    },
    { 
      id: "theskra", 
      name: "Theskra",
      primarySkills: ["Shamanism", "First Aid"],
      secondarySkills: ["Herbalism", "Lore (Spirit)"]
    }
  ],
  "rystarri": [
    { 
      id: "avanni", 
      name: "Avanni",
      primarySkills: ["Lore (Magic)", "Meditation"],
      secondarySkills: ["Scribe", "Lore (Arcane)"]
    },
    { 
      id: "vashari", 
      name: "Vashari",
      primarySkills: ["Weapon Focus (Light)", "Lore (Magic)"],
      secondarySkills: ["Dodge", "Alertness"]
    }
  ]
};

export const ARCHETYPES = [
  {
    id: 'warrior',
    name: 'Warrior',
    primarySkills: ['Weapon Skill', 'Armor Training'],
    secondarySkills: ['Leadership', 'Tactics'],
  },
  {
    id: 'scholar',
    name: 'Scholar', 
    primarySkills: ['Ancient Lore', 'Arcane Lore'],
    secondarySkills: ['Regional Lore', 'Politics'],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    primarySkills: ['Stealth', 'Lock Picking'],
    secondarySkills: ['Navigation', 'Economics'],
  },
  {
    id: 'artisan',
    name: 'Artisan',
    primarySkills: ['Crafting', 'Engineering'],
    secondarySkills: ['Economics', 'Stone Masonry'],
  },
];

// Skill cost calculation function
export function getSkillCost(skill: string, heritage: string, culture: string, archetype: string): { cost: number; category: 'primary' | 'secondary' | 'other' } {
  const heritageData = HERITAGES.find(h => h.id === heritage);
  const cultureData = culture ? CULTURES[heritage as keyof typeof CULTURES]?.find(c => c.id === culture) : null;
  const archetypeData = ARCHETYPES.find(a => a.id === archetype);

  // Check if skill is primary for any of the selected options  
  const heritageSecondarySkills = heritageData?.secondarySkills || [];
  const culturePrimarySkills = cultureData?.primarySkills || [];
  const archetypePrimarySkills = archetypeData?.primarySkills || [];
  
  if (
    heritageSecondarySkills.some(s => s === skill) ||
    culturePrimarySkills.some(s => s === skill) ||
    archetypePrimarySkills.some(s => s === skill)
  ) {
    return { cost: 5, category: 'primary' };
  }

  // Check if skill is secondary for any of the selected options
  const cultureSecondarySkills = cultureData?.secondarySkills || [];
  const archetypeSecondarySkills = archetypeData?.secondarySkills || [];
  
  if (
    cultureSecondarySkills.some(s => s === skill) ||
    archetypeSecondarySkills.some(s => s === skill)
  ) {
    return { cost: 10, category: 'secondary' };
  }

  // Otherwise it's a general skill
  return { cost: 20, category: 'other' };
}
