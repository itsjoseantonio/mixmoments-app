import { LandingNav } from './components/LandingNav/LandingNav';
import { Hero } from './components/Hero/Hero';
import { UseCases } from './components/UseCases/UseCases';
import { Differentiators } from './components/Differentiators/Differentiators';
import { Story } from './components/Story/Story';
import { HowItWorks } from './components/HowItWorks/HowItWorks';
// import { Pricing } from './components/Pricing/Pricing';
import { FinalCta } from './components/FinalCta/FinalCta';
import { LandingFooter } from './components/LandingFooter/LandingFooter';

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <Hero />
      <UseCases />
      <Differentiators />
      <Story />
      <HowItWorks />
      {/* <Pricing /> */}
      <FinalCta />
      <LandingFooter />
    </>
  );
}
