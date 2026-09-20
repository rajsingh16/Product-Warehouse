import { permissionsRepository, projectsRepository, taskMasterRepository, tasksRepository, usersRepository } from '../repositories/repository.js';
import { HttpError, paginatedResponse, parsePagination, permissionList, requiredString, optionalString } from '../utils/http.js';
import { foldersController } from './foldersController.js';
import bcrypt from 'bcrypt';

const allowedPermissions = new Set([
  'project_view', 'project_create','project_delete',
  'document_view','document_upload','document_delete', 
  'employee_view', 'employee_create', 
  'user_view', 'user_create', 'user_assign',
  'task_view', 'task_create', 'task_edit', 'task_delete',
]);

const MIN_PASSWORD_LENGTH = 8;

function validatedPassword(value) {
  const password = requiredString(value, 'password');
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  return password;
}

function bodyUser(body, id = body.userId) {
  const isUpdate = Boolean(id) && id !== body.userId;
  return {
    userId: requiredString(id, 'userId'),
    // Made optional: preserves incoming empId if provided (e.g. during updates), otherwise stays undefined
    empId: optionalString(body.empId, 'empId'),
    userName: requiredString(body.userName, 'userName'),
    mobile: optionalString(body.mobile, 'mobile'),
    email: requiredString(body.email, 'email'),
    dateOfJoining: optionalString(body.dateOfJoining, 'dateOfJoining'),
    userType: ['Administrator', 'User'].includes(body.userType)
      ? body.userType
      : (() => { throw new HttpError(400, 'userType must be Administrator or User'); })(),
    // On create: required. On update: optional — omitted/blank means "keep current".
    password: body.password ? validatedPassword(body.password) : undefined,
  };
}

function bodyCreateUser(body) {
  return {
    userId: requiredString(body.userId, 'userId'),
    // Made optional: if body.empId is omitted/empty, it evaluates to undefined, allowing PostgreSQL to assign the default sequence
    empId: optionalString(body.empId, 'empId'),
    userName: requiredString(body.userName, 'userName'),
    mobile: optionalString(body.mobile, 'mobile'),
    email: requiredString(body.email, 'email'),
    dateOfJoining: optionalString(body.dateOfJoining, 'dateOfJoining'),
    userType: ['Administrator', 'User'].includes(body.userType)
      ? body.userType
      : (() => {
          throw new HttpError(
            400,
            'userType must be Administrator or User'
          );
        })(),
    password: requiredString(body.password, 'password'),
  };
}

function bodyProject(body, id = body.projectId) {
  return { projectId: requiredString(id, 'projectId'), projectName: requiredString(body.projectName, 'projectName'), projectStatus: requiredString(body.projectStatus ?? 'Active', 'projectStatus') };
}

function bodyTaskMaster(body, id = body.taskId) {
  return { taskId: id ? requiredString(id, 'taskId') : undefined, taskName: requiredString(body.taskName, 'taskName'), status: requiredString(body.status ?? 'Active', 'status') };
}

function bodyTask(body, id = body.taskId) {
  return {
    id: id ? requiredString(id, 'id') : undefined,
    taskId: requiredString(body.taskId ?? body.pid, 'taskId'),
    projectId: requiredString(body.projectId, 'projectId'),
    description: requiredString(body.description, 'description'),
    status: requiredString(body.status, 'status'),
    referenceLink: optionalString(body.referenceLink, 'referenceLink'),
    referenceDocument: optionalString(body.referenceDocument, 'referenceDocument'),
    assignedTo: optionalString(body.assignedTo, 'assignedTo'),
    assignedOn: optionalString(body.assignedOn, 'assignedOn'),
  };
}

