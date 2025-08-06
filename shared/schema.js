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
const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  playerName: text("player_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  title: text("title"), // Custom user title/role display name
  playerNumber: text("player_number").unique(),
  chapterId: uuid("chapter_id"), // Will add references after chapters are defined
  isAdmin: boolean("is_admin").default(false).notNull(),
  roleId: uuid("role_id"), // Will add references after roles are defined
  role: text("role"), // Denormalized role name for easy access
  candles: integer("candles").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

const chapters = pgTable("chapters", {
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
const roles = pgTable("roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color"),
  is_system_role: boolean("is_system_role").default(false).notNull(),
  created_by: uuid("created_by").references(() => users.id),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g., "users", "characters", "events", "system"
});

const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  permissionId: uuid("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
});

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
const heritages = pgTable("heritages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  body: integer("body").notNull(),
  stamina: integer("stamina").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
  costumeRequirements: text("costume_requirements").notNull(),
  benefit: text("benefit").notNull(),
  weakness: text("weakness").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

const cultures = pgTable("cultures", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  allowedHeritages: text("allowed_heritages").array().notNull().default([]),
  benefits: text("benefits").array().notNull().default([]),
  costumeRequirements: text("costume_requirements"),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

const archetypes = pgTable("archetypes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  primarySkills: text("primary_skills").array().notNull().default([]),
  secondarySkills: text("secondary_skills").array().notNull().default([]),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

const skills = pgTable("skills", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  prerequisite_skill_id: uuid("prerequisite_skill_id"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Character management tables
const characters = pgTable("characters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  heritage_id: uuid("heritage_id").references(() => heritages.id).notNull(),
  culture_id: uuid("culture_id").references(() => cultures.id).notNull(),
  archetype_id: uuid("archetype_id").references(() => archetypes.id).notNull(),
  secondaryArchetype: uuid("secondary_archetype_id").references(() => archetypes.id),
  xp: integer("xp").default(0).notNull(),
  candles: integer("candles").default(0).notNull(),
  created_at: timestamp("created_at").default(sql`now()`).notNull(),
  updated_at: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Events and RSVP system
const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").notNull(),
  location: text("location"),
  maxAttendees: integer("max_attendees"),
  registrationOpen: boolean("registration_open").default(true).notNull(),
  chapterId: uuid("chapter_id").references(() => chapters.id).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

const eventRsvps = pgTable("event_rsvps", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  characterId: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }).notNull(),
  rsvpStatus: boolean("rsvp_status"),
  attendanceMarked: boolean("attendance_marked").default(false).notNull(),
  xp_purchases: integer("xp_purchases").default(0).notNull(),
  xp_candle_purchases: integer("xp_candle_purchases").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Experience tracking
const experienceEntries = pgTable("experience_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  eventId: uuid("event_id").references(() => events.id),
  rsvpId: uuid("rsvp_id").references(() => eventRsvps.id),
  skillPurchased: text("skill_purchased"),
  attributeIncreased: text("attribute_increased"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  awarded_by: uuid("awarded_by"),
});

// System settings
const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Candle transaction tracking
const candleTransactions = pgTable("candle_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(), // Positive for add, negative for spend
  reason: text("reason").notNull(),
  created_by: uuid("created_by").references(() => users.id).notNull(), // Admin who performed the transaction
  eventId: uuid("event_id").references(() => events.id), // Optional event association
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Achievement and milestone overrides
const staticMilestoneOverrides = pgTable("static_milestone_overrides", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }).notNull(),
  milestoneId: text("milestone_id").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

const staticAchievementOverrides = pgTable("static_achievement_overrides", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }).notNull(),
  achievementId: text("achievement_id").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Custom achievements and milestones
const customAchievements = pgTable("custom_achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon_name: text("icon_name").notNull(),
  rarity: text("rarity").notNull(),
  condition_type: text("condition_type").notNull(), // e.g., "event_participation", "skill_mastery"
  condition_value: integer("condition_value").notNull(),
  is_active: boolean("is_active").default(false).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

const customMilestones = pgTable("custom_milestones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  threshold: integer("threshold").notNull(),
  icon_name: text("icon_name").notNull(),
  color: text("color").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

const characterAchievements = pgTable("character_achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }).notNull(),
  achievementId: uuid("achievement_id").references(() => customAchievements.id, { onDelete: "cascade" }).notNull(),
  completedAt: timestamp("completed_at").default(sql`now()`).notNull(),
});

const characterMilestones = pgTable("character_milestones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }).notNull(),
  milestoneId: uuid("milestone_id").references(() => customMilestones.id, { onDelete: "cascade" }).notNull(),
  completedAt: timestamp("completed_at").default(sql`now()`).notNull(),
});

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
    fields: [characters.heritage_id],
    references: [heritages.id],
  }),
  culture: one(cultures, {
    fields: [characters.culture_id],
    references: [cultures.id],
  }),
  archetype: one(archetypes, {
    fields: [characters.archetype_id],
    references: [archetypes.id],
  }),
  secondaryArchetype: one(archetypes, {
    fields: [characters.secondary_archetype_id],
    references: [archetypes.id],
  }),
  eventRsvps: many(eventRsvps),
  experienceEntries: many(experienceEntries),
  staticMilestoneOverrides: many(staticMilestoneOverrides),
  staticAchievementOverrides: many(staticAchievementOverrides),
  achievements: many(characterAchievements),
  milestones: many(characterMilestones),
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
  rsvps: many(eventRsvps),
  experienceEntries: many(experienceEntries),
  candleTransactions: many(candleTransactions),
}));

