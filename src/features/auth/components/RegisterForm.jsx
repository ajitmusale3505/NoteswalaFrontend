import { useMemo, useState } from "react";
import { FiCheck, FiEye, FiEyeOff, FiGithub, FiLinkedin, FiLock, FiMail, FiUser } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { sendOtp, verifyOtp, register } from "../../../services/authService";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const initialForm = { fullName: "", email: "", otp: "", password: "", confirmPassword: "", terms: false };

function passwordRules(password) {
  return [
    ["At least 8 characters", password.length >= 8],
    ["1 letter", /[A-Za-z]/.test(password)],
    ["1 number", /\d/.test(password)],
    ["1 special character", /[^A-Za-z0-9]/.test(password)],
  ];
}

export default function RegisterForm() {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpConfirmed, setOtpConfirmed] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const rules = useMemo(() => passwordRules(form.password), [form.password]);

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSendOtp = async () => {
    if (!form.email || sendingOtp) return;
    try {
      setSendingOtp(true);
      await sendOtp(form.email, "REGISTER");
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
      await verifyOtp(form.email, "REGISTER", form.otp);
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
    if (
      !form.fullName ||
      !form.email ||
      !form.terms ||
      !otpConfirmed ||
      form.password !== form.confirmPassword ||
      rules.some(([, valid]) => !valid) ||
      submitting
    ) return;

    try {
      setSubmitting(true);
      const response = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      const data = response.data?.data;
      if (data?.accessToken) localStorage.setItem("noteswala_access_token", data.accessToken);
      if (data?.refreshToken) localStorage.setItem("noteswala_refresh_token", data.refreshToken);
      toast.success("Account created successfully.");
      navigate("/home", { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="register-form" onSubmit={submit}>
      <FormField icon={FiUser} label="Full Name">
        <input value={form.fullName} onChange={update("fullName")} placeholder="Enter your full name" autoComplete="name" required />
      </FormField>

      <div className="form-field">
        <span>Email Address</span>
        <div className="field-control field-control-action">
          <FiMail />
          <input value={form.email} onChange={(event) => { setForm((current) => ({ ...current, email: event.target.value })); setOtpSent(false); setOtpConfirmed(false); }} placeholder="Enter your email address" type="email" autoComplete="email" required />
          <button className="inline-action" type="button" onClick={handleSendOtp} disabled={!form.email || sendingOtp}>{sendingOtp ? "Sending..." : "Send OTP"}</button>
        </div>
        {otpSent && <small className="otp-helper otp-sent">OTP sent to your email address.</small>}
      </div>

      <div className="form-field">
        <span>Confirm Email OTP</span>
        <div className="field-control field-control-action">
          <FiMail />
          <input value={form.otp} onChange={(event) => { setForm((current) => ({ ...current, otp: event.target.value.replace(/\D/g, "").slice(0, 6) })); setOtpConfirmed(false); }} placeholder="Enter 6-digit OTP" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
          <button className={`inline-action ${otpConfirmed ? "confirmed" : ""}`} type="button" onClick={handleConfirmOtp} disabled={!otpSent || form.otp.length !== 6}>
            {verifyingOtp ? "Verifying..." : otpConfirmed ? "Confirmed" : "Confirm OTP"}
          </button>
        </div>
        {otpConfirmed && <small className="otp-helper otp-confirmed">Email verified successfully.</small>}
      </div>

      <FormField icon={FiLock} label="Password">
        <div className="password-input">
          <input value={form.password} onChange={update("password")} placeholder="Create a strong password" type={showPassword ? "text" : "password"} autoComplete="new-password" required />
          <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button>
        </div>
      </FormField>

      <div className="password-rules">
        {rules.map(([label, valid]) => <span className={valid ? "valid" : ""} key={label}><FiCheck />{label}</span>)}
      </div>

      <FormField icon={FiLock} label="Confirm Password">
        <div className="password-input">
          <input value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="Confirm your password" type={showConfirm ? "text" : "password"} autoComplete="new-password" required />
          <button type="button" aria-label={showConfirm ? "Hide password" : "Show password"} onClick={() => setShowConfirm((value) => !value)}>{showConfirm ? <FiEyeOff /> : <FiEye />}</button>
        </div>
      </FormField>

      <label className="terms-check">
        <input type="checkbox" checked={form.terms} onChange={(event) => setForm((current) => ({ ...current, terms: event.target.checked }))} required />
        <span>I agree to EduHub’s <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</span>
      </label>

      <button className="register-submit" type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Account"} <span>→</span></button>

      <div className="social-divider"><span>or continue with</span></div>
      <div className="social-register">
        <button type="button"><FcGoogle />Google</button>
        <button type="button"><FiGithub />GitHub</button>
        <button type="button"><FiLinkedin />LinkedIn</button>
      </div>
    </form>
  );
}

function FormField({ icon: Icon, label, children }) {
  return <label className="form-field"><span>{label}</span><div className="field-control"><Icon />{children}</div></label>;
}