export const usersController = {
  async list(req, res) {
    const { page, pageSize, offset } = parsePagination(req.query);
    const result = await usersRepository.list({ search: optionalString(req.query.search, 'search'), pageSize, offset });
    paginatedResponse(res, result.rows, page, pageSize, result.total);
  },
  async get(req, res) {
    const user = await usersRepository.get(requiredString(req.params.id, 'id'));
    if (!user) throw new HttpError(404, 'User not found');
    res.json({ success: true, data: user });
  },
  async create(req, res) {
    const input = bodyCreateUser(req.body);
  
    const passwordHash = input.password;
  
    const user = await usersRepository.create({
      userId: input.userId,
      empId: input.empId,
      userName: input.userName,
      mobile: input.mobile,
      email: input.email,
      dateOfJoining: input.dateOfJoining,
      userType: input.userType,
      passwordHash,
    });
  
    res.status(201).json({
      success: true,
      data: user,
    });
  },
  async update(req, res) {
  const input = bodyUser(req.body, req.params.id);
  const { password, ...details } = input;
  const user = await usersRepository.update(requiredString(req.params.id, 'id'), {
    ...details,
    passwordHash: password ? await bcrypt.hash(password, 12) : null,
  });
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ success: true, data: user });
},
  async remove(req, res) {
    if (!(await usersRepository.remove(requiredString(req.params.id, 'id')))) throw new HttpError(404, 'User not found');
    res.status(204).send();
  },
  async permissions(req, res) {
    if (!(await usersRepository.get(requiredString(req.params.id, 'id')))) throw new HttpError(404, 'User not found');
    res.json({ success: true, data: await usersRepository.permissions(req.params.id) });
  },
  async replacePermissions(req, res) {
    const permissions = permissionList(req.body.permissions);
    const invalid = permissions.filter((permission) => !allowedPermissions.has(permission));
    if (invalid.length) throw new HttpError(400, 'Unknown permission', { invalid });
    if (!(await usersRepository.get(requiredString(req.params.id, 'id')))) throw new HttpError(404, 'User not found');
    res.json({ success: true, data: await usersRepository.replacePermissions(req.params.id, permissions) });
  },
};

export const projectsController = {
  async list(req, res) {
    const { page, pageSize, offset } = parsePagination(req.query);

    const assignedTo =
      req.user.user_type === 'Administrator'
        ? undefined
        : req.user.user_id;

    const result = await projectsRepository.list({
      search: optionalString(req.query.search, 'search'),
      status: optionalString(req.query.status, 'status'),
      assignedTo,
      pageSize,
      offset,
    });

    paginatedResponse(
      res,
      result.rows,
      page,
      pageSize,
      result.total
    );
  },

  async get(req, res) {
    const assignedTo =
      req.user.user_type === 'Administrator'
        ? undefined
        : req.user.user_id;

    const project = await projectsRepository.get(
      requiredString(req.params.id, 'id'),
      assignedTo
    );

    if (!project) {
      throw new HttpError(404, 'Project not found');
    }

    res.json({
      success: true,
      data: project,
    });
  },

  async create(req, res) {
    res.status(201).json({
      success: true,
      data: await projectsRepository.create(bodyProject(req.body)),
    });
  },

  async update(req, res) {
    const project = await projectsRepository.update(
      req.params.id,
      bodyProject(req.body, req.params.id)
    );

    if (!project) {
      throw new HttpError(404, 'Project not found');
    }

    res.json({
      success: true,
      data: project,
    });
  },

  async remove(req, res) {
    if (
      !(await projectsRepository.remove(
        requiredString(req.params.id, 'id')
      ))
    ) {
      throw new HttpError(404, 'Project not found');
    }

    res.status(204).send();
  },

  async assignments(req, res) {
    res.json({
      success: true,
      data: await projectsRepository.assignments(
        requiredString(req.params.id, 'id')
      ),
    });
  },

  async assign(req, res) {
    res.status(201).json({
      success: true,
      data: await projectsRepository.assign(
        req.params.id,
        requiredString(req.body.userId, 'userId')
      ),
    });
  },

  async unassign(req, res) {
    if (
      !(await projectsRepository.unassign(
        req.params.id,
        requiredString(req.body.userId, 'userId')
      ))
    ) {
      throw new HttpError(404, 'Project assignment not found');
    }

    res.status(204).send();
  },
};

