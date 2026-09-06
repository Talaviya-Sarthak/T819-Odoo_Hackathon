import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProcessWorkflow from './components/ProcessWorkflow';
import CoreFeatures from './components/CoreFeatures';
import InteractivePreview from './components/InteractivePreview';
import IntelligenceSection from './components/IntelligenceSection';
import DiscountGovernanceSection from './components/DiscountGovernanceSection';
import FulfillmentSection from './components/FulfillmentSection';
import HybridBillingSection from './components/HybridBillingSection';
import NegotiationSection from './components/NegotiationSection';
import AISection from './components/AISection';
import RoleSection from './components/RoleSection';
import FAQSection from './components/FAQSection';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    // Smooth scroll support for hash navigation
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background antialiased">
      {/* Sticky Navigation */}
      <Navbar />

      {/* Main Content */}
      <main id="main-content">
        <Hero />
        <ProcessWorkflow />
        <CoreFeatures />
        <InteractivePreview />
        <IntelligenceSection />
        <DiscountGovernanceSection />
        <FulfillmentSection />
        <HybridBillingSection />
        <NegotiationSection />
        <AISection />
        <RoleSection />
        <FAQSection />
        <FinalCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
