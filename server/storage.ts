import {
  chapters,
  users,
  characters,
  events,
  eventRsvps,
  experienceEntries,
  systemSettings,
  candleTransactions,
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
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

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
  getEventRsvps(eventId: string): Promise<EventRsvp[]>;
  getCharacterRsvps(characterId: string): Promise<EventRsvp[]>;
  markAttendance(rsvpId: string, attended: boolean): Promise<EventRsvp>;

  // Experience methods
  getExperienceByCharacterId(characterId: string): Promise<ExperienceEntry[]>;
  createExperienceEntry(entry: InsertExperienceEntry): Promise<ExperienceEntry>;
  getTotalExperienceByCharacter(characterId: string): Promise<number>;
  calculateTotalXpSpent(characterId: string): Promise<number>;

  // Dashboard stats
  getStats(): Promise<{
    totalCharacters: number;
    activePlayers: number;
    totalExperience: number;
    upcomingEvents: number;
  }>;
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

    const nextNumber = String(usersThisMonth.length + 1).padStart(4, '0');
    return `${chapter.code.toUpperCase()}${month}${year}${nextNumber}`;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
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

  async getAllPlayersWithCharacters(): Promise<any[]> {
    const usersWithCharacters = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
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
  async getCharacter(id: string): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
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
        heritage: characters.heritage,
        culture: characters.culture,
        archetype: characters.archetype,
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
        playerName: users.username,
        playerNumber: users.playerNumber,
      })
      .from(characters)
      .leftJoin(users, eq(characters.userId, users.id))
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
    
    // Create experience entries for each starting skill purchased at character creation
    if (insertCharacter.skills && insertCharacter.skills.length > 0) {
      // Import skill costs from shared schema
      const { getSkillCost } = await import("../shared/schema");
      
      for (const skill of insertCharacter.skills) {
        const skillData = getSkillCost(skill as any, insertCharacter.heritage as any, insertCharacter.culture as any, insertCharacter.archetype as any);
        await this.createExperienceEntry({
          characterId: character.id,
          amount: -skillData.cost, // Negative because it's spending XP
          reason: `Skill purchase: ${skill}`,
          awardedBy: insertCharacter.userId,
        });
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
    
    // Update character's total experience (but no level)
    const totalExp = await this.getTotalExperienceByCharacter(insertEntry.characterId);
    await this.updateCharacter(insertEntry.characterId, { 
      experience: totalExp
    });
    
    return entry;
  }

  async getTotalExperienceByCharacter(characterId: string): Promise<number> {
    const result = await db
      .select({ total: sum(experienceEntries.amount) })
      .from(experienceEntries)
      .where(eq(experienceEntries.characterId, characterId));
    
    return Number(result[0]?.total) || 0;
  }

  async calculateTotalXpSpent(characterId: string): Promise<number> {
    // Get all negative experience entries (spent XP)
    const spentEntries = await db
      .select({ amount: experienceEntries.amount })
      .from(experienceEntries)
      .where(and(
        eq(experienceEntries.characterId, characterId),
        sql`${experienceEntries.amount} < 0`
      ));

    // Sum all spent XP (convert negative to positive)
    const totalSpent = spentEntries.reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
    
    // Add initial 25 XP that every character starts with (considered "spent" on creation)
    return totalSpent + 25;
  }

  async deleteExperienceEntry(id: string): Promise<void> {
    // Get the entry before deleting to update character's total experience
    const [entry] = await db.select().from(experienceEntries).where(eq(experienceEntries.id, id));
    
    if (entry) {
      // Delete the entry
      await db.delete(experienceEntries).where(eq(experienceEntries.id, id));
      
      // Update character's total experience
      const totalExp = await this.getTotalExperienceByCharacter(entry.characterId);
      await this.updateCharacter(entry.characterId, { 
        experience: totalExp
      });
    }
  }

  // Calculate XP based on events attended (attendance-based progression)
  async calculateEventAttendanceXP(characterId: string): Promise<number> {
    // Count total events attended by character
    const attendedEventsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventRsvps)
      .where(and(
        eq(eventRsvps.characterId, characterId),
        eq(eventRsvps.attended, true)
      ));

    const eventCount = attendedEventsCount[0]?.count || 0;

    // Progressive XP system based on events attended
    // First event: 3 XP, Second: 4 XP, Third: 5 XP, then 6 XP for all subsequent events
    let baseXP = 0;
    if (eventCount >= 1) baseXP += 3;
    if (eventCount >= 2) baseXP += 4;
    if (eventCount >= 3) baseXP += 5;
    if (eventCount >= 4) baseXP += (eventCount - 3) * 6;

    return baseXP;
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

  async markAttendance(rsvpId: string, attended: boolean): Promise<EventRsvp> {
    const [rsvp] = await db
      .update(eventRsvps)
      .set({ attended, updatedAt: new Date() })
      .where(eq(eventRsvps.id, rsvpId))
      .returning();

    // Award XP based on attendance and purchases
    if (attended && rsvp) {
      const baseXp = 3; // Base XP for attending event
      const purchasedXp = (rsvp.xpPurchases * 1) + (rsvp.xpCandlePurchases * 1); // 1 XP per purchase
      const totalXp = baseXp + purchasedXp;

      await this.createExperienceEntry({
        characterId: rsvp.characterId,
        amount: totalXp,
        reason: `Event attendance with ${rsvp.xpPurchases} XP purchases and ${rsvp.xpCandlePurchases} XP candle purchases`,
        eventId: rsvp.eventId,
        rsvpId: rsvp.id,
        awardedBy: rsvp.userId,
      });
    }

    return rsvp;
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
}

export const storage = new DatabaseStorage();
