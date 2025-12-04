import { RoleService } from '../services/roleService.js';
import { roleSchema } from '../utils/validation.js';

const roleService = new RoleService();

export class RoleController {
  async list(request, reply) {
    const data = await roleService.list();
    return reply.send({ success: true, data });
  }

  async create(request, reply) {
    const data = roleSchema.parse(request.body);
    const role = await roleService.create(data, request.user.id);
    return reply.code(201).send({ success: true, data: role, message: 'Role created' });
  }

  async update(request, reply) {
    const { id } = request.params;
    const data = roleSchema.parse(request.body);
    const role = await roleService.update(Number(id), data, request.user.id);
    return reply.send({ success: true, data: role, message: 'Role updated' });
  }

  async remove(request, reply) {
    const { id } = request.params;
    const result = await roleService.remove(Number(id), request.user.id);
    return reply.send({ success: true, data: result, message: 'Role deleted' });
  }

  async assignPermissions(request, reply) {
    const { id } = request.params;
    const { permissionIds } = request.body || {};
    const result = await roleService.assignPermissions(
      Number(id),
      permissionIds || [],
      request.user.id
    );
    return reply.send({ success: true, data: result, message: 'Permissions assigned' });
  }

  async getRolePermissions(request, reply) {
    const { id } = request.params;
    const data = await roleService.getRolePermissions(Number(id));
    return reply.send({ success: true, data });
  }
}
