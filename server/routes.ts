import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import { insertUserSchema, insertCharacterSchema, insertEventSchema, insertExperienceEntrySchema } from "@shared/schema";
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
      const { username, email, password } = registerSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        isAdmin: false,
      });

      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;

      res.json({ user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
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

      res.json({ user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
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
      res.json({ user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
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
      res.json(characters);
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
      
      res.json(character);
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

  app.delete("/api/characters/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCharacter(req.params.id);
      res.json({ message: "Character deleted successfully" });
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
