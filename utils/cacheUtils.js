const fs = require('fs');
const path = require('path');

const clearNonLocalhostCache = () => {
  try {
    const cacheDir = path.join(process.cwd(), 'cache');
    if (!fs.existsSync(cacheDir)) return;

    const files = fs.readdirSync(cacheDir);
    files.forEach(file => {
      const filePath = path.join(cacheDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Skip if localhost related
      if (content.includes('localhost')) return;
      
      fs.unlinkSync(filePath);
    });

    console.log('Non-localhost cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

const syncData = () => {
  try {
    // Add your synchronization logic here
    console.log('Data synchronized successfully');
  } catch (error) {
    console.error('Error syncing data:', error);
  }
};

module.exports = {
  clearNonLocalhostCache,
  syncData
};
