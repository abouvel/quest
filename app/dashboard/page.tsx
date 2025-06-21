"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, MapPin, Clock, Flame } from "lucide-react"
import Navigation from "@/components/navigation"

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
  const [posts, setPosts] = useState<QuestPost[]>([])
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({})

  useEffect(() => {
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
  }, [])

  const handleLike = (postId: string) => {
    setPosts(posts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
  }

  const handleComment = (postId: string) => {
    const comment = newComment[postId]
    if (!comment?.trim()) return

    setPosts(posts.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, comment] } : post)))
    setNewComment({ ...newComment, [postId]: "" })
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
