// Combined admin endpoints for Vercel
import { db, users, characters, heritages, archetypes, skills, cultures, customAchievements, customMilestones, roles, permissions, rolePermissions, events, chapters } from '../lib/db.js';
import { requireAdmin } from '../lib/session.js';
import { eq, count, desc, sql } from 'drizzle-orm';

export default async function handler(req, res) {
  // Ensure req.body is parsed for POST, PUT, PATCH requests (Vercel/Node.js serverless)
  const method = req.method || req?.method;
  if ((method === "POST" || method === "PUT" || method === "PATCH") && typeof req.body === "undefined") {
    try {
      req.body = JSON.parse(await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => (data += chunk));
        req.on("end", () => resolve(data || "{}"));
        req.on("error", reject);
      }));
    } catch {
      req.body = {};
    }
  }

  try {
    const session = await requireAdmin(req, res);
    if (!session) return;

    const url = new URL(req.url, `http://${req.headers.host}`);
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    // Handle query parameter based routing
    if (type === 'stats') {
      return await handleStats(req, res, method);
    } else if (type === 'skills') {
      return await handleSkills(req, res, method, id);
    } else if (type === 'heritages') {
      return await handleHeritages(req, res, method, id);
    } else if (type === 'cultures') {
      return await handleCultures(req, res, method, id);
    } else if (type === 'archetypes') {
      return await handleArchetypes(req, res, method, id);
    } else if (type === 'achievements') {
      return await handleAchievements(req, res, method, id);
    } else if (type === 'milestones') {
      return await handleMilestones(req, res, method, id);
    } else if (type === 'roles') {
      return await handleRoles(req, res, method, id);
    } else if (type === 'permissions') {
      return await handlePermissions(req, res, method, id);
    } else if (type === 'role-permissions') {
      return await handleRolePermissions(req, res, method, id);
    } else if (type === 'users') {
      return await handleUsers(req, res, method, id);
    } else if (type === 'events') {
      return await handleEvents(req, res, method, id);
    } else if (type === 'characters') {
      return await handleCharacters(req, res, method, id);
    } else if (type === 'chapters') {
      return await handleChapters(req, res, method, id);
// Characters handler (basic read-only)
async function handleCharacters(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [character] = await db.select().from(characters).where(eq(characters.id, id));
      if (!character) {
        res.status(404).json({ message: 'Character not found' });
        return;
      }
      res.status(200).json(character);
      return;
    } else {
      const allCharacters = await db.select().from(characters);
      return res.status(200).json(allCharacters);
    }
  }
  return res.status(405).json({ message: 'Method not allowed' });
}

// Chapters handler (basic read-only)
async function handleChapters(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id));
      if (!chapter) {
        res.status(404).json({ message: 'Chapter not found' });
        return;
      }
      res.status(200).json(chapter);
      return;
    } else {
      const allChapters = await db.select().from(chapters);
      return res.status(200).json(allChapters);
    }
  }
  return res.status(405).json({ message: 'Method not allowed' });
}
    }

    // Legacy path-based routing for backward compatibility
    const path = req.url?.split('?')[0] || '';
    if (path.includes('/stats')) {
      return await handleStats(req, res, method);
    }

    return res.status(404).json({ message: 'Admin endpoint not found' });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

