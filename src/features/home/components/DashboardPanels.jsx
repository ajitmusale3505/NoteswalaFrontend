import { FiArrowRight, FiChevronRight, FiFileText, FiMoreHorizontal, FiDownload, FiCode, FiBriefcase, FiTarget, FiBookOpen } from "react-icons/fi";
import { communityItems, focusItems, universityItems, learningItems, recommendedItems, careerItems } from "../homeData";

export default function DashboardPanels() {
  return (
    <>
      <div className="home-three-grid">
        <FocusPanel />
        <UniversityPanel />
        <CommunityPanel />
      </div>
      <div className="home-bottom-grid">
        <LearningPanel />
        <RecommendedPanel />
        <CareerPanel />
      </div>
    </>
  );
}

function Panel({title, children, id, action="View All"}) {
  return <section className="home-panel dashboard-panel" id={id}><div className="panel-title"><h2><span />{title}</h2><a href="#top">{action} <FiArrowRight /></a></div>{children}</section>;
}

function FocusPanel(){
 return <Panel title="Today's Focus" id="tasks"><div className="focus-list">{focusItems.map(([date,month,title,sub,tag])=><div className="focus-row" key={title}><span className="date-tile"><b>{date}</b><small>{month}</small></span><span className="focus-icon"><FiFileText /></span><span className="focus-copy"><b>{title}</b><small>{sub}</small></span><em>{tag}</em><FiChevronRight /></div>)}</div></Panel>;
}
function UniversityPanel(){
 return <Panel title="University Updates" id="university"><div className="university-list">{universityItems.map(([date,month,title,sub,tag,tone])=><div className="university-row" key={title}><span className="date-tile"><b>{date}</b><small>{month}</small></span><span className={`update-icon ${tone}`}><FiFileText /></span><span className="update-copy"><b>{title}</b><small>{sub}</small></span>{tag&&<em className={`update-badge ${tone}`}>{tag}</em>}<FiChevronRight /></div>)}</div></Panel>;
}
function CommunityPanel(){
 return <Panel title="Community Activity" id="community"><div className="community-list">{communityItems.map(([avatar,title,tags,stats,status])=><div className="home-community-row" key={title}><span className="community-avatar">{avatar}</span><span className="community-copy"><b>{title}</b><span>{tags.map(t=><i key={t}>{t}</i>)}</span><small>{stats}</small></span>{status&&<em>{status}</em>}<FiChevronRight /></div>)}</div></Panel>;
}
function LearningPanel(){
 return <Panel title="Continue Learning" id="library"><div className="learning-grid">{learningItems.map(([title,sub,unit,progress])=><div className="learning-card" key={title}><div className="learning-cover"><FiBookOpen /><span>{title}</span></div><div className="learning-copy"><b>{title}</b><small>{sub}</small><small>{unit}</small><div><span className="circle-progress" style={{"--progress":progress}} /><strong>{progress}</strong><button type="button">Continue <FiArrowRight /></button></div></div></div>)}</div></Panel>;
}
function RecommendedPanel(){
 return <Panel title="Recommended for You" id="recommendations"><div className="recommended-grid">{recommendedItems.map(([title,sub,size])=><div className="recommended-card" key={title}><span className="recommend-cover"><FiBookOpen /></span><div><b>{title}</b><small>{sub}</small><span><i>PDF</i>{size}<FiDownload /></span></div></div>)}</div></Panel>;
}
function CareerPanel(){
 return <Panel title="Career Progress" id="career" action="View Details"><div className="career-list">{careerItems.map(([title,,progress])=><div className="career-row" key={title}><span>{title==="DSA"?<FiCode/>:title.includes("SQL")?<FiDatabaseIcon/>:title.includes("Resume")?<FiFileText/>:<FiBriefcase/>}</span><b>{title}</b><div><i style={{width:progress}} /></div><small>{progress}</small></div>)}</div></Panel>;
}
function FiDatabaseIcon(){return <FiTarget/>}