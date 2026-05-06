-- Add slug column to households
ALTER TABLE public.households ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Function to generate slug
CREATE OR REPLACE FUNCTION public.generate_slug(t TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(t, '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Update existing households with a slug
UPDATE public.households SET slug = generate_slug(name) || '-' || substr(id::text, 1, 8) WHERE slug IS NULL;

-- Trigger to update slug on insert/update
CREATE OR REPLACE FUNCTION public.handle_household_slug() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.slug IS NULL) OR (NEW.name <> OLD.name) THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_household_slug ON public.households;
CREATE TRIGGER tr_household_slug
BEFORE INSERT OR UPDATE ON public.households
FOR EACH ROW EXECUTE FUNCTION public.handle_household_slug();
