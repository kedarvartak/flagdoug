#!/bin/bash

# Script to run E2E tests for the Flag Doug backend API
# This script checks for database connectivity and runs the tests

set -e

echo "🧪 Flag Doug E2E Test Runner"
echo "=============================="
echo ""

# Check if PostgreSQL is running
echo "📊 Checking database connectivity..."
if ! pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running on localhost:5432"
    echo ""
    echo "Please start PostgreSQL first:"
    echo ""
    echo "Using Docker:"
    echo "  docker run --name flagdoug-postgres \\"
    echo "    -e POSTGRES_PASSWORD=password \\"
    echo "    -e POSTGRES_DB=flagdoug \\"
    echo "    -p 5432:5432 \\"
    echo "    -d postgres:15"
    echo ""
    echo "Or start your local PostgreSQL service"
    exit 1
fi

echo "✅ Database is running"
echo ""

# Check if database exists
echo "📊 Checking if database exists..."
if ! psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw flagdoug; then
    echo "⚠️  Database 'flagdoug' does not exist"
    echo "Creating database..."
    createdb -h localhost -U postgres flagdoug
    echo "✅ Database created"
else
    echo "✅ Database exists"
fi
echo ""

# Run migrations
echo "🔄 Running database migrations..."
npm run migration:run
echo "✅ Migrations complete"
echo ""

# Run tests
echo "🧪 Running E2E tests..."
echo ""

if [ "$1" == "--coverage" ]; then
    npm run test:e2e -- --coverage
elif [ -n "$1" ]; then
    npm run test:e2e -- "$1"
else
    npm run test:e2e
fi

echo ""
echo "✅ Tests complete!"
