import { FiBookOpen, FiBriefcase, FiFileText, FiGrid, FiTrendingUp, FiUsers } from "react-icons/fi";

const benefits = [
  [FiFileText, "Academic Resources", "PYQs, notes, books, practicals and more"],
  [FiUsers, "Learn with a Community", "Discuss, share and grow together"],
  [FiBookOpen, "Stay Updated", "University updates, timetables and announcements"],
  [FiTrendingUp, "Prepare for Your Career", "Interview prep, resume builder and more"],
  [FiGrid, "Use Powerful Student Tools", "CGPA calculator, timetable builder and more"],
];

export default function RegisterBenefits() {
  return (
    <div className="register-benefits">
      <div className="register-kicker"><span /> Join EduHub</div>
      <h1>Be a part of the<br />engineering <em>community.</em></h1>
      <p className="register-lead">Access academic resources, solve doubts, stay updated, prepare for your career and grow together — with students from universities across India.</p>
      <div className="benefit-list">
        {benefits.map(([Icon, title, text]) => <div className="benefit-item" key={title}><Icon /><div><b>{title}</b><span>{text}</span></div></div>)}
      </div>
      <div className="register-quote">For every engineering student,<br />a better tomorrow.</div>
    </div>
  );
}