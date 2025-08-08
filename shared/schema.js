// Aliases for compatibility with camelCase imports in other files
// ...existing code...
import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Database schema objects matching actual columns
export const archetype_primary_skills = {
  id: 'uuid',
  archetype_id: 'uuid',
  skill_id: 'uuid',
};

export const archetype_secondary_skills = {
  id: 'uuid',
  archetype_id: 'uuid',
  skill_id: 'uuid',
};

export const heritage_secondary_skills = {
  id: 'uuid',
  heritage_id: 'uuid',
  skill_id: 'uuid',
};

// Attribute cost calculation
export function getAttributeCost(currentValue, points = 1) {
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

// Calculate attribute purchase cost
export function calculateAttributePurchaseCost(heritage, currentBody, currentStamina) {
  const bases = HERITAGE_BASES[heritage] || { body: 10, stamina: 10 };
  
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


// ...existing code...

// Define users table first to avoid circular references
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  player_name: text("player_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  title: text("title"), // Custom user title/role display name
  player_number: text("player_number").unique(),
  chapter_id: uuid("chapter_id"), // Will add references after chapters are defined
  is_admin: boolean("is_admin").default(false).notNull(),
  role_id: uuid("role_id"), // Will add references after roles are defined
  role: text("role"), // Denormalized role name for easy access
  candles: integer("candles").default(0).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const chapters = pgTable("chapters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // 2-letter chapter code
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  created_by: uuid("created_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Role and permission tables
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color"),
  is_system_role: boolean("is_system_role").default(false).notNull(),
  created_by: uuid("created_by").references(() => users.id),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g., "users", "characters", "events", "system"
});

export const role_permissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  role_id: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  permission_id: uuid("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
});

export const rolePermissions = role_permissions;

// Default permissions
const defaultPermissions = [
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
];

// Dynamic game data tables
export const heritages = pgTable("heritages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  body: integer("body").notNull(),
  stamina: integer("stamina").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
  costume_requirements: text("costume_requirements").notNull(),
  benefit: text("benefit").notNull(),
  weakness: text("weakness").notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const cultures = pgTable("cultures", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  allowed_heritages: text("allowed_heritages").array().notNull().default([]),
  benefits: text("benefits").array().notNull().default([]),
  costume_requirements: text("costume_requirements"),
  description: text("description"),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const archetypes = pgTable("archetypes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  primary_skills: text("primary_skills").array().notNull().default([]),
  secondary_skills: text("secondary_skills").array().notNull().default([]),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  prerequisite_skill_id: uuid("prerequisite_skill_id"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Character management tables
export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  heritage: uuid("heritage").references(() => heritages.id).notNull(),
  culture: uuid("culture").references(() => cultures.id).notNull(),
  archetype: uuid("archetype").references(() => archetypes.id).notNull(),
  secondary_archetype_id: uuid("secondary_archetype_id").references(() => archetypes.id),
  // Added fields to match API usage
  body: integer("body"),
  mind: integer("mind"),
  spirit: integer("spirit"),
  purchased_skills: text("purchased_skills").array().default([]),
  total_xp_spent: integer("total_xp_spent").default(0),
  experience: integer("experience").default(0),
  is_active: boolean("is_active").default(true),
  xp: integer("xp").default(0).notNull(),
  candles: integer("candles").default(0).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Events and RSVP system
export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  event_date: timestamp("event_date").notNull(),
  location: text("location"),
  max_attendees: integer("max_attendees"),
  registration_open: boolean("registration_open").default(true).notNull(),
  chapter_id: uuid("chapter_id").references(() => chapters.id).notNull(),
  created_by: uuid("created_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const event_rsvps = pgTable("event_rsvps", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  event_id: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  character_id: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }).notNull(),
  rsvp_status: boolean("rsvp_status"),
  attendance_marked: boolean("attendance_marked").default(false).notNull(),
  xp_purchases: integer("xp_purchases").default(0).notNull(),
  xp_candle_purchases: integer("xp_candle_purchases").default(0).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Experience tracking
export const experience_entries = pgTable("experience_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  character_id: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  event_id: uuid("event_id").references(() => events.id),
  rsvp_id: uuid("rsvp_id").references(() => event_rsvps.id),
  skill_purchased: text("skill_purchased"),
  attribute_increased: text("attribute_increased"),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  awarded_by: uuid("awarded_by"),
});

export const experienceEntries = experience_entries;

// System settings
export const system_settings = pgTable("system_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Candle transaction tracking
export const candle_transactions = pgTable("candle_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(), // Positive for add, negative for spend
  reason: text("reason").notNull(),
  created_by: uuid("created_by").references(() => users.id).notNull(), // Admin who performed the transaction
  event_id: uuid("event_id").references(() => events.id), // Optional event association
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
});

export const candleTransactions = candle_transactions;

// Achievement and milestone overrides
export const static_milestone_overrides = pgTable("static_milestone_overrides", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  character_id: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }).notNull(),
  milestone_id: text("milestone_id").notNull(),
  is_completed: boolean("is_completed").default(false).notNull(),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
});

export const staticMilestoneOverrides = static_milestone_overrides;

export const static_achievement_overrides = pgTable("static_achievement_overrides", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  character_id: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }).notNull(),
  achievement_id: text("achievement_id").notNull(),
  is_completed: boolean("is_completed").default(false).notNull(),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
});

