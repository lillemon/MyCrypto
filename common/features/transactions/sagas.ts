import { SagaIterator } from 'redux-saga';
import { put, select, apply, call, take, takeEvery } from 'redux-saga/effects';
import EthTx from 'ethereumjs-tx';
import { toChecksumAddress } from 'ethereumjs-util';

import { INode } from 'libs/nodes';
import { hexEncodeData } from 'libs/nodes/rpc/utils';
import { getTransactionFields } from 'libs/transaction';
import { NetworkConfig } from 'types/network';
import { TransactionData, TransactionReceipt, SavedTransaction } from 'types/transactions';
import { AppState } from 'features/reducers';
import * as configNodesSelectors from 'features/config/nodes/selectors';
import * as configSelectors from 'features/config/selectors';
import * as walletSelectors from 'features/wallet/selectors';
import * as transactionBroadcastTypes from 'features/transaction/broadcast/types';
import * as transactionsTypes from './types';
import * as transactionsActions from './actions';

export function* fetchTxData(action: transactionsTypes.FetchTransactionDataAction): SagaIterator {
  const txhash = action.payload;
  let data: TransactionData | null = null;
  let receipt: TransactionReceipt | null = null;
  let error: string | null = null;

  const node: INode = yield select(configNodesSelectors.getNodeLib);

  // Fetch data and receipt separately, not in parallel. Receipt should only be
  // fetched if the tx is mined, and throws if it's not, but that's not really
  // an "error", since we'd still want to show the unmined tx data.
  try {
    data = yield apply(node, node.getTransactionByHash, [txhash]);
  } catch (err) {
    console.warn('Failed to fetch transaction data', err);
    error = err.message;
  }

  if (data && data.blockHash) {
    try {
      receipt = yield apply(node, node.getTransactionReceipt, [txhash]);
    } catch (err) {
      console.warn('Failed to fetch transaction receipt', err);
      receipt = null;
    }
  }

  yield put(transactionsActions.setTransactionData({ txhash, data, receipt, error }));
}

export function* saveBroadcastedTx(
  action: transactionBroadcastTypes.BroadcastTransactionQueuedAction
) {
  const { serializedTransaction: txBuffer, indexingHash: txIdx } = action.payload;

  const res:
    | transactionBroadcastTypes.BroadcastTransactionSucceededAction
    | transactionBroadcastTypes.BroadcastTransactionFailedAction = yield take([
    transactionBroadcastTypes.TRANSACTION_BROADCAST.TRANSACTION_SUCCEEDED,
    transactionBroadcastTypes.TRANSACTION_BROADCAST.TRANSACTION_FAILED
  ]);

  // If our TX succeeded, save it and update the store.
  if (
    res.type === transactionBroadcastTypes.TRANSACTION_BROADCAST.TRANSACTION_SUCCEEDED &&
    res.payload.indexingHash === txIdx
  ) {
    const tx = new EthTx(txBuffer);
    const savableTx: SavedTransaction = yield call(
      getSaveableTransaction,
      tx,
      res.payload.broadcastedHash
    );
    yield put(transactionsActions.addRecentTransaction(savableTx));
  }
}

// Given a serialized transaction, return a transaction we could save in LS
export function* getSaveableTransaction(tx: EthTx, hash: string): SagaIterator {
  const fields = getTransactionFields(tx);
  let from: string = '';
  let chainId: number = 0;

  try {
    // Signed transactions have these fields
    from = hexEncodeData(tx.getSenderAddress());
    chainId = fields.chainId;
  } catch (err) {
    // Unsigned transactions (e.g. web3) don't, so grab them from current state
    const wallet: AppState['wallet']['inst'] = yield select(walletSelectors.getWalletInst);
    const network: NetworkConfig = yield select(configSelectors.getNetworkConfig);

    chainId = network.chainId;
    if (wallet) {
      from = wallet.getAddressString();
    }
  }

  const savableTx: SavedTransaction = {
    hash,
    from,
    chainId,
    to: toChecksumAddress(fields.to),
    value: fields.value,
    time: Date.now()
  };
  return savableTx;
}

export function* resetTxData() {
  yield put(transactionsActions.resetTransactionData());
}

export function* transactionsSaga(): SagaIterator {
  yield takeEvery(transactionsTypes.TransactionsActions.FETCH_TRANSACTION_DATA, fetchTxData);
  yield takeEvery(
    transactionBroadcastTypes.TRANSACTION_BROADCAST.TRANSACTION_SUCCEEDED,
    saveBroadcastedTx
  );
  yield takeEvery(transactionsTypes.TransactionsActions.RESET_TRANSACTION_DATA, resetTxData);
}