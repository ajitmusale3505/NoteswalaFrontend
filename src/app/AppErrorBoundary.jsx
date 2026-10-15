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

    const error = this.state.error;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";

    return (
      <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"32px",fontFamily:"system-ui",background:"#fff",color:"#102b45"}}>
        <section style={{maxWidth:"720px",width:"100%",padding:"32px",border:"1px solid #e3e8eb",borderRadius:"16px",boxShadow:"0 18px 50px rgba(16,43,69,.08)"}}>
          <p style={{margin:"0 0 8px",fontSize:"12px",letterSpacing:".14em",textTransform:"uppercase",color:"#a77543"}}>EduHub</p>
          <h1 style={{margin:"0 0 12px",fontSize:"28px"}}>The page could not be rendered.</h1>
          <p style={{margin:"0 0 20px",color:"#627286"}}>The UI failed while rendering. In local development, use the details below to identify the exact component and line.</p>
          {import.meta.env.DEV && (
            <details open style={{margin:"0 0 20px",padding:"12px",border:"1px solid #f0c7c7",borderRadius:"8px",background:"#fff8f8"}}>
              <summary style={{cursor:"pointer",fontWeight:700,color:"#8c2525"}}>Runtime error details</summary>
              <pre style={{maxHeight:"260px",overflow:"auto",whiteSpace:"pre-wrap",overflowWrap:"anywhere",margin:"10px 0 0",fontSize:"12px",lineHeight:1.5,color:"#7b2222"}}>{errorMessage}{errorStack ? "\\n\\n" + errorStack : ""}</pre>
            </details>
          )}
          <button onClick={() => window.location.reload()} style={{border:0,borderRadius:"7px",padding:"11px 18px",background:"#102f48",color:"#fff",cursor:"pointer"}}>Reload page</button>
        </section>
      </main>
    );
  }
}