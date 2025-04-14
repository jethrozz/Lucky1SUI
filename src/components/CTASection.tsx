import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { LotteryPool } from '@/dto/LotteryPool';

const CTASection: React.FC<{lotteryPool: LotteryPool|null}> = ({lotteryPool}) => {

  return (
    <section className="py-16 bg-gradient-to-br from-primary to-primary-light text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Try Your Luck?</h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of players who are enjoying risk-free lottery on the Sui blockchain. 
          Your principal is always safe while you have a chance to win big!
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button
            className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-8"
          >
            <Link href={`/current-lottery?lotteryPool=${lotteryPool}`}>
              Buy Tickets Now
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="bg-transparent hover:bg-transparent-light text-white-500 font-semibold py-3 px-8 border border-gray-100 hover:border-black-500"
          >
            <Link href="/how-it-works">
              Learn More
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
