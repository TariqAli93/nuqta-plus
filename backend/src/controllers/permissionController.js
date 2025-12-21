import { PermissionService } from '../services/permissionService.js';
import { z } from 'zod';

const permissionService = new PermissionService();

const permissionSchema = z.object({
  name: z.string().min(2),
  resource: z.string().min(2),
  action: z.enum(['create', 'read', 'update', 'delete', 'manage']),
  description: z.string().optional(),
});

export class PermissionController {
  async list(request, reply) {
    const { search } = request.query || {};
    const data = await permissionService.list({ search });
    return reply.send({ success: true, data });
  }

  async getById(request, reply) {
    const { id } = request.params;
    const perm = await permissionService.getById(Number(id));
    return reply.send({ success: true, data: perm });
  }

  async create(request, reply) {
    const data = permissionSchema.parse(request.body);
    const perm = await permissionService.create(data, request.user.id);
    return reply.code(201).send({ success: true, data: perm, message: 'Permission created' });
  }

  async update(request, reply) {
    const { id } = request.params;
    const data = permissionSchema.parse(request.body);
    const perm = await permissionService.update(Number(id), data, request.user.id);
    return reply.send({ success: true, data: perm, message: 'Permission updated' });
  }

  async remove(request, reply) {
    const { id } = request.params;
    const result = await permissionService.remove(Number(id), request.user.id);
    return reply.send({ success: true, data: result, message: 'Permission deleted' });
  }
}
