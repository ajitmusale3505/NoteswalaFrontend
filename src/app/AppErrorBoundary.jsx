import { Component } from "react";

export default class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Noteswala UI error:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"32px",fontFamily:"system-ui",background:"#fff",color:"#102b45"}}>
        <section style={{maxWidth:"720px",width:"100%",padding:"32px",border:"1px solid #e3e8eb",borderRadius:"16px",boxShadow:"0 18px 50px rgba(16,43,69,.08)"}}>
          <p style={{margin:"0 0 8px",fontSize:"12px",letterSpacing:".14em",textTransform:"uppercase",color:"#a77543"}}>EduHub</p>
          <h1 style={{margin:"0 0 12px",fontSize:"28px"}}>The page could not be rendered.</h1>
          <p style={{margin:"0 0 20px",color:"#627286"}}>Open the browser console for the exact runtime error. The application is no longer allowed to fail into a blank screen.</p>
          <button onClick={() => window.location.reload()} style={{border:0,borderRadius:"7px",padding:"11px 18px",background:"#102f48",color:"#fff",cursor:"pointer"}}>Reload page</button>
        </section>
      </main>
    );
  }
}