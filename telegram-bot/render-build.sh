#!/bin/bash
# Build script for Render deployment

echo "🚀 Building El Pollo Loco Bot + Dashboard..."

# Install dependencies
npm install

# Create public directory if it doesn't exist
mkdir -p web-app/public

echo "✅ Build complete!"