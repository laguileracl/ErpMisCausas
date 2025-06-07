#!/bin/bash

# Build script for Vercel deployment
echo "Starting frontend build for Vercel..."

# Navigate to client directory and build
cd client
npm install
npm run build

# Copy build output to root for Vercel
cd ..
cp -r client/dist/* ./

echo "Build completed successfully!"