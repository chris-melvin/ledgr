-- Account Deletion RPC
-- Allows authenticated users to permanently delete their own account.
-- All user data is cascade-deleted via ON DELETE CASCADE foreign keys.

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM public;
