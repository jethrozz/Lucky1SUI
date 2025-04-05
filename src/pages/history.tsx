import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';

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

const History: React.FC = () => {
  const { data: winners, isLoading } = useQuery<Winner[]>({
    queryKey: ['/api/winners?limit=50'],
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
    <>
      <div className="bg-gradient-to-br from-primary to-primary-light text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Lottery History</h1>
          <p className="text-lg max-w-2xl">
            View all past winners, prizes, and lottery results. Our blockchain-verified drawings ensure complete transparency.
          </p>
        </div>
      </div>
      
      <div className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold text-primary mb-6">Previous Winners</h2>
            
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
          </Card>
          
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-primary mb-6">Lottery Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-neutral-lightest p-6 rounded-lg border border-neutral-light">
                <h3 className="text-lg font-bold text-primary mb-2">Total Value Locked</h3>
                <p className="text-3xl font-bold text-secondary">3,892,415 SUI</p>
                <p className="text-sm text-neutral-medium">Current deposits across all users</p>
              </div>
              
              <div className="bg-neutral-lightest p-6 rounded-lg border border-neutral-light">
                <h3 className="text-lg font-bold text-primary mb-2">Total Prizes Awarded</h3>
                <p className="text-3xl font-bold text-secondary">459,723 SUI</p>
                <p className="text-sm text-neutral-medium">Since platform launch</p>
              </div>
              
              <div className="bg-neutral-lightest p-6 rounded-lg border border-neutral-light">
                <h3 className="text-lg font-bold text-primary mb-2">Total Participants</h3>
                <p className="text-3xl font-bold text-secondary">24,391</p>
                <p className="text-sm text-neutral-medium">Unique wallets</p>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-primary mb-4">Prize Growth Over Time</h3>
            <div className="h-64 bg-neutral-lightest rounded-lg border border-neutral-light flex items-center justify-center">
              <p className="text-neutral-medium">Chart visualization will be available in the next update</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default History;
