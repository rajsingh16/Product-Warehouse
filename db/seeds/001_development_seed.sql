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

INSERT INTO users (user_id, emp_id, user_name, mobile, email, user_type, password_hash)
VALUES
    ('user-admin', 'EMP001', 'Development Administrator', '+918527285412', 'development-admin@example.invalid', 'Administrator', '$2b$12$MKuBaMH9gAhmvTlo81Ej1OTZ0MYLU/Q6Pk0RwBUyl64JoGS9/1VNS'),
    ('user-standard', 'EMP002', 'Development User', '+917011988927', 'development-user@example.invalid', 'User', '$2b$12$z6qChQhidCaP7Tgn4hDT.ODw5zvuvJ/zYPe3UjLqDbVP32Trw4tWi')
ON CONFLICT (user_id) DO UPDATE SET
    emp_id = EXCLUDED.emp_id,
    user_name = EXCLUDED.user_name,
    mobile = EXCLUDED.mobile,
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type,
    password_hash = EXCLUDED.password_hash;

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

INSERT INTO task_master (task_name, status)
VALUES
    ('Prepare project report', 'A'),
    ('Review project data', 'A');

INSERT INTO task_user_mapping (
    pid,
    description,
    status,
    reference_link,
    reference_document
)
VALUES
    (
        1,
        'Prepare the initial development project report.',
        'Pending',
        'https://example.invalid/project-report',
        NULL
    ),
    (
        2,
        'Review the development project data.',
        'In Progress',
        NULL,
        NULL
    );

COMMIT;
