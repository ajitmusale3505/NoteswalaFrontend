import {useState} from "react";
import HomeNavbar from "../home/components/HomeNavbar";
import SubjectHero from "./components/SubjectHero";
import SubjectStats from "./components/SubjectStats";
import SubjectTabs from "./components/SubjectTabs";
import StudyMaterialSidebar from "./components/StudyMaterialSidebar";
import SubjectResourceList from "./components/SubjectResourceList";
import AboutSubject from "./components/AboutSubject";
import ResourceDistribution from "./components/ResourceDistribution";
import PopularTopics from "./components/PopularTopics";
import {getSubject} from "./subjectData";
import "../../styles/subject.css";

export default function SubjectPage(){
 const {pathname}=window.location;
 const code=pathname.split("/").filter(Boolean).pop()?.toUpperCase()||"DBMS";
 const subject=getSubject(code);
 const [activeTab,setActiveTab]=useState("Overview");
 const [activeSection,setActiveSection]=useState("Notes");
 return <div className="subject-page">
  <HomeNavbar/>
  <main className="subject-main">
   <SubjectHero subject={subject}/>
   <SubjectStats subject={subject}/>
   <SubjectTabs activeTab={activeTab} setActiveTab={setActiveTab}/>
   <section className="subject-content">
    <StudyMaterialSidebar activeSection={activeSection} setActiveSection={setActiveSection}/>
    <SubjectResourceList subject={subject}/>
    <aside className="subject-right-rail"><AboutSubject subject={subject}/><ResourceDistribution subject={subject}/><PopularTopics subject={subject}/></aside>
   </section>
  </main>
 </div>;
}
