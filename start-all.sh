#!/bin/bash

# Start the LiveKit Agent Worker in the background
echo "Starting LiveKit Agent Worker..."
python backend/agent_worker.py dev &

# Start the Node.js Backend in the foreground
echo "Starting Express Backend..."
node backend/email-server.cjs
