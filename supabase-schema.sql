-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  location TEXT,
  interests TEXT[],
  preference TEXT DEFAULT 'outdoor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create completed_quests table
CREATE TABLE completed_quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_quests table
CREATE TABLE generated_quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_quests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Completed quests: Users can only access their own completed quests
CREATE POLICY "Users can view own completed quests" ON completed_quests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completed quests" ON completed_quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Generated quests: Users can only access their own generated quests
CREATE POLICY "Users can view own generated quests" ON generated_quests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generated quests" ON generated_quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, location, interests, preference)
  VALUES (NEW.id, 'Unknown location', ARRAY['general'], 'outdoor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 