import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { useNetworkVariable } from '@/networkConfig';
import {getHistoryWinners} from '@/lib/LotteryPoolUtils';
import {WinnerTicket} from '@/dto/LotteryPool';


const PreviousWinnersSection: React.FC = () => {

  const graphqlUrl = useNetworkVariable("graphqlUrl");
  const [isLoading, setIsLoading] = useState(true);
  const [winnerTicket, setwinnerTicket] = useState<Array<WinnerTicket>>([]);
  const [isRewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<WinnerTicket| null>(null);
  useEffect(() => {
    getHistoryWinners(graphqlUrl).then(tickets => {
      setwinnerTicket(tickets);
      setIsLoading(false);
    });
  }, []);

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
                    <th className="py-3 px-4 font-semibold">Winning Ticket ID</th>
                    <th className="py-3 px-4 font-semibold">Winning Ticket No</th>

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
                  ) : winnerTicket && winnerTicket.length > 0 ? (
                    winnerTicket.map((winner) => (
                      <tr key={winner.digest} className="border-b border-neutral-light hover:bg-neutral-lightest transition-colors">
                        <td className="py-3 px-4 font-medium">#{winner.lottery_pool_no}</td>
                        <td className="py-3 px-4">
                          {winner.timestamp}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className={`${getColorClass(winner.ticket_id)} rounded-full h-8 w-8 flex items-center justify-center text-white font-medium mr-2`}>
                              {getInitials(winner.ticket_id)}
                            </div>
                            <span className="font-mono text-sm">{winner.ticket_id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{winner.ticket_no}</td>
                        <td className="py-3 px-4">
                          <a href={`https://testnet.suivision.xyz/txblock/${winner.digest}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark text-sm flex items-center">
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
