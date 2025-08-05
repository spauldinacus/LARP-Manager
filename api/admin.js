// Combined admin endpoints for Vercel
import { db, users, characters, heritages, archetypes, skills, cultures, customAchievements, customMilestones, roles, permissions, rolePermissions, events, chapters } from '../lib/db.js';
import { requireAdmin } from '../lib/session.js';
import { eq, count, desc, sql } from 'drizzle-orm';
// Import bcrypt for password hashing (assuming it's needed for user handling)
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  try {
    const session = await requireAdmin(req, res);
    if (!session) return;

    const { method } = req;
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
        return res.status(404).json({ message: 'Achievement not found' });
      }
      return res.status(200).json(achievement);
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
        return res.status(404).json({ message: 'Milestone not found' });
      }
      return res.status(200).json(milestone);
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
    try {
      if (id) {
        const [culture] = await db.select({
          id: cultures.id,
          name: cultures.name,
          description: cultures.description,
          heritageId: cultures.heritageId,
          heritageName: sql`(SELECT ${heritages.name} FROM ${heritages} WHERE ${heritages.id} = ${cultures.heritageId})`.as('heritageName'),
          secondarySkills: sql`'[]'`.as('secondarySkills')
        }).from(cultures).where(eq(cultures.id, id));
        if (!culture) {
          return res.status(404).json({ message: 'Culture not found' });
        }
        return res.status(200).json({
          ...culture,
          secondarySkills: []
        });
      } else {
        const allCultures = await db.select({
          id: cultures.id,
          name: cultures.name,
          description: cultures.description,
          heritageId: cultures.heritageId,
          heritageName: sql`(SELECT ${heritages.name} FROM ${heritages} WHERE ${heritages.id} = ${cultures.heritageId})`.as('heritageName')
        }).from(cultures).orderBy(cultures.name);
        
        const culturesWithSkills = allCultures.map(culture => ({
          ...culture,
          secondarySkills: []
        }));
        
        console.log('Cultures fetched:', culturesWithSkills.length);
        return res.status(200).json(culturesWithSkills);
      }
    } catch (error) {
      console.error('Cultures GET error:', error);
      return res.status(500).json({ message: 'Failed to fetch cultures' });
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
    try {
      if (id) {
        const [archetype] = await db.select({
          id: archetypes.id,
          name: archetypes.name,
          description: archetypes.description
        }).from(archetypes).where(eq(archetypes.id, id));
        if (!archetype) {
          return res.status(404).json({ message: 'Archetype not found' });
        }
        return res.status(200).json({
          ...archetype,
          primarySkills: [],
          secondarySkills: []
        });
      } else {
        const allArchetypes = await db.select({
          id: archetypes.id,
          name: archetypes.name,
          description: archetypes.description
        }).from(archetypes).orderBy(archetypes.name);
        
        const archetypesWithSkills = allArchetypes.map(archetype => ({
          ...archetype,
          primarySkills: [],
          secondarySkills: []
        }));
        
        console.log('Archetypes fetched:', archetypesWithSkills.length);
        return res.status(200).json(archetypesWithSkills);
      }
    } catch (error) {
      console.error('Archetypes GET error:', error);
      return res.status(500).json({ message: 'Failed to fetch archetypes' });
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
    try {
      if (id) {
        const [skill] = await db.select({
          id: skills.id,
          name: skills.name,
          description: skills.description,
          prerequisiteSkillId: skills.prerequisiteSkillId,
          prerequisiteSkillName: sql`(SELECT ${skills.name} FROM ${skills} s2 WHERE s2.id = ${skills.prerequisiteSkillId})`.as('prerequisiteSkillName')
        }).from(skills).where(eq(skills.id, id));
        if (!skill) {
          return res.status(404).json({ message: 'Skill not found' });
        }
        return res.status(200).json(skill);
      } else {
        const allSkills = await db.select({
          id: skills.id,
          name: skills.name,
          description: skills.description,
          prerequisiteSkillId: skills.prerequisiteSkillId,
          prerequisiteSkillName: sql`(SELECT ${skills.name} FROM ${skills} s2 WHERE s2.id = ${skills.prerequisiteSkillId})`.as('prerequisiteSkillName')
        }).from(skills).orderBy(skills.name);
        console.log('Skills fetched:', allSkills.length);
        return res.status(200).json(allSkills);
      }
    } catch (error) {
      console.error('Skills GET error:', error);
      return res.status(500).json({ message: 'Failed to fetch skills' });
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
    try {
      if (id) {
        const [user] = await db.select({
          id: users.id,
          username: users.username,
          playerName: users.playerName,
          email: users.email,
          playerNumber: users.playerNumber,
          chapterId: users.chapterId,
          title: users.title,
          roleId: users.roleId,
          role: {
            id: roles.id,
            name: roles.name,
          }
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.id, id));
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Get user's characters
        const userCharacters = await db.select({
          id: characters.id,
          name: characters.name,
          heritage: heritages.name,
          culture: cultures.name,
          archetype: archetypes.name,
          skills: characters.skills,
          isActive: characters.isActive,
          isRetired: characters.isRetired,
        })
        .from(characters)
        .leftJoin(heritages, eq(characters.heritageId, heritages.id))
        .leftJoin(cultures, eq(characters.cultureId, cultures.id))
        .leftJoin(archetypes, eq(characters.archetypeId, archetypes.id))
        .where(eq(characters.userId, id));

        return res.status(200).json({
          ...user,
          characters: userCharacters || []
        });
      } else {
        console.log('📋 Fetching all users for players page...');
        
        const allUsers = await db.select({
          id: users.id,
          username: users.username,
          playerName: users.playerName,
          email: users.email,
          playerNumber: users.playerNumber,
          chapterId: users.chapterId,
          title: users.title,
          roleId: users.roleId,
          role: {
            id: roles.id,
            name: roles.name,
          }
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id));

        console.log('Users fetched:', allUsers.length);

        // Get characters for all users
        const allCharacters = await db.select({
          id: characters.id,
          name: characters.name,
          userId: characters.userId,
          heritage: heritages.name,
          culture: cultures.name,
          archetype: archetypes.name,
          skills: characters.skills,
          isActive: characters.isActive,
          isRetired: characters.isRetired,
        })
        .from(characters)
        .leftJoin(heritages, eq(characters.heritageId, heritages.id))
        .leftJoin(cultures, eq(characters.cultureId, cultures.id))
        .leftJoin(archetypes, eq(characters.archetypeId, archetypes.id));

        console.log('Characters fetched:', allCharacters.length);

        // Group characters by user
        const usersWithCharacters = allUsers.map(user => ({
          ...user,
          characters: allCharacters.filter(char => char.userId === user.id) || []
        }));

        console.log('📋 Returning users with characters:', usersWithCharacters.length);
        return res.status(200).json(usersWithCharacters);
      }
    } catch (error) {
      console.error('Users GET error:', error);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }
  }

  if (method === 'POST') {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const [newUser] = await db.insert(users)
        .values({
          ...req.body,
          password: hashedPassword
        })
        .returning();

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Users POST error:', error);
      return res.status(500).json({ message: 'Failed to create user' });
    }
  }

  if (method === 'PUT' && id) {
    try {
      const updateData = { ...req.body };
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('Users PUT error:', error);
      return res.status(500).json({ message: 'Failed to update user' });
    }
  }

  if (method === 'DELETE' && id) {
    try {
      await db.delete(users).where(eq(users.id, id));
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Users DELETE error:', error);
      return res.status(500).json({ message: 'Failed to delete user' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Roles handler
async function handleRoles(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [role] = await db.select().from(roles).where(eq(roles.id, id));
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }
      return res.status(200).json(role);
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
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, id));

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
        .where(sql`${characters.createdAt} < ${lastMonth.toISOString()}`);
      const totalCharactersLastMonth = totalCharactersLastMonthResult.count;

      // Get active players (users with at least one character)
      const [activePlayersResult] = await db.select({ count: count() })
        .from(users)
        .where(sql`EXISTS (SELECT 1 FROM ${characters} WHERE ${characters.userId} = ${users.id})`);
      const activePlayers = activePlayersResult.count;

      // Get active players from last week
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const [activePlayersLastWeekResult] = await db.select({ count: count() })
        .from(users)
        .where(sql`EXISTS (SELECT 1 FROM ${characters} WHERE ${characters.userId} = ${users.id} AND ${characters.createdAt} < ${lastWeek.toISOString()})`);
      const activePlayersLastWeek = activePlayersLastWeekResult.count;

      // Get upcoming events
      const now = new Date();
      const [upcomingEventsResult] = await db.select({ count: count() })
        .from(events)
        .where(sql`${events.eventDate} > ${now.toISOString()}`);
      const upcomingEvents = upcomingEventsResult.count;

      // Get next event
      const [nextEventResult] = await db.select({
        name: events.title,
        eventDate: events.eventDate
      })
      .from(events)
      .where(sql`${events.eventDate} > ${now.toISOString()}`)
      .orderBy(events.eventDate)
      .limit(1);

      let nextEvent = null;
      if (nextEventResult) {
        const eventDate = new Date(nextEventResult.eventDate);
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
        name: events.title,
        title: events.title,
        description: events.description,
        eventDate: events.eventDate,
        location: events.location,
        maxAttendees: events.maxAttendees,
        registrationOpen: events.registrationOpen,
        isActive: events.registrationOpen,
        chapterId: events.chapterId,
        createdBy: events.createdBy,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        chapter: {
          id: chapters.id,
          name: chapters.name,
          code: chapters.code,
        },
        creator: {
          id: users.id,
          playerName: users.playerName,
        }
      })
      .from(events)
      .leftJoin(chapters, eq(events.chapterId, chapters.id))
      .leftJoin(users, eq(events.createdBy, users.id))
      .where(eq(events.id, id));

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      return res.status(200).json(event);
    } else {
      const allEvents = await db.select({
        id: events.id,
        name: events.title,
        title: events.title,
        description: events.description,
        eventDate: events.eventDate,
        location: events.location,
        maxAttendees: events.maxAttendees,
        registrationOpen: events.registrationOpen,
        isActive: events.registrationOpen,
        chapterId: events.chapterId,
        createdBy: events.createdBy,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        chapter: {
          id: chapters.id,
          name: chapters.name,
          code: chapters.code,
        },
        creator: {
          id: users.id,
          playerName: users.playerName,
        }
      })
      .from(events)
      .leftJoin(chapters, eq(events.chapterId, chapters.id))
      .leftJoin(users, eq(events.createdBy, users.id))
      .orderBy(desc(events.eventDate));

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
    try {
      if (id) {
        const [heritage] = await db.select({
          id: heritages.id,
          name: heritages.name,
          body: heritages.body,
          stamina: heritages.stamina,
          icon: heritages.icon,
          description: heritages.description,
          costumeRequirements: heritages.costumeRequirements,
          benefit: heritages.benefit,
          weakness: heritages.weakness
        }).from(heritages).where(eq(heritages.id, id));
        if (!heritage) {
          return res.status(404).json({ message: 'Heritage not found' });
        }
        return res.status(200).json({
          ...heritage,
          secondarySkills: []
        });
      }
      const allHeritages = await db.select({
        id: heritages.id,
        name: heritages.name,
        body: heritages.body,
        stamina: heritages.stamina,
        icon: heritages.icon,
        description: heritages.description,
        costumeRequirements: heritages.costumeRequirements,
        benefit: heritages.benefit,
        weakness: heritages.weakness
      }).from(heritages).orderBy(heritages.name);
      
      const heritagesWithSkills = allHeritages.map(heritage => ({
        ...heritage,
        secondarySkills: []
      }));
      
      console.log('Heritages fetched:', heritagesWithSkills.length);
      return res.status(200).json(heritagesWithSkills);
    } catch (error) {
      console.error('Heritages GET error:', error);
      return res.status(500).json({ message: 'Failed to fetch heritages' });
    }
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