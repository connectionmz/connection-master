// scripts/remove-console.js
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src');

function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove console.log, console.info, console.debug
    content = content.replace(
      /console\.(log|info|debug)\(.*\);?/g, 
      '// Removed console.$1 for production'
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(directory) {
  const items = fs.readdirSync(directory);
  
  items.forEach(item => {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(item)) {
      removeConsoleLogs(fullPath);
    }
  });
}

console.log('🚀 Removing console logs from source files...');
processDirectory(srcPath);
console.log('✅ Console logs removal completed!');