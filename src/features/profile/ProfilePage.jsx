import { useEffect, useState } from "react";
import {
  FiActivity, FiAward, FiBookOpen, FiBriefcase, FiCalendar, FiCamera, FiCheck,
  FiChevronRight, FiCode, FiEdit3, FiGithub, FiHeart, FiHome, FiLinkedin,
  FiMapPin, FiMessageSquare, FiPhone, FiSettings, FiUser, FiUsers
} from "react-icons/fi";
import HomeNavbar from "../home/components/HomeNavbar";
import { getCurrentUser, getPersonalProfile, getUserAcademicProfile } from "../../services/profileService";
import { PersonalProfileEditModal, AcademicProfileEditModal } from "./ProfileEditModals";

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

function ProfileHero({onEdit, user, academic}) {
  const displayName = user?.fullName || academic?.userName || "Student";
  const initial = displayName.trim().charAt(0).toUpperCase() || "S";
  const branch = academic?.branchName || "Academic profile not completed";
  const university = academic?.universityName || "University not provided";
  const location = academic?.city || "Location not provided";
  return (
    <section className="profile-hero">
      <div className="profile-hero-bg" />
      <div className="profile-hero-inner">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{initial}</div>
          <button type="button" className="avatar-camera" aria-label="Change profile photo"><FiCamera/></button>
        </div>
        <div className="profile-identity">
          <div className="profile-name-row">
            <h1>{displayName}</h1>
            <button type="button" className="hero-edit" onClick={onEdit}><FiEdit3/> Edit</button>
          </div>
          <p className="profile-role">{academic?.academicYearName || "Student"}</p>
          <div className="profile-meta">
            <span><FiBookOpen/> {branch}</span>
            <span><FiHome/> {university}</span>
            <span><FiMapPin/> {location}</span>
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

function PersonalInformation({onEdit, user, academic, personal}) {
  return <Card title="Personal Information" icon={FiUser} onEdit={onEdit}>
    <div className="info-grid">
      <InfoRow icon={FiUser} label="Full Name" value={user?.fullName || "Not provided"}/>
      <InfoRow icon={FiMessageSquare} label="Email" value={user?.email || "Not provided"}/>
      <InfoRow icon={FiPhone} label="Phone" value={personal?.phoneNumber || academic?.phoneNumber || "Not provided"}/>
      <InfoRow icon={FiMapPin} label="Location" value={personal?.city || academic?.city || "Not provided"}/>
      <InfoRow icon={FiCalendar} label="Date of Birth" value={personal?.dateOfBirth || "Not provided"}/>
      <InfoRow icon={FiUsers} label="Gender" value={personal?.gender ? personal.gender.charAt(0) + personal.gender.slice(1).toLowerCase() : (academic?.gender ? academic.gender.charAt(0) + academic.gender.slice(1).toLowerCase() : "Not provided")}/>
    </div>
  </Card>;
}

function AcademicInformation({onEdit, academic}) {
  const value = (field) => field || "Not provided";
  return <Card title="Academic Information" icon={FiBookOpen} onEdit={onEdit}>
    <div className="info-grid">
      <InfoRow icon={FiHome} label="University" value={value(academic?.universityName)}/>
      <InfoRow icon={FiHome} label="College" value={value(academic?.collegeName)}/>
      <InfoRow icon={FiBookOpen} label="Branch" value={value(academic?.branchName)}/>
      <InfoRow icon={FiCalendar} label="Current Status" value={value(academic?.currentStatus === "Studying" ? "Pursuing" : academic?.currentStatus)}/><InfoRow icon={FiBookOpen} label="Exam Pattern" value={value(academic?.academicYearName)}/>
      <InfoRow icon={FiAward} label="CGPA" value={academic?.cgpa != null ? `${academic.cgpa} / 10` : "Not provided"}/>
      <InfoRow icon={FiCalendar} label="Expected Passout" value={academic?.graduationYear ?? "Not provided"}/>
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

function ProfileCompletion({academic}) {
  const percentage = Math.max(0, Math.min(Number(academic?.profileCompletionPercentage ?? 0), 100));
  const degrees = percentage * 3.6;

  const completionTheme =
    percentage >= 80 ? "complete" :
    percentage >= 60 ? "good" :
    percentage >= 30 ? "warning" :
    "critical";

  const checklist = [
    "Personal Information",
    "Academic Information",
    "Add Skills",
    "Add Projects",
    "Add a Profile Photo",
    "Add Bio / About"
  ];

  const completedCount = Math.min(
    checklist.length,
    Math.floor((percentage / 100) * checklist.length)
  );

  return (
    <section className={`profile-card completion-card completion-${completionTheme}`}>
      <div className="completion-heading">
        <div>
          <h2><span className="completion-spark">✦</span> Profile Completion</h2>
          <p>
            {percentage === 100
              ? "Your profile is complete!"
              : "Almost there! Complete your profile to get better recommendations."}
          </p>
        </div>
        <span className="completion-decor completion-decor-one" />
        <span className="completion-decor completion-decor-two" />
      </div>

      <div className="completion-progress-area">
        <div
          className="completion-ring"
          style={{
            "--completion-progress": `${degrees}deg`,
            background: `conic-gradient(var(--completion-color) 0 ${degrees}deg, #e7edf2 ${degrees}deg 360deg)`
          }}
        >
          <div className="completion-ring-inner">
            <strong>{percentage}%</strong>
            <span>{percentage === 100 ? "Completed" : "Completed"}</span>
          </div>
        </div>
        <div className="completion-cap" aria-hidden="true">🎓</div>
      </div>

      <ul className="completion-checklist">
        {checklist.map((item, index) => {
          const done = index < completedCount;
          return (
            <li key={item} className={done ? "done" : "pending"}>
              <span className="completion-status">
                {done ? <FiCheck /> : null}
              </span>
              <span className="completion-item-name">{item}</span>
              <small>{done ? "Completed" : "Pending"}</small>
              <FiChevronRight className="completion-arrow" />
            </li>
          );
        })}
      </ul>

      {percentage < 100 && (
        <button type="button" className="completion-action">
          <FiAward /> Complete Your Profile <FiChevronRight />
        </button>
      )}
    </section>
  );
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
  const [editing,setEditing]=useState(null);
  const [user,setUser]=useState(null);
  const [academic,setAcademic]=useState(null);
  const [personal,setPersonal]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const edit=(mode)=>setEditing(mode);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const userResponse = await getCurrentUser();
        const currentUser = userResponse.data?.data;

        if (!currentUser?.userId) {
          throw new Error("Unable to identify the logged-in user.");
        }

        if (!mounted) return;
        setUser(currentUser);

        const [academicResult, personalResult] = await Promise.allSettled([
          getUserAcademicProfile(currentUser.userId),
          getPersonalProfile()
        ]);

        if (!mounted) return;

        if (academicResult.status === "fulfilled") {
          setAcademic(academicResult.value.data?.data || null);
        } else if (academicResult.reason?.response?.status !== 404) {
          setError(academicResult.reason?.response?.data?.message || "Unable to load academic profile.");
        }

        if (personalResult.status === "fulfilled") {
          setPersonal(personalResult.value.data?.data || null);
        } else if (personalResult.reason?.response?.status !== 404) {
          setError(personalResult.reason?.response?.data?.message || "Unable to load personal profile.");
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError?.response?.data?.message || loadError?.message || "Unable to load your profile.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  return <div className="profile-page">
    <HomeNavbar user={user} academic={academic} loading={loading}/>
    <div className="profile-layout">
      <ProfileSidebar/>
      <main className="profile-main">
        {error && <div className="profile-api-error" role="alert">{error}</div>}
        <ProfileHero onEdit={() => edit("personal")} user={user} academic={academic}/>
        <ProfileTabs/>
        <div className="profile-content">
          <div className="profile-primary">
            <div className="profile-grid-two">
              <PersonalInformation onEdit={() => edit("personal")} user={user} academic={academic} personal={personal}/>
              <AcademicInformation onEdit={() => edit("academic")} academic={academic}/>
              <AboutMe onEdit={() => edit("personal")}/>
              <TagCard title="Skills" icon={FiCode} items={skills} onEdit={() => edit("personal")}/>
              <CareerPreferences onEdit={() => edit("personal")}/>
              <TagCard title="Interests" icon={FiHeart} items={interests} onEdit={() => edit("personal")}/>
            </div>
          </div>
          <aside className="profile-right">
            <ProfileCompletion academic={academic}/>
            <SocialLinks onEdit={() => edit("personal")}/>
          </aside>
        </div>
      </main>
    </div>
    {editing==="personal"&&<PersonalProfileEditModal
      onClose={()=>setEditing(null)}
      onSaved={(data)=>{
        setUser((u)=>u?{...u,fullName:data?.fullName||u.fullName}:u);
        setPersonal(data||null);
        setAcademic((a)=>a?{...a,phoneNumber:data?.phoneNumber??a.phoneNumber,gender:data?.gender??a.gender,state:data?.state??a.state,city:data?.city??a.city}:a);
        setEditing(null);
      }}
    />}
    {editing==="academic"&&<AcademicProfileEditModal
      academic={academic}
      onClose={()=>setEditing(null)}
      onSaved={(data)=>{setAcademic(data||academic);setEditing(null);}}
    />}
  </div>;
}
