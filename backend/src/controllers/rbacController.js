import db from '../db.js';
import { users, roles, permissions, rolePermissions } from '../models/index.js';
import { eq, count } from 'drizzle-orm';

export class RBACController {
  async getReport(request, reply) {
    // Counts
    const usersCount = (await db.select({ c: count() }).from(users))[0]?.c || 0;
    const rolesCount = (await db.select({ c: count() }).from(roles))[0]?.c || 0;
    const permissionsCount = (await db.select({ c: count() }).from(permissions))[0]?.c || 0;

    // Users per role
    const allRoles = await db.select().from(roles);
    const usersPerRole = [];
    for (const role of allRoles) {
      const c =
        (await db.select({ c: count() }).from(users).where(eq(users.roleId, role.id)))[0]?.c || 0;
      usersPerRole.push({ role: role.name, users: c });
    }

    // Role permissions
    const rolePerms = [];
    for (const role of allRoles) {
      const perms = await db
        .select({ name: permissions.name })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, role.id));
      rolePerms.push({ role: role.name, permissions: perms.map((p) => p.name) });
    }

    return reply.send({
      success: true,
      data: { usersCount, rolesCount, permissionsCount, usersPerRole, rolePermissions: rolePerms },
    });
  }
}
