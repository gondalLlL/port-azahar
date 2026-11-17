import { spawn } from 'child_process';
import { chromium } from '/opt/hatch/skills/spaces/ts-runtime/dist/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

async function main() {
  const shotsRaw = fs.readFileSync('shots.json', 'utf8');
  const shots = JSON.parse(shotsRaw);
  fs.mkdirSync('screenshots', { recursive: true });

  console.log('Starting static server...');
  const server = spawn('node', ['serve.ts', '--port', '8124'], { stdio: 'ignore' });
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const browser = await chromium.launch({
    executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 }
  });

  let globalErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
      globalErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
    globalErrors.push(err.message);
  });
  page.on('requestfailed', req => {
    console.log('REQUEST FAILED:', req.url(), req.failure().errorText);
  });

  console.log('Testing plain game load...');
  await page.goto('http://127.0.0.1:8124/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  const summary = [];

  for (const shot of shots) {
    const url = `http://127.0.0.1:8124/index.html${shot.query}`;
    console.log(`Processing shot: ${shot.name} (${url})...`);
    let shotErrors = [];
    const errListener = msg => { if (msg.type() === 'error') shotErrors.push(msg.text()); };
    const pageErrListener = err => { shotErrors.push(err.message); };
    page.on('console', errListener);
    page.on('pageerror', pageErrListener);

    let ready = false;
    try {
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__shotReady === true, { timeout: 15000 });
      ready = true;
    } catch (e) {
      console.log(`Warning/Timeout for ${shot.name}: ${e.message}`);
    }

    await page.waitForTimeout(500);

    const outPath = path.join('screenshots', shot.name);
    await page.screenshot({ path: outPath, type: 'jpeg', quality: 80 });
    let stats = fs.statSync(outPath);
    if (stats.size > 262144) {
      await page.screenshot({ path: outPath, type: 'jpeg', quality: 60 });
      stats = fs.statSync(outPath);
    }

    page.off('console', errListener);
    page.off('pageerror', pageErrListener);

    summary.push({
      name: shot.name,
      ready,
      size: stats.size,
      errors: shotErrors
    });
  }

  await browser.close();
  server.kill();

  console.log('--- SUMMARY JSON ---');
  console.log(JSON.stringify({ summary, globalErrors }, null, 2));

  if (summary.some(s => !s.ready || s.errors.length > 0)) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
