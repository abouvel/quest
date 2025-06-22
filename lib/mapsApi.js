import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Google Maps API integration for quest location validation
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('⚠️ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found in environment variables');
}

/**
 * Search for a place using Google Maps Places API
 * @param {string} placeName - Name of the place to search for
 * @param {string} location - General area to search in (e.g., "San Jose, CA")
 * @returns {Promise<Object|null>} Place details or null if not found
 */
export async function searchPlace(placeName, location) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not available, skipping address lookup');
    return null;
  }

  try {
    // First try: search with place name + location to get more specific results
    const searchQuery = `${placeName} ${location}`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status === 'OK' && searchData.results && searchData.results.length > 0) {
      // Use the first result since it should be the most relevant for the location
      const bestMatch = searchData.results[0];
      
      // Get detailed information including address and coordinates
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${bestMatch.place_id}&fields=formatted_address,name,rating,user_ratings_total,types,geometry&key=${GOOGLE_MAPS_API_KEY}`;
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.status === 'OK') {
        const placeDetails = detailsData.result;
        
        return {
          name: placeDetails.name,
          address: placeDetails.formatted_address,
          rating: placeDetails.rating,
          userRatingsTotal: placeDetails.user_ratings_total,
          types: placeDetails.types,
          placeId: bestMatch.place_id,
          coordinates: {
            lat: placeDetails.geometry?.location?.lat || bestMatch.geometry?.location?.lat,
            lng: placeDetails.geometry?.location?.lng || bestMatch.geometry?.location?.lng
          }
        };
      }
    }

    // Fallback: if location-specific search fails, try just the place name but with stricter filtering
    const fallbackUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placeName)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const fallbackResponse = await fetch(fallbackUrl);
    const fallbackData = await fallbackResponse.json();

    if (fallbackData.status === 'OK' && fallbackData.results && fallbackData.results.length > 0) {
      // Find the best match in the specified location area
      let bestMatch = null;
      
      // Look for results that contain the location in the address
      for (const result of fallbackData.results) {
        if (result.formatted_address && 
            result.formatted_address.toLowerCase().includes(location.toLowerCase())) {
          bestMatch = result;
          break;
        }
      }
      
      // If no location match found, use the first result but log a warning
      if (!bestMatch) {
        console.warn(`⚠️ Could not find "${placeName}" in "${location}". Using first result: ${fallbackData.results[0].formatted_address}`);
        bestMatch = fallbackData.results[0];
      }
      
      // Get detailed information
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${bestMatch.place_id}&fields=formatted_address,name,rating,user_ratings_total,types,geometry&key=${GOOGLE_MAPS_API_KEY}`;
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.status === 'OK') {
        const placeDetails = detailsData.result;
        
        return {
          name: placeDetails.name,
          address: placeDetails.formatted_address,
          rating: placeDetails.rating,
          userRatingsTotal: placeDetails.user_ratings_total,
          types: placeDetails.types,
          placeId: bestMatch.place_id,
          coordinates: {
            lat: placeDetails.geometry?.location?.lat || bestMatch.geometry?.location?.lat,
            lng: placeDetails.geometry?.location?.lng || bestMatch.geometry?.location?.lng
          }
        };
      }
    }

    return null;

  } catch (error) {
    console.error('Error searching for place:', error);
    return null;
  }
}

/**
 * Validate and enhance a quest with real location data
 * @param {Object} quest - Quest object with title, description, and locationName
 * @param {string} location - General area to search in
 * @returns {Promise<Object>} Enhanced quest with address information
 */
export async function validateQuestLocation(quest, location) {
  // Use the locationName field directly from the quest JSON
  const locationName = quest.locationName || '';
  
  if (!locationName) {
    return {
      ...quest,
      validated: false,
      location: null,
      error: 'No locationName provided'
    };
  }
  
  // First try: search with the exact locationName
  let placeDetails = await searchPlace(locationName, location);
  
  // Second try: if it contains apostrophes, try with just the first part
  if (!placeDetails && locationName.includes("'")) {
    const firstWord = locationName.split("'")[0].trim();
    placeDetails = await searchPlace(firstWord, location);
  }
  
  // Third try: if it's a long name, try with just the first two words
  if (!placeDetails && locationName.split(' ').length > 2) {
    const firstTwoWords = locationName.split(' ').slice(0, 2).join(' ');
    placeDetails = await searchPlace(firstTwoWords, location);
  }
  
  if (placeDetails) {
    // Enhance the quest with real location data including coordinates
    return {
      ...quest,
      location: {
        name: placeDetails.name,
        address: placeDetails.address,
        rating: placeDetails.rating,
        userRatingsTotal: placeDetails.userRatingsTotal,
        placeId: placeDetails.placeId,
        coordinates: placeDetails.coordinates
      },
      validated: true
    };
  } else {
    return {
      ...quest,
      validated: false,
      location: null,
      error: `Could not find address for "${locationName}"`
    };
  }
}

/**
 * Get location data for a specific place name
 * @param {string} placeName - Name of the place to get data for
 * @param {string} location - General area to search in
 * @returns {Promise<Object|null>} Location data or null if not found
 */
export async function getLocationData(placeName, location) {
  return await searchPlace(placeName, location);
}

/**
 * Get multiple place suggestions for a given area and category
 * @param {string} location - General area to search in
 * @param {string} category - Category of places (e.g., "restaurant", "park", "museum")
 * @param {number} limit - Number of suggestions to return
 * @returns {Promise<Array>} Array of place suggestions
 */
export async function getPlaceSuggestions(location, category, limit = 5) {
  if (!GOOGLE_MAPS_API_KEY) {
    return [];
  }

  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(category + ' in ' + location)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results) {
      return [];
    }

    return data.results.slice(0, limit).map(place => ({
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types
    }));

  } catch (error) {
    console.error('Error getting place suggestions:', error);
    return [];
  }
} 