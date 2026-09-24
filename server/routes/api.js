import { Router } from 'express';
import { authenticateRequest } from '../middleware/auth.js';
import { requireAdministrator, requireAnyPermission, requirePermission } from '../middleware/authorization.js';
import { asyncHandler } from '../utils/http.js';
import { permissionsController, projectsController, taskMasterController, tasksController, usersController } from '../controllers/controllers.js';
import { filesController } from '../controllers/filesController.js';
import { foldersController } from '../controllers/foldersController.js';
import { profileController } from '../controllers/profileController.js'
import multer from 'multer';

const router = Router();
router.use(authenticateRequest);

router.get('/me', (req, res) => res.json({ success: true, data: req.user }));

router.get('/users', requireAnyPermission('user_view', 'employee_view'), asyncHandler(usersController.list));
router.get('/users/:id', requireAnyPermission('user_view', 'employee_view'), asyncHandler(usersController.get));
router.post('/users', requireAnyPermission('user_create', 'employee_create'), asyncHandler(usersController.create));
router.put('/users/:id', requireAnyPermission('user_create', 'employee_create'), asyncHandler(usersController.update));
router.delete('/users/:id', requireAdministrator, asyncHandler(usersController.remove));
router.get('/users/:id/permissions', requirePermission('user_view'), asyncHandler(usersController.permissions));
router.put('/users/:id/permissions', requirePermission('user_assign'), asyncHandler(usersController.replacePermissions));
router.get('/permissions', requirePermission('user_view'), asyncHandler(permissionsController.list));

router.get('/projects', requirePermission('project_view'), asyncHandler(projectsController.list));
router.get('/projects/:id', requirePermission('project_view'), asyncHandler(projectsController.get));
router.post('/projects', requirePermission('project_create'), asyncHandler(projectsController.create));
router.put('/projects/:id', requirePermission('project_create'), asyncHandler(projectsController.update));
router.delete('/projects/:id', requirePermission('project_delete'), asyncHandler(projectsController.remove));
router.get('/projects/:id/users', requirePermission('project_view'), asyncHandler(projectsController.assignments));
router.post('/projects/:id/users', requirePermission('user_assign'), asyncHandler(projectsController.assign));
router.delete('/projects/:id/users/:userId', requirePermission('user_assign'), asyncHandler(projectsController.unassign));

router.get('/task-master/active', requirePermission('task_view'), asyncHandler(taskMasterController.list));
router.get('/task-master', requireAdministrator, asyncHandler(taskMasterController.list));
router.post('/task-master', requireAdministrator, asyncHandler(taskMasterController.create));
router.put('/task-master/:id', requireAdministrator, asyncHandler(taskMasterController.update));
router.delete('/task-master/:id', requireAdministrator, asyncHandler(taskMasterController.remove));


router.get(
  '/tasks', 
  requireAnyPermission('task_view','task_view_all'), 
  asyncHandler(tasksController.list)
);
router.get(
  '/tasks/:id', 
  requireAnyPermission('task_view', 'task_view_all'), 
  asyncHandler(tasksController.get)
);
router.post(
  '/tasks', 
  requirePermission('task_create'), 
  asyncHandler(tasksController.create)
);
router.put(
  '/tasks/:id', 
  requirePermission('task_edit'), 
  asyncHandler(tasksController.update)
);
router.delete(
  '/tasks/:id', 
  requirePermission('task_delete'), 
  asyncHandler(tasksController.remove)
);
router.get(
  '/tasks/:id/users', 
  requireAnyPermission('task_view', 'task_view_all'), 
  asyncHandler(tasksController.assignments)
);
router.post(
  '/tasks/:id/users', 
  requirePermission('user_assign'), 
  asyncHandler(tasksController.assign)
);
router.put(
  '/tasks/:id/users/:userId', 
  requirePermission('user_assign'), 
  asyncHandler(tasksController.updateAssignment)
);
router.delete(
  '/tasks/:id/users/:userId', 
  requirePermission('user_assign'), 
  asyncHandler(tasksController.unassign)
);



// =========================
// PROJECT FOLDER ROUTES
// =========================

router.get(
  '/projects/:projectId/folders',
  requirePermission('document_view'),
  asyncHandler(foldersController.list)
);

router.post(
  '/projects/:projectId/folders',
  requirePermission('document_upload'),
  asyncHandler(foldersController.create)
);

router.delete(
  '/projects/:projectId/folders/:folderId',
  requirePermission('document_delete'),
  asyncHandler(foldersController.remove)
);

// =========================
// PROFILE ROUTES
// =========================

router.get(
  '/profile',
  asyncHandler(profileController.getProfile)
);

router.put(
  '/profile',
  asyncHandler(profileController.updateProfile)
);

router.put(
  '/profile/password',
  asyncHandler(profileController.changePassword)
);
// =========================
// PROJECT FILE ROUTES
// =========================

router.get(
  '/projects/:projectId/folders/:folderId/files',
  requirePermission('document_view'),
  asyncHandler(filesController.list)
);

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  '/projects/:projectId/folders/:folderId/files',
  requirePermission('document_upload'),
  upload.single('file'),
  asyncHandler(filesController.upload)
);

router.get(
  '/files/:id',
  requirePermission('document_view'),
  asyncHandler(filesController.download)
);

router.delete(
  '/files/:id',
  requirePermission('document_delete'),
  asyncHandler(filesController.remove)
);
export default router;
