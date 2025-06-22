import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '../../../lib/userService'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Generate quest using your existing service
    const quest = await UserService.generateUserQuest(userId)
    
    if (!quest) {
      return NextResponse.json({ error: 'Failed to generate quest' }, { status: 500 })
    }

    return NextResponse.json({ quest })
  } catch (error) {
    console.error('Error generating quest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 