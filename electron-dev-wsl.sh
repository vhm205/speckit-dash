#!/bin/bash
# WSL 2 Electron Development Helper Script
# This script sets up the environment for running Electron apps in WSL 2

set -e

echo "🔧 Setting up WSL 2 environment for Electron..."

# Check if WSLg is available (built-in GUI support in modern WSL 2)
if [ -d "/mnt/wslg" ]; then
    echo "✓ WSLg detected - using native WSL 2 GUI support"
    export DISPLAY=:0
    export WAYLAND_DISPLAY=wayland-0
    export XDG_RUNTIME_DIR=/mnt/wslg/runtime-dir
    export PULSE_SERVER=/mnt/wslg/PulseServer
else
    echo "⚠ WSLg not found - you may need to use an X server on Windows"
    echo "  Consider installing VcXsrv or Xming on Windows"
    
    # Try to auto-detect Windows host IP for X11 forwarding
    WIN_IP=$(ip route show | grep -i default | awk '{ print $3}')
    export DISPLAY="${WIN_IP}:0.0"
    echo "  Setting DISPLAY to: $DISPLAY"
fi

# Electron flags for WSL 2 compatibility
export ELECTRON_EXTRA_LAUNCH_ARGS="--disable-gpu --no-sandbox --disable-dev-shm-usage"

echo "✓ Environment configured"
echo ""
echo "Environment variables:"
echo "  DISPLAY=$DISPLAY"
echo "  ELECTRON_EXTRA_LAUNCH_ARGS=$ELECTRON_EXTRA_LAUNCH_ARGS"
echo ""

# Run the electron dev command
echo "🚀 Starting Electron development server..."
npm run electron:dev
