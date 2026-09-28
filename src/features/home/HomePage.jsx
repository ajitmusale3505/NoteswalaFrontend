import HomeNavbar from "./components/HomeNavbar";
import HomeHero from "./components/HomeHero";
import QuickAccess from "./QuickAccess";
import DashboardPanels from "./DashboardPanels";
import HomeFooterStrip from "./HomeFooterStrip";
import HomeFooter from "./HomeFooter";
import ProfileCompletionGate from "../profile/ProfileCompletionGate";

export default function HomePage() {
  return (
    <ProfileCompletionGate>
      <div className="home-page" id="top">
        <HomeNavbar />
        <main className="home-main">
          <HomeHero />
          <QuickAccess />
          <DashboardPanels />
          <HomeFooterStrip />
        </main>
        <HomeFooter />
      </div>
    </ProfileCompletionGate>
  );
}
