# Supabase setup

1. Create a project at https://supabase.com.
2. Copy `Project Settings → API` values into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Open the SQL editor and run `schema.sql`.
4. Enable Phone auth under `Authentication → Providers` (used for OTP).
