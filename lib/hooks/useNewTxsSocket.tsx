import type { NextRouter } from 'next/router';
import { useRouter } from 'next/router';
import React from 'react';

import { ROUTES } from 'lib/link/routes';
import useSocketChannel from 'lib/socket/useSocketChannel';
import useSocketMessage from 'lib/socket/useSocketMessage';

function getSocketParams(router: NextRouter) {

  if (
    router.pathname === ROUTES.txs.pattern &&
    (router.query.tab === 'validated' || router.query.tab === undefined) &&
    !router.query.block_number
  ) {
    return { topic: 'transactions:new_transaction' as const, event: 'transaction' as const };
  }

  if (router.pathname === ROUTES.network_index.pattern) {
    return { topic: 'transactions:new_transaction' as const, event: 'transaction' as const };
  }

  if (router.pathname === ROUTES.txs.pattern && router.query.tab === 'pending' && !router.query.block_number) {
    return { topic: 'transactions:new_pending_transaction' as const, event: 'pending_transaction' as const };
  }

  return {};
}

function assertIsNewTxResponse(response: unknown): response is { transaction: number } {
  return typeof response === 'object' && response !== null && 'transaction' in response;
}
function assertIsNewPendingTxResponse(response: unknown): response is { pending_transaction: number } {
  return typeof response === 'object' && response !== null && 'pending_transaction' in response;
}

export default function useNewTxsSocket() {
  const router = useRouter();
  const [ num, setNum ] = React.useState(0);
  const [ socketAlert, setSocketAlert ] = React.useState('');

  const { topic, event } = getSocketParams(router);

  const handleNewTxMessage = React.useCallback((response: { transaction: number } | { pending_transaction: number } | unknown) => {
    if (assertIsNewTxResponse(response)) {
      setNum((prev) => prev + response.transaction);
    }
    if (assertIsNewPendingTxResponse(response)) {
      setNum((prev) => prev + response.pending_transaction);
    }
  }, []);

  const handleSocketClose = React.useCallback(() => {
    setSocketAlert('Connection is lost. Please click here to load new transactions.');
  }, []);

  const handleSocketError = React.useCallback(() => {
    setSocketAlert('An error has occurred while fetching new transactions. Please click here to refresh the page.');
  }, []);

  const channel = useSocketChannel({
    topic,
    onSocketClose: handleSocketClose,
    onSocketError: handleSocketError,
    isDisabled: !topic,
  });

  useSocketMessage({
    channel,
    event,
    handler: handleNewTxMessage,
  });

  if (!topic && !event) {
    return {};
  }

  return { num, socketAlert };
}