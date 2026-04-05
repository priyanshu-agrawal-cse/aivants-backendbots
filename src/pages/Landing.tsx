import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import WhatItDoes from "@/components/landing/WhatItDoes";
import ReplaceTools from "@/components/landing/ReplaceTools";
import Integrations from "@/components/landing/Integrations";
import CommandCenter from "@/components/landing/CommandCenter";
import Intelligence from "@/components/landing/Intelligence";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import { PricingSection } from "@/components/PricingSection";

export default function Landing() {
  return (
    <>
      <Header />
      <main className="bg-[#fafafa]">
        <Hero />
        <WhatItDoes />
        <ReplaceTools />
        <Integrations />
        <CommandCenter />
        <Intelligence />
        <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
          <PricingSection />
        </section>
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
