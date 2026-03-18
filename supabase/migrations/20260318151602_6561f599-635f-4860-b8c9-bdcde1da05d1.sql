
CREATE OR REPLACE FUNCTION public.compute_vehicle_fingerprint(
  _make text, _model text, _year integer, _reg text, _mileage integer, _color text
) RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT md5(
    lower(coalesce(_make, '')) || '|' ||
    lower(coalesce(_model, '')) || '|' ||
    coalesce(_year::text, '') || '|' ||
    lower(coalesce(_reg, '')) || '|' ||
    CASE
      WHEN _mileage IS NULL THEN ''
      WHEN _mileage < 10000 THEN '0-10k'
      WHEN _mileage < 30000 THEN '10-30k'
      WHEN _mileage < 60000 THEN '30-60k'
      WHEN _mileage < 100000 THEN '60-100k'
      ELSE '100k+'
    END || '|' ||
    lower(coalesce(_color, ''))
  );
$$;
