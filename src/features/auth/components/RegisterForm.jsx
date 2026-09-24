import { useMemo, useState } from "react";
import { FiCheck, FiEye, FiEyeOff, FiGithub, FiLinkedin, FiLock, FiMail, FiUser } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

const initialForm = { fullName: "", email: "", password: "", confirmPassword: "", terms: false };

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
  const rules = useMemo(() => passwordRules(form.password), [form.password]);

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.terms || form.password !== form.confirmPassword || rules.some(([, valid]) => !valid)) return;
  };

  return (
    <form className="register-form" onSubmit={submit}>
      <FormField icon={FiUser} label="Full Name">
        <input value={form.fullName} onChange={update("fullName")} placeholder="Enter your full name" autoComplete="name" required />
      </FormField>
      <FormField icon={FiMail} label="Email Address">
        <input value={form.email} onChange={update("email")} placeholder="Enter your email address" type="email" autoComplete="email" required />
      </FormField>
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
      <button className="register-submit" type="submit">Create Account <span>→</span></button>
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