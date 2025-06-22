"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Clock, Star, CheckCircle, Camera, X, Plus } from "lucide-react"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/useAuth"
import { userUtils, questUtils } from "@/lib/supabaseUtils"

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

interface QuestCompletion {
  lat: number | null
  lng: number | null
  liked: boolean
  feedback_tags: string[]
  feedback_text: string
}

const feedbackTagOptions = [
  "fun", "challenging", "easy", "boring", "exciting", "long", "short", 
  "expensive", "cheap", "crowded", "quiet", "beautiful", "interesting", 
  "educational", "relaxing", "adventurous", "social", "solo-friendly"
]

export default function QuestPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [todayQuest, setTodayQuest] = useState<DailyQuest | null>(null)
  const [countdown, setCountdown] = useState("")
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCompletionForm, setShowCompletionForm] = useState(false)
  const [dailyCompleted, setDailyCompleted] = useState(false)
  const [completionData, setCompletionData] = useState<QuestCompletion>({
    lat: null,
    lng: null,
    liked: true,
    feedback_tags: [],
    feedback_text: ""
  })
  const [newFeedbackTag, setNewFeedbackTag] = useState("")

  useEffect(() => {
    // Redirect to landing page if not authenticated
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/"
      return
    }

    if (isAuthenticated && user) {
      generateQuest()
      checkDailyCompletion()
    }
  }, [isAuthenticated, authLoading, user])

  const checkDailyCompletion = async () => {
    if (!user) return
    
    try {
      const { data: userData } = await userUtils.getUser(user.id)
      const today = new Date().toISOString().split('T')[0]
      const lastCompletedDate = userData?.daily_completed_date
      
      // Check if user completed a quest today
      setDailyCompleted(lastCompletedDate === today)
    } catch (error) {
      console.error('Error checking daily completion:', error)
      setDailyCompleted(false)
    }
  }

  const generateQuest = async () => {
    try {
      // Get user preferences from Supabase
      const { data: userData } = await userUtils.getUser(user!.id)
      const userPreferences = userData?.preference_tags || {}

      // Mock quest generation based on user preferences and location
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

      const quest = {
        id: "1",
        title: questTitle,
        description: questDescription,
        location: `Near ${location}`,
        category: category,
        difficulty: (
          userPreferences.difficultyPreference > 70
            ? "Hard"
            : userPreferences.difficultyPreference > 40
              ? "Medium"
              : "Easy"
        ) as "Easy" | "Medium" | "Hard",
        estimatedTime: "1-2 hours",
        points: userPreferences.difficultyPreference > 70 ? 200 : userPreferences.difficultyPreference > 40 ? 150 : 100,
        completed: false,
      }

      setTodayQuest(quest)
    } catch (error) {
      console.error('Error generating quest:', error)
      // Fallback quest
      setTodayQuest({
        id: "1",
        title: "Discover a Local Art Gallery",
        description: "Visit a local art gallery or museum you've never been to before. Take time to appreciate at least 3 different pieces and learn about one local artist.",
        location: "Your area",
        category: "Culture",
        difficulty: "Easy",
        estimatedTime: "1-2 hours",
        points: 100,
        completed: false,
      })
    }
  }

  useEffect(() => {
    if (!todayQuest) return

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
  }, [todayQuest])

  const handleCompleteQuest = async () => {
    if (!user || !todayQuest) return

    setIsCompleting(true)
    try {
      // Save quest completion to Supabase
      const questData = {
        user_id: user.id,
        description: todayQuest.description,
        tags: [todayQuest.category.toLowerCase()],
        lat: completionData.lat,
        lng: completionData.lng,
        assigned_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        status: 'completed',
        liked: completionData.liked,
        feedback_tags: completionData.feedback_tags,
        feedback_text: completionData.feedback_text,
        elo_score: 1400
      }

      const { error } = await questUtils.createQuest(questData)
      
      if (error) {
        console.error('Error saving quest completion:', error)
        alert('Error saving quest completion. Please try again.')
        return
      }

      // Update user streak and daily completion date
      try {
        const { data: userData } = await userUtils.getUser(user.id)
        const currentStreak = userData?.streak_count || 0
        const today = new Date().toISOString().split('T')[0]
        
        // Update both streak and daily completion date
        await userUtils.updateUser(user.id, {
          streak_count: currentStreak + 1,
          daily_completed_date: today
        })
        
        // Update local state
        setDailyCompleted(true)
      } catch (error) {
        console.error('Error updating user data:', error)
      }

      // Update local state
      setTodayQuest({ ...todayQuest, completed: true })
      setShowCompletionForm(false)

    } catch (error) {
      console.error('Error completing quest:', error)
      alert('Error completing quest. Please try again.')
    } finally {
      setIsCompleting(false)
    }
  }

  const handleFeedbackTagToggle = (tag: string) => {
    setCompletionData(prev => ({
      ...prev,
      feedback_tags: prev.feedback_tags.includes(tag)
        ? prev.feedback_tags.filter(t => t !== tag)
        : [...prev.feedback_tags, tag]
    }))
  }

  const addCustomFeedbackTag = () => {
    if (newFeedbackTag.trim() && !completionData.feedback_tags.includes(newFeedbackTag.trim())) {
      setCompletionData(prev => ({
        ...prev,
        feedback_tags: [...prev.feedback_tags, newFeedbackTag.trim()]
      }))
      setNewFeedbackTag("")
    }
  }

  const removeFeedbackTag = (tag: string) => {
    setCompletionData(prev => ({
      ...prev,
      feedback_tags: prev.feedback_tags.filter(t => t !== tag)
    }))
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

  if (authLoading) {
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
                {dailyCompleted && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Daily Quest Completed
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

              {!dailyCompleted ? (
                <div className="space-y-4">
                  {!showCompletionForm ? (
                    <Button 
                      onClick={() => setShowCompletionForm(true)} 
                      className="w-full" 
                      size="lg"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Complete Quest & Share
                    </Button>
                  ) : (
                    <div className="space-y-6">
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold mb-4">Quest Completion Details</h4>
                        
                        {/* Location Coordinates */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label htmlFor="lat">Latitude</Label>
                            <Input
                              id="lat"
                              type="number"
                              step="any"
                              placeholder="e.g., 40.7128"
                              value={completionData.lat || ""}
                              onChange={(e) => setCompletionData(prev => ({ 
                                ...prev, 
                                lat: e.target.value ? parseFloat(e.target.value) : null 
                              }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="lng">Longitude</Label>
                            <Input
                              id="lng"
                              type="number"
                              step="any"
                              placeholder="e.g., -74.0060"
                              value={completionData.lng || ""}
                              onChange={(e) => setCompletionData(prev => ({ 
                                ...prev, 
                                lng: e.target.value ? parseFloat(e.target.value) : null 
                              }))}
                            />
                          </div>
                        </div>

                        {/* Like/Dislike */}
                        <div className="mb-4">
                          <Label className="block mb-2">Did you enjoy this quest?</Label>
                          <div className="flex space-x-4">
                            <Button
                              variant={completionData.liked ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCompletionData(prev => ({ ...prev, liked: true }))}
                            >
                              👍 Yes
                            </Button>
                            <Button
                              variant={!completionData.liked ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCompletionData(prev => ({ ...prev, liked: false }))}
                            >
                              👎 No
                            </Button>
                          </div>
                        </div>

                        {/* Feedback Tags */}
                        <div className="mb-4">
                          <Label className="block mb-2">What was this quest like? (Select all that apply)</Label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {completionData.feedback_tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                {tag}
                                <X 
                                  className="w-3 h-3 cursor-pointer" 
                                  onClick={() => removeFeedbackTag(tag)}
                                />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {feedbackTagOptions.map(tag => (
                              <Button
                                key={tag}
                                variant={completionData.feedback_tags.includes(tag) ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleFeedbackTagToggle(tag)}
                                disabled={completionData.feedback_tags.includes(tag)}
                              >
                                {tag}
                              </Button>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="Add custom tag..."
                              value={newFeedbackTag}
                              onChange={(e) => setNewFeedbackTag(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && addCustomFeedbackTag()}
                            />
                            <Button size="sm" onClick={addCustomFeedbackTag}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Feedback Text */}
                        <div className="mb-4">
                          <Label htmlFor="feedback">Additional comments (optional)</Label>
                          <Textarea
                            id="feedback"
                            placeholder="Tell us more about your experience..."
                            value={completionData.feedback_text}
                            onChange={(e) => setCompletionData(prev => ({ 
                              ...prev, 
                              feedback_text: e.target.value 
                            }))}
                            rows={3}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleCompleteQuest} 
                            disabled={isCompleting}
                            className="flex-1"
                          >
                            {isCompleting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Completing...
                              </>
                            ) : (
                              "Complete Quest"
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowCompletionForm(false)}
                            disabled={isCompleting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 text-center">
                    Complete your quest and share your experience to earn points and maintain your streak!
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-800">Daily Quest Completed!</h4>
                    <p className="text-green-700">You earned {todayQuest.points} points and maintained your streak!</p>
                    <p className="text-sm text-green-600 mt-2">Come back tomorrow for a new adventure!</p>
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
                <li>• Provide detailed feedback to help improve future quests</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
