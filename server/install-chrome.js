const { install, resolveBuildId, detectBrowserPlatform } = require('@puppeteer/browsers');
const path = require('path');
const { PUPPETEER_REVISIONS } = require('puppeteer-core/internal/revisions.js');

async function run() {
  try {
    const platform = detectBrowserPlatform();
    // Resolve version dynamically based on what puppeteer-core expects
    const expectedVersion = PUPPETEER_REVISIONS.chrome || '148.0.7778.167';
    const buildId = await resolveBuildId('chrome', platform, expectedVersion);
    const cacheDir = path.join(__dirname, '.cache', 'puppeteer');
    
    console.log(`Downloading Chrome build ${buildId} (expected: ${expectedVersion}) for platform ${platform} to ${cacheDir}...`);
    
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
