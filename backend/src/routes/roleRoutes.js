import { RoleController } from '../controllers/roleController.js';

const roleController = new RoleController();

export default async function roleRoutes(fastify) {
  // Roles
  fastify.get('/', {
    onRequest: [fastify.authorize('roles:read')],
    handler: roleController.list.bind(roleController),
    schema: { description: 'List roles', tags: ['roles'], security: [{ bearerAuth: [] }] },
  });

  fastify.post('/', {
    onRequest: [fastify.authorize('roles:create')],
    handler: roleController.create.bind(roleController),
    schema: { description: 'Create role', tags: ['roles'], security: [{ bearerAuth: [] }] },
  });

  fastify.put('/:id', {
    onRequest: [fastify.authorize('roles:update')],
    handler: roleController.update.bind(roleController),
    schema: { description: 'Update role', tags: ['roles'], security: [{ bearerAuth: [] }] },
  });

  fastify.delete('/:id', {
    onRequest: [fastify.authorize('roles:delete')],
    handler: roleController.remove.bind(roleController),
    schema: { description: 'Delete role', tags: ['roles'], security: [{ bearerAuth: [] }] },
  });

  fastify.post('/:id/permissions', {
    onRequest: [fastify.authorize('roles:update')],
    handler: roleController.assignPermissions.bind(roleController),
    schema: {
      description: 'Assign permissions to role',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['permissionIds'],
        properties: { permissionIds: { type: 'array', items: { type: 'number' } } },
      },
    },
  });

  fastify.get('/:id/permissions', {
    onRequest: [fastify.authorize('roles:read')],
    handler: roleController.getRolePermissions.bind(roleController),
    schema: {
      description: 'Get role permissions',
      tags: ['roles'],
      security: [{ bearerAuth: [] }],
    },
  });
}
