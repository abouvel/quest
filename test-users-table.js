const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUsersTable() {
    try {
        console.log('Testing users table...')

        // Test 1: Check if users table exists
        console.log('\n1. Checking if users table exists...')
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', 'users')

        if (tablesError) {
            console.error('Error checking tables:', tablesError)
        } else {
            console.log('Tables found:', tables)
        }

        // Test 2: Try to select from users table
        console.log('\n2. Trying to select from users table...')
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(5)

        if (usersError) {
            console.error('Error selecting from users:', usersError)
            console.error('Error details:', {
                code: usersError.code,
                message: usersError.message,
                details: usersError.details,
                hint: usersError.hint
            })
        } else {
            console.log('Users found:', users)
        }

        // Test 3: Check table structure
        console.log('\n3. Checking table structure...')
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_schema', 'public')
            .eq('table_name', 'users')
            .order('ordinal_position')

        if (columnsError) {
            console.error('Error checking columns:', columnsError)
        } else {
            console.log('Table columns:', columns)
        }

        // Test 4: Check RLS policies
        console.log('\n4. Checking RLS policies...')
        const { data: policies, error: policiesError } = await supabase
            .from('pg_policies')
            .select('policyname, cmd, qual')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')

        if (policiesError) {
            console.error('Error checking policies:', policiesError)
        } else {
            console.log('RLS policies:', policies)
        }

    } catch (error) {
        console.error('Test failed:', error)
    }
}

testUsersTable() 