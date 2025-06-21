"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Flame, Star, Medal, Crown } from "lucide-react"
import Navigation from "@/components/navigation"

interface LeaderboardUser {
  id: string
  username: string
  currentStreak: number
  totalQuests: number
  totalPoints: number
  rank: number
  avatar: string
  isCurrentUser?: boolean
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [timeframe, setTimeframe] = useState<"week" | "month" | "allTime">("week")

  useEffect(() => {
    // Mock leaderboard data
    const mockLeaderboard: LeaderboardUser[] = [
      {
        id: "1",
        username: "sarah_adventurer",
        currentStreak: 28,
        totalQuests: 45,
        totalPoints: 6750,
        rank: 1,
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "2",
        username: "alex_explorer",
        currentStreak: 21,
        totalQuests: 38,
        totalPoints: 5700,
        rank: 2,
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "3",
        username: "mike_foodie",
        currentStreak: 15,
        totalQuests: 32,
        totalPoints: 4800,
        rank: 3,
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "4",
        username: "you",
        currentStreak: 12,
        totalQuests: 28,
        totalPoints: 4200,
        rank: 4,
        avatar: "/placeholder.svg?height=40&width=40",
        isCurrentUser: true,
      },
      {
        id: "5",
        username: "emma_culture",
        currentStreak: 9,
        totalQuests: 25,
        totalPoints: 3750,
        rank: 5,
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "6",
        username: "david_hiker",
        currentStreak: 7,
        totalQuests: 22,
        totalPoints: 3300,
        rank: 6,
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "7",
        username: "lisa_photographer",
        currentStreak: 5,
        totalQuests: 18,
        totalPoints: 2700,
        rank: 7,
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ]
    setLeaderboard(mockLeaderboard)
  }, [timeframe])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
              <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-gray-600">See who's dominating the quest scene</p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm border">
              {(["week", "month", "allTime"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeframe === period ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {period === "allTime" ? "All Time" : period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {leaderboard.slice(0, 3).map((user, index) => (
              <Card
                key={user.id}
                className={`text-center ${index === 0 ? "md:order-2 ring-2 ring-yellow-400" : index === 1 ? "md:order-1" : "md:order-3"}`}
              >
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">{getRankIcon(user.rank)}</div>
                  <Avatar className="w-16 h-16 mx-auto mb-4">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg mb-2">{user.username}</h3>
                  <div className="space-y-2">
                    <Badge
                      className={`${getStreakBadgeColor(user.currentStreak)} flex items-center justify-center w-fit mx-auto`}
                    >
                      <Flame className="w-3 h-3 mr-1" />
                      {user.currentStreak} day streak
                    </Badge>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center justify-center space-x-4">
                        <span className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-yellow-500" />
                          {user.totalPoints}
                        </span>
                        <span>{user.totalQuests} quests</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Full Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      user.isCurrentUser ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8">{getRankIcon(user.rank)}</div>

                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div>
                        <h4 className="font-semibold flex items-center">
                          {user.username}
                          {user.isCurrentUser && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </h4>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Star className="w-3 h-3 mr-1 text-yellow-500" />
                            {user.totalPoints} pts
                          </span>
                          <span>{user.totalQuests} quests</span>
                        </div>
                      </div>
                    </div>

                    <Badge className={`${getStreakBadgeColor(user.currentStreak)} flex items-center`}>
                      <Flame className="w-3 h-3 mr-1" />
                      {user.currentStreak}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card>
              <CardContent className="text-center pt-6">
                <Flame className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <h3 className="font-semibold text-lg">Your Streak</h3>
                <p className="text-2xl font-bold text-red-600">12 days</p>
                <p className="text-sm text-gray-600">Keep it up!</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center pt-6">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-semibold text-lg">Your Rank</h3>
                <p className="text-2xl font-bold text-yellow-600">#4</p>
                <p className="text-sm text-gray-600">Out of 127 users</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="text-center pt-6">
                <Star className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold text-lg">Total Points</h3>
                <p className="text-2xl font-bold text-blue-600">4,200</p>
                <p className="text-sm text-gray-600">This month</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
