import { FiArrowRight, FiAward } from "react-icons/fi";
import { FaFire } from "react-icons/fa";

export default function HomeFooterStrip(){
  return <section className="home-streak"><div className="streak-icon"><FiAward /></div><div><b>Keep Going!</b><p>You've viewed 12 resources this week. Maintain your streak and achieve your goals.</p></div><div className="streak-divider" /><div className="streak-score"><FaFire /><strong>7</strong><span>Day Streak</span></div><a href="#profile">View My Profile <FiArrowRight /></a></section>;
}