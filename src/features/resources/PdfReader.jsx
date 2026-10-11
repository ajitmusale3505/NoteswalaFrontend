import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiDownload,
  FiFileText,
  FiGrid,
  FiList,
  FiMaximize,
  FiMinimize,
  FiPrinter,
  FiRotateCw,
  FiSearch,
  FiX,
  FiZoomIn,
  FiZoomOut,
} from "react-icons/fi";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MIN_ZOOM = 40;
const MAX_ZOOM = 300;
const ZOOM_STEP = 10;
const RENDER_NEARBY_PAGES = 2;
const THUMBNAIL_SCALE = 0.18;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizedText(value) {
  return String(value || "").toLocaleLowerCase();
}

function flattenOutline(items = [], depth = 0, output = []) {
  items.forEach((item) => {
    output.push({ title: item.title || "Untitled section", dest: item.dest, depth });
    if (item.items?.length) flattenOutline(item.items, depth + 1, output);
  });
  return output;
}

function PdfThumbnail({ pdf, pageNumber, active, shouldRender, onSelect, parentScrollRef }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!shouldRender || !pdf || !canvasRef.current) return undefined;
    let cancelled = false;
    let renderTask;
    const canvas = canvasRef.current;

    const renderThumbnail = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });
        const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
        canvas.width = Math.ceil(viewport.width * ratio);
        canvas.height = Math.ceil(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const context = canvas.getContext("2d", { alpha: false });
        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0],
        });
        await renderTask.promise;
      } catch (error) {
        if (!cancelled && error?.name !== "RenderingCancelledException") setError(true);
      }
    };
    renderThumbnail();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, shouldRender]);

  return (
    <button
      type="button"
      className={`pdf-reader-thumbnail ${active ? "is-active" : ""}`}
      data-thumbnail-page={pageNumber}
      onClick={onSelect}
      ref={(element) => {
        if (element) element.dataset.thumbnailPage = String(pageNumber);
      }}
      aria-current={active ? "page" : undefined}
      title={`Go to page ${pageNumber}`}
    >
      <span className="pdf-reader-thumbnail-canvas">
        {shouldRender && !error ? <canvas ref={canvasRef} /> : error ? <FiFileText /> : <span className="pdf-reader-thumbnail-placeholder" />}
      </span>
      <span className="pdf-reader-thumbnail-number">{pageNumber}</span>
    </button>
  );
}

