CREATE TABLE public.reminder_stops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stop_date date NOT NULL UNIQUE,
  stopped_by text NOT NULL,
  stopped_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.reminder_stops TO anon, authenticated;
GRANT ALL ON public.reminder_stops TO service_role;

ALTER TABLE public.reminder_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reminder stops"
  ON public.reminder_stops FOR SELECT
  USING (true);