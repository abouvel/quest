import os
import requests
import json

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY") or os.environ.get("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")

if not GOOGLE_MAPS_API_KEY:
    print('⚠️ GOOGLE_MAPS_API_KEY not found in environment variables')

def search_place(place_name, location):
    if not GOOGLE_MAPS_API_KEY:
        print('Google Maps API key not available, skipping address lookup')
        return None
    try:
        # First try: search with place name + location
        search_query = f"{place_name} {location}"
        search_url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={requests.utils.quote(search_query)}&key={GOOGLE_MAPS_API_KEY}"
        search_response = requests.get(search_url)
        search_data = search_response.json()
        if search_data.get('status') == 'OK' and search_data.get('results'):
            best_match = search_data['results'][0]
            # Get details
            details_url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={best_match['place_id']}&fields=formatted_address,name,rating,user_ratings_total,types,geometry&key={GOOGLE_MAPS_API_KEY}"
            details_response = requests.get(details_url)
            details_data = details_response.json()
            if details_data.get('status') == 'OK':
                place_details = details_data['result']
                return {
                    'name': place_details.get('name'),
                    'address': place_details.get('formatted_address'),
                    'rating': place_details.get('rating'),
                    'userRatingsTotal': place_details.get('user_ratings_total'),
                    'types': place_details.get('types'),
                    'placeId': best_match['place_id'],
                    'coordinates': {
                        'lat': place_details.get('geometry', {}).get('location', {}).get('lat', best_match.get('geometry', {}).get('location', {}).get('lat')),
                        'lng': place_details.get('geometry', {}).get('location', {}).get('lng', best_match.get('geometry', {}).get('location', {}).get('lng'))
                    }
                }
        # Fallback: just place name
        fallback_url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={requests.utils.quote(place_name)}&key={GOOGLE_MAPS_API_KEY}"
        fallback_response = requests.get(fallback_url)
        fallback_data = fallback_response.json()
        if fallback_data.get('status') == 'OK' and fallback_data.get('results'):
            best_match = None
            for result in fallback_data['results']:
                if location.lower() in result.get('formatted_address', '').lower():
                    best_match = result
                    break
            if not best_match:
                print(f"⚠️ Could not find '{place_name}' in '{location}'. Using first result: {fallback_data['results'][0].get('formatted_address')}")
                best_match = fallback_data['results'][0]
            details_url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={best_match['place_id']}&fields=formatted_address,name,rating,user_ratings_total,types,geometry&key={GOOGLE_MAPS_API_KEY}"
            details_response = requests.get(details_url)
            details_data = details_response.json()
            if details_data.get('status') == 'OK':
                place_details = details_data['result']
                return {
                    'name': place_details.get('name'),
                    'address': place_details.get('formatted_address'),
                    'rating': place_details.get('rating'),
                    'userRatingsTotal': place_details.get('user_ratings_total'),
                    'types': place_details.get('types'),
                    'placeId': best_match['place_id'],
                    'coordinates': {
                        'lat': place_details.get('geometry', {}).get('location', {}).get('lat', best_match.get('geometry', {}).get('location', {}).get('lat')),
                        'lng': place_details.get('geometry', {}).get('location', {}).get('lng', best_match.get('geometry', {}).get('location', {}).get('lng'))
                    }
                }
        return None
    except Exception as e:
        print('Error searching for place:', e)
        return None

def validate_quest_location(quest):
    # Handle nested 'final_quest' structure
    if isinstance(quest, dict) and 'final_quest' in quest:
        quest_obj = quest['final_quest']
        validated = validate_quest_location(quest_obj)
        quest['final_quest'] = validated
        return quest
    location_name = quest.get('locationName', '')
    location = quest.get('address', '')
    if not location_name:
        return {
            **quest,
            'validated': False,
            'location': None,
            'error': 'No locationName provided'
        }
    # First try: exact name
    place_details = search_place(location_name, location)
    # Second try: if apostrophe, just first part
    if not place_details and "'" in location_name:
        first_word = location_name.split("'")[0].strip()
        place_details = search_place(first_word, location)
    # Third try: if long name, just first two words
    if not place_details and len(location_name.split(' ')) > 2:
        first_two_words = ' '.join(location_name.split(' ')[:2])
        place_details = search_place(first_two_words, location)
    if place_details:
        return {
            **quest,
            'location': {
                'name': place_details['name'],
                'address': place_details['address'],
                'rating': place_details['rating'],
                'userRatingsTotal': place_details['userRatingsTotal'],
                'placeId': place_details['placeId'],
                'coordinates': place_details['coordinates']
            },
            'validated': True
        }
    else:
        return {
            **quest,
            'validated': False,
            'location': None,
            'error': f"Could not find address for '{location_name}'"
        } 