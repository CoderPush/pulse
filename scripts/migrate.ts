import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const runMigrate = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString, { max: 1 });

  console.log('⏳ Running migrations...');

  try {
    // Drop existing objects
    await client`
      drop trigger if exists on_auth_user_created on auth.users
    `;

    await client`
      drop function if exists public.handle_new_user()
    `;

    await client`
      drop table if exists public.users cascade
    `;

    // Create users table
    await client`
      create table public.users (
        id uuid not null references auth.users on delete cascade,
        email text not null,
        name text,
        is_admin boolean default false,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null,
        primary key (id)
      )
    `;

    // Create function to handle new user creation
    await client`
      create function public.handle_new_user()
      returns trigger
      language plpgsql
      security definer set search_path = ''
      as $$
      begin
        insert into public.users (id, email, name, is_admin, created_at)
        values (
          new.id,
          new.email,
          new.raw_user_meta_data->>'name',
          false, -- default to non-admin
          new.created_at
        );
        return new;
      end;
      $$
    `;

    // Create trigger for new user creation
    await client`
      create trigger on_auth_user_created
        after insert on auth.users
        for each row execute procedure public.handle_new_user()
    `;

    // Migrate existing users
    await client`
      insert into public.users (id, email, name, is_admin, created_at)
      select 
        id,
        email,
        raw_user_meta_data->>'name' as name,
        false as is_admin, -- default to non-admin
        created_at
      from auth.users
      where not exists (
        select 1 from public.users where public.users.id = auth.users.id
      )
    `;

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});