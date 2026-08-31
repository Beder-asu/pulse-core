CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  unix_ts_ms bigint;
  timestamp_hex text;
  random_hex text;
  variant_hex text;
BEGIN
  unix_ts_ms := floor(extract(epoch FROM clock_timestamp()) * 1000);
  timestamp_hex := lpad(to_hex(unix_ts_ms), 12, '0');
  random_hex := encode(gen_random_bytes(10), 'hex');
  variant_hex := substr('89ab', ((get_byte(decode(substr(random_hex, 3, 2), 'hex'), 0) & 3) + 1), 1);

  RETURN (
    substr(timestamp_hex, 1, 8) || '-' ||
    substr(timestamp_hex, 9, 4) || '-' ||
    '7' || substr(random_hex, 1, 3) || '-' ||
    variant_hex || substr(random_hex, 5, 3) || '-' ||
    substr(random_hex, 8, 12)
  )::uuid;
END;
$$;
