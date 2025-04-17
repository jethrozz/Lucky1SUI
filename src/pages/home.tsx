import React from 'react';
import HeroSection from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import CurrentLotterySection from '@/components/CurrentLotterySection';
import PreviousWinnersSection from '@/components/PreviousWinnersSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import CTASection from '@/components/CTASection';
import { LotteryPool , Lottery} from '@/dto/LotteryPool';


const Home:  React.FC<{lotteryPool: LotteryPool|null, lottery: Lottery|null, ticketPoolId: string}> = ({lotteryPool, lottery, ticketPoolId}) => {
  return (
    <>
      <HeroSection lotteryPool={lotteryPool} />
      <StatsSection lotteryPool={lotteryPool} lottery={lottery} />
      <CurrentLotterySection lotteryPool={lotteryPool} lottery={lottery} ticketPoolId={ticketPoolId}/>
      <PreviousWinnersSection />
      <HowItWorksSection />
      <CTASection lotteryPool={lotteryPool} lottery={lottery}/>
    </>
  );
};

export default Home;
