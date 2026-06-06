// Lightweight inline line-icons (24x24, 1.75 stroke). Replaces emoji for a premium feel.
const S = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const IconPlus = (p) => <svg {...S} {...p}><path d="M12 5v14M5 12h14"/></svg>
export const IconUpload = (p) => <svg {...S} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5-5 5 5"/><path d="M12 5v12"/></svg>
export const IconFile = (p) => <svg {...S} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
export const IconBook = (p) => <svg {...S} {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
export const IconUsers = (p) => <svg {...S} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
export const IconEye = (p) => <svg {...S} {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
export const IconList = (p) => <svg {...S} {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
export const IconMic = (p) => <svg {...S} {...p}><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><path d="M12 19v3"/></svg>
export const IconFlag = (p) => <svg {...S} {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
export const IconDownload = (p) => <svg {...S} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
export const IconLibrary = (p) => <svg {...S} {...p}><path d="M16 6l4 14M12 6v14M8 8l-4 12"/><path d="M3 20h18"/></svg>
export const IconRefresh = (p) => <svg {...S} {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>
export const IconCheck = (p) => <svg {...S} {...p}><path d="M20 6L9 17l-5-5"/></svg>
export const IconAlert = (p) => <svg {...S} {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
export const IconTrash = (p) => <svg {...S} {...p}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
export const IconSparkle = (p) => <svg {...S} {...p}><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg>
export const IconClock = (p) => <svg {...S} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
export const IconArrowLeft = (p) => <svg {...S} {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>

export const SECTION_ICONS = {
  plot_summary: IconBook,
  character_breakdown: IconUsers,
  perspective_guide: IconEye,
  chapter_summary: IconList,
  pronunciation_guide: IconMic,
  flagged_items: IconFlag,
}
