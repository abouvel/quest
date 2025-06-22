import dotenv from "dotenv";
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQuestCompletion() {
  console.log('🔍 Debugging quest completion...');
  
  try {
    // Check all quests and their status
    console.log('\n📋 All quests:');
    const { data: allQuests, error: allError } = await supabase
      .from('quests')
      .select('id, title, status, lat, lng, completed_at, user_id')
      .order('completed_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching quests:', allError);
      return;
    }

    console.log(`✅ Found ${allQuests?.length || 0} total quests`);
    
    if (allQuests && allQuests.length > 0) {
      allQuests.forEach((quest, index) => {
        console.log(`${index + 1}. "${quest.title}"`);
        console.log(`   ID: ${quest.id}`);
        console.log(`   Status: ${quest.status}`);
        console.log(`   User ID: ${quest.user_id}`);
        console.log(`   Coordinates: ${quest.lat ? `(${quest.lat}, ${quest.lng})` : 'None'}`);
        console.log(`   Completed: ${quest.completed_at ? new Date(quest.completed_at).toLocaleString() : 'Not completed'}`);
        console.log('');
      });
    }

    // Check specifically for completed quests
    console.log('\n✅ Completed quests:');
    const { data: completedQuests, error: completedError } = await supabase
      .from('quests')
      .select('id, title, status, lat, lng, completed_at, user_id')
      .eq('status', 'completed');

    if (completedError) {
      console.error('❌ Error fetching completed quests:', completedError);
      return;
    }

    console.log(`✅ Found ${completedQuests?.length || 0} completed quests`);
    
    if (completedQuests && completedQuests.length > 0) {
      completedQuests.forEach((quest, index) => {
        console.log(`${index + 1}. "${quest.title}"`);
        console.log(`   ID: ${quest.id}`);
        console.log(`   Coordinates: ${quest.lat ? `(${quest.lat}, ${quest.lng})` : 'None'}`);
        console.log(`   Completed: ${new Date(quest.completed_at).toLocaleString()}`);
        console.log('');
      });
    }

    // Check for quests with coordinates
    console.log('\n📍 Quests with coordinates:');
    const { data: questsWithCoords, error: coordsError } = await supabase
      .from('quests')
      .select('id, title, status, lat, lng, completed_at, user_id')
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    if (coordsError) {
      console.error('❌ Error fetching quests with coordinates:', coordsError);
      return;
    }

    console.log(`✅ Found ${questsWithCoords?.length || 0} quests with coordinates`);
    
    if (questsWithCoords && questsWithCoords.length > 0) {
      questsWithCoords.forEach((quest, index) => {
        console.log(`${index + 1}. "${quest.title}"`);
        console.log(`   ID: ${quest.id}`);
        console.log(`   Status: ${quest.status}`);
        console.log(`   Coordinates: (${quest.lat}, ${quest.lng})`);
        console.log(`   Completed: ${quest.completed_at ? new Date(quest.completed_at).toLocaleString() : 'Not completed'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugQuestCompletion(); 