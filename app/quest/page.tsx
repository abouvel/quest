"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Star, CheckCircle, Camera } from "lucide-react"
import Navigation from "@/components/navigation"

interface DailyQuest {
  id: string
  title: string
  description: string
  location: string
  category: string
  difficulty: "Easy" | "Medium" | "Hard"
  estimatedTime: string
  points: number
  completed: boolean
}

export default function QuestPage() {
  const [todayQuest, setTodayQuest] = useState<DailyQuest | null>(null)
  const [countdown, setCountdown] = useState("")
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    // Get user preferences for personalized quest generation
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    const userPreferences = currentUser.preferences || {}

    // Mock quest generation based on user preferences and location
    const generatePersonalizedQuest = () => {
      const interests = userPreferences.interests || []
      const activityTypes = userPreferences.activityTypes || []
      const location = userPreferences.location || "your area"

      // Simple quest generation based on preferences
      let questTitle = "Discover a Local Art Gallery"
      let questDescription =
        "Visit a local art gallery or museum you've never been to before. Take time to appreciate at least 3 different pieces and learn about one local artist."
      let category = "Culture"

      if (interests.includes("food")) {
        questTitle = "Hidden Culinary Gem"
        questDescription = `Find a highly-rated local restaurant in ${location} that you've never tried before. Order something you've never had and chat with the staff about their recommendations.`
        category = "Food & Dining"
      } else if (interests.includes("nature")) {
        questTitle = "Nature Trail Discovery"
        questDescription = `Explore a hiking trail or park within ${userPreferences.explorationRadius || 5} miles of ${location}. Take photos of 3 different types of plants or wildlife you encounter.`
        category = "Nature"
      } else if (interests.includes("photography")) {
        questTitle = "Street Photography Challenge"
        questDescription = `Capture the essence of ${location} through street photography. Take 10 photos that tell a story about your local community.`
        category = "Photography"
      }

      return {
        id: "1",
        title: questTitle,
        description: questDescription,
        location: `Near ${location}`,
        category: category,
        difficulty:
          userPreferences.difficultyPreference > 70
            ? "Hard"
            : userPreferences.difficultyPreference > 40
              ? "Medium"
              : "Easy",
        estimatedTime: "1-2 hours",
        points: userPreferences.difficultyPreference > 70 ? 200 : userPreferences.difficultyPreference > 40 ? 150 : 100,
        completed: false,
      }
    }

    setTodayQuest(generatePersonalizedQuest())

    // Countdown timer to next quest (midnight)
    const updateCountdown = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const diff = tomorrow.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      )
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCompleteQuest = () => {
    setIsCompleting(true)
    // Simulate quest completion
    setTimeout(() => {
      if (todayQuest) {
        setTodayQuest({ ...todayQuest, completed: true })
        // In a real app, this would post to the feed and update user stats
      }
      setIsCompleting(false)
    }, 2000)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!todayQuest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Generating your personalized quest...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Countdown Timer */}
          <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="text-center py-6">
              <h2 className="text-2xl font-bold mb-2">Next Quest In</h2>
              <div className="text-4xl font-mono font-bold">{countdown}</div>
            </CardContent>
          </Card>

          {/* Today's Quest */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">Today's Quest</CardTitle>
                  <CardDescription>Your personalized daily adventure</CardDescription>
                </div>
                {todayQuest.completed && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">{todayQuest.title}</h3>
                <p className="text-gray-700 mb-4">{todayQuest.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {todayQuest.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {todayQuest.estimatedTime}
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-6">
                  <Badge variant="outline">{todayQuest.category}</Badge>
                  <Badge className={getDifficultyColor(todayQuest.difficulty)}>{todayQuest.difficulty}</Badge>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    {todayQuest.points} points
                  </div>
                </div>
              </div>

              {!todayQuest.completed ? (
                <div className="space-y-4">
                  <Button onClick={handleCompleteQuest} disabled={isCompleting} className="w-full" size="lg">
                    {isCompleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Completing Quest...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Complete Quest & Share
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-gray-500 text-center">
                    Complete your quest and share a photo to earn points and maintain your streak!
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-800">Quest Completed!</h4>
                    <p className="text-green-700">You earned {todayQuest.points} points and maintained your streak!</p>
                  </div>

                  <Button variant="outline" className="w-full">
                    View on Map
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quest Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Quest Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Take a photo when you complete your quest to share with friends</li>
                <li>• Check in at the location to verify completion</li>
                <li>• Complete quests daily to maintain your streak</li>
                <li>• Explore different categories to discover new interests</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
