# Running Electron in WSL 2

> **⚠️ IMPORTANT**: To see the Electron GUI window in WSL 2, you need a working display server. Read the "Prerequisites" section below before running for the first time.

## ✅ Quick Fix Applied

The following issues have been fixed:
- ✅ UUID ES module compatibility (dynamic imports)
- ✅ GPU errors suppressed with proper flags
- ✅ Helper script created for easy WSL 2 setup

## Quick Start

**First time setup**: Ensure you have a display server (see Prerequisites below)

Then run:

```bash
npm run electron:dev:wsl
```

Or use the standard command:

```bash
npm run electron:dev
```

## Prerequisites

### Option 1: WSLg (Recommended - Windows 11 or newer WSL)

If you're on **Windows 11** or have a recent WSL update, you already have **WSLg** (WSL GUI support) built-in. No additional setup needed!

Verify WSLg is available:
```bash
ls /mnt/wslg
```

If the directory exists, you're good to go!

### Option 2: X Server on Windows (Windows 10 or older WSL)

If WSLg is not available, you need to install an X server on Windows:

1. **Install VcXsrv** (recommended):
   - Download from: https://sourceforge.net/projects/vcxsrv/
   - Run XLaunch with these settings:
     - Display number: 0
     - Start no client: ✓
     - Disable access control: ✓
     - Additional parameters: `-ac -nowgl`

2. **Configure Windows Firewall**:
   - Allow VcXsrv through Windows Firewall for private networks

3. **Set DISPLAY in WSL**:
   ```bash
   export DISPLAY=$(ip route show | grep -i default | awk '{ print $3}'):0.0
   ```

## Common Issues

### Issue: "cannot open display" error

**Solution**: Make sure your X server (WSLg or VcXsrv) is running:

For WSLg:
```bash
echo $DISPLAY  # Should show :0 or similar
ls /mnt/wslg   # Should exist
```

For VcXsrv:
```bash
# Test connection
xdpyinfo
# If fails, check your DISPLAY variable and Windows firewall
```

### Issue: "[ERROR:viz_main_impl.cc] Exiting GPU process"

This is expected in WSL 2 and is handled by the `--disable-gpu` flag.

### Issue: Blank/black window

**Solutions**:
1. Make sure you're using the latest WSL kernel:
   ```bash
   wsl --update
   ```

2. Try software rendering:
   ```bash
   export LIBGL_ALWAYS_SOFTWARE=1
   npm run electron:dev
   ```

### Issue: "Error: Port 5173 is already in use"

**Solution**: Kill the existing Vite process:
```bash
lsof -ti:5173 | xargs kill -9
```

Or use a different port in `vite.config.ts`.

## Environment Variables Reference

The helper script automatically sets these for you:

```bash
# For WSLg (built-in)
export DISPLAY=:0
export WAYLAND_DISPLAY=wayland-0
export XDG_RUNTIME_DIR=/mnt/wslg/runtime-dir
export PULSE_SERVER=/mnt/wslg/PulseServer

# For X11 forwarding
export DISPLAY=$(ip route show | grep -i default | awk '{ print $3}'):0.0

# Electron flags for WSL 2
export ELECTRON_EXTRA_LAUNCH_ARGS="--disable-gpu --no-sandbox --disable-dev-shm-usage"
```

## Manual Setup (Without Helper Script)

If you prefer not to use the helper script:

1. Set environment variables (see above)
2. Build the Electron code:
   ```bash
   npm run build:electron
   ```
3. Run concurrently:
   ```bash
   concurrently "npm run dev" "wait-on http://localhost:5173 && electron . --disable-gpu --no-sandbox --disable-dev-shm-usage"
   ```

## Troubleshooting

### Check WSL version
```bash
wsl --version
# or
uname -r  # Should contain "microsoft-standard-WSL2"
```

### Update WSL
```powershell
# Run in PowerShell (Windows)
wsl --update
wsl --shutdown
# Then restart WSL
```

### Verify X server connection
```bash
# Install x11-apps if not present
sudo apt install x11-apps

# Test with a simple GUI app
xeyes
```

If `xeyes` works, Electron should work too!

## Production Builds

For creating production builds in WSL 2, the GUI issues don't apply since you're only packaging. Use:

```bash
npm run package:win   # For Windows
npm run package:linux # For Linux
```

## Additional Resources

- [WSLg Documentation](https://github.com/microsoft/wslg)
- [Electron on WSL 2](https://www.electronjs.org/docs/latest/tutorial/installation#platform-specific-prerequisites)
- [VcXsrv Setup Guide](https://sourceforge.net/p/vcxsrv/wiki/Using%20VcXsrv%20Windows%20X%20Server/)
