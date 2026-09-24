import {FiChevronRight,FiTrendingUp} from "react-icons/fi";
export default function PopularTopics({subject}){return <section className="subject-side-card popular-topics"><h3><FiTrendingUp/> Popular Topics</h3><div>{subject.topics.map(([topic,count])=><button key={topic}><span><FiChevronRight/>{topic}</span><small>{count} resources</small></button>)}</div></section>}
