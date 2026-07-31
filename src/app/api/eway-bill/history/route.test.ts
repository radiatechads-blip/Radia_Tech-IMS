import assert from 'node:assert/strict';
import test from 'node:test';

import { parseJsonValue } from './route';

test('parseJsonValue handles both JSON strings and already-parsed objects', () => {
  assert.deepEqual(parseJsonValue('{"documentNo":"INV-1001"}'), { documentNo: 'INV-1001' });
  assert.deepEqual(parseJsonValue({ documentNo: 'INV-1001' }), { documentNo: 'INV-1001' });
  assert.equal(parseJsonValue('plain-text'), 'plain-text');
});
