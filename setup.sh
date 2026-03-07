#!/bin/bash

# AHP Studio Quick Setup Script
# Copyright 2026 by Dr. Jose Mendoza

set -e

echo "========================================="
echo "     AHP Studio Setup Script"
echo "========================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required"
    exit 1
fi
echo "✅ Node.js $(node -v) detected"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing"
    echo "   Press Enter when ready..."
    read
else
    echo "✅ .env file exists"
fi
echo ""

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
echo ""

# Seed admin user to DigitalOcean Spaces
echo "Seeding admin user..."
npm run seed
echo ""
echo "✅ Data store initialised"
echo ""

cd ..

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install
cd ..
echo ""

echo "========================================="
echo "     Setup Complete!"
echo "========================================="
echo ""
echo "To start development:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd server && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd client && npm start"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo ""
