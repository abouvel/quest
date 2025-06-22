"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, MapPin, Clock, Flame } from "lucide-react"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/useAuth"
import { postUtils } from "@/lib/supabaseUtils"

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
}

export default function Dashboard() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<QuestPost[]>([])
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      // Try to fetch from Supabase first
      const { data: supabasePosts, error } = await postUtils.getPosts(20)
      
      if (error) {
        console.log('Supabase error, using mock data:', error)
        // Fallback to mock data if Supabase fails
        loadMockData()
      } else if (supabasePosts && supabasePosts.length > 0) {
        // Transform Supabase data to match our interface
        const transformedPosts = supabasePosts.map((post: any) => ({
          id: post.id,
          username: post.profiles?.username || 'anonymous',
          questName: post.title || 'Quest',
          description: post.description || '',
          location: post.location || 'Unknown location',
          completedAt: new Date(post.created_at).toLocaleString(),
          image: post.image_url || "/placeholder.svg?height=300&width=400",
          likes: post.likes_count || 0,
          comments: post.comments || [],
          streak: post.streak || 1,
        }))
        setPosts(transformedPosts)
      } else {
        // No posts in database, use mock data
        loadMockData()
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      loadMockData()
    } finally {
      setLoading(false)
    }
  }

  const loadMockData = () => {
    // Mock data for the feed
    const mockPosts: QuestPost[] = [
      {
        id: "1",
        username: "alex_explorer",
        questName: "Coffee Shop Discovery",
        description:
          "Found this amazing local coffee shop with the best latte art! The barista was super friendly and they have a cozy reading corner.",
        location: "Downtown Coffee Co.",
        completedAt: "2 hours ago",
        image: "/placeholder.svg?height=300&width=400",
        likes: 12,
        comments: ["Looks amazing!", "I need to check this place out"],
        streak: 7,
      },
      {
        id: "2",
        username: "sarah_adventurer",
        questName: "Hidden Park Trail",
        description:
          "Discovered a beautiful hidden trail in Central Park. Perfect for a morning jog with stunning city views!",
        location: "Central Park Trail #3",
        completedAt: "4 hours ago",
        image: "/placeholder.svg?height=300&width=400",
        likes: 18,
        comments: ["Great find!", "Adding this to my list"],
        streak: 12,
      },
      {
        id: "3",
        username: "mike_foodie",
        questName: "Local Food Truck",
        description:
          "Tried the most incredible tacos from this food truck. The owner shared the story behind their family recipe!",
        location: "Taco Libre Food Truck",
        completedAt: "6 hours ago",
        image: "/placeholder.svg?height=300&width=400",
        likes: 25,
        comments: ["Those tacos look incredible!", "What was your favorite?"],
        streak: 5,
      },
    ]
    setPosts(mockPosts)
  }

  const handleLike = async (postId: string) => {
    if (!user) return

    try {
      // Try to like in Supabase
      await postUtils.likePost(postId, user.id)
      // Update local state
      setPosts(posts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
    } catch (error) {
      console.error('Error liking post:', error)
      // Fallback to local state update
      setPosts(posts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
    }
  }

  const handleComment = async (postId: string) => {
    if (!user) return
    
    const comment = newComment[postId]
    if (!comment?.trim()) return

    try {
      // Try to add comment to Supabase
      await postUtils.addComment(postId, user.id, comment)
      // Update local state
      setPosts(posts.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, comment] } : post)))
      setNewComment({ ...newComment, [postId]: "" })
    } catch (error) {
      console.error('Error adding comment:', error)
      // Fallback to local state update
      setPosts(posts.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, comment] } : post)))
      setNewComment({ ...newComment, [postId]: "" })
    }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quest Feed</h1>
            <p className="text-gray-600">See what adventures your friends have been on today</p>
          </div>

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
        </div>
      </div>
    </div>
  )
}
