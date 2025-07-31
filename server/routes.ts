import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import { insertChapterSchema, insertUserSchema, insertCharacterSchema, insertEventSchema, insertEventRsvpSchema, insertExperienceEntrySchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";

const PgSession = ConnectPgSimple(session);

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  chapterId: z.string().optional(),
});

declare module "express-session" {
  interface SessionData {
    userId?: string;
    isAdmin?: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    })
  );

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session.userId || !req.session.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, playerName, email, password, chapterId } = req.body;
      
      if (!username || !playerName || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        playerName,
        email,
        password: hashedPassword,
        chapterId,
        isAdmin: false,
      });

      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;

      res.json({ user: { id: user.id, username: user.username, playerName: user.playerName, email: user.email, isAdmin: user.isAdmin, playerNumber: user.playerNumber, chapterId: user.chapterId } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;

      res.json({ user: { id: user.id, username: user.username, playerName: user.playerName, email: user.email, isAdmin: user.isAdmin, playerNumber: user.playerNumber, chapterId: user.chapterId } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: { id: user.id, username: user.username, playerName: user.playerName, email: user.email, isAdmin: user.isAdmin, playerNumber: user.playerNumber, chapterId: user.chapterId } });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Character routes
  app.get("/api/characters", requireAuth, async (req, res) => {
    try {
      let characters;
      if (req.session.isAdmin) {
        characters = await storage.getAllCharacters();
      } else {
        characters = await storage.getCharactersByUserId(req.session.userId!);
      }
      
      // Add total XP spent to each character
      const charactersWithXp = await Promise.all(
        characters.map(async (character) => {
          const totalXpSpent = await storage.calculateTotalXpSpent(character.id);
          return { ...character, totalXpSpent };
        })
      );
      
      res.json(charactersWithXp);
    } catch (error) {
      res.status(500).json({ message: "Failed to get characters" });
    }
  });

  app.get("/api/characters/:id", requireAuth, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Check ownership unless admin
      if (!req.session.isAdmin && character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Calculate total XP spent including initial 25 XP
      const totalXpSpent = await storage.calculateTotalXpSpent(req.params.id);
      
      res.json({ ...character, totalXpSpent });
    } catch (error) {
      res.status(500).json({ message: "Failed to get character" });
    }
  });

  app.post("/api/characters", requireAuth, async (req, res) => {
    try {
      const characterData = insertCharacterSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      
      const character = await storage.createCharacter(characterData);
      res.status(201).json(character);
    } catch (error) {
      console.error("Character creation error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create character" });
    }
  });

  app.put("/api/characters/:id", requireAuth, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Check ownership unless admin
      if (!req.session.isAdmin && character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedCharacter = await storage.updateCharacter(req.params.id, req.body);
      res.json(updatedCharacter);
    } catch (error) {
      res.status(400).json({ message: "Failed to update character" });
    }
  });

  app.delete("/api/characters/:id", requireAuth, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Check ownership unless admin
      if (!req.session.isAdmin && character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteCharacter(req.params.id);
      res.json({ message: "Character deleted successfully" });
    } catch (error) {
      console.error("Character deletion error:", error);
      res.status(500).json({ message: "Failed to delete character" });
    }
  });

  // Experience routes
  app.get("/api/characters/:id/experience", requireAuth, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Check ownership unless admin
      if (!req.session.isAdmin && character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const experience = await storage.getExperienceByCharacterId(req.params.id);
      res.json(experience);
    } catch (error) {
      res.status(500).json({ message: "Failed to get experience entries" });
    }
  });

  app.post("/api/experience", requireAdmin, async (req, res) => {
    try {
      const entryData = insertExperienceEntrySchema.parse({
        ...req.body,
        awardedBy: req.session.userId,
      });
      
      const entry = await storage.createExperienceEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Experience entry error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create experience entry" });
    }
  });

  app.delete("/api/experience/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteExperienceEntry(req.params.id);
      res.json({ message: "Experience entry deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete experience entry" });
    }
  });

  // Refresh character XP values (admin only)
  app.post("/api/admin/refresh-character-xp/:id", requireAdmin, async (req, res) => {
    try {
      await storage.refreshCharacterXP(req.params.id);
      res.json({ message: "Character XP values refreshed successfully" });
    } catch (error) {
      console.error("Character XP refresh error:", error);
      res.status(500).json({ message: "Failed to refresh character XP values" });
    }
  });

  // Candle management routes
  app.get("/api/users/:id/candles", requireAdmin, async (req, res) => {
    try {
      const balance = await storage.getCandleBalance(req.params.id);
      const transactions = await storage.getCandleTransactionHistory(req.params.id);
      res.json({ balance, transactions });
    } catch (error) {
      res.status(500).json({ message: "Failed to get candle data" });
    }
  });

  app.post("/api/users/:id/candles", requireAdmin, async (req, res) => {
    try {
      const { amount, reason } = req.body;
      if (!amount || !reason) {
        return res.status(400).json({ message: "Amount and reason are required" });
      }

      const transaction = await storage.createCandleTransaction({
        userId: req.params.id,
        amount: parseInt(amount),
        reason,
        createdBy: req.session.userId!,
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create candle transaction" });
    }
  });

  // Get attendance-based XP for character
  app.get("/api/characters/:id/attendance-xp", requireAuth, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Check ownership unless admin
      if (!req.session.isAdmin && character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const attendanceXP = await storage.calculateEventAttendanceXP(req.params.id);
      res.json({ attendanceXP });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate attendance XP" });
    }
  });

  // Event routes
  app.get("/api/events", requireAuth, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to get events" });
    }
  });

  app.post("/api/events", requireAdmin, async (req, res) => {
    try {
      const eventData = insertEventSchema.parse({
        ...req.body,
        eventDate: new Date(req.body.eventDate),
        createdBy: req.session.userId,
      });
      
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Event creation error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create event" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/admin/players", requireAdmin, async (req, res) => {
    try {
      const players = await storage.getAllPlayersWithCharacters();
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Failed to get players" });
    }
  });

  app.put("/api/admin/players/:id/player-number", requireAdmin, async (req, res) => {
    try {
      const { playerNumber } = req.body;
      await storage.updateUserPlayerNumber(req.params.id, playerNumber);
      res.json({ message: "Player number updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update player number" });
    }
  });

  app.post("/api/admin/characters/:id/add-skill", requireAdmin, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const { skill, cost } = req.body;
      
      console.log("Admin add skill request body:", req.body);
      console.log("Skill:", skill, "Cost:", cost, "Type of cost:", typeof cost);
      
      if (!skill || cost === undefined || cost === null || cost <= 0) {
        return res.status(400).json({ message: "Invalid skill or cost" });
      }

      // Check if character already has this skill
      if (character.skills && character.skills.includes(skill)) {
        return res.status(400).json({ message: "Character already has this skill" });
      }

      // Add skill to character
      const updatedSkills = [...(character.skills || []), skill];
      const newTotalXpSpent = (character.totalXpSpent || 0) + cost;
      
      await storage.updateCharacter(req.params.id, {
        skills: updatedSkills,
        totalXpSpent: newTotalXpSpent,
        experience: character.experience - cost // Deduct XP from available pool
      });

      // Create experience entry for the spending
      await storage.createExperienceEntry({
        characterId: req.params.id,
        amount: -cost,
        reason: `Admin added skill: ${skill}`,
        awardedBy: req.session.userId!,
      });

      res.json({ message: "Skill added successfully and XP totals updated" });
    } catch (error) {
      console.error("Admin add skill error:", error);
      res.status(500).json({ message: "Failed to add skill" });
    }
  });

  app.post("/api/admin/characters/:id/remove-skill", requireAdmin, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const { skill, cost } = req.body;
      
      if (!skill || !cost || cost <= 0) {
        return res.status(400).json({ message: "Invalid skill or cost" });
      }

      // Check if character has this skill
      if (!character.skills || !character.skills.includes(skill)) {
        return res.status(400).json({ message: "Character does not have this skill" });
      }

      // Remove skill from character
      const updatedSkills = character.skills.filter(s => s !== skill);
      
      // Create refund experience entry (positive amount to add XP back)
      await storage.createExperienceEntry({
        characterId: req.params.id,
        amount: cost, // Positive amount adds XP back to available pool
        reason: `Admin refunded skill: ${skill}`,
        awardedBy: req.session.userId!,
      });

      // Update character with new skills list and refresh XP totals
      await storage.updateCharacter(req.params.id, {
        skills: updatedSkills,
      });
      
      // Refresh XP totals after the refund
      await storage.refreshCharacterXP(req.params.id);

      res.json({ message: "Skill removed successfully and XP refunded" });
    } catch (error) {
      console.error("Admin remove skill error:", error);
      res.status(500).json({ message: "Failed to remove skill" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // Get specific user details for admin
  app.get("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get user's characters for admin
  app.get("/api/admin/users/:id/characters", requireAdmin, async (req, res) => {
    try {
      const characters = await storage.getCharactersByUserId(req.params.id);
      res.json(characters);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user characters" });
    }
  });

  // Award experience to character (admin only)
  app.post("/api/characters/:id/experience", requireAdmin, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const entryData = insertExperienceEntrySchema.parse({
        characterId: req.params.id,
        amount: req.body.amount,
        reason: req.body.reason,
        awardedBy: req.session.userId,
      });
      
      const entry = await storage.createExperienceEntry(entryData);
      
      // Update character's total experience
      await storage.updateCharacter(req.params.id, {
        experience: character.experience + req.body.amount
      });
      
      res.status(201).json(entry);
    } catch (error) {
      console.error("Experience award error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to award experience" });
    }
  });

  // Purchase skill for character (player or admin)
  app.post("/api/characters/:id/purchase-skill", requireAuth, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Check ownership unless admin
      if (!req.session.isAdmin && character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if character is retired
      if (character.isRetired) {
        return res.status(400).json({ message: "Cannot purchase skills for retired characters" });
      }

      const { skill, cost } = req.body;
      
      if (!skill || !cost || cost <= 0) {
        return res.status(400).json({ message: "Invalid skill or cost" });
      }

      if (character.experience < cost) {
        return res.status(400).json({ message: "Insufficient experience points" });
      }

      // Check if character already has this skill
      if (character.skills.includes(skill)) {
        return res.status(400).json({ message: "Character already has this skill" });
      }

      // Add skill to character and deduct experience
      const updatedSkills = [...character.skills, skill];
      await storage.updateCharacter(req.params.id, {
        skills: updatedSkills,
      });

      // Create experience entry for the spending (this will update experience automatically)
      await storage.createExperienceEntry({
        characterId: req.params.id,
        amount: -cost,
        reason: `Purchased skill: ${skill}`,
        awardedBy: req.session.userId!,
      });

      res.json({ message: "Skill purchased successfully" });
    } catch (error) {
      console.error("Skill purchase error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to purchase skill" });
    }
  });

  // Increase character attribute (player or admin)
  app.post("/api/characters/:id/increase-attribute", requireAuth, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Check ownership unless admin
      if (!req.session.isAdmin && character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if character is retired
      if (character.isRetired) {
        return res.status(400).json({ message: "Cannot increase attributes for retired characters" });
      }

      const { attribute, amount, cost } = req.body;
      
      if (!attribute || !amount || !cost || amount <= 0 || cost <= 0) {
        return res.status(400).json({ message: "Invalid attribute, amount, or cost" });
      }

      if (attribute !== 'body' && attribute !== 'stamina') {
        return res.status(400).json({ message: "Invalid attribute type" });
      }

      if (character.experience < cost) {
        return res.status(400).json({ message: "Insufficient experience points" });
      }

      // Update character attribute (don't manually deduct experience)
      const updates: any = {};
      
      if (attribute === 'body') {
        updates.body = character.body + amount;
      } else {
        updates.stamina = character.stamina + amount;
      }

      await storage.updateCharacter(req.params.id, updates);

      // Create experience entry for the spending (this will update experience automatically)
      await storage.createExperienceEntry({
        characterId: req.params.id,
        amount: -cost,
        reason: `Increased ${attribute} by ${amount} point${amount !== 1 ? 's' : ''}`,
        awardedBy: req.session.userId!,
      });

      res.json({ message: "Attribute increased successfully" });
    } catch (error) {
      console.error("Attribute increase error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to increase attribute" });
    }
  });

  // Retire character (player or admin)
  app.post("/api/characters/:id/retire", requireAuth, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Check ownership unless admin
      if (!req.session.isAdmin && character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { reason } = req.body;
      
      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ message: "Retirement reason is required" });
      }

      if (character.isRetired) {
        return res.status(400).json({ message: "Character is already retired" });
      }

      // Update character to retired status
      await storage.updateCharacter(req.params.id, {
        isRetired: true,
        retiredAt: new Date(),
        retiredBy: req.session.userId!,
        retirementReason: reason.trim(),
        isActive: false // Also set inactive when retired
      });

      res.json({ message: "Character retired successfully" });
    } catch (error) {
      console.error("Character retirement error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to retire character" });
    }
  });

  // Chapter routes
  app.get("/api/chapters", async (req, res) => {
    try {
      const chapters = await storage.getAllChapters();
      res.json(chapters);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chapters" });
    }
  });

  app.get("/api/chapters/:id", requireAuth, async (req, res) => {
    try {
      const chapter = await storage.getChapter(req.params.id);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json(chapter);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chapter" });
    }
  });

  app.post("/api/chapters", requireAdmin, async (req, res) => {
    try {
      const chapterData = insertChapterSchema.parse(req.body);
      const chapter = await storage.createChapter({
        ...chapterData,
        createdBy: req.session.userId!,
      });
      res.json(chapter);
    } catch (error) {
      console.error("Chapter creation error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create chapter" });
    }
  });

  app.patch("/api/chapters/:id", requireAdmin, async (req, res) => {
    try {
      const updateData = insertChapterSchema.partial().parse(req.body);
      const chapter = await storage.updateChapter(req.params.id, updateData);
      res.json(chapter);
    } catch (error) {
      console.error("Chapter update error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update chapter" });
    }
  });

  app.delete("/api/chapters/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteChapter(req.params.id);
      res.json({ message: "Chapter deactivated successfully" });
    } catch (error) {
      console.error("Chapter deletion error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to deactivate chapter" });
    }
  });

  app.post("/api/chapters/:id/generate-player-number", requireAdmin, async (req, res) => {
    try {
      const playerNumber = await storage.generatePlayerNumber(req.params.id);
      res.json({ playerNumber });
    } catch (error) {
      console.error("Player number generation error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to generate player number" });
    }
  });

  // Event RSVP routes
  app.get("/api/events/:eventId/rsvps", requireAuth, async (req, res) => {
    try {
      const rsvps = await storage.getEventRsvps(req.params.eventId);
      res.json(rsvps);
    } catch (error) {
      res.status(500).json({ message: "Failed to get event RSVPs" });
    }
  });

  app.get("/api/characters/:characterId/rsvps", requireAuth, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Check ownership unless admin
      if (!req.session.isAdmin && character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const rsvps = await storage.getCharacterRsvps(req.params.characterId);
      res.json(rsvps);
    } catch (error) {
      res.status(500).json({ message: "Failed to get character RSVPs" });
    }
  });

  app.post("/api/events/:eventId/rsvp", requireAuth, async (req, res) => {
    try {
      const rsvpData = insertEventRsvpSchema.parse(req.body);
      
      // Validate XP purchases limits
      if (rsvpData.xpPurchases > 2 || rsvpData.xpCandlePurchases > 2) {
        return res.status(400).json({ message: "Maximum 2 XP purchases and 2 XP candle purchases allowed" });
      }

      // Check if character belongs to user (unless admin)
      const character = await storage.getCharacter(rsvpData.characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      if (!req.session.isAdmin && character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const rsvp = await storage.createEventRsvp({
        ...rsvpData,
        eventId: req.params.eventId,
        userId: req.session.userId!,
      });

      res.json(rsvp);
    } catch (error) {
      console.error("RSVP creation error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create RSVP" });
    }
  });

  app.patch("/api/rsvps/:id", requireAuth, async (req, res) => {
    try {
      const updateData = insertEventRsvpSchema.partial().parse(req.body);
      
      // Validate XP purchases limits
      if (updateData.xpPurchases && updateData.xpPurchases > 2) {
        return res.status(400).json({ message: "Maximum 2 XP purchases allowed" });
      }
      if (updateData.xpCandlePurchases && updateData.xpCandlePurchases > 2) {
        return res.status(400).json({ message: "Maximum 2 XP candle purchases allowed" });
      }

      const rsvp = await storage.updateEventRsvp(req.params.id, updateData);
      res.json(rsvp);
    } catch (error) {
      console.error("RSVP update error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update RSVP" });
    }
  });

  app.post("/api/rsvps/:id/attendance", requireAdmin, async (req, res) => {
    try {
      const { attended } = req.body;
      const rsvp = await storage.markAttendance(req.params.id, attended);
      res.json(rsvp);
    } catch (error) {
      console.error("Attendance marking error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to mark attendance" });
    }
  });

  // User profile routes
  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { playerName } = req.body;
      
      if (!playerName || !playerName.trim()) {
        return res.status(400).json({ message: "Player name is required" });
      }

      const updatedUser = await storage.updateUser(req.session.userId!, { 
        playerName: playerName.trim() 
      });

      res.json({ 
        user: { 
          id: updatedUser.id, 
          username: updatedUser.username, 
          playerName: updatedUser.playerName,
          email: updatedUser.email, 
          isAdmin: updatedUser.isAdmin 
        } 
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
