import { FiBookOpen, FiBriefcase, FiCalendar, FiCheckCircle, FiClipboard, FiCode, FiFileText, FiGrid, FiList, FiMessageCircle, FiPenTool, FiTarget, FiTool, FiTrendingUp, FiUsers } from "react-icons/fi";

export const homeNavItems = [
  ["Home", "/", FiBookOpen],
  ["Resources", "#resources", FiFileText],
  ["Community", "#community", FiUsers],
  ["University", "#university", FiBookOpen],
  ["Career", "#career", FiTrendingUp],
  ["Library", "#library", FiBookOpen],
  ["Tools", "#tools", FiGrid],
];

export const quickAccess = [
  ["PYQs", "Previous Year Papers", FiFileText, "blue"],
  ["Notes", "Subject-wise Notes", FiBookOpen, "green"],
  ["Practicals", "Manuals & Codes", FiPenTool, "orange"],
  ["Books", "Engineering Books", FiBookOpen, "purple"],
  ["Important Questions", "Exam Preparation", FiTarget, "gold"],
  ["Syllabus", "University Curriculum", FiList, "sky"],
  ["LaTeX Reports", "Templates & Guides", FiFileText, "cream"],
];

export const focusItems = [
  ["25", "SEP", "DBMS Assignment", "Database Management Systems", "Due tomorrow", "orange"],
  ["27", "SEP", "Computer Networks Practical", "Lab Program & Viva Preparation", "Due in 3 days", "orange"],
  ["30", "SEP", "Mini Project Report", "Project Documentation (LaTeX)", "Due in 6 days", "orange"],
];

export const universityItems = [
  ["24", "SEP", "End-Semester Exam Timetable Released", "SPPU - Examination Section", "New", "red"],
  ["18", "SEP", "Revaluation Form Submission Notice", "SPPU - Circular", "", "purple"],
  ["12", "SEP", "Semester Result Declared", "SPPU - Examination Section", "", "blue"],
  ["05", "SEP", "Engineering Examination Circular", "SPPU - Academic Section", "", "gold"],
];

export const communityItems = [
  ["AS", "How does normalization reduce redundancy in DBMS?", ["DBMS", "Semester VI"], "12 answers · 284 views · 2 hours ago", "Solved"],
  ["RK", "Best resources to learn Spring Boot for beginners?", ["Java", "Spring Boot", "Career"], "8 answers · 156 views · 5 hours ago", ""],
  ["PM", "Difference between TCP and UDP?", ["Computer Networks", "Semester VI"], "15 answers · 320 views · 1 day ago", ""],
];

export const learningItems = [
  ["Operating Systems", "Process Synchronization", "Unit III", "68%"],
  ["DBMS", "Normalization", "Unit II", "42%"],
];

export const recommendedItems = [
  ["DBMS PYQs 2024", "Previous Year Papers", "2.4 MB"],
  ["Operating Systems Handwritten Notes", "Unit-wise Notes", "4.1 MB"],
  ["Computer Networks Important Questions", "Exam Preparation", "1.8 MB"],
];

export const careerItems = [
  ["DSA", "Java & Spring Boot", "72%"],
  ["Java & Spring Boot", "Java & Spring Boot", "54%"],
  ["SQL & DBMS", "SQL & DBMS", "64%"],
  ["Resume Preparation", "Resume Preparation", "80%"],
];