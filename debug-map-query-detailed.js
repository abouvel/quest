import dotenv from "dotenv";
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMapQuery() {
  console.log('🔍 Debugging map query issue...');
  
  try {
    // 1. Check ALL quests first
    console.log('\n📋 ALL QUESTS:');
    const { data: allQuests, error: allError } = await supabase
      .from('quests')
      .select('id, title, status, lat, lng, completed_at, user_id');

    if (allError) {
      console.error('❌ Error fetching all quests:', allError);
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

    // 2. Check completed quests specifically
    console.log('\n✅ COMPLETED QUESTS:');
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

    // 3. Check completed quests WITH coordinates (what the map query finds)
    console.log('\n📍 COMPLETED QUESTS WITH COORDINATES (Map Query):');
    const { data: mapQuests, error: mapError } = await supabase
      .from('quests')
      .select('id, title, status, lat, lng, completed_at, user_id')
      .eq('status', 'completed')
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    if (mapError) {
      console.error('❌ Error fetching map quests:', mapError);
      return;
    }

    console.log(`✅ Found ${mapQuests?.length || 0} completed quests with coordinates`);
    
    if (mapQuests && mapQuests.length > 0) {
      mapQuests.forEach((quest, index) => {
        console.log(`${index + 1}. "${quest.title}"`);
        console.log(`   ID: ${quest.id}`);
        console.log(`   Coordinates: (${quest.lat}, ${quest.lng})`);
        console.log(`   Completed: ${new Date(quest.completed_at).toLocaleString()}`);
        console.log('');
      });
    }

    // 4. Find the missing quest (completed but no coordinates)
    console.log('\n❓ MISSING FROM MAP (Completed but no coordinates):');
    const missingQuests = completedQuests?.filter(quest => !quest.lat || !quest.lng) || [];
    
    console.log(`⚠️ Found ${missingQuests.length} completed quests without coordinates`);
    
    if (missingQuests.length > 0) {
      missingQuests.forEach((quest, index) => {
        console.log(`${index + 1}. "${quest.title}"`);
        console.log(`   ID: ${quest.id}`);
        console.log(`   Status: ${quest.status}`);
        console.log(`   Coordinates: ${quest.lat ? `(${quest.lat}, ${quest.lng})` : 'None'}`);
        console.log(`   Completed: ${new Date(quest.completed_at).toLocaleString()}`);
        console.log('');
      });
    }

    // 5. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total quests: ${allQuests?.length || 0}`);
    console.log(`Completed quests: ${completedQuests?.length || 0}`);
    console.log(`Completed with coordinates: ${mapQuests?.length || 0}`);
    console.log(`Missing from map: ${missingQuests.length}`);
    
    if (missingQuests.length > 0) {
      console.log('\n💡 SOLUTION:');
      console.log('Run the add-coordinates-to-quests.js script to add coordinates to the missing quests.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugMapQuery(); 