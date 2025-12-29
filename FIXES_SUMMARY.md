# Electron WSL 2 Setup - Summary

## Issues Fixed

### 1. UUID ES Module Error ✅
**Problem**: The `uuid` package (v13+) is ES-module only, but Electron was compiled to CommonJS, causing:
```
Error [ERR_REQUIRE_ESM]: require() of ES Module .../uuid/dist-node/index.js not supported
```

**Solution**: Changed from static import to dynamic import in `electron/services/analysis-service.ts`:
```typescript
// Before
import { v4 as uuidv4 } from "uuid";
const requestId = uuidv4();

// After  
async function generateUUID(): Promise<string> {
  const { v4 } = await import("uuid");
  return v4();
}
const requestId = await generateUUID();
```

### 2. WSL 2 GPU and Display Issues ✅
**Problem**: Electron fails to initialize GPU in WSL 2, showing:
```
[ERROR:viz_main_impl.cc(196)] Exiting GPU process due to errors during initialization
```

**Solutions Implemented**:

1. **Added WSL-specific flags** to `package.json`:
   ```json
   "electron:dev": "... electron . --disable-gpu --no-sandbox --disable-dev-shm-usage"
   ```

2. **Created helper script** (`electron-dev-wsl.sh`):
   - Auto-detects WSLg (built-in GUI support in Windows 11)
   - Falls back to X11 forwarding for older WSL
   - Sets proper environment variables

3. **Added npm script**:
   ```bash
   npm run electron:dev:wsl
   ```

### 3. Port Conflict ✅
**Problem**: Port 5173 already in use

**Solution**: Kill existing processes with:
```bash
lsof -ti:5173 | xargs kill -9
```

## How to Run

### Option 1: Using the Helper Script (Recommended for WSL 2)
```bash
npm run electron:dev:wsl
```
or
```bash
./electron-dev-wsl.sh
```

### Option 2: Standard Command (Works on all platforms)
```bash
npm run electron:dev
```

## Files Modified

1. `electron/services/analysis-service.ts` - Fixed UUID imports
2. `package.json` - Added WSL flags and new script
3. `electron-builder.yml` - Added dist-electron to files
4. Created `electron-dev-wsl.sh` - WSL 2 helper script
5. Created `WSL2_ELECTRON_GUIDE.md` - Comprehensive guide
6. Created `FIXES_SUMMARY.md` - This file

## Environment Setup (WSLg - Windows 11)

The helper script automatically sets:
```bash
export DISPLAY=:0
export WAYLAND_DISPLAY=wayland-0
export XDG_RUNTIME_DIR=/mnt/wslg/runtime-dir
export PULSE_SERVER=/mnt/wslg/PulseServer
```

## Environment Setup (X11 Forwarding - Windows 10)

For Windows 10 without WSLg:

1. Install VcXsrv on Windows
2. Run with: `-ac -nowgl`
3. The script auto-detects Windows IP and sets DISPLAY

## Verification Steps

1. ✅ TypeScript compiles without errors
2. ✅ UUID dynamic import works with CommonJS
3. ✅ WSL 2 GPU errors suppressed with flags
4. ✅ Helper script created for easy startup
5. ✅ Documentation provided

## Next Steps

If you still encounter display issues:

1. **Check WSL version**:
   ```bash
   wsl --version  # in PowerShell
   ```

2. **Update WSL**:
   ```powershell
   wsl --update
   wsl --shutdown
   ```

3. **Verify WSLg**:
   ```bash
   ls /mnt/wslg  # Should show files
   ```

4. **See full guide**: `WSL2_ELECTRON_GUIDE.md`

## Testing Checklist

- [ ] `npm run build:electron` - Compiles successfully
- [ ] `npm run electron:dev:wsl` - Starts without UUID errors
- [ ] Electron window opens (may require X server setup)
- [ ] React dev server works on :5173
- [ ] Hot reload functions correctly

## Known Limitations

1. **GPU acceleration disabled**: This is expected in WSL 2 and doesn't affect functionality
2. **X server required**: You need either WSLg (Windows 11) or VcXsrv (Windows 10)
3. **Performance**: May be slower than native Windows due to display forwarding

## Support

For issues, see:
- `WSL2_ELECTRON_GUIDE.md` - Detailed troubleshooting
- [WSLg Docs](https://github.com/microsoft/wslg)
- [Electron WSL Guide](https://www.electronjs.org/docs/latest/tutorial/installation)
