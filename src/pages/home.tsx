import React from 'react';
import HeroSection from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import CurrentLotterySection from '@/components/CurrentLotterySection';
import PreviousWinnersSection from '@/components/PreviousWinnersSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import CTASection from '@/components/CTASection';

const Home: React.FC = () => {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <CurrentLotterySection />
      <PreviousWinnersSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
};

export default Home;
