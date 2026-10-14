import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiChevronRight, FiHome } from "react-icons/fi";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopbar from "./components/AdminTopbar";
import {
  AcademicMappingPanel,
  AccessPricingPanel,
  AdditionalInfoPanel,
  BasicDetailsPanel,
  ResourcePreviewPanel,
  UploadFilePanel,
  UploadReviewBar,
  UploadStepper,
} from "./components/AdminResourceUploadComponents";
import {
  getUploadAcademicYears,
  getUploadBranchesByCollege,
  getUploadBranchesByUniversity,
  getUploadCategories,
  getUploadColleges,
  getUploadCollegeBranchMappings,
  getUploadCurriculumSemesters,
  getUploadCurriculumsByBranch,
  getUploadSemesters,
  getUploadSubjectOfferings,
  getUploadUniversities,
  uploadAdminResource,
} from "./services/adminResourceUploadService";
import "./admin-resource-upload.css";

// Keep these limits aligned with Spring Boot's 25 MiB file / 30 MiB request limit.
const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = 29 * 1024 * 1024;

const DOCUMENT_TYPES = [
  { value: "QUESTION_PAPER", label: "Question Paper" },
  { value: "SOLVED_PAPER", label: "Solved Paper" },
  { value: "BOOK", label: "Book" },
  { value: "NOTE", label: "Notes" },
  { value: "IMPORTANT_QUESTION", label: "Important Questions" },
  { value: "STUDY_MATERIAL", label: "Study Material" },
];

const MATERIAL_TYPES = [
  { value: "RAW_PYQ", label: "Raw Previous Year Papers" },
  { value: "RAW_NOTES", label: "Class Notes" },
  { value: "LAB_MANUAL", label: "Lab Manual" },
  { value: "SOLVED_PYQ", label: "Solved Previous Year Papers" },
  { value: "PREMIUM_NOTES", label: "Premium Notes" },
  { value: "LAB_MANUAL_CODES", label: "Lab Manual with Codes" },
  { value: "VIVA_QUESTIONS", label: "Viva Questions" },
  { value: "BOOK_PDF", label: "Reference Book" },
  { value: "FORMULA_SHEET", label: "Formula Sheet" },
  { value: "MCQ_BANK", label: "MCQ Bank" },
  { value: "VIMP_QUESTIONS", label: "Very Important Questions" },
  { value: "MOCK_TEST", label: "Mock Test" },
  { value: "PLACEMENT_PACK", label: "Placement Pack" },
];

const initialForm = {
  title: "",
  documentType: "",
  materialType: "",
  categoryId: "",
  categoryName: "",
  description: "",
  tags: "",
  universityId: "",
  collegeId: "",
  branchId: "",
  academicYearId: "",
  semesterId: "",
  subjectOfferingId: "",
  accessType: "FREE",
  price: "0",
  discountPrice: "",
  version: "",
  language: "",
  pageCount: "",
  previewPages: "",
  downloadable: true,
  watermarkEnabled: false,
  active: true,
  published: false,
};

const initialOptions = {
  categories: [],
  universities: [],
  colleges: [],
  branches: [],
  academicYears: [],
  semesters: [],
  subjects: [],
};

function getResponseList(response) {
  const payload = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function getPublicId(value) {
  return value == null ? "" : String(value);
}

// The academic endpoints expose prefixed public IDs, while the admin upload
// endpoint currently accepts internal numeric IDs for these relationships.
function toInternalId(value, prefix, offset) {
  if (value == null || value === "") return undefined;
  if (typeof value === "number" || /^\d+$/.test(String(value))) return Number(value);
  const normalized = String(value).trim().toUpperCase();
  if (!normalized.startsWith(prefix)) {
    throw new Error(`Unexpected ${prefix} identifier: ${value}`);
  }
  const externalNumber = Number(normalized.slice(prefix.length));
  const internalNumber = externalNumber - offset;
  if (!Number.isSafeInteger(internalNumber) || internalNumber < 1) {
    throw new Error(`Invalid ${prefix} identifier`);
  }
  return internalNumber;
}

function sameAcademicId(first, second, prefix, offset) {
  if (first == null || second == null || first === "" || second === "") return false;
  try {
    return toInternalId(first, prefix, offset) === toInternalId(second, prefix, offset);
  } catch {
    return String(first) === String(second);
  }
}

function optionName(item, fallback = "Untitled") {
  return item?.name || item?.title || item?.label || item?.code || fallback;
}

function useObjectUrl(file) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) {
      setUrl("");
      return undefined;
    }
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);
  return url;
}

