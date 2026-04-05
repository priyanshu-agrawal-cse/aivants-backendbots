import Nav from '../components/landing_light/Nav';
import Hero from '../components/landing_light/Hero';
import Environment from '../components/landing_light/Environment';
import LivingState from '../components/landing_light/LivingState';
import Intelligence from '../components/landing_light/Intelligence';
import Movement from '../components/landing_light/Movement';
import Control from '../components/landing_light/Control';
import Scales from '../components/landing_light/Scales';
import WhatChanges from '../components/landing_light/WhatChanges';
import FinalSection from '../components/landing_light/FinalSection';
import Footer from '../components/landing_light/Footer';
import { PricingSection } from '../components/PricingSection';

export default function LandingLight() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Nav />
      <Hero />
      <Environment />
      <LivingState />
      <Intelligence />
      <Movement />
      <Control />
      <Scales />
      <WhatChanges />
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <PricingSection />
      </section>
      <FinalSection />
      <Footer />
    </div>
  );
}
