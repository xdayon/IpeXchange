import { useEffect, useRef, useState } from 'react';
import {
  cancelPreparedPayment,
  createPayment,
  preparePayment,
  verifyPayment,
} from '../../api/payments.js';
import {
  isQuoteExpired,
  pollPaymentVerification,
  QUOTE_SEND_BUFFER_MS,
  txParams,
} from './paymentFlow.js';

const VERIFY_ERROR_MESSAGE = 'We could not verify this transaction yet. Retry verification with the same transaction.';

function sendErrorMessage(error) {
  if (error?.code === 4001 || /reject|denied/i.test(error?.message ?? '')) {
    return 'You rejected the transaction in your wallet.';
  }
  if (/insufficient/i.test(error?.message ?? '')) {
    return 'Insufficient balance for this amount plus gas.';
  }
  return 'The transaction could not be sent. Try again.';
}

const wasDefinitelyNotSent = (error) => (
  error?.code === 4001 || /reject|denied|insufficient/i.test(error?.message ?? '')
);

export function useOnChainPayment({ intentId, isAuthenticated, login, wallet, initialToken = 'usdc' }) {
  const [phase, setPhase] = useState('idle');
  const [token, setToken] = useState(initialToken);
  const [quote, setQuote] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const alive = useRef(true);
  const sending = useRef(false);
  const submittedHash = useRef(null);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const fail = (message, nextPhase = 'error') => {
    if (!alive.current) return;
    setError(message);
    setPhase(nextPhase);
  };

  const requestQuote = async (nextToken = token) => {
    if (!isAuthenticated) return login?.();
    if (submittedHash.current) {
      return fail('Verify your submitted transaction before starting another payment.', 'verify-error');
    }
    setToken(nextToken);
    setPhase('quoting');
    setError(null);
    try {
      const nextQuote = await createPayment(intentId, nextToken);
      if (alive.current) {
        setQuote(nextQuote);
        setPhase('confirm');
      }
    } catch (requestError) {
      fail(requestError.message || 'Could not prepare the payment.');
    }
  };

  const verifyTransaction = async (paymentQuote = quote, hash = txHash) => {
    if (!paymentQuote || !hash) return;
    setError(null);
    setPhase('verifying');
    try {
      const payment = await pollPaymentVerification({
        paymentId: paymentQuote.id,
        txHash: hash,
        verify: verifyPayment,
        isAlive: () => alive.current,
      });
      if (!alive.current || payment.status === 'stopped') return;
      if (payment.status === 'confirmed') return setPhase('paid');
      if (payment.status === 'failed') {
        return fail('The submitted transaction could not confirm this payment.', 'failed');
      }
      fail(VERIFY_ERROR_MESSAGE, 'verify-error');
    } catch (verifyError) {
      fail(verifyError?.status === 409 ? verifyError.message : VERIFY_ERROR_MESSAGE,
        verifyError?.status === 409 ? 'failed' : 'verify-error');
    }
  };

  const sendAndVerify = async () => {
    if (submittedHash.current) return verifyTransaction(quote, submittedHash.current);
    if (sending.current) return;
    if (!wallet) return fail('No wallet available on this account.');
    if (isQuoteExpired(quote, Date.now(), QUOTE_SEND_BUFFER_MS)) {
      return fail('This quote expired or is too close to expiration. Request a new quote before paying.');
    }
    sending.current = true;
    setError(null);
    setPhase('sending');
    let hash;
    let prepared = false;
    try {
      await wallet.switchChain(quote.chain_id);
      const provider = await wallet.getEthereumProvider();
      if (isQuoteExpired(quote, Date.now(), QUOTE_SEND_BUFFER_MS)) {
        sending.current = false;
        return fail('This quote expired or is too close to expiration. Request a new quote before paying.');
      }
      await preparePayment(quote.id);
      prepared = true;
      hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [txParams(quote, wallet.address)],
      });
    } catch (sendError) {
      sending.current = false;
      if (prepared && wasDefinitelyNotSent(sendError)) {
        await cancelPreparedPayment(quote.id).catch(() => {});
      }
      if (prepared && !wasDefinitelyNotSent(sendError)) {
        return fail(
          'Your wallet did not return a transaction hash. Check its activity before trying another payment.',
        );
      }
      return fail(sendErrorMessage(sendError));
    }
    if (!alive.current) return;
    sending.current = false;
    submittedHash.current = hash;
    setTxHash(hash);
    await verifyTransaction(quote, hash);
  };

  return {
    error,
    phase,
    quote,
    requestQuote,
    retryVerification: () => verifyTransaction(quote, txHash),
    sendAndVerify,
    token,
    txHash,
  };
}
