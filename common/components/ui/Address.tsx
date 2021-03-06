import React from 'react';
import NewTabLink from './NewTabLink';
import { IWallet } from 'libs/wallet';
import { BlockExplorerConfig } from 'types/network';
import { getChecksumAddressFn } from 'selectors/config';
import { AppState } from 'reducers';
import { connect } from 'react-redux';

interface BaseProps {
  explorer?: BlockExplorerConfig | null;
  address?: string | null;
  wallet?: IWallet | null;
}

interface StateProps {
  toChecksumAddress: ReturnType<typeof getChecksumAddressFn>;
}

type Props = BaseProps & StateProps;

export class Address extends React.PureComponent<Props> {
  public render() {
    const { wallet, address, explorer, toChecksumAddress } = this.props;
    let renderAddress = '';
    if (address !== null && address !== undefined) {
      renderAddress = address;
    } else {
      renderAddress = wallet !== null && wallet !== undefined ? wallet.getAddressString() : '';
    }
    renderAddress = toChecksumAddress(renderAddress);

    if (explorer) {
      return <NewTabLink href={explorer.addressUrl(renderAddress)}>{renderAddress}</NewTabLink>;
    } else {
      return <React.Fragment>{renderAddress}</React.Fragment>;
    }
  }
}

export default connect((state: AppState) => ({
  toChecksumAddress: getChecksumAddressFn(state)
}))(Address);
