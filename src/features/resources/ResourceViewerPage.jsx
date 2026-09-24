import {useMemo,useState} from "react";
import {FiBookmark,FiBookOpen,FiCalendar,FiChevronDown,FiDownload,FiFileText,FiGrid,FiMaximize,FiMessageSquare,FiPrinter,FiRotateCw,FiSearch,FiShare2,FiStar,FiUser,FiZoomIn,FiZoomOut,FiChevronUp,FiMoreHorizontal} from "react-icons/fi";
import {Link,useParams} from "react-router-dom";
import HomeNavbar from "../home/components/HomeNavbar";
import {getSubject} from "../subjects/subjectData";
import "../../styles/resource-viewer.css";

const slugify=value=>value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
function buildViewerResource(subject,resourceId){
 const resources=subject.resources||[];
 const index=resources.findIndex(r=>slugify(r[0])===resourceId);
 const item=index>=0?resources[index]:resources[0];
 if(!item)return {title:"Study Resource",description:subject.description,unit:"Unit I",size:"1.8 MB",rating:subject.rating,reviews:"120",downloads:"890",type:"Notes"};
 return {title:item[0],description:item[1],unit:item[2],size:item[3],rating:item[4],reviews:item[5],downloads:item[6],type:item[7],index:index<0?0:index};
}

