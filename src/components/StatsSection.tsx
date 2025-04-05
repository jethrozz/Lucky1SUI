import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';

const StatsSection: React.FC = () => {
  const { data: currentRound, isLoading } = useQuery({
    queryKey: ['/api/lottery/current'],
  });

  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 14,
    seconds: 8
  });

  useEffect(() => {
    if (!currentRound) return;

    const endTime = new Date(currentRound.endDate).getTime();
    
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
  }, [currentRound]);

  const formatTime = (time: number): string => {
    return time < 10 ? `0${time}` : `${time}`;
  };

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="stats-item bg-neutral-lightest p-6 rounded-xl shadow-sm border border-neutral-light hover:transform hover:scale-103 transition-all duration-200">
            <div className="flex items-start">
              <div className="bg-secondary/10 p-3 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-neutral-medium text-sm mb-1">Current Prize Pool</p>
                <h3 className="text-2xl font-bold text-primary">
                  {isLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `${Number(currentRound?.prizePool).toLocaleString()} SUI`
                  )}
                </h3>
                <p className="text-primary text-sm font-semibold bg-primary/10 inline-block px-2 py-0.5 rounded">+12.5% since yesterday</p>
              </div>
            </div>
          </Card>
          
          <Card className="stats-item bg-neutral-lightest p-6 rounded-xl shadow-sm border border-neutral-light hover:transform hover:scale-103 transition-all duration-200">
            <div className="flex items-start">
              <div className="bg-primary/10 p-3 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-neutral-medium text-sm mb-1">Active Players</p>
                <h3 className="text-2xl font-bold text-primary">
                  {isLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `${currentRound?.totalTickets.toLocaleString()}`
                  )}
                </h3>
                <p className="text-primary text-sm font-semibold bg-primary/10 inline-block px-2 py-0.5 rounded">+89 new today</p>
              </div>
            </div>
          </Card>
          
          <Card className="stats-item bg-neutral-lightest p-6 rounded-xl shadow-sm border border-neutral-light hover:transform hover:scale-103 transition-all duration-200">
            <div className="flex items-start">
              <div className="bg-primary/10 p-3 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-neutral-medium text-sm mb-1">Next Draw</p>
                <h3 className="text-2xl font-bold text-primary">
                  {`${formatTime(timeLeft.hours)}h ${formatTime(timeLeft.minutes)}m ${formatTime(timeLeft.seconds)}s`}
                </h3>
                <p className="text-primary text-sm font-semibold bg-primary/10 inline-block px-2 py-0.5 rounded">
                  {isLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    new Date(currentRound?.endDate).toLocaleDateString('en-US', {
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
