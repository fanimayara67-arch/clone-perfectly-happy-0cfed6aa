-- The previous RESTRICTIVE policy used FOR ALL which also blocked SELECT,
-- breaking admin role checks. Replace with separate restrictive policies for write ops only.
DROP POLICY IF EXISTS "No client modifications to user_roles" ON public.user_roles;

CREATE POLICY "Block client inserts on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Block client updates on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Block client deletes on user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO anon, authenticated
USING (false);

-- Also add a permissive SELECT policy so users can read their own role
-- (the existing "Admins can view roles" only lets admins read, but useAuth
-- needs to check role BEFORE knowing if user is admin → chicken-and-egg).
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
