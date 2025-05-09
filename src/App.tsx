import { useEffect, useState } from 'react';
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import HowItWorks from "@/pages/how-it-works";
import History from "@/pages/history";
import FAQ from "@/pages/faq";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CurrentLotterySection from "@/components/CurrentLotterySection";
import ClaimRewards from "@/pages/claim-rewards";
import { useNetworkVariable } from "@/networkConfig";
import {useSuiClientQuery } from "@mysten/dapp-kit";
import { LotteryPool ,createLotteryPool, Lottery, createLottery } from '@/dto/LotteryPool';


function Router({ lotteryPool, lottery, ticketPoolId }: { lotteryPool: LotteryPool | null; lottery: Lottery | null; ticketPoolId: string }) {
  return (
    <Switch>
      <Route path="/" component={() => (<Home lotteryPool={lotteryPool} lottery={lottery} ticketPoolId={ticketPoolId} />)} />
      <Route path="/how-it-works" component={() => (<HowItWorks lotteryPool={lotteryPool} lottery={lottery} />)}/>
      <Route path="/history" component={History}/>
      <Route path="/faq" component={() => (<FAQ lotteryPool={lotteryPool} lottery={lottery} />)} />
      <Route path="/current-lottery" component={() => <CurrentLotterySection lotteryPool={lotteryPool} lottery={lottery} ticketPoolId={ticketPoolId} />} />
      <Route path="/claim-rewards" component={() => <ClaimRewards />} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [lotteryPoolId, setLotteryPoolId] = useState<string>("-1");
  const [ticketPoolId, setTicketPoolId] = useState<string>("-1");
  const [lotteryPool, setLotteryPool] = useState<LotteryPool | null>(null);
  const [lottery, setLottery] = useState<Lottery | null>(null);
  const lotteryId = useNetworkVariable("lotteryId");
  const { data, isPending } = useSuiClientQuery("getObject", {
    id: lotteryId,
    options: {
        showContent: true,
        showOwner: true,
    },
  });
  const { data: lotteryData, isPending: isLotteryPending} = useSuiClientQuery("getObject", {
    id: lotteryPoolId,
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  useEffect(() => {
    if (!isPending && data?.data?.content) {
      const lottery = createLottery(data.data.content as any);
      if(lottery){
        setLotteryPoolId(lottery.lottery_pool_id);
        setLottery(lottery);
      }
      setTicketPoolId((data.data.content as any).fields.ticket_pool_id as string);
    }
  }, [isPending, data]);

  useEffect(() => {
    if (!isLotteryPending && lotteryData) {
      const lotteryPool = createLotteryPool(lotteryData.data?.content as any);
      setLotteryPool(lotteryPool);
    }
  }, [isLotteryPending, lotteryData]);


  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Router lotteryPool={lotteryPool} lottery={lottery} ticketPoolId={ticketPoolId}/>
        </main>
        <Footer />
        <Toaster />
      </div>
  );
}

export default App;