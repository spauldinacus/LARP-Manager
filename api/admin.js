// Combined admin endpoints for Vercel
import { db, users, characters, heritages, archetypes, skills, cultures, customAchievements, customMilestones, roles, permissions, rolePermissions } from '../lib/db.js';
import { requireAdmin } from '../lib/session.js';
import { eq, count, desc } from 'drizzle-orm';

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
    if (id) {
      const [culture] = await db.select().from(cultures).where(eq(cultures.id, id));
      if (!culture) {
        return res.status(404).json({ message: 'Culture not found' });
      }
      return res.status(200).json(culture);
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
        return res.status(404).json({ message: 'Archetype not found' });
      }
      return res.status(200).json(archetype);
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
        return res.status(404).json({ message: 'Skill not found' });
      }
      return res.status(200).json(skill);
    } else {
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
      const [user] = await db.select({
        id: users.id,
        playerName: users.playerName,
        email: users.email,
        playerNumber: users.playerNumber,
        chapterId: users.chapterId,
        title: users.title,
        isAdmin: users.isAdmin,
        roleId: users.roleId,
        candles: users.candles,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        characterCount: count(characters.id),
        role: {
          id: roles.id,
          name: roles.name,
          color: roles.color,
        }
      })
      .from(users)
      .leftJoin(characters, eq(users.id, characters.userId))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, id))
      .groupBy(users.id, roles.id, roles.name, roles.color);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json(user);
    } else {
      const allUsers = await db.select({
        id: users.id,
        playerName: users.playerName,
        email: users.email,
        playerNumber: users.playerNumber,
        chapterId: users.chapterId,
        title: users.title,
        isAdmin: users.isAdmin,
        roleId: users.roleId,
        candles: users.candles,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        characterCount: count(characters.id),
        role: {
          id: roles.id,
          name: roles.name,
          color: roles.color,
        }
      })
      .from(users)
      .leftJoin(characters, eq(users.id, characters.userId))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .groupBy(users.id, roles.id, roles.name, roles.color)
      .orderBy(users.playerName);

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

// Heritages handler
async function handleHeritages(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [heritage] = await db.select().from(heritages).where(eq(heritages.id, id));
      if (!heritage) {
        return res.status(404).json({ message: 'Heritage not found' });
      }
      return res.status(200).json(heritage);
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