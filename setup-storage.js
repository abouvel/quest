// Setup script for Supabase storage bucket and RLS policies
// Run this in the Supabase dashboard or via API

const { createClient } = require('@supabase/supabase-js')

// You'll need to get these from your Supabase project settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
    try {
        // Create the location-img bucket
        const { data, error } = await supabase.storage.createBucket('location-img', {
            public: true, // Make bucket public so images can be accessed
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'], // Only allow images
            fileSizeLimit: 5242880, // 5MB limit
        })

        if (error) {
            console.error('Error creating bucket:', error)
        } else {
            console.log('Storage bucket created successfully:', data)
        }
    } catch (error) {
        console.error('Setup error:', error)
    }
}

// Uncomment to run
// setupStorage() 