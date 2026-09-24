import HomeNavbar from "./components/HomeNavbar";
import HomeHero from "./components/HomeHero";
import QuickAccess from "./components/QuickAccess";
import DashboardPanels from "./components/DashboardPanels";
import HomeFooterStrip from "./components/HomeFooterStrip";
import HomeFooter from "./components/HomeFooter";

export default function HomePage() {
  return (
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
  );
}