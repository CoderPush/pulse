#!/bin/bash

# Exit on error
set -e

# Check if .env exists
if [ ! -f .env ]; then
  echo "Error: .env file not found"
  exit 1
fi

# Load .env
export $(cat .env | grep -v '^#' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not set in .env"
  exit 1
fi

# Extract components from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -E 's/postgresql:\/\/([^:]+):.*/\1/')
DB_PASS=$(echo $DATABASE_URL | sed -E 's/postgresql:\/\/[^:]+:([^@]+)@.*/\1/')
DB_HOST=$(echo $DATABASE_URL | sed -E 's/postgresql:\/\/[^@]+@([^:]+):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed -E 's/postgresql:\/\/[^@]+@[^:]+:([^/]+)\/.*/\1/')
DB_NAME=$(echo $DATABASE_URL | sed -E 's/postgresql:\/\/[^@]+@[^:]+\/[^/]+\/(.*)/\1/')

echo "Setting up triggers..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f supabase/migrations/0001_add_user_sync_trigger.sql

echo "✅ Triggers setup complete" 