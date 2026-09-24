import { FiMail } from "react-icons/fi";

export default function RegisterEmailNotice() {
  return (
    <div className="register-email-notice" role="status">
      <span className="register-email-notice-icon"><FiMail /></span>
      <div>
        <strong>Email confirmation required</strong>
        <p>After creating your account, we'll send a confirmation link to your email address.</p>
      </div>
    </div>
  );
}