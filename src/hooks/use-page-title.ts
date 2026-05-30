import { useEffect } from "react";
import { pageTitle, PRODUCT_NAME } from "@/lib/brand";

/** Sets `document.title` to `VISWAM LMS | {segment}` on mount; restores product name on unmount. */
export function usePageTitle(segment?: string): void {
  useEffect(() => {
    const next = pageTitle(segment);
    const previous = document.title;
    document.title = next;
    return () => {
      document.title = previous || PRODUCT_NAME;
    };
  }, [segment]);
}
