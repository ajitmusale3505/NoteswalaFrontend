import {FiPieChart} from "react-icons/fi";
export default function ResourceDistribution({subject}){
 let offset=0; const colors=["blue","red","green","purple","gray"];
 const segments=subject.distribution.map(([label,count,percent],i)=>{const p=parseFloat(percent);const item={label,count,percent:p,color:colors[i],offset};offset+=p;return item});
 const gradient=segments.map(s=>"var(--dist-"+s.color+") "+s.offset+"% "+(s.offset+s.percent)+"%").join(",");
 return <section className="subject-side-card distribution-card"><h3><FiPieChart/> Resource Distribution</h3><div className="distribution-content"><div className="donut" style={{background:"conic-gradient("+gradient+")"}}><div><strong>{subject.stats.total}</strong><span>Resources</span></div></div><div className="distribution-legend">{segments.map(s=><div key={s.label}><i className={s.color}/><span>{s.label}</span><b>{s.count}</b><em>({s.percent}%)</em></div>)}</div></div></section>
}
