-- Create allowed_emails table for email allowlist enforcement
CREATE TABLE public.allowed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'user',
  name TEXT,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can manage allowed emails
CREATE POLICY "Only admins can view allowed_emails"
ON public.allowed_emails
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert allowed_emails"
ON public.allowed_emails
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update allowed_emails"
ON public.allowed_emails
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete allowed_emails"
ON public.allowed_emails
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to check if email is in allowlist
CREATE OR REPLACE FUNCTION public.is_email_allowed(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.allowed_emails
    WHERE LOWER(email) = LOWER(check_email)
      AND is_active = true
  )
$$;

-- Create function to get user role from allowlist
CREATE OR REPLACE FUNCTION public.get_allowed_role(check_email TEXT)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.allowed_emails
  WHERE LOWER(email) = LOWER(check_email)
    AND is_active = true
  LIMIT 1
$$;

-- Update trigger to assign role from allowlist when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
BEGIN
  -- Get the role from allowed_emails table
  SELECT role INTO v_role
  FROM public.allowed_emails
  WHERE LOWER(email) = LOWER(NEW.email)
    AND is_active = true;
  
  -- If no role found, default to 'user'
  IF v_role IS NULL THEN
    v_role := 'user';
  END IF;
  
  -- Insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role);
  
  RETURN NEW;
END;
$$;