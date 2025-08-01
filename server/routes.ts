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
    userRole?: string;
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
        secure: false, // Replit deployments don't use HTTPS internally
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax', // Better cookie compatibility
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

  // Middleware for role-based access control
  const requirePermission = (permission: string) => {
    return (req: any, res: any, next: any) => {
      const userRole = req.session.userRole || 'user';
      
      // Import permission helper functions
      const { hasPermission } = require("@shared/schema");
      
      if (!hasPermission(userRole, permission) && !req.session.isAdmin) {
        return res.status(403).json({ message: `Permission required: ${permission}` });
      }
      next();
    };
  };

  // Middleware for role-based access
  const requireRole = (requiredRole: string) => {
    return (req: any, res: any, next: any) => {
      const userRole = req.session.userRole || 'user';
      const { isAtLeastRole } = require("@shared/schema");
      
      if (!isAtLeastRole(userRole, requiredRole) && !req.session.isAdmin) {
        return res.status(403).json({ message: `Role required: ${requiredRole}` });
      }
      next();
    };
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
        chapterId: chapterId || null,
        isAdmin: false,
      });

      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;
      req.session.userRole = user.roleId || 'user';

      res.json({ user: { id: user.id, username: user.username, playerName: user.playerName, email: user.email, isAdmin: user.isAdmin, roleId: user.roleId, candles: user.candles || 0, playerNumber: user.playerNumber, chapterId: user.chapterId } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginSchema = z.object({
        email: z.string(),
        password: z.string(),
      });
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
      req.session.userRole = user.roleId || 'user';

      res.json({ user: { id: user.id, username: user.username, playerName: user.playerName, email: user.email, isAdmin: user.isAdmin, roleId: user.roleId, candles: user.candles || 0, playerNumber: user.playerNumber, chapterId: user.chapterId } });
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
      const { password: _, ...userWithoutPassword } = user;
      const userResponse = {
        ...userWithoutPassword,
        roleId: user.roleId || 'user',
        candles: user.candles || 0
      };
      res.json({ user: userResponse });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // User settings routes
  app.put("/api/users/settings", requireAuth, async (req, res) => {
    try {
      const { playerName, chapterId } = req.body;
      
      if (!playerName || typeof playerName !== 'string') {
        return res.status(400).json({ message: "Player name is required" });
      }
      
      const updateData = {
        playerName: playerName.trim(),
        chapterId: chapterId || null,
      };
      
      const updatedUser = await storage.updateUser(req.session.userId!, updateData);
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("User settings update error:", error);
      res.status(500).json({ message: "Failed to update settings" });
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
      
      // Return characters with their stored totalXpSpent values (skip calculation for now)
      const charactersWithXp = characters.map(character => ({
        ...character,
        totalXpSpent: character.totalXpSpent || 25
      }));
      
      res.json(charactersWithXp);
    } catch (error) {
      console.error("Characters API error:", error);
      res.status(500).json({ message: "Failed to get characters" });
    }
  });

  // Public character names endpoint - returns basic info for all characters for RSVP displays
  app.get("/api/characters/public", requireAuth, async (req, res) => {
    try {
      const characters = await storage.getAllCharacters();
      
      // Return only public information needed for RSVPs
      const publicCharacters = characters.map(character => ({
        id: character.id,
        name: character.name,
        heritage: character.heritage,
        culture: character.culture,
        archetype: character.archetype,
        userId: character.userId,
        isActive: character.isActive
      }));
      
      res.json(publicCharacters);
    } catch (error) {
      res.status(500).json({ message: "Failed to get public character data" });
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
      
      // Create character with initial data
      const character = await storage.createCharacter(characterData);
      
      // Calculate XP spent on creation (skills + attributes)
      const totalXpSpent = await storage.calculateTotalXpSpent(character.id);
      
      // Update character with correct experience values
      const updatedCharacter = await storage.updateCharacter(character.id, {
        totalXpSpent,
        experience: 25 - totalXpSpent // Remaining XP after initial purchases
      });
      
      res.status(201).json(updatedCharacter);
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

  // Calculate character XP spent endpoint
  app.post("/api/characters/:id/xp-spent", requireAuth, async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Check ownership unless admin
      if (!req.session.isAdmin && character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const totalXpSpent = await storage.calculateTotalXpSpent(req.params.id);
      
      // Update character with calculated XP
      await storage.updateCharacter(req.params.id, { totalXpSpent });
      
      res.json({ totalXpSpent });
    } catch (error) {
      console.error("XP calculation error:", error);
      res.status(500).json({ message: "Failed to calculate character XP spent" });
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

  // Rebuild XP tracking for all characters (admin only)
  app.post("/api/admin/rebuild-all-character-xp", requireAdmin, async (req, res) => {
    try {
      const characters = await storage.getAllCharacters();
      let processedCount = 0;
      
      for (const character of characters) {
        await storage.refreshCharacterXP(character.id);
        processedCount++;
      }
      
      res.json({ 
        message: `Successfully rebuilt XP tracking for ${processedCount} characters`,
        processedCount 
      });
    } catch (error) {
      console.error("Rebuild all character XP error:", error);
      res.status(500).json({ message: "Failed to rebuild character XP tracking" });
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
      const eventsAttended = await storage.getAttendedEventsCount(req.params.id);
      res.json({ 
        attendanceXP,
        eventsAttended 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate attendance XP" });
    }
  });

  // Event routes
  // Public upcoming events endpoint for all users
  app.get("/api/events/upcoming", requireAuth, async (req, res) => {
    try {
      const upcomingEventsStats = await storage.getUpcomingEventsStats();
      res.json(upcomingEventsStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get upcoming events" });
    }
  });

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

  app.patch("/api/events/:id", requireAdmin, async (req, res) => {
    try {
      // Transform eventDate string to Date if present
      const body = { ...req.body };
      if (body.eventDate && typeof body.eventDate === 'string') {
        body.eventDate = new Date(body.eventDate);
      }
      
      const eventData = insertEventSchema.partial().parse(body);
      const event = await storage.updateEvent(req.params.id, eventData);
      res.json(event);
    } catch (error) {
      console.error("Event update error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update event" });
    }
  });

  app.patch("/api/events/:id/status", requireAdmin, async (req, res) => {
    try {
      const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
      const event = await storage.updateEvent(req.params.id, { isActive });
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update event status" });
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

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deleting yourself
      if (req.params.id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("User deletion error:", error);
      res.status(500).json({ message: "Failed to delete user" });
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

  // Update user role (admin only)
  app.patch("/api/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { roleId, role } = req.body;
      
      // Support both roleId and role parameters for compatibility
      const targetRole = roleId || role;
      
      if (!targetRole) {
        return res.status(400).json({ message: "Role ID or role is required" });
      }

      // For simple admin flag setting, handle basic roles
      if (targetRole === 'admin' || targetRole === 'user') {
        const isAdmin = targetRole === 'admin';
        const updatedUser = await storage.updateUser(req.params.id, { isAdmin });
        const { password: _, ...userWithoutPassword } = updatedUser;
        return res.json({ user: userWithoutPassword });
      }

      // For more complex role system, use the role management
      const updatedUser = await storage.updateUserRole(req.params.id, targetRole);
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
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
        eventId: req.body.eventId || null,
        awardedBy: req.session.userId,
      });
      
      const entry = await storage.createExperienceEntry(entryData);
      
      // Refresh character XP totals
      await storage.refreshCharacterXP(req.params.id);
      
      res.status(201).json(entry);
    } catch (error) {
      console.error("Experience award error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to award experience" });
    }
  });

  // Edit experience entry (admin only)
  app.put("/api/experience/:id", requireAdmin, async (req, res) => {
    try {
      const { amount, reason } = req.body;
      
      if (!amount || !reason) {
        return res.status(400).json({ message: "Amount and reason are required" });
      }

      const entry = await storage.updateExperienceEntry(req.params.id, {
        amount,
        reason,
      });
      
      if (!entry) {
        return res.status(404).json({ message: "Experience entry not found" });
      }

      // Refresh character XP totals
      await storage.refreshCharacterXP(entry.characterId);
      
      res.json(entry);
    } catch (error) {
      console.error("Experience edit error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update experience entry" });
    }
  });

  // Delete experience entry (admin only)
  app.delete("/api/experience/:id", requireAdmin, async (req, res) => {
    try {
      const entry = await storage.getExperienceEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "Experience entry not found" });
      }

      await storage.deleteExperienceEntry(req.params.id);
      
      // Refresh character XP totals
      await storage.refreshCharacterXP(entry.characterId);
      
      res.json({ message: "Experience entry deleted successfully" });
    } catch (error) {
      console.error("Experience delete error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete experience entry" });
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

  // Purchase second archetype for a character
  app.post("/api/characters/:id/second-archetype", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { archetype } = req.body;

      // Verify the character belongs to the user
      const character = await storage.getCharacter(id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      if (character.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Check if character is retired
      if (character.isRetired) {
        return res.status(400).json({ message: "Cannot purchase second archetype for retired characters" });
      }

      // Check if character already has a second archetype
      if (character.secondArchetype) {
        return res.status(400).json({ message: "Character already has a second archetype" });
      }

      // Check if they have enough experience
      if (character.experience < 50) {
        return res.status(400).json({ message: "Insufficient experience points (need 50 XP)" });
      }

      // Check if archetype is different from primary
      if (character.archetype === archetype) {
        return res.status(400).json({ message: "Cannot select the same archetype as secondary" });
      }

      // Update character with second archetype and reduce experience
      const updatedCharacter = await storage.updateCharacter(id, {
        secondArchetype: archetype,
        experience: character.experience - 50,
        totalXpSpent: character.totalXpSpent + 50,
      });

      // Create experience entry
      await storage.createExperienceEntry({
        characterId: id,
        amount: -50,
        reason: `Second archetype purchased: ${archetype.charAt(0).toUpperCase() + archetype.slice(1).replace(/-/g, ' ')}`,
        eventId: null,
        rsvpId: null,
        awardedBy: req.session.userId!,
      });

      res.json(updatedCharacter);
    } catch (error) {
      console.error('Error purchasing second archetype:', error);
      res.status(500).json({ message: 'Failed to purchase second archetype' });
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
      console.log(`Creating experience entry for ${attribute} increase: -${cost} XP`);
      const experienceEntry = await storage.createExperienceEntry({
        characterId: req.params.id,
        amount: -cost,
        reason: `Increased ${attribute} by ${amount} point${amount !== 1 ? 's' : ''}`,
        awardedBy: req.session.userId!,
      });
      console.log('Experience entry created:', experienceEntry);

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
      const chapters = await storage.getAllChaptersWithMemberCount();
      res.json(chapters);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chapters" });
    }
  });

  app.get("/api/chapters/:id/members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getChapterMembers(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chapter members" });
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
      // Check if event is active and allows RSVPs
      const event = await storage.getEvent(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (!event.isActive) {
        return res.status(400).json({ message: "This event is no longer accepting RSVPs" });
      }
      
      const rsvpData = insertEventRsvpSchema.omit({ eventId: true, userId: true }).parse(req.body);
      
      // Validate XP purchases limits
      if ((rsvpData.xpPurchases || 0) > 2 || (rsvpData.xpCandlePurchases || 0) > 2) {
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

      // Check if RSVP already exists
      const existingRsvp = await storage.getEventRsvp(req.params.eventId, rsvpData.characterId);
      if (existingRsvp) {
        return res.status(400).json({ message: "Character has already RSVPed to this event" });
      }

      // Check if user has enough candles for XP candle purchases
      if ((rsvpData.xpCandlePurchases || 0) > 0) {
        const user = await storage.getUser(req.session.userId!);
        const candlesNeeded = (rsvpData.xpCandlePurchases || 0) * 10; // 10 candles per XP candle purchase
        
        if (!user || user.candles < candlesNeeded) {
          return res.status(400).json({ 
            message: `Insufficient candles. Need ${candlesNeeded} candles, but you have ${user?.candles || 0}` 
          });
        }

        // Spend the candles
        await storage.updateUser(req.session.userId!, { 
          candles: user.candles - candlesNeeded 
        });

        // Create candle transaction record
        await storage.createCandleTransaction({
          userId: req.session.userId!,
          amount: -candlesNeeded,
          reason: `XP candle purchases for event RSVP (${rsvpData.xpCandlePurchases || 0} purchases)`,
          createdBy: req.session.userId!,
        });
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

  app.patch("/api/rsvps/:id", requireAdmin, async (req, res) => {
    try {
      // Create a more flexible schema for updates that allows null for attended
      const updateSchema = insertEventRsvpSchema.omit({ eventId: true, userId: true }).extend({
        attended: z.boolean().nullable().optional(),
      }).partial();
      
      const updateData = updateSchema.parse(req.body);
      
      // Validate XP purchases limits
      if (updateData.xpPurchases && updateData.xpPurchases > 2) {
        return res.status(400).json({ message: "Maximum 2 XP purchases allowed" });
      }
      if (updateData.xpCandlePurchases && updateData.xpCandlePurchases > 2) {
        return res.status(400).json({ message: "Maximum 2 XP candle purchases allowed" });
      }

      const rsvp = await storage.updateEventRsvp(req.params.id, updateData);

      // If XP purchases were updated and character attended, update experience entry
      if ((updateData.xpPurchases !== undefined || updateData.xpCandlePurchases !== undefined) && rsvp.attended) {
        // Get the updated RSVP to calculate new XP
        const baseXp = await storage.calculateEventAttendanceXP(rsvp.characterId);
        const purchasedXp = (rsvp.xpPurchases || 0) + (rsvp.xpCandlePurchases || 0);
        const totalXp = baseXp + purchasedXp;

        // Update existing experience entry for this RSVP
        await storage.updateExperienceEntryByRsvpId(rsvp.id, {
          amount: totalXp,
          reason: `Event attendance (${baseXp} base XP + ${purchasedXp} purchased XP)`,
        });

        // Recalculate character's total experience
        const totalExp = await storage.getTotalExperienceByCharacter(rsvp.characterId);
        const totalXpSpent = await storage.calculateTotalXpSpent(rsvp.characterId);
        
        await storage.updateCharacter(rsvp.characterId, { 
          experience: totalExp,
          totalXpSpent: totalXpSpent
        });
      }

      res.json(rsvp);
    } catch (error) {
      console.error("RSVP update error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update RSVP" });
    }
  });

  app.delete("/api/rsvps/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteEventRsvp(req.params.id);
      res.json({ message: "RSVP removed successfully" });
    } catch (error) {
      console.error("RSVP deletion error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to remove RSVP" });
    }
  });

  app.post("/api/rsvps/:id/attendance", requireAdmin, async (req, res) => {
    try {
      const { attended } = req.body;
      const rsvp = await storage.markAttendance(req.params.id, attended, req.session.userId!);
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

  // Role management endpoints (admin only)
  app.get("/api/roles", requireAdmin, async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to get roles" });
    }
  });

  app.post("/api/roles", requireAdmin, async (req, res) => {
    try {
      const role = await storage.createRole(req.body);
      res.status(201).json(role);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create role" });
    }
  });

  app.patch("/api/roles/:id", requireAdmin, async (req, res) => {
    try {
      const role = await storage.updateRole(req.params.id, req.body);
      res.json(role);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteRole(req.params.id);
      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete role" });
    }
  });

  app.get("/api/permissions", requireAdmin, async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get permissions" });
    }
  });

  app.get("/api/roles/:id/permissions", requireAdmin, async (req, res) => {
    try {
      const permissions = await storage.getRolePermissions(req.params.id);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get role permissions" });
    }
  });

  app.patch("/api/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { roleId } = req.body;
      
      // Prevent users from demoting themselves
      if (req.params.id === req.session.userId) {
        return res.status(400).json({ message: "Cannot change your own role" });
      }

      const user = await storage.updateUserRole(req.params.id, roleId);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Role update error:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Achievement management routes (admin only)
  app.get("/api/admin/achievements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.post("/api/admin/achievements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const achievementData = {
        ...req.body,
        createdBy: req.session.userId,
      };
      const achievement = await storage.createAchievement(achievementData);
      res.json(achievement);
    } catch (error) {
      res.status(400).json({ message: "Invalid achievement data" });
    }
  });

  app.put("/api/admin/achievements/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const achievement = await storage.updateAchievement(id, req.body);
      res.json(achievement);
    } catch (error) {
      res.status(400).json({ message: "Failed to update achievement" });
    }
  });

  app.delete("/api/admin/achievements/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAchievement(id);
      res.json({ message: "Achievement deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete achievement" });
    }
  });

  // Milestone management routes (admin only)
  app.get("/api/admin/milestones", requireAuth, requireAdmin, async (req, res) => {
    try {
      const milestones = await storage.getAllMilestones();
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  app.post("/api/admin/milestones", requireAuth, requireAdmin, async (req, res) => {
    try {
      const milestoneData = {
        ...req.body,
        createdBy: req.session.userId,
      };
      const milestone = await storage.createMilestone(milestoneData);
      res.json(milestone);
    } catch (error) {
      res.status(400).json({ message: "Invalid milestone data" });
    }
  });

  app.put("/api/admin/milestones/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const milestone = await storage.updateMilestone(id, req.body);
      res.json(milestone);
    } catch (error) {
      res.status(400).json({ message: "Failed to update milestone" });
    }
  });

  app.delete("/api/admin/milestones/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMilestone(id);
      res.json({ message: "Milestone deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete milestone" });
    }
  });

  // Static milestone editing
  app.put("/api/admin/static-milestones/:index", requireAuth, requireAdmin, async (req, res) => {
    try {
      const index = parseInt(req.params.index);
      const milestoneData = z.object({
        title: z.string(),
        description: z.string(),
        threshold: z.number(),
        iconName: z.string(),
        color: z.string(),
      }).parse(req.body);

      await storage.updateStaticMilestone(index, milestoneData);
      res.json({ message: "Static milestone updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update static milestone" });
    }
  });

  // Static achievement editing
  app.put("/api/admin/static-achievements/:index", requireAuth, requireAdmin, async (req, res) => {
    try {
      const index = parseInt(req.params.index);
      const achievementData = z.object({
        title: z.string(),
        description: z.string(),
        iconName: z.string(),
        rarity: z.string(),
        conditionType: z.string(),
        conditionValue: z.number().optional(),
      }).parse(req.body);

      await storage.updateStaticAchievement(index, achievementData);
      res.json({ message: "Static achievement updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update static achievement" });
    }
  });

  // Character achievements API
  app.get("/api/characters/:id/achievements", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const achievements = await storage.getCharacterAchievements(id);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch character achievements" });
    }
  });

  app.post("/api/characters/:id/achievements/:achievementId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id: characterId, achievementId } = req.params;
      const achievement = await storage.unlockAchievement(characterId, achievementId);
      res.json(achievement);
    } catch (error) {
      res.status(500).json({ message: "Failed to unlock achievement" });
    }
  });

  // Public endpoints for custom achievements and milestones (read-only)
  app.get("/api/achievements", requireAuth, async (req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/milestones", requireAuth, async (req, res) => {
    try {
      const milestones = await storage.getAllMilestones();
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  // Achievement Settings API
  app.get("/api/admin/achievement-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAchievementSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievement settings" });
    }
  });

  app.put("/api/admin/achievement-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.updateAchievementSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update achievement settings" });
    }
  });

  app.post("/api/admin/recalculate-achievement-rarities", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.recalculateAchievementRarities();
      res.json({ message: "Achievement rarities recalculated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to recalculate achievement rarities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