function selectBestCurriculum(curriculums, academicYear) {
  if (!curriculums.length) return null;
  const yearStart = Number(academicYear?.startYear || String(academicYear?.name || "").match(/20\d{2}/)?.[0]);
  const yearEnd = Number(academicYear?.endYear || (yearStart ? yearStart + 1 : 0));
  const matching = curriculums.find((item) => {
    const start = Number(item.startYear || 0);
    const end = Number(item.endYear || 0);
    return yearStart && (!start || yearStart >= start) && (!end || yearEnd <= end);
  });
  return matching || curriculums.find((item) => item.active !== false) || curriculums[0];
}

export default function AdminUploadResourcePage() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("noteswala_admin_sidebar_collapsed") === "true"; }
    catch { return false; }
  });
  const [activeItem, setActiveItem] = useState("Upload Resources");
  const [searchValue, setSearchValue] = useState("");
  const [activeUploadStep, setActiveUploadStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState(initialOptions);
  const [curriculums, setCurriculums] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [imageFiles, setImageFiles] = useState({ thumbnail: null, coverImage: null, previewImage: null });
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingAcademic, setLoadingAcademic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const academicRequestRef = useRef(0);

  const pdfPreviewUrl = useObjectUrl(pdfFile);
  const coverPreviewUrl = useObjectUrl(imageFiles.coverImage);
  const thumbnailPreviewUrl = useObjectUrl(imageFiles.thumbnail);

  const selectedUniversity = useMemo(
    () => options.universities.find((item) => getPublicId(item.id) === form.universityId),
    [options.universities, form.universityId],
  );
  const selectedBranch = useMemo(
    () => options.branches.find((item) => getPublicId(item.id) === form.branchId),
    [options.branches, form.branchId],
  );
  const selectedSemester = useMemo(
    () => options.semesters.find((item) => getPublicId(item.id) === form.semesterId),
    [options.semesters, form.semesterId],
  );
  const selectedSubject = useMemo(
    () => options.subjects.find((item) => getPublicId(item.id) === form.subjectOfferingId),
    [options.subjects, form.subjectOfferingId],
  );

  const updateField = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "categoryId") {
        next.categoryName = options.categories.find((item) => getPublicId(item.id) === value)?.name || "";
      }
      if (field === "accessType" && value === "FREE") {
        next.price = "0";
        next.discountPrice = "";
      }
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    const loadInitialOptions = async () => {
      setLoadingInitial(true);
      const [categoriesResult, universitiesResult] = await Promise.allSettled([
        getUploadCategories(),
        getUploadUniversities(),
      ]);
      if (!active) return;

      const nextCategories = categoriesResult.status === "fulfilled"
        ? getResponseList(categoriesResult.value)
        : [];
      const nextUniversities = universitiesResult.status === "fulfilled"
        ? getResponseList(universitiesResult.value)
        : [];
      setOptions((current) => ({
        ...current,
        categories: nextCategories,
        universities: nextUniversities,
      }));
      setLoadingInitial(false);

      if (categoriesResult.status === "rejected") {
        toast.error("Could not load resource categories.");
      }
      if (universitiesResult.status === "rejected") {
        toast.error("Could not load universities.");
      }
    };
    loadInitialOptions();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    const loadSubjectOptions = async () => {
      if (!form.branchId || !form.academicYearId || !form.semesterId || !curriculums.length) {
        setOptions((current) => ({ ...current, subjects: [] }));
        return;
      }

      setLoadingAcademic(true);
      try {
        const academicYear = options.academicYears.find((item) => getPublicId(item.id) === form.academicYearId);
        const activeCurriculums = curriculums.filter((item) => item.active !== false);
        const yearStart = Number(academicYear?.startYear || String(academicYear?.name || "").match(/20\\d{2}/)?.[0]);
        const yearEnd = Number(academicYear?.endYear || (yearStart ? yearStart + 1 : 0));
        const yearMatchedCurriculums = activeCurriculums.filter((item) => {
          const start = Number(item.startYear || 0);
          const end = Number(item.endYear || 0);
          return yearStart && (!start || yearStart >= start) && (!end || yearEnd <= end);
        });
        const candidates = yearMatchedCurriculums.length ? yearMatchedCurriculums : activeCurriculums;
        const selectedSemester = options.semesters.find((item) => getPublicId(item.id) === form.semesterId);

        // More than one curriculum can be active for a branch. Resolve the selected
        // semester against each applicable curriculum instead of guessing one curriculum.
        const curriculumResults = await Promise.allSettled(candidates.map(async (curriculum) => {
          const semesterResponse = await getUploadCurriculumSemesters(curriculum.id);
          const curriculumSemesters = getResponseList(semesterResponse);
          const matchingSemester = curriculumSemesters.find((item) =>
            sameAcademicId(item.semesterId, form.semesterId, "S", 10000) ||
            (Number(item.semesterNumber) > 0 && Number(item.semesterNumber) === Number(selectedSemester?.number))
          );
          if (!matchingSemester) return { curriculum, offerings: [] };

          const offeringResponse = await getUploadSubjectOfferings(matchingSemester.id);
          const offerings = getResponseList(offeringResponse)
            .filter((item) => item.active !== false && item.id && item.subjectId)
            .map((item) => ({
              id: getPublicId(item.id),
              subjectId: item.subjectId,
              code: item.subjectCode || item.code || "",
              subjectName: item.subjectName || item.name || "Untitled subject",
              name: [item.subjectCode || item.code, item.subjectName || item.name].filter(Boolean).join(" — "),
            }));
          return { curriculum, offerings };
        }));

        if (!active) return;
        const populatedResult = curriculumResults.find(
          (result) => result.status === "fulfilled" && result.value.offerings.length > 0
        );
        const failedResults = curriculumResults.filter((result) => result.status === "rejected");

        if (populatedResult) {
          setOptions((current) => ({ ...current, subjects: populatedResult.value.offerings }));
          setForm((current) => ({
            ...current,
            subjectOfferingId: populatedResult.value.offerings.some((item) => item.id === current.subjectOfferingId)
              ? current.subjectOfferingId
              : "",
          }));
        } else {
          setOptions((current) => ({ ...current, subjects: [] }));
          if (failedResults.length === curriculumResults.length && failedResults.length > 0) {
            const firstError = failedResults[0].reason;
            toast.error(firstError?.response?.data?.message || "Could not load subject offerings for the selected semester.");
          } else {
            toast.error("No active subject offerings were found for this branch, academic year and semester.");
          }
        }
      } catch (error) {
        if (active) {
          setOptions((current) => ({ ...current, subjects: [] }));
          toast.error(error?.response?.data?.message || "Could not load subjects for this semester.");
        }
      } finally {
        if (active) setLoadingAcademic(false);
      }
    };

    loadSubjectOptions();
    return () => { active = false; };
  }, [form.branchId, form.academicYearId, form.semesterId, curriculums, options.academicYears, options.semesters]);

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      try { localStorage.setItem("noteswala_admin_sidebar_collapsed", String(next)); }
      catch { /* Storage may be unavailable. */ }
      return next;
    });
  };

  const selectNavigation = (label) => {
    setActiveItem(label);
    if (label === "Dashboard") {
      navigate("/admin");
      return;
    }
    if (label === "Upload Resources") {
      navigate("/admin/resources/upload");
      return;
    }
    if (label === "Manage Categories") {
      navigate("/admin/categories");
      return;
    }
    if (label === "Resource Library") {
      toast("Resource Library management is not part of this screen.");
      return;
    }
    toast(`${label} selected.`, { icon: "↗" });
  };

  const handleUniversityChange = async (universityId) => {
    const requestId = ++academicRequestRef.current;
    setForm((current) => ({
      ...current,
      universityId,
      collegeId: "",
      branchId: "",
      academicYearId: "",
      semesterId: "",
      subjectOfferingId: "",
    }));
    setCurriculums([]);
    setOptions((current) => ({
      ...current,
      colleges: [],
      branches: [],
      academicYears: [],
      semesters: [],
      subjects: [],
    }));
    if (!universityId) {
      setLoadingAcademic(false);
      return;
    }

    setLoadingAcademic(true);
    const [collegesResult, branchesResult, yearsResult] = await Promise.allSettled([
      getUploadColleges(universityId),
      getUploadBranchesByUniversity(universityId),
      getUploadAcademicYears(universityId),
    ]);
    if (requestId !== academicRequestRef.current) return;

    const colleges = collegesResult.status === "fulfilled" ? getResponseList(collegesResult.value) : [];
    const branches = branchesResult.status === "fulfilled"
      ? getResponseList(branchesResult.value).filter((branch) =>
          branch.active !== false &&
          (!branch.universityId || sameAcademicId(branch.universityId, universityId, "U", 100000))
        )
      : [];
    const academicYears = yearsResult.status === "fulfilled" ? getResponseList(yearsResult.value) : [];

    setOptions((current) => ({
      ...current,
      colleges,
      branches,
      academicYears,
    }));
    setLoadingAcademic(false);

    if (branchesResult.status === "rejected") {
      toast.error(branchesResult.reason?.response?.data?.message || "Could not load branches for this university.");
    }
    if (collegesResult.status === "rejected") {
      toast.error(collegesResult.reason?.response?.data?.message || "Could not load colleges for this university.");
    }
    if (yearsResult.status === "rejected") {
      toast.error(yearsResult.reason?.response?.data?.message || "Could not load academic years for this university.");
    }
  };

  const handleBranchChange = async (branchId) => {
    const requestId = ++academicRequestRef.current;
    const branch = options.branches.find((item) => getPublicId(item.id) === branchId);
    const requiredYear = branch?.academicYearId
      ? options.academicYears.find((item) => sameAcademicId(item.id, branch.academicYearId, "AY", 10000))
      : null;
    const academicYearId = branch?.academicYearId
      ? (requiredYear ? getPublicId(requiredYear.id) : "")
      : form.academicYearId;

    setForm((current) => ({
      ...current,
      branchId,
      academicYearId,
      semesterId: "",
      subjectOfferingId: "",
    }));
    setCurriculums([]);
    setOptions((current) => ({ ...current, semesters: [], subjects: [] }));
    if (!branchId) {
      setLoadingAcademic(false);
      return;
    }

    setLoadingAcademic(true);
    const requests = await Promise.allSettled([
      getUploadCurriculumsByBranch(branchId),
      academicYearId ? getUploadSemesters(academicYearId) : Promise.resolve(null),
    ]);
    if (requestId !== academicRequestRef.current) return;

    const [curriculumResult, semesterResult] = requests;
    if (curriculumResult.status === "fulfilled") {
      const activeCurriculums = getResponseList(curriculumResult.value).filter((item) => item.active !== false);
      setCurriculums(activeCurriculums);
      if (activeCurriculums.length === 0) {
        toast.error("No active curriculum is configured for this branch.");
      }
    } else {
      setCurriculums([]);
      toast.error(curriculumResult.reason?.response?.data?.message || "Could not load curriculum for this branch.");
    }

    if (semesterResult.status === "fulfilled") {
      setOptions((current) => ({ ...current, semesters: semesterResult.value ? getResponseList(semesterResult.value) : [] }));
    } else {
      setOptions((current) => ({ ...current, semesters: [] }));
      toast.error(semesterResult.reason?.response?.data?.message || "Could not load semesters for this academic year.");
    }
    if (branch?.academicYearId && !academicYearId) {
      toast.error("The selected branch's academic year is not available for this university.");
    }
    setLoadingAcademic(false);
  };

  const handleCollegeChange = async (collegeId) => {
    const requestId = ++academicRequestRef.current;
    const universityId = form.universityId;

    setForm((current) => ({
      ...current,
      collegeId,
      branchId: "",
      academicYearId: "",
      semesterId: "",
      subjectOfferingId: "",
    }));
    setCurriculums([]);
    setOptions((current) => ({ ...current, branches: [], semesters: [], subjects: [] }));

    if (!universityId) {
      setLoadingAcademic(false);
      return;
    }

    setLoadingAcademic(true);
    try {
      const universityBranchesPromise = getUploadBranchesByUniversity(universityId);
      const collegeMappingsPromise = collegeId
        ? getUploadCollegeBranchMappings(collegeId)
        : Promise.resolve(null);

      const [universityBranchesResult, mappingResult] = await Promise.allSettled([
        universityBranchesPromise,
        collegeMappingsPromise,
      ]);
      if (requestId !== academicRequestRef.current) return;

      const universityBranches = universityBranchesResult.status === "fulfilled"
        ? getResponseList(universityBranchesResult.value).filter((branch) =>
            branch.active !== false &&
            (!branch.universityId || sameAcademicId(branch.universityId, universityId, "U", 100000))
          )
        : [];
      let branchOptions = [];

      if (!collegeId) {
        branchOptions = universityBranches;
      } else {
        const mappings = mappingResult.status === "fulfilled"
          ? getResponseList(mappingResult.value)
          : [];

        if (mappings.length > 0) {
          const mappedIds = new Set(mappings.map((mapping) => getPublicId(mapping.branchId || mapping.id)));
          branchOptions = universityBranches.filter((branch) =>
            Array.from(mappedIds).some((id) => sameAcademicId(id, branch.id, "B", 10000))
          );

          // The mapping endpoint has branch names/codes itself. Keep those mappings
          // selectable if the broader branch catalog is temporarily unavailable.
          if (branchOptions.length === 0) {
            branchOptions = mappings
              .filter((mapping) => mapping.active !== false && (mapping.branchId || mapping.id))
              .map((mapping) => ({
                id: getPublicId(mapping.branchId || mapping.id),
                name: mapping.branchName || mapping.branchCode || "Unnamed branch",
                code: mapping.branchCode || "",
                universityId,
                active: mapping.active !== false,
              }));
          }
        } else {
          // Compatibility fallback for older backend deployments that do not yet
          // expose college-branch mappings. This endpoint is also null-safe now.
          try {
            const legacyResponse = await getUploadBranchesByCollege(collegeId);
            branchOptions = getResponseList(legacyResponse).filter((branch) =>
              branch.active !== false &&
              (!branch.universityId || sameAcademicId(branch.universityId, universityId, "U", 100000))
            );
          } catch {
            branchOptions = [];
          }
        }

        // Some colleges have no explicit branch mapping records. In that case,
        // use only active branches from the selected university rather than
        // leaving the required Branch dropdown permanently disabled.
        if (branchOptions.length === 0) {
          branchOptions = universityBranches;
          if (branchOptions.length > 0) {
            toast("No college-specific branches were configured. Showing active branches for the selected university.", {
              icon: "ℹ️",
              duration: 4500,
            });
          }
        }
      }

      if (requestId !== academicRequestRef.current) return;
      setOptions((current) => ({ ...current, branches: branchOptions }));

      if (branchOptions.length === 0) {
        if (universityBranchesResult.status === "rejected") {
          toast.error(universityBranchesResult.reason?.response?.data?.message || "Could not load branches for this university.");
        } else {
          toast.error("No active branches are configured for the selected university.");
        }
      }
    } catch (error) {
      if (requestId === academicRequestRef.current) {
        setOptions((current) => ({ ...current, branches: [] }));
        toast.error(error?.response?.data?.message || "Could not load branches for the selected college.");
      }
    } finally {
      if (requestId === academicRequestRef.current) setLoadingAcademic(false);
    }
  };

  const handleAcademicYearChange = async (academicYearId) => {
    const requestId = ++academicRequestRef.current;
    setForm((current) => ({ ...current, academicYearId, semesterId: "", subjectOfferingId: "" }));
    setOptions((current) => ({ ...current, semesters: [], subjects: [] }));
    if (!academicYearId) {
      setLoadingAcademic(false);
      return;
    }

    setLoadingAcademic(true);
    try {
      const response = await getUploadSemesters(academicYearId);
      if (requestId !== academicRequestRef.current) return;
      const semesters = getResponseList(response).filter((semester) => semester.active !== false);
      setOptions((current) => ({ ...current, semesters }));
      if (!semesters.length) {
        toast.error("No active semesters are configured for this academic year.");
      }
    } catch (error) {
      if (requestId !== academicRequestRef.current) return;
      setOptions((current) => ({ ...current, semesters: [] }));
      toast.error(error?.response?.data?.message || "Could not load semesters for this academic year.");
    } finally {
      if (requestId === academicRequestRef.current) setLoadingAcademic(false);
    }
  };

  const handleAcademicFieldChange = (field, value) => {
    if (field === "universityId") {
      handleUniversityChange(value);
    } else if (field === "branchId") {
      handleBranchChange(value);
    } else if (field === "academicYearId") {
      handleAcademicYearChange(value);
    } else if (field === "collegeId") {
      handleCollegeChange(value);
    } else {
      updateField(field, value);
    }
  };

  const getSelectedUploadSize = (nextPdfFile = pdfFile, nextImageFiles = imageFiles) =>
    (nextPdfFile?.size || 0) +
    Object.values(nextImageFiles).reduce((total, file) => total + (file?.size || 0), 0);

  const handlePdfSelect = (file) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please choose a PDF file.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.error("The PDF must be 25 MB or smaller to match the server upload limit.");
      return;
    }
    if (getSelectedUploadSize(file) > MAX_TOTAL_UPLOAD_BYTES) {
      toast.error("The PDF and optional images must total less than 29 MB. Remove an optional image and try again.");
      return;
    }
    setPdfFile(file);
    setUploadProgress(0);
  };

  const handleImageSelect = (kind, file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Each optional image must be 5 MB or smaller.");
      return;
    }
    const nextImages = { ...imageFiles, [kind]: file };
    if (getSelectedUploadSize(pdfFile, nextImages) > MAX_TOTAL_UPLOAD_BYTES) {
      toast.error("The PDF and optional images must total less than 29 MB. Remove an optional image and try again.");
      return;
    }
    setImageFiles(nextImages);
    setUploadProgress(0);
  };

  const jumpToStep = (step) => {
    setActiveUploadStep(step);
    document.getElementById("upload-step-" + step)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const runUpload = async (publishedOverride = null) => {
    if (submitting) return;
    const published = publishedOverride === null ? form.published : publishedOverride;
    if (!pdfFile) {
      toast.error("Choose a PDF resource before uploading.");
      jumpToStep(1);
      return;
    }
    if (!form.title.trim() || !form.documentType || !form.materialType || !form.categoryId) {
      toast.error("Complete the required basic details first.");
      jumpToStep(2);
      return;
    }
    if (!form.universityId || !form.branchId || !form.academicYearId || !form.semesterId || !form.subjectOfferingId) {
      toast.error("Select all required academic mapping fields.");
      jumpToStep(3);
      return;
    }
    const price = Number(form.price || 0);
    const discountPrice = form.discountPrice.trim() === "" ? undefined : Number(form.discountPrice);
    if (!Number.isFinite(price) || price < 0 || (form.accessType !== "FREE" && price <= 0)) {
      toast.error(form.accessType === "FREE" ? "Free resources must have a price of ₹0." : "Enter a valid price greater than ₹0.");
      jumpToStep(4);
      return;
    }
    if (discountPrice !== undefined && (!Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice > price)) {
      toast.error("Discount price must be between ₹0 and the resource price.");
      jumpToStep(4);
      return;
    }

    const selectedOffering = options.subjects.find((item) => item.id === form.subjectOfferingId);
    if (!selectedOffering?.subjectId) {
      toast.error("The selected subject offering is invalid. Please choose the subject again.");
      jumpToStep(3);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("pdfFile", pdfFile);
      if (imageFiles.previewImage) formData.append("previewFile", imageFiles.previewImage);
      if (imageFiles.thumbnail) formData.append("thumbnail", imageFiles.thumbnail);
      if (imageFiles.coverImage) formData.append("coverImage", imageFiles.coverImage);

      const metadata = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        categoryId: Number(form.categoryId),
        universityId: toInternalId(form.universityId, "U", 100000),
        collegeId: form.collegeId ? toInternalId(form.collegeId, "C", 10000) : undefined,
        branchId: toInternalId(form.branchId, "B", 10000),
        academicYearId: toInternalId(form.academicYearId, "AY", 10000),
        semesterId: toInternalId(form.semesterId, "S", 10000),
        subjectId: selectedOffering.subjectId,
        subjectOfferingId: selectedOffering.id,
        documentType: form.documentType,
        materialType: form.materialType,
        accessType: form.accessType,
        price: form.accessType === "FREE" ? 0 : price,
        discountPrice: discountPrice,
        pageCount: form.pageCount ? Number(form.pageCount) : undefined,
        previewPages: form.previewPages ? Number(form.previewPages) : undefined,
        version: form.version.trim() || undefined,
        language: form.language || undefined,
        tags: form.tags.trim() || undefined,
        downloadable: form.downloadable,
        watermarkEnabled: form.watermarkEnabled,
        active: form.active,
        published,
      };

      Object.keys(metadata).forEach((key) => {
        if (metadata[key] === undefined || metadata[key] === null || metadata[key] === "") delete metadata[key];
      });

      setUploadProgress(0);
      await uploadAdminResource(formData, metadata, (event) => {
        if (event.total > 0) {
          setUploadProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        }
      });
      setUploadProgress(100);
      toast.success(published ? "Resource uploaded and published successfully." : "Resource saved as a draft.");
      navigate("/admin", { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      const responseMessage = error?.response?.data?.message || error?.response?.data?.error;
      if (status === 413) {
        toast.error("Upload too large. Keep the PDF under 25 MB and all selected files under 29 MB.");
      } else if (status === 401 || status === 403) {
        toast.error("Your admin session may have expired. Sign in again, then retry the upload.");
      } else if (error?.code === "ERR_NETWORK" || !error?.response) {
        console.error("[AdminResourceUpload] Request did not receive an HTTP response.", {
          code: error?.code,
          message: error?.message,
          baseURL: error?.config?.baseURL,
          url: error?.config?.url,
          timeout: error?.config?.timeout,
        });
        toast.error("Could not reach the backend. Check that Spring Boot is running on port 8080 and that the browser allows the API request.");
      } else {
        console.error("[AdminResourceUpload] Upload failed.", {
          status,
          code: error?.code,
          message: error?.message,
          response: error?.response?.data,
        });
        toast.error(responseMessage || ("Upload failed (HTTP " + (status || "unknown") + "). Check the backend log for details."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const categories = options.categories.map((item) => ({
    ...item,
    id: getPublicId(item.id),
    name: optionName(item, "Unnamed category"),
  }));
  const universities = options.universities.map((item) => ({
    ...item, id: getPublicId(item.id), name: optionName(item, "Unnamed university"),
  }));
  const colleges = options.colleges.map((item) => ({
    ...item, id: getPublicId(item.id), name: optionName(item, "Unnamed college"),
  }));
  const branches = options.branches.map((item) => ({
    ...item, id: getPublicId(item.id), name: optionName(item, "Unnamed branch"),
  }));
  const selectedBranchRecord = options.branches.find((item) => getPublicId(item.id) === form.branchId);
  const academicYears = options.academicYears
    .filter((item) => !selectedBranchRecord?.academicYearId || sameAcademicId(item.id, selectedBranchRecord.academicYearId, "AY", 10000))
    .map((item) => ({
      ...item, id: getPublicId(item.id), name: optionName(item, "Unnamed academic year"),
    }));
  const semesters = options.semesters.map((item) => ({
    ...item, id: getPublicId(item.id), name: item.name || (item.number ? `Semester ${item.number}` : optionName(item, "Unnamed semester")),
  }));
  const subjects = options.subjects.map((item) => ({ ...item, id: getPublicId(item.id) }));

  return (
    <div className={`admin-app-shell admin-upload-app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} activeItem={activeItem} onSelect={selectNavigation} variant="upload" />
      <div className="admin-workspace">
        <AdminTopbar collapsed={sidebarCollapsed} searchValue={searchValue} onSearchChange={setSearchValue} />
        <main className="admin-dashboard-content admin-upload-page-content">
          <header className="admin-upload-page-heading">
            <nav className="admin-upload-breadcrumbs" aria-label="Breadcrumb">
              <button type="button" onClick={() => navigate("/admin")}><FiHome /> Dashboard</button>
              <FiChevronRight />
              <button type="button" onClick={() => toast("Resource Library management is available from the admin navigation.")}>Resource Library</button>
              <FiChevronRight />
              <span>Upload Resource</span>
            </nav>
            <div className="admin-upload-title-row">
              <div><h1>Upload Resource</h1><p>Add study material to NotesWala library and make it available for students.</p></div>
              <div className="admin-upload-banner-art" aria-hidden="true">
                <p>Share<br />Knowledge<br /><em>Empower</em><br />Students</p>
                <div className="admin-upload-art-stack"><span>NOTES</span><span>PYQ</span><span>SOLUTIONS</span><span>MANUALS</span><span>BOOKS</span></div>
                <div className="admin-upload-art-plant"><i /><i /><i /><b /></div>
              </div>
            </div>
          </header>

          <UploadStepper activeStep={activeUploadStep} onStepSelect={jumpToStep} />

          {loadingInitial && <div className="admin-upload-loading" role="status"><span /> Loading academic data…</div>}

          <div className="admin-upload-first-row">
            <UploadFilePanel
              pdfFile={pdfFile}
              onPdfSelect={handlePdfSelect}
              onPdfRemove={() => setPdfFile(null)}
              thumbnail={imageFiles.thumbnail}
              coverImage={imageFiles.coverImage}
              previewImage={imageFiles.previewImage}
              onImageSelect={handleImageSelect}
              onImageRemove={(kind) => {
                setImageFiles((current) => ({ ...current, [kind]: null }));
                setUploadProgress(0);
              }}
            />
            <BasicDetailsPanel
              values={form}
              onChange={updateField}
              categories={categories}
              documentTypes={DOCUMENT_TYPES}
              materialTypes={MATERIAL_TYPES}
            />
            <ResourcePreviewPanel
              values={form}
              selectedUniversity={selectedUniversity}
              selectedBranch={selectedBranch}
              selectedSemester={selectedSemester}
              selectedSubject={selectedSubject}
              pdfFile={pdfFile}
              pdfPreviewUrl={pdfPreviewUrl}
              coverPreviewUrl={coverPreviewUrl || thumbnailPreviewUrl}
            />
          </div>

          <div className="admin-upload-second-row">
            <AcademicMappingPanel
              values={form}
              onChange={handleAcademicFieldChange}
              options={{ universities, colleges, branches, academicYears, semesters, subjects }}
              loading={loadingAcademic}
              disabled={loadingInitial}
            />
            <AccessPricingPanel values={form} onChange={updateField} />
            <AdditionalInfoPanel values={form} onChange={updateField} />
          </div>

          <UploadReviewBar
            onCancel={() => navigate("/admin")}
            onSaveDraft={() => runUpload(false)}
            onPublish={() => runUpload(null)}
            submitting={submitting}
            uploadProgress={uploadProgress}
          />
        </main>
      </div>
    </div>
  );
}
