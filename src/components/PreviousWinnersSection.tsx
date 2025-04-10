import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

type Winner = {
  id: number;
  roundId: number;
  ticketId: number;
  walletAddress: string;
  prizeAmount: string;
  transactionHash: string;
  claimedDate: string;
  round: {
    roundNumber: number;
    endDate: string;
  };
  ticket: {
    ticketNumber: number;
  };
};

const PreviousWinnersSection: React.FC = () => {
  const { data: winners, isLoading } = useQuery<Winner[]>({
    queryKey: ['/api/winners'],
  });

  // Generate initials from wallet address
  const getInitials = (address: string): string => {
    if (!address || address.length < 2) return 'XX';
    return `${address.charAt(2).toUpperCase()}${address.charAt(3).toUpperCase()}`;
  };

  // Generate random background color based on wallet address
  const getColorClass = (address: string): string => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-accent'];
    const hash = address.split('').reduce((a, b) => {
      return a + b.charCodeAt(0);
    }, 0);
    return colors[hash % colors.length];
  };

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-primary mb-2">Previous Winners</h2>
          <p className="text-neutral-dark max-w-2xl mx-auto">
            Check out the lucky winners from previous rounds and see the prize distribution history.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-light">
            <thead>
              <tr className="bg-primary text-white text-left">
                <th className="py-3 px-4 font-semibold">Round</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Prize Pool</th>
                <th className="py-3 px-4 font-semibold">Winning Ticket</th>
                <th className="py-3 px-4 font-semibold">Winner</th>
                <th className="py-3 px-4 font-semibold">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <div className="animate-pulse text-neutral-medium">Loading winners...</div>
                  </td>
                </tr>
              ) : winners && winners.length > 0 ? (
                winners.map((winner) => (
                  <tr key={winner.id} className="border-b border-neutral-light hover:bg-neutral-lightest transition-colors">
                    <td className="py-3 px-4 font-medium">#{winner.round.roundNumber}</td>
                    <td className="py-3 px-4">
                      {new Date(winner.round.endDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium">{Number(winner.prizeAmount).toLocaleString()} SUI</td>
                    <td className="py-3 px-4">#{winner.ticket.ticketNumber}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className={`${getColorClass(winner.walletAddress)} rounded-full h-8 w-8 flex items-center justify-center text-white font-medium mr-2`}>
                          {getInitials(winner.walletAddress)}
                        </div>
                        <span className="font-mono text-sm">{winner.walletAddress}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <a href={`https://explorer.sui.io/txblock/${winner.transactionHash}`} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-secondary-dark text-sm flex items-center">
                        <span>View</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-neutral-medium">
                    No previous winners found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="text-center mt-8">
          <Button 
            className="bg-primary hover:bg-primary-light text-white font-medium py-2 px-6"
            asChild
          >
            <Link href="/history">
              <span>View All Winners</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PreviousWinnersSection;
