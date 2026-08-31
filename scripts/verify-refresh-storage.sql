\set ON_ERROR_STOP on

-- Raw refresh credentials are 64-character hexadecimal strings. Their SHA-256
-- database representation is also 64 characters, so this check is paired with
-- the session-service unit test that proves the raw value and stored value differ.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "RefreshToken"
    WHERE length("tokenHash") <> 64
  ) THEN
    RAISE EXCEPTION 'RefreshToken contains a value that is not a SHA-256 hex digest';
  END IF;
END
$$;

SELECT
  count(*) AS stored_sessions,
  count(*) FILTER (WHERE "revokedAt" IS NULL) AS active_sessions,
  min(length("tokenHash")) AS minimum_hash_length,
  max(length("tokenHash")) AS maximum_hash_length
FROM "RefreshToken";
