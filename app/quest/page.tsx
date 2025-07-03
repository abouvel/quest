"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Clock, Star, CheckCircle, Camera, Bug, X, Plus, Calendar } from "lucide-react"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/useAuth"
import { questUtils, profileUtils } from "@/lib/supabaseUtils"
import { supabase } from "@/lib/supabaseClient"
import { globalQuestStore } from "@/lib/globalQuestStore"

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
  address?: string
}

interface QuestCompletion {
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
  const [userLocation, setUserLocation] = useState("your city")
  const [completionData, setCompletionData] = useState<QuestCompletion>({
    liked: false,
    feedback_tags: [],
    feedback_text: ""
  })
  const [newFeedbackTag, setNewFeedbackTag] = useState("")
  const [photoTaken, setPhotoTaken] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [lastGenerationTime, setLastGenerationTime] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [globalGenerationLock, setGlobalGenerationLock] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hasGeneratedThisSession = useRef(false)

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !hasGeneratedThisSession.current) {
      fetchUserLocation()
      fetchQuest()
    }
    setupCountdown()
  }, [authLoading, isAuthenticated, user])

  // Cleanup camera when component unmounts or form closes
  useEffect(() => {
    return () => {
      stopCamera()
      hasGeneratedThisSession.current = false
    }
  }, [])

  // Stop camera when form is closed
  useEffect(() => {
    if (!showCompletionForm) {
      stopCamera()
      setPhotoTaken(false)
      setPhotoData(null)
    }
  }, [showCompletionForm])

  // Ensure video plays when stream is available
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error)
      })
    }
  }, [cameraStream])

  const fetchUserLocation = async () => {
    if (!user) return
    
    try {
      console.log('=== LOCATION FETCH DEBUG ===')
      console.log('Fetching location for user ID:', user.id)
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('location_description, preference_tags')
        .eq('id', user.id)
        .single()
      
      console.log('Raw user data from DB:', userData)
      console.log('Database error:', error)
      
      if (!error && userData) {
        // Use location_description if available, otherwise fall back to preference_tags.location
        const location = userData.location_description || 
                        userData.preference_tags?.location || 
                        "your city"
        console.log('Final location set to:', location)
        setUserLocation(location)
      } else {
        console.log('Using default location: your city')
        setUserLocation("your city")
      }
      console.log('=== END LOCATION FETCH DEBUG ===')
    } catch (error) {
      console.error('Error fetching user location:', error)
    }
  }

  const fetchQuest = async () => {
    if (!user) return
    
    // Set flag immediately to prevent duplicate calls
    if (hasGeneratedThisSession.current) {
      console.log('Quest already generated this session, skipping...')
      return
    }
    hasGeneratedThisSession.current = true
    
    // Check cooldown - prevent multiple generations within 10 seconds
    const now = Date.now()
    const cooldownPeriod = 10000 // 10 seconds
    if (lastGenerationTime && (now - lastGenerationTime) < cooldownPeriod) {
      console.log('Quest generation on cooldown, skipping...')
      return
    }
    
    // Prevent concurrent generations with global lock
    if (isGenerating || globalGenerationLock) {
      console.log('Quest generation already in progress (global lock), skipping...')
      return
    }
    
    try {
      setIsLoading(true)
      console.log('Fetching quest for user:', user.id)
      
      // Check if user has a current quest
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('current_quest_id')
        .eq('id', user.id)
        .single()
      
      if (userError) {
        console.error('Error fetching user data:', userError)
      }
      
      // If current_quest_id exists, get the quest
      if (userData?.current_quest_id) {
        console.log('Found current quest ID:', userData.current_quest_id)
        
        const { data: currentQuest, error: questError } = await supabase
          .from('quests')
          .select('*')
          .eq('id', userData.current_quest_id)
          .single()
        
        if (questError) {
          console.error('Error fetching current quest:', questError)
        }
        
        if (currentQuest) {
          console.log('Found existing quest:', currentQuest)
          const quest: DailyQuest = {
            id: currentQuest.id,
            title: currentQuest.title,
            description: currentQuest.description,
            location: userLocation,
            category: currentQuest.tags?.[0] || "Adventure",
            difficulty: "Medium",
            estimatedTime: "1-2 hours",
            points: 150,
            completed: currentQuest.status === 'completed',
            address: currentQuest.address,
          }
          
          console.log('Using existing quest:', quest)
          setTodayQuest(quest)
          return
        }
      }
      
      // If current_quest_id is null or quest not found, generate new one with API
      console.log('No current quest found, generating new quest via API')
      setIsGenerating(true)
      setGlobalGenerationLock(true)
      setLastGenerationTime(now)
      
      const response = await fetch('/api/generate-quest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch quest')
      }

      const data = await response.json()
      console.log('Generated quest data:', data)
      
      // Wait for database to be updated and retry fetching the quest
      let newQuest = null
      let retryCount = 0
      const maxRetries = 5
      
      while (!newQuest && retryCount < maxRetries) {
        console.log(`Attempting to fetch newly generated quest (attempt ${retryCount + 1}/${maxRetries})`)
        
        // Wait a bit for database to update
        await new Promise(resolve => setTimeout(resolve, 1000 + (retryCount * 500)))
        
        const { data: questData, error: fetchNewQuestError } = await supabase
          .from('quests')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('assigned_at', { ascending: false })
          .limit(1)
          .single()
        
        if (!fetchNewQuestError && questData) {
          newQuest = questData
          console.log('Successfully found newly generated quest:', newQuest)
          break
        }
        
        retryCount++
        console.log(`Quest not found yet, retrying... (${retryCount}/${maxRetries})`)
      }
      
      if (!newQuest) {
        console.error('Failed to fetch newly generated quest after retries')
        // Use fallback quest from API response
        const fallbackQuest: DailyQuest = {
          id: "fallback-" + Date.now(),
          title: data.quest.title,
          description: data.quest.description,
          location: userLocation,
          category: "Adventure",
          difficulty: "Medium",
          estimatedTime: "1-2 hours",
          points: 150,
          completed: false,
          debug: data.quest.debug,
          address: data.quest.address,
        }
        setTodayQuest(fallbackQuest)
        return
      }
      
      // Set this as the current quest
      await questUtils.setCurrentQuest(user.id, newQuest.id)
      
      // Add a small delay to prevent immediate regeneration
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Use the database quest
      const quest: DailyQuest = {
        id: newQuest.id,
        title: newQuest.title,
        description: newQuest.description,
        location: userLocation,
        category: "Adventure",
        difficulty: "Medium",
        estimatedTime: "1-2 hours",
        points: 150,
        completed: false,
        debug: data.quest.debug,
        address: newQuest.address,
      }

      console.log('Using newly generated quest:', quest)
      setTodayQuest(quest)
      
      // Update global quest store with new quest
      if (user) {
        await globalQuestStore.getAllQuests(user.id, true) // Force refresh
      }
    } catch (error) {
      console.error('Error fetching quest:', error)
      setTodayQuest(generateMockQuest())
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
      setGlobalGenerationLock(false)
    }
  }

  const generateMockQuest = (): DailyQuest => {
    return {
      id: "1",
      title: "Discover a Local Art Gallery",
      description: "Visit a local art gallery or museum you've never been to before. Take time to appreciate at least 3 different pieces and learn about one local artist.",
      location: userLocation,
      category: "Culture",
      difficulty: "Easy",
      estimatedTime: "1-2 hours",
      points: 100,
      completed: false,
      address: "123 Main St, City, State",
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
    if (!user || !todayQuest || !photoData) return
    
    setIsCompleting(true)
    try {
      // Convert photo data URL to file
      const photoFile = dataURLtoFile(photoData, `quest-${todayQuest.id}-${Date.now()}.jpg`)
      
      // Upload photo to Supabase storage with correct path
      console.log('Uploading photo to Supabase storage...')
      const filePath = `private/${user.id}/${Date.now()}-${photoFile.name}`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('location-img')
        .upload(filePath, photoFile);

      if (uploadError) {
        console.error("Upload error:", uploadError.message);
        alert("Failed to upload image.");
        return;
      }

      console.log('Photo uploaded successfully to private folder:', filePath)

      // Update the existing quest in Supabase with image path (not URL)
      const completionDataToSave = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        liked: completionData.liked,
        feedback_tags: completionData.feedback_tags,
        feedback_text: completionData.feedback_text,
        image_path: filePath, // Save the path instead of URL for private images
      }

      const { error } = await questUtils.completeQuest(todayQuest.id, completionDataToSave)
      
      if (error) {
        console.error('Error updating quest completion:', error)
        alert('Error saving quest completion. Please try again.')
        return
      }

      // Note: We don't clear current_quest_id to maintain caching
      // The quest will be marked as completed but can still be loaded from cache

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

      // Update global quest store
      if (user) {
        await globalQuestStore.getAllQuests(user.id, true) // Force refresh
      }

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

  const resetLocation = async () => {
    if (!user) return

    try {
      console.log('Resetting location for user:', user.id)
      
      // Get current preference_tags to preserve other settings
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('preference_tags')
        .eq('id', user.id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Create updated preference_tags with location cleared but other settings preserved
      const updatedPreferenceTags = {
        ...currentUser.preference_tags,
        location: null // Clear only the location, preserve other preferences
      }

      const { error } = await supabase
        .from('users')
        .update({
          location_description: null,
          preference_tags: updatedPreferenceTags
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }
      
      console.log('Location reset successful, refreshing...')
      window.location.reload()

    } catch (error) {
      console.error('Error resetting location:', error)
    }
  }

  const startCamera = async () => {
    try {
      console.log('Starting camera...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', // Use front camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      console.log('Camera stream obtained:', stream)
      setCameraStream(stream)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please make sure you have granted camera permissions.')
    }
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const photoDataUrl = canvas.toDataURL('image/jpeg')
        setPhotoData(photoDataUrl)
        setPhotoTaken(true)
        stopCamera()
      }
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  const retakePhoto = () => {
    setPhotoTaken(false)
    setPhotoData(null)
    startCamera()
  }

  const dataURLtoFile = (dataURL: string, filename: string): File => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  const handleRetry = () => {
    hasGeneratedThisSession.current = false
    fetchQuest()
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
            <Button onClick={handleRetry} className="mt-4">Retry</Button>
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
                    {todayQuest.address || userLocation}
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

          {/* Quest Completion Dialog */}
          <Dialog open={showCompletionForm} onOpenChange={setShowCompletionForm}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Complete Your Quest</DialogTitle>
                <DialogDescription>Share your experience and earn points</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Liked */}
                <div className="space-y-2">
                  <Label>Did you enjoy this quest?</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={completionData.liked ? "default" : "outline"}
                      onClick={() => setCompletionData(prev => ({ ...prev, liked: true }))}
                      className="flex-1"
                    >
                      Yes
                    </Button>
                    <Button
                      variant={!completionData.liked ? "default" : "outline"}
                      onClick={() => setCompletionData(prev => ({ ...prev, liked: false }))}
                      className="flex-1"
                    >
                      No
                    </Button>
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-2">
                  <Label>Comments</Label>
                  <Textarea
                    placeholder="Share your experience..."
                    value={completionData.feedback_text}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, feedback_text: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Camera Capture - Required */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <Camera className="w-4 h-4 mr-2" />
                    Take a Photo
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  
                  {!photoTaken ? (
                    <div className="space-y-4">
                      {!cameraStream ? (
                        <Button 
                          onClick={startCamera} 
                          variant="outline" 
                          className="w-full"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Open Camera
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="relative">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-48 object-cover rounded-lg border bg-gray-100"
                            />
                            <canvas
                              ref={canvasRef}
                              className="hidden"
                            />
                            {cameraStream && (
                              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                                Live
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              onClick={takePhoto} 
                              className="flex-1"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Take Photo
                            </Button>
                            <Button 
                              onClick={stopCamera} 
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                          src={photoData!}
                          alt="Quest completion photo"
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      </div>
                      <Button 
                        onClick={retakePhoto} 
                        variant="outline" 
                        className="w-full"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Retake Photo
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleCompleteQuest} 
                    disabled={isCompleting || !photoTaken} 
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
              </div>
            </DialogContent>
          </Dialog>

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
