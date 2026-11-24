// Faculties in display order, with the course code prefixes filed under each.
// Shared by the notes library and the admin analytics.
export const FACULTY_PREFIXES: Record<string, string[]> = {
  Science: ["MAT", "STA", "CHM", "PHY", "BIO", "BCH", "ENV", "GEG", "NSC", "MED", "ANP", "MDV", "BMG", "TMM"],
  Law: ["DRC", "CML"],
  "Health Sciences": ["HSS", "BPS", "NSG", "NUT", "APA", "REA", "ORA", "EPI"],
  "Social Sciences": ["PSY", "SOC", "ECO", "POL", "CRM", "ANT", "GEO", "CMN", "FEM", "API", "PAP", "ISP"],
  Telfer: ["ADM", "MBA", "MGT"],
  Arts: ["ENG", "HIS", "PHI", "FRA", "ART", "MUS", "THE", "LIN", "CLA", "TRA", "ESP", "ITA", "CHN", "JPN", "RUS", "LCM", "FLS", "SRS"],
  Education: ["EDU"],
  Engineering: ["CSI", "SEG", "CEG", "ELG", "MCG", "CVG", "CHG", "GNG"],
};

export const inFaculty = (courseCode: string, faculty: string) =>
  (FACULTY_PREFIXES[faculty] ?? []).some((p) => courseCode.startsWith(p));

/** null when the course code doesn't belong to a listed faculty. */
export function facultyOf(courseCode: string | null | undefined): string | null {
  const code = courseCode?.trim().toUpperCase() ?? "";
  return Object.keys(FACULTY_PREFIXES).find((f) => inFaculty(code, f)) ?? null;
}
