import {
  FiArrowDown,
  FiArrowRight,
  FiBookOpen,
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiDownload,
  FiFileText,
  FiGrid,
  FiMessageCircle,
  FiSearch,
  FiTool,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";

export const navItems = [
  { label: "Resources", href: "#resources" },
  { label: "Community", href: "#community" },
  { label: "University", href: "#university" },
  { label: "Career", href: "#career" },
  { label: "Library", href: "#library" },
  { label: "Tools", href: "#tools" },
];

export const platformItems = [
  { icon: FiFileText, title: "Academic Resources", text: "Notes, papers & study material" },
  { icon: FiUsers, title: "Community Discussions", text: "Ask, discuss & learn together" },
  { icon: FiBox, title: "University Updates", text: "Official academic information" },
  { icon: FiTrendingUp, title: "Career Preparation", text: "Prepare beyond the syllabus" },
  { icon: FiBookOpen, title: "Digital Library", text: "Books & learning resources" },
  { icon: FiGrid, title: "Student Tools", text: "Useful tools for everyday study" },
];

export const resourceRows = [
  { icon: FiFileText, title: "Database Management Systems", meta: "End Semester Examination 2024 · SPPU · SEM VI", tag: "PYQ", size: "2.4 MB" },
  { icon: FiFileText, title: "Operating Systems Notes", meta: "Handwritten Notes · Complete Unit-wise", tag: "Notes", size: "4.1 MB" },
  { icon: FiFileText, title: "Computer Networks Important Questions", meta: "Most Repeated Questions · Unit-wise", tag: "Important", size: "1.8 MB" },
];

export const communityRows = [
  { avatar: "AS", title: "How does normalization reduce data redundancy?", tags: ["DBMS", "Normalization", "Semester VI"], stats: "48  ·  12 answers  ·  1.2K views", status: "Answered" },
  { avatar: "RK", title: "Difference between process and thread in OS?", tags: ["Operating Systems", "Processes", "Threads"], stats: "32  ·  8 answers  ·  856 views", status: "Answered" },
  { avatar: "PM", title: "Best resources to learn Spring Boot for placements?", tags: ["Career", "Spring Boot", "Placements"], stats: "24  ·  16 answers  ·  2.1K views", status: "Active" },
];

export const universityRows = [
  { date: "24", month: "SEP", title: "End Semester Examination Timetable Released", source: "Savitribai Phule Pune University", type: "Timetable" },
  { date: "18", month: "SEP", title: "Revaluation Form Submission Notice", source: "Savitribai Phule Pune University", type: "Circular" },
  { date: "12", month: "SEP", title: "Semester Results Declared", source: "Savitribai Phule Pune University", type: "Results" },
  { date: "05", month: "SEP", title: "Engineering Admissions Update", source: "Savitribai Phule Pune University", type: "Announcement" },
];

export const careerCards = [
  { icon: FiClipboard, title: "Data Structures & Algorithms", text: "500+ questions with solutions", progress: "60%" },
  { icon: FiBriefcase, title: "Java & Spring Boot", text: "Complete development track", progress: "40%" },
  { icon: FiTool, title: "SQL & DBMS", text: "Practice queries and concepts", progress: "30%" },
  { icon: FiCheckCircle, title: "Company Questions", text: "Topic-wise company questions", progress: "20%" },
];

export const toolItems = [
  { icon: FiTrendingUp, title: "CGPA Calculator" },
  { icon: FiClock, title: "Attendance Tracker" },
  { icon: FiCalendar, title: "Timetable Builder" },
  { icon: FiClipboard, title: "Assignment Board" },
  { icon: FiFileText, title: "Report Templates" },
  { icon: FiGrid, title: "More Tools" },
];

export const libraryBooks = [
  { title: "Data Structures", short: "DSA", tone: "cream" },
  { title: "Operating Systems", short: "OS", tone: "navy" },
  { title: "Java", short: "JAVA", tone: "gold" },
];

export const stats = [
  ["Academic Resources", "50K+"],
  ["Active Students", "25K+"],
  ["Universities", "100+"],
  ["Downloads", "2L+"],
];

export const icons = {
  search: FiSearch,
  arrow: FiArrowRight,
  down: FiArrowDown,
  download: FiDownload,
  message: FiMessageCircle,
};