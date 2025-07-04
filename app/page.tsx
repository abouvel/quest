"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { profileUtils } from "@/lib/supabaseUtils"

export default function LandingPage() {
  const { user, loading, signIn, signUp, isAuthenticated } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [mounted, setMounted] = useState(false)
  const [authError, setAuthError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [hasCompletedPreferences, setHasCompletedPreferences] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user && mounted) {
      // Check if user has completed preferences
      checkUserPreferences()
    }
  }, [user, mounted])

  const checkUserPreferences = async () => {
    if (!user) return;
    
    try {
      const { data: userData } = await profileUtils.getProfile(user.id)
      // Check if user has a location set (either in location_description or preference_tags.location)
      const hasLocation = userData && (
        userData.location_description || 
        (userData.preference_tags && userData.preference_tags.location)
      )
      setHasCompletedPreferences(hasLocation)
    } catch (error) {
      console.error('Error checking preferences:', error)
      setHasCompletedPreferences(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    
    const { error } = await signIn(email, password)
    if (error) {
      setAuthError(error)
    } else {
      // Redirect to appropriate page after successful login
      if (hasCompletedPreferences) {
        window.location.href = "/dashboard"
      } else {
        window.location.href = "/preferences"
      }
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    setSuccessMessage("")
    
    const { error } = await signUp(email, password, username)
    if (error) {
      setAuthError(error)
    } else {
      // Show clear success message about email confirmation
      setSuccessMessage("Account created successfully! Please check your email and click the confirmation link to continue. You'll be able to sign in after confirming your email.")
      // Don't automatically switch to login tab - let user see the message
      // Clear the form
      setEmail("")
      setPassword("")
      setUsername("")
    }
  }

  // Show loading state until mounted to prevent hydration issues
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">EXPLR</h1>
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">EXPLR</h1>
          <p className="text-xl text-gray-600 mb-8">Discover daily adventures based on your location and preferences</p>
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
                    {authError && (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                        {authError}
                      </div>
                    )}
                    {successMessage && (
                      <div className="text-green-600 text-sm bg-green-50 p-2 rounded">
                        {successMessage}
                      </div>
                    )}
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setSuccessMessage("")
                        }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setSuccessMessage("")
                        }}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Logging in..." : "Login"}
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
                    {authError && (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                        {authError}
                      </div>
                    )}
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
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Sign Up"}
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