const CODE_TYPES=new Set(["java","c","c++","cpp","python","javascript","js","typescript","ts","c#","csharp"]);
const isCodeResource=resource=>CODE_TYPES.has(String(resource.type||"").toLowerCase())||/\\.(java|c|cpp|py|js|ts|cs)$/i.test(resource.title||"")||/\\b(java|c\\+\\+|cpp|python|javascript|typescript|program|practical|source code|coding)\\b/i.test((resource.title+" "+resource.description).toLowerCase());
const languageLabel=resource=>String(resource.type||"Java").toLowerCase()==="cpp"?"C++":String(resource.type||"Java");
const codeSamples={
 Java:{file:"Main.java",folder:"src",code:`import java.sql.*;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        System.out.println("===== Student Management System =====");
        System.out.println("1. Add Student");
        System.out.println("2. View All Students");
        System.out.println("3. Update Student");
        System.out.println("4. Delete Student");
        System.out.println("5. Exit");

        System.out.print("Enter choice: ");
        int choice = sc.nextInt();

        switch (choice) {
            case 1:
                StudentDAO.addStudent(sc);
                break;
            case 2:
                StudentDAO.viewStudents();
                break;
            case 3:
                StudentDAO.updateStudent(sc);
                break;
            case 4:
                StudentDAO.deleteStudent(sc);
                break;
            case 5:
                System.out.println("Exiting...");
                break;
            default:
                System.out.println("Invalid choice");
        }
    }
}`},
 Python:{file:"student_management.py",folder:"src",code:`import mysql.connector

def add_student(cursor, connection):
    name = input("Enter student name: ")
    branch = input("Enter branch: ")
    year = int(input("Enter year: "))

    cursor.execute(
        "INSERT INTO student(name, branch, year) VALUES (%s, %s, %s)",
        (name, branch, year)
    )
    connection.commit()
    print("Student added successfully")

def view_students(cursor):
    cursor.execute("SELECT id, name, branch, year FROM student")
    for row in cursor.fetchall():
        print(row)

print("===== Student Management System =====")
`},
 "C++":{file:"main.cpp",folder:"src",code:`#include <iostream>
#include <vector>
using namespace std;

struct Student {
    int id;
    string name;
    string branch;
    int year;
};

int main() {
    vector<Student> students;
    int choice;

    cout << "===== Student Management System =====" << endl;
    cout << "1. Add Student" << endl;
    cout << "2. View All Students" << endl;
    cout << "3. Update Student" << endl;
    cout << "4. Delete Student" << endl;
    cout << "Enter choice: ";
    cin >> choice;

    return 0;
}`},
 C:{file:"main.c",folder:"src",code:`#include <stdio.h>

typedef struct {
    int id;
    char name[100];
    char branch[50];
    int year;
} Student;

int main(void) {
    Student student;
    printf("===== Student Management System =====\\n");
    printf("Enter student name: ");
    scanf("%99s", student.name);
    printf("Enter branch: ");
    scanf("%49s", student.branch);
    return 0;
}`}
};
function CodeTabs({active,setActive}){
 const tabs=["Code Lab","Description","Screenshots","Related Resources (6)","Reviews (120)"];
 return <nav className="code-view-tabs">{tabs.map((tab,i)=><button key={tab} className={i===active?"active":""} onClick={()=>setActive(i)}>{tab}</button>)}</nav>
}
function CodeProblemPanel({resource}){
 return <aside className="code-problem-panel"><section><h2>▣ <span>Problem Statement</span></h2><p>Develop a {languageLabel(resource)} program to perform CRUD operations on a Student table using JDBC and MySQL.</p></section><section className="code-callout"><h3>✦ Requirements</h3><ul><li>Use MySQL database</li><li>Create Student table with required fields</li><li>Perform Insert, View, Update and Delete operations</li><li>Use database connectivity</li><li>Handle exceptions properly</li></ul></section><section><h2>▣ <span>Database Schema</span></h2><pre className="schema-box">CREATE TABLE student ({"\n"}  id INT PRIMARY KEY AUTO_INCREMENT,{"\n"}  name VARCHAR(100),{"\n"}  branch VARCHAR(50),{"\n"}  year INT{"\n"});</pre></section><section><h2>▣ <span>Sample Output</span></h2><pre className="output-box">1. Add Student{"\n"}2. View All Students{"\n"}3. Update Student{"\n"}4. Delete Student{"\n"}5. Exit{"\n"}{"\n"}Enter choice:</pre></section></aside>
}
function CodeFilesPanel({sample}){
 return <aside className="code-files-panel"><header><b>▣ &nbsp;Files</b><FiMoreHorizontal/></header><div className="file-tree"><div className="tree-root">▣ &nbsp;StudentManagement</div><div className="tree-folder">⌄ &nbsp;📁 src</div><div className="tree-folder child">⌄ &nbsp;📁 {sample.folder}</div><button className="tree-file selected">▣ &nbsp;{sample.file}</button><button className="tree-file">▣ &nbsp;Student.java</button><button className="tree-file">▣ &nbsp;StudentDAO.java</button><button className="tree-file">▣ &nbsp;DBConnection.java</button><div className="tree-folder">⌄ &nbsp;📁 lib</div><button className="tree-file child">▣ &nbsp;mysql-connector.jar</button><button className="tree-file">▣ &nbsp;README.md</button></div></aside>
}
function CodeEditor({sample,language}){
 const lines=sample.code.split("\n");
 return <section className="code-editor-panel"><header><div><span className="editor-tab active">☕ &nbsp;{sample.file}</span><span className="editor-close">×</span><span className="editor-plus">＋</span></div><div className="editor-actions"><button>☕ &nbsp;{language} (JDK 17)⌄</button><button>⚙</button><button>⛶</button></div></header><div className="code-editor-body"><div className="code-gutter">{lines.map((_,i)=><span key={i}>{i+1}</span>)}</div><pre>{lines.map((line,i)=><code key={i}>{highlightCode(line,language)}{"\n"}</code>)}</pre><div className="code-minimap">{lines.slice(0,24).map((line,i)=><span key={i} style={{width:Math.max(18,Math.min(92,line.length/1.4))+"%"}}>{line||" "}</span>)}</div></div><div className="code-console"><header><b>▣ &nbsp;Console / Output</b><span>Errors</span><button>Clear</button></header><pre>===== Student Management System ====={"\n"}1. Add Student{"\n"}2. View All Students{"\n"}3. Update Student{"\n"}4. Delete Student{"\n"}5. Exit{"\n"}Enter choice: ▌</pre></div></section>
}
function highlightCode(line,language){
  const parts=line.split(/(\b(?:public|private|class|static|void|int|return|new|import|from|def|if|else|switch|case|break|include|using|namespace|struct|const|for|while)\b|"[^"]*"|'[^']*'|\b\d+\b|\/\/.*$)/g);
  return parts.map((part,i)=>{if(/^".*"$|^'.*'$/.test(part))return <span className="tok-string" key={i}>{part}</span>;if(/^\d+$/.test(part))return <span className="tok-number" key={i}>{part}</span>;if(/^\/\//.test(part))return <span className="tok-comment" key={i}>{part}</span>;if(/^(public|private|class|static|void|int|return|new|import|from|def|if|else|switch|case|break|include|using|namespace|struct|const|for|while)$/.test(part))return <span className="tok-keyword" key={i}>{part}</span>;return <span key={i}>{part}</span>});
}
function CodeRunPanel({language}){
 return <aside className="code-run-panel"><header><h2>▶ &nbsp;Run Configuration</h2><button>⟳ &nbsp;Reset</button></header><label>Language</label><button className="language-select">☕ &nbsp; {language} (JDK 17)<span>⌄</span></button><div className="input-label"><label>Input (Optional)</label><a>Load Sample</a></div><textarea placeholder="Enter custom input here..."/><div className="run-actions"><button className="run-code">▶ &nbsp; Run Code</button><button className="stop-code">■ &nbsp; Stop</button></div><div className="execution-info"><h4>Execution Info</h4><div><span>Time: 1.2s</span><span>Memory: 42 MB</span><span>Status: <b>Success</b></span></div></div><section className="sample-inputs"><header><h3>▣ &nbsp;Sample Inputs⌄</h3><button>Use</button></header>{["Add new student","View all students","Update student by ID","Delete student by ID"].map((item,i)=><div key={item}><b>{i+1}</b><span>{item}</span></div>)}</section><section className="code-related"><header><h3>▤ &nbsp;Related Resources</h3><a>View All →</a></header><div><span>SQL</span><p><b>DBMS - Database Setup Script</b><small>SQL · Setup · 5.2 KB</small></p>⌄</div><div><span>PDF</span><p><b>DBMS Practical Manual</b><small>Manual · PDF · 1.8 MB</small></p>⌄</div></section></aside>
}
function CodeViewer({subject,resource}){
 const language=languageLabel(resource),sample=codeSamples[language]||codeSamples.Java; const [tab,setTab]=useState(0);
 return <div className="code-viewer"><div className="code-hero"><div className="code-breadcrumb"><Link to="/resources">Resources</Link><span>›</span><Link to={"/resources/"+subject.code}>{subject.code}</Link><span>›</span><span>{resource.type}</span><span>›</span><b>{resource.title}</b></div><div className="code-resource-head"><div className="code-resource-icon">&lt;/&gt;</div><div className="code-resource-info"><div className="code-title-line"><h1>{resource.title}</h1><label>{language}</label></div><div className="code-meta"><span>{subject.code}</span><i/><span>Semester {subject.semester}</span><i/><span>{subject.branch}</span><i/><span>SPPU</span></div><p>{resource.description||"Practical implementation with source code, database setup and examples."}</p><div className="code-facts"><span>★ <b>{resource.rating||"4.8"}</b> ({resource.reviews||"120"} reviews)</span><span>⇩ {resource.downloads||"2.4K"} downloads</span><span>◉ 5.1K views</span><span>▣ Uploaded on 14 Mar 2025</span><span>♙ By Amit Verma</span><label>Verified Contributor</label></div></div><div className="code-head-actions"><button>▱ Save</button><button>↗ Share</button><button>⇩ Download</button><button>•••</button></div></div></div><CodeTabs active={tab} setActive={setTab}/><div className="code-workspace"><CodeProblemPanel resource={resource}/><div className="code-main"><div className="code-main-grid"><CodeFilesPanel sample={sample}/><CodeEditor sample={sample} language={language}/><CodeRunPanel language={language}/></div></div></div></div>
}
\nfunction DocumentPreview({subject,resource,page,setPage}){
 const [zoom,setZoom]=useState(100); const isDbms=subject.code==="DBMS";
 const sections=isDbms?[["2.1","Relational Model","A relational model represents data in the form of tables (relations).","Each table consists of rows (tuples) and columns (attributes).","It provides a simple and intuitive way to organize and access data.","Proposed by E. F. Codd in 1970."],["2.2","Keys in Relational Model","Super Key: A set of attributes that uniquely identifies a tuple.","Candidate Key: A minimal super key.","Primary Key: Selected candidate key.","Foreign Key: Attribute that references primary key of another relation."]]:[["1.1","Core Concepts","This section introduces the fundamental concepts and terminology of the subject.","Understand the core definitions, models and practical concepts before moving ahead.","Use examples and diagrams to reinforce your understanding.","Review the important points at the end of the unit."]];
 const title=isDbms?"Relational Model & Normalization":resource.title.replace(/^.*?-\s*/,"");
 return <div className="document-frame"><div className="document-toolbar"><div className="document-tools-left"><button><FiGrid/></button><button><FiFileText/></button><button><FiSearch/></button><span className="toolbar-divider"/><button onClick={()=>setPage(Math.max(1,page-1))}><FiChevronUp/></button><button onClick={()=>setPage(Math.min(62,page+1))}><FiChevronDown/></button><span className="page-counter">{page} / 62</span><span className="toolbar-divider"/></div><div className="document-tools-right"><button onClick={()=>setZoom(Math.max(70,zoom-10))}><FiZoomOut/></button><span>{zoom}%</span><button onClick={()=>setZoom(Math.min(130,zoom+10))}><FiZoomIn/></button><span className="toolbar-divider"/><button><FiMaximize/></button><button><FiRotateCw/></button><button><FiDownload/></button><button><FiPrinter/></button><button><FiMaximize/></button></div></div><div className="document-stage"><article className="document-page" style={{transform:"scale("+zoom/100+")",transformOrigin:"top center"}}><div className="document-unit">Unit {isDbms?"II":"I"}</div><h1>{title}</h1><div className="document-rule"/>{sections.map(([num,heading,...lines])=><section className="document-section" key={num}><h2><span>{num}</span> {heading}</h2><ul>{lines.map(line=><li key={line}>{line}</li>)}</ul>{isDbms&&num==="2.1"&&<div className="student-table"><strong>Student Table (Relation)</strong><table><thead><tr><th>Roll_No</th><th>Name</th><th>Branch</th><th>Year</th></tr></thead><tbody><tr><td>101</td><td>Aarti</td><td>Computer</td><td>3</td></tr><tr><td>102</td><td>Rahul</td><td>IT</td><td>3</td></tr><tr><td>103</td><td>Sneha</td><td>Computer</td><td>3</td></tr></tbody></table><small>Tuple (Row) → Attribute (Column)</small></div>}</section>)}<div className="document-section"><h2>Practice & Revision</h2><p>Use the examples in this unit to revise the important concepts and prepare for university examinations.</p></div></article></div><div className="document-statusbar"><span><FiFileText/> {resource.title}.pdf</span><span>{page} / 62</span><span>{resource.size}</span><button><FiMaximize/></button></div></div>
}
function Outline({subject}){
 const sections=subject.code==="DBMS"?[["1. Introduction",["1.1  Database System","1.2  File System vs DBMS","1.3  Advantages of DBMS"],"1"],["2. Relational Model",["2.1  Structure","2.2  Keys","2.3  Relational Algebra"],"5"],["3. Normalization",["3.1  Functional Dependency","3.2  1NF","3.3  2NF","3.4  3NF","3.5  BCNF"],"12"],["4. Examples",[],"30"],["5. Practice Questions",[],"38"]]:[["1. Introduction",["1.1  Overview","1.2  Core Concepts","1.3  Architecture"],"1"],["2. Fundamentals",["2.1  Basic Concepts","2.2  Important Models","2.3  Key Terminology"],"6"],["3. Practical Concepts",["3.1  Examples","3.2  Problem Solving","3.3  Revision"],"14"],["4. Examples",[],"28"],["5. Practice Questions",[],"36"]];
 return <aside className="viewer-outline"><div className="outline-tabs"><button className="active">Outline</button><button>Thumbnails</button><button>Bookmarks</button></div><div className="outline-tree">{sections.map(([title,children,page],i)=><div className="outline-group" key={title}><button className="outline-heading"><FiChevronDown/><b>{title}</b><span>{page}</span></button>{children.map((child,j)=><button className="outline-child" key={child}><span>{child}</span><em>{Number(page)+j+1}</em></button>)}</div>)}</div><button className="document-search"><FiSearch/> Search in Document</button></aside>
}
function ReadingProgress({page}){
 const [complete,setComplete]=useState(false),[saved,setSaved]=useState(false),progress=Math.round(page/62*100);
 return <aside className="viewer-right"><section className="viewer-side-card reading-card"><h3><FiFileText/> Reading Progress</h3><div className="reading-progress"><div className="progress-ring" style={{"--progress":progress*3.6+"deg"}}><strong>{progress}%</strong></div><div><p>{page} of 62 pages</p><div className="thin-progress"><span style={{width:progress+"%"}}/></div></div></div><button className="complete-button" onClick={()=>setComplete(!complete)}><span>✓</span>{complete?"Completed":"Mark as Complete"}<FiBookmark/></button><button className="download-pdf"><FiDownload/> Download PDF</button><div className="side-actions"><button onClick={()=>setSaved(!saved)} className={saved?"saved":""}><FiBookmark/> {saved?"Saved":"Save"}</button><button><FiShare2/> Share</button><button><FiMessageSquare/> Report</button></div></section><section className="viewer-side-card rating-card"><h3>Rate this Resource</h3><div className="stars"><span>★ ★ ★ ★</span><i>☆</i><b>4.7 <small>(430 reviews)</small></b></div></section><section className="viewer-side-card reviews-card"><header><h3><FiMessageSquare/> Reviews</h3><a>View All →</a></header><article><span className="review-avatar purple">A</span><div><b>Anjali Patil</b><div className="review-stars">★★★★</div><p>Very well structured notes with clear explanations and examples. Helpful for exam preparation.</p><small>12 Mar 2025</small></div></article><article><span className="review-avatar dark">R</span><div><b>Rohit Jadhav</b><div className="review-stars">★★★★☆</div><p>Good notes. Diagrams are very helpful. Some more solved examples would be great.</p><small>28 Feb 2025</small></div></article></section><section className="viewer-side-card related-card"><header><h3>Related Resources</h3><a>View All →</a></header><div className="related-row"><span className="related-cover">DBMS</span><div><b>Unit II - Solved Examples</b><small>DBMS · Solutions</small><span>★ 4.6 &nbsp;|&nbsp; 1.8K downloads</span></div><FiDownload/></div><div className="related-row"><span className="related-cover blue">Unit</span><div><b>Normalization Practice Questions</b><small>DBMS · Question Bank</small><span>★ 4.8 &nbsp;|&nbsp; 1.2K downloads</span></div><FiDownload/></div></section></aside>
}
export default function ResourceViewerPage(){
 const {subjectCode,resourceId}=useParams(),subject=getSubject((subjectCode||"DBMS").toUpperCase());
 const resource=useMemo(()=>buildViewerResource(subject,resourceId||""),[subject,resourceId]); const [page,setPage]=useState(15);\n if(isCodeResource(resource)) return <CodeViewer subject={subject} resource={resource}/>;
 return <div className="resource-viewer-page"><HomeNavbar/><main><div className="viewer-hero"><div className="viewer-breadcrumb"><Link to="/resources">Resources</Link><span>›</span><Link to={"/resources/"+subject.code}>{subject.code}</Link><span>›</span><span>{resource.type}</span><span>›</span><b>{resource.title}</b></div><div className="viewer-resource-head"><div className="viewer-cover"><FiBookOpen/></div><div className="viewer-resource-info"><div className="viewer-title-line"><h1>{resource.title}</h1><label>{resource.type}</label></div><div className="viewer-meta"><span>{subject.code}</span><i/><span>Semester {subject.semester}</span><i/><span>{subject.branch}</span><i/><span>SPPU</span></div><p>{resource.description} Detailed examples, diagrams and practice questions.</p><div className="viewer-facts"><span><FiStar/><b>{resource.rating}</b> ({resource.reviews} reviews)</span><span><FiDownload/>{resource.downloads}</span><span><FiSearch/>2.1K views</span><span><FiCalendar/>Uploaded on 12 Mar 2025</span><span><FiUser/>By Priya Sharma</span><label>Top Contributor</label></div></div></div></div><div className="viewer-workspace"><Outline subject={subject}/><DocumentPreview subject={subject} resource={resource} page={page} setPage={setPage}/><ReadingProgress page={page}/></div></main></div>
}