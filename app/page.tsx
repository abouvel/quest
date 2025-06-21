"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Trophy, Users, Calendar } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [mounted, setMounted] = useState(false)

  // Check if user is already authenticated
  useEffect(() => {
    setMounted(true)
    const user = localStorage.getItem("currentUser")
    if (user) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock authentication
    const userData = { email, username: email.split("@")[0], hasCompletedPreferences: false }
    localStorage.setItem("currentUser", JSON.stringify(userData))
    setIsAuthenticated(true)
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock authentication
    const userData = { email, username, hasCompletedPreferences: false }
    localStorage.setItem("currentUser", JSON.stringify(userData))
    setIsAuthenticated(true)
  }

  if (isAuthenticated) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")

    if (!currentUser.hasCompletedPreferences) {
      if (mounted) {
        window.location.href = "/preferences"
      }
      return null
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to QuestMap!</h1>
            <p className="text-xl text-gray-600 mb-8">Your daily adventure awaits</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Link href="/dashboard">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <CardTitle>Daily Feed</CardTitle>
                    <CardDescription>See what your friends are up to</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/quest">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <CardTitle>Today's Quest</CardTitle>
                    <CardDescription>Discover your daily adventure</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/map">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <CardTitle>Interactive Map</CardTitle>
                    <CardDescription>Explore where friends have been</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/leaderboard">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                    <CardTitle>Leaderboard</CardTitle>
                    <CardDescription>See who's on the longest streak</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">QuestMap</h1>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">QuestMap</h1>
          <p className="text-xl text-gray-600 mb-8">Discover daily adventures based on your location and preferences</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Location-Based Quests</h3>
              <p className="text-gray-600">Get personalized daily activities based on your location and interests</p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">Social Features</h3>
              <p className="text-gray-600">Connect with friends, share your adventures, and see where they've been</p>
            </div>
            <div className="text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
              <h3 className="text-lg font-semibold mb-2">Streak Tracking</h3>
              <p className="text-gray-600">Build streaks, compete with friends, and climb the leaderboard</p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>Enter your credentials to access your quests</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Login
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Sign Up</CardTitle>
                  <CardDescription>Create your account to start your quest journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Sign Up
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
