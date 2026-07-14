const TX_HASH_RE = /^0x[0-9a-f]{64}$/;

export function paymentVerificationRequest(payment, requestedHash) {
  if (payment.status === 'confirmed') return { alreadyConfirmed: true };
  if (payment.status !== 'submitted' && payment.status !== 'failed') {
    return { error: 'not_submitted' };
  }

  const attachedHash = payment.tx_hash?.toLowerCase() ?? null;
  const txHash = String(requestedHash ?? attachedHash ?? '').toLowerCase();
  if (!TX_HASH_RE.test(txHash)) return { error: 'invalid_hash' };
  if (attachedHash && attachedHash !== txHash) return { error: 'different_hash' };
  if (payment.status === 'failed' && !attachedHash) return { error: 'not_recoverable' };

  return {
    attachHash: !attachedHash,
    recovering: payment.status === 'failed',
    txHash,
  };
}
