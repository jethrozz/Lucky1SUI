import React, { useEffect, useState } from 'react';
import {useCurrentAccount, useSuiClient,useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/networkConfig";
import HeroSection from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import CurrentLotterySection from '@/components/CurrentLotterySection';
import PreviousWinnersSection from '@/components/PreviousWinnersSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import CTASection from '@/components/CTASection';
import { LotteryPool ,createLotteryPool } from '@/dto/LotteryPool';

const Home: React.FC = () => {
  const [lotteryPoolId, setLotteryPoolId] = useState<string>("-1");
  const [ticketPoolId, setTicketPoolId] = useState<string>("-1");
  const [lotteryPool, setLotteryPool] = useState<LotteryPool | null>(null);
  const lotteryId = useNetworkVariable("lotteryId");
  const { data, isPending, error } = useSuiClientQuery("getObject", {
    id: lotteryId,
    options: {
        showContent: true,
        showOwner: true,
    },
  });
  const { data: lotteryData, isPending: isLotteryPending, error: lotteryError } = useSuiClientQuery("getObject", {
    id: lotteryPoolId,
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  useEffect(() => {
    if (!isPending && data?.data?.content) {
      setLotteryPoolId((data.data.content as any).fields.lottery_pool_id as string);
      setTicketPoolId((data.data.content as any).fields.ticket_pool_id as string);
    }
  }, [isPending, data]);

  useEffect(() => {
    if (!isLotteryPending && lotteryData) {
      console.log(lotteryData);
      const lotteryPool = createLotteryPool(lotteryData.data?.content as any);
      setLotteryPool(lotteryPool);
    }
  }, [isLotteryPending, lotteryData]);

  return (
    <>
      <HeroSection lotteryPool={lotteryPool} />
      <StatsSection lotteryPool={lotteryPool}/>
      <CurrentLotterySection lotteryPool={lotteryPool} ticketPoolId={ticketPoolId}/>
      <PreviousWinnersSection />
      <HowItWorksSection />
      <CTASection lotteryPool={lotteryPool}/>
    </>
  );
};

export default Home;
