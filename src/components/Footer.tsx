import React from 'react';
import { Link } from 'wouter';
import Logo from './ui/logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-dark text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Info */}
          <div className="md:col-span-1">
            <Link href="/">
              <div className="flex items-center space-x-1">
                <Logo />
                <div>
                  <h3 className="text-xl font-bold text-my-color mt-1">Lucky1Sui</h3>
                  <p className="text-xs text-my-color">Lossless Lottery</p>
                </div>
              </div>
            </Link>

            <p className="mt-4 text-sm text-gray-500">
              The first lossless lottery platform on the Sui blockchain. Participate in draws while keeping your principal safe.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-my-color">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-my-color hover:text-secondary-light transition">Home</Link></li>
              <li><Link href="/how-it-works" className="text-my-color hover:text-secondary-light transition">How It Works</Link></li>
              <li><Link href="/history" className="text-my-color hover:text-secondary-light transition">Winners</Link></li>
              <li><Link href="/faq" className="text-my-color hover:text-secondary-light transition">FAQ</Link></li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold text-my-color mb-4">Resources</h3>
            <ul className="space-y-2">
              {/* 
              <li><a href="#" className="text-my-color hover:text-secondary-light transition">Support</a></li>
              <li><a href="#" className="text-my-color hover:text-secondary-light transition">Documentation</a></li>              
              <li><a href="#" className="text-my-color hover:text-secondary-light transition">Audit Reports</a></li> */}
              <li><a href="https://github.com/jethrozz/Lucky1SUI" target='blank' className="text-my-color hover:text-secondary-light transition">GitHub Repository</a></li>
              <li><a href="https://docs.sui.io/guides" target='blank' className="text-my-color hover:text-secondary-light transition">Sui Developer Docs</a></li>
            </ul>
          </div>
          
          {/* Community */}
          <div>
            <h3 className="text-lg font-semibold text-my-color mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://x.com/Lucky1Sui" target='blank' className="text-my-color hover:text-my-color transition flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://github.com/jethrozz/Lucky1SUI" target='blank' className="text-my-color hover:text-my-color transition flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 pt-8 border-t border-primary-light text-center">
          <p className="text-sm text-my-color">&copy; {new Date().getFullYear()} Lucky1Sui. All rights reserved. Built on Sui Blockchain.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
