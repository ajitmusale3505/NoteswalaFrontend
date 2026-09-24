import {FiDatabase} from "react-icons/fi";
import {Link} from "react-router-dom";
export default function SubjectHero({subject}){
 return <section className="subject-hero"><div className="subject-hero-inner"><div className="subject-breadcrumb"><Link to="/resources">Resources</Link><span>›</span><span>Subjects</span><span>›</span><b>{subject.code}</b></div><div className="subject-title-row"><div className="subject-title-icon"><FiDatabase/></div><div><h1>{subject.name}</h1><div className="subject-title-meta"><span>{subject.code}</span><i/><span>Semester {subject.semester}</span><i/><span>{subject.branch}</span><i/><span>{subject.university}</span></div><p>{subject.description}</p></div></div></div></section>;
}
