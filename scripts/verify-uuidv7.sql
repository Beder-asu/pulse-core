DO $$
DECLARE
  column_record record;
  invalid_count bigint;
BEGIN
  FOR column_record IN
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'uuid'
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM %I.%I WHERE %I IS NOT NULL AND substring(%I::text, 15, 1) <> ''7''',
      column_record.table_schema,
      column_record.table_name,
      column_record.column_name,
      column_record.column_name
    ) INTO invalid_count;

    IF invalid_count > 0 THEN
      RAISE EXCEPTION 'Column %.%.% contains % non-UUIDv7 values',
        column_record.table_schema,
        column_record.table_name,
        column_record.column_name,
        invalid_count;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'id'
      AND (data_type <> 'uuid' OR column_default NOT LIKE '%uuid_generate_v7%')
  ) THEN
    RAISE EXCEPTION 'One or more primary ID columns lack the UUIDv7 database default';
  END IF;
END;
$$;

SELECT current_database() AS database,
       count(*) FILTER (WHERE data_type = 'uuid') AS uuid_columns,
       count(*) FILTER (WHERE column_name = 'id') AS id_columns
FROM information_schema.columns
WHERE table_schema = 'public';
