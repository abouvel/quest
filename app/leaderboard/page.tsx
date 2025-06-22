"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Flame, Star, Medal, Crown } from "lucide-react"
import Navigation from "@/components/navigation"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { userUtils } from "@/lib/supabaseUtils"

interface LeaderboardEntry {
  id: string
  username: string
  questCount: number
  streak: number
  isCurrentUser: boolean
  isFriend: boolean
}

export default function LeaderboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      fetchLeaderboardData()
    }
  }, [authLoading, isAuthenticated, user])

  const fetchLeaderboardData = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)

      // Get current user's data
      const { data: currentUserData, error: userError } = await supabase
        .from('users')
        .select('id, username, streak_count')
        .eq('id', user.id)
        .single()
      if (userError) {
        setError('Failed to fetch user profile')
        return
      }

      // Get user's friends
      const { data: friends, error: friendsError } = await userUtils.getFriends(user.id)
      if (friendsError) {
        console.error('Error fetching friends:', friendsError)
        // Continue without friends if there's an error
      }

      // Get all quests
      const { data: questCounts, error: questError } = await supabase
        .from('quests')
        .select('user_id, status, completed_at')
      if (questError) {
        setError('Failed to fetch quests')
        return
      }

      // Build leaderboard data: current user + friends
      const leaderboardUsers = [
        { id: currentUserData.id, username: currentUserData.username, streak_count: currentUserData.streak_count, isCurrentUser: true, isFriend: false },
        ...(friends || []).map(friend => ({ 
          id: friend.id, 
          username: friend.username, 
          streak_count: friend.streak_count, 
          isCurrentUser: false, 
          isFriend: true 
        }))
      ]

      // Calculate quest counts for each user
      const userStats = leaderboardUsers.map(userData => {
        const userQuests = questCounts.filter(q => q.user_id === userData.id)
        const completedQuests = userQuests.filter(q => q.status === 'completed')
        
        return {
          id: userData.id,
          username: userData.username || 'User',
          questCount: completedQuests.length,
          streak: userData.streak_count || 0,
          isCurrentUser: userData.isCurrentUser,
          isFriend: userData.isFriend
        }
      })

      // Sort by streak (descending)
      const sortedData = userStats.sort((a, b) => b.streak - a.streak)
      setLeaderboardData(sortedData)
    } catch (err) {
      setError('Failed to fetch leaderboard data')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <Trophy className="w-5 h-5 text-gray-400" />
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 0:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
      case 1:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
      case 2:
        return "bg-gradient-to-r from-amber-500 to-amber-700 text-white"
      default:
        return "bg-white hover:bg-gray-50"
    }
  }

  const getStreakBadgeColor = (streak: number) => {
    if (streak >= 20) return "bg-red-100 text-red-800"
    if (streak >= 10) return "bg-orange-100 text-orange-800"
    if (streak >= 5) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
            <p className="text-gray-600">See who's completing the most quests!</p>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading leaderboard...</p>
            </div>
          ) : error ? (
            <Card className="text-center py-12">
              <CardContent>
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-600 mb-2">Error: {error}</h3>
                <button 
                  onClick={fetchLeaderboardData}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </CardContent>
            </Card>
          ) : leaderboardData.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Leaderboard Data</h3>
                <p className="text-gray-600 mb-4">Add some friends to see your ranking!</p>
                <button 
                  onClick={() => window.location.href = "/friends"}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Friends
                </button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Top 3 Podium */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {leaderboardData.slice(0, 3).map((entry, index) => (
                  <Card
                    key={entry.id}
                    className={`text-center ${index === 0 ? "md:order-2 ring-2 ring-yellow-400" : index === 1 ? "md:order-1" : "md:order-3"}`}
                  >
                    <CardContent className="pt-8 pb-6">
                      <div className="flex justify-center mb-6">{getRankIcon(index)}</div>
                      <Avatar className="w-16 h-16 mx-auto mb-4">
                        <AvatarImage src={"/placeholder.svg"} />
                        <AvatarFallback>{entry.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-lg mb-2">{entry.username}</h3>
                      <div className="space-y-2">
                        <Badge
                          className={`${getStreakBadgeColor(entry.streak)} flex items-center justify-center w-fit mx-auto`}
                        >
                          <Flame className="w-3 h-3 mr-1" />
                          {entry.streak} day streak
                        </Badge>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center justify-center space-x-4">
                            <span className="flex items-center">
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              {entry.questCount}
                            </span>
                            <span>{entry.questCount} quests</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Full Leaderboard List */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {leaderboardData.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          entry.isCurrentUser ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10">{getRankIcon(index)}</div>
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={"/placeholder.svg"} />
                            <AvatarFallback>{entry.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold flex items-center">
                              {entry.username}
                              {entry.isCurrentUser && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  You
                                </Badge>
                              )}
                              {entry.isFriend && !entry.isCurrentUser && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Friend
                                </Badge>
                              )}
                            </h4>
                          </div>
                        </div>
                        <Badge className={`${getStreakBadgeColor(entry.streak)} flex items-center`}>
                          <Flame className="w-3 h-3 mr-1" />
                          {entry.streak}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {/* Stats Cards */}
              {(() => {
                const currentUser = leaderboardData.find(entry => entry.isCurrentUser)
                return currentUser ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <Card>
                      <CardContent className="text-center pt-6">
                        <Flame className="w-8 h-8 text-red-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-lg">Your Streak</h3>
                        <p className="text-2xl font-bold text-red-600">{currentUser.streak} days</p>
                        <p className="text-sm text-gray-600">Keep it up!</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="text-center pt-6">
                        <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-lg">Your Rank</h3>
                        <p className="text-2xl font-bold text-yellow-600">#{leaderboardData.indexOf(currentUser) + 1}</p>
                        <p className="text-sm text-gray-600">Out of {leaderboardData.length} users</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="text-center pt-6">
                        <Star className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-lg">Total Points</h3>
                        <p className="text-2xl font-bold text-blue-600">{currentUser.questCount * 150}</p>
                        <p className="text-sm text-gray-600">All time</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : null
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