const eventRsvpsRelations = relations(eventRsvps, ({ one, many }) => ({
  event: one(events, {
    fields: [eventRsvps.eventId],
    references: [events.id],
  }),
  character: one(characters, {
    fields: [eventRsvps.characterId],
    references: [characters.id],
  }),
  experienceEntries: many(experienceEntries),
}));

const experienceEntriesRelations = relations(experienceEntries, ({ one }) => ({
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
}));

const candleTransactionsRelations = relations(candleTransactions, ({ one }) => ({
  user: one(users, {
    fields: [candleTransactions.user_id],
    references: [users.id],
    relationName: "userTransactions",
  }),
  performedBy: one(users, {
    fields: [candleTransactions.created_by],
    references: [users.id],
    relationName: "performedTransactions",
  }),
  event: one(events, {
    fields: [candleTransactions.eventId],
    references: [events.id],
  }),
}));

// Insert Schemas
const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertEventRsvpSchema = createInsertSchema(eventRsvps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertExperienceEntrySchema = createInsertSchema(experienceEntries).omit({
  id: true,
  createdAt: true,
});

const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertCandleTransactionSchema = createInsertSchema(candleTransactions).omit({
  id: true,
  createdAt: true,
});

const insertStaticMilestoneOverrideSchema = createInsertSchema(staticMilestoneOverrides).omit({
  id: true,
  createdAt: true,
});

const insertStaticAchievementOverrideSchema = createInsertSchema(staticAchievementOverrides).omit({
  id: true,
  createdAt: true,
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

const insertCustomAchievementSchema = createInsertSchema(customAchievements).omit({
  id: true,
  createdAt: true,
});

const insertCustomMilestoneSchema = createInsertSchema(customMilestones).omit({
  id: true,
  createdAt: true,
});

const insertCharacterAchievementSchema = createInsertSchema(characterAchievements).omit({
  id: true,
});

const insertCharacterMilestoneSchema = createInsertSchema(characterMilestones).omit({
  id: true,
});

const insertHeritageSchema = createInsertSchema(heritages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertCultureSchema = createInsertSchema(cultures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertArchetypeSchema = createInsertSchema(archetypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export all tables
export {
  users,
  chapters,
  roles,
  permissions,
  rolePermissions,
  characters,
  events,
  eventRsvps,
  experienceEntries,
  systemSettings,
  candleTransactions,
  staticMilestoneOverrides,
  staticAchievementOverrides,
  customAchievements,
  customMilestones,
  characterAchievements,
  characterMilestones,
  heritages,
  cultures,
  archetypes,
  skills
};

// Export relations
export {
  usersRelations,
  chaptersRelations,
  rolesRelations,
  permissionsRelations,
  rolePermissionsRelations,
  charactersRelations,
  eventsRelations,
  eventRsvpsRelations,
  experienceEntriesRelations,
  candleTransactionsRelations
};

// Export insert schemas
export {
  insertChapterSchema,
  insertUserSchema,
  insertCharacterSchema,
  insertEventSchema,
  insertEventRsvpSchema,
  insertExperienceEntrySchema,
  insertSystemSettingSchema,
  insertCandleTransactionSchema,
  insertStaticMilestoneOverrideSchema,
  insertStaticAchievementOverrideSchema,
  insertRoleSchema,
  insertPermissionSchema,
  insertRolePermissionSchema,
  insertCustomAchievementSchema,
  insertCustomMilestoneSchema,
  insertCharacterAchievementSchema,
  insertCharacterMilestoneSchema,
  insertHeritageSchema,
  insertCultureSchema,
  insertArchetypeSchema,
  insertSkillSchema
};

// Export constants
export { defaultPermissions };
