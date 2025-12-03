import { PermissionController } from '../controllers/permissionController.js';

const permissionController = new PermissionController();

export default async function permissionRoutes(fastify) {
  // Permissions
  fastify.get('/', {
    onRequest: [fastify.authorize('permissions:read')],
    handler: permissionController.list.bind(permissionController),
    schema: {
      description: 'List permissions',
      tags: ['permissions'],
      security: [{ bearerAuth: [] }],
    },
  });

  fastify.get('/:id', {
    onRequest: [fastify.authorize('permissions:read')],
    handler: permissionController.getById.bind(permissionController),
    schema: {
      description: 'Get permission by id',
      tags: ['permissions'],
      security: [{ bearerAuth: [] }],
    },
  });

  fastify.post('/', {
    onRequest: [fastify.authorize('permissions:create')],
    handler: permissionController.create.bind(permissionController),
    schema: {
      description: 'Create permission',
      tags: ['permissions'],
      security: [{ bearerAuth: [] }],
    },
  });

  fastify.put('/:id', {
    onRequest: [fastify.authorize('permissions:update')],
    handler: permissionController.update.bind(permissionController),
    schema: {
      description: 'Update permission',
      tags: ['permissions'],
      security: [{ bearerAuth: [] }],
    },
  });

  fastify.delete('/:id', {
    onRequest: [fastify.authorize('permissions:delete')],
    handler: permissionController.remove.bind(permissionController),
    schema: {
      description: 'Delete permission',
      tags: ['permissions'],
      security: [{ bearerAuth: [] }],
    },
  });
}
