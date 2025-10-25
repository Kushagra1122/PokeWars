import React from 'react';
import { useBasename } from '../../hooks/useBasename';

/**
 * Display component for showing Basename or shortened address
 * @param {string} address - Ethereum address
 * @param {string} fallbackName - Optional fallback name (like username)
 * @param {string} className - Optional CSS classes
 */
export function BasenameDisplay({ address, fallbackName, className = '' }) {
  const { basename, isLoading } = useBasename(address);

  if (isLoading) {
    return <span className={className}>Loading...</span>;
  }

  // Priority: Basename > fallbackName > shortened address
  if (basename) {
    return (
      <span className={className} title={address}>
        {basename}
      </span>
    );
  }

  if (fallbackName) {
    return <span className={className}>{fallbackName}</span>;
  }

  // Show shortened address
  if (address) {
    const shortened = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return (
      <span className={className} title={address}>
        {shortened}
      </span>
    );
  }

  return <span className={className}>Unknown</span>;
}

/**
 * CTA component for reserving a Basename
 */
export function ReserveBasenameCTA({ className = '' }) {
  return (
    <a
      href="https://www.base.org/names"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 underline ${className}`}
    >
      <span>🎯</span>
      Reserve your Basename
    </a>
  );
}
