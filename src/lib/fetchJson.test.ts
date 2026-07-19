import assert from 'node:assert/strict';
import test from 'node:test';

import { readJsonResponse } from './fetchJson';

test('readJsonResponse falls back safely for HTML error pages', async () => {
  const response = new Response('<!DOCTYPE html><html><body>Server error</body></html>', {
    status: 500,
    headers: { 'content-type': 'text/html' },
  });

  const data = await readJsonResponse(response);

  assert.equal(data.error, 'Server error');
});
