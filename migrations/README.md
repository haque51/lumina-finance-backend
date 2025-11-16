# Database Migrations

This directory contains SQL migration files for the Lumina Finance Backend database.

## How to Run Migrations

### Using Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Open the migration file from this directory
5. Copy and paste the SQL content
6. Click **Run** to execute the migration

### Using Supabase CLI (Alternative)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push --include-all
