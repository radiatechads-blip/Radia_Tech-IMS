import assert from 'node:assert/strict';
import test from 'node:test';

import { mapPortalResponseToGenerateResponse } from './route';

test('maps portal success responses into the generate route payload shape', () => {
  const result = mapPortalResponseToGenerateResponse({
    success: true,
    message: 'E-Way Bill generated successfully.',
    result: {
      ewayBillNo: '141012159646',
      ewayBillDate: '31/07/2026 03:01:00 AM',
      validUpto: '13/08/2026 11:59:00 PM',
      alert: '',
    },
    data: {
      ewayBillNo: '141012159646',
      ewayBillDate: '31/07/2026 03:01:00 AM',
      validUpto: '13/08/2026 11:59:00 PM',
      alert: '',
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.ewayBillNo, '141012159646');
  assert.equal(result.ewayBillDate, undefined);
  assert.equal(result.validUpto, undefined);
  assert.equal(result.message, 'E-Way Bill generated successfully.');
});
