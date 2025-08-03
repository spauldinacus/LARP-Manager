import {
  chapters,
  users,
  characters,
  events,
  eventRsvps,
  experienceEntries,
  systemSettings,
  candleTransactions,
  roles,
  permissions,
  rolePermissions,
  customAchievements,
  customMilestones,
  characterAchievements,
  defaultPermissions,
  skillsTable,
  heritagesTable,
  culturesTable,
  archetypesTable,
  heritageSecondarySkills,
  cultureSecondarySkills,
  archetypePrimarySkills,
  archetypeSecondarySkills,
  type Chapter,
  type InsertChapter,
  type User,
  type InsertUser,
  type Character,
  type InsertCharacter,
  type Event,
  type InsertEvent,
  type EventRsvp,
  type InsertEventRsvp,
  type ExperienceEntry,
  type InsertExperienceEntry,
  type SystemSetting,
  type InsertSystemSetting,
  type CandleTransaction,
  type InsertCandleTransaction,
  type Role,
  type InsertRole,
  type Permission,
  type InsertPermission,
  type RolePermission,
  type InsertRolePermission,
  type CustomAchievement,
  type InsertCustomAchievement,
  type CustomMilestone,
  type InsertCustomMilestone,
  type CharacterAchievement,
  type InsertCharacterAchievement,
  staticMilestoneOverrides,
  staticAchievementOverrides,
  type StaticMilestoneOverride,
  type InsertStaticMilestoneOverride,
  type StaticAchievementOverride,
  type InsertStaticAchievementOverride,
  insertSkillSchema,
  insertHeritageSchema,
  insertCultureSchema,
  insertArchetypeSchema,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sum, sql } from "drizzle-orm";

export interface IStorage {
  // Chapter methods
  getChapter(id: string): Promise<Chapter | undefined>;
  getAllChapters(): Promise<Chapter[]>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  updateChapter(id: string, chapter: Partial<Chapter>): Promise<Chapter>;
  deleteChapter(id: string): Promise<void>;
  generatePlayerNumber(chapterId: string): Promise<string>;

