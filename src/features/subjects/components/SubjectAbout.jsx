export default function SubjectAbout({ subject }) {
  return (
    <section className="subject-panel subject-about">
      <div className="subject-panel-heading">
        <div>
          <span className="subject-eyebrow">ABOUT THE SUBJECT</span>
          <h2>Build a strong foundation in {subject.name}.</h2>
        </div>
      </div>
      <p>Explore organized study material for {subject.name}, including previous year papers, notes, practicals, important questions and curated learning resources.</p>
      <div className="subject-about-points"><span>University aligned</span><span>Semester VI</span><span>Curated resources</span></div>
    </section>
  );
}
