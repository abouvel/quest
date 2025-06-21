"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Users, Clock } from "lucide-react"
import Navigation from "@/components/navigation"

interface MapLocation {
  id: string
  username: string
  questName: string
  location: string
  coordinates: { lat: number; lng: number }
  completedAt: string
  category: string
  avatar: string
}

export default function MapPage() {
  const [locations, setLocations] = useState<MapLocation[]>([])
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null)
  const [filter, setFilter] = useState<"all" | "today" | "friends">("all")

  useEffect(() => {
    // Mock location data
    const mockLocations: MapLocation[] = [
      {
        id: "1",
        username: "alex_explorer",
        questName: "Coffee Shop Discovery",
        location: "Downtown Coffee Co.",
        coordinates: { lat: 40.7589, lng: -73.9851 },
        completedAt: "2 hours ago",
        category: "Food & Drink",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "2",
        username: "sarah_adventurer",
        questName: "Hidden Park Trail",
        location: "Central Park Trail #3",
        coordinates: { lat: 40.7829, lng: -73.9654 },
        completedAt: "4 hours ago",
        category: "Nature",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "3",
        username: "mike_foodie",
        questName: "Local Food Truck",
        location: "Taco Libre Food Truck",
        coordinates: { lat: 40.7505, lng: -73.9934 },
        completedAt: "6 hours ago",
        category: "Food & Drink",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "4",
        username: "emma_culture",
        questName: "Street Art Hunt",
        location: "SoHo Art District",
        coordinates: { lat: 40.723, lng: -74.003 },
        completedAt: "1 day ago",
        category: "Culture",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ]
    setLocations(mockLocations)
  }, [])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Food & Drink":
        return "bg-orange-100 text-orange-800"
      case "Nature":
        return "bg-green-100 text-green-800"
      case "Culture":
        return "bg-purple-100 text-purple-800"
      case "Adventure":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredLocations = locations.filter((location) => {
    if (filter === "today") {
      return location.completedAt.includes("hour")
    }
    if (filter === "friends") {
      return ["alex_explorer", "sarah_adventurer"].includes(location.username)
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Interactive Map
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant={filter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filter === "today" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("today")}
                    >
                      Today
                    </Button>
                    <Button
                      variant={filter === "friends" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("friends")}
                    >
                      Friends
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-full">
                {/* Mock Map Interface */}
                <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gray-200 opacity-20"></div>

                  {/* Mock map pins */}
                  {filteredLocations.map((location, index) => (
                    <div
                      key={location.id}
                      className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                        selectedLocation?.id === location.id ? "z-20" : "z-10"
                      }`}
                      style={{
                        left: `${20 + index * 15}%`,
                        top: `${30 + index * 10}%`,
                      }}
                      onClick={() => setSelectedLocation(location)}
                    >
                      <div
                        className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                          selectedLocation?.id === location.id ? "bg-blue-600 scale-125" : "bg-red-500 hover:scale-110"
                        } transition-transform`}
                      >
                        <MapPin className="w-4 h-4 text-white" />
                      </div>

                      {selectedLocation?.id === location.id && (
                        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 min-w-48 z-30">
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={location.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{location.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-sm">{location.username}</span>
                          </div>
                          <h4 className="font-medium text-sm mb-1">{location.questName}</h4>
                          <p className="text-xs text-gray-600 mb-2">{location.location}</p>
                          <div className="flex items-center justify-between">
                            <Badge className={`text-xs ${getCategoryColor(location.category)}`}>
                              {location.category}
                            </Badge>
                            <span className="text-xs text-gray-500">{location.completedAt}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Mock map legend */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
                    <h4 className="font-semibold text-sm mb-2">Legend</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Quest Locations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span>Selected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Recent Adventures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedLocation?.id === location.id ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedLocation(location)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={location.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{location.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{location.username}</h4>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {location.completedAt}
                        </p>
                      </div>
                    </div>

                    <h5 className="font-medium text-sm mb-1">{location.questName}</h5>
                    <p className="text-xs text-gray-600 mb-2 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {location.location}
                    </p>

                    <Badge className={`text-xs ${getCategoryColor(location.category)}`}>{location.category}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Map Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Total Locations</span>
                    <span className="font-semibold">{locations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Today's Adventures</span>
                    <span className="font-semibold">
                      {locations.filter((l) => l.completedAt.includes("hour")).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Friends Active</span>
                    <span className="font-semibold">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
