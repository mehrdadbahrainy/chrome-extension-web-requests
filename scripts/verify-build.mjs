import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist/chrome-extension';
const required = ['index.html', 'manifest.json', 'background.js', 'request-utils.js', 'assets/icons/icon16.png', 'assets/icons/icon128.png'];
for (const file of required) {
  assert.ok(existsSync(join(dir, file)), 'Missing extension build output: ' + file);
}
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, 'Reqlyst — Web Request Inspector');
assert.equal(manifest.version, '2.1.1');
assert.equal(manifest.background.service_worker, 'background.js');
assert.equal(manifest.action.default_popup, 'index.html');
assert.ok(!manifest.permissions.includes('declarativeNetRequest'), 'Unneeded DNR permission is present');
assert.ok(!manifest.web_accessible_resources, 'Unnecessary web accessible resources are present');
for (const size of [16, 32, 48, 128]) {
  const png = readFileSync(join(dir, `assets/icons/icon${size}.png`));
  assert.equal(png.toString('ascii', 1, 4), 'PNG');
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
}
console.log('Reqlyst extension bundle and icons validated.');
