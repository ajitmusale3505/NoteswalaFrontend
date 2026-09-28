import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft, FiArrowRight, FiAward, FiBell, FiBookOpen, FiBriefcase,
  FiCalendar, FiCheck, FiChevronDown, FiCode, FiCpu, FiDatabase, FiGlobe,
  FiLayers, FiMapPin, FiPhone, FiServer, FiTarget, FiUser, FiUsers, FiX, FiZap
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  createAcademicProfile, getAcademicYearsByUniversity, getBranchesByCollege,
  getCollegesByUniversity, getSemestersByAcademicYear, getUniversities,
  updateAcademicProfile
} from "../../services/academicService";
import { CITY_BY_STATE, INDIAN_STATES } from "./locationData";

const steps=[
  ["Academic Details","University, College, Branch"],
  ["Personal Details","Basic information"],
  ["Select Subjects","Regular, Elective, Practical, Honor"],
  ["Preferences (Optional)","Interests and goals"]
];
const regular=["Theory of Computation","Database Management Systems","Computer Networks & Security","Operating Systems","Web Technologies","Software Engineering","Object Oriented Modeling & Design","Discrete Structures"];
const electives=["Cloud Computing","Artificial Intelligence","Data Science & Big Data Analytics","Cyber Security","Internet of Things","Blockchain Technology"];
const practicals=["DBMS Lab","Web Technologies Lab","Computer Networks Lab","System Programming Lab"];
const honors=["Machine Learning","Full Stack Development","Research Methodology","Entrepreneurship Development"];
const interests=["Web Development","App Development","Data Science","AI & ML","Cloud Computing","Cyber Security","Database","DSA & Competitive Programming","UI/UX Design","DevOps","Networking","Operating Systems","Project Ideas","Research & Innovation"];

const list=(r)=>Array.isArray(r?.data)?r.data:r?.data?.data||[];
const id=(x)=>x?.id??x?.universityId??x?.collegeId??x?.branchId??x?.academicYearId??x?.semesterId;
const name=(x)=>x?.name??x?.universityName??x?.collegeName??x?.branchName??x?.academicYearName??x?.semesterName;

function Field({label,icon:Icon,value,onChange,options,placeholder,disabled=false}){
  return <label className="pc-field"><span><Icon/>{label}<b>*</b></span><div className="pc-select"><select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}><option value="">{placeholder}</option>{options.map(x=><option key={x.value??id(x)} value={x.value??id(x)}>{x.label??name(x)}</option>)}</select><FiChevronDown/></div></label>;
}
function Chip({value,selected,onClick}){return <button type="button" className={"pc-chip "+(selected?"selected":"")} onClick={onClick}><span>{selected&&<FiCheck/>}</span>{value}</button>}

