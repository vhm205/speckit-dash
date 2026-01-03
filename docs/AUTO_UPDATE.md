# Auto-Update Configuration Guide

This document explains how auto-updates are configured in Speckit Dashboard
using **electron-updater** and **GitHub Releases**.

## Overview

Speckit Dashboard is configured to automatically check for updates from GitHub
Releases. When a new version is available, users are notified and can choose to
download and install the update.

## Configuration Files

### 1. `electron-builder.yml`

The main configuration file for electron-builder includes the publish
configuration:

```yaml
# Auto-update configuration
publish:
  provider: github
  owner: your-github-username # ⚠️ UPDATE THIS
  repo: speckit-dash # ⚠️ UPDATE THIS
  private: false
```

**Action Required:** Update `owner` and `repo` with your GitHub username and
repository name.

### 2. `electron/main.ts`

The main process includes auto-updater setup with comprehensive event handlers:

- **Update Checking**: Automatically checks for updates on app startup
  **Periodic Checks**: Rechecks every 6 hours
- **Event Notifications**: Sends update status to the renderer process
- **Auto-Download**: Configured to ask before downloading (can be changed)
- **Auto-Install**: Configured to install on app quit

### 3. `electron/preload.ts`

Exposes secure IPC communication for update events:

- `update-available`: Fired when a new update is found
- `update-downloaded`: Fired when update download completes
- `download-progress`: Progress updates during download
- `download-update`: Trigger update download
- `install-update`: Trigger app restart and update installation

### 4. `src/components/AutoUpdater/index.tsx`

React component that displays update notifications to users with three states:

1. **Update Available**: Shows version info with download button
2. **Downloading**: Shows progress bar
3. **Ready to Install**: Prompts user to restart

## Publishing Updates

### Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **GitHub Token**: Required for publishing releases
3. **Code Signing**: Recommended for production (optional for testing)

### Publishing Process

1. **Update Version** in `package.json`:
   ```bash
   npm version patch  # or minor, or major
   ```

2. **Build and Publish**:
   ```bash
   npm run build
   npm run publish  # Requires GH_TOKEN environment variable
   ```

3. **Set GitHub Token** (one-time setup):
   ```bash
   export GH_TOKEN="your-github-token"
   ```

   Or add to your `.env` file:
   ```
   GH_TOKEN=your-github-token
   ```

4. **Create GitHub Release**: The publish command will automatically:
   - Build your app for all configured platforms
   - Create a GitHub release with the version tag
   - Upload build artifacts
   - Publish latest.yml/latest-mac.yml for auto-update

### Manual GitHub Release (Alternative)

If you prefer manual control:

1. Build the app:
   ```bash
   npm run build
   ```

2. Go to GitHub → Releases → Create new release
3. Upload the build files from `release/` directory
4. **Important**: Also upload the `latest.yml` (Windows) and `latest-mac.yml`
   (macOS) files

## Testing Auto-Updates

### Local Testing

1. **Build a Test Version**:
   ```bash
   npm version patch
   npm run build
   ```

2. **Create a GitHub Release** with this version

3. **Downgrade Your Local Version** in `package.json`

4. **Build and Run**:
   ```bash
   npm run electron:build
   ```

5. The app should detect the newer version on GitHub and offer to update

### Production Testing Checklist

- [ ] Auto-update works on macOS
- [ ] Auto-update works on Windows
- [ ] Auto-update works on Linux
- [ ] Update notifications appear correctly
- [ ] Download progress is shown
- [ ] Installation prompt appears after download
- [ ] App restarts and updates successfully

## Customization

### Change Update Check Frequency

In `electron/main.ts`, modify the interval:

```typescript
// Check for updates every 6 hours (default)
setInterval(() => {
  autoUpdater.checkForUpdatesAndNotify();
}, 6 * 60 * 60 * 1000);

// Example: Check every hour
setInterval(() => {
  autoUpdater.checkForUpdatesAndNotify();
}, 60 * 60 * 1000);
```

### Enable Auto-Download

In `electron/main.ts`:

```typescript
autoUpdater.autoDownload = true; // Change from false to true
```

### Disable Notifications

To make updates silent (not recommended):

```typescript
// Remove or comment out the setupAutoUpdater() call
// if (!isDev) {
//   setupAutoUpdater();
// }
```

## Security Considerations

1. **Code Signing**: For production apps, code sign your builds:
   - macOS: Requires Apple Developer certificate
   - Windows: Requires code signing certificate

2. **Channel Whitelisting**: The preload script whitelists allowed IPC channels
   for security

3. **HTTPS Only**: Updates are only downloaded over HTTPS (enforced by
   electron-updater)

## Troubleshooting

### Update Check Fails

**Symptom**: Console shows "Failed to check for updates"

**Solutions**:

- Verify `owner` and `repo` in `electron-builder.yml` are correct
- Ensure GitHub repository is public (or token is configured for private repos)
- Check network connectivity

### No Update Available (But Should Be)

**Symptom**: App doesn't detect newer version on GitHub

**Solutions**:

- Verify `version` in `package.json` is lower than the published release
- Check that `latest.yml`/`latest-mac.yml` was uploaded to the release
- Clear the app cache and try again

### Update Downloads But Won't Install

**Symptom**: Download completes but installation fails

**Solutions**:

- Check app permissions (macOS may block unsigned apps)
- Verify the downloaded file isn't corrupted
- Try closing all instances of the app before installing

### Development Mode Shows Errors

**Symptom**: Update errors appear during development

**Solution**: This is normal. Auto-updates are disabled in development mode:

```typescript
if (!isDev) {
  setupAutoUpdater();
}
```

## Platform-Specific Notes

### macOS

- **DMG Updates**: Users download the new version and can replace the old app
- **Code Signing**: Highly recommended to avoid Gatekeeper warnings
- **Notarization**: Required for macOS 10.15+ distribution

### Windows

- **NSIS Installer**: Supports silent updates
- **Auto-Installation**: Can update in background if configured
- **Code Signing**: Recommended to avoid SmartScreen warnings

### Linux

- **AppImage**: Self-updating AppImages are supported
- **Manual Updates**: Some Linux users prefer package managers

## Resources

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [electron-builder Configuration](https://www.electron.build/configuration/configuration)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Code Signing Guide](https://www.electron.build/code-signing)

## Support

For issues or questions:

1. Check the
   [electron-updater issues](https://github.com/electron-userland/electron-builder/issues)
2. Review the console logs in the app (View → Toggle Developer Tools)
3. Create an issue in this repository with the logs
