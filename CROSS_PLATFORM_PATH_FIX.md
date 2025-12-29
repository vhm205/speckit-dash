# Cross-Platform Path Support Fix

## Problem
The "Path does not exist" error occurred when users entered project paths because the validation function didn't handle cross-platform paths correctly. Specifically:

- **Windows paths** use backslashes: `C:\Users\username\Downloads\speckit-dash`
- **Unix/macOS paths** use forward slashes: `/home/vhm205/project/speckit-dash`
- **WSL paths** can be in either format depending on where the project is located

## Solution

### 1. Added Path Normalization Function

Created `normalizePath()` function in `electron/services/ipc-handlers.ts`:

```typescript
function normalizePath(inputPath: string): string {
  // Trim whitespace
  let normalized = inputPath.trim();

  // Convert backslashes to forward slashes for consistency
  normalized = normalized.replace(/\\/g, '/');

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  // Use Node.js path.normalize for platform-specific handling
  normalized = path.normalize(normalized);

  return normalized;
}
```

**Key features:**
- Trims whitespace from input
- Converts all backslashes to forward slashes
- Removes trailing slashes for consistency
- Uses Node.js `path.normalize()` for final platform-specific normalization

### 2. Enhanced Path Validation

Updated `validateProjectPath()` function with:
- **Directory check**: Verifies the path is a directory, not a file
- **Better error messages**: Shows the normalized path in error messages
- **Cross-platform compatibility**: Uses normalized paths for all checks

```typescript
function validateProjectPath(
  rootPath: string,
): { valid: boolean; error?: string } {
  const normalizedPath = normalizePath(rootPath);

  // Check existence
  if (!fs.existsSync(normalizedPath)) {
    return { 
      valid: false, 
      error: `Path does not exist: ${normalizedPath}\nPlease check the path and try again.` 
    };
  }

  // Check it's a directory
  const stats = fs.statSync(normalizedPath);
  if (!stats.isDirectory()) {
    return {
      valid: false,
      error: "Path must be a directory, not a file",
    };
  }

  // Check for required folders...
}
```

### 3. Updated Project Configuration Handler

Modified `project:configure` IPC handler to:
- Normalize the path immediately upon receipt
- Use normalized path consistently throughout
- Store normalized path in the database

### 4. Improved UI Feedback

Updated `ProjectConfigModal.tsx` to:
- Show examples for both Windows and Unix paths
- Add help text explaining cross-platform support
- Display multi-line error messages (using `whitespace-pre-line`)

## Example Paths That Now Work

### Windows Paths
```
C:\Users\username\Downloads\speckit-dash
C:\Projects\my-app
D:\Work\speckit-project
```

### Unix/WSL/macOS Paths
```
/home/vhm205/projects/speckit-dash
/Users/you/Documents/projects/my-app
/mnt/c/Users/username/Downloads/speckit-dash
```

### Variations
```
C:/Users/username/project  (forward slashes on Windows)
/home/user/project/         (with trailing slash)
  /home/user/project        (with leading whitespace)
```

All of these are normalized to a consistent format before validation.

## Technical Details

### Path Normalization Process

1. **Input**: `C:\Users\john\Downloads\speckit-dash\`
2. **After trim**: `C:\Users\john\Downloads\speckit-dash\`
3. **After backslash conversion**: `C:/Users/john/Downloads/speckit-dash/`
4. **After trailing slash removal**: `C:/Users/john/Downloads/speckit-dash`
5. **After path.normalize()**: `C:/Users/john/Downloads/speckit-dash` (or platform-specific)

### Node.js Path Behavior

- On **Windows**: `path.normalize('C:/Users/test')` → `C:\Users\test`
- On **Unix**: `path.normalize('/home/test')` → `/home/test`
- On **WSL**: Handles both Windows (`/mnt/c/...`) and Unix paths

### Files Modified

1. `electron/services/ipc-handlers.ts`:
   - Added `normalizePath()` function
   - Enhanced `validateProjectPath()` function
   - Updated `project:configure` handler

2. `src/components/ProjectConfigModal.tsx`:
   - Updated placeholder text
   - Added help text for cross-platform paths
   - Improved error message display

## Testing

### Test Cases

✅ **Windows absolute path**: `C:\Users\test\project`
✅ **Windows with forward slashes**: `C:/Users/test/project`
✅ **Unix absolute path**: `/home/user/project`
✅ **WSL Windows mount**: `/mnt/c/Users/test/project`
✅ **With trailing slashes**: `/home/user/project/`
✅ **With leading/trailing whitespace**: `  /home/user/project  `

### Validation Checks

1. ✅ Path exists on filesystem
2. ✅ Path is a directory (not a file)
3. ✅ Contains `.specify/` folder
4. ✅ Contains `specs/` folder

## Benefits

1. **Cross-platform compatibility**: Works on Windows, macOS, Linux, and WSL
2. **User-friendly**: Accepts paths in various formats
3. **Better error messages**: Shows exactly what path was checked
4. **Robust validation**: Checks for directory existence and required structure
5. **Consistent storage**: All paths normalized before saving to database

## Migration Notes

- Existing projects in the database will continue to work
- No database migration needed
- New projects will be stored with normalized paths
- Path lookups will use normalized versions for comparison
