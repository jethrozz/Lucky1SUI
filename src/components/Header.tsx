import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import Logo from './ui/logo';
import { Button } from './ui/button';
import { formatWalletAddress } from '@/lib/suiWallet';
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const currentAccount = useCurrentAccount();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'History', path: '/history' },
    { name: 'FAQ', path: '/faq' }
  ];

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="h-14 w-14 relative">
              <Logo size={56} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Lucky1Sui</h1>
              <p className="text-xs text-secondary-light">No-loss lottery platform on Sui</p>
            </div>
          </div>
          
          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path}
                className={`text-white hover:text-secondary-light transition py-1 border-b-2 ${
                  location === link.path 
                    ? 'border-secondary' 
                    : 'border-transparent text-neutral-lightest'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          {/* Connect Wallet Button */}
          <ConnectButton />
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden text-white"
            onClick={toggleMobileMenu}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} bg-primary-light`}>
        <div className="container mx-auto px-4 py-3">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                href={link.path}
                className={`text-white hover:text-secondary-light transition py-1 border-l-4 pl-2 ${
                  location === link.path 
                    ? 'border-secondary' 
                    : 'border-transparent text-neutral-lightest'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
