import { useEffect, useState } from "react";
import {
  FiActivity, FiAward, FiBookOpen, FiBriefcase, FiCalendar, FiCamera, FiCheck,
  FiChevronRight, FiCode, FiEdit3, FiGithub, FiHeart, FiHome, FiLinkedin,
  FiMapPin, FiMessageSquare, FiPhone, FiSettings, FiUser, FiUsers
} from "react-icons/fi";
import HomeNavbar from "../home/components/HomeNavbar";
import { getCurrentUser, getPersonalProfile, getUserAcademicProfile, getSocialLinks } from "../../services/profileService";
import { PersonalProfileEditModal, AcademicProfileEditModal, AboutMeEditModal } from "./ProfileEditModals";
import { SkillsEditModal } from "./SkillsEditModal";
import { InterestsEditModal } from "./InterestsEditModal";
import { CareerPreferencesEditModal } from "./CareerPreferencesEditModal";
import { SocialLinksEditModal } from "./SocialLinksEditModal";
import CurrentSemesterSubjectsCard from "./CurrentSemesterSubjectsCard";

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

const defaultSkills = [];
const defaultInterests = [];

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

function ProfileHero({onEdit, user, academic, personal}) {
  const displayName = user?.fullName || academic?.userName || "Student";
  const initial = displayName.trim().charAt(0).toUpperCase() || "S";
  const branch = academic?.branchName || "Academic profile not completed";
  const university = academic?.universityName || "University not provided";
  const location = personal?.city || academic?.city || "Location not provided";
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
      <InfoRow icon={FiCalendar} label="Academic Year" value={value(academic?.academicYearName)}/>
      <InfoRow icon={FiCalendar} label="Semester" value={value(academic?.semesterName)}/>
      <InfoRow icon={FiCalendar} label="Current Status" value={value(academic?.currentStatus === "Studying" ? "Pursuing" : academic?.currentStatus)}/>
      <InfoRow icon={FiBookOpen} label="Exam Pattern" value={value(academic?.examPatternName)}/>
      <InfoRow icon={FiAward} label="CGPA" value={academic?.cgpa != null ? `${academic.cgpa} / 10` : "Not provided"}/>
      <InfoRow icon={FiCalendar} label="Expected Passout" value={academic?.graduationYear ?? "Not provided"}/>
    </div>
  </Card>;
}

function InfoRow({icon:Icon,label,value}) {
  return <div className="info-row"><Icon/><span>{label}</span><strong>{value}</strong></div>;
}

function AboutMe({onEdit, personal}) {
  const aboutMe = personal?.aboutMe?.trim();
  return <Card title="About Me" icon={FiBriefcase} onEdit={onEdit} className="about-card">
    <p>{aboutMe || "Tell us about yourself, your interests, skills, goals, and what you’re passionate about."}</p>
  </Card>;
}

function TagCard({title,icon:Icon,items,onEdit}) {
  return <Card title={title} icon={Icon} onEdit={onEdit} className="tag-card">
    <div className="tag-list">{items.map(item=><span key={item}>{item}</span>)}</div>
  </Card>;
}

function CareerPreferences({onEdit, personal}) {
  const value = (field, fallback = "Not provided") => field || fallback;
  return <Card title="Career Preferences" icon={FiBriefcase} onEdit={onEdit}>
    <div className="preference-list">
      <InfoRow icon={FiBriefcase} label="Preferred Role" value={value(personal?.preferredRole)}/>
      <InfoRow icon={FiMapPin} label="Preferred Location" value={value(personal?.preferredLocation)}/>
      <InfoRow icon={FiBriefcase} label="Employment Type" value={value(personal?.employmentType)}/>
      <InfoRow icon={FiCalendar} label="Availability" value={value(personal?.availability)}/>
    </div>
  </Card>;
}

