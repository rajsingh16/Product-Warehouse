# Project Warehouse database layer

The database layer uses the existing `pg` dependency and the `DATABASE_URL` environment variable.

## Apply the migration

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/001_initial_schema.sql
```

## Apply the development seed

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/seeds/001_development_seed.sql
```

The migration is additive and does not drop tables or data. The seed is idempotent for the development records it owns.

## Verify the foundation

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'permissions', 'user_permissions', 'projects', 'project_user_mapping', 'task_master', 'tasks', 'task_user_mapping') ORDER BY table_name;"
```
