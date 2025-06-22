import dotenv from "dotenv";
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMapIntegration() {
  console.log('🧪 Testing map integration...');
  
  try {
    // First, let's see all quests
    console.log('\n📋 Checking all quests...');
    const { data: allQuests, error: allError } = await supabase
      .from('quests')
      .select('id, title, status, lat, lng, completed_at');

    if (allError) {
      console.error('❌ Error fetching all quests:', allError);
      return;
    }

    console.log(`✅ Found ${allQuests?.length || 0} total quests`);
    
    if (allQuests && allQuests.length > 0) {
      allQuests.forEach((quest, index) => {
        console.log(`${index + 1}. "${quest.title}"`);
        console.log(`   Status: ${quest.status}`);
        console.log(`   Coordinates: ${quest.lat ? `(${quest.lat}, ${quest.lng})` : 'None'}`);
        console.log(`   Completed: ${quest.completed_at ? new Date(quest.completed_at).toLocaleDateString() : 'Not completed'}`);
        console.log('');
      });
    }

    // Test the query that the map uses
    console.log('\n🗺️ Testing map query...');
    const { data, error } = await supabase
      .from('quests')
      .select(`
        id,
        title,
        description,
        lat,
        lng,
        completed_at,
        tags,
        user_id,
        users!quests_user_id_fkey(username)
      `)
      .eq('status', 'completed')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('❌ Query error:', error);
      return;
    }

    console.log(`✅ Map query: Found ${data?.length || 0} completed quests with coordinates`);
    
    if (data && data.length > 0) {
      console.log('\n📍 Quest locations:');
      data.forEach((quest, index) => {
        console.log(`${index + 1}. "${quest.title}"`);
        console.log(`   Location: (${quest.lat}, ${quest.lng})`);
        console.log(`   User: ${quest.users?.username || 'Unknown'}`);
        console.log(`   Completed: ${new Date(quest.completed_at).toLocaleDateString()}`);
        console.log(`   Category: ${quest.tags?.[0] || 'General'}`);
        console.log('');
      });
    }

    // Test today filter
    console.log('\n📅 Testing today filter...');
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const { data: todayQuests, error: todayError } = await supabase
      .from('quests')
      .select('id, title, completed_at')
      .eq('status', 'completed')
      .gte('completed_at', startOfDay.toISOString())
      .lt('completed_at', endOfDay.toISOString());

    if (todayError) {
      console.error('❌ Today filter error:', todayError);
    } else {
      console.log(`✅ Today filter: ${todayQuests?.length || 0} quests completed today`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testMapIntegration(); 