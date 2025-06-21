"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
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
  Clock,
} from "lucide-react"

interface UserPreferences {
  location: string
  interests: string[]
  activityTypes: string[]
  difficultyPreference: number
  timePreference: string[]
  budgetRange: number[]
  indoorOutdoorPreference: number // 0 = indoor, 100 = outdoor
  socialPreference: number // 0 = solo, 100 = group
  explorationRadius: number // in miles
  questFrequency: string
  bio: string
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

const activityTypes = [
  "Restaurants & Bars",
  "Parks & Recreation",
  "Museums & Galleries",
  "Shopping Centers",
  "Entertainment Venues",
  "Historical Sites",
  "Local Markets",
  "Scenic Viewpoints",
  "Community Events",
  "Hidden Gems",
]

const timeSlots = [
  "Early Morning (6-9 AM)",
  "Morning (9-12 PM)",
  "Afternoon (12-5 PM)",
  "Evening (5-8 PM)",
  "Night (8-11 PM)",
]

export default function PreferencesPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [preferences, setPreferences] = useState<UserPreferences>({
    location: "",
    interests: [],
    activityTypes: [],
    difficultyPreference: 50,
    timePreference: [],
    budgetRange: [20, 100],
    indoorOutdoorPreference: 50,
    socialPreference: 50,
    explorationRadius: 5,
    questFrequency: "daily",
    bio: "",
  })

  const totalSteps = 4

