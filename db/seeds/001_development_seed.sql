-- Idempotent development seed for the Project Warehouse database foundation.
-- Deliberately contains no passwords or real credentials.

BEGIN;

INSERT INTO permissions (permission_code)
VALUES
    ('project_view'),
    ('project_create'),
    ('employee_view'),
    ('employee_create'),
    ('user_view'),
    ('user_create'),
    ('user_assign'),
    ('task_view'),
    ('task_create'),
    ('task_edit'),
    ('task_delete')
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO users (user_id, emp_id, user_name, mobile, email, user_type)
VALUES
    ('user-admin', 'EMP001', 'Development Administrator', NULL, 'development-admin@example.invalid', 'Administrator'),
    ('user-standard', 'EMP002', 'Development User', NULL, 'development-user@example.invalid', 'User')
ON CONFLICT (user_id) DO UPDATE SET
    emp_id = EXCLUDED.emp_id,
    user_name = EXCLUDED.user_name,
    mobile = EXCLUDED.mobile,
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type;

INSERT INTO user_permissions (user_id, permission_code)
SELECT 'user-admin', permission_code
FROM permissions
ON CONFLICT (user_id, permission_code) DO NOTHING;

INSERT INTO user_permissions (user_id, permission_code)
VALUES
    ('user-standard', 'project_view'),
    ('user-standard', 'employee_view'),
    ('user-standard', 'task_view')
ON CONFLICT (user_id, permission_code) DO NOTHING;

INSERT INTO projects (project_id, project_name, project_status)
VALUES ('project-demo', 'Development Project', 'Active')
ON CONFLICT (project_id) DO UPDATE SET
    project_name = EXCLUDED.project_name,
    project_status = EXCLUDED.project_status;

INSERT INTO project_user_mapping (project_id, user_id)
VALUES
    ('project-demo', 'user-admin'),
    ('project-demo', 'user-standard')
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO task_master (task_id, task_name, status)
VALUES
    ('TASK001', 'Prepare project report', 'Active'),
    ('TASK002', 'Review project data', 'Active')
ON CONFLICT (task_id) DO UPDATE SET
    task_name = EXCLUDED.task_name,
    status = EXCLUDED.status;

INSERT INTO tasks (
    task_id,
    project_id,
    description,
    status,
    reference_link,
    reference_document
)
VALUES
    (
        'TASK001',
        'project-demo',
        'Prepare the initial development project report.',
        'Pending',
        'https://example.invalid/project-report',
        NULL
    ),
    (
        'TASK002',
        'project-demo',
        'Review the development project data.',
        'In Progress',
        NULL,
        NULL
    )
ON CONFLICT (task_id) DO UPDATE SET
    project_id = EXCLUDED.project_id,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    reference_link = EXCLUDED.reference_link,
    reference_document = EXCLUDED.reference_document;

INSERT INTO task_user_mapping (task_id, user_id)
VALUES
    ('TASK001', 'user-admin'),
    ('TASK002', 'user-standard')
ON CONFLICT (task_id, user_id) DO NOTHING;

COMMIT;
