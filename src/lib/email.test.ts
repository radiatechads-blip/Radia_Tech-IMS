import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidResendApiKey } from './email.ts';

test('accepts a plausible Resend API key format', () => {
  assert.equal(isValidResendApiKey('re_R7yiny3Q_LaFnUuBJ4fD7fpoAGToANFz1'), true);
});

test('rejects empty or malformed Resend API keys', () => {
  assert.equal(isValidResendApiKey(''), false);
  assert.equal(isValidResendApiKey('sk_test_123'), false);
  assert.equal(isValidResendApiKey('   '), false);
});
