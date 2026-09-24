import { useState } from "react";
import {
  FiActivity, FiAward, FiBookOpen, FiBriefcase, FiCalendar, FiCamera, FiCheck,
  FiChevronRight, FiCode, FiEdit3, FiGithub, FiHeart, FiHome, FiLinkedin,
  FiMapPin, FiMessageSquare, FiPhone, FiSettings, FiUser, FiUsers
} from "react-icons/fi";
import HomeNavbar from "../home/components/HomeNavbar";

const sidebarItems = [
  ["Dashboard", FiHome, "/home"],
  ["My Profile", FiUser, "/profile"],
  ["My Resources", FiBookOpen, "#"],
  ["Saved Items", FiHeart, "#"],
  ["Downloads", FiBriefcase, "#"],
  ["My Uploads", FiActivity, "#"],
  ["My Requests", FiMessageSquare, "#"],
  ["My Library", FiBookOpen, "#"],
  ["Settings", FiSettings, "#"],
];

const skills = ["Java","Spring Boot","React.js","JavaScript","HTML","CSS","SQL","PostgreSQL","Git","REST API","Hibernate","Tailwind CSS","Node.js","Express.js","MongoDB"];
const interests = ["Web Development","Cloud Technologies","Open Source","AI & ML","Problem Solving","Tech Blogging","Reading","Badminton"];

function EditButton({onClick}) {
  return <button className="profile-edit-btn" type="button" onClick={onClick}><FiEdit3/> Edit</button>;
}