export const staticAchievementOverrides = static_achievement_overrides;

// Custom achievements and milestones
export const custom_achievements = pgTable("custom_achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon_name: text("icon_name").notNull(),
  rarity: text("rarity").notNull(),
  condition_type: text("condition_type").notNull(), // e.g., "event_participation", "skill_mastery"
  condition_value: integer("condition_value").notNull(),
  is_active: boolean("is_active").default(false).notNull(),
  created_by: uuid("created_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const customAchievements = custom_achievements;

export const custom_milestones = pgTable("custom_milestones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  threshold: integer("threshold").notNull(),
  icon_name: text("icon_name").notNull(),
  color: text("color").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_by: uuid("created_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const customMilestones = custom_milestones;

export const character_achievements = pgTable("character_achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  character_id: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }).notNull(),
  achievement_id: uuid("achievement_id").references(() => custom_achievements.id, { onDelete: "cascade" }).notNull(),
  completed_at: timestamp("completed_at").default(sql`now()`).notNull(),
});

export const characterAchievements = character_achievements;

export const character_milestones = pgTable("character_milestones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  character_id: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }).notNull(),
  milestone_id: uuid("milestone_id").references(() => custom_milestones.id, { onDelete: "cascade" }).notNull(),
  completed_at: timestamp("completed_at").default(sql`now()`).notNull(),
});

export const characterMilestones = character_milestones;

// Relations
const usersRelations = relations(users, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [users.chapter_id],
    references: [chapters.id],
  }),
  role: one(roles, {
    fields: [users.role_id],
    references: [roles.id],
  }),
  characters: many(characters),
  candleTransactions: many(candleTransactions, { relationName: "userTransactions" }),
  candleTransactionsPerformed: many(candleTransactions, { relationName: "performedTransactions" }),
  createdEvents: many(events),
  createdChapters: many(chapters),
  createdRoles: many(roles),
}));

const chaptersRelations = relations(chapters, ({ one, many }) => ({
  creator: one(users, {
    fields: [chapters.created_by],
    references: [users.id],
  }),
  members: many(users),
  events: many(events),
  customAchievements: many(customAchievements),
  customMilestones: many(customMilestones),
}));

const rolesRelations = relations(roles, ({ one, many }) => ({
  creator: one(users, {
    fields: [roles.created_by],
    references: [users.id],
  }),
  users: many(users),
  permissions: many(rolePermissions),
}));

const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.role_id],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permission_id],
    references: [permissions.id],
  }),
}));