  // User methods
  getUser(id: string): Promise<User | undefined>;

  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, roleId: string): Promise<User>;

  // Role management methods
  getAllRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, role: Partial<Role>): Promise<Role>;
  deleteRole(id: string): Promise<void>;
  getRolePermissions(roleId: string): Promise<Permission[]>;
  setRolePermissions(roleId: string, permissionIds: string[]): Promise<void>;

  // Permission management methods
  getAllPermissions(): Promise<Permission[]>;
  getPermission(id: string): Promise<Permission | undefined>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  
  // System initialization
  initializeDefaultRolesAndPermissions(): Promise<void>;

  // Character methods
  getCharacter(id: string): Promise<Character | undefined>;
  getCharactersByUserId(userId: string): Promise<Character[]>;
  getAllCharacters(): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: string, character: Partial<Character>): Promise<Character>;
  deleteCharacter(id: string): Promise<void>;

  // Event methods
  getEvent(id: string): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<Event>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;

  // Event RSVP methods
  getEventRsvp(eventId: string, characterId: string): Promise<EventRsvp | undefined>;
  createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  updateEventRsvp(id: string, rsvp: Partial<EventRsvp>): Promise<EventRsvp>;
  deleteEventRsvp(id: string): Promise<void>;
  getEventRsvps(eventId: string): Promise<EventRsvp[]>;
  getCharacterRsvps(characterId: string): Promise<EventRsvp[]>;
  markAttendance(rsvpId: string, attended: boolean, adminUserId: string): Promise<EventRsvp>;

  // Experience methods
  getExperienceByCharacterId(characterId: string): Promise<ExperienceEntry[]>;
  createExperienceEntry(entry: InsertExperienceEntry): Promise<ExperienceEntry>;
  updateExperienceEntryByRsvpId(rsvpId: string, updates: Partial<ExperienceEntry>): Promise<void>;
  getTotalExperienceByCharacter(characterId: string): Promise<number>;
  calculateTotalXpSpent(characterId: string): Promise<number>;
  getAttendedEventsCount(characterId: string): Promise<number>;

  // Candle transaction methods
  createCandleTransaction(transaction: InsertCandleTransaction): Promise<CandleTransaction>;
  getCandleTransactionsWithAdminInfo(userId: string): Promise<any[]>;

  // Achievement management methods
  getAllAchievements(): Promise<CustomAchievement[]>;
  getAchievement(id: string): Promise<CustomAchievement | undefined>;
  createAchievement(achievement: InsertCustomAchievement): Promise<CustomAchievement>;
  updateAchievement(id: string, achievement: Partial<CustomAchievement>): Promise<CustomAchievement>;
  deleteAchievement(id: string): Promise<void>;
  getCharacterAchievements(characterId: string): Promise<CharacterAchievement[]>;
  unlockAchievement(characterId: string, achievementId: string): Promise<CharacterAchievement>;

  // Milestone management methods
  getAllMilestones(): Promise<CustomMilestone[]>;
  getMilestone(id: string): Promise<CustomMilestone | undefined>;
  createMilestone(milestone: InsertCustomMilestone): Promise<CustomMilestone>;
  updateMilestone(id: string, milestone: Partial<CustomMilestone>): Promise<CustomMilestone>;
  deleteMilestone(id: string): Promise<void>;

  // Achievement settings methods
  getAchievementSettings(): Promise<any>;
  updateAchievementSettings(settings: any): Promise<any>;
  recalculateAchievementRarities(): Promise<void>;

  // Dashboard stats
  getStats(): Promise<{
    totalCharacters: number;
    totalCharactersLastMonth: number;
    activePlayers: number;
    activePlayersLastWeek: number;
    totalExperience: number;
    totalExperienceLastMonth: number;
    upcomingEvents: number;
    nextEvent: { name: string; date: Date; daysUntil: number } | null;
  }>;

  // Public upcoming events stats for all users
  getUpcomingEventsStats(): Promise<{
    count: number;
    nextEvent: { name: string; date: Date; daysUntil: number } | null;
  }>;

  // Dynamic game data methods
  getAllSkills(): Promise<any[]>;
  getSkill(id: string): Promise<any | undefined>;
  createSkill(skill: any): Promise<any>;
  updateSkill(id: string, skill: Partial<any>): Promise<any>;
  deleteSkill(id: string): Promise<void>;
  
  getAllHeritages(): Promise<any[]>;
  getHeritage(id: string): Promise<any | undefined>;
  getHeritageWithSkills(id: string): Promise<any | undefined>;
  createHeritage(heritage: any): Promise<any>;
  updateHeritage(id: string, heritage: Partial<any>): Promise<any>;
  deleteHeritage(id: string): Promise<void>;
  
  getAllCultures(): Promise<any[]>;
  getCulture(id: string): Promise<any | undefined>;
  getCultureWithSkills(id: string): Promise<any | undefined>;
  getCulturesByHeritage(heritageId: string): Promise<any[]>;
  createCulture(culture: any): Promise<any>;
  updateCulture(id: string, culture: Partial<any>): Promise<any>;
  deleteCulture(id: string): Promise<void>;
  
  getAllArchetypes(): Promise<any[]>;
  getArchetype(id: string): Promise<any | undefined>;
  getArchetypeWithSkills(id: string): Promise<any | undefined>;
  createArchetype(archetype: any): Promise<any>;
  updateArchetype(id: string, archetype: Partial<any>): Promise<any>;
  deleteArchetype(id: string): Promise<void>;
  
  // Skill relationship methods
  addHeritageSecondarySkill(heritageId: string, skillId: string): Promise<void>;
  removeHeritageSecondarySkill(heritageId: string, skillId: string): Promise<void>;
  addCultureSecondarySkill(cultureId: string, skillId: string): Promise<void>;
  removeCultureSecondarySkill(cultureId: string, skillId: string): Promise<void>;
  addArchetypePrimarySkill(archetypeId: string, skillId: string): Promise<void>;
  removeArchetypePrimarySkill(archetypeId: string, skillId: string): Promise<void>;
  addArchetypeSecondarySkill(archetypeId: string, skillId: string): Promise<void>;
  removeArchetypeSecondarySkill(archetypeId: string, skillId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Chapter methods
  async getChapter(id: string): Promise<Chapter | undefined> {
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id));
    return chapter || undefined;
  }

  async getAllChapters(): Promise<Chapter[]> {
    return await db.select().from(chapters).where(eq(chapters.isActive, true));
  }

  async getAllChaptersWithMemberCount(): Promise<any[]> {
    const chaptersWithCounts = await db
      .select({
        id: chapters.id,
        name: chapters.name,
        code: chapters.code,
        description: chapters.description,
        isActive: chapters.isActive,
        createdBy: chapters.createdBy,
        createdAt: chapters.createdAt,
        memberCount: sql<number>`count(${users.id})`
      })
      .from(chapters)
      .leftJoin(users, eq(chapters.id, users.chapterId))
      .groupBy(chapters.id, chapters.name, chapters.code, chapters.description, chapters.isActive, chapters.createdBy, chapters.createdAt)
      .orderBy(desc(chapters.createdAt));

    return chaptersWithCounts;
  }

  async getChapterMembers(chapterId: string): Promise<any[]> {
    const members = await db
      .select({
        id: users.id,
        playerName: users.playerName,
        playerNumber: users.playerNumber,
        title: users.title,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.chapterId, chapterId))
      .orderBy(users.playerName);

    return members;
  }

  async createChapter(insertChapter: InsertChapter): Promise<Chapter> {
    const [chapter] = await db.insert(chapters).values(insertChapter).returning();
    return chapter;
  }

  async updateChapter(id: string, updateData: Partial<Chapter>): Promise<Chapter> {
    const [chapter] = await db
      .update(chapters)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(chapters.id, id))
      .returning();
    return chapter;
  }

  async deleteChapter(id: string): Promise<void> {
    await db.update(chapters)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(chapters.id, id));
  }

  async generatePlayerNumber(chapterId: string): Promise<string> {
    const chapter = await this.getChapter(chapterId);
    if (!chapter) {
      throw new Error("Chapter not found");
    }

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    
    // Get count of users created this month for this chapter
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const usersThisMonth = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.chapterId, chapterId),
          sql`${users.createdAt} >= ${monthStart}`,
          sql`${users.createdAt} <= ${monthEnd}`
        )
      );

    const nextNumber = String(usersThisMonth.length + 1).padStart(3, '0');
    return `${chapter.code.toUpperCase()}${year}${month}${nextNumber}`;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }



  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate player number if chapter is assigned
    let playerNumber: string | undefined;
    if (insertUser.chapterId) {
      playerNumber = await this.generatePlayerNumber(insertUser.chapterId);
    }

    const [user] = await db.insert(users).values({
      ...insertUser,
      playerNumber,
    }).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Get all characters owned by this user
    const userCharacters = await db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.userId, id));

    // Delete each character and its related data
    for (const character of userCharacters) {
      await this.deleteCharacter(character.id);
    }

    // Delete candle transactions
    await db.delete(candleTransactions).where(eq(candleTransactions.userId, id));

    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<any[]> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    
    const usersWithCharacterCounts = await Promise.all(
      allUsers.map(async (user) => {
        const userCharacters = await db
          .select({ id: characters.id })
          .from(characters)  
          .where(eq(characters.userId, user.id));
          
        return {
          ...user,
          characterCount: userCharacters.length,
        };
      })
    );
    
    return usersWithCharacterCounts;
  }

  async getAllUsersWithDetails(): Promise<any[]> {
    const usersData = await db
      .select({
        id: users.id,
        playerName: users.playerName,
        email: users.email,
        playerNumber: users.playerNumber,
        title: users.title,
        chapterId: users.chapterId,
        roleId: users.roleId,
        isAdmin: users.isAdmin,
        candles: users.candles,
        createdAt: users.createdAt,
        roleName: roles.name,
        roleColor: roles.color,
        chapterName: chapters.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(chapters, eq(users.chapterId, chapters.id))
      .orderBy(users.createdAt);

    // Get character counts for each user
    const userCharacterCounts = await db
      .select({
        userId: characters.userId,
        count: sql<number>`count(*)::int`,
      })
      .from(characters)
      .groupBy(characters.userId);

    const characterCountMap = new Map(
      userCharacterCounts.map(item => [item.userId, item.count])
    );

    return usersData.map(user => ({
      ...user,
      characterCount: characterCountMap.get(user.id) || 0,
      role: user.roleName ? {
        id: user.roleId,
        name: user.roleName,
        color: user.roleColor,
      } : null,
      chapter: user.chapterName ? {
        id: user.chapterId,
        name: user.chapterName,
      } : null,
    }));
  }

  async getUserWithDetails(id: string): Promise<any | undefined> {
    try {
      console.log("Getting user with details for id:", id);
      
      // Get basic user data first
      const basicUsers = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
        
      const basicUser = basicUsers[0];
      if (!basicUser) {
        console.log("No user found with id:", id);
        return undefined;
      }
      
      console.log("Found user:", basicUser.playerName);
      
      // Get role data separately if user has a role
      let roleData = null;
      if (basicUser.roleId) {
        console.log("Getting role for roleId:", basicUser.roleId);
        const roleResults = await db
          .select()
          .from(roles)
          .where(eq(roles.id, basicUser.roleId))
          .limit(1);
        
        const role = roleResults[0];
        if (role) {
          roleData = {
            id: role.id,
            name: role.name,
            color: role.color,
          };
          console.log("Found role:", role.name);
        }
      }
      
      // Get chapter data separately if user has a chapter
      let chapterData = null;
      if (basicUser.chapterId) {
        console.log("Getting chapter for chapterId:", basicUser.chapterId);
        const chapterResults = await db
          .select()
          .from(chapters)
          .where(eq(chapters.id, basicUser.chapterId))
          .limit(1);
        
        const chapter = chapterResults[0];
        if (chapter) {
          chapterData = {
            id: chapter.id,
            name: chapter.name,
          };
          console.log("Found chapter:", chapter.name);
        }
      }
      
      // Get user's characters with heritage/archetype names
      console.log("Getting characters for userId:", id);
      const userCharacters = await db
        .select({
          id: characters.id,
          name: characters.name,
          heritage: heritagesTable.name,
          culture: culturesTable.name,
          archetype: archetypesTable.name,
          isActive: characters.isActive,
          totalXpSpent: characters.totalXpSpent,
        })
        .from(characters)
        .leftJoin(heritagesTable, eq(characters.heritage, heritagesTable.id))
        .leftJoin(culturesTable, eq(characters.culture, culturesTable.id))
        .leftJoin(archetypesTable, eq(characters.archetype, archetypesTable.id))
        .where(eq(characters.userId, id));

      console.log("Found", userCharacters.length, "characters");

      const result = {
        ...basicUser,
        characters: userCharacters,
        role: roleData,
        chapter: chapterData,
      };
      
      console.log("Returning user details successfully");
      return result;
    } catch (error) {
      console.error("getUserWithDetails error for id", id, ":", error);
      throw error;
    }
  }

  async updateUserRole(id: string, roleId: string): Promise<User> {
    // Get the role to determine if it grants admin privileges
    const role = await this.getRole(roleId);
    const isAdmin = role && (role.name === 'Admin' || role.name === 'Super Admin');
    
    const [user] = await db
      .update(users)
      .set({ roleId, isAdmin })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllPlayersWithCharacters(): Promise<any[]> {
    const usersWithCharacters = await db
      .select({
        id: users.id,
        email: users.email,
        playerName: users.playerName,
        title: users.title,
        playerNumber: users.playerNumber,
        chapterId: users.chapterId,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const playersWithCharacters = await Promise.all(
      usersWithCharacters.map(async (user) => {
        const userCharacters = await db
          .select({
            id: characters.id,
            name: characters.name,
            heritage: characters.heritage,
            culture: characters.culture,
            archetype: characters.archetype,
            skills: characters.skills,
            isActive: characters.isActive,
            isRetired: characters.isRetired,
          })
          .from(characters)
          .where(eq(characters.userId, user.id))
          .orderBy(desc(characters.createdAt));

        return {
          ...user,
          characters: userCharacters,
        };
      })
    );

    return playersWithCharacters;
  }

  async updateUserPlayerNumber(userId: string, playerNumber: string): Promise<void> {
    await db
      .update(users)
      .set({ playerNumber, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async addSkillToCharacter(characterId: string, skill: string): Promise<void> {
    const character = await this.getCharacter(characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    const currentSkills = character.skills || [];
    if (currentSkills.includes(skill)) {
      throw new Error("Character already has this skill");
    }

    const updatedSkills = [...currentSkills, skill];
    await db
      .update(characters)
      .set({ skills: updatedSkills, updatedAt: new Date() })
      .where(eq(characters.id, characterId));
  }

  async removeSkillFromCharacter(characterId: string, skill: string): Promise<void> {
    const character = await this.getCharacter(characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    const currentSkills = character.skills || [];
    if (!currentSkills.includes(skill)) {
      throw new Error("Character does not have this skill");
    }

    const updatedSkills = currentSkills.filter(s => s !== skill);
    await db
      .update(characters)
      .set({ skills: updatedSkills, updatedAt: new Date() })
      .where(eq(characters.id, characterId));
  }

  // Character methods
  async getCharacter(id: string): Promise<any | undefined> {
    const [character] = await db
      .select({
        id: characters.id,
        name: characters.name,
        userId: characters.userId,
        heritage: heritagesTable.name,
        culture: culturesTable.name,
        archetype: archetypesTable.name,
        body: characters.body,
        stamina: characters.stamina,
        experience: characters.experience,
        totalXpSpent: characters.totalXpSpent,
        skills: characters.skills,
        isActive: characters.isActive,
        isRetired: characters.isRetired,
        retiredAt: characters.retiredAt,
        retirementReason: characters.retirementReason,
        createdAt: characters.createdAt,
        updatedAt: characters.updatedAt,
      })
      .from(characters)
      .leftJoin(heritagesTable, eq(characters.heritage, heritagesTable.id))
      .leftJoin(culturesTable, eq(characters.culture, culturesTable.id))
      .leftJoin(archetypesTable, eq(characters.archetype, archetypesTable.id))
      .where(eq(characters.id, id));
    
    return character || undefined;
  }

  async getCharactersByUserId(userId: string): Promise<Character[]> {
    return await db
      .select()
      .from(characters)
      .where(eq(characters.userId, userId))
      .orderBy(desc(characters.createdAt));
  }

  async getAllCharacters(): Promise<any[]> {
    const charactersWithPlayers = await db
      .select({
        id: characters.id,
        name: characters.name,
        userId: characters.userId,
        heritage: heritagesTable.name,
        culture: culturesTable.name,
        archetype: archetypesTable.name,
        body: characters.body,
        stamina: characters.stamina,
        experience: characters.experience,
        totalXpSpent: characters.totalXpSpent,
        skills: characters.skills,
        isActive: characters.isActive,
        isRetired: characters.isRetired,
        retiredAt: characters.retiredAt,
        retirementReason: characters.retirementReason,
        createdAt: characters.createdAt,
        updatedAt: characters.updatedAt,
        playerName: users.playerName,
        playerTitle: users.title,
        playerNumber: users.playerNumber,
      })
      .from(characters)
      .leftJoin(users, eq(characters.userId, users.id))
      .leftJoin(heritagesTable, eq(characters.heritage, heritagesTable.id))
      .leftJoin(culturesTable, eq(characters.culture, culturesTable.id))
      .leftJoin(archetypesTable, eq(characters.archetype, archetypesTable.id))
      .orderBy(desc(characters.createdAt));

    return charactersWithPlayers;
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db.insert(characters).values(insertCharacter).returning();
    
    // Create initial experience entry for character creation (25 XP)
    await this.createExperienceEntry({
      characterId: character.id,
      amount: 25,
      reason: "Character creation",
      awardedBy: insertCharacter.userId, // Character creator awards themselves the initial XP
    });
    
    // Create experience entries for body/stamina purchases during character creation
    const { HERITAGE_BASES, getAttributeCost } = await import("@shared/schema");
    const bases = HERITAGE_BASES[insertCharacter.heritage as keyof typeof HERITAGE_BASES] || { body: 10, stamina: 10 };
    
    // Track body purchases
    if (insertCharacter.body > bases.body) {
      for (let i = bases.body; i < insertCharacter.body; i++) {
        const cost = getAttributeCost(i, 1);
        if (isNaN(cost)) {
          console.error(`Invalid body cost for ${i}→${i + 1}: ${cost}`);
          continue;
        }
        
        await this.createExperienceEntry({
          characterId: character.id,
          amount: -cost,
          reason: `Body increase: ${i}→${i + 1}`,
          awardedBy: insertCharacter.userId,
        });
      }
    }
    
    // Track stamina purchases
    if (insertCharacter.stamina > bases.stamina) {
      for (let i = bases.stamina; i < insertCharacter.stamina; i++) {
        const cost = getAttributeCost(i, 1);
        if (isNaN(cost)) {
          console.error(`Invalid stamina cost for ${i}→${i + 1}: ${cost}`);
          continue;
        }
        
        await this.createExperienceEntry({
          characterId: character.id,
          amount: -cost,
          reason: `Stamina increase: ${i}→${i + 1}`,
          awardedBy: insertCharacter.userId,
        });
      }
    }
    
    // Create experience entries for each starting skill purchased at character creation
    if (insertCharacter.skills && insertCharacter.skills.length > 0) {
      // Import skill costs from shared schema
      const { getSkillCost } = await import("../shared/schema");
      
      for (const skill of insertCharacter.skills) {
        try {
          const skillCost = getSkillCost(skill as any, insertCharacter.heritage as any, insertCharacter.archetype as any);
          
          if (isNaN(skillCost)) {
            console.error(`Invalid skill cost for ${skill}: ${skillCost}`);
            continue;
          }
          
          await this.createExperienceEntry({
            characterId: character.id,
            amount: -skillCost, // Negative because it's spending XP
            reason: `Skill purchase: ${skill}`,
            awardedBy: insertCharacter.userId,
          });
        } catch (error) {
          console.error(`Error processing skill ${skill}:`, error);
        }
      }
    }
    
    return character;
  }

  async updateCharacter(id: string, character: Partial<Character>): Promise<Character> {
    const [updated] = await db
      .update(characters)
      .set({ ...character, updatedAt: new Date() })
      .where(eq(characters.id, id))
      .returning();
    
    // If skills, body, or stamina changed, recalculate total XP spent
    if ('skills' in character || 'body' in character || 'stamina' in character) {
      const totalSpent = await this.calculateTotalXpSpent(id);
      await db
        .update(characters)
        .set({ totalXpSpent: totalSpent, updatedAt: new Date() })
        .where(eq(characters.id, id));
    }
    
    return updated;
  }

  async deleteCharacter(id: string): Promise<void> {
    // First delete all related records in the correct order
    // Delete experience entries
    await db.delete(experienceEntries).where(eq(experienceEntries.characterId, id));
    
    // Delete event RSVPs for this character
    await db.delete(eventRsvps).where(eq(eventRsvps.characterId, id));
    
    // Finally delete the character
    await db.delete(characters).where(eq(characters.id, id));
  }

  // Event methods
  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.eventDate));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: string, event: Partial<Event>): Promise<Event> {
    const [updated] = await db
      .update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Experience methods
  async getExperienceByCharacterId(characterId: string): Promise<any[]> {
    const experienceWithEvents = await db
      .select({
        id: experienceEntries.id,
        characterId: experienceEntries.characterId,
        amount: experienceEntries.amount,
        reason: experienceEntries.reason,
        eventId: experienceEntries.eventId,
        rsvpId: experienceEntries.rsvpId,
        awardedBy: experienceEntries.awardedBy,
        createdAt: experienceEntries.createdAt,
        eventName: events.name,
        eventDate: events.eventDate,
      })
      .from(experienceEntries)
      .leftJoin(events, eq(experienceEntries.eventId, events.id))
      .where(eq(experienceEntries.characterId, characterId))
      .orderBy(desc(experienceEntries.createdAt));

    // Transform the data to match expected format with nested event object
    return experienceWithEvents.map(entry => ({
      id: entry.id,
      characterId: entry.characterId,
      amount: entry.amount,
      reason: entry.reason,
      eventId: entry.eventId,
      rsvpId: entry.rsvpId,
      awardedBy: entry.awardedBy,
      createdAt: entry.createdAt,
      event: entry.eventName ? {
        name: entry.eventName,
        eventDate: entry.eventDate
      } : null
    }));
  }

  async createExperienceEntry(insertEntry: InsertExperienceEntry): Promise<ExperienceEntry> {
    const [entry] = await db.insert(experienceEntries).values(insertEntry).returning();
    
    // Update character's total experience and XP spent
    const totalExp = await this.getTotalExperienceByCharacter(insertEntry.characterId);
    const totalXpSpent = await this.calculateTotalXpSpent(insertEntry.characterId);
    
    await this.updateCharacter(insertEntry.characterId, { 
      experience: totalExp,
      totalXpSpent: totalXpSpent
    });
    
    return entry;
  }

  async updateExperienceEntryByRsvpId(rsvpId: string, updates: Partial<ExperienceEntry>): Promise<void> {
    await db
      .update(experienceEntries)
      .set(updates)
      .where(eq(experienceEntries.rsvpId, rsvpId));
  }

  async getTotalExperienceByCharacter(characterId: string): Promise<number> {
    const result = await db
      .select({ total: sum(experienceEntries.amount) })
      .from(experienceEntries)
      .where(eq(experienceEntries.characterId, characterId));
    
    return Number(result[0]?.total) || 0;
  }

  async calculateTotalXpSpent(characterId: string): Promise<number> {
    try {
      // Calculate XP spent based purely on experience entries (negative amounts)
      const result = await db
        .select({ total: sum(experienceEntries.amount) })
        .from(experienceEntries)
        .where(and(
          eq(experienceEntries.characterId, characterId),
          sql`amount < 0`
        ));
      
      return Math.abs(Number(result[0]?.total)) || 0;
    } catch (error) {
      console.error(`Error calculating XP for character ${characterId}:`, error);
      return 0;
    }
  }

  // Dynamic XP recalculation based on current game data
  async recalculateCharacterXpWithDynamicCosts(characterId: string): Promise<void> {
    try {
      const [character] = await db.select().from(characters).where(eq(characters.id, characterId));
      if (!character) return;

      // Get current dynamic game data using correct table references
      const heritageData = await db
        .select({
          heritage: heritagesTable,
          secondarySkills: sql<any>`COALESCE(array_agg(json_build_object('id', ${skillsTable.id}, 'name', ${skillsTable.name})) FILTER (WHERE ${skillsTable.id} IS NOT NULL), '{}')` 
        })
        .from(heritagesTable)
        .leftJoin(heritageSecondarySkills, eq(heritagesTable.id, heritageSecondarySkills.heritageId))
        .leftJoin(skillsTable, eq(heritageSecondarySkills.skillId, skillsTable.id))
        .where(eq(heritagesTable.id, character.heritage))
        .groupBy(heritagesTable.id);

      // Get archetype with primary skills
      const archetypeData = await db
        .select({
          archetype: archetypesTable,
        })
        .from(archetypesTable)
        .where(eq(archetypesTable.id, character.archetype));

      let archePrimarySkills = [];
      let archeSecondarySkills = [];
      
      if (archetypeData.length > 0) {
        // Get primary skills for this archetype
        const primarySkillsQuery = await db
          .select({ skill: skillsTable })
          .from(archetypePrimarySkills)
          .leftJoin(skillsTable, eq(archetypePrimarySkills.skillId, skillsTable.id))
          .where(eq(archetypePrimarySkills.archetypeId, character.archetype));
        
        archePrimarySkills = primarySkillsQuery.map(row => ({ 
          id: row.skill?.id, 
          name: row.skill?.name 
        })).filter(skill => skill.id);

        // Get secondary skills for this archetype
        const secondarySkillsQuery = await db
          .select({ skill: skillsTable })
          .from(archetypeSecondarySkills)
          .leftJoin(skillsTable, eq(archetypeSecondarySkills.skillId, skillsTable.id))
          .where(eq(archetypeSecondarySkills.archetypeId, character.archetype));
        
        archeSecondarySkills = secondarySkillsQuery.map(row => ({ 
          id: row.skill?.id, 
          name: row.skill?.name 
        })).filter(skill => skill.id);
      }

      let secondArchetypeData = null;
      let secondArchePrimarySkills = [];
      let secondArcheSecondarySkills = [];
      
      if (character.secondArchetype) {
        secondArchetypeData = await db
          .select({
            archetype: archetypesTable,
          })
          .from(archetypesTable)
          .where(eq(archetypesTable.id, character.secondArchetype));

        if (secondArchetypeData.length > 0) {
          // Get primary skills for second archetype
          const primarySkillsQuery = await db
            .select({ skill: skillsTable })
            .from(archetypePrimarySkills)
            .leftJoin(skillsTable, eq(archetypePrimarySkills.skillId, skillsTable.id))
            .where(eq(archetypePrimarySkills.archetypeId, character.secondArchetype));
          
          secondArchePrimarySkills = primarySkillsQuery.map(row => ({ 
            id: row.skill?.id, 
            name: row.skill?.name 
          })).filter(skill => skill.id);

          // Get secondary skills for second archetype
          const secondarySkillsQuery = await db
            .select({ skill: skillsTable })
            .from(archetypeSecondarySkills)
            .leftJoin(skillsTable, eq(archetypeSecondarySkills.skillId, skillsTable.id))
            .where(eq(archetypeSecondarySkills.archetypeId, character.secondArchetype));
          
          secondArcheSecondarySkills = secondarySkillsQuery.map(row => ({ 
            id: row.skill?.id, 
            name: row.skill?.name 
          })).filter(skill => skill.id);
        }
      }

      const heritage = heritageData[0] || null;
      const archetype = archetypeData.length > 0 ? {
        archetype: archetypeData[0].archetype,
        primarySkills: archePrimarySkills,
        secondarySkills: archeSecondarySkills
      } : null;
      const secondArchetype = secondArchetypeData && secondArchetypeData.length > 0 ? {
        archetype: secondArchetypeData[0].archetype,
        primarySkills: secondArchePrimarySkills,
        secondarySkills: secondArcheSecondarySkills
      } : null;

      // Update experience history entries for skills with new costs
      await this.updateSkillExperienceEntries(characterId, heritage, archetype, secondArchetype);

      // Calculate dynamic skill costs
      let totalSkillXpSpent = 0;
      if (character.skills && character.skills.length > 0) {
        for (const skillName of character.skills) {
          const skillCost = this.calculateDynamicSkillCost(skillName, heritage, archetype, secondArchetype);
          totalSkillXpSpent += skillCost;
        }
      }

      // Calculate attribute costs (body/stamina above heritage base)
      const { getAttributeCost } = await import("@shared/schema");
      const heritageBase = heritage?.heritage || { body: 10, stamina: 10 };
      
      let totalAttributeXpSpent = 0;
      if (character.body > heritageBase.body) {
        for (let i = heritageBase.body; i < character.body; i++) {
          totalAttributeXpSpent += getAttributeCost(i, 1);
        }
      }
      if (character.stamina > heritageBase.stamina) {
        for (let i = heritageBase.stamina; i < character.stamina; i++) {
          totalAttributeXpSpent += getAttributeCost(i, 1);
        }
      }

      // Add second archetype cost if applicable
      const secondArchetypeXpSpent = character.secondArchetype ? 50 : 0;

      const newTotalXpSpent = totalSkillXpSpent + totalAttributeXpSpent + secondArchetypeXpSpent;

      // Update character with new calculated values
      await this.updateCharacter(characterId, { 
        totalXpSpent: newTotalXpSpent
      });

    } catch (error) {
      console.error(`Error recalculating dynamic XP for character ${characterId}:`, error);
    }
  }

  // Update experience entries for skills with new dynamic costs
  async updateSkillExperienceEntries(characterId: string, heritage: any, archetype: any, secondArchetype: any): Promise<void> {
    try {
      // Get all skill purchase experience entries for this character
      const skillEntries = await db
        .select()
        .from(experienceEntries)
        .where(and(
          eq(experienceEntries.characterId, characterId),
          sql`amount < 0`,
          sql`reason LIKE 'Skill purchase:%'`
        ));

      // Update each skill entry with current dynamic cost
      for (const entry of skillEntries) {
        const skillMatch = entry.reason.match(/Skill purchase: (.+)/);
        if (skillMatch) {
          const skillName = skillMatch[1];
          const newCost = this.calculateDynamicSkillCost(skillName, heritage, archetype, secondArchetype);
          const newAmount = -newCost; // Negative because it's spending XP
          
          // Only update if the cost has changed
          if (Math.abs(entry.amount) !== newCost) {
            await db
              .update(experienceEntries)
              .set({ 
                amount: newAmount,
                updatedAt: new Date()
              })
              .where(eq(experienceEntries.id, entry.id));
          }
        }
      }
    } catch (error) {
      console.error(`Error updating skill experience entries for character ${characterId}:`, error);
    }
  }

  private calculateDynamicSkillCost(skillName: string, heritage: any, archetype: any, secondArchetype: any): number {
    // Get all skills to find the skill ID
    const allSkills = [...(heritage?.secondarySkills || []), ...(archetype?.primarySkills || []), ...(archetype?.secondarySkills || [])];
    if (secondArchetype) {
      allSkills.push(...(secondArchetype.primarySkills || []), ...(secondArchetype.secondarySkills || []));
    }
    
    const skill = allSkills.find(s => s?.name === skillName);
    if (!skill) return 20; // Default cost if skill not found

    // Check if skill is a primary skill from any archetype (5 XP)
    if (archetype?.primarySkills?.some((s: any) => s?.name === skillName) ||
        secondArchetype?.primarySkills?.some((s: any) => s?.name === skillName)) {
      return 5;
    }
    
    // Check if skill is a secondary skill from heritage or any archetype (10 XP)
    if (heritage?.secondarySkills?.some((s: any) => s?.name === skillName) || 
        archetype?.secondarySkills?.some((s: any) => s?.name === skillName) ||
        secondArchetype?.secondarySkills?.some((s: any) => s?.name === skillName)) {
      return 10;
    }
    
    // Default cost for all other skills (20 XP)
    return 20;
  }

  async deleteExperienceEntry(id: string): Promise<void> {
    // Get the entry before deleting to update character's total experience
    const [entry] = await db.select().from(experienceEntries).where(eq(experienceEntries.id, id));
    
    if (entry) {
      // Delete the entry
      await db.delete(experienceEntries).where(eq(experienceEntries.id, id));
      
      // Update character's total experience and XP spent
      const totalExp = await this.getTotalExperienceByCharacter(entry.characterId);
      const totalXpSpent = await this.calculateTotalXpSpent(entry.characterId);
      
      await this.updateCharacter(entry.characterId, { 
        experience: totalExp,
        totalXpSpent: totalXpSpent
      });
    }
  }

  async getExperienceEntry(id: string): Promise<any | undefined> {
    const [entry] = await db.select().from(experienceEntries).where(eq(experienceEntries.id, id));
    return entry || undefined;
  }

  async updateExperienceEntry(id: string, updateData: { amount: number; reason: string }): Promise<any | undefined> {
    const [updated] = await db
      .update(experienceEntries)
      .set(updateData)
      .where(eq(experienceEntries.id, id))
      .returning();
    
    if (updated) {
      // Update character's total experience and XP spent
      const totalExp = await this.getTotalExperienceByCharacter(updated.characterId);
      const totalXpSpent = await this.calculateTotalXpSpent(updated.characterId);
      
      await this.updateCharacter(updated.characterId, { 
        experience: totalExp,
        totalXpSpent: totalXpSpent
      });
    }
    
    return updated || undefined;
  }

  // Get count of events actually attended by character
  async getAttendedEventsCount(characterId: string): Promise<number> {
    const attendedEventsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventRsvps)
      .where(and(
        eq(eventRsvps.characterId, characterId),
        eq(eventRsvps.attended, true)
      ));

    return attendedEventsCount[0]?.count || 0;
  }

  // Calculate base XP for a single event attendance (official Thrune LARP rulebook progression)
  async calculateEventAttendanceXP(characterId: string): Promise<number> {
    // Count total events attended by character (including current one if this is for attendance calculation)
    const eventCount = await this.getAttendedEventsCount(characterId);

    // Official Thrune LARP XP progression (page 17):
    // Events 1-10: 6 XP each
    // Events 11-20: 5 XP each  
    // Events 21-30: 4 XP each
    // Events 31+: 3 XP each
    if (eventCount <= 10) {
      return 6;
    } else if (eventCount <= 20) {
      return 5;
    } else if (eventCount <= 30) {
      return 4;
    } else {
      return 3;
    }
  }

  // Candle management methods
  async getCandleBalance(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.candles || 0;
  }

  async createCandleTransaction(transaction: InsertCandleTransaction): Promise<CandleTransaction> {
    // Create transaction record
    const [created] = await db.insert(candleTransactions).values(transaction).returning();
    
    // Update user's candle balance
    const user = await this.getUser(transaction.userId);
    if (user) {
      const newBalance = (user.candles || 0) + transaction.amount;
      await db
        .update(users)
        .set({ candles: Math.max(0, newBalance) }) // Ensure non-negative balance
        .where(eq(users.id, transaction.userId));
    }
    
    return created;
  }

  async getCandleTransactionHistory(userId: string): Promise<CandleTransaction[]> {
    return await db
      .select()
      .from(candleTransactions)
      .where(eq(candleTransactions.userId, userId))
      .orderBy(desc(candleTransactions.createdAt));
  }

  async getCandleTransactionsWithAdminInfo(userId: string): Promise<any[]> {
    const transactions = await db
      .select({
        id: candleTransactions.id,
        userId: candleTransactions.userId,
        amount: candleTransactions.amount,
        reason: candleTransactions.reason,
        createdBy: candleTransactions.createdBy,
        createdAt: candleTransactions.createdAt,
        adminName: users.playerName,
      })
      .from(candleTransactions)
      .leftJoin(users, eq(candleTransactions.createdBy, users.id))
      .where(eq(candleTransactions.userId, userId))
      .orderBy(desc(candleTransactions.createdAt));

    return transactions;
  }

  // Event RSVP methods
  async getEventRsvp(eventId: string, characterId: string): Promise<EventRsvp | undefined> {
    const [rsvp] = await db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.characterId, characterId)));
    return rsvp || undefined;
  }

  async createEventRsvp(insertRsvp: InsertEventRsvp): Promise<EventRsvp> {
    const [rsvp] = await db.insert(eventRsvps).values(insertRsvp).returning();
    return rsvp;
  }

  async updateEventRsvp(id: string, rsvp: Partial<EventRsvp>): Promise<EventRsvp> {
    const [updated] = await db
      .update(eventRsvps)
      .set({ ...rsvp, updatedAt: new Date() })
      .where(eq(eventRsvps.id, id))
      .returning();
    return updated;
  }

  async deleteEventRsvp(id: string): Promise<void> {
    // First, remove any experience entries linked to this RSVP
    await db
      .delete(experienceEntries)
      .where(eq(experienceEntries.rsvpId, id));
    
    // Then delete the RSVP
    await db
      .delete(eventRsvps)
      .where(eq(eventRsvps.id, id));
  }

  async getEventRsvps(eventId: string): Promise<EventRsvp[]> {
    return await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, eventId))
      .orderBy(desc(eventRsvps.createdAt));
  }

  async getCharacterRsvps(characterId: string): Promise<EventRsvp[]> {
    return await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.characterId, characterId))
      .orderBy(desc(eventRsvps.createdAt));
  }

  async markAttendance(rsvpId: string, attended: boolean, adminUserId: string): Promise<EventRsvp> {
    const [rsvp] = await db
      .update(eventRsvps)
      .set({ attended, updatedAt: new Date() })
      .where(eq(eventRsvps.id, rsvpId))
      .returning();

    // Award XP based on attendance and purchases
    if (attended && rsvp) {
      // Calculate progressive base XP based on number of events attended
      const baseXp = await this.calculateEventAttendanceXP(rsvp.characterId);
      const purchasedXp = (rsvp.xpPurchases * 1) + (rsvp.xpCandlePurchases * 1); // 1 XP per purchase
      const totalXp = baseXp + purchasedXp;

      await this.createExperienceEntry({
        characterId: rsvp.characterId,
        amount: totalXp,
        reason: `Event attendance (${baseXp} base XP + ${purchasedXp} purchased XP)`,
        eventId: rsvp.eventId,
        rsvpId: rsvp.id,
        awardedBy: adminUserId,
      });
    } else if (attended === false && rsvp) {
      // Remove any existing XP entry for this RSVP if marking as no-show
      await db
        .delete(experienceEntries)
        .where(eq(experienceEntries.rsvpId, rsvp.id));
      
      // Update character's total experience and XP spent after removing entries
      const totalExp = await this.getTotalExperienceByCharacter(rsvp.characterId);
      const totalXpSpent = await this.calculateTotalXpSpent(rsvp.characterId);
      
      await this.updateCharacter(rsvp.characterId, { 
        experience: totalExp,
        totalXpSpent: totalXpSpent
      });
    }

    return rsvp;
  }



  // Role management methods
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(insertRole).returning();
    return role;
  }

  async updateRole(id: string, updateData: Partial<Role>): Promise<Role> {
    const [role] = await db
      .update(roles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return role;
  }

  async deleteRole(id: string): Promise<void> {
    // Check if it's a system role
    const role = await this.getRole(id);
    if (role?.isSystemRole) {
      throw new Error("Cannot delete system roles");
    }
    
    // Move users to default User role before deleting
    const defaultRole = await db.select().from(roles).where(eq(roles.name, "User")).limit(1);
    if (defaultRole.length > 0) {
      await db.update(users).set({ roleId: defaultRole[0].id }).where(eq(users.roleId, id));
    }
    
    await db.delete(roles).where(eq(roles.id, id));
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    
    return result.map(r => r.permission);
  }

  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    // Remove existing permissions
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    
    // Add new permissions
    if (permissionIds.length > 0) {
      const permissionData = permissionIds.map(permissionId => ({
        roleId,
        permissionId,
      }));
      await db.insert(rolePermissions).values(permissionData);
    }
  }

  // Permission management methods
  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions).orderBy(permissions.category, permissions.name);
  }

  async getPermission(id: string): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
    return permission || undefined;
  }

  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const [permission] = await db.insert(permissions).values(insertPermission).returning();
    return permission;
  }

  // Achievement management methods
  async getAllAchievements(): Promise<CustomAchievement[]> {
    return await db.select().from(customAchievements).where(eq(customAchievements.isActive, true)).orderBy(customAchievements.rarity, customAchievements.title);
  }

  async getAchievement(id: string): Promise<CustomAchievement | undefined> {
    const [achievement] = await db.select().from(customAchievements).where(eq(customAchievements.id, id));
    return achievement || undefined;
  }

  async createAchievement(insertAchievement: InsertCustomAchievement): Promise<CustomAchievement> {
    const [achievement] = await db.insert(customAchievements).values(insertAchievement).returning();
    return achievement;
  }

  async updateAchievement(id: string, updateData: Partial<CustomAchievement>): Promise<CustomAchievement> {
    const [achievement] = await db
      .update(customAchievements)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(customAchievements.id, id))
      .returning();
    return achievement;
  }

  async deleteAchievement(id: string): Promise<void> {
    await db.update(customAchievements)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(customAchievements.id, id));
  }

  async getCharacterAchievements(characterId: string): Promise<CharacterAchievement[]> {
    return await db
      .select()
      .from(characterAchievements)
      .where(eq(characterAchievements.characterId, characterId))
      .orderBy(desc(characterAchievements.unlockedAt));
  }

  async unlockAchievement(characterId: string, achievementId: string): Promise<CharacterAchievement> {
    const [achievement] = await db
      .insert(characterAchievements)
      .values({ characterId, achievementId })
      .returning();
    return achievement;
  }

  // Milestone management methods
  async getAllMilestones(): Promise<CustomMilestone[]> {
    return await db.select().from(customMilestones).where(eq(customMilestones.isActive, true)).orderBy(customMilestones.threshold);
  }

  async getMilestone(id: string): Promise<CustomMilestone | undefined> {
    const [milestone] = await db.select().from(customMilestones).where(eq(customMilestones.id, id));
    return milestone || undefined;
  }

  async createMilestone(insertMilestone: InsertCustomMilestone): Promise<CustomMilestone> {
    const [milestone] = await db.insert(customMilestones).values(insertMilestone).returning();
    return milestone;
  }

  async updateMilestone(id: string, updateData: Partial<CustomMilestone>): Promise<CustomMilestone> {
    const [milestone] = await db
      .update(customMilestones)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(customMilestones.id, id))
      .returning();
    return milestone;
  }

  async deleteMilestone(id: string): Promise<void> {
    await db.update(customMilestones)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(customMilestones.id, id));
  }

  // Achievement settings methods
  async getAchievementSettings(): Promise<any> {
    const [settings] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "achievement_rarity_settings"));
    
    if (settings) {
      return JSON.parse(settings.value);
    }
    
    // Default settings
    return {
      commonThreshold: 50,
      rareThreshold: 25,
      epicThreshold: 10,
      legendaryThreshold: 2,
      enableDynamicRarity: true,
    };
  }

  async updateAchievementSettings(newSettings: any): Promise<any> {
    await db
      .insert(systemSettings)
      .values({
        key: "achievement_rarity_settings",
        value: JSON.stringify(newSettings),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: JSON.stringify(newSettings),
          updatedAt: new Date(),
        },
      });
    
    return newSettings;
  }

  async recalculateAchievementRarities(): Promise<void> {
    const settings = await this.getAchievementSettings();
    if (!settings.enableDynamicRarity) return;

    // Get total number of active characters
    const [totalCharsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(characters)
      .where(eq(characters.isActive, true));
    
    const totalChars = totalCharsResult?.count || 0;
    if (totalChars === 0) return;

    // Get all achievements and calculate their completion rates
    const achievements = await db
      .select({
        id: customAchievements.id,
        completionCount: sql<number>`count(${characterAchievements.id})`,
      })
      .from(customAchievements)
      .leftJoin(characterAchievements, eq(customAchievements.id, characterAchievements.achievementId))
      .where(eq(customAchievements.isActive, true))
      .groupBy(customAchievements.id);

    // Update rarity for each achievement based on completion rate
    for (const achievement of achievements) {
      const completionRate = (achievement.completionCount / totalChars) * 100;
      
      let newRarity: "common" | "rare" | "epic" | "legendary";
      if (completionRate >= settings.commonThreshold) {
        newRarity = "common";
      } else if (completionRate >= settings.rareThreshold) {
        newRarity = "rare";
      } else if (completionRate >= settings.epicThreshold) {
        newRarity = "epic";
      } else {
        newRarity = "legendary";
      }

      await db
        .update(customAchievements)
        .set({ rarity: newRarity, updatedAt: new Date() })
        .where(eq(customAchievements.id, achievement.id));
    }
  }

  // System initialization
  async initializeDefaultRolesAndPermissions(): Promise<void> {
    // This method is implemented via SQL above
    // Could be enhanced to check and ensure all defaults exist
  }

  // Refresh character XP values (utility function)
  async refreshCharacterXP(characterId: string): Promise<void> {
    // First ensure all attribute purchases are tracked
    await this.ensureAttributeEntriesExist(characterId);
    
    // Then recalculate totals using dynamic costs (this also updates experience history)
    await this.recalculateCharacterXpWithDynamicCosts(characterId);
    
    // Finally, update total experience and available XP based on updated entries
    const totalExp = await this.getTotalExperienceByCharacter(characterId);
    const totalXpSpent = await this.calculateTotalXpSpent(characterId);
    
    await this.updateCharacter(characterId, { 
      experience: totalExp,
      totalXpSpent: totalXpSpent
    });
  }

  // Recalculate XP for all characters (useful when game data changes)
  async refreshAllCharactersXP(): Promise<void> {
    const allCharacters = await db.select({ id: characters.id }).from(characters);
    
    for (const character of allCharacters) {
      await this.refreshCharacterXP(character.id);
    }
  }

  async ensureAttributeEntriesExist(characterId: string): Promise<void> {
    const [character] = await db.select().from(characters).where(eq(characters.id, characterId));
    if (!character) return;

    // Get existing experience entries
    const existingEntries = await db
      .select()
      .from(experienceEntries)
      .where(eq(experienceEntries.characterId, characterId));

    // Check if body/stamina entries already exist
    const hasBodyEntries = existingEntries.some(e => e.reason.includes('Body increase'));
    const hasStaminaEntries = existingEntries.some(e => e.reason.includes('Stamina increase'));

    const { HERITAGE_BASES, getAttributeCost } = await import("@shared/schema");
    const bases = HERITAGE_BASES[character.heritage as keyof typeof HERITAGE_BASES] || { body: 10, stamina: 10 };

    // Add missing body entries
    if (!hasBodyEntries && character.body > bases.body) {
      for (let i = bases.body; i < character.body; i++) {
        const cost = getAttributeCost(i, 1);
        
        await db.insert(experienceEntries).values({
          characterId: character.id,
          amount: -cost,
          reason: `Body increase: ${i}→${i + 1}`,
          awardedBy: character.userId,
          createdAt: character.createdAt // Use character creation time
        });
      }
    }

    // Add missing stamina entries
    if (!hasStaminaEntries && character.stamina > bases.stamina) {
      for (let i = bases.stamina; i < character.stamina; i++) {
        const cost = getAttributeCost(i, 1);
        
        await db.insert(experienceEntries).values({
          characterId: character.id,
          amount: -cost,
          reason: `Stamina increase: ${i}→${i + 1}`,
          awardedBy: character.userId,
          createdAt: character.createdAt // Use character creation time
        });
      }
    }
  }



  // Dashboard stats
  async getStats(): Promise<{
    totalCharacters: number;
    totalCharactersLastMonth: number;
    activePlayers: number;
    activePlayersLastWeek: number;
    totalExperience: number;
    totalExperienceLastMonth: number;
    upcomingEvents: number;
    nextEvent: { name: string; date: Date; daysUntil: number } | null;
  }> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total characters
    const [characterCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(characters)
      .where(eq(characters.isActive, true));

    // Characters from last month
    const [characterCountLastMonth] = await db
      .select({ count: sql<number>`count(*)` })
      .from(characters)
      .where(and(
        eq(characters.isActive, true),
        sql`${characters.createdAt} <= ${lastMonth}`
      ));

    // Active players
    const [playerCount] = await db
      .select({ count: sql<number>`count(distinct ${characters.userId})` })
      .from(characters)
      .where(eq(characters.isActive, true));

    // Active players from last week
    const [playerCountLastWeek] = await db
      .select({ count: sql<number>`count(distinct ${characters.userId})` })
      .from(characters)
      .where(and(
        eq(characters.isActive, true),
        sql`${characters.createdAt} <= ${lastWeek}`
      ));

    // Total experience
    const [expTotal] = await db
      .select({ total: sum(experienceEntries.amount) })
      .from(experienceEntries)
      .where(sql`${experienceEntries.amount} > 0`);

    // Experience from last month
    const [expTotalLastMonth] = await db
      .select({ total: sum(experienceEntries.amount) })
      .from(experienceEntries)
      .where(and(
        sql`${experienceEntries.amount} > 0`,
        sql`${experienceEntries.createdAt} <= ${lastMonth}`
      ));

    // Upcoming events count
    const [eventCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(eq(events.isActive, true), sql`${events.eventDate} >= now()`));

    // Next upcoming event
    const [nextEvent] = await db
      .select({
        name: events.name,
        eventDate: events.eventDate,
      })
      .from(events)
      .where(and(eq(events.isActive, true), sql`${events.eventDate} >= now()`))
      .orderBy(events.eventDate)
      .limit(1);

    const totalChars = characterCount?.count || 0;
    const totalCharsLastMonth = characterCountLastMonth?.count || 0;
    const activePlayers = playerCount?.count || 0;
    const activePlayersLastWeek = playerCountLastWeek?.count || 0;
    const totalExp = Number(expTotal?.total) || 0;
    const totalExpLastMonth = Number(expTotalLastMonth?.total) || 0;

    let nextEventInfo = null;
    if (nextEvent) {
      const eventDate = new Date(nextEvent.eventDate);
      const timeDiff = eventDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      nextEventInfo = {
        name: nextEvent.name,
        date: eventDate,
        daysUntil: Math.max(0, daysUntil)
      };
    }

    return {
      totalCharacters: totalChars,
      totalCharactersLastMonth: totalCharsLastMonth,
      activePlayers: activePlayers,
      activePlayersLastWeek: activePlayersLastWeek,
      totalExperience: totalExp,
      totalExperienceLastMonth: totalExpLastMonth,
      upcomingEvents: eventCount?.count || 0,
      nextEvent: nextEventInfo,
    };
  }

  async getUpcomingEventsStats(): Promise<{
    count: number;
    nextEvent: { name: string; date: Date; daysUntil: number } | null;
  }> {
    const now = new Date();

    // Upcoming events count
    const [eventCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(eq(events.isActive, true), sql`${events.eventDate} >= now()`));

    // Next upcoming event
    const [nextEvent] = await db
      .select({
        name: events.name,
        eventDate: events.eventDate,
      })
      .from(events)
      .where(and(eq(events.isActive, true), sql`${events.eventDate} >= now()`))
      .orderBy(events.eventDate)
      .limit(1);

    let nextEventInfo = null;
    if (nextEvent) {
      const eventDate = new Date(nextEvent.eventDate);
      const timeDiff = eventDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      nextEventInfo = {
        name: nextEvent.name,
        date: eventDate,
        daysUntil: Math.max(0, daysUntil)
      };
    }

    return {
      count: eventCount?.count || 0,
      nextEvent: nextEventInfo
    };
  }

  // Static milestone overrides
  async updateStaticMilestone(index: number, data: { title: string, description: string, threshold: number, iconName: string, color: string }): Promise<void> {
    await db
      .insert(staticMilestoneOverrides)
      .values({ 
        milestoneIndex: index,
        ...data,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: staticMilestoneOverrides.milestoneIndex,
        set: { 
          ...data,
          updatedAt: new Date()
        }
      });
  }

  async getStaticMilestoneOverrides(): Promise<StaticMilestoneOverride[]> {
    return await db.select().from(staticMilestoneOverrides);
  }

  // Static achievement overrides
  async updateStaticAchievement(index: number, data: { title: string, description: string, iconName: string, rarity: string, conditionType: string, conditionValue?: number }): Promise<void> {
    await db
      .insert(staticAchievementOverrides)
      .values({ 
        achievementIndex: index,
        ...data,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: staticAchievementOverrides.achievementIndex,
        set: { 
          ...data,
          updatedAt: new Date()
        }
      });
  }

  async getStaticAchievementOverrides(): Promise<StaticAchievementOverride[]> {
    return await db.select().from(staticAchievementOverrides);
  }

  // Migration method to create RSVPs for existing event experience entries
  async createMissingRSVPs(): Promise<{ created: number, updated: number }> {
    let created = 0;
    let updated = 0;

    // Get all experience entries that have an eventId but no corresponding RSVP
    const experienceWithEvents = await db
      .select({
        characterId: experienceEntries.characterId,
        eventId: experienceEntries.eventId,
        userId: characters.userId
      })
      .from(experienceEntries)
      .leftJoin(characters, eq(experienceEntries.characterId, characters.id))
      .where(and(
        sql`${experienceEntries.eventId} IS NOT NULL`,
        sql`${characters.userId} IS NOT NULL`
      ));

    // Group by character and event to avoid duplicates
    const uniqueEntries = new Map();
    for (const entry of experienceWithEvents) {
      const key = `${entry.characterId}-${entry.eventId}`;
      if (!uniqueEntries.has(key)) {
        uniqueEntries.set(key, entry);
      }
    }

    for (const [, entry] of Array.from(uniqueEntries)) {
      if (entry.eventId && entry.characterId && entry.userId) {
        // Check if RSVP already exists
        const existingRsvp = await this.getEventRsvp(entry.eventId, entry.characterId);
        
        if (existingRsvp) {
          // Update existing RSVP to mark as attended if not already
          if (!existingRsvp.attended) {
            await this.updateEventRsvp(existingRsvp.id, { attended: true });
            updated++;
          }
        } else {
          // Create new RSVP marked as attended
          await this.createEventRsvp({
            eventId: entry.eventId,
            characterId: entry.characterId,
            userId: entry.userId,
            attended: true,
            xpPurchases: 0,
            xpCandlePurchases: 0
          });
          created++;
        }
      }
    }

    return { created, updated };
  }

  // Dynamic game data methods implementation
  async getAllSkills(): Promise<any[]> {
    const skills = await db
      .select()
      .from(skillsTable)
      .where(eq(skillsTable.isActive, true))
      .orderBy(skillsTable.name);
    
    return skills;
  }

  async getSkill(id: string): Promise<any | undefined> {
    const [skill] = await db.select().from(skillsTable).where(eq(skillsTable.id, id));
    return skill || undefined;
  }

  async createSkill(skill: any): Promise<any> {
    const [newSkill] = await db.insert(skillsTable).values(skill).returning();
    return newSkill;
  }

  async updateSkill(id: string, skill: Partial<any>): Promise<any> {
    const [updatedSkill] = await db
      .update(skillsTable)
      .set({ ...skill, updatedAt: new Date() })
      .where(eq(skillsTable.id, id))
      .returning();
    return updatedSkill;
  }

  async deleteSkill(id: string): Promise<void> {
    await db.update(skillsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(skillsTable.id, id));
  }

  async getAllHeritages(): Promise<any[]> {
    const heritagesList = await db.select().from(heritagesTable).where(eq(heritagesTable.isActive, true)).orderBy(heritagesTable.name);
    
    // Get heritage with secondary skills for each heritage
    const heritagesWithSkills = await Promise.all(
      heritagesList.map(async (heritage) => {
        return await this.getHeritageWithSkills(heritage.id);
      })
    );
    
    return heritagesWithSkills;
  }

  async getHeritage(id: string): Promise<any | undefined> {
    const [heritage] = await db.select().from(heritagesTable).where(eq(heritagesTable.id, id));
    return heritage || undefined;
  }

  async getHeritageWithSkills(id: string): Promise<any | undefined> {
    const heritage = await this.getHeritage(id);
    if (!heritage) return undefined;

    const secondarySkills = await db
      .select({
        id: skillsTable.id,
        name: skillsTable.name,
        description: skillsTable.description,
      })
      .from(heritageSecondarySkills)
      .innerJoin(skillsTable, eq(heritageSecondarySkills.skillId, skillsTable.id))
      .where(eq(heritageSecondarySkills.heritageId, id));

    return {
      ...heritage,
      secondarySkills,
    };
  }

  async createHeritage(heritage: any): Promise<any> {
    const [newHeritage] = await db.insert(heritagesTable).values(heritage).returning();
    return newHeritage;
  }

  async updateHeritage(id: string, heritage: Partial<any>): Promise<any> {
    const [updatedHeritage] = await db
      .update(heritagesTable)
      .set({ ...heritage, updatedAt: new Date() })
      .where(eq(heritagesTable.id, id))
      .returning();
    return updatedHeritage;
  }

  async deleteHeritage(id: string): Promise<void> {
    await db.update(heritagesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(heritagesTable.id, id));
  }

  async getAllCultures(): Promise<any[]> {
    const culturesList = await db
      .select({
        id: culturesTable.id,
        name: culturesTable.name,
        description: culturesTable.description,
        heritageId: culturesTable.heritageId,
        heritageName: heritagesTable.name,
        isActive: culturesTable.isActive,
        createdBy: culturesTable.createdBy,
        createdAt: culturesTable.createdAt,
        updatedAt: culturesTable.updatedAt,
      })
      .from(culturesTable)
      .innerJoin(heritagesTable, eq(culturesTable.heritageId, heritagesTable.id))
      .where(eq(culturesTable.isActive, true))
      .orderBy(culturesTable.name);
    
    // Get culture with secondary skills for each culture
    const culturesWithSkills = await Promise.all(
      culturesList.map(async (culture) => {
        return await this.getCultureWithSkills(culture.id);
      })
    );
    
    return culturesWithSkills;
  }

  async getCulture(id: string): Promise<any | undefined> {
    const [culture] = await db.select().from(culturesTable).where(eq(culturesTable.id, id));
    return culture || undefined;
  }

  async getCultureWithSkills(id: string): Promise<any | undefined> {
    // Get culture with heritage name
    const [culture] = await db
      .select({
        id: culturesTable.id,
        name: culturesTable.name,
        description: culturesTable.description,
        heritageId: culturesTable.heritageId,
        heritageName: heritagesTable.name,
        isActive: culturesTable.isActive,
        createdBy: culturesTable.createdBy,
        createdAt: culturesTable.createdAt,
        updatedAt: culturesTable.updatedAt,
      })
      .from(culturesTable)
      .innerJoin(heritagesTable, eq(culturesTable.heritageId, heritagesTable.id))
      .where(eq(culturesTable.id, id));
    
    if (!culture) return undefined;

    const secondarySkills = await db
      .select({
        id: skillsTable.id,
        name: skillsTable.name,
        description: skillsTable.description,
      })
      .from(cultureSecondarySkills)
      .innerJoin(skillsTable, eq(cultureSecondarySkills.skillId, skillsTable.id))
      .where(eq(cultureSecondarySkills.cultureId, id));

    return {
      ...culture,
      secondarySkills,
    };
  }

  async getCulturesByHeritage(heritageId: string): Promise<any[]> {
    return await db
      .select()
      .from(culturesTable)
      .where(and(eq(culturesTable.heritageId, heritageId), eq(culturesTable.isActive, true)))
      .orderBy(culturesTable.name);
  }

  async createCulture(culture: any): Promise<any> {
    const [newCulture] = await db.insert(culturesTable).values(culture).returning();
    return newCulture;
  }

  async updateCulture(id: string, culture: Partial<any>): Promise<any> {
    const [updatedCulture] = await db
      .update(culturesTable)
      .set({ ...culture, updatedAt: new Date() })
      .where(eq(culturesTable.id, id))
      .returning();
    return updatedCulture;
  }

  async deleteCulture(id: string): Promise<void> {
    await db.update(culturesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(culturesTable.id, id));
  }

  async getAllArchetypes(): Promise<any[]> {
    const archetypesList = await db.select().from(archetypesTable).where(eq(archetypesTable.isActive, true)).orderBy(archetypesTable.name);
    
    // Get archetype with primary and secondary skills for each archetype
    const archetypesWithSkills = await Promise.all(
      archetypesList.map(async (archetype) => {
        return await this.getArchetypeWithSkills(archetype.id);
      })
    );
    
    return archetypesWithSkills;
  }

  async getArchetype(id: string): Promise<any | undefined> {
    const [archetype] = await db.select().from(archetypesTable).where(eq(archetypesTable.id, id));
    return archetype || undefined;
  }

  async getArchetypeWithSkills(id: string): Promise<any | undefined> {
    const archetype = await this.getArchetype(id);
    if (!archetype) return undefined;

    const primarySkills = await db
      .select({
        id: skillsTable.id,
        name: skillsTable.name,
        description: skillsTable.description,
      })
      .from(archetypePrimarySkills)
      .innerJoin(skillsTable, eq(archetypePrimarySkills.skillId, skillsTable.id))
      .where(eq(archetypePrimarySkills.archetypeId, id));

    const secondarySkills = await db
      .select({
        id: skillsTable.id,
        name: skillsTable.name,
        description: skillsTable.description,
      })
      .from(archetypeSecondarySkills)
      .innerJoin(skillsTable, eq(archetypeSecondarySkills.skillId, skillsTable.id))
      .where(eq(archetypeSecondarySkills.archetypeId, id));

    return {
      ...archetype,
      primarySkills,
      secondarySkills,
    };
  }

  async createArchetype(archetype: any): Promise<any> {
    const [newArchetype] = await db.insert(archetypesTable).values(archetype).returning();
    return newArchetype;
  }

  async updateArchetype(id: string, archetype: Partial<any>): Promise<any> {
    const [updatedArchetype] = await db
      .update(archetypesTable)
      .set({ ...archetype, updatedAt: new Date() })
      .where(eq(archetypesTable.id, id))
      .returning();
    return updatedArchetype;
  }

  async deleteArchetype(id: string): Promise<void> {
    await db.update(archetypesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(archetypesTable.id, id));
  }

  // Skill relationship methods
  async addHeritageSecondarySkill(heritageId: string, skillId: string): Promise<void> {
    await db.insert(heritageSecondarySkills).values({ heritageId, skillId });
  }

  async removeHeritageSecondarySkill(heritageId: string, skillId: string): Promise<void> {
    await db.delete(heritageSecondarySkills)
      .where(and(eq(heritageSecondarySkills.heritageId, heritageId), eq(heritageSecondarySkills.skillId, skillId)));
  }

  async addCultureSecondarySkill(cultureId: string, skillId: string): Promise<void> {
    await db.insert(cultureSecondarySkills).values({ cultureId, skillId });
  }

  async removeCultureSecondarySkill(cultureId: string, skillId: string): Promise<void> {
    await db.delete(cultureSecondarySkills)
      .where(and(eq(cultureSecondarySkills.cultureId, cultureId), eq(cultureSecondarySkills.skillId, skillId)));
  }

  async addArchetypePrimarySkill(archetypeId: string, skillId: string): Promise<void> {
    await db.insert(archetypePrimarySkills).values({ archetypeId, skillId });
  }

  async removeArchetypePrimarySkill(archetypeId: string, skillId: string): Promise<void> {
    await db.delete(archetypePrimarySkills)
      .where(and(eq(archetypePrimarySkills.archetypeId, archetypeId), eq(archetypePrimarySkills.skillId, skillId)));
  }

  async addArchetypeSecondarySkill(archetypeId: string, skillId: string): Promise<void> {
    await db.insert(archetypeSecondarySkills).values({ archetypeId, skillId });
  }

  async removeArchetypeSecondarySkill(archetypeId: string, skillId: string): Promise<void> {
    await db.delete(archetypeSecondarySkills)
      .where(and(eq(archetypeSecondarySkills.archetypeId, archetypeId), eq(archetypeSecondarySkills.skillId, skillId)));
  }
}

export const storage = new DatabaseStorage();