function ProfileSidebar() {
  return (
    <aside className="profile-sidebar">
      <nav>
        {sidebarItems.map(([label,Icon,href]) => (
          <a key={label} href={href} className={label === "My Profile" ? "active" : ""}>
            <Icon/><span>{label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}

function ProfileHero({onEdit}) {
  return (
    <section className="profile-hero">
      <div className="profile-hero-bg" />
      <div className="profile-hero-inner">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">S</div>
          <button type="button" className="avatar-camera" aria-label="Change profile photo"><FiCamera/></button>
        </div>
        <div className="profile-identity">
          <div className="profile-name-row">
            <h1>Student</h1>
            <button type="button" className="hero-edit" onClick={onEdit}><FiEdit3/> Edit</button>
          </div>
          <p className="profile-role">Final Year Student</p>
          <div className="profile-meta">
            <span><FiBookOpen/> Computer Engineering</span>
            <span><FiHome/> SPPU, Pune</span>
            <span><FiMapPin/> Pune, Maharashtra</span>
          </div>
          <p className="profile-bio-short">Passionate about software development, exploring new technologies and building projects that create real impact. Always eager to learn and grow.</p>
          <div className="profile-stats">
            <Stat icon={FiBookOpen} value="24" label="Resources Saved"/>
            <Stat icon={FiBriefcase} value="18" label="Downloads"/>
            <Stat icon={FiActivity} value="6" label="Resources Uploaded"/>
            <Stat icon={FiAward} value="4.8" label="Average Rating"/>
            <Stat icon={FiUsers} value="12" label="Followers"/>
          </div>
        </div>
        <div className="cover-quote">“Learning today,<br/>for a better tomorrow.”</div>
        <button className="cover-change" type="button"><FiCamera/> Change Cover Photo</button>
      </div>
    </section>
  );
}

function Stat({icon:Icon,value,label}) {
  return <div className="profile-stat"><span><Icon/></span><div><strong>{value}</strong><small>{label}</small></div></div>;
}

function ProfileTabs() {
  return <nav className="profile-tabs">
    {[["Overview",FiUser],["Academic",FiBookOpen],["Skills",FiCode],["Projects",FiBriefcase],["Activity",FiActivity],["Achievements",FiAward],["Settings",FiSettings]].map(([label,Icon],i)=>
      <button type="button" key={label} className={i===0?"active":""}><Icon/><span>{label}</span></button>
    )}
  </nav>;
}

function Card({title,icon:Icon,children,onEdit,className=""}) {
  return <section className={"profile-card "+className}>
    <header><h2><Icon/>{title}</h2>{onEdit&&<EditButton onClick={onEdit}/>}</header>
    {children}
  </section>;
}

function PersonalInformation({onEdit}) {
  return <Card title="Personal Information" icon={FiUser} onEdit={onEdit}>
    <div className="info-grid">
      <InfoRow icon={FiUser} label="Full Name" value="Student"/>
      <InfoRow icon={FiMessageSquare} label="Email" value="student@example.com"/>
      <InfoRow icon={FiPhone} label="Phone" value="+91 98765 43210"/>
      <InfoRow icon={FiMapPin} label="Location" value="Pune, Maharashtra"/>
      <InfoRow icon={FiCalendar} label="Date of Birth" value="15 March 2004"/>
      <InfoRow icon={FiUsers} label="Gender" value="Male"/>
    </div>
  </Card>;
}

function AcademicInformation({onEdit}) {
  return <Card title="Academic Information" icon={FiBookOpen} onEdit={onEdit}>
    <div className="info-grid">
      <InfoRow icon={FiHome} label="University" value="Savitribai Phule Pune University (SPPU)"/>
      <InfoRow icon={FiHome} label="College" value="Sahyadri Valley College of Engineering and Technology, Rajuri, Pune"/>
      <InfoRow icon={FiBookOpen} label="Branch" value="Computer Engineering"/>
      <InfoRow icon={FiCalendar} label="Current Status" value="Final Year"/>
      <InfoRow icon={FiAward} label="CGPA" value="8.38 / 10"/>
      <InfoRow icon={FiCalendar} label="Expected Passout" value="2026"/>
    </div>
  </Card>;
}

function InfoRow({icon:Icon,label,value}) {
  return <div className="info-row"><Icon/><span>{label}</span><strong>{value}</strong></div>;
}

function AboutMe({onEdit}) {
  return <Card title="About Me" icon={FiBriefcase} onEdit={onEdit} className="about-card">
    <p>I am a Computer Engineering student with a strong interest in full stack development, problem solving, and building real world projects. I enjoy learning new technologies, exploring innovative ideas and contributing to the developer community. My goal is to become a skilled software developer and work on projects that create meaningful impact.</p>
  </Card>;
}

function TagCard({title,icon:Icon,items,onEdit}) {
  return <Card title={title} icon={Icon} onEdit={onEdit} className="tag-card">
    <div className="tag-list">{items.map(item=><span key={item}>{item}</span>)}</div>
  </Card>;
}

function CareerPreferences({onEdit}) {
  return <Card title="Career Preferences" icon={FiBriefcase} onEdit={onEdit}>
    <div className="preference-list">
      <InfoRow icon={FiBriefcase} label="Preferred Role" value="Java Full Stack Developer"/>
      <InfoRow icon={FiMapPin} label="Preferred Location" value="Pune, Bengaluru, Hyderabad (Open to Remote)"/>
      <InfoRow icon={FiBriefcase} label="Employment Type" value="Full Time / Internship (PPO)"/>
      <InfoRow icon={FiCalendar} label="Availability" value="Available to join from Oct 2026"/>
    </div>
  </Card>;
}

function ProfileCompletion() {
  return <section className="profile-card completion-card">
    <h2>Profile Completion</h2>
    <div className="completion-top"><div className="completion-ring"><strong>85%</strong></div><div><b>Profile completed</b><p>Complete your profile to get better recommendations.</p></div></div>
    <ul>{["Personal Information","Academic Information","Add Skills","Add Projects","Add a Profile Photo","Add Bio / About"].map((item,i)=><li key={item} className={i<5?"done":""}>{i<5?<FiCheck/>:<span/>}{item}</li>)}</ul>
  </section>;
}

function SocialLinks({onEdit}) {
  return <Card title="Social Links" icon={FiUsers} onEdit={onEdit} className="social-card">
    <a href="#" onClick={e=>e.preventDefault()}><FiLinkedin/><span><b>LinkedIn</b><small>linkedin.com/in/yourprofile</small></span></a>
    <a href="#" onClick={e=>e.preventDefault()}><FiGithub/><span><b>GitHub</b><small>github.com/yourusername</small></span></a>
    <a href="#" onClick={e=>e.preventDefault()}><FiCode/><span><b>Portfolio</b><small>yourportfolio.com</small></span></a>
    <a href="#" onClick={e=>e.preventDefault()}><FiCode/><span><b>LeetCode</b><small>leetcode.com/yourusername</small></span></a>
  </Card>;
}

export default function ProfilePage() {
  const [editing,setEditing]=useState(false);
  const edit=()=>setEditing(true);
  return <div className="profile-page">
    <HomeNavbar/>
    <div className="profile-layout">
      <ProfileSidebar/>
      <main className="profile-main">
        <ProfileHero onEdit={edit}/>
        <ProfileTabs/>
        <div className="profile-content">
          <div className="profile-primary">
            <div className="profile-grid-two">
              <PersonalInformation onEdit={edit}/>
              <AcademicInformation onEdit={edit}/>
              <AboutMe onEdit={edit}/>
              <TagCard title="Skills" icon={FiCode} items={skills} onEdit={edit}/>
              <CareerPreferences onEdit={edit}/>
              <TagCard title="Interests" icon={FiHeart} items={interests} onEdit={edit}/>
            </div>
          </div>
          <aside className="profile-right">
            <ProfileCompletion/>
            <SocialLinks onEdit={edit}/>
          </aside>
        </div>
      </main>
    </div>
    {editing&&<div className="profile-edit-toast" role="status">Profile editing is ready. Connect this form to your profile API when the backend profile endpoints are available.<button type="button" onClick={()=>setEditing(false)}>Close</button></div>}
  </div>;
}
