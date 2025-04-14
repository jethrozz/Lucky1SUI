import React from 'react';
import HeroSection from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import CurrentLotterySection from '@/components/CurrentLotterySection';
import PreviousWinnersSection from '@/components/PreviousWinnersSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import CTASection from '@/components/CTASection';
import { LotteryPool } from '@/dto/LotteryPool';

const Home:  React.FC<{lotteryPool: LotteryPool|null, ticketPoolId: string}> = ({lotteryPool, ticketPoolId}) => {
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
