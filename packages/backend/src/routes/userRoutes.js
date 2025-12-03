import { UserController } from '../controllers/userController.js';

const userController = new UserController();

export default async function userRoutes(fastify) {
  // All routes protected; admin bypass applies
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    handler: userController.list.bind(userController),
    schema: {
      description: 'List users',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          limit: { type: 'number' },
          search: { type: 'string' },
          roleId: { type: 'number' },
          isActive: { type: 'string' },
        },
      },
    },
  });

  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    handler: userController.getById.bind(userController),
    schema: {
      description: 'Get user by id',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
    },
  });

  fastify.post('/', {
    onRequest: [fastify.authenticate],
    handler: userController.create.bind(userController),
    schema: {
      description: 'Create user',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
    },
  });

  fastify.put('/:id', {
    onRequest: [fastify.authenticate],
    handler: userController.update.bind(userController),
    schema: {
      description: 'Update user',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
    },
  });

  fastify.post('/:id/reset-password', {
    onRequest: [fastify.authenticate],
    handler: userController.resetPassword.bind(userController),
    schema: {
      description: 'Reset user password',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
    },
  });

  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    handler: userController.remove.bind(userController),
    schema: {
      description: 'Deactivate user',
      tags: ['users'],
      security: [{ bearerAuth: [] }],
    },
  });

  fastify.get('/check-first-user', {
    handler: userController.checkFirstUser.bind(userController),
    schema: {
      description: 'Check if first user exists',
      tags: ['users'],
    },
  });
}
