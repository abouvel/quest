import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { UserService } from '../../../lib/userService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, coordinates } = body;

    console.log('[API] /api/generate-quest called.', { userId, coordinates });

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Update user coordinates in Supabase
    if (coordinates?.latitude && coordinates?.longitude) {
      const { error: locationUpdateError } = await supabase
        .from('users')
        .update({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        })
        .eq('id', userId);

      if (locationUpdateError) {
        console.error('[API] Supabase error updating user coordinates:', locationUpdateError);
        return NextResponse.json({ error: 'Failed to update user location' }, { status: 500 });
      }

      console.log(`[API] Updated user location in Supabase for ${userId}:`, coordinates);
    } else {
      console.warn('[API] No coordinates provided or invalid:', coordinates);
    }

    // Generate quest
    let questResponse;
    try {
      questResponse = await UserService.generateUserQuest(userId);
      console.log('[API] Quest generated:', questResponse);
    } catch (err) {
      console.error('[API] Error generating quest:', err);
      return NextResponse.json({ error: 'Failed to generate quest', details: (err as any)?.message || err }, { status: 500 });
    }

    const quest = questResponse?.final_quest ?? questResponse?.quest ?? questResponse;
    if (!quest || !quest.description) {
      return NextResponse.json({ error: 'Invalid quest object from backend', details: quest }, { status: 500 });
    }

    // Save quest
    try {
      const saveSuccess = await UserService.saveGeneratedQuest(userId, quest);
      if (!saveSuccess) {
        throw new Error('Quest save returned false');
      }
      console.log('[API] Quest saved for userId:', userId);
    } catch (err) {
      console.error('[API] Error saving quest:', err);
      return NextResponse.json({ error: 'Failed to save quest', details: (err as any)?.message || err }, { status: 500 });
    }

    return NextResponse.json({ quest });
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error', details: (error as any)?.message || error }, { status: 500 });
  }
}
