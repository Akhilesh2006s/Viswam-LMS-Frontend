import { EduOTTFilterProvider } from "@/contexts/edu-ott-filter-context";
import { OttHome } from "@/components/viswam-ott/OttHome";

export default function EduOTT() {
  return (
    <EduOTTFilterProvider>
      <OttHome />
    </EduOTTFilterProvider>
  );
}
