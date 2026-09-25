import { FiArrowRight, FiBookOpen, FiEye, FiEyeOff, FiGithub, FiLinkedin, FiLock, FiMail } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp, verifyOtp, login } from "../../services/authService";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const initialForm = { email: "", otp: "", password: "", remember: false };

export default function LoginPage() {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpConfirmed, setOtpConfirmed] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSendOtp = async () => {
    if (!form.email || sendingOtp) return;
    try {
      setSendingOtp(true);
      await sendOtp(form.email, "LOGIN");
      setOtpSent(true);
      setOtpConfirmed(false);
      toast.success("OTP sent to your email.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (form.otp.length !== 6 || verifyingOtp) return;
    try {
      setVerifyingOtp(true);
      await verifyOtp(form.email, "LOGIN", form.otp);
      setOtpConfirmed(true);
      toast.success("Email verified.");
    } catch (error) {
      setOtpConfirmed(false);
      toast.error(error?.response?.data?.message || "Invalid OTP.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password || !otpConfirmed || submitting) return;
    try {
      setSubmitting(true);
      const response = await login({ email: form.email, password: form.password });
      const data = response.data?.data;
      if (data?.accessToken) localStorage.setItem("noteswala_access_token", data.accessToken);
      if (data?.refreshToken) localStorage.setItem("noteswala_refresh_token", data.refreshToken);
      toast.success("Login successful.");
      navigate("/home", { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <Link className="brand" to="/" aria-label="EduHub home">
          <span className="brand-mark"><FiBookOpen /></span>
          <span>EduHub</span>
        </Link>
        <nav>
          <a href="/#resources">Resources</a>
          <a href="/#community">Community</a>
          <a href="/#university">University</a>
          <a href="/#career">Career</a>
          <a href="/#library">Library</a>
          <a href="/#tools">Tools</a>
        </nav>
        <div className="login-header-actions">
          <Link to="/login">Login</Link>
          <Link className="button button-dark button-small" to="/register">Get Started</Link>
        </div>
      </header>

      <main className="login-main">
        <div className="login-background" aria-hidden="true" />
        <div className="login-shell">
          <section className="login-benefits">
            <div className="login-kicker"><span /> Welcome Back</div>
            <h1>Continue your<br />engineering <em>journey.</em></h1>
            <p className="login-lead">Access your resources, discussions, university updates and all your tools — right where you left off.</p>
            <div className="login-benefit-list">
              <Benefit icon="book" title="Pick up where you left" text="Access your saved resources and progress" />
              <Benefit icon="users" title="Be part of the community" text="Discuss, share and learn together" />
              <Benefit icon="university" title="Stay updated" text="Get latest university news and announcements" />
              <Benefit icon="career" title="Prepare for your career" text="Track your learning and goals" />
            </div>
          </section>

          <section className="login-card">
            <div className="login-card-heading">
              <p>Welcome back</p>
              <h2>Login to EduHub</h2>
              <span>Continue your engineering journey and access<br />all your resources, discussions and tools.</span>
            </div>

            <form className="login-form" onSubmit={submit}>
              <div className="form-field">
                <span>Email Address</span>
                <div className="field-control field-control-action">
                  <FiMail />
                  <input value={form.email} onChange={(event) => { setForm((current) => ({ ...current, email: event.target.value })); setOtpSent(false); setOtpConfirmed(false); }} placeholder="Enter your email address" type="email" autoComplete="email" required />
                  <button className="inline-action" type="button" onClick={handleSendOtp} disabled={!form.email || sendingOtp}>{sendingOtp ? "Sending..." : "Send OTP"}</button>
                </div>
              </div>

              <div className="login-otp-box">
                <div className="otp-box-heading">
                  <div>
                    <strong>Confirm your email</strong>
                    <span>{otpSent ? "Enter the 6-digit code sent to your email." : "Send an OTP to verify your email address."}</span>
                  </div>
                  <FiMail />
                </div>
                <div className="field-control field-control-action">
                  <FiLock />
                  <input value={form.otp} onChange={(event) => { setForm((current) => ({ ...current, otp: event.target.value.replace(/\D/g, "").slice(0, 6) })); setOtpConfirmed(false); }} placeholder="Enter 6-digit OTP" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
                  <button className={`inline-action ${otpConfirmed ? "confirmed" : ""}`} type="button" onClick={handleConfirmOtp} disabled={!otpSent || form.otp.length !== 6}>
                    {verifyingOtp ? "Verifying..." : otpConfirmed ? "Confirmed" : "Confirm OTP"}
                  </button>
                </div>
                {otpConfirmed && <small className="otp-helper otp-confirmed">Email verified successfully.</small>}
              </div>

              <div className="form-field">
                <span>Password</span>
                <div className="field-control">
                  <FiLock />
                  <div className="password-input">
                    <input value={form.password} onChange={update("password")} placeholder="Enter your password" type={showPassword ? "text" : "password"} autoComplete="current-password" required />
                    <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button>
                  </div>
                </div>
              </div>

              <div className="login-options">
                <label><input type="checkbox" checked={form.remember} onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))} /><span>Remember me</span></label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <button className="login-submit" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Login"} <FiArrowRight /></button>

              <div className="social-divider"><span>or continue with</span></div>
              <div className="social-login">
                <button type="button"><FcGoogle />Google</button>
                <button type="button"><FiGithub />GitHub</button>
                <button type="button"><FiLinkedin />LinkedIn</button>
              </div>

              <p className="login-register-link">Don’t have an account? <Link to="/register">Create one <FiArrowRight /></Link></p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

function Benefit({ icon, title, text }) {
  const icons = {
    book: <FiBookOpen />,
    users: <span className="benefit-users">◯◯</span>,
    university: <span className="benefit-university">⌂</span>,
    career: <span className="benefit-career">▥</span>,
  };

  return <div className="login-benefit-item"><span className="login-benefit-icon">{icons[icon]}</span><div><b>{title}</b><span>{text}</span></div></div>;
}