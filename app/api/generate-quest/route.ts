import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '../../../lib/userService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId;
    console.log('[API] /api/generate-quest called. Received userId:', userId);

    if (!userId) {
      console.error('[API] No userId provided in request body:', body);
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Generate quest using your existing service
    let quest;
    try {
      quest = await UserService.generateUserQuest(userId)
      console.log('[API] Quest generated for userId:', userId, quest);
    } catch (err) {
      console.error('[API] Error in generateUserQuest:', err);
      return NextResponse.json({ error: 'Failed to generate quest', details: (err as any)?.message || err }, { status: 500 })
    }

    if (!quest) {
      console.error('[API] No quest returned for userId:', userId);
      return NextResponse.json({ error: 'Failed to generate quest' }, { status: 500 })
    }

    // Save the quest to database
    let saveSuccess;
    try {
      saveSuccess = await UserService.saveGeneratedQuest(userId, quest)
      console.log('[API] Quest save result for userId:', userId, saveSuccess);
    } catch (err) {
      console.error('[API] Error in saveGeneratedQuest:', err);
      return NextResponse.json({ error: 'Failed to save quest to database', details: (err as any)?.message || err }, { status: 500 })
    }

    if (!saveSuccess) {
      console.error('[API] Quest was not saved for userId:', userId, quest);
      return NextResponse.json({ error: 'Failed to save quest to database' }, { status: 500 })
    }

    console.log('[API] Quest successfully generated and saved for userId:', userId);
    return NextResponse.json({ quest })
  } catch (error) {
    console.error('[API] Unhandled error in /api/generate-quest:', error)
    return NextResponse.json({ error: 'Internal server error', details: (error as any)?.message || error }, { status: 500 })
  }
} 