export const taskMasterController = {
  async list(req, res) {
    const { page, pageSize, offset } = parsePagination(req.query);
    const includeInactive = req.query.includeInactive === 'true' && req.user.user_type === 'Administrator';
    const result = await taskMasterRepository.list({ search: optionalString(req.query.search, 'search'), includeInactive, pageSize, offset });
    paginatedResponse(res, result.rows, page, pageSize, result.total);
  },
  async create(req, res) { res.status(201).json({ success: true, data: await taskMasterRepository.create(bodyTaskMaster(req.body)) }); },
  async update(req, res) {
    const task = await taskMasterRepository.update(req.params.id, bodyTaskMaster(req.body, req.params.id));
    if (!task) throw new HttpError(404, 'Task master record not found');
    res.json({ success: true, data: task });
  },
  async remove(req, res) {
    if (!(await taskMasterRepository.remove(requiredString(req.params.id, 'id')))) throw new HttpError(404, 'Task master record not found');
    res.status(204).send();
  },
};

export const tasksController = {
  async list(req, res) {
    const { page, pageSize, offset } = parsePagination(req.query);
    const assignedTo =
      req.user.user_type === 'Administrator'
      ? undefined
      : req.user.emp_id;
    const result = await tasksRepository.list({ search: optionalString(req.query.search, 'search'), status: optionalString(req.query.status, 'status'), projectId: optionalString(req.query.projectId, 'projectId'),assignedTo, pageSize, offset });
    paginatedResponse(res, result.rows, page, pageSize, result.total);
  },
  async get(req, res) {
    const task = await tasksRepository.get(requiredString(req.params.id, 'id'),assignedTo);
    const assignedTo =
      req.user.user_type === 'Administrator'
      ? undefined
      : req.user.emp_id;
    const result = await taskMasterRepository.list({
      search: optionalString(req.query.search, 'search'),
      status: optionalString(req.query.status, 'status'),
      projectId: optionalString(req.query.projectId, 'projectId'),
      assignedTo,
      pageSize,
      offset,
    });
    paginatedResponse(
      res,
      result.rows,
      page,
      pageSize,
      result.total
    );
  },
  async get(req, res) {
    const assignedTo =
      req.user.user_type === 'Administrator'
        ? undefined
        : req.user.emp_id;

    const task = await tasksRepository.get(
      requiredString(req.params.id, 'id'),
      assignedTo
    );

    if (!task) throw new HttpError(404, 'Task not found');
    res.json({ success: true, data: task });
  },
  async create(req, res) { res.status(201).json({ success: true, data: await tasksRepository.create(bodyTask(req.body)) }); },
  async update(req, res) {
    const task = await tasksRepository.update(req.params.id, bodyTask(req.body, req.params.id));
    if (!task) throw new HttpError(404, 'Task not found');
    res.json({ success: true, data: task });
  },
  async remove(req, res) {
    if (!(await tasksRepository.remove(requiredString(req.params.id, 'id')))) throw new HttpError(404, 'Task not found');
    res.status(204).send();
  },
  async assignments(req, res) { res.json({ success: true, data: await tasksRepository.assignments(requiredString(req.params.id, 'id')) }); },
  async assign(req, res) { res.status(201).json({ success: true, data: await tasksRepository.assign(req.params.id, requiredString(req.body.userId, 'userId')) }); },
  async updateAssignment(req, res) {
    const assignedOn = requiredString(req.body.assignedOn, 'assignedOn');
    if (Number.isNaN(Date.parse(assignedOn))) throw new HttpError(400, 'assignedOn must be a valid date');
    const assignment = await tasksRepository.updateAssignment(req.params.id, requiredString(req.params.userId, 'userId'), assignedOn);
    if (!assignment) throw new HttpError(404, 'Task assignment not found');
    res.json({ success: true, data: assignment });
  },
  async unassign(req, res) {
    if (!(await tasksRepository.unassign(req.params.id, requiredString(req.params.userId, 'userId')))) throw new HttpError(404, 'Task assignment not found');
    res.status(204).send();
  },
};

export const permissionsController = {
  async list(_req, res) { res.json({ success: true, data: await permissionsRepository.list() }); },
};
