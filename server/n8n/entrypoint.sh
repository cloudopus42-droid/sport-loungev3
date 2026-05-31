#!/bin/sh

echo "🚀 Starting n8n in the background to initialize the SQLite database..."
n8n start &
N8N_PID=$!

echo "⏳ Waiting for n8n to initialize database and REST API..."
sleep 10

echo "📥 Importing custom workflows from /etc/n8n/workflows..."
if [ -d "/etc/n8n/workflows" ]; then
  for f in /etc/n8n/workflows/*.json; do
    if [ -f "$f" ]; then
      echo "⚡ Importing workflow: $f"
      n8n import:workflow "$f" || echo "⚠️ Failed to import $f"
    fi
  done
else
  echo "⚠️ Workflows directory not found!"
fi

echo "🎉 All premium automations imported! Keeping n8n in the foreground..."
wait $N8N_PID
