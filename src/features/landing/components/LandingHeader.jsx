import { FiBookOpen, FiMenu, FiSearch, FiX } from "react-icons/fi";
import { useState } from "react";
import { navItems } from "../landingData";

export default function LandingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="/" aria-label="EduHub home"><span className="brand-mark"><FiBookOpen /></span><span>EduHub</span></a>
        <nav className={`desktop-nav ${open ? "is-open" : ""}`}>
          {navItems.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
        </nav>
        <div className="header-actions">
          <label className="header-search"><FiSearch /><input aria-label="Search" placeholder="Search for papers, notes, books..." /></label>
          <a className="login-link" href="/login">Login</a>
          <a className="button button-dark button-small" href="/register">Get Started</a>
          <button className="mobile-menu" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">{open ? <FiX /> : <FiMenu />}</button>
        </div>
      </div>
    </header>
  );
}