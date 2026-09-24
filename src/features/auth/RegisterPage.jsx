import { FiArrowRight, FiBookOpen } from "react-icons/fi";
import CampusBackdrop from "./components/CampusBackdrop";
import RegisterBenefits from "./components/RegisterBenefits";
import RegisterEmailNotice from "./components/RegisterEmailNotice";
import RegisterForm from "./components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="register-page">
      <header className="register-header">
        <a className="brand" href="/" aria-label="EduHub home">
          <span className="brand-mark"><FiBookOpen /></span>
          <span>EduHub</span>
        </a>
        <nav>
          <a href="/#resources">Resources</a>
          <a href="/#community">Community</a>
          <a href="/#university">University</a>
          <a href="/#career">Career</a>
          <a href="/#library">Library</a>
          <a href="/#tools">Tools</a>
        </nav>
        <div className="register-header-actions">
          <span>Already a member?</span>
          <a href="/login">Login <FiArrowRight /></a>
        </div>
      </header>

      <main className="register-main">
        <CampusBackdrop />
        <div className="register-shell">
          <RegisterBenefits />

          <section className="register-card">
            <RegisterEmailNotice />
            <div className="register-card-heading">
              <div>
                <p>Create account</p>
                <h2>Join EduHub</h2>
                <span>Start your engineering journey with us.</span>
              </div>
              <div className="card-login">
                Already have an account?
                <a href="/login">Login <FiArrowRight /></a>
              </div>
            </div>
            <RegisterForm />
          </section>
        </div>
      </main>
    </div>
  );
}