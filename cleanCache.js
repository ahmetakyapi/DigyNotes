const { clearNonLocalhostCache, syncData } = require('./utils/cacheUtils');

const main = async () => {
  console.log('Starting cache cleanup...');
  await clearNonLocalhostCache();
  console.log('Starting sync...');
  await syncData();
  console.log('Operations completed successfully');
};

main().catch(console.error);
