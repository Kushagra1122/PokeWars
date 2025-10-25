import { useCallback, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { useAccount } from 'wagmi';
import { useBasename } from './useBasename';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export function useWalletLink() {
  const { token, refreshUser } = useContext(AuthContext);
  const { address } = useAccount();
  const { basename } = useBasename(address);

  const linkWallet = useCallback(
    async (walletAddress) => {
      if (!walletAddress) return;

      try {
        // Link wallet to existing user if authenticated
        const endpoint = token
          ? `${API_BASE}/api/auth/link-wallet`
          : `${API_BASE}/api/auth/create-wallet-user`;

        const payload = {
          address: walletAddress,
          basename: basename || null,
        };

        const config = token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          : { headers: { 'Content-Type': 'application/json' } };

        const res = await axios.post(endpoint, payload, config);

        console.log('✅ Wallet linked:', res.data);

        // Refresh user data if authenticated
        if (token && refreshUser) {
          await refreshUser();
        }

        return res.data;
      } catch (error) {
        console.error('❌ Error linking wallet:', error);
        // Don't throw - wallet linking is non-blocking
      }
    },
    [token, basename, refreshUser],
  );

  return { linkWallet, address, basename };
}
