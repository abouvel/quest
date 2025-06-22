"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, MapPin, Clock, Flame, Calendar } from "lucide-react"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/useAuth"
import { questUtils, userUtils } from "@/lib/supabaseUtils"

interface QuestPost {
  id: string
  username: string
  questName: string
  description: string
  location: string
  completedAt: string
  image: string
  likes: number
  comments: string[]
  streak: number
  feedback_tags: string[]
  liked: boolean
}

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState<QuestPost[]>([])
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirect to landing page if not authenticated
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/"
      return
    }

    if (isAuthenticated) {
      fetchCompletedQuests()
    }
  }, [isAuthenticated, authLoading])

  const fetchCompletedQuests = async () => {
    try {
      setLoading(true)
      
      if (!user) {
        setPosts([])
        return
      }
      
      // Fetch completed quests for the current user only
      const { data: quests, error } = await questUtils.getQuestHistory(user.id, 50)
      
      if (error) {
        console.error('Error fetching quests:', error)
        setPosts([])
        return
      }

      if (quests && quests.length > 0) {
        // Transform quests into posts format
        const transformedPosts = quests
          .filter((quest: any) => quest.status === 'completed')
          .map((quest: any) => {
            return {
              id: quest.id,
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'You',
              questName: `Quest: ${quest.description.substring(0, 50)}${quest.description.length > 50 ? '...' : ''}`,
              description: quest.description,
              location: quest.lat && quest.lng ? `📍 ${quest.lat.toFixed(4)}, ${quest.lng.toFixed(4)}` : 'Location not specified',
              completedAt: new Date(quest.completed_at).toLocaleString(),
              image: "/placeholder.svg?height=300&width=400", // Could be enhanced with actual photos later
              likes: 0, // Could be enhanced with actual likes system
              comments: [], // Could be enhanced with actual comments system
              streak: 1, // Will be updated when we fetch user data
              feedback_tags: quest.feedback_tags || [],
              liked: quest.liked || false
            }
          })

        // Sort by completion date (newest first)
        transformedPosts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        
        setPosts(transformedPosts)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error('Error fetching completed quests:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    // This could be enhanced with actual like functionality
    setPosts(posts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
  }

  const handleComment = async (postId: string) => {
    const comment = newComment[postId]
    if (!comment?.trim()) return

    // This could be enhanced with actual comment functionality
    setPosts(posts.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, comment] } : post)))
    setNewComment({ ...newComment, [postId]: "" })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quest feed...</p>
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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Quest History</h1>
            <p className="text-gray-600">Track your completed adventures and achievements</p>
          </div>

          {posts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Completed Quests Yet</h3>
                <p className="text-gray-600 mb-4">Be the first to complete a quest and share your adventure!</p>
                <Button onClick={() => window.location.href = "/quest"}>
                  Start Your First Quest
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                          <AvatarFallback>{post.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{post.username}</h3>
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <Flame className="w-3 h-3" />
                              <span>{post.streak}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {post.completedAt}
                          </p>
                        </div>
                      </div>
                      {post.liked && (
                        <Badge className="bg-green-100 text-green-800">
                          👍 Liked
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-lg mb-2">{post.questName}</h4>
                      <p className="text-gray-700 mb-2">{post.description}</p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {post.location}
                      </p>
                    </div>

                    {post.feedback_tags && post.feedback_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.feedback_tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <img
                      src={post.image || "/placeholder.svg"}
                      alt={post.questName}
                      className="w-full h-64 object-cover rounded-lg"
                    />

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className="flex items-center space-x-2"
                      >
                        <Heart className="w-4 h-4" />
                        <span>{post.likes}</span>
                      </Button>

                      <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments.length}</span>
                      </Button>
                    </div>

                    {post.comments.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        {post.comments.map((comment, index) => (
                          <p key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {comment}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      <Input
                        placeholder="Add a comment..."
                        value={newComment[post.id] || ""}
                        onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                        onKeyPress={(e) => e.key === "Enter" && handleComment(post.id)}
                      />
                      <Button onClick={() => handleComment(post.id)}>Post</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
