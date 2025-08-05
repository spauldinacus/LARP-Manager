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

async function handleRoles(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [role] = await db.select().from(roles).where(eq(roles.id, id));
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }
      return res.status(200).json(role);
    } else {
      const allRoles = await db.select().from(roles);
      return res.status(200).json(allRoles);
    }
  }

  if (method === 'POST') {
    const [newRole] = await db.insert(roles).values({
      ...req.body,
      createdBy: req.session?.userId
    }).returning();
    
    // If permissionIds are provided, create role-permission relationships
    if (req.body.permissionIds && req.body.permissionIds.length > 0) {
      const rolePermissionData = req.body.permissionIds.map(permissionId => ({
        roleId: newRole.id,
        permissionId
      }));
      await db.insert(rolePermissions).values(rolePermissionData);
    }
    
    return res.status(201).json(newRole);
  }

  if (method === 'PATCH' && id) {
    const { permissionIds, ...roleData } = req.body;
    
    const [updatedRole] = await db.update(roles)
      .set(roleData)
      .where(eq(roles.id, id))
      .returning();
    
    if (!updatedRole) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Update role permissions if provided
    if (permissionIds !== undefined) {
      // Delete existing permissions
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
      
      // Add new permissions
      if (permissionIds.length > 0) {
        const rolePermissionData = permissionIds.map(permissionId => ({
          roleId: id,
          permissionId
        }));
        await db.insert(rolePermissions).values(rolePermissionData);
      }
    }
    
    return res.status(200).json(updatedRole);
  }

  if (method === 'DELETE' && id) {
    const [deletedRole] = await db.delete(roles)
      .where(eq(roles.id, id))
      .returning();
    if (!deletedRole) {
      return res.status(404).json({ message: 'Role not found' });
    }
    return res.status(200).json({ message: 'Role deleted successfully' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handlePermissions(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
      if (!permission) {
        return res.status(404).json({ message: 'Permission not found' });
      }
      return res.status(200).json(permission);
    } else {
      const allPermissions = await db.select().from(permissions);
      return res.status(200).json(allPermissions);
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleRolePermissions(req, res, method, id) {
  if (method === 'GET' && id) {
    // Get permissions for a specific role
    const rolePermissionsList = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        description: permissions.description,
        category: permissions.category
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, id));
    
    return res.status(200).json(rolePermissionsList);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleUsers(req, res, method, id) {
  if (method === 'GET') {
    const allUsers = await db.select().from(users);
    const usersWithoutPasswords = allUsers.map(({ password: _, ...user }) => user);
    return res.status(200).json(usersWithoutPasswords);
  }

  if (method === 'POST') {
    const [newUser] = await db.insert(users).values(req.body).returning();
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json(userWithoutPassword);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleStats(req, res, method) {
  if (method === 'GET') {
    const [totalCharacters] = await db.select({ count: count() }).from(characters);
    const [totalUsers] = await db.select({ count: count() }).from(users);

    return res.status(200).json({
      totalCharacters: totalCharacters.count.toString(),
      totalUsers: totalUsers.count.toString(),
      totalCharactersLastMonth: "0", // Add proper calculation if needed
      totalUsersLastMonth: "0"
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleHeritages(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [heritage] = await db.select().from(heritages).where(eq(heritages.id, id));
      return res.status(200).json(heritage);
    }
    const allHeritages = await db.select().from(heritages);
    return res.status(200).json(allHeritages);
  }

  if (method === 'POST') {
    const [newHeritage] = await db.insert(heritages).values(req.body).returning();
    return res.status(201).json(newHeritage);
  }

  if (method === 'PUT' && id) {
    const [updatedHeritage] = await db.update(heritages).set(req.body).where(eq(heritages.id, id)).returning();
    return res.status(200).json(updatedHeritage);
  }

  if (method === 'DELETE' && id) {
    await db.delete(heritages).where(eq(heritages.id, id));
    return res.status(204).end();
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleArchetypes(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [archetype] = await db.select().from(archetypes).where(eq(archetypes.id, id));
      return res.status(200).json(archetype);
    }
    const allArchetypes = await db.select().from(archetypes);
    return res.status(200).json(allArchetypes);
  }

  if (method === 'POST') {
    const [newArchetype] = await db.insert(archetypes).values(req.body).returning();
    return res.status(201).json(newArchetype);
  }

  if (method === 'PUT' && id) {
    const [updatedArchetype] = await db.update(archetypes).set(req.body).where(eq(archetypes.id, id)).returning();
    return res.status(200).json(updatedArchetype);
  }

  if (method === 'DELETE' && id) {
    await db.delete(archetypes).where(eq(archetypes.id, id));
    return res.status(204).end();
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleSkills(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [skill] = await db.select().from(skills).where(eq(skills.id, id));
      return res.status(200).json(skill);
    }
    const allSkills = await db.select().from(skills);
    return res.status(200).json(allSkills);
  }

  if (method === 'POST') {
    const [newSkill] = await db.insert(skills).values(req.body).returning();
    return res.status(201).json(newSkill);
  }

  if (method === 'PUT' && id) {
    const [updatedSkill] = await db.update(skills).set(req.body).where(eq(skills.id, id)).returning();
    return res.status(200).json(updatedSkill);
  }

  if (method === 'DELETE' && id) {
    await db.delete(skills).where(eq(skills.id, id));
    return res.status(204).end();
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleCultures(req, res, method, id) {
  if (method === 'GET') {
    if (id) {
      const [culture] = await db.select().from(cultures).where(eq(cultures.id, id));
      return res.status(200).json(culture);
    }
    const allCultures = await db.select().from(cultures);
    return res.status(200).json(allCultures);
  }

  if (method === 'POST') {
    const [newCulture] = await db.insert(cultures).values(req.body).returning();
    return res.status(201).json(newCulture);
  }

  if (method === 'PUT' && id) {
    const [updatedCulture] = await db.update(cultures).set(req.body).where(eq(cultures.id, id)).returning();
    return res.status(200).json(updatedCulture);
  }

  if (method === 'DELETE' && id) {
    await db.delete(cultures).where(eq(cultures.id, id));
    return res.status(204).end();
  }

  return res.status(405).json({ message: 'Method not allowed' });
}