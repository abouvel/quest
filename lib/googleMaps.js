// Google Maps integration for quest map
let map = null;
let markers = [];

// Load Google Maps script
export function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Initialize map
export function initializeMap(containerElement, center = { lat: 37.7749, lng: -122.4194 }) {
  if (!window.google || !window.google.maps) {
    console.error('Google Maps not loaded');
    return null;
  }

  map = new window.google.maps.Map(containerElement, {
    center,
    zoom: 12,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ],
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true
  });

  return map;
}

// Create custom marker icon
function createMarkerIcon(color = '#ef4444') {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="#ffffff"/>
      </svg>
    `)}`,
    scaledSize: new window.google.maps.Size(32, 32),
    anchor: new window.google.maps.Point(16, 16)
  };
}

// Add markers to map
export function addMarkers(quests, onMarkerClick) {
  if (!map || !window.google) return;

  // Clear existing markers
  clearMarkers();

  quests.forEach(quest => {
    if (quest.coordinates && quest.coordinates.lat && quest.coordinates.lng) {
      const marker = new window.google.maps.Marker({
        position: quest.coordinates,
        map,
        title: quest.title,
        icon: createMarkerIcon(getCategoryColor(quest.category))
      });

      // Add click listener
      marker.addListener('click', () => {
        onMarkerClick(quest);
      });

      markers.push(marker);
    }
  });

  // Fit map to show all markers
  if (markers.length > 0) {
    const bounds = new window.google.maps.LatLngBounds();
    markers.forEach(marker => {
      bounds.extend(marker.getPosition());
    });
    map.fitBounds(bounds);
  }
}

// Clear all markers
export function clearMarkers() {
  markers.forEach(marker => {
    marker.setMap(null);
  });
  markers = [];
}

// Get category color for markers
function getCategoryColor(category) {
  switch (category.toLowerCase()) {
    case 'food':
    case 'restaurant':
      return '#f97316'; // orange
    case 'nature':
    case 'park':
      return '#22c55e'; // green
    case 'culture':
    case 'museum':
      return '#a855f7'; // purple
    case 'adventure':
    case 'outdoor':
      return '#3b82f6'; // blue
    default:
      return '#ef4444'; // red
  }
}

// Format time ago
export function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
} 