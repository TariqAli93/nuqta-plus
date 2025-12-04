import { RBACController } from '../controllers/rbacController.js';

const rbacController = new RBACController();

export default async function rbacRoutes(fastify) {
  fastify.get('/report', {
    onRequest: [fastify.authenticate],
    // Admin bypass will allow access; for non-admin, would require roles:read which isn't seeded
    // keep it admin-only effectively
    handler: rbacController.getReport.bind(rbacController),
    schema: {
      description: 'RBAC summary report',
      tags: ['rbac'],
      security: [{ bearerAuth: [] }],
    },
  });
}
