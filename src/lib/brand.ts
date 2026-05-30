/** Official product and company naming for VISWAM LMS. */
export const PRODUCT_NAME = "VISWAM LMS";
export const COMPANY_NAME = "VISWAM EDUTECH";
export const PRODUCT_TAGLINE = "Enterprise Learning Platform";

/** Browser tab title: `VISWAM LMS | Login` */
export function pageTitle(segment?: string): string {
  if (!segment?.trim()) return PRODUCT_NAME;
  return `${PRODUCT_NAME} | ${segment.trim()}`;
}

export function setDocumentTitle(segment?: string): void {
  if (typeof document !== "undefined") {
    document.title = pageTitle(segment);
  }
}

/** Footer / powered-by line */
export const POWERED_BY = `Powered by ${COMPANY_NAME}`;

/** Default meta description */
export const DEFAULT_META_DESCRIPTION = `${PRODUCT_NAME} by ${COMPANY_NAME} — enterprise-grade learning for schools, teachers, and students.`;
