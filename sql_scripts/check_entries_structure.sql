-- Get complete table structure including constraints
SELECT
    pg_get_constraintdef(c.oid) as constraint_definition,
    con.conname as constraint_name
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class con ON con.oid = c.conrelid
WHERE con.relname = 'entries'
    AND n.nspname = 'public'
    AND c.contype = 'c';  -- Check constraints only
