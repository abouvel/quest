"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Home, MapPin, Trophy, Calendar, User, Settings, LogOut, Users, RefreshCw } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"

export default function Navigation() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()

  const navItems = [
    { href: "/quest", label: "Quest", icon: Calendar },
    { href: "/map", label: "Map", icon: MapPin },
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ]

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    window.location.href = "/"
  }

  const simulateNewDay = async () => {
    if (!user) return
    
    try {
      console.log('Simulating new day for user:', user.id)
      
      // Clear the current quest ID from the user
      const { error } = await supabase
        .from('users')
        .update({ current_quest_id: null })
        .eq('id', user.id)
      
      if (error) {
        console.error('Error clearing current quest:', error)
        return
      }
      
      console.log('New day simulation complete - current quest cleared')
      
      // Always reload the page to reset session flags and get a fresh quest
      window.location.reload()
    } catch (error) {
      console.error('Error simulating new day:', error)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo and Navigation */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">EXPLR</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href

                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant={isActive ? "default" : "ghost"} className="flex items-center space-x-2">
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side: New Day Button and User Menu */}
          <div className="flex items-center space-x-2">
            {/* Simulate New Day Button */}
            {isAuthenticated && (
              <Button 
                onClick={simulateNewDay}
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Day
              </Button>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{(user?.user_metadata?.username || user?.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block">{user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col items-center space-y-1 h-auto py-2 ${
                      isActive ? "text-blue-600" : "text-gray-600"
                    }`}
                  >
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
