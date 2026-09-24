const distribution = [["PYQs",12,29],["Notes",9,21],["Practicals",7,17],["Important Questions",8,19],["Books & Guides",6,14]];
export default function ResourceDistribution({ total }) {
  return (
    <section className="subject-panel subject-distribution">
      <div className="subject-panel-heading"><div><span className="subject-eyebrow">RESOURCE DISTRIBUTION</span><h2>Everything you need, organized.</h2></div><strong>{total}<small>resources</small></strong></div>
      <div className="distribution-list">{distribution.map(([label,count,width]) => <div className="distribution-row" key={label}><div><span>{label}</span><b>{count}</b></div><div className="distribution-track"><span style={{width:width+"%"}} /></div></div>)}</div>
    </section>
  );
}