  useEffect(() => {
    // Check if user is authenticated
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      window.location.href = "/"
    }
  }, [])

  const handleInterestToggle = (interestId: string) => {
    setPreferences((prev) => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter((id) => id !== interestId)
        : [...prev.interests, interestId],
    }))
  }

  const handleActivityTypeToggle = (activityType: string) => {
    setPreferences((prev) => ({
      ...prev,
      activityTypes: prev.activityTypes.includes(activityType)
        ? prev.activityTypes.filter((type) => type !== activityType)
        : [...prev.activityTypes, activityType],
    }))
  }

  const handleTimeSlotToggle = (timeSlot: string) => {
    setPreferences((prev) => ({
      ...prev,
      timePreference: prev.timePreference.includes(timeSlot)
        ? prev.timePreference.filter((slot) => slot !== timeSlot)
        : [...prev.timePreference, timeSlot],
    }))
  }

  const handleSavePreferences = () => {
    // Save preferences to user profile
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    const updatedUser = {
      ...currentUser,
      preferences,
      hasCompletedPreferences: true,
    }
    localStorage.setItem("currentUser", JSON.stringify(updatedUser))

    // Redirect to dashboard
    window.location.href = "/dashboard"
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return preferences.location.trim() !== "" && preferences.interests.length >= 3
      case 2:
        return preferences.activityTypes.length >= 2
      case 3:
        return preferences.timePreference.length >= 1
      case 4:
        return true
      default:
        return false
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
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
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold">What types of places do you like to explore?</Label>
              <p className="text-sm text-gray-600 mb-4">Select at least 2 activity types</p>
              <div className="space-y-2">
                {activityTypes.map((activityType) => {
                  const isSelected = preferences.activityTypes.includes(activityType)

                  return (
                    <button
                      key={activityType}
                      onClick={() => handleActivityTypeToggle(activityType)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      {activityType}
                    </button>
                  )
                })}
              </div>
              <p className="text-sm text-gray-500 mt-2">Selected: {preferences.activityTypes.length} (minimum 2)</p>
            </div>

            <div>
              <Label className="text-base font-semibold mb-4 block">Activity Preferences</Label>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Indoor vs Outdoor</span>
                    <span className="text-sm text-gray-600">
                      {preferences.indoorOutdoorPreference < 30
                        ? "Prefer Indoor"
                        : preferences.indoorOutdoorPreference > 70
                          ? "Prefer Outdoor"
                          : "No Preference"}
                    </span>
                  </div>
                  <Slider
                    value={[preferences.indoorOutdoorPreference]}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({ ...prev, indoorOutdoorPreference: value[0] }))
                    }
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Indoor</span>
                    <span>Outdoor</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Social Preference</span>
                    <span className="text-sm text-gray-600">
                      {preferences.socialPreference < 30
                        ? "Solo Activities"
                        : preferences.socialPreference > 70
                          ? "Group Activities"
                          : "Either"}
                    </span>
                  </div>
                  <Slider
                    value={[preferences.socialPreference]}
                    onValueChange={(value) => setPreferences((prev) => ({ ...prev, socialPreference: value[0] }))}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Solo</span>
                    <span>Group</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold">When do you prefer to do activities?</Label>
              <p className="text-sm text-gray-600 mb-4">Select your preferred time slots</p>
              <div className="space-y-2">
                {timeSlots.map((timeSlot) => {
                  const isSelected = preferences.timePreference.includes(timeSlot)

                  return (
                    <button
                      key={timeSlot}
                      onClick={() => handleTimeSlotToggle(timeSlot)}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-center ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <Clock className="w-4 h-4 mr-3" />
                      {timeSlot}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold mb-4 block">Quest Settings</Label>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Difficulty Preference</span>
                    <span className="text-sm text-gray-600">
                      {preferences.difficultyPreference < 30
                        ? "Easy"
                        : preferences.difficultyPreference > 70
                          ? "Challenging"
                          : "Moderate"}
                    </span>
                  </div>
                  <Slider
                    value={[preferences.difficultyPreference]}
                    onValueChange={(value) => setPreferences((prev) => ({ ...prev, difficultyPreference: value[0] }))}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Easy</span>
                    <span>Challenging</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Exploration Radius</span>
                    <span className="text-sm text-gray-600">{preferences.explorationRadius} miles</span>
                  </div>
                  <Slider
                    value={[preferences.explorationRadius]}
                    onValueChange={(value) => setPreferences((prev) => ({ ...prev, explorationRadius: value[0] }))}
                    min={1}
                    max={25}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 mile</span>
                    <span>25 miles</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Budget Range (per activity)</span>
                    <span className="text-sm text-gray-600">
                      ${preferences.budgetRange[0]} - ${preferences.budgetRange[1]}
                    </span>
                  </div>
                  <Slider
                    value={preferences.budgetRange}
                    onValueChange={(value) => setPreferences((prev) => ({ ...prev, budgetRange: value }))}
                    min={0}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Free</span>
                    <span>$200+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="bio" className="text-base font-semibold">
                Tell us about yourself (optional)
              </Label>
              <p className="text-sm text-gray-600 mb-3">This helps us create more personalized quests</p>
              <Textarea
                id="bio"
                placeholder="I love trying new restaurants, hiking on weekends, and discovering local art..."
                value={preferences.bio}
                onChange={(e) => setPreferences((prev) => ({ ...prev, bio: e.target.value }))}
                rows={4}
              />
            </div>

            <div>
              <Label className="text-base font-semibold mb-4 block">Quest Frequency</Label>
              <div className="space-y-2">
                {[
                  { value: "daily", label: "Daily", description: "A new quest every day" },
                  { value: "weekdays", label: "Weekdays Only", description: "Monday through Friday" },
                  { value: "weekends", label: "Weekends Only", description: "Saturday and Sunday" },
                  { value: "custom", label: "Custom", description: "Choose specific days" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPreferences((prev) => ({ ...prev, questFrequency: option.value }))}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      preferences.questFrequency === option.value
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Your Preferences Summary</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Location:</strong> {preferences.location}
                </div>
                <div>
                  <strong>Interests:</strong> {preferences.interests.length} selected
                </div>
                <div>
                  <strong>Activity Types:</strong> {preferences.activityTypes.length} selected
                </div>
                <div>
                  <strong>Time Slots:</strong> {preferences.timePreference.length} selected
                </div>
                <div>
                  <strong>Exploration Radius:</strong> {preferences.explorationRadius} miles
                </div>
                <div>
                  <strong>Budget Range:</strong> ${preferences.budgetRange[0]} - ${preferences.budgetRange[1]}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
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

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && "Location & Interests"}
                {currentStep === 2 && "Activity Preferences"}
                {currentStep === 3 && "Schedule & Settings"}
                {currentStep === 4 && "Final Details"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Tell us where you are and what you're interested in"}
                {currentStep === 2 && "What types of places and activities do you enjoy?"}
                {currentStep === 3 && "When and how do you like to explore?"}
                {currentStep === 4 && "Almost done! Just a few more details"}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderStep()}</CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={() => setCurrentStep((prev) => prev + 1)} disabled={!canProceed()}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSavePreferences} className="bg-green-600 hover:bg-green-700">
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
