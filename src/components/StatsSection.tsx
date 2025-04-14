import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LotteryPool } from '@/dto/LotteryPool';
import { Button } from '@/components/ui/button';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useNetworkVariable } from '@/networkConfig';
import { toast } from '@/hooks/use-toast';
import { Transaction } from '@mysten/sui/transactions';
const StatsSection: React.FC<{lotteryPool: LotteryPool|null}> = ({lotteryPool}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const lotteryId = useNetworkVariable("lotteryId");
  const clockId = useNetworkVariable("clockId");
  const randomId = useNetworkVariable("randomId");
  const incentiveV3Id = useNetworkVariable("incentiveV3Id");
  const incentiveV2Id = useNetworkVariable("incentiveV2Id");
  const poolSuiId = useNetworkVariable("poolSuiId");
  const storageId = useNetworkVariable("storageId");
  const oracleId = useNetworkVariable("priceOracleId");
  const rewardCoinType = useNetworkVariable("rewardCoinType");
  const chain = useNetworkVariable("chain");
  const suiCoinType = useNetworkVariable("suiCoinType");
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 14,
    seconds: 8
  });
  const [showDraw, setshowDraw] = useState(false);
  useEffect(() => {
    if (!lotteryPool) return;
    setIsLoading(false);
    setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
    const endTime = parseInt(lotteryPool.hold_on_time.toString())+parseInt(lotteryPool.create_time.toString());
    setshowDraw(lotteryPool.status == 1 && endTime < new Date().getTime());
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [lotteryPool]);
  const handleDraw = () => {
    console.log('draw');
    if(!lotteryPool) return;
    if (!account) {
      toast({
        title: "Please connect your wallet first",
        description: "Wallet not connected",
        variant: "destructive",
      });
      return;
    }
    setIsDrawing(true);
    /**
     *         clock: &Clock,
        rand: &Random,
        lottery: &mut Lottery,
        lottery_pool: &mut LotteryPool,
        storage: &mut Storage,
        pool: &mut Pool<CoinType>,
        incentive_v2: &mut IncentiveV2,
        incentive_v3: &mut Incentive,
        oracle: &PriceOracle,
     */
        try{
          const tx = new Transaction();
          let lotteryPoolId = lotteryPool.id;
          tx.moveCall({
            target: `${packageId}::lottery::drawLottery`,
            arguments: [tx.object(clockId), tx.object(randomId), tx.object(lotteryId), tx.object(lotteryPoolId), tx.object(storageId), tx.object(poolSuiId), tx.object(incentiveV2Id), tx.object(incentiveV3Id), tx.object(oracleId)],
            typeArguments: [rewardCoinType,suiCoinType],
          });
          signAndExecuteTransaction(
            { transaction: tx, chain: chain },
            {
                onSuccess: (result) => {
                    // 成功时打印结果
                    toast({
                      title: "Draw lottery Done",
                      description: "Draw lottery Done, digest: " + result.digest,
                      variant: "default",
                    });
                },
                onError: (error) => {
                    console.error("Transaction failed:", error);
                    toast({
                      title: "Draw lottery failed",
                      description: "Draw lottery failed, error: " + error.message,
                      variant: "destructive",
                    });
                },
            },
          );
        }catch(error){
          console.error("Error draw lottery", error);
        }finally{
          setIsDrawing(false);
        }

  }
  const formatTime = (time: number): string => {
    return time < 10 ? `0${time}` : `${time}`;
  };

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="stats-item bg-neutral-lightest p-6 rounded-xl shadow-sm border border-neutral-light hover:transform hover:scale-103 transition-all duration-200">
            <div className="flex items-start">
              <div className="bg-primary/10 p-3 rounded-lg mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-neutral-medium text-sm mb-1">Current Prize Pool</p>
                <h3 className="text-2xl font-bold text-primary">
                  {isLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `${Number(lotteryPool?.total_amount_pool).toLocaleString()} SUI`
                  )}
                </h3>
                <p className="text-primary text-sm bg-primary/10 inline-block px-1 py-0.3 rounded">+12.5% since yesterday</p>
              </div>
            </div>
          </Card>
          
          <Card className="stats-item bg-neutral-lightest p-6 rounded-xl shadow-sm border border-neutral-light hover:transform hover:scale-103 transition-all duration-200">
            <div className="flex items-start">
              <div className="bg-primary/10 p-3 rounded-lg mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-neutral-medium text-sm mb-1">Active Players</p>
                <h3 className="text-2xl font-bold text-primary">
                  {isLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `${lotteryPool?.ticket_sets.size}`
                  )}
                </h3>
                <p className="text-primary text-sm bg-primary/10 inline-block px-1 py-0.3 rounded">+89 new today</p>
              </div>
            </div>
          </Card>
          
          <Card className="stats-item bg-neutral-lightest p-6 rounded-xl shadow-sm border border-neutral-light hover:transform hover:scale-103 transition-all duration-200">
            <div className="flex items-start">
              <div className="bg-primary/10 p-3 rounded-lg mr-2" style={{display: showDraw ? 'none' : 'block'}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={showDraw ? "w-full" : ""}>
                <p className="text-neutral-medium text-sm mb-1">{isLoading ? 'Next Draw' : showDraw ? 'It Is Time To Draw Lottery' : 'Next Draw'}</p>
                {isLoading ? (    <h3 className="text-2xl font-bold text-primary">
                  {`${formatTime(timeLeft.hours)}h ${formatTime(timeLeft.minutes)}m ${formatTime(timeLeft.seconds)}s`}
                </h3>): showDraw ? (
                                      <Button
                                      onClick={handleDraw}
                                      disabled={isDrawing}
                                      className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold mt-2 text-lg shadow-md"
                                    >
                                      Draw Lottery
                                    </Button>
                ):(
                  <h3 className="text-2xl font-bold text-primary">
                    {`${formatTime(timeLeft.hours)}h ${formatTime(timeLeft.minutes)}m ${formatTime(timeLeft.seconds)}s`}
                  </h3>
                )
                }
                <p className="text-primary text-sm bg-primary/10 inline-block px-1 py-0.3 rounded" style={{display: showDraw ? 'none' : 'block'}}>
                  {isLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    lotteryPool?.end_date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) + ' UTC'
                  )}
                </p>
              </div>

            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
