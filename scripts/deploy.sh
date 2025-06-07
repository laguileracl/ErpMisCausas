#!/bin/bash

# ERP MisCausas - Production Deployment Script
# This script prepares and validates the application for deployment

set -e  # Exit on any error

echo "🚀 ERP MisCausas - Production Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're on main branch
echo "Checking Git branch..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    print_error "Error: Must be on main branch for deployment (currently on: $BRANCH)"
    exit 1
fi
print_status "On main branch"

# Check for uncommitted changes
echo "Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
    print_error "Error: You have uncommitted changes. Commit or stash them first."
    git status --short
    exit 1
fi
print_status "No uncommitted changes"

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    print_error "Error: Node.js 18+ required (found: $(node --version))"
    exit 1
fi
print_status "Node.js version: $(node --version)"

# Install dependencies
echo "Installing dependencies..."
npm ci
print_status "Dependencies installed"

# Run type checking
echo "Running TypeScript type checking..."
npm run check
print_status "Type checking passed"

# Build application
echo "Building application..."
npm run build
print_status "Application built successfully"

# Check if dist directory was created
if [ ! -d "dist" ]; then
    print_error "Error: Build failed - dist directory not found"
    exit 1
fi
print_status "Build artifacts verified"

# Test database migration (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
    echo "Testing database migration..."
    npm run db:push
    print_status "Database migration successful"
else
    print_warning "DATABASE_URL not set - skipping database validation"
fi

# Validate environment variables for production
echo "Validating production requirements..."

REQUIRED_VARS=("NODE_ENV" "DATABASE_URL" "JWT_SECRET" "SESSION_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_warning "Missing environment variables for production:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Ensure these are set in your deployment platform:"
    echo "- Railway: Project Settings > Variables"
    echo "- Render: Environment tab in service settings"
    echo "- Docker: Include in .env file or docker-compose.yml"
else
    print_status "All required environment variables present"
fi

# Test health endpoint if server is running locally
echo "Testing application startup..."
if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
    print_status "Health endpoint responding"
else
    print_warning "Health endpoint not accessible (server may not be running locally)"
fi

# Generate deployment summary
echo ""
echo "=============================================="
echo "📋 DEPLOYMENT SUMMARY"
echo "=============================================="
print_status "Git branch: main"
print_status "No uncommitted changes"
print_status "Dependencies installed"
print_status "TypeScript compilation passed"
print_status "Build completed successfully"

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    print_status "Environment variables validated"
else
    print_warning "${#MISSING_VARS[@]} environment variable(s) need to be set"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo "1. Push to GitHub to trigger CI/CD:"
echo "   git push origin main"
echo ""
echo "2. For Railway deployment:"
echo "   - Connect GitHub repo in Railway dashboard"
echo "   - Add PostgreSQL plugin"
echo "   - Set environment variables"
echo ""
echo "3. For Render deployment:"
echo "   - Create Web Service from GitHub repo"
echo "   - Add PostgreSQL database"
echo "   - Configure environment variables"
echo ""
echo "4. For Docker deployment:"
echo "   docker build -t erp-miscausas ."
echo "   docker run -p 5000:5000 --env-file .env erp-miscausas"
echo ""

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    print_status "✅ Application ready for production deployment!"
    exit 0
else
    print_warning "⚠️  Set missing environment variables before deploying"
    exit 1
fi