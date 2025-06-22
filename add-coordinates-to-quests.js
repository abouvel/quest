import { supabase } from './lib/supabase.js'
import { searchPlace } from './lib/mapsApi.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function addCoordinatesToQuests() {
  try {
    console.log('🗺️ Adding coordinates to quests without them...')
    
    // Get all quests that don't have coordinates
    const { data: quests, error } = await supabase
      .from('quests')
      .select('id, title, description, tags')
      .or('lat.is.null,lng.is.null')
      .limit(10) // Process in batches
    
    if (error) {
      console.error('Error fetching quests:', error)
      return
    }
    
    console.log(`Found ${quests.length} quests without coordinates`)
    
    for (const quest of quests) {
      console.log(`\n📍 Processing quest: ${quest.title}`)
      
      // Try to extract location from title or description
      let locationName = null
      
      // Look for location patterns in title
      const titleMatch = quest.title.match(/(?:at|visit|go to|explore|check out)\s+([^,]+)/i)
      if (titleMatch) {
        locationName = titleMatch[1].trim()
      }
      
      // If no location found in title, try description
      if (!locationName) {
        const descMatch = quest.description.match(/(?:at|visit|go to|explore|check out)\s+([^,]+)/i)
        if (descMatch) {
          locationName = descMatch[1].trim()
        }
      }
      
      // If still no location, try to extract from tags or use a default location
      if (!locationName && quest.tags && quest.tags.length > 0) {
        // Use the first tag as a general category
        locationName = quest.tags[0]
      }
      
      if (locationName) {
        console.log(`🔍 Searching for location: ${locationName}`)
        
        // Search for the location (using a default area like "San Jose, CA")
        const placeDetails = await searchPlace(locationName, "San Jose, CA")
        
        if (placeDetails && placeDetails.coordinates) {
          console.log(`✅ Found coordinates: ${placeDetails.coordinates.lat}, ${placeDetails.coordinates.lng}`)
          
          // Update the quest with coordinates
          const { error: updateError } = await supabase
            .from('quests')
            .update({
              lat: placeDetails.coordinates.lat,
              lng: placeDetails.coordinates.lng
            })
            .eq('id', quest.id)
          
          if (updateError) {
            console.error(`❌ Error updating quest ${quest.id}:`, updateError)
          } else {
            console.log(`✅ Updated quest ${quest.id} with coordinates`)
          }
        } else {
          console.log(`⚠️ No coordinates found for: ${locationName}`)
        }
      } else {
        console.log(`⚠️ Could not extract location name from quest`)
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('\n✅ Finished processing quests')
    
  } catch (error) {
    console.error('❌ Error adding coordinates to quests:', error)
  }
}

// Run the script
addCoordinatesToQuests() 