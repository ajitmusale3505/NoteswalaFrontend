import {useEffect,useMemo,useState} from "react";
import {useParams} from "react-router-dom";
import HomeNavbar from "../home/components/HomeNavbar";
import SubjectHero from "./components/SubjectHero";
import SubjectStats from "./components/SubjectStats";
import SubjectTabs from "./components/SubjectTabs";
import StudyMaterialSidebar from "./components/StudyMaterialSidebar";
import SubjectResourceList from "./components/SubjectResourceList";
import AboutSubject from "./components/AboutSubject";
import ResourceDistribution from "./components/ResourceDistribution";
import PopularTopics from "./components/PopularTopics";
import {getCurrentAcademicSubjects,getUniversities} from "../../services/academicService";
import {getResources} from "../../services/resourceService";
import "../../styles/subject.css";

const presentationTones=["cream","blue","red","green"];

const unwrap=response=>response?.data?.data??response?.data??[];

const text=value=>String(value??"").toLowerCase();

function classifyResource(resource){
 const value=text(resource?.materialType)+" "+text(resource?.documentType)+" "+text(resource?.title)+" "+text(resource?.tags);
 if(value.includes("pyq")||value.includes("previous year")||value.includes("question paper"))return "PYQs";
 if(value.includes("practical")||value.includes("laboratory")||value.includes("lab"))return "Practicals";
 if(value.includes("book"))return "Books";
 if(value.includes("note"))return "Notes";
 return "Others";
}

function buildSubject(rawSubject,resources,universityName){
 const subjectName=rawSubject.subjectName||"Subject";
 const subjectCode=rawSubject.subjectCode||rawSubject.code||"";
 const subjectResources=resources.filter(resource=>
   text(resource?.subjectName)===text(subjectName) &&
   (!rawSubject.branchName || !resource?.branchName || text(resource.branchName)===text(rawSubject.branchName)) &&
   (!rawSubject.semesterNumber || resource?.semesterNumber==null || Number(resource.semesterNumber)===Number(rawSubject.semesterNumber))
 );

 const counts={Notes:0,PYQs:0,Practicals:0,Books:0,Others:0};
 subjectResources.forEach(resource=>{counts[classifyResource(resource)]++;});

 const stats={
   total:subjectResources.length,
   pyqs:counts.PYQs,
   notes:counts.Notes,
   practicals:counts.Practicals,
   books:counts.Books,
   other:counts.Others,
   rating:subjectResources.length
     ? (subjectResources.reduce((sum,r)=>sum+Number(r.ratingAverage||0),0)/subjectResources.filter(r=>r.ratingAverage!=null).length||0).toFixed(1)
     : "0.0"
 };

 const distribution=Object.entries(counts).map(([label,count])=>[
   label,
   count,
   stats.total?Math.round((count/stats.total)*100)+"%":"0%"
 ]);

 const resourcesData=subjectResources.map((resource,index)=>[
   resource.title||"Untitled Resource",
   resource.description||`Study material for ${subjectName}.`,
   resource.version||"Resource",
   resource.fileSizeBytes?((resource.fileSizeBytes/1024/1024).toFixed(1)+" MB"):"—",
   resource.ratingAverage!=null?Number(resource.ratingAverage).toFixed(1):"—",
   String(resource.ratingCount||0),
   resource.downloadsCount?String(resource.downloadsCount)+" downloads":"0 downloads",
   resource.materialType||resource.documentType||"Resource",
   resource.published?"Published":"Available",
   presentationTones[index%presentationTones.length]
 ]);

 const topicCounts=new Map();
 subjectResources.forEach(resource=>{
   String(resource.tags||"").split(/[,;|]/).map(v=>v.trim()).filter(Boolean).forEach(tag=>{
     topicCounts.set(tag,(topicCounts.get(tag)||0)+1);
   });
 });
 const topics=[...topicCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);

 return {
   code:subjectCode,
   name:subjectName,
   description:`Explore notes, previous-year papers, practicals, books and other study material for ${subjectName}.`,
   semester:rawSubject.semesterNumber??rawSubject.semester??"—",
   branch:rawSubject.branchName||"—",
   university:universityName||"—",
   credits:rawSubject.credits??0,
   rating:stats.rating,
   stats,
   distribution,
   topics,
   resources:resourcesData
 };
}

export default function SubjectPage(){
 const {subjectCode}=useParams();
 const code=subjectCode?.toUpperCase()||"";
 const [subject,setSubject]=useState(null);
 const [loadError,setLoadError]=useState(false);
 const [activeTab,setActiveTab]=useState("Overview");
 const [activeSection,setActiveSection]=useState("Notes");

 useEffect(()=>{
   let cancelled=false;
   const load=async()=>{
     try{
       const [academicResponse,resourceResponse,universitiesResponse]=await Promise.all([
         getCurrentAcademicSubjects(),
         getResources(),
         getUniversities()
       ]);
       const academicSubjects=unwrap(academicResponse);
       const resources=unwrap(resourceResponse);
       const universities=unwrap(universitiesResponse);
       const rawSubject=academicSubjects.find(item=>
         String(item.subjectCode||item.code||"").toUpperCase()===code
       );
       if(!cancelled){
         if(!rawSubject){
           setSubject(null);
           setLoadError(true);
           return;
         }
         const university=universities.find(item=>String(item.id)===String(rawSubject.universityId));
         setSubject(buildSubject(rawSubject,Array.isArray(resources)?resources:[],university?.name));
         setLoadError(false);
       }
     }catch{
       if(!cancelled){
         setSubject(null);
         setLoadError(true);
       }
     }
   };
   load();
   return()=>{cancelled=true;};
 },[code]);

 const pageSubject=useMemo(()=>subject||{
   code,
   name:loadError?"Subject unavailable":"Loading...",
   description:loadError?"The selected subject could not be loaded.":"Loading subject information...",
   semester:"—",branch:"—",university:"—",credits:0,rating:"0.0",
   stats:{total:0,pyqs:0,notes:0,practicals:0,books:0,other:0},
   distribution:[],topics:[],resources:[]
 },[subject,code,loadError]);

 return <div className="subject-page">
  <HomeNavbar/>
  <main className="subject-main">
   <SubjectHero subject={pageSubject}/>
   <SubjectStats subject={pageSubject}/>
   <SubjectTabs activeTab={activeTab} setActiveTab={setActiveTab}/>
   <section className="subject-content">
    <StudyMaterialSidebar activeSection={activeSection} setActiveSection={setActiveSection}/>
    <SubjectResourceList subject={pageSubject}/>
    <aside className="subject-right-rail">
     <AboutSubject subject={pageSubject}/>
     <ResourceDistribution subject={pageSubject}/>
     <PopularTopics subject={pageSubject}/>
    </aside>
   </section>
  </main>
 </div>;
}
