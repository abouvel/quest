import dotenv from 'dotenv'
import { supabase } from './lib/supabase.js'

// Load environment variables from .env file
dotenv.config()

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...\n')
  
  try {
    // Test 1: Check if environment variables are set
    console.log('1. Checking environment variables...')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      console.log('❌ Missing environment variables:')
      console.log('   NEXT_PUBLIC_SUPABASE_URL:', url ? '✅ Set' : '❌ Missing')
      console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? '✅ Set' : '❌ Missing')
      console.log('\nPlease create a .env.local file with your Supabase credentials.')
      return
    }
    
    console.log('✅ Environment variables are set')
    console.log('')
    
    // Test 2: Test basic connection
    console.log('2. Testing Supabase connection...')
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      console.log('❌ Connection failed:', error.message)
      if (error.message.includes('relation "users" does not exist')) {
        console.log('   → You need to create the users table in your Supabase project')
      }
      return
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('✅ Database tables are accessible')
    console.log('')
    
    // Test 3: Check if tables exist
    console.log('3. Checking table structure...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (usersError) {
      console.log('❌ Users table error:', usersError.message)
    } else {
      console.log('✅ Users table accessible')
      if (users && users.length > 0) {
        const user = users[0]
        console.log('Sample user:', {
          id: user.id,
          username: user.username,
          streak_count: user.streak_count,
          preference: user.preference
        })
      }
    }
    
    const { data: quests, error: questsError } = await supabase
      .from('completed_quests')
      .select('*')
      .limit(1)
    
    if (questsError) {
      console.log('❌ Completed quests table error:', questsError.message)
    } else {
      console.log('✅ Completed quests table accessible')
    }
    
    console.log('\n🎉 Supabase integration is working!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testSupabaseConnection() 