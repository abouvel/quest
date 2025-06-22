"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Clock, Star, CheckCircle, Camera, Bug, X, Plus } from "lucide-react"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/useAuth"
import { questUtils, profileUtils } from "@/lib/supabaseUtils"

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
  debug?: {
    userLocation: string
    userInterests: string[]
    userPreference: string
    completedTitles: string[]
    prompt: string
  }
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
  const [isLoading, setIsLoading] = useState(true)
  const [showDebug, setShowDebug] = useState(false)
  const [showCompletionForm, setShowCompletionForm] = useState(false)
  const [completionData, setCompletionData] = useState<QuestCompletion>({
    lat: null,
    lng: null,
    liked: false,
    feedback_tags: [],
    feedback_text: ""
  })
  const [newFeedbackTag, setNewFeedbackTag] = useState("")

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      fetchQuest()
    }
    setupCountdown()
  }, [authLoading, isAuthenticated, user])

  const fetchQuest = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      console.log('Fetching quest for user:', user.id)
      
      const response = await fetch('/api/generate-quest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error('Failed to fetch quest')
      }

      const data = await response.json()
      console.log('Response data:', data)
      
      // Transform the API response to match your interface
      const quest: DailyQuest = {
        id: "1",
        title: data.quest.title,
        description: data.quest.description,
        location: "Your area",
        category: "Adventure",
        difficulty: "Medium",
        estimatedTime: "1-2 hours",
        points: 150,
        completed: false,
        debug: data.quest.debug
      }

      console.log('Transformed quest:', quest)
      setTodayQuest(quest)
    } catch (error) {
      console.error('Error fetching quest:', error)
      // Fallback to mock quest if API fails
      setTodayQuest(generateMockQuest())
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockQuest = (): DailyQuest => {
    return {
      id: "1",
      title: "Discover a Local Art Gallery",
      description: "Visit a local art gallery or museum you've never been to before. Take time to appreciate at least 3 different pieces and learn about one local artist.",
      location: "Your area",
      category: "Culture",
      difficulty: "Easy",
      estimatedTime: "1-2 hours",
      points: 100,
      completed: false,
    }
  }

  const setupCountdown = () => {
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
  }

  const handleCompleteQuest = async () => {
    if (!user || !todayQuest) return
    
    setIsCompleting(true)
    try {
      // Save quest completion to Supabase
      const questData = {
        user_id: user.id,
        title: todayQuest.title,
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

      // Update user streak
      try {
        const { data: userData } = await profileUtils.getProfile(user.id)
        const currentStreak = userData?.streak_count || 0
        const today = new Date().toISOString().split('T')[0]
        
        await profileUtils.updateProfile(user.id, {
          streak_count: currentStreak + 1,
          daily_completed_date: today
        })
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
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">Please sign in to view your quests</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
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

  if (!todayQuest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">Failed to load quest</p>
            <Button onClick={fetchQuest} className="mt-4">Retry</Button>
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
                <div className="flex items-center space-x-2">
                  {todayQuest.completed && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
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
                  <Button 
                    onClick={() => setShowCompletionForm(true)} 
                    className="w-full" 
                    size="lg"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Complete Quest & Share
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

          {/* Quest Completion Form */}
          {showCompletionForm && !todayQuest.completed && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Complete Your Quest</CardTitle>
                <CardDescription>Share your experience and earn points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Location */}
                <div className="space-y-2">
                  <Label>Location (optional)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Latitude"
                      value={completionData.lat || ''}
                      onChange={(e) => setCompletionData(prev => ({ ...prev, lat: e.target.value ? parseFloat(e.target.value) : null }))}
                    />
                    <Input
                      type="number"
                      placeholder="Longitude"
                      value={completionData.lng || ''}
                      onChange={(e) => setCompletionData(prev => ({ ...prev, lng: e.target.value ? parseFloat(e.target.value) : null }))}
                    />
                  </div>
                </div>

                {/* Liked */}
                <div className="space-y-2">
                  <Label>Did you enjoy this quest?</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={completionData.liked ? "default" : "outline"}
                      onClick={() => setCompletionData(prev => ({ ...prev, liked: true }))}
                    >
                      👍 Yes
                    </Button>
                    <Button
                      variant={!completionData.liked ? "default" : "outline"}
                      onClick={() => setCompletionData(prev => ({ ...prev, liked: false }))}
                    >
                      👎 No
                    </Button>
                  </div>
                </div>

                {/* Feedback Tags */}
                <div className="space-y-2">
                  <Label>How would you describe this quest?</Label>
                  <div className="flex flex-wrap gap-2">
                    {feedbackTagOptions.map((tag) => (
                      <Button
                        key={tag}
                        variant={completionData.feedback_tags.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFeedbackTagToggle(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Custom tag */}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add custom tag"
                      value={newFeedbackTag}
                      onChange={(e) => setNewFeedbackTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomFeedbackTag()}
                    />
                    <Button onClick={addCustomFeedbackTag} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Selected tags */}
                  {completionData.feedback_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {completionData.feedback_tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                          <span>{tag}</span>
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => removeFeedbackTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Feedback */}
                <div className="space-y-2">
                  <Label>Additional comments (optional)</Label>
                  <Textarea
                    placeholder="Share your experience..."
                    value={completionData.feedback_text}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, feedback_text: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
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
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Quest
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCompletionForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