function ProfileCompletion({user, academic, personal}) {
  const hasValue = (value) =>
    value !== null &&
    value !== undefined &&
    String(value).trim() !== "";

  // A section is considered complete only when all fields required by that
  // section are actually present. The percentage is calculated from these
  // six real profile sections, not from backend placeholders or unrelated
  // profile features.
  const completionSections = [
    {
      label: "Personal Information",
      complete: [
        user?.fullName,
        user?.email,
        personal?.phoneNumber,
        personal?.city,
        personal?.dateOfBirth,
        personal?.gender
      ].every(hasValue)
    },
    {
      label: "Academic Information",
      complete: [
        academic?.universityName,
        academic?.collegeName,
        academic?.branchName,
        academic?.semesterName,
        academic?.currentStatus,
        academic?.examPatternName || academic?.academicYearName,
        academic?.cgpa,
        academic?.graduationYear
      ].every(hasValue)
    },
    {
      label: "About Me",
      complete: hasValue(personal?.aboutMe)
    },
    {
      label: "Skills",
      complete: Array.isArray(personal?.skills) && personal.skills.length > 0
    },
    {
      label: "Career Preferences",
      complete: [
        personal?.preferredRole,
        personal?.preferredLocation,
        personal?.employmentType,
        personal?.availability
      ].every(hasValue)
    },
    {
      label: "Interests",
      complete: Array.isArray(personal?.interests) && personal.interests.length > 0
    }
  ];

  const completedCount = completionSections.filter((section) => section.complete).length;
  const percentage = Math.round((completedCount / completionSections.length) * 100);
  const degrees = percentage * 3.6;

  const completionTheme =
    percentage >= 80 ? "complete" :
    percentage >= 60 ? "good" :
    percentage >= 30 ? "warning" :
    "critical";

  return (
    <section className={`profile-card completion-card completion-${completionTheme}`}>
      <div className="completion-heading">
        <div>
          <h2><span className="completion-spark">✦</span> Profile Completion</h2>
          <p>
            {percentage === 100
              ? "Your profile is complete!"
              : "Complete the remaining sections to finish your profile."}
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
            <span>Completed</span>
          </div>
        </div>
        <div className="completion-cap" aria-hidden="true">🎓</div>
      </div>

      <ul className="completion-checklist">
        {completionSections.map(({label, complete}) => (
          <li key={label} className={complete ? "done" : "pending"}>
            <span className="completion-status">
              {complete ? <FiCheck /> : null}
            </span>
            <span className="completion-item-name">{label}</span>
            <small>{complete ? "Completed" : "Pending"}</small>
            <FiChevronRight className="completion-arrow" />
          </li>
        ))}
      </ul>

      {percentage < 100 && (
        <button type="button" className="completion-action">
          <FiAward /> Complete Your Profile <FiChevronRight />
        </button>
      )}
    </section>
  );
}
function SocialLinks({onEdit, socialLinks}) {
  const links = [
    ["LinkedIn", FiLinkedin, socialLinks?.linkedinUrl],
    ["GitHub", FiGithub, socialLinks?.githubUrl],
    ["Portfolio", FiCode, socialLinks?.portfolioUrl],
    ["LeetCode", FiCode, socialLinks?.leetcodeUrl]
  ];

  return <Card title="Social Links" icon={FiUsers} onEdit={onEdit} className="social-card">
    {links.map(([label, Icon, url]) => (
      <a
        key={label}
        href={url || "#"}
        target={url ? "_blank" : undefined}
        rel={url ? "noreferrer" : undefined}
        onClick={(event) => { if (!url) event.preventDefault(); }}
      >
        <Icon/>
        <span>
          <b>{label}</b>
          <small>{url || "Not provided"}</small>
        </span>
      </a>
    ))}
  </Card>;
}

export default function ProfilePage() {
  const [editing,setEditing]=useState(null);
  const [user,setUser]=useState(null);
  const [academic,setAcademic]=useState(null);
  const [personal,setPersonal]=useState(null);
  const [socialLinks,setSocialLinks]=useState(null);
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

        const [academicResult, personalResult, socialResult] = await Promise.allSettled([
          getUserAcademicProfile(currentUser.userId),
          getPersonalProfile(),
          getSocialLinks()
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

        if (socialResult.status === "fulfilled") {
          setSocialLinks(socialResult.value.data?.data || null);
        } else if (socialResult.reason?.response?.status !== 404) {
          setError(socialResult.reason?.response?.data?.message || "Unable to load social links.");
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
        <ProfileHero onEdit={() => edit("personal")} user={user} academic={academic} personal={personal}/>
        <ProfileTabs/>
        <div className="profile-content">
          <div className="profile-primary">
            <div className="profile-grid-two">
              <PersonalInformation onEdit={() => edit("personal")} user={user} academic={academic} personal={personal}/>
              <AcademicInformation onEdit={() => edit("academic")} academic={academic}/>
              <AboutMe onEdit={() => edit("about")} personal={personal}/>
              <TagCard title="Skills" icon={FiCode} items={personal?.skills || defaultSkills} onEdit={() => edit("skills")}/>
              <CareerPreferences onEdit={() => edit("career")} personal={personal}/>
              <TagCard title="Interests" icon={FiHeart} items={personal?.interests || defaultInterests} onEdit={() => edit("interests")}/>
            </div>
            <CurrentSemesterSubjectsCard academic={academic}/>
          </div>
          <aside className="profile-right">
            <ProfileCompletion user={user} academic={academic} personal={personal}/>
            <SocialLinks onEdit={() => edit("social")} socialLinks={socialLinks}/>
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
    {editing==="skills"&&<SkillsEditModal
      onClose={()=>setEditing(null)}
      onSaved={(data)=>{setPersonal((current)=>({...current,...(data||{})}));setEditing(null);}}
    />}
    {editing==="career"&&<CareerPreferencesEditModal
      onClose={()=>setEditing(null)}
      onSaved={(data)=>{setPersonal((current)=>({...current,...(data||{})}));setEditing(null);}}
    />}
    {editing==="interests"&&<InterestsEditModal
      onClose={()=>setEditing(null)}
      onSaved={(data)=>{setPersonal((current)=>({...current,...(data||{})}));setEditing(null);}}
    />}
    {editing==="about"&&<AboutMeEditModal
      onClose={()=>setEditing(null)}
      onSaved={(data)=>{setPersonal(data||personal);setEditing(null);}}
    />}
    {editing==="social"&&<SocialLinksEditModal
      onClose={()=>setEditing(null)}
      onSaved={(data)=>{setSocialLinks(data || null);setEditing(null);}}
    />}
    {editing==="academic"&&<AcademicProfileEditModal
      academic={academic}
      onClose={()=>setEditing(null)}
      onSaved={(data)=>{setAcademic(data||academic);setEditing(null);}}
    />}
  </div>;
}
