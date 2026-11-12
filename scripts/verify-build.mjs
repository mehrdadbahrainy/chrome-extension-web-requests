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
assert.equal(manifest.background.service_worker, 'background.js');
assert.equal(manifest.action.default_popup, 'index.html');
assert.ok(!manifest.permissions.includes('declarativeNetRequest'), 'Unneeded DNR permission is present');
assert.ok(!manifest.web_accessible_resources, 'Unnecessary web accessible resources are present');
console.log('Extension bundle validated.');
