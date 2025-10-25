import React, { useEffect, useRef } from 'react';
import { useAccount, useChainId, useSwitchChain, useConnect, useDisconnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { base, baseSepolia } from 'wagmi/chains';
import { useWalletLink } from '../../hooks/useWalletLink';
import { Wallet, Copy, LogOut } from 'lucide-react';

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { linkWallet } = useWalletLink();
  const hasLinkedRef = useRef(false);
  const [copied, setCopied] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);

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

  // Connect to MetaMask
  const handleConnectMetaMask = () => {
    connect({ connector: metaMask() });
  };

  // Disconnect wallet
  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };

  // Copy address to clipboard
  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format address
  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex items-center gap-3">
      {!isConnected ? (
        // Connect Button
        <button
          onClick={handleConnectMetaMask}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg"
        >
          <Wallet className="w-5 h-5" />
          <span>Connect MetaMask</span>
        </button>
      ) : (
        // Connected Wallet Dropdown
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg"
          >
            <Wallet className="w-5 h-5" />
            <span>{formatAddress(address)}</span>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-xl shadow-2xl z-50">
              {/* Address Section */}
              <div className="p-4 border-b border-white/10">
                <p className="text-xs text-gray-400 mb-2">Connected Address</p>
                <div className="flex items-center justify-between gap-2 bg-white/5 rounded-lg p-2">
                  <code className="text-sm text-yellow-400 font-mono">{address}</code>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 hover:bg-white/10 rounded transition"
                    title="Copy address"
                  >
                    <Copy className="w-4 h-4 text-white" />
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-400 mt-2">✓ Copied to clipboard</p>
                )}
              </div>

              {/* Network Section */}
              <div className="p-4 border-b border-white/10">
                <p className="text-xs text-gray-400 mb-2">Network</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => switchChain?.({ chainId: base.id })}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${
                      chainId === base.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-yellow-200 hover:bg-white/20'
                    }`}
                  >
                    Base
                  </button>
                  <button
                    onClick={() => switchChain?.({ chainId: baseSepolia.id })}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${
                      chainId === baseSepolia.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-yellow-200 hover:bg-white/20'
                    }`}
                  >
                    Sepolia
                  </button>
                </div>
              </div>

              {/* Disconnect Button */}
              <button
                onClick={handleDisconnect}
                className="w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-b-xl transition flex items-center justify-center gap-2 font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
