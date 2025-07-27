#!/bin/bash

echo "Setting up Inlight development environment..."

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "Installing client dependencies..."
npm install

echo ""
echo "Setup complete!"
echo ""
echo "To start development:"
echo "1. Start the server: cd server && npm start"
echo "2. In another terminal, start the client: npm start"
echo ""
echo "The server will run on http://localhost:3001"
echo "The client will run on http://localhost:3000"
echo ""
echo "Don't forget to create src/key.ts with your ArcGIS API key!" 