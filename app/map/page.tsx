"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Users, Clock, Calendar, RefreshCw, Globe } from "lucide-react"
import Navigation from "@/components/navigation"
import { createClient } from '@supabase/supabase-js'

interface QuestLocation {
  id: string
  title: string
  description: string
  coordinates: { lat: number; lng: number }
  completedAt: string
  category: string
  username: string
  userId: string
}

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Google Maps types
declare global {
  interface Window {
    google: any
    googleMapsLoaded?: boolean
  }
}

// Global script loading state
let scriptLoadingPromise: Promise<any> | null = null

export default function MapPage() {
  const [quests, setQuests] = useState<QuestLocation[]>([])
  const [selectedQuest, setSelectedQuest] = useState<QuestLocation | null>(null)
  const [filter, setFilter] = useState<"all" | "friends">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  // Load Google Maps script
  const loadGoogleMaps = () => {
    // If already loaded, return existing promise
    if (window.google && window.google.maps) {
      return Promise.resolve(window.google.maps)
    }

    // If script is already loading, return existing promise
    if (scriptLoadingPromise) {
      return scriptLoadingPromise
    }

    // If script was already loaded but window.google is not available yet
    if (window.googleMapsLoaded) {
      return new Promise((resolve) => {
        const checkGoogle = () => {
          if (window.google && window.google.maps) {
            resolve(window.google.maps)
          } else {
            setTimeout(checkGoogle, 100)
          }
        }
        checkGoogle()
      })
    }

    // Create new loading promise
    scriptLoadingPromise = new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        window.googleMapsLoaded = true
        const checkGoogle = () => {
          if (window.google && window.google.maps) {
            resolve(window.google.maps)
          } else {
            setTimeout(checkGoogle, 100)
          }
        }
        checkGoogle()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      script.async = true
      script.defer = true
      script.onload = () => {
        window.googleMapsLoaded = true
        resolve(window.google.maps)
      }
      script.onerror = reject
      document.head.appendChild(script)
    })

    return scriptLoadingPromise
  }

  // Initialize map
  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    // Clean up existing map if it exists
    if (mapInstanceRef.current) {
      // Clear all markers
      markersRef.current.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      markersRef.current = []
      
      // Clear map instance
      mapInstanceRef.current = null
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    })

    mapInstanceRef.current = map
    setMapLoaded(true)
  }

  // Add markers to map
  const addMarkers = () => {
    if (!mapInstanceRef.current || !window.google || quests.length === 0) return

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null)
      }
    })
    markersRef.current = []

    // Add new markers
    quests.forEach(quest => {
      if (quest.coordinates && quest.coordinates.lat && quest.coordinates.lng) {
        const marker = new window.google.maps.Marker({
          position: quest.coordinates,
          map: mapInstanceRef.current,
          title: quest.title,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
                <circle cx="16" cy="16" r="6" fill="#ffffff"/>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16)
          }
        })

        // Add click listener
        marker.addListener('click', () => {
          setSelectedQuest(quest)
        })

        markersRef.current.push(marker)
      }
    })

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition())
      })
      mapInstanceRef.current.fitBounds(bounds)
    }
  }

  // Fetch quests
  const fetchQuests = async () => {
    try {
      if (!isLoading) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      console.log('🗺️ Fetching quests for map...')
      
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
          status,
          users!quests_user_id_fkey(username)
        `)
        .eq('status', 'completed')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching quests:', error)
        return
      }

      console.log('🗺️ Raw quests data:', data)
      console.log('🗺️ Quests with coordinates:', data?.filter(q => q.lat && q.lng).length)

      // Transform the data
      const transformedData = (data || []).map((quest: any) => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        coordinates: { lat: quest.lat, lng: quest.lng },
        completedAt: quest.completed_at,
        category: quest.tags?.[0] || 'General',
        username: quest.users?.username || 'Unknown',
        userId: quest.user_id
      }))

      console.log('🗺️ Transformed quests:', transformedData)
      setQuests(transformedData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initialize everything
  useEffect(() => {
    const init = async () => {
      try {
        // Only initialize if not already done
        if (!mapLoaded && !mapInstanceRef.current) {
          await loadGoogleMaps()
          initializeMap()
        }
        await fetchQuests()
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }
    init()
  }, [])

  // Add markers when quests change
  useEffect(() => {
    if (mapLoaded && quests.length > 0) {
      addMarkers()
    }
  }, [mapLoaded, quests])

  // Refresh quests periodically and when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🗺️ Page became visible, refreshing quests...')
        fetchQuests()
      }
    }

    // Refresh when page becomes visible
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('🗺️ Auto-refreshing quests...')
      fetchQuests()
    }, 30000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [])

  // Cleanup effect for map and markers
  useEffect(() => {
    return () => {
      // Clean up markers
      markersRef.current.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      markersRef.current = []
      
      // Clear map instance
      mapInstanceRef.current = null
    }
  }, [])

  const handleFilterChange = (newFilter: "all" | "friends") => {
    setFilter(newFilter)
    setSelectedQuest(null)
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "food":
      case "restaurant":
        return "bg-orange-100 text-orange-800"
      case "nature":
      case "park":
        return "bg-green-100 text-green-800"
      case "culture":
      case "museum":
        return "bg-purple-100 text-purple-800"
      case "adventure":
      case "outdoor":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleQuestClick = (quest: QuestLocation) => {
    setSelectedQuest(quest)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quest Map</h1>
          <p className="text-gray-600">Explore completed quests from around the world</p>
          <p className="text-sm text-blue-600 mt-2">
            Status: {isLoading ? 'Loading...' : isRefreshing ? 'Refreshing...' : `${quests.length} quests found`}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => handleFilterChange("all")}
            >
              <Globe className="w-4 h-4 mr-2" />
              All Quests
            </Button>
            <Button
              variant={filter === "friends" ? "default" : "outline"}
              onClick={() => handleFilterChange("friends")}
            >
              <Users className="w-4 h-4 mr-2" />
              Friends Only
            </Button>
            <Button
              variant="ghost"
              onClick={fetchQuests}
              disabled={isRefreshing}
              className="ml-auto"
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Quest Map
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                <div ref={mapRef} className="w-full h-full rounded-lg" />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quest List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Recent Completions
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quests.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No completed quests found
                    </p>
                  ) : (
                    quests.slice(0, 5).map((quest) => (
                      <div
                        key={quest.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedQuest?.id === quest.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleQuestClick(quest)}
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{quest.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{quest.title}</h4>
                            <p className="text-xs text-gray-600 truncate">{quest.username}</p>
                            <div className="flex items-center justify-between mt-1">
                              <Badge className={`text-xs ${getCategoryColor(quest.category)}`}>
                                {quest.category}
                              </Badge>
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimeAgo(quest.completedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Selected Quest Details */}
            {selectedQuest && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Quest Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm">{selectedQuest.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{selectedQuest.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{selectedQuest.username}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          {selectedQuest.coordinates.lat.toFixed(4)}, {selectedQuest.coordinates.lng.toFixed(4)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className={getCategoryColor(selectedQuest.category)}>
                        {selectedQuest.category}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatTimeAgo(selectedQuest.completedAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
