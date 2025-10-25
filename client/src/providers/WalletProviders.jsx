import React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { coinbaseWallet } from 'wagmi/connectors';

// Create wagmi config with Base and Base Sepolia
// Supported chains are Base (8453) and Base Sepolia (84532); default to Base Sepolia for development and testing.
// Note: wagmi autoConnect is enabled so wallet state persists across reloads.
const config = createConfig({
  autoConnect: true,
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'PokéWars',
      // Base Account (passkey smart wallet) is not included in this phase; consider it as an optional
      // enhancement in a later milestone.
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

// Create a React Query client
const queryClient = new QueryClient();

export function WalletProviders({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
          chain={baseSepolia} // Default to Base Sepolia for development and testing
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