// Achievements handlers
async function handleAchievements(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [achievement] = await db.select().from(customAchievements).where(eq(customAchievements.id, id));
      if (!achievement) {
        res.status(404).json({ message: 'Achievement not found' });
        return;
      }
      res.status(200).json(achievement);
      return;
    } else {
      const allAchievements = await db.select().from(customAchievements);
      return res.status(200).json(allAchievements);
    }
  }

  if (method === 'POST') {
    const [newAchievement] = await db.insert(customAchievements).values(req.body).returning();
    return res.status(201).json(newAchievement);
  }

  if (method === 'PUT' && id) {
    const [updatedAchievement] = await db.update(customAchievements)
      .set(req.body)
      .where(eq(customAchievements.id, id))
      .returning();
    if (!updatedAchievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    return res.status(200).json(updatedAchievement);
  }

  if (method === 'DELETE' && id) {
    const [deletedAchievement] = await db.delete(customAchievements)
      .where(eq(customAchievements.id, id))
      .returning();
    if (!deletedAchievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    return res.status(200).json({ message: 'Achievement deleted successfully' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Milestones handlers
async function handleMilestones(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [milestone] = await db.select().from(customMilestones).where(eq(customMilestones.id, id));
      if (!milestone) {
        res.status(404).json({ message: 'Milestone not found' });
        return;
      }
      res.status(200).json(milestone);
      return;
    } else {
      const allMilestones = await db.select().from(customMilestones);
      return res.status(200).json(allMilestones);
    }
  }

  if (method === 'POST') {
    const [newMilestone] = await db.insert(customMilestones).values(req.body).returning();
    return res.status(201).json(newMilestone);
  }

  if (method === 'PUT' && id) {
    const [updatedMilestone] = await db.update(customMilestones)
      .set(req.body)
      .where(eq(customMilestones.id, id))
      .returning();
    if (!updatedMilestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    return res.status(200).json(updatedMilestone);
  }

  if (method === 'DELETE' && id) {
    const [deletedMilestone] = await db.delete(customMilestones)
      .where(eq(customMilestones.id, id))
      .returning();
    if (!deletedMilestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    return res.status(200).json({ message: 'Milestone deleted successfully' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Cultures handler
async function handleCultures(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [culture] = await db.select().from(cultures).where(eq(cultures.id, id));
      if (!culture) {
        res.status(404).json({ message: 'Culture not found' });
        return;
      }
      res.status(200).json(culture);
      return;
    } else {
      const allCultures = await db.select().from(cultures).orderBy(cultures.name);
      return res.status(200).json(allCultures);
    }
  }

  if (method === 'POST') {
    const [newCulture] = await db.insert(cultures).values(req.body).returning();
    return res.status(201).json(newCulture);
  }

  if (method === 'PUT' && id) {
    const [updatedCulture] = await db.update(cultures)
      .set(req.body)
      .where(eq(cultures.id, id))
      .returning();
    return res.status(200).json(updatedCulture);
  }

  if (method === 'DELETE' && id) {
    await db.delete(cultures).where(eq(cultures.id, id));
    return res.status(200).json({ message: 'Culture deleted successfully' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Archetypes handler
async function handleArchetypes(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [archetype] = await db.select().from(archetypes).where(eq(archetypes.id, id));
      if (!archetype) {
        res.status(404).json({ message: 'Archetype not found' });
        return;
      }
      res.status(200).json(archetype);
      return;
    } else {
      const allArchetypes = await db.select().from(archetypes).orderBy(archetypes.name);
      return res.status(200).json(allArchetypes);
    }
  }

  if (method === 'POST') {
    const [newArchetype] = await db.insert(archetypes).values(req.body).returning();
    return res.status(201).json(newArchetype);
  }

  if (method === 'PUT' && id) {
    const [updatedArchetype] = await db.update(archetypes)
      .set(req.body)
      .where(eq(archetypes.id, id))
      .returning();
    return res.status(200).json(updatedArchetype);
  }

  if (method === 'DELETE' && id) {
    await db.delete(archetypes).where(eq(archetypes.id, id));
    return res.status(200).json({ message: 'Archetype deleted successfully' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Skills handler
async function handleSkills(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [skill] = await db.select().from(skills).where(eq(skills.id, id));
      if (!skill) {
        res.status(404).json({ message: 'Skill not found' });
        return;
      }
      res.status(200).json(skill);
      return;
    } else {
      // Only select columns that exist in the skills table
      const allSkills = await db.select().from(skills).orderBy(skills.name);
      return res.status(200).json(allSkills);
    }
  }

  if (method === 'POST') {
    const [newSkill] = await db.insert(skills).values(req.body).returning();
    return res.status(201).json(newSkill);
  }

  if (method === 'PUT' && id) {
    const [updatedSkill] = await db.update(skills)
      .set(req.body)
      .where(eq(skills.id, id))
      .returning();
    return res.status(200).json(updatedSkill);
  }

  if (method === 'DELETE' && id) {
    await db.delete(skills).where(eq(skills.id, id));
    return res.status(200).json({ message: 'Skill deleted successfully' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Users handler
async function handleUsers(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [user] = await db.query.users.findMany({
        where: eq(users.id, id),
        with: {
          characters: true,
          role: true,
        },
      });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json(user);
      return;
    } else {
      const allUsers = await db.query.users.findMany({
        with: {
          characters: {
            with: {
              heritage: true,
              archetype: true,
            },
          },
          role: true,
        },
        orderBy: [users.playerName],
      });

      return res.status(200).json(allUsers);
    }
  }

  if (method === 'POST') {
    const [newUser] = await db.insert(users).values(req.body).returning();
    return res.status(201).json(newUser);
  }

  if (method === 'PUT' && id) {
    const [updatedUser] = await db.update(users)
      .set(req.body)
      .where(eq(users.id, id))
      .returning();
    return res.status(200).json(updatedUser);
  }

  if (method === 'DELETE' && id) {
    await db.delete(users).where(eq(users.id, id));
    return res.status(200).json({ message: 'User deleted successfully' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Roles handler
async function handleRoles(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [role] = await db.select().from(roles).where(eq(roles.id, id));
      if (!role) {
        res.status(404).json({ message: 'Role not found' });
        return;
      }
      res.status(200).json(role);
      return;
    } else {
      const allRoles = await db.select().from(roles).orderBy(roles.name);
      return res.status(200).json(allRoles);
    }
  }

  if (method === 'POST') {
    const [newRole] = await db.insert(roles).values(req.body).returning();
    return res.status(201).json(newRole);
  }

  if (method === 'PATCH' && id) {
    const [updatedRole] = await db.update(roles)
      .set(req.body)
      .where(eq(roles.id, id))
      .returning();
    return res.status(200).json(updatedRole);
  }

  if (method === 'DELETE' && id) {
    await db.delete(roles).where(eq(roles.id, id));
    return res.status(200).json({ message: 'Role deleted successfully' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Permissions handler
async function handlePermissions(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
      if (!permission) {
        return res.status(404).json({ message: 'Permission not found' });
      }
      return res.status(200).json(permission);
    } else {
      const allPermissions = await db.select().from(permissions).orderBy(permissions.category, permissions.name);
      return res.status(200).json(allPermissions);
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Role permissions handler
async function handleRolePermissions(req, res, method, id) {
  if (method === 'GET' && id) {
    const rolePerms = await db.select({
      id: permissions.id,
      name: permissions.name,
      description: permissions.description,
      category: permissions.category,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
    .where(eq(rolePermissions.role_id, id));

    return res.status(200).json(rolePerms);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Stats handler for dashboard
async function handleStats(req, res, method) {
  if (method === 'GET') {
    try {
      console.log('📊 Fetching dashboard stats...');
      
      // Get total characters
      const [totalCharactersResult] = await db.select({ count: count() }).from(characters);
      const totalCharacters = totalCharactersResult.count;
      console.log('Total characters:', totalCharacters);

      // Get total characters from last month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const [totalCharactersLastMonthResult] = await db.select({ count: count() })
        .from(characters)
        .where(sql`${characters.created_at} < ${lastMonth.toISOString()}`);
      const totalCharactersLastMonth = totalCharactersLastMonthResult.count;

      // Get active players (users with at least one character)
      const [activePlayersResult] = await db.select({ count: count() })
        .from(users)
        .where(sql`EXISTS (SELECT 1 FROM ${characters} WHERE ${characters.user_id} = ${users.id})`);
      const activePlayers = activePlayersResult.count;

      // Get active players from last week
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const [activePlayersLastWeekResult] = await db.select({ count: count() })
        .from(users)
        .where(sql`EXISTS (SELECT 1 FROM ${characters} WHERE ${characters.user_id} = ${users.id} AND ${characters.created_at} < ${lastWeek.toISOString()})`);
      const activePlayersLastWeek = activePlayersLastWeekResult.count;

      // Get upcoming events
      const now = new Date();
      const [upcomingEventsResult] = await db.select({ count: count() })
        .from(events)
        .where(sql`${events.event_date} > ${now.toISOString()}`);
      const upcomingEvents = upcomingEventsResult.count;

      // Get next event

      const [nextEventResult] = await db.select({
        name: events.name,
        event_date: events.event_date
      })
      .from(events)
      .where(sql`${events.event_date} > ${now.toISOString()}`)
      .orderBy(events.event_date)
      .limit(1);

      let nextEvent = null;
      if (nextEventResult) {
        const eventDate = new Date(nextEventResult.event_date);
        const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        nextEvent = {
          name: nextEventResult.name,
          daysUntil
        };
      }

      const statsData = {
        totalCharacters,
        totalCharactersLastMonth,
        activePlayers,
        activePlayersLastWeek,
        upcomingEvents,
        nextEvent
      };
      
      console.log('📊 Returning stats:', statsData);
      return res.status(200).json(statsData);
    } catch (error) {
      console.error('Stats error:', error);
      return res.status(500).json({ message: 'Failed to fetch stats' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Events handler
async function handleEvents(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [event] = await db.select({
        id: events.id,
        name: events.name,
        title: events.name,
        description: events.description,
        event_date: events.event_date,
        location: events.location,
        max_attendees: events.max_attendees,
        registration_open: events.registration_open,
        chapter_id: events.chapter_id,
        created_by: events.created_by,
        created_at: events.created_at,
        updated_at: events.updated_at,
        chapter: {
          id: chapters.id,
          name: chapters.name,
          code: chapters.code,
        },
        creator: {
          id: users.id,
          player_name: users.player_name,
        }
      })
      .from(events)
      .leftJoin(chapters, eq(events.chapter_id, chapters.id))
      .leftJoin(users, eq(events.created_by, users.id))
      .where(eq(events.id, id));

      if (!event) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }
      res.status(200).json(event);
      return;
    } else {
      const allEvents = await db.select({
        id: events.id,
        name: events.name,
        title: events.name,
        description: events.description,
        event_date: events.event_date,
        location: events.location,
        max_attendees: events.max_attendees,
        registration_open: events.registration_open,
        chapter_id: events.chapter_id,
        created_by: events.created_by,
        created_at: events.created_at,
        updated_at: events.updated_at,
        chapter: {
          id: chapters.id,
          name: chapters.name,
          code: chapters.code,
        },
        creator: {
          id: users.id,
          player_name: users.player_name,
        }
      })
      .from(events)
      .leftJoin(chapters, eq(events.chapter_id, chapters.id))
      .leftJoin(users, eq(events.created_by, users.id))
      .orderBy(desc(events.event_date));

      return res.status(200).json(allEvents);
    }
  }

  if (method === 'POST') {
    const eventData = { ...req.body };
    if (eventData.name && !eventData.title) {
      eventData.title = eventData.name;
    }
    const [newEvent] = await db.insert(events).values(eventData).returning();
    return res.status(201).json({ ...newEvent, name: newEvent.title, isActive: newEvent.registrationOpen });
  }

  if (method === 'PUT' && id) {
    const eventData = { ...req.body };
    if (eventData.name && !eventData.title) {
      eventData.title = eventData.name;
    }
    if (eventData.isActive !== undefined) {
      eventData.registrationOpen = eventData.isActive;
    }
    const [updatedEvent] = await db.update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    return res.status(200).json({ ...updatedEvent, name: updatedEvent.title, isActive: updatedEvent.registrationOpen });
  }

  if (method === 'DELETE' && id) {
    const [deletedEvent] = await db.delete(events)
      .where(eq(events.id, id))
      .returning();
    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    return res.status(200).json({ message: 'Event deleted successfully' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Heritages handler
async function handleHeritages(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [heritage] = await db.select().from(heritages).where(eq(heritages.id, id));
      if (!heritage) {
        res.status(404).json({ message: 'Heritage not found' });
        return;
      }
      res.status(200).json(heritage);
      return;
    }
    const allHeritages = await db.select().from(heritages).orderBy(heritages.name);
    return res.status(200).json(allHeritages);
  }

  if (method === 'POST') {
    const [newHeritage] = await db.insert(heritages).values(req.body).returning();
    return res.status(201).json(newHeritage);
  }

  if (method === 'PUT' && id) {
    const [updatedHeritage] = await db.update(heritages).set(req.body).where(eq(heritages.id, id)).returning();
    if (!updatedHeritage) {
      return res.status(404).json({ message: 'Heritage not found' });
    }
    return res.status(200).json(updatedHeritage);
  }

  if (method === 'DELETE' && id) {
    const [deletedHeritage] = await db.delete(heritages).where(eq(heritages.id, id)).returning();
    if (!deletedHeritage) {
      return res.status(404).json({ message: 'Heritage not found' });
    }
    return res.status(200).json({ message: 'Heritage deleted successfully' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}