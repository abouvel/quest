"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Coffee,
  Mountain,
  Camera,
  Utensils,
  Music,
  Book,
  Palette,
  Gamepad2,
  Dumbbell,
  ShoppingBag,
  TreePine,
  Building,
  MapPin,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { userUtils } from "@/lib/supabaseUtils"

interface UserPreferences {
  location: string
  interests: string[]
}

const interestOptions = [
  { id: "food", label: "Food & Dining", icon: Utensils, color: "bg-orange-100 text-orange-800" },
  { id: "nature", label: "Nature & Outdoors", icon: TreePine, color: "bg-green-100 text-green-800" },
  { id: "culture", label: "Arts & Culture", icon: Palette, color: "bg-purple-100 text-purple-800" },
  { id: "fitness", label: "Fitness & Sports", icon: Dumbbell, color: "bg-blue-100 text-blue-800" },
  { id: "photography", label: "Photography", icon: Camera, color: "bg-pink-100 text-pink-800" },
  { id: "music", label: "Music & Entertainment", icon: Music, color: "bg-indigo-100 text-indigo-800" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "bg-yellow-100 text-yellow-800" },
  { id: "coffee", label: "Coffee & Cafes", icon: Coffee, color: "bg-amber-100 text-amber-800" },
  { id: "books", label: "Books & Learning", icon: Book, color: "bg-teal-100 text-teal-800" },
  { id: "gaming", label: "Gaming & Tech", icon: Gamepad2, color: "bg-cyan-100 text-cyan-800" },
  { id: "adventure", label: "Adventure Sports", icon: Mountain, color: "bg-red-100 text-red-800" },
  { id: "architecture", label: "Architecture", icon: Building, color: "bg-gray-100 text-gray-800" },
]

export default function PreferencesPage() {
  const { user, loading, isAuthenticated } = useAuth()
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences>({
    location: "",
    interests: [],
  })

  useEffect(() => {
    // Check if user is authenticated
    if (!loading && !isAuthenticated) {
      window.location.href = "/"
    }
  }, [loading, isAuthenticated])

  const handleInterestToggle = (interestId: string) => {
    setPreferences((prev) => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter((id) => id !== interestId)
        : [...prev.interests, interestId],
    }))
  }

  const handleSavePreferences = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      // Convert preferences to preference_tags format with default values for removed fields
      const preferenceTags = {
        location: preferences.location,
        interests: preferences.interests,
        bio: "",
        // Set default values for removed fields
        activityTypes: ["Restaurants & Bars", "Local Markets", "Scenic Viewpoints"],
        difficultyPreference: 50,
        timePreference: ["Morning (9-12 PM)", "Afternoon (12-5 PM)", "Evening (5-8 PM)"],
        budgetRange: [20, 100],
        indoorOutdoorPreference: 50,
        socialPreference: 50,
        explorationRadius: 5,
        questFrequency: "daily",
      }

      // Save to Supabase
      const { error } = await userUtils.updatePreferences(user.id, preferenceTags)
      
      if (error) {
        console.error('Error saving preferences:', error)
        alert('Error saving preferences. Please try again.')
        return
      }

      // Redirect to dashboard
      window.location.href = "/dashboard"
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Error saving preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const canProceed = () => {
    return preferences.location.trim() !== "" && preferences.interests.length >= 3
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Quest Preferences</h1>
            <p className="text-gray-600">Help us create the perfect adventures for you</p>
          </div>

          {/* Main Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Location & Interests</CardTitle>
              <CardDescription>Tell us where you are and what you're interested in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="location" className="text-base font-semibold">
                  Where are you located?
                </Label>
                <p className="text-sm text-gray-600 mb-3">This helps us find quests near you</p>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="location"
                    placeholder="Enter your city or zip code"
                    value={preferences.location}
                    onChange={(e) => setPreferences((prev) => ({ ...prev, location: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">What are your interests?</Label>
                <p className="text-sm text-gray-600 mb-4">Select at least 3 interests to personalize your quests</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {interestOptions.map((interest) => {
                    const Icon = interest.icon
                    const isSelected = preferences.interests.includes(interest.id)

                    return (
                      <button
                        key={interest.id}
                        onClick={() => handleInterestToggle(interest.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${isSelected ? "text-blue-600" : "text-gray-600"}`} />
                        <p className={`font-medium text-sm ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                          {interest.label}
                        </p>
                      </button>
                    )
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-2">Selected: {preferences.interests.length} (minimum 3)</p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleSavePreferences} 
              className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg"
              disabled={saving || !canProceed()}
            >
              {saving ? "Saving..." : "Complete Setup"}
            </Button>
          </div>

          {!canProceed() && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Please enter your location and select at least 3 interests to continue
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