function PdfPage({
  pdf,
  pageNumber,
  zoom,
  rotation,
  shouldRender,
  estimatedSize,
  searchItemIndices,
  activeSearchItemIndex,
  getTextContent,
  onTextContent,
  onPageDimensions,
  onPageVisible,
  registerPageElement,
}) {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const [pageError, setPageError] = useState("");
  const [rendering, setRendering] = useState(false);
  const scale = zoom / 100;
  const isRotated = rotation % 180 !== 0;
  const displayWidth = (isRotated ? estimatedSize.height : estimatedSize.width) * scale;
  const displayHeight = (isRotated ? estimatedSize.width : estimatedSize.height) * scale;

  useEffect(() => {
    const element = canvasRef.current?.closest("[data-page-number]");
    if (element) registerPageElement(pageNumber, element);
    return () => registerPageElement(pageNumber, null);
  }, [pageNumber, registerPageElement, shouldRender]);

  useEffect(() => {
    if (!shouldRender || !pdf || !canvasRef.current) return undefined;
    let cancelled = false;
    let renderTask;
    let textLayer;

    const renderPage = async () => {
      setPageError("");
      setRendering(true);
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const baseViewport = page.getViewport({ scale: 1, rotation: 0 });
        onPageDimensions(pageNumber, baseViewport.width, baseViewport.height);
        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", { alpha: false });
        if (!canvas || !context) return;
        const outputScale = Math.min(window.devicePixelRatio || 1, 1.65);
        canvas.width = Math.ceil(viewport.width * outputScale);
        canvas.height = Math.ceil(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
        });
        await renderTask.promise;
        if (cancelled) return;

        const textContent = await getTextContent(pageNumber, page);
        if (cancelled) return;
        onTextContent(pageNumber, textContent);
        const layerContainer = textLayerRef.current;
        if (layerContainer) {
          layerContainer.innerHTML = "";
          textLayer = new pdfjsLib.TextLayer({
            textContentSource: textContent,
            container: layerContainer,
            viewport,
          });
          await textLayer.render();
          if (cancelled) return;

          const spans = Array.from(layerContainer.querySelectorAll("span"));
          const textualItems = textContent.items
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => typeof item.str === "string" && item.str.length > 0);
          textualItems.forEach(({ index }, spanIndex) => {
            const span = spans[spanIndex];
            if (span) span.dataset.pdfItemIndex = String(index);
          });
        }
      } catch (error) {
        if (!cancelled && error?.name !== "RenderingCancelledException") {
          setPageError(error?.message || `Page ${pageNumber} could not be rendered.`);
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    renderPage();
    return () => {
      cancelled = true;
      renderTask?.cancel();
      if (textLayerRef.current) textLayerRef.current.innerHTML = "";
    };
  }, [pdf, pageNumber, scale, rotation, shouldRender, getTextContent, onTextContent, onPageDimensions]);

  useEffect(() => {
    const layer = textLayerRef.current;
    if (!layer) return;
    const spans = layer.querySelectorAll("span[data-pdf-item-index]");
    spans.forEach((span) => {
      const index = Number(span.dataset.pdfItemIndex);
      span.classList.toggle("pdf-reader-search-match", searchItemIndices?.has(index) || false);
      span.classList.toggle("pdf-reader-search-active", activeSearchItemIndex === index);
    });
  }, [searchItemIndices, activeSearchItemIndex, shouldRender, zoom, rotation]);

  return (
    <article
      className={`pdf-reader-page ${shouldRender ? "is-rendered" : ""}`}
      data-page-number={pageNumber}
      ref={(element) => registerPageElement(pageNumber, element)}
      style={{ width: displayWidth, minHeight: displayHeight }}
      onMouseEnter={() => onPageVisible(pageNumber)}
    >
      <div className="pdf-reader-page-paper" style={{ width: displayWidth, height: displayHeight }}>
        {shouldRender ? (
          <>
            <canvas className="pdf-reader-page-canvas" ref={canvasRef} />
            <div className="textLayer pdf-reader-text-layer" ref={textLayerRef} />
            {rendering && <span className="pdf-reader-page-loading">Rendering…</span>}
          </>
        ) : (
          <div className="pdf-reader-page-placeholder" style={{ width: displayWidth, height: displayHeight }} />
        )}
        {pageError && <div className="pdf-reader-page-error"><FiAlertCircle /><span>{pageError}</span></div>}
      </div>
      <span className="pdf-reader-page-label">{pageNumber}</span>
    </article>
  );
}

function OutlineList({ items, onSelect }) {
  if (!items?.length) {
    return <div className="pdf-reader-sidebar-empty"><FiBookOpen /><p>This PDF has no table of contents.</p></div>;
  }

  return (
    <div className="pdf-reader-outline-list">
      {items.map((item, index) => (
        <button
          type="button"
          key={`${item.title}-${index}`}
          style={{ paddingLeft: 12 + item.depth * 13 }}
          onClick={() => onSelect(item)}
          title={item.title}
        >
          <span>{item.title}</span>
          <FiChevronRight />
        </button>
      ))}
    </div>
  );
}

