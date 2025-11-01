#!/bin/bash
echo "Clearing caches and restarting dev server..."
cd "$(dirname "$0")"
rm -rf node_modules/.vite dist .vite
echo "Caches cleared! Now starting dev server..."
npm run dev
