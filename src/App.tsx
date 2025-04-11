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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/how-it-works" component={HowItWorks}/>
      <Route path="/history" component={History}/>
      <Route path="/faq" component={FAQ}/>
      <Route path="/current-lottery" component={CurrentLotterySection} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Router />
        </main>
        <Footer />
        <Toaster />
      </div>
  );
}

export default App;
