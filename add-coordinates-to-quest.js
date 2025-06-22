import dotenv from "dotenv";
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCoordinatesToCompletedQuest() {
  console.log('📍 Adding coordinates to completed quest...');
  
  try {
    // Find the completed quest
    const { data: completedQuest, error: findError } = await supabase
      .from('quests')
      .select('id, title')
      .eq('status', 'completed')
      .is('lat', null)
      .single();

    if (findError) {
      console.error('❌ Error finding completed quest:', findError);
      return;
    }

    if (!completedQuest) {
      console.log('✅ No completed quests without coordinates found');
      return;
    }

    console.log(`📋 Found completed quest: "${completedQuest.title}" (ID: ${completedQuest.id})`);

    // Add coordinates (Berkeley area as example)
    const { error: updateError } = await supabase
      .from('quests')
      .update({
        lat: 37.8715,  // Berkeley latitude
        lng: -122.2730  // Berkeley longitude
      })
      .eq('id', completedQuest.id);

    if (updateError) {
      console.error('❌ Error updating quest coordinates:', updateError);
      return;
    }

    console.log('✅ Successfully added coordinates to quest!');
    console.log('📍 Coordinates: (37.8715, -122.2730) - Berkeley area');
    console.log('\n🔄 Now refresh your map page to see the pin!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addCoordinatesToCompletedQuest(); 