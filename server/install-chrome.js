const { install, resolveBuildId, detectBrowserPlatform } = require('@puppeteer/browsers');
const path = require('path');

async function run() {
  try {
    const platform = detectBrowserPlatform();
    const buildId = await resolveBuildId('chrome', platform, '130.0.6723.116');
    const cacheDir = path.join(__dirname, '.cache', 'puppeteer');
    
    console.log(`Downloading Chrome build ${buildId} for platform ${platform} to ${cacheDir}...`);
    
    await install({
      browser: 'chrome',
      buildId: buildId,
      cacheDir: cacheDir,
      platform: platform
    });
    
    console.log('Chrome downloaded successfully!');
  } catch (err) {
    console.error('Failed to install Chrome:', err);
    process.exit(1);
  }
}

run();
