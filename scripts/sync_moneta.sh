#!/bin/bash

# Moneta Bank Data Synchronization Utility
# This script pulls a full backup from your Production Render Database 
# and restores it to your local Moneta Database.

# --- Configuration ---
# 1. Enter your Render Internal or External Connection String below
# PROD_DB_URL="postgres://user:password@hostname:port/dbname"
PROD_DB_URL=$1

# 2. Local Database Name
LOCAL_DB="moneta_local"

# --- Logic ---

if [ -z "$PROD_DB_URL" ]; then
    echo "❌ Error: No production Database URL provided."
    echo "Usage: ./sync_moneta.sh <RENDER_EXTERNAL_DB_URL>"
    exit 1
fi

echo "🚀 Starting Moneta Bank data synchronization..."
echo "📡 Source: Render Production Database"
echo "🏠 Target: Local '$LOCAL_DB' Database"

# Step 1: Dump production schema and data
echo "✨ Step 1/3: Exporting data from production..."
pg_dump "$PROD_DB_URL" --no-owner --no-privileges -f moneta_temp_dump.sql

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to dump production data. Please check your URL and connection."
    exit 1
fi

# Step 2: Drop and recreate local DB to ensure clean sync
echo "🧹 Step 2/3: Resetting local instance..."
dropdb --if-exists "$LOCAL_DB"
createdb "$LOCAL_DB"

# Step 3: Restore to local
echo "📥 Step 3/3: Importing data locally..."
psql -d "$LOCAL_DB" -f moneta_temp_dump.sql > /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Error: Restore failed."
    rm moneta_temp_dump.sql
    exit 1
fi

# Cleanup
rm moneta_temp_dump.sql

echo "✅ Synchronization Complete! Your local 'moneta_local' is now identical to Production."
echo "💡 To use this locally, set DATABASE_URL=postgresql://localhost/$LOCAL_DB in your .env"
