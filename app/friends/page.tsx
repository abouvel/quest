"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Users, Flame, X } from "lucide-react"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/useAuth"
import { userUtils } from "@/lib/supabaseUtils"

interface User {
  id: string
  username: string
  streak_count?: number
}

export default function FriendsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [friends, setFriends] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/"
      return
    }

    if (isAuthenticated && user) {
      fetchFriends()
    }
  }, [isAuthenticated, authLoading, user])

  const fetchFriends = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await userUtils.getFriends(user.id)
      
      if (error) {
        console.error('Error fetching friends:', error)
        setFriends([])
      } else {
        setFriends(data || [])
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
      setFriends([])
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (term: string) => {
    if (!user || !term.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    try {
      setSearchLoading(true)
      const { data, error } = await userUtils.searchUsers(term, user.id, 10)
      
      if (error) {
        console.error('Error searching users:', error)
        setSearchResults([])
      } else {
        setSearchResults(data || [])
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    if (value.trim()) {
      searchUsers(value)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  const addFriend = async (friendId: string) => {
    if (!user) return

    try {
      const { error } = await userUtils.addFriend(user.id, friendId)
      
      if (error) {
        console.error('Error adding friend:', error)
        alert('Failed to add friend. Please try again.')
      } else {
        // Refresh friends list and clear search
        await fetchFriends()
        setSearchTerm("")
        setSearchResults([])
        setShowSearchResults(false)
        alert('Friend added successfully!')
      }
    } catch (error) {
      console.error('Error adding friend:', error)
      alert('Failed to add friend. Please try again.')
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!user) return

    if (!confirm('Are you sure you want to remove this friend?')) return

    try {
      const { error } = await userUtils.removeFriend(user.id, friendId)
      
      if (error) {
        console.error('Error removing friend:', error)
        alert('Failed to remove friend. Please try again.')
      } else {
        await fetchFriends()
        alert('Friend removed successfully!')
      }
    } catch (error) {
      console.error('Error removing friend:', error)
      alert('Failed to remove friend. Please try again.')
    }
  }

  const isAlreadyFriend = (userId: string) => {
    return friends.some(friend => friend.id === userId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading friends...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Friends</h1>
            <p className="text-gray-600">Connect with other adventurers</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Add Friends Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Add Friends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by username..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {searchLoading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                )}

                {showSearchResults && searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            {user.streak_count && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Flame className="w-3 h-3" />
                                <span>{user.streak_count} day streak</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {isAlreadyFriend(user.id) ? (
                          <Badge variant="secondary">Already Friends</Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => addFriend(user.id)}
                            className="flex items-center space-x-1"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Add</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && searchTerm.trim() && !searchLoading && (
                  <div className="text-center py-4 text-gray-500">
                    No users found matching "{searchTerm}"
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Friends List Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Your Friends ({friends.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friends.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No friends yet</p>
                    <p className="text-sm">Search for users above to add friends</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {friends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{friend.username}</p>
                            {friend.streak_count && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Flame className="w-3 h-3" />
                                <span>{friend.streak_count} day streak</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFriend(friend.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 