export default function PdfReader({
  fileUrl,
  title = "PDF document",
  onDownload,
  canDownload = true,
  downloading = false,
  initialError = "",
  onRetry,
}) {
  const readerRef = useRef(null);
  const documentScrollRef = useRef(null);
  const thumbnailScrollRef = useRef(null);
  const pageElementsRef = useRef(new Map());
  const textContentCacheRef = useRef(new Map());
  const searchInputRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(true);
  const [documentError, setDocumentError] = useState(initialError);
  const [pageCount, setPageCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
  const [pageSizes, setPageSizes] = useState({});
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState("page");
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState("continuous");
  const [sidebarMode, setSidebarMode] = useState("thumbnails");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [outline, setOutline] = useState([]);
  const [visibleThumbnails, setVisibleThumbnails] = useState(() => new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const getTextContent = useCallback(async (pageNumber, pageProxy = null) => {
    const cached = textContentCacheRef.current.get(pageNumber);
    if (cached) return cached;
    const page = pageProxy || await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    textContentCacheRef.current.set(pageNumber, textContent);
    return textContent;
  }, [pdf]);

  useEffect(() => {
    if (!fileUrl) {
      setDocumentLoading(false);
      setDocumentError(initialError || "The PDF file is unavailable.");
      return undefined;
    }
    let cancelled = false;
    const loadingTask = pdfjsLib.getDocument({ url: fileUrl, isEvalSupported: false });
    setDocumentLoading(true);
    setDocumentError("");
    setPdf(null);
    setPageCount(0);
    setSearchMatches([]);
    setSearchQuery("");
    textContentCacheRef.current.clear();

    const loadDocument = async () => {
      try {
        const loadedPdf = await loadingTask.promise;
        if (cancelled) {
          await loadedPdf.destroy();
          return;
        }
        const firstPage = await loadedPdf.getPage(1);
        if (cancelled) {
          await loadedPdf.destroy();
          return;
        }
        const viewport = firstPage.getViewport({ scale: 1, rotation: 0 });
        setPageSize({ width: viewport.width, height: viewport.height });
        setPageCount(loadedPdf.numPages);
        setActivePage(1);
        setPageInput("1");
        setPdf(loadedPdf);
        const documentOutline = await loadedPdf.getOutline().catch(() => null);
        if (!cancelled) setOutline(flattenOutline(documentOutline || []));
      } catch (error) {
        if (!cancelled) {
          setDocumentError(error?.message || initialError || "The PDF could not be opened.");
        }
      } finally {
        if (!cancelled) setDocumentLoading(false);
      }
    };
    loadDocument();

    return () => {
      cancelled = true;
      loadingTask.destroy();
    };
  }, [fileUrl, initialError]);

  useEffect(() => {
    setPageInput(String(activePage));
  }, [activePage]);

  useEffect(() => {
    const element = readerRef.current;
    if (!element) return undefined;
    const onFullscreenChange = () => setFullscreen(document.fullscreenElement === element);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const panel = thumbnailScrollRef.current;
    if (!panel || sidebarMode !== "thumbnails") return undefined;
    const elements = panel.querySelectorAll("[data-thumbnail-page]");
    const observer = new IntersectionObserver((entries) => {
      setVisibleThumbnails((current) => {
        const next = new Set(current);
        entries.forEach((entry) => {
          const pageNumber = Number(entry.target.dataset.thumbnailPage);
          if (entry.isIntersecting) next.add(pageNumber);
          else next.delete(pageNumber);
        });
        return next;
      });
    }, { root: panel, rootMargin: "180px 0px", threshold: 0.01 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pdf, sidebarMode, pageCount, sidebarOpen]);

  useEffect(() => {
    const scrollPanel = documentScrollRef.current;
    if (!scrollPanel || !pageCount) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const candidates = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (candidates.length) {
        const pageNumber = Number(candidates[0].target.dataset.pageNumber);
        if (pageNumber) setActivePage((current) => current === pageNumber ? current : pageNumber);
      }
    }, { root: scrollPanel, threshold: [0.1, 0.25, 0.5, 0.75] });
    pageElementsRef.current.forEach((element) => {
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [pageCount, pdf, viewMode, zoom, rotation, sidebarOpen]);

  useEffect(() => {
    if (fitMode === "manual" || !pageCount) return undefined;
    const scrollPanel = documentScrollRef.current;
    if (!scrollPanel) return undefined;

    const fit = () => {
      const width = Math.max(220, scrollPanel.clientWidth - (sidebarOpen ? 36 : 20));
      const height = Math.max(220, scrollPanel.clientHeight - 42);
      const rotatedWidth = rotation % 180 ? pageSize.height : pageSize.width;
      const rotatedHeight = rotation % 180 ? pageSize.width : pageSize.height;
      const widthPercent = (width / rotatedWidth) * 100;
      const nextZoom = fitMode === "width"
        ? widthPercent
        : Math.min(widthPercent, (height / rotatedHeight) * 100);
      setZoom(clamp(Math.floor(nextZoom), MIN_ZOOM, MAX_ZOOM));
    };
    fit();
    const resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(scrollPanel);
    return () => resizeObserver.disconnect();
  }, [fitMode, pageCount, pageSize.width, pageSize.height, rotation, sidebarOpen]);

  const pageMatches = useMemo(() => {
    const grouped = new Map();
    searchMatches.forEach((match, index) => {
      if (!grouped.has(match.pageNumber)) grouped.set(match.pageNumber, { items: new Set(), active: null });
      const group = grouped.get(match.pageNumber);
      group.items.add(match.itemIndex);
      if (index === activeMatchIndex) group.active = match.itemIndex;
    });
    return grouped;
  }, [searchMatches, activeMatchIndex]);

  const registerPageElement = useCallback((pageNumber, element) => {
    if (element) pageElementsRef.current.set(pageNumber, element);
    else pageElementsRef.current.delete(pageNumber);
  }, []);

  const onPageDimensions = useCallback((pageNumber, width, height) => {
    setPageSizes((current) => {
      const previous = current[pageNumber];
      if (previous?.width === width && previous?.height === height) return current;
      return { ...current, [pageNumber]: { width, height } };
    });
  }, []);

  const onTextContent = useCallback((pageNumber, textContent) => {
    textContentCacheRef.current.set(pageNumber, textContent);
  }, []);

  const onPageVisible = useCallback((pageNumber) => {
    setActivePage((current) => current === pageNumber ? current : pageNumber);
  }, []);

  const scrollToPage = useCallback((pageNumber) => {
    if (!pageCount) return;
    const destinationPage = clamp(Number(pageNumber) || 1, 1, pageCount);
    setActivePage(destinationPage);
    setPageInput(String(destinationPage));
    if (viewMode === "single") return;
    window.requestAnimationFrame(() => {
      const scroller = documentScrollRef.current;
      const element = pageElementsRef.current.get(destinationPage);
      if (!scroller || !element) return;
      const top = element.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      scroller.scrollTo({ top: Math.max(0, top - 12), behavior: "smooth" });
    });
  }, [pageCount, viewMode]);

  const goToPageInput = () => {
    if (!pageInput.trim() || !Number.isFinite(Number(pageInput))) {
      setPageInput(String(activePage));
      return;
    }
    scrollToPage(clamp(Math.trunc(Number(pageInput)), 1, pageCount));
  };

  const changeZoom = (value) => {
    setFitMode("manual");
    setZoom(clamp(Math.round(value), MIN_ZOOM, MAX_ZOOM));
  };

  const selectFitMode = (mode) => {
    setFitMode(mode);
    if (mode === "manual") setZoom(100);
  };

  const toggleFullscreen = async () => {
    if (!readerRef.current) return;
    try {
      if (document.fullscreenElement === readerRef.current) await document.exitFullscreen();
      else await readerRef.current.requestFullscreen();
    } catch {
      setDocumentError("Full screen is not available in this browser.");
    }
  };

  const handlePrint = () => {
    if (!fileUrl) return;
    const printFrame = document.createElement("iframe");
    printFrame.className = "pdf-reader-print-frame";
    printFrame.title = `Print ${title}`;
    printFrame.src = fileUrl;
    printFrame.onload = () => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      }
    };
    document.body.appendChild(printFrame);
    window.setTimeout(() => printFrame.remove(), 60000);
  };

  const copySelection = async () => {
    const selection = window.getSelection()?.toString() || "";
    if (!selection.trim()) {
      setCopyMessage("Select PDF text first.");
      window.setTimeout(() => setCopyMessage(""), 2200);
      return;
    }
    try {
      await navigator.clipboard.writeText(selection);
      setCopyMessage("Copied");
    } catch {
      setCopyMessage("Press Ctrl+C to copy selected text.");
    }
    window.setTimeout(() => setCopyMessage(""), 2200);
  };

  const executeSearch = useCallback(async (term = searchInput) => {
    const query = term.trim();
    setSearchQuery(query);
    setSearchMatches([]);
    setActiveMatchIndex(0);
    if (!query || !pdf || !pageCount) return;

    setSearching(true);
    const normalizedQuery = normalizedText(query);
    const matches = [];
    let nextPageNumber = 1;
    const worker = async () => {
      while (nextPageNumber <= pageCount) {
        const pageNumber = nextPageNumber++;
        try {
          const textContent = await getTextContent(pageNumber);
          textContent.items.forEach((item, itemIndex) => {
            if (typeof item.str !== "string" || !item.str) return;
            const content = normalizedText(item.str);
            let startIndex = content.indexOf(normalizedQuery);
            while (startIndex !== -1) {
              matches.push({ pageNumber, itemIndex, offset: startIndex, length: query.length });
              startIndex = content.indexOf(normalizedQuery, startIndex + Math.max(1, normalizedQuery.length));
            }
          });
        } catch {
          // A damaged page should not prevent searching the remainder of the document.
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, pageCount) }, () => worker()));
    matches.sort((a, b) => a.pageNumber - b.pageNumber || a.itemIndex - b.itemIndex || a.offset - b.offset);
    setSearchMatches(matches);
    setActiveMatchIndex(0);
    setSearching(false);
    if (matches.length) scrollToPage(matches[0].pageNumber);
  }, [searchInput, pdf, pageCount, getTextContent, scrollToPage]);

  const navigateMatch = (direction) => {
    if (!searchMatches.length) return;
    const nextIndex = (activeMatchIndex + direction + searchMatches.length) % searchMatches.length;
    setActiveMatchIndex(nextIndex);
    scrollToPage(searchMatches[nextIndex].pageNumber);
  };

  const selectOutlineItem = async (item) => {
    if (!pdf || !item.dest) return;
    try {
      let destination = item.dest;
      if (typeof destination === "string") destination = await pdf.getDestination(destination);
      if (!destination?.[0]) return;
      const pageIndex = await pdf.getPageIndex(destination[0]);
      scrollToPage(pageIndex + 1);
    } catch {
      setDocumentError("This table-of-contents entry could not be opened.");
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const inEditableField = target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (event.key === "Escape" && document.fullscreenElement === readerRef.current) {
        document.exitFullscreen().catch(() => {});
        return;
      }
      if (inEditableField) {
        if (event.key === "Escape" && searchOpen && target === searchInputRef.current) setSearchOpen(false);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      } else if ((event.ctrlKey || event.metaKey) && ["+", "=", "Add"].includes(event.key)) {
        event.preventDefault();
        changeZoom(zoom + ZOOM_STEP);
      } else if ((event.ctrlKey || event.metaKey) && ["-", "_", "Subtract"].includes(event.key)) {
        event.preventDefault();
        changeZoom(zoom - ZOOM_STEP);
      } else if (!event.ctrlKey && !event.metaKey && event.key === "0") {
        changeZoom(100);
      } else if (event.key === "PageDown" || event.key === "ArrowRight") {
        event.preventDefault();
        scrollToPage(activePage + 1);
      } else if (event.key === "PageUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        scrollToPage(activePage - 1);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activePage, zoom, searchOpen, scrollToPage]);

  const renderPage = (pageNumber) => {
    if (viewMode === "single") return pageNumber === activePage;
    return Math.abs(pageNumber - activePage) <= RENDER_NEARBY_PAGES;
  };

  const activeGroup = pageMatches.get(activePage);
  const visibleMatches = searchMatches.length ? `${activeMatchIndex + 1} of ${searchMatches.length}` : (searchQuery ? "0 matches" : "");

  return (
    <div className={`pdf-reader ${fullscreen ? "is-fullscreen" : ""}`} ref={readerRef}>
      <div className="pdf-reader-toolbar" role="toolbar" aria-label="PDF controls">
        <div className="pdf-reader-toolbar-group pdf-reader-main-controls">
          <button type="button" onClick={() => setSidebarOpen((value) => !value)} className={sidebarOpen ? "is-active" : ""} title="Show or hide navigation sidebar" aria-label="Toggle PDF sidebar">
            <FiGrid />
          </button>
          <button type="button" onClick={() => { setSidebarOpen(true); setSidebarMode("outline"); }} className={sidebarOpen && sidebarMode === "outline" ? "is-active" : ""} title="Table of contents" aria-label="Table of contents"><FiList /></button>
          <button type="button" onClick={() => { setSearchOpen((value) => !value); window.setTimeout(() => searchInputRef.current?.focus(), 0); }} className={searchOpen ? "is-active" : ""} title="Search in document (Ctrl+F)" aria-label="Search in PDF"><FiSearch /></button>
        </div>

        <div className="pdf-reader-toolbar-group pdf-reader-page-controls">
          <button type="button" onClick={() => scrollToPage(activePage - 1)} disabled={!pageCount || activePage <= 1} title="Previous page" aria-label="Previous page"><FiChevronLeft /></button>
          <form className="pdf-reader-page-form" onSubmit={(event) => { event.preventDefault(); goToPageInput(); }}>
            <input aria-label="Current page number" type="number" min="1" max={pageCount || 1} value={pageInput}
              disabled={!pageCount || documentLoading}
              onChange={(event) => setPageInput(event.target.value)}
              onBlur={goToPageInput}
            />
            <span>/ {pageCount || "—"}</span>
          </form>
          <button type="button" onClick={() => scrollToPage(activePage + 1)} disabled={!pageCount || activePage >= pageCount} title="Next page" aria-label="Next page"><FiChevronRight /></button>
        </div>

        <div className="pdf-reader-toolbar-group pdf-reader-zoom-controls">
          <button type="button" onClick={() => changeZoom(zoom - ZOOM_STEP)} disabled={!pdf || zoom <= MIN_ZOOM} title="Zoom out (Ctrl+-)" aria-label="Zoom out"><FiZoomOut /></button>
          <button type="button" className="pdf-reader-zoom-label" onClick={() => { selectFitMode("manual"); setZoom(100); }} title="Reset zoom to 100%">{zoom}%</button>
          <button type="button" onClick={() => changeZoom(zoom + ZOOM_STEP)} disabled={!pdf || zoom >= MAX_ZOOM} title="Zoom in (Ctrl++)" aria-label="Zoom in"><FiZoomIn /></button>
          <div className="pdf-reader-fit-menu">
            <button type="button" className={fitMode === "width" ? "is-active" : ""} onClick={() => selectFitMode("width")} title="Fit to width">Fit width</button>
            <button type="button" className={fitMode === "page" ? "is-active" : ""} onClick={() => selectFitMode("page")} title="Fit full page">Fit page</button>
          </div>
        </div>

        <div className="pdf-reader-toolbar-group pdf-reader-view-controls">
          <button type="button" onClick={() => setRotation((value) => (value + 90) % 360)} title="Rotate clockwise" aria-label="Rotate PDF"><FiRotateCw /></button>
          <button type="button" onClick={() => setViewMode((value) => value === "continuous" ? "single" : "continuous")} title={viewMode === "continuous" ? "Switch to single page" : "Switch to continuous scroll"} aria-label="Toggle page layout" className={viewMode === "single" ? "is-active" : ""}>
            {viewMode === "continuous" ? <FiFileText /> : <FiList />}
          </button>
          <button type="button" onClick={copySelection} title="Copy selected PDF text" aria-label="Copy selected text"><FiCopy /></button>
          <button type="button" onClick={handlePrint} title="Print PDF" aria-label="Print PDF"><FiPrinter /></button>
          {canDownload && <button type="button" onClick={onDownload} disabled={downloading} title="Download original PDF" aria-label="Download PDF"><FiDownload /></button>}
          <button type="button" onClick={toggleFullscreen} title={fullscreen ? "Exit full screen" : "Full screen"} aria-label={fullscreen ? "Exit full screen" : "Full screen"}>
            {fullscreen ? <FiMinimize /> : <FiMaximize />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="pdf-reader-searchbar">
          <form onSubmit={(event) => { event.preventDefault(); executeSearch(); }}>
            <FiSearch />
            <input ref={searchInputRef} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Find in document…" aria-label="Find text in PDF" />
            {searching ? <span className="pdf-reader-search-status">Searching…</span> : <span className="pdf-reader-search-status">{visibleMatches}</span>}
            <button type="submit" disabled={!searchInput.trim() || searching} title="Search document"><FiCheck /></button>
          </form>
          <button type="button" onClick={() => navigateMatch(-1)} disabled={!searchMatches.length} title="Previous match" aria-label="Previous search match"><FiChevronLeft /></button>
          <button type="button" onClick={() => navigateMatch(1)} disabled={!searchMatches.length} title="Next match" aria-label="Next search match"><FiChevronRight /></button>
          <button type="button" onClick={() => { setSearchOpen(false); setSearchMatches([]); setSearchQuery(""); setSearchInput(""); }} title="Close search" aria-label="Close search"><FiX /></button>
        </div>
      )}

      {copyMessage && <div className="pdf-reader-copy-status" role="status">{copyMessage}</div>}

      <div className="pdf-reader-body">
        {sidebarOpen && (
          <aside className="pdf-reader-sidebar">
            <div className="pdf-reader-sidebar-tabs">
              <button type="button" className={sidebarMode === "thumbnails" ? "active" : ""} onClick={() => setSidebarMode("thumbnails")}><FiGrid /> Pages</button>
              <button type="button" className={sidebarMode === "outline" ? "active" : ""} onClick={() => setSidebarMode("outline")}><FiList /> Outline</button>
            </div>
            {sidebarMode === "thumbnails" ? (
              <div className="pdf-reader-thumbnail-list" ref={thumbnailScrollRef}>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <PdfThumbnail
                    key={pageNumber}
                    pdf={pdf}
                    pageNumber={pageNumber}
                    active={activePage === pageNumber}
                    shouldRender={visibleThumbnails.has(pageNumber) && Boolean(pdf)}
                    parentScrollRef={thumbnailScrollRef}
                    onSelect={() => scrollToPage(pageNumber)}
                  />
                ))}
              </div>
            ) : (
              <div className="pdf-reader-outline-scroll">
                <OutlineList items={outline} onSelect={selectOutlineItem} />
              </div>
            )}
          </aside>
        )}

        <div className={`pdf-reader-document-scroll ${viewMode === "single" ? "is-single-page" : ""}`} ref={documentScrollRef}>
          {documentLoading && (
            <div className="pdf-reader-loading-state" role="status"><span className="pdf-reader-spinner" /><strong>Preparing PDF reader…</strong><p>Loading page information and navigation.</p></div>
          )}
          {!documentLoading && documentError && (
            <div className="pdf-reader-error-state" role="alert"><FiAlertCircle /><strong>Unable to load PDF</strong><p>{documentError}</p>{onRetry && <button type="button" onClick={onRetry}>Try again</button>}</div>
          )}
          {!documentLoading && !documentError && pdf && Array.from({ length: pageCount }, (_, index) => index + 1)
            .filter((pageNumber) => viewMode === "single" ? pageNumber === activePage : true)
            .map((pageNumber) => {
              const size = pageSizes[pageNumber] || pageSize;
              const marks = pageMatches.get(pageNumber);
              return (
                <PdfPage
                  key={pageNumber}
                  pdf={pdf}
                  pageNumber={pageNumber}
                  zoom={zoom}
                  rotation={rotation}
                  shouldRender={renderPage(pageNumber)}
                  estimatedSize={size}
                  searchItemIndices={marks?.items}
                  activeSearchItemIndex={marks?.active}
                  getTextContent={getTextContent}
                  onTextContent={onTextContent}
                  onPageDimensions={onPageDimensions}
                  onPageVisible={onPageVisible}
                  registerPageElement={registerPageElement}
                />
              );
            })}
        </div>
      </div>
      <div className="pdf-reader-statusbar">
        <span><FiFileText /> {title}</span>
        <span>Page {activePage} of {pageCount || "—"}</span>
        <span>{searchQuery ? visibleMatches + ` for "${searchQuery}"` : (copyMessage || "Text selection enabled")}</span>
      </div>
      <div className="pdf-reader-shortcut-help">Shortcuts: Ctrl+F search · Ctrl +/− zoom · 0 reset · Page Up/Down navigate · Esc exit full screen</div>
    </div>
  );
}
