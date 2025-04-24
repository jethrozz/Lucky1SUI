import React, { useEffect, useState } from 'react';
import { useNetworkVariable } from '@/networkConfig';
import {getHistoryWinners, getUsetTickets, getAllLotteryPool} from '@/lib/LotteryPoolUtils';
import {WinnerTicket} from '@/dto/LotteryPool';
import { Card } from '@/components/ui/card';
import { LotteryPool } from '@/dto/LotteryPool';
import { Button } from '@/components/ui/button';
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Select } from "@radix-ui/themes";
import { useToast } from '@/hooks/use-toast';
import { Transaction } from "@mysten/sui/transactions";



const ClaimRewards: React.FC = () => {
    const graphqlUrl = useNetworkVariable("graphqlUrl");
    const [isProcessing, setIsProcessing] = useState(false);
    const [winnerTickets, setwinnerTickets] = useState<Array<WinnerTicket>>([]);
    const [selectedLotteryPoolId, setSelectedLotteryPoolId] = useState("");
    const [selectedWinnerTicket, setSelectedWinnerTicket] = useState<WinnerTicket | null>(null);
    const account = useCurrentAccount();
    const { toast } = useToast();

    const [claimStatus, setClaimStatus] = useState(0); //0没有中奖，1已中奖未领取，2已中奖已领取
    const [userWinTicketId, setUserWinTicketId] = useState<String|null>(null);
    const [allLotteryPoolMap, setAllLotteryPoolMap] = useState<Map<string, LotteryPool>>(new Map());//
    const [tip, setTip] = useState("");

    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const packageId = useNetworkVariable("packageId");
    const clockId = useNetworkVariable("clockId");
    const incentiveV3Id = useNetworkVariable("incentiveV3Id");
    const storageId = useNetworkVariable("storageId");
    const rewardCoinType = useNetworkVariable("rewardCoinType");
    const rewardFundId = useNetworkVariable("rewardFundId");
    const chain = useNetworkVariable("chain");

    useEffect(() => {
        getHistoryWinners(graphqlUrl).then(tickets => {
            setwinnerTickets(tickets);
        });

        getAllLotteryPool(graphqlUrl).then(all => {
            setAllLotteryPoolMap(all);
        })
      }, []);


    useEffect(() => {
        if(account && selectedLotteryPoolId){
          let lotteryPool = allLotteryPoolMap.get(selectedLotteryPoolId);
          if(lotteryPool){
            let winTicketId = lotteryPool?.winner_ticket_id;
            setUserWinTicketId(lotteryPool?.winner_ticket_id);
            getUsetTickets(account?.address as string, graphqlUrl).then(tickets => {
              tickets.forEach((item) => {
                  //lotteryPool.status //1 进行中，2已开奖未领奖 3，已领奖
                  if(lotteryPool?.status === 2 && item.id === winTicketId){
                    setClaimStatus(1);
                  }else if(lotteryPool?.status === 3 && item.id === winTicketId){
                    setClaimStatus(2);
                  }
              })
            });
          }
            winnerTickets.forEach(selectedWinnerTicket => {
                if(selectedWinnerTicket.lottery_pool_id === selectedLotteryPoolId){
                    setSelectedWinnerTicket(selectedWinnerTicket);
                }
            });
        }        
    }, [account, selectedLotteryPoolId]);

    useEffect(() => {
        if(claimStatus === 1){
            setTip("Congratulations! Your lottery "+userWinTicketId+" ticket has won, you can claim now!");
        }else if(claimStatus === 2){
            setTip("It seems that you have already claimed your prize.");
        }else {
            setTip("It seems that you haven't won a prize!")
        }
    },[claimStatus])

    const selectd = (lotteryPoolId: string) =>{
        setSelectedLotteryPoolId(lotteryPoolId);
    }

    const  claimRewards = async () => {
        if (!account) {
            //弹窗提示请先连接钱包
            toast({
              title: "Please connect your wallet first",
              description: "Wallet not connected",
              variant: "destructive",
            });
            return;
        }
        if(!selectedWinnerTicket){
            toast({
                title: "Please select a Round",
                description: "Not select a Round",
                variant: "destructive",
              });
              return;
        }
        setIsProcessing(true);

        let lotteryPoolId = selectedWinnerTicket.lottery_pool_id;
        let winnerTicketId = selectedWinnerTicket.ticket_id;
        
        let allLotteryPool = await getAllLotteryPool(graphqlUrl);
        let goNext = false;
        allLotteryPool.forEach(lotteryPool => {
            if(lotteryPool.id === lotteryPoolId && lotteryPool.status === 2){
                goNext = true;
            }
        })
        if(!goNext){
            toast({
                title: "Current Lottery Reward Has Been Claimed",
                description: "",
                variant: "destructive",
              });
              return;
        }
        /**
         *         clock: &Clock,
        incentive: &mut Incentive,
        storage: &mut Storage,
        ticket: &Ticket,
        reward_fund: &mut RewardFund<RewardCoinType>,
        lottery_pool: &mut LotteryPool,
         */
        try{
            //判断余额是否足够
            //创建交易
            const tx = new Transaction();
            tx.moveCall({
              target: `${packageId}::lottery::claim_reward`,
              arguments: [tx.object(clockId), tx.object(incentiveV3Id), tx.object(storageId), tx.object(winnerTicketId), tx.object(rewardFundId), tx.object(lotteryPoolId)],
              typeArguments: [rewardCoinType],
            });
            signAndExecuteTransaction(
              { transaction: tx, chain: chain },
              {
                  onSuccess: (result) => {
                      // 成功时打印结果
                      // 设置交易摘要
                      toast({
                        title: "Claim rewards successful",
                        description: "Claim rewards successful, digest: " + result.digest,
                        variant: "default",
                      });
                  },
                  onError: (error) => {
                      console.error("Claim rewards failed:", error);
                      toast({
                        title: "TranClaim rewardssaction failed",
                        description: "Claim rewards failed, error: " + error.message,
                        variant: "destructive",
                      });
                  },
              },
          );
          } catch (error) {
            console.error("Error claim rewards", error);
          }finally{
            setIsProcessing(false);
          }
    }

  return (
    <>
      <div className="bg-gradient-to-br from-primary to-primary-light text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Claim Rewards</h1>
          <p className="text-lg max-w-2xl">
          If the lottery ticket you have wins, you can claim your prize here!
          </p>
        </div>
      </div>
      
      <div className="py-12 bg-white">
        <div className="container mx-auto px-4">
        <Card className="bg-white rounded-xl shadow-md p-6 border border-neutral-light lg:col-span-2">
            <h3 className="text-xl font-bold text-primary mb-4">Select a Round</h3>
            
            <div className="grid">
              {/* Ticket Purchase Form */}
              <div>
                <div className="mb-6">
                  <div className="flex space-x-2">
                  <Select.Root onValueChange={selectd} size="3">
                  <Select.Trigger radius="large" placeholder="Select a Round" />
                                      <Select.Content>
                        <Select.Group>
                            <Select.Label>Select a Round</Select.Label>
                            {winnerTickets.map((winner) => (
                                <Select.Item key={winner.lottery_pool_id} value={winner.lottery_pool_id} > 第{winner.lottery_pool_no}期</Select.Item>
                    ))}                        </Select.Group>
                    </Select.Content>
                  </Select.Root>
                  </div>
                </div>
            
                
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="block text-neutral-dark text-sm font-medium">
                        {tip}
                    </label>
                  </div>
                </div>
                

                
                <div className="space-y-3">
                  {(
                    <Button
                      onClick={claimRewards}
                      disabled={claimStatus != 1 || isProcessing}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 text-lg shadow-md"
                    >
                      {isProcessing ? 'Processing...' : 'Claim Rewards'}
                    </Button>
                  )}
                </div>
              </div>
            
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ClaimRewards;
