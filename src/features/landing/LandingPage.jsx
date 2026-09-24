import LandingHeader from "./components/LandingHeader";
import HeroSection from "./components/HeroSection";
import PlatformOverview from "./components/PlatformOverview";
import ResourceSection from "./components/ResourceSection";
import CommunitySection from "./components/CommunitySection";
import UniversitySection from "./components/UniversitySection";
import CareerSection from "./components/CareerSection";
import ToolsLibrarySection from "./components/ToolsLibrarySection";
import LandingFooter from "./components/LandingFooter";

export default function LandingPage() {
  return (
    <div id="top" className="landing-page">
      <LandingHeader />
      <main>
        <HeroSection />
        <PlatformOverview />
        <ResourceSection />
        <CommunitySection />
        <UniversitySection />
        <CareerSection />
        <ToolsLibrarySection />
        <LandingFooter />
      </main>
    </div>
  );
}