import { useState, useEffect, useCallback } from 'react';
import type { WalletInfo } from '@shared/schema';

// Define the window interface with Sui wallet provider
declare global {
  interface Window {
    suiWallet?: {
      isConnected: () => Promise<boolean>;
      getAccounts: () => Promise<string[]>;
      requestPermissions: () => Promise<boolean>;
      disconnect: () => Promise<void>;
    };
    ethos?: {
      isConnected: () => Promise<boolean>;
      getAccounts: () => Promise<string[]>;
      requestPermissions: () => Promise<boolean>;
      disconnect: () => Promise<void>;
    };
  }
}

interface UseWalletResult {
  walletInfo: WalletInfo;
  connectWallet: (provider: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useWallet = (): UseWalletResult => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    address: '',
    isConnected: false
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      // Check if any wallet is available and connected
      if (window.suiWallet && await window.suiWallet.isConnected()) {
        const accounts = await window.suiWallet.getAccounts();
        if (accounts.length > 0) {
          setWalletInfo({
            address: accounts[0],
            isConnected: true
          });
        }
      } else if (window.ethos && await window.ethos.isConnected()) {
        const accounts = await window.ethos.getAccounts();
        if (accounts.length > 0) {
          setWalletInfo({
            address: accounts[0],
            isConnected: true
          });
        }
      }
    };

    checkConnection();
  }, []);

  const connectWallet = useCallback(async (provider: string) => {
    try {
      if (provider === 'sui' && window.suiWallet) {
        const permitted = await window.suiWallet.requestPermissions();
        if (permitted) {
          const accounts = await window.suiWallet.getAccounts();
          if (accounts.length > 0) {
            setWalletInfo({
              address: accounts[0],
              isConnected: true
            });
          }
        }
      } else if (provider === 'ethos' && window.ethos) {
        const permitted = await window.ethos.requestPermissions();
        if (permitted) {
          const accounts = await window.ethos.getAccounts();
          if (accounts.length > 0) {
            setWalletInfo({
              address: accounts[0],
              isConnected: true
            });
          }
        }
      } else {
        console.error('Wallet provider not available');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsModalOpen(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      if (window.suiWallet && await window.suiWallet.isConnected()) {
        await window.suiWallet.disconnect();
      } else if (window.ethos && await window.ethos.isConnected()) {
        await window.ethos.disconnect();
      }

      setWalletInfo({
        address: '',
        isConnected: false
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    walletInfo,
    connectWallet,
    disconnectWallet,
    isModalOpen,
    openModal,
    closeModal
  };
};

// Helper function to format wallet address
export const formatWalletAddress = (address: string): string => {
  if (!address) return '';
  
  if (address.length > 10) {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  }
  
  return address;
};

// Simulated transaction function (for testing only)
export const simulateTransaction = async (
  walletAddress: string,
  amount: number,
  roundId: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
  // This is a mock function for demonstration
  return new Promise((resolve) => {
    setTimeout(() => {
      if (walletAddress && amount > 0 && roundId > 0) {
        resolve({
          success: true,
          transactionHash: `0x${Math.random().toString(16).substring(2, 10)}...`
        });
      } else {
        resolve({
          success: false,
          error: 'Invalid transaction parameters'
        });
      }
    }, 1000);
  });
};
