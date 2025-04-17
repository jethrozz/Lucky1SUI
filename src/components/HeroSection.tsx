import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { LotteryPool} from '@/dto/LotteryPool';

const HeroSection: React.FC<{lotteryPool: LotteryPool|null}> = ({lotteryPool}) => {
  return (
    <section className="bg-gradient-to-br from-primary to-primary-light text-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Web3 Lossless Lottery on Sui Blockchain
            </h1>
            <p className="text-lg mb-6 text-neutral-lightest">
              Play with confidence - your principal stays intact while you have a chance to win big from the yield!
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Button
                
                className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 text-lg shadow-md"
              >
                <Link href={`/current-lottery?lotteryPool=${lotteryPool}`}>
                    Buy Tickets
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="bg-transparent hover:bg-primary-light text-white font-semibold py-3 px-6 border border-white"
              >
                <Link href="/how-it-works">
                  Learn How It Works
                </Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="relative ticket-container mx-auto max-w-sm">
              <div className="ticket bg-white text-primary p-6 rounded-xl shadow-lg transform rotate-3 transition-transform hover:rotate-0 hover:-translate-y-1 duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-neutral-medium">SUI BLOCKCHAIN</p>
                    <h3 className="text-xl font-bold">LUCKY1SUI TICKET</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-medium">DRAW DATE</p>
                    <p className="text-sm font-medium">
                      {new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="bg-neutral-lightest p-4 rounded-lg mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-neutral-medium">TICKET NUMBER</span>
                    <span className="text-xs text-neutral-medium">TOTAL AMOUNT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-lg font-bold">#42731</span>
                    <span className="font-bold text-lg text-accent-dark">{lotteryPool?.total_amount_pool} SUI</span>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-neutral-medium">ENTRY AMOUNT</p>
                    <p className="text-lg font-bold">1 SUI</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs bg-primary text-white px-3 py-1.5 rounded font-bold shadow-sm">LOSSLESS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