export default function ProfileCompletionModal({user,academic,onCompleted}){
 const [step,setStep]=useState(1),[saving,setSaving]=useState(false);
 const [universities,setUniversities]=useState([]),[colleges,setColleges]=useState([]),[branches,setBranches]=useState([]),[years,setYears]=useState([]),[semesters,setSemesters]=useState([]);
 const [regularSel,setRegularSel]=useState([]),[electiveSel,setElectiveSel]=useState([]),[practicalSel,setPracticalSel]=useState([]),[honorSel,setHonorSel]=useState([]);
 const [goal,setGoal]=useState("Academic Support"),[interestSel,setInterestSel]=useState(["Web Development","AI & ML","Operating Systems"]);
 const [notifications,setNotifications]=useState([true,true,true,true]);
 const [form,setForm]=useState({
   universityId:academic?.universityId||"",collegeId:academic?.collegeId||"",branchId:academic?.branchId||"",
   academicYearId:academic?.academicYearId||"",semesterId:academic?.semesterId||"",
   currentYear:academic?.currentYear?String(academic.currentYear):"",graduationYear:academic?.graduationYear||"",
   phoneNumber:academic?.phoneNumber||"",gender:academic?.gender||"",state:academic?.state||"",city:academic?.city||""
 });

 useEffect(()=>{getUniversities().then(r=>setUniversities(list(r))).catch(()=>toast.error("Unable to load universities."));},[]);
 useEffect(()=>{if(!form.universityId)return;Promise.all([getCollegesByUniversity(form.universityId),getAcademicYearsByUniversity(form.universityId)]).then(([a,b])=>{setColleges(list(a));setYears(list(b));}).catch(()=>toast.error("Unable to load academic data."));},[form.universityId]);
 useEffect(()=>{if(!form.collegeId)return;getBranchesByCollege(form.collegeId).then(r=>setBranches(list(r))).catch(()=>toast.error("Unable to load branches."));},[form.collegeId]);
 useEffect(()=>{if(!form.academicYearId)return;getSemestersByAcademicYear(form.academicYearId).then(r=>setSemesters(list(r))).catch(()=>toast.error("Unable to load semesters."));},[form.academicYearId]);
 useEffect(()=>{if(!academic)return;setForm(f=>({...f,universityId:academic.universityId||f.universityId,collegeId:academic.collegeId||f.collegeId,branchId:academic.branchId||f.branchId,academicYearId:academic.academicYearId||f.academicYearId,semesterId:academic.semesterId||f.semesterId,currentYear:academic.currentYear?String(academic.currentYear):f.currentYear,graduationYear:academic.graduationYear||f.graduationYear,phoneNumber:academic.phoneNumber||f.phoneNumber,gender:academic.gender||f.gender,state:academic.state||f.state,city:academic.city||f.city}));},[academic]);

 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 const toggle=(setter,v)=>setter(a=>a.includes(v)?a.filter(x=>x!==v):[...a,v]);
 const valid=()=>{
   if(step===1 && (!form.universityId||!form.collegeId||!form.branchId||!form.academicYearId||!form.currentYear||!form.state||!form.city)){toast.error("Please complete all required academic and location details.");return false;}
   if(step===2 && (!/^[6-9]\d{9}$/.test(form.phoneNumber)||!form.gender)){toast.error("Enter a valid Indian mobile number and select gender.");return false;}
   if(step===3 && !form.semesterId){toast.error("Select your current semester.");return false;}
   return true;
 };
 const next=()=>valid()&&setStep(s=>Math.min(4,s+1));
 const back=()=>setStep(s=>Math.max(1,s-1));
 const save=async()=>{
   if(!valid()||!form.semesterId){setStep(3);return;}
   const selectedYear=years.find(x=>String(id(x))===String(form.academicYearId));
   const yearName=name(selectedYear)||"";
   const matches=String(yearName).match(/20\d{2}/g)||[];
   const endYear=Number(selectedYear?.endYear||matches.at(-1)||new Date().getFullYear());
   const currentYear=Number(form.currentYear);
   const graduationYear=Number(form.graduationYear)||endYear+Math.max(0,4-currentYear);
   const payload={
     universityId:String(form.universityId),
     collegeId:String(form.collegeId),
     branchId:String(form.branchId),
     academicYearId:String(form.academicYearId),
     semesterId:String(form.semesterId),
     graduationYear,
     phoneNumber:String(form.phoneNumber).trim(),
     gender:form.gender,
     currentYear,
     state:String(form.state).trim(),
     city:String(form.city).trim()
   };
   try{
     setSaving(true);
     if(academic?.id) await updateAcademicProfile(user.userId,payload);
     else await createAcademicProfile(payload);
     toast.success("Profile completed successfully.");
     await onCompleted();
   }catch(e){
     const validationErrors=e?.response?.data?.data;
     const details=validationErrors&&typeof validationErrors==="object"
       ? Object.values(validationErrors).filter(Boolean).join(" • ")
       : "";
     toast.error(details||e?.response?.data?.message||"Unable to save your profile.");
   }finally{setSaving(false);}
 };

 const percent=step*25;
 const firstName=user?.fullName?.split(" ")[0]||"Student";
 return <div className="pc-overlay" role="dialog" aria-modal="true">
   <div className="pc-modal">
     <button className="pc-close" disabled aria-label="Close"><FiX/></button>
     <aside className="pc-sidebar">
       <div className="pc-brand"><FiBookOpen/>EduHub</div>
       <div className="pc-intro">
        <small>Hi {firstName}! 👋</small>
        <h2>{step===1?"Let’s complete":step===2?"Tell us about":step===3?"Choose your":"Almost Done!"}<br/><em>{step===1?"your profile":step===2?"yourself":step===3?"subjects":"Set Your Preferences"}</em></h2>
        <p>{step===1?"Tell us about your academic background so we can show you relevant resources, notes, PYQs and updates.":step===2?"A few more details to personalize your experience.":step===3?"Select the subjects you are currently studying. This helps us show relevant notes, PYQs and practicals.":"Help us personalize your experience with relevant resources, updates and opportunities."}</p>
       </div>
       <div className="pc-steps">{steps.map((x,i)=>{const n=i+1;return <div key={x[0]} className={"pc-step "+(n===step?"active ":"")+(n<step?"done":"")}><span>{n<step?<FiCheck/>:n}</span><div><strong>{x[0]}</strong><small>{x[1]}</small></div></div>})}</div>
       <img className="pc-art" src={"/images/profile-completion/profile-step-"+step+".png"} alt=""/>
     </aside>
     <main className="pc-main">
       <div className="pc-progress-label"><span>Step {step} of 4</span><strong>{percent}%{step===4?"":" Complete"}</strong></div>
       <div className="pc-progress"><i style={{width:percent+"%"}}/></div>
       {step===1&&<section className="pc-screen">
         <header><h1>Academic <em>Details</em></h1><p>Tell us about your university and college so we can show you the most relevant content for your branch and semester.</p></header>
         <div className="pc-grid academic">
           <Field label="University" icon={FiBookOpen} value={form.universityId} onChange={v=>setForm(f=>({...f,universityId:v,collegeId:"",branchId:"",academicYearId:"",semesterId:""}))} options={universities} placeholder="Select university"/>
           <div className="pc-note"><FiAward/><span>Your academic details help us personalize your learning experience.</span></div>
           <Field label="College" icon={FiBriefcase} value={form.collegeId} onChange={v=>setForm(f=>({...f,collegeId:v,branchId:""}))} options={colleges} placeholder="Select college" disabled={!form.universityId}/>
           <Field label="State" icon={FiMapPin} value={form.state} onChange={v=>setForm(f=>({...f,state:v,city:""}))} options={INDIAN_STATES.map(x=>({value:x,label:x}))} placeholder="Select state"/>
           <Field label="City" icon={FiMapPin} value={form.city} onChange={v=>set("city",v)} options={(CITY_BY_STATE[form.state]||[]).map(x=>({value:x,label:x}))} placeholder="Select city" disabled={!form.state}/>
           <Field label="Branch / Department" icon={FiBookOpen} value={form.branchId} onChange={v=>set("branchId",v)} options={branches} placeholder="Select branch" disabled={!form.collegeId}/>
           <Field label="Current Year" icon={FiLayers} value={form.currentYear} onChange={v=>set("currentYear",v)} options={[1,2,3,4].map(x=>({value:String(x),label:x===4?"Final Year (Year 4)":"Year "+x}))} placeholder="Select current year"/>
           <Field label="Academic Year" icon={FiCalendar} value={form.academicYearId} onChange={v=>setForm(f=>({...f,academicYearId:v,semesterId:""}))} options={years} placeholder="Select academic year" disabled={!form.universityId}/>
         </div>
         <div className="pc-info"><FiZap/><span>This information helps us show you:</span><b>Subject-wise notes & PYQs</b><b>Syllabus & curriculum</b><b>Practical manuals & codes</b><b>University updates</b><b>College events & news</b></div>
       </section>}
       {step===2&&<section className="pc-screen">
         <header><h1>Personal <em>Details</em></h1><p>Tell us a bit about yourself. This helps us personalize your experience.</p></header>
         <div className="pc-grid personal">
           <label className="pc-field"><span><FiUser/>Full Name</span><div className="pc-input"><input value={user?.fullName||""} readOnly/></div></label>
           <label className="pc-field"><span><FiBookOpen/>Email Address</span><div className="pc-input muted"><input value={user?.email||""} readOnly/></div></label>
           <label className="pc-field"><span><FiPhone/>Phone Number<b>*</b></span><div className="pc-input phone"><b>🇮🇳 +91</b><input value={form.phoneNumber} onChange={e=>set("phoneNumber",e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="98765 43210"/></div></label>
           <div className="pc-field"><span><FiUsers/>Gender<b>*</b></span><div className="pc-genders">{["MALE","FEMALE","OTHER"].map(x=><button type="button" key={x} className={form.gender===x?"selected":""} onClick={()=>set("gender",x)}>{form.gender===x&&<FiCheck/>}{x[0]+x.slice(1).toLowerCase()}</button>)}</div></div>
         </div>
       </section>}
       {step===3&&<section className="pc-screen">
         <header><h1>Select <em>Subjects</em></h1><p>Choose the subjects you are currently studying. You can select multiple subjects from each category.</p></header>
         <div className="pc-semesters">{semesters.map(x=><button type="button" key={id(x)} className={String(form.semesterId)===String(id(x))?"selected":""} onClick={()=>set("semesterId",String(id(x)))}>{name(x)}</button>)}</div>
         <Subject title="Regular Subjects (Core)" items={regular} selected={regularSel} toggle={v=>toggle(setRegularSel,v)} tone="blue"/>
         <Subject title="Elective Subjects" items={electives} selected={electiveSel} toggle={v=>toggle(setElectiveSel,v)} tone="gold"/>
         <Subject title="Practical Subjects" items={practicals} selected={practicalSel} toggle={v=>toggle(setPracticalSel,v)} tone="green"/>
         <Subject title="Honor Subjects (Optional)" items={honors} selected={honorSel} toggle={v=>toggle(setHonorSel,v)} tone="purple"/>
       </section>}
       {step===4&&<section className="pc-screen">
         <header><h1>Set Your <em>Preferences</em></h1><p>Help us personalize your experience with relevant resources, updates and opportunities.</p></header>
         <div className="pc-pref">
          <div className="pc-pref-section"><h3><FiTarget/>Your Goals</h3><div className="pc-goals">{[["Academic Support",FiBookOpen,"Notes, PYQs, books, syllabus, practicals"],["Career Preparation",FiBriefcase,"Internships, placements, interview preparation"],["Skill Development",FiZap,"Projects, coding, tools, certifications"]].map(([x,I,t])=><button type="button" key={x} className={goal===x?"selected":""} onClick={()=>setGoal(x)}><I/><strong>{x}</strong><small>{t}</small><i>{goal===x&&<FiCheck/>}</i></button>)}</div></div>
          <div className="pc-pref-section"><h3><FiAward/>Areas of Interest</h3><div className="pc-interest">{interests.map(x=><Chip key={x} value={x} selected={interestSel.includes(x)} onClick={()=>toggle(setInterestSel,x)}/>)}</div></div>
          <div className="pc-pref-columns"><div className="pc-pref-section"><h3><FiBell/>Notifications</h3>{["New study materials for my subjects","University updates (results, circulars, etc.)","Internship & job opportunities","Events, webinars and workshops"].map((x,i)=><div className="pc-toggle" key={x}><span>{x}</span><button type="button" className={notifications[i]?"on":""} onClick={()=>setNotifications(n=>n.map((v,j)=>j===i?!v:v))}><i/></button></div>)}</div><div className="pc-pref-stack"><div className="pc-pref-section"><h3><FiGlobe/>Language Preference</h3><div className="pc-small"><button className="selected">✓ English</button><button>Marathi</button></div></div><div className="pc-pref-section"><h3><FiLayers/>Theme Preference</h3><div className="pc-small"><button className="selected">✓ Auto (System)</button><button>Light</button><button>Dark</button></div></div></div></div>
         </div>
       </section>}
       <footer className="pc-actions">{step>1?<button type="button" className="pc-back" onClick={back}><FiArrowLeft/>Back</button>:<span/>}{step<4?<button type="button" className="pc-next" onClick={next}>Next<FiArrowRight/></button>:<button type="button" className="pc-next" onClick={save} disabled={saving}>{saving?"Saving...":"Complete Profile"}<FiArrowRight/></button>}</footer>
     </main>
   </div>
 </div>;
}

function Subject({title,items,selected,toggle,tone}){
 return <section className={"pc-subject "+tone}><header><div><FiBookOpen/><strong>{title}</strong><small>Select subjects from available list</small></div><b>{selected.length} selected</b></header><div>{items.map(x=><Chip key={x} value={x} selected={selected.includes(x)} onClick={()=>toggle(x)}/>)}</div></section>;
}
