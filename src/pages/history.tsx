import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useNetworkVariable } from '@/networkConfig';
import {getHistoryWinners} from '@/lib/LotteryPoolUtils';
import {WinnerTicket} from '@/dto/LotteryPool';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

const History: React.FC = () => {
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

    const rewardsDetail = (winnerTicket:WinnerTicket) => {
      console.log("rewardsDetail", winnerTicket);
      setSelectedReward(winnerTicket);
      setRewardDialogOpen(true);
    }
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
            <h2 className="text-2xl font-bold text-primary mb-6">Lottery Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-neutral-lightest p-6 rounded-lg border border-neutral-light">
                <h3 className="text-lg font-bold text-primary mb-2">Total Value Locked</h3>
                <p className="text-3xl font-bold text-my-color">3,892,415 SUI</p>
                <p className="text-sm text-neutral-medium">Current deposits across all users</p>
              </div>
              
              <div className="bg-neutral-lightest p-6 rounded-lg border border-neutral-light">
                <h3 className="text-lg font-bold text-primary mb-2">Total Prizes Awarded</h3>
                <p className="text-3xl font-bold text-my-color">459,723 SUI</p>
                <p className="text-sm text-neutral-medium">Since platform launch</p>
              </div>
              
              <div className="bg-neutral-lightest p-6 rounded-lg border border-neutral-light">
                <h3 className="text-lg font-bold text-primary mb-2">Total Participants</h3>
                <p className="text-3xl font-bold text-my-color">24,391</p>
                <p className="text-sm text-neutral-medium">Unique wallets</p>
              </div>
            </div>
          
          </Card>
          <Card className="p-6 mb-4">
            <h2 className="text-2xl font-bold text-primary mb-6">Previous Winners</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-light">
                <thead>
                  <tr className="bg-primary text-white text-left">
                    <th className="py-3 px-4 font-semibold">Round</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Winning Ticket ID</th>
                    <th className="py-3 px-4 font-semibold">Winning Ticket No</th>
                    <th className="py-3 px-4 font-semibold">Rewards</th>

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
                          <span className='text-primary hover:text-primary-dark cursor-pointer text-sm flex items-center' onClick={() => rewardsDetail(winner)}>details</span>
                       </td>
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
          </Card>
        </div>

        <Dialog open={isRewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>奖励详情</DialogTitle>
          </DialogHeader>
          {/* 在这里添加您的NFT展示内容 */}
          <table className="min-w-full bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-light">
                <thead>
                  <tr className="bg-primary text-white text-left">
                    <th className="py-3 px-4 font-semibold">Coin Type</th>
                    <th className="py-3 px-4 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedReward!=null && selectedReward.rewards_map.size > 0) ? (
                    Array.from(selectedReward.rewards_map.entries()).map(([type, value]) => (
                      <tr key={type} className="border-b border-neutral-light hover:bg-neutral-lightest transition-colors">
                        <td className="py-3 px-4 font-medium">{type.substring(type.lastIndexOf(":")+1)}</td>
                        <td className="py-3 px-4 font-medium">{value / 1_000_000_000}</td>
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
          <DialogClose asChild>
          </DialogClose>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
};

export default History;
