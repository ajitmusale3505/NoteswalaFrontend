import { FiArrowLeft, FiArrowRight, FiBookOpen, FiDatabase, FiFileText, FiGrid, FiSearch } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import HomeNavbar from "../home/components/HomeNavbar";
import SubjectAbout from "./components/SubjectAbout";
import ResourceDistribution from "./components/ResourceDistribution";
import PopularTopics from "./components/PopularTopics";
import SubjectResources from "./components/SubjectResources";
import "../../styles/subject.css";

const subjects={DBMS:{code:"DBMS",name:"Database Management Systems",total:42},OS:{code:"OS",name:"Operating Systems",total:36},CN:{code:"CN",name:"Computer Networks",total:51},WT:{code:"WT",name:"Web Technologies",total:28},OOMD:{code:"OOMD",name:"Object Oriented Modeling & Design",total:24},STQA:{code:"STQA",name:"Software Testing & QA",total:20},CC:{code:"CC",name:"Cloud Computing",total:26},AI:{code:"AI",name:"Artificial Intelligence",total:18}};

export default function SubjectPage(){
  const {subjectCode}=useParams();
  const subject=subjects[subjectCode?.toUpperCase()]||subjects.DBMS;
  return <div className="subject-page"><HomeNavbar/><main className="subject-main">
    <section className="subject-hero"><div className="subject-hero-copy"><Link to="/resources" className="subject-back"><FiArrowLeft/> Back to Resources</Link><div className="subject-breadcrumb">RESOURCE HUB <span>/</span> {subject.code}</div><h1>{subject.name}</h1><p>Explore {subject.name.toLowerCase()} resources for Semester VI — organized for faster study, revision and exam preparation.</p><div className="subject-meta"><span><FiGrid/> Computer Engineering</span><span><FiBookOpen/> Semester VI</span><span><FiFileText/> SPPU</span></div></div><div className="subject-hero-card"><div className="subject-hero-icon"><FiDatabase/></div><span>SUBJECT LIBRARY</span><strong>{subject.total}</strong><small>curated resources</small><Link to="#latest-resources">Explore resources <FiArrowRight/></Link></div></section>
    <section className="subject-search"><FiSearch/><input placeholder={"Search "+subject.code+" notes, PYQs, books or topics..."}/><button>Search</button></section>
    <section className="subject-grid-top"><SubjectAbout subject={subject}/><ResourceDistribution total={subject.total}/></section>
    <PopularTopics/><div id="latest-resources"><SubjectResources/></div>
  </main></div>;
}
