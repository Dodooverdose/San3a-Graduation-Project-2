-- Public-safe landing metrics RPC.
-- Returns only aggregate counts so landing page works for both signed-in and signed-out users.

CREATE OR REPLACE FUNCTION public.get_landing_metrics()
RETURNS TABLE (
  customers_count BIGINT,
  technicians_count BIGINT,
  total_requests BIGINT,
  completed_requests BIGINT,
  active_service_counts JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH service_counts AS (
    SELECT jsonb_object_agg(service_type, cnt) AS counts
    FROM (
      SELECT
        r.service_type,
        COUNT(*)::BIGINT AS cnt
      FROM public.request r
      WHERE LOWER(COALESCE(r.request_status, 'pending')) NOT IN ('completed', 'cancelled')
        AND r.service_type IS NOT NULL
      GROUP BY r.service_type
    ) s
  )
  SELECT
    (SELECT COUNT(*)::BIGINT FROM public.users),
    (SELECT COUNT(*)::BIGINT FROM public.technician),
    (SELECT COUNT(*)::BIGINT FROM public.request),
    (
      SELECT COUNT(*)::BIGINT
      FROM public.request
      WHERE LOWER(COALESCE(request_status, '')) = 'completed'
    ),
    COALESCE((SELECT counts FROM service_counts), '{}'::jsonb);
$$;

REVOKE ALL ON FUNCTION public.get_landing_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_landing_metrics() TO anon;
GRANT EXECUTE ON FUNCTION public.get_landing_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_landing_metrics() TO service_role;
