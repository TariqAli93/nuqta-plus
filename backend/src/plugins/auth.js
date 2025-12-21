import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import config from '../config.js';
import db from '../db.js';
import { users, roles, permissions, rolePermissions } from '../models/index.js';
import { eq } from 'drizzle-orm';

async function authPlugin(fastify) {
  // Register JWT
  await fastify.register(jwt, {
    secret: config.jwt.secret,
  });

  // Decorate request with auth methods
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();

      // Get user from database
      const [user] = await db.select().from(users).where(eq(users.id, request.user.id)).limit(1);

      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      request.user = user;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  });

  fastify.decorate('authorize', function (requiredPermission) {
    return async function (request, reply) {
      await fastify.authenticate(request, reply);

      // Get user role and permissions
      const [userRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, request.user.roleId))
        .limit(1);

      if (!userRole) {
        throw new AuthorizationError('User role not found');
      }

      // Check if user has required permission
      const userPermissions = await db
        .select({
          name: permissions.name,
          resource: permissions.resource,
          action: permissions.action,
        })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, userRole.id));

      const hasPermission = userPermissions.some(
        (perm) => `${perm.resource}:${perm.action}` === requiredPermission
      );

      if (!hasPermission) {
        throw new AuthorizationError(`Permission denied: ${requiredPermission}`);
      }
    };
  });
}

export default fp(authPlugin);
