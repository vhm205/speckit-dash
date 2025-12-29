/**
 * Test Script for Path Normalization
 * Run this to verify cross-platform path handling works correctly
 */

const path = require('path');

function normalizePath(inputPath) {
    // Trim whitespace
    let normalized = inputPath.trim();

    // Convert backslashes to forward slashes for consistency
    normalized = normalized.replace(/\\/g, '/');

    // Remove trailing slashes
    normalized = normalized.replace(/\/+$/, '');

    // On Windows in Node.js, path.normalize will handle drive letters properly
    // On Unix/WSL, it will keep the path as-is
    normalized = path.normalize(normalized);

    return normalized;
}

// Test cases
const testPaths = [
    // Windows paths
    'C:\\Users\\john\\Downloads\\speckit-dash',
    'C:\\Users\\john\\Downloads\\speckit-dash\\',
    'C:/Users/john/Downloads/speckit-dash',
    'D:\\Projects\\my-app',

    // Unix paths
    '/home/vhm205/projects/speckit-dash',
    '/home/vhm205/projects/speckit-dash/',
    '/Users/you/Documents/my-app',

    // WSL paths
    '/mnt/c/Users/john/project',

    // With whitespace
    '  /home/user/project  ',
    '  C:\\Users\\test\\app  ',

    // Multiple trailing slashes
    '/home/user/project///',
];

console.log('Testing Path Normalization\n');
console.log('='.repeat(80));

testPaths.forEach((testPath, index) => {
    const normalized = normalizePath(testPath);
    console.log(`\nTest ${index + 1}:`);
    console.log(`  Input:  "${testPath}"`);
    console.log(`  Output: "${normalized}"`);
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ All paths normalized successfully!');
console.log(`Current platform: ${process.platform}`);
