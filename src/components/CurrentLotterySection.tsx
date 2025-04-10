import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWallet, simulateTransaction } from '@/lib/suiWallet';
import { useToast } from '@/hooks/use-toast';

const CurrentLotterySection: React.FC = () => {
  const [entryAmount, setEntryAmount] = useState<number>(100);
  const { walletInfo, openModal } = useWallet();
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);

  let isLoading = false;
  let currentRound = {
    id: 1,
    roundNumber: 1,
    totalTickets: 1000,
    prizePool: 1000,
    yieldSource: 'Sui',
    apyRate: 10,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  };
//  const { data: ,  } = useQuery({
//    queryKey: ['/api/lottery/current'],
//  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setEntryAmount(value);
    }
  };

  const handleMax = () => {
    // In a real implementation, this would get the wallet balance
    setEntryAmount(10);
  };

  const calculateTickets = () => {
    return Math.floor(entryAmount / 1);
  };

  const calculateWinProbability = () => {
    if (!currentRound) return '0%';
    
    const totalTickets = currentRound.totalTickets;
    const myTickets = calculateTickets();
    
    if (myTickets === 0 || totalTickets === 0) return '0%';
    
    const probability = (myTickets / (totalTickets + myTickets)) * 100;
    return probability < 0.01 ? '< 0.01%' : `${probability.toFixed(2)}%`;
  };

  const handleBuyTickets = async () => {
    if (!walletInfo.isConnected) {
      openModal();
      return;
    }

    if (entryAmount < 10) {
      toast({
        title: "Invalid amount",
        description: "Minimum entry amount is 10 SUI",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPurchasing(true);
      
      // Simulate blockchain transaction
      const result = await simulateTransaction(
        walletInfo.address,
        entryAmount,
        currentRound?.id || 0
      );

      if (result.success) {
        // Create ticket in our database
        const ticketResponse = await fetch('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketNumber: Math.floor(Math.random() * 10000),
            roundId: currentRound?.id,
            walletAddress: walletInfo.address,
            entryAmount: entryAmount.toString(),
            purchaseDate: new Date(),
          }),
        });

        if (ticketResponse.ok) {
          toast({
            title: "Success!",
            description: `You've purchased ${calculateTickets()} ticket(s) for the current lottery round.`,
            variant: "default",
          });
        } else {
          throw new Error('Failed to create ticket');
        }
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Error buying tickets:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to buy tickets",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <section className="py-12 bg-neutral-lightest">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-primary mb-2">Current Lottery Round</h2>
          <p className="text-neutral-dark max-w-2xl mx-auto">
            See the details of the ongoing lottery round, check your odds, and buy tickets to participate in this draw.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lottery Info Card */}
          <Card className="bg-white rounded-xl shadow-md p-6 border border-neutral-light">
            <h3 className="text-xl font-bold text-primary mb-4">
              {isLoading ? 'Loading...' : `Round #${currentRound?.roundNumber} Details`}
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">Prize Pool:</span>
                <span className="font-bold text-primary">
                  {isLoading ? '...' : `${Number(currentRound?.prizePool).toLocaleString()} SUI`}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">Total Tickets:</span>
                <span className="font-bold text-primary">
                  {isLoading ? '...' : currentRound?.totalTickets.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">Your Tickets:</span>
                <span className="font-bold text-primary">
                  {walletInfo.isConnected ? calculateTickets() : 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">Win Chance:</span>
                <span className="font-bold text-primary">
                  {walletInfo.isConnected ? calculateWinProbability() : '0%'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">Yield Source:</span>
                <span className="font-bold text-primary">
                  {isLoading ? '...' : currentRound?.yieldSource}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">APY Rate:</span>
                <span className="font-bold text-primary">
                  {isLoading ? '...' : `${currentRound?.apyRate}%`}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">Entry Deadline:</span>
                <span className="font-bold text-primary">
                  {isLoading ? '...' : 
                    new Date(currentRound?.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) + ' UTC'
                  }
                </span>
              </div>
            </div>
          </Card>
          
          {/* Buy Tickets Card */}
          <Card className="bg-white rounded-xl shadow-md p-6 border border-neutral-light lg:col-span-2">
            <h3 className="text-xl font-bold text-primary mb-4">Buy Tickets</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ticket Purchase Form */}
              <div>
                <div className="mb-6">
                  <label className="block text-neutral-dark mb-2 text-sm font-medium">Your Entry Amount (SUI)</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="1"
                      value={entryAmount}
                      onChange={handleAmountChange}
                      className="w-full rounded-l-lg border border-neutral-light p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <Button
                      onClick={handleMax}
                      className="bg-primary text-white px-4 rounded-r-lg font-bold hover:bg-primary-dark shadow-sm"
                    >
                      MAX
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-medium mt-1">Minimum entry: 1 SUI</p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-neutral-dark mb-2 text-sm font-medium">Number of Tickets</label>
                  <div className="flex items-center justify-between bg-neutral-lightest rounded-lg p-3 border border-neutral-light">
                    <span>1 SUI = 1 chance to win</span>
                    <span className="font-bold">{calculateTickets()}</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="block text-neutral-dark text-sm font-medium">One ticket can contain 10 numbers, 1 number = 1 SUI</label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {!walletInfo.isConnected ? (
                    <Button
                      onClick={openModal}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 text-lg shadow-md"
                    >
                      Connect Wallet to Participate
                    </Button>
                  ) : (
                    <Button
                      onClick={handleBuyTickets}
                      disabled={isPurchasing || entryAmount < 10}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 text-lg shadow-md"
                    >
                      {isPurchasing ? 'Processing...' : 'Buy Tickets'}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Info Panel */}
              <div className="bg-neutral-lightest p-5 rounded-lg border border-neutral-light">
                <h4 className="font-bold text-primary mb-3">How Lossless Lottery Works</h4>
                
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Your principal amount stays intact and can be withdrawn at any time.</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Your SUI is deposited into DeFi protocols to generate yield.</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>The yield is collected and distributed as prizes to winners.</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Each 100 SUI equals one lottery ticket entry.</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Drawing occurs automatically on-chain for full transparency.</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CurrentLotterySection;
