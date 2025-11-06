#!/bin/bash

# Start script for Cloud Run
# Cloud Run sets the PORT environment variable automatically

# Use PORT from environment or default to 3000
export PORT="${PORT:-3000}"

echo "Starting server on port $PORT..."
node dist/app.js
