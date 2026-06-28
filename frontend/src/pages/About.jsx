export default function About() {
  return (
    <div className="page-wrap">
      <div className="about-hero">
        <h1>About</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          A tech blog about things I build and learn.
        </p>
      </div>
      <div className="about-body">
        <p>Thanks for visiting! This is where I write about software, side projects, and ideas I find interesting.</p>
        <p>Feel free to leave a comment on any post — I read them all.</p>
      </div>
    </div>
  )
}
