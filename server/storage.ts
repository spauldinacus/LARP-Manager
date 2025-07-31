import {
  chapters,
  users,
  characters,
  events,
  experienceEntries,
  systemSettings,
  type Chapter,
  type InsertChapter,
  type User,
  type InsertUser,
  type Character,
  type InsertCharacter,
  type Event,
  type InsertEvent,
  type ExperienceEntry,
  type InsertExperienceEntry,
  type SystemSetting,
  type InsertSystemSetting,
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

  // Experience methods
  getExperienceByCharacterId(characterId: string): Promise<ExperienceEntry[]>;
  createExperienceEntry(entry: InsertExperienceEntry): Promise<ExperienceEntry>;
  getTotalExperienceByCharacter(characterId: string): Promise<number>;

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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
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

  async getAllCharacters(): Promise<Character[]> {
    return await db.select().from(characters).orderBy(desc(characters.createdAt));
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db.insert(characters).values(insertCharacter).returning();
    return character;
  }

  async updateCharacter(id: string, character: Partial<Character>): Promise<Character> {
    const [updated] = await db
      .update(characters)
      .set({ ...character, updatedAt: new Date() })
      .where(eq(characters.id, id))
      .returning();
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
  async getExperienceByCharacterId(characterId: string): Promise<ExperienceEntry[]> {
    return await db
      .select()
      .from(experienceEntries)
      .where(eq(experienceEntries.characterId, characterId))
      .orderBy(desc(experienceEntries.createdAt));
  }

  async createExperienceEntry(insertEntry: InsertExperienceEntry): Promise<ExperienceEntry> {
    const [entry] = await db.insert(experienceEntries).values(insertEntry).returning();
    
    // Update character's total experience
    const totalExp = await this.getTotalExperienceByCharacter(insertEntry.characterId);
    await this.updateCharacter(insertEntry.characterId, { 
      experience: totalExp,
      level: Math.floor(totalExp / 10) + 1 // Simple leveling formula
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

  // Dashboard stats
  async getStats(): Promise<{
    totalCharacters: number;
    activePlayers: number;
    totalExperience: number;
    upcomingEvents: number;
  }> {
    const [characterCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(characters)
      .where(eq(characters.isActive, true));

    const [playerCount] = await db
      .select({ count: sql<number>`count(distinct ${characters.userId})` })
      .from(characters)
      .where(eq(characters.isActive, true));

    const [expTotal] = await db
      .select({ total: sum(experienceEntries.amount) })
      .from(experienceEntries);

    const [eventCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(eq(events.isActive, true), sql`${events.eventDate} >= now()`));

    return {
      totalCharacters: characterCount?.count || 0,
      activePlayers: playerCount?.count || 0,
      totalExperience: Number(expTotal?.total) || 0,
      upcomingEvents: eventCount?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