const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.user_id],
    references: [users.id],
  }),
  heritage: one(heritages, {
    fields: [characters.heritage],
    references: [heritages.id],
  }),
  culture: one(cultures, {
    fields: [characters.culture],
    references: [cultures.id],
  }),
  archetype: one(archetypes, {
    fields: [characters.archetype],
    references: [archetypes.id],
  }),
  secondaryArchetype: one(archetypes, {
    fields: [characters.secondary_archetype_id],
    references: [archetypes.id],
  }),
  eventRsvps: many(event_rsvps),
  experienceEntries: many(experience_entries),
  staticMilestoneOverrides: many(static_milestone_overrides),
  staticAchievementOverrides: many(static_achievement_overrides),
  achievements: many(character_achievements),
  milestones: many(character_milestones),
}));

const eventsRelations = relations(events, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [events.chapter_id],
    references: [chapters.id],
  }),
  creator: one(users, {
    fields: [events.created_by],
    references: [users.id],
  }),
  rsvps: many(event_rsvps),
  experienceEntries: many(experience_entries),
  candleTransactions: many(candle_transactions),
}));

const eventRsvpsRelations = relations(event_rsvps, ({ one, many }) => ({
  event: one(events, {
    fields: [event_rsvps.event_id],
    references: [events.id],
  }),
  character: one(characters, {
    fields: [event_rsvps.character_id],
    references: [characters.id],
  }),
  experienceEntries: many(experience_entries),
}));

const experienceEntriesRelations = relations(experience_entries, ({ one }) => ({
  character: one(characters, {
    fields: [experience_entries.character_id],
    references: [characters.id],
  }),
  event: one(events, {
    fields: [experience_entries.event_id],
    references: [events.id],
  }),
  rsvp: one(event_rsvps, {
    fields: [experience_entries.rsvp_id],
    references: [event_rsvps.id],
  }),
}));

const candleTransactionsRelations = relations(candle_transactions, ({ one }) => ({
  user: one(users, {
    fields: [candle_transactions.user_id],
    references: [users.id],
    relationName: "userTransactions",
  }),
  performedBy: one(users, {
    fields: [candle_transactions.created_by],
    references: [users.id],
    relationName: "performedTransactions",
  }),
  event: one(events, {
    fields: [candle_transactions.event_id],
    references: [events.id],
  }),
}));

// Insert Schemas
const insertEventRsvpSchema = createInsertSchema(event_rsvps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertExperienceEntrySchema = createInsertSchema(experience_entries).omit({
  id: true,
  createdAt: true,
});

const insertSystemSettingSchema = createInsertSchema(system_settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertCandleTransactionSchema = createInsertSchema(candle_transactions).omit({
  id: true,
  createdAt: true,
});

const insertStaticMilestoneOverrideSchema = createInsertSchema(static_milestone_overrides).omit({
  id: true,
  createdAt: true,
});

const insertStaticAchievementOverrideSchema = createInsertSchema(static_achievement_overrides).omit({
  id: true,
  createdAt: true,
});

const insertCustomAchievementSchema = createInsertSchema(custom_achievements).omit({
  id: true,
  createdAt: true,
});

const insertCustomMilestoneSchema = createInsertSchema(custom_milestones).omit({
  id: true,
  createdAt: true,
});

const insertCharacterAchievementSchema = createInsertSchema(character_achievements).omit({
  id: true,
});

const insertCharacterMilestoneSchema = createInsertSchema(character_milestones).omit({
  id: true,
});

const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
});

const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
});

export {
  chapters,
  roles,
  permissions,
  events
};

export {
  insertEventRsvpSchema,
  insertExperienceEntrySchema,
  insertSystemSettingSchema,
  insertCandleTransactionSchema,
  insertStaticMilestoneOverrideSchema,
  insertStaticAchievementOverrideSchema,
  insertCustomAchievementSchema,
  insertCustomMilestoneSchema,
  insertCharacterAchievementSchema,
  insertCharacterMilestoneSchema,
  insertRoleSchema,
  insertPermissionSchema,
  insertRolePermissionSchema
};

export { defaultPermissions };

// ...existing code...
// Aliases for compatibility with camelCase imports in other files
export const eventRsvps = event_rsvps;
