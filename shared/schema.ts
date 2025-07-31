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

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  playerName: text("player_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  playerNumber: text("player_number").unique(),
  chapterId: uuid("chapter_id").references(() => chapters.id),
  isAdmin: boolean("is_admin").default(false).notNull(),
  roleId: uuid("role_id").references(() => roles.id),
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

// Permission helper functions
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const permissions = rolePermissions[userRole];
  return permissions.includes('*' as any) || permissions.includes(permission);
}

export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function isAtLeastRole(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy: Role[] = ['user', 'moderator', 'admin', 'super_admin'];
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
  return userRoleIndex >= requiredRoleIndex;
}

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
