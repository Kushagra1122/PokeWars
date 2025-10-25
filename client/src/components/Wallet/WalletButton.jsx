import React, { useEffect, useRef } from 'react';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownDisconnect,
  WalletDropdownLink,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { useWalletLink } from '../../hooks/useWalletLink';

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { linkWallet } = useWalletLink();
  const hasLinkedRef = useRef(false);

  // Restrict to Base and Base Sepolia only
  useEffect(() => {
    if (isConnected && chainId !== base.id && chainId !== baseSepolia.id) {
      // Auto-switch to Base Sepolia if on wrong network
      switchChain?.({ chainId: baseSepolia.id });
    }
  }, [isConnected, chainId, switchChain]);

  // Link wallet to backend when connected (once per address)
  useEffect(() => {
    if (isConnected && address && !hasLinkedRef.current) {
      hasLinkedRef.current = true;
      linkWallet(address);
    }
    
    // Reset when wallet disconnects
    if (!isConnected) {
      hasLinkedRef.current = false;
    }
  }, [isConnected, address]);

  return (
    <div className="flex items-center gap-3">
      <Wallet>
        <ConnectWallet className="!bg-yellow-400 !text-blue-900 !font-bold !rounded-xl hover:!bg-yellow-300 !transition !shadow-lg !px-4 !py-2">
          <Avatar className="h-6 w-6" />
          <Name className="!text-blue-900 !font-bold" />
        </ConnectWallet>
        <WalletDropdown>
          <Identity
            className="!bg-blue-950 !border !border-yellow-400 !rounded-xl"
            schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
          >
            <Avatar />
            <Name className="!text-yellow-400" />
            <Address className="!text-yellow-200" />
            <EthBalance className="!text-yellow-200" />
          </Identity>
          <WalletDropdownBasename className="!bg-blue-950 hover:!bg-blue-900 !text-yellow-400" />
          <WalletDropdownLink
            icon="wallet"
            href="https://wallet.coinbase.com"
            className="!bg-blue-950 hover:!bg-blue-900 !text-yellow-400"
          >
            Wallet
          </WalletDropdownLink>
          <WalletDropdownDisconnect className="!bg-blue-950 hover:!bg-red-900 !text-red-400" />
        </WalletDropdown>
      </Wallet>

      {/* Chain switcher */}
      {isConnected && (
        <div className="flex gap-2">
          <button
            onClick={() => switchChain?.({ chainId: base.id })}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              chainId === base.id
                ? 'bg-blue-500 text-white'
                : 'bg-yellow-400/20 text-yellow-200 hover:bg-yellow-400/30'
            }`}
            title="Switch to Base Mainnet"
          >
            Base
          </button>
          <button
            onClick={() => switchChain?.({ chainId: baseSepolia.id })}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              chainId === baseSepolia.id
                ? 'bg-blue-500 text-white'
                : 'bg-yellow-400/20 text-yellow-200 hover:bg-yellow-400/30'
            }`}
            title="Switch to Base Sepolia Testnet"
          >
            Sepolia
          </button>
        </div>
      )}
    </div>
  );
}
