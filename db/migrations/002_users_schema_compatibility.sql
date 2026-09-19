-- Compatibility migration for databases where users already existed.
-- Safe to run more than once.

BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.emp_id_seq;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS password_hash TEXT,
    ADD COLUMN IF NOT EXISTS active_session_id UUID;

ALTER TABLE public.users
    ALTER COLUMN emp_id SET DEFAULT (
        'EMP' || lpad(nextval('public.emp_id_seq')::text, 3, '0')
    );

SELECT setval(
    'public.emp_id_seq',
    COALESCE(
        (SELECT MAX(NULLIF(regexp_replace(emp_id, '[^0-9]', '', 'g'), '')::BIGINT)
         FROM public.users),
        0
    ) + 1,
    false
);

COMMIT;
