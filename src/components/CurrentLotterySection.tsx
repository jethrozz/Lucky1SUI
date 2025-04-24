import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentAccount, useSignAndExecuteTransaction,  useSuiClient } from "@mysten/dapp-kit";
import { LotteryPool, Lottery } from '@/dto/LotteryPool';
import { getUsetTickets } from '@/lib/LotteryPoolUtils';
import { LotteryTicket } from '@/dto/LotteryTicket';
import { useNetworkVariable } from '@/networkConfig';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Flex, Text } from "@radix-ui/themes";

const CurrentLotterySection: React.FC<{lotteryPool: LotteryPool|null, lottery: Lottery|null, ticketPoolId: string}> = ({lotteryPool, lottery, ticketPoolId} ) => {
  const [entryAmount, setEntryAmount] = useState<number>(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  const [userTickets, setUserTickets] = useState<Array<LotteryTicket>>([]);
  const { toast } = useToast();
  const graphqlUrl = useNetworkVariable("graphqlUrl");
  const randomId = useNetworkVariable("randomId");
  const packageId = useNetworkVariable("packageId");
  const clockId = useNetworkVariable("clockId");
  const incentiveV3Id = useNetworkVariable("incentiveV3Id");
  const incentiveV2Id = useNetworkVariable("incentiveV2Id");
  const poolSuiId = useNetworkVariable("poolSuiId");
  const storageId = useNetworkVariable("storageId");
  const oracleId = useNetworkVariable("priceOracleId");
  const chain = useNetworkVariable("chain");
  const suiCoinType = useNetworkVariable("suiCoinType");


  useEffect(() => {
    if (!lotteryPool) return;
    setIsLoading(false);
    getUsetTickets(account?.address as string, graphqlUrl).then(tickets => {
      setUserTickets(tickets);
    });
  }, [lotteryPool, account]);
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

  const canWithdraw = () => {
    if(!lotteryPool) return false;
    if(!account) return false;
    return userTickets.filter(item => item.is_in_pool).length > 0;
  }
  const calculateTickets = () => {
    return userTickets.filter(item => item.is_in_pool).length;
  };

  const calculateWinProbability = () => {
    if (!lotteryPool) return '0%';
    
    const totalTicketNumbers = lottery?.ticket_number_count || 0;
    let myTickets = 0;
    for(let i = 0; i < userTickets.length; i++){
      if(userTickets[i].is_in_pool){
        myTickets += userTickets[i].ticket_number_set.length;
      }
    }
    
    if (myTickets === 0 || totalTicketNumbers === 0) return '0%';
    
    const probability = (myTickets / totalTicketNumbers) * 100;
    return probability < 0.01 ? '< 0.01%' : `${probability.toFixed(2)}%`;
  };

  const handleBuyTickets = async () => {
    if (!lotteryPool) return;
    if (!account) {
      //弹窗提示请先连接钱包
      toast({
        title: "Please connect your wallet first",
        description: "Wallet not connected",
        variant: "destructive",
      });
      return;
    }
    if(!lottery){
      toast({
        title: "Lottery not found",
        description: "Lottery not found",
        variant: "destructive",
      });
      return;
    }
    if(entryAmount >10 || entryAmount < 1){
      toast({
        title: "Invalid entry amount",
        description: "Entry amount must be between 1 and 10",
        variant: "destructive",
      });
      return;
    }
    //不能有小数
    if(entryAmount % 1 !== 0){
      toast({
        title: "Invalid entry amount",
        description: "Entry amount must be an integer",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    const { address } = account;
    try{
      
      //判断余额是否足够
      const balance = await suiClient.getBalance({owner: address, coinType: suiCoinType});
      
      const amount = entryAmount * 1_000_000_000;
      if(parseInt(balance.totalBalance) < amount){
        toast({
          title: "Insufficient balance",
          description: "Insufficient balance",
          variant: "destructive",
        });
        return;
      }

      //创建交易
      const tx = new Transaction();
      let lotteryPoolId = lotteryPool.id;
      //调用lottery合约的joinLotteryPool方法
      const [suiCoin] = tx.splitCoins(tx.gas, [amount]); // 分割 SUI 代币
      
      tx.moveCall({
        target: `${packageId}::lottery::joinLotteryPool`,
        arguments: [tx.object(lottery.id),tx.object(lotteryPoolId), tx.object(ticketPoolId), suiCoin, tx.object(storageId), tx.object(incentiveV3Id), tx.object(incentiveV2Id), tx.object(poolSuiId), tx.object(clockId), tx.object(randomId)],
        typeArguments: [balance.coinType],
      });
      signAndExecuteTransaction(
        { transaction: tx, chain: chain },
        {
            onSuccess: (result) => {
                // 成功时打印结果
                // 设置交易摘要
                toast({
                  title: "Transaction successful",
                  description: "Transaction successful, digest: " + result.digest,
                  variant: "default",
                });
            },
            onError: (error) => {
                console.error("Transaction failed:", error);
                toast({
                  title: "Transaction failed",
                  description: "Transaction failed, error: " + error.message,
                  variant: "destructive",
                });
            },
        },
    );
    } catch (error) {
      console.error("Error buying tickets", error);
    }finally{
      setIsPurchasing(false);
    }
  }

  const handleWithdraw = async () => {
    if (!lotteryPool) return;
    if (!account) {
      toast({
        title: "Please connect your wallet first",
        description: "Wallet not connected", 
        variant: "destructive",
      });
      return;
    }
    setIsDialogOpen(true);
  }

  const doWithdraw = (selectedTicket: string) => {
    if (!lotteryPool) return;
    if(!lottery){
      toast({
        title: "Lottery not found",
        description: "Lottery not found",
        variant: "destructive",
      });
      return;
    }
    if (!account) {
      toast({
        title: "Please connect your wallet first",
        description: "Wallet not connected",
        variant: "destructive",
      });
      return;
    }
    //创建交易
    try{
      const tx = new Transaction();
      let lotteryPoolId = lotteryPool.id;
      //调用lottery合约的claimReward方法
      /**
       * lottery_pool: &mut LotteryPool, 
        ticket: &mut Ticket,
        storage: &mut Storage,
        pool: &mut Pool<CoinType>,
        incentive_v2: &mut IncentiveV2,
        incentive_v3: &mut Incentive,
        clock: &Clock,
        oracle: &PriceOracle,
       */
      tx.moveCall({
        target: `${packageId}::lottery::exitLotteryPool`,
        arguments: [tx.object(lottery.id),tx.object(lotteryPoolId), 
          tx.object(selectedTicket), tx.object(storageId), tx.object(poolSuiId), tx.object(incentiveV2Id), tx.object(incentiveV3Id), tx.object(clockId), tx.object(oracleId)],
        typeArguments: [suiCoinType],
      });
      signAndExecuteTransaction(
        { transaction: tx, chain: chain },
        {
            onSuccess: (result) => {
                // 成功时打印结果
                toast({
                  title: "Exit lottery successful",
                  description: "Exit lottery successful, digest: " + result.digest,
                  variant: "default",
                });
            },
            onError: (error) => {
                console.error("Transaction failed:", error);
                toast({
                  title: "Exit lottery failed",
                  description: "Exit lottery failed, error: " + error.message,
                  variant: "destructive",
                });
            },
        },
      );
    }catch(error){
      console.error("Error withdrawing tickets", error);
    }finally{
      setIsWithdrawing(false);
    }

  }


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
              {isLoading ? 'Loading...' : `Round #${lotteryPool?.no} Details`}
            </h3>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">Total Amount:</span>
                <span className="font-bold text-primary">
                  {isLoading ? '...' : `${Number(lotteryPool?.total_amount_pool).toLocaleString()} SUI`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">Total Address:</span>
                <span className="font-bold text-primary">
                  {isLoading ? '...' : `${lottery?.active_user_count || 0}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">Total Ticket Numbers:</span>
                <span className="font-bold text-primary">
                  {isLoading ? '...' : `${lottery?.ticket_number_count || 0}`}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">Your Ticket Numbers:</span>
                <span className="font-bold text-primary">
                  {calculateTickets()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">Win Chance:</span>
                <span className="font-bold text-primary">
                  {calculateWinProbability()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-dark">Entry Deadline:</span>
                <span className="font-bold text-primary">
                  {isLoading ? '...' : 
                    lotteryPool?.end_date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) + ' UTC'
                  }
                </span>
              </div>
              <div className="mb-6">
                  {(
                    <Button
                      onClick={handleWithdraw}
                      disabled={!canWithdraw() || isWithdrawing}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 text-lg shadow-md"
                    >
                      {isWithdrawing ? 'Processing...' : 'Exit Lottery'}
                    </Button>
                  )}
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
                    <span className="font-bold">1</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="block text-neutral-dark text-sm font-medium">One ticket can contain 10 numbers, 1 number = 1 SUI</label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {(
                    <Button
                      onClick={handleBuyTickets}
                      disabled={isPurchasing || entryAmount < 1 || entryAmount > 10}
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
                    <span>Each 1 SUI equals one lottery ticket entry.</span>
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>请选择您要退出的Ticket</DialogTitle>
            <DialogDescription>这里是您拥有的Ticket列表...</DialogDescription>
          </DialogHeader>
          {/* 在这里添加您的NFT展示内容 */}
          <Flex direction="column" gap="3">
            {userTickets.filter(item => item.is_in_pool).map((ticket) => (
                <Flex 
                    key={ticket.id}
                    align="center" 
                    style={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedNft === ticket.id ? 'var(--accent-3)' : 'transparent',
                        padding: '8px',
                        borderRadius: '4px'
                    }}
                    onClick={() => setSelectedNft(ticket.id || null)}
                >
                    <input
                        type="radio"
                        checked={selectedNft === ticket.id}
                        onChange={() => {}}
                        style={{ marginRight: '8px' }}
                    />
                    <img
                        src={ticket.image_url}
                        alt="NFT"
                        className="w-16 h-16 object-cover border-1 border-gray-300 shadow-lg"
                    />
                    {ticket.ticket_number_set && ticket.ticket_number_set.length > 0 ? (
                        <Text className="ml-2">{(ticket.ticket_number_set as any)[0]}</Text>
                    ) : (
                        <Text className="ml-2">No ticket number available</Text>
                    )}
                </Flex>
            ))}
            

        </Flex>
          <DialogClose asChild>
          <Button 
                onClick={() => {
                    if (selectedNft) {
                        // 这里可以处理选中的NFT值
                        doWithdraw(selectedNft);
                    }
                }}
                disabled={!selectedNft}
            >
                确认选择
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CurrentLotterySection;
