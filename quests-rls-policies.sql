-- Enable RLS for the quests table
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Any authenticated user can view all quests
CREATE POLICY "Any authenticated user can view quests"
ON public.quests
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  true
);

-- INSERT policy: Only users can insert their own quests
CREATE POLICY "Users can insert their own quests"
ON public.quests
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- UPDATE policy: Only users can update their own quests
CREATE POLICY "Users can update their own quests"
ON public.quests
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
);

-- DELETE policy: Only users can delete their own quests
CREATE POLICY "Users can delete their own quests"
ON public.quests
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
);

-- Add image_path column if it doesn't exist
ALTER TABLE quests ADD COLUMN IF NOT EXISTS image_path TEXT; 