import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/premium-shell.css";
import "./styles/learning-ecosystem.css";
import "./styles/viswam-ott.css";
import "./styles/native-shell.css";
import { installAuthFetchInterceptor } from "./lib/auth-fetch-interceptor";
import { applyViswamNativeShellClass } from "./lib/native-shell";
import { clearAbacusPortalStorage, isAbacusPortalSession } from "./lib/abacus-auth";

installAuthFetchInterceptor();

if (
  typeof window !== "undefined" &&
  localStorage.getItem("productLine") === "ABACUS" &&
  !isAbacusPortalSession()
) {
  clearAbacusPortalStorage();
}
applyViswamNativeShellClass();

createRoot(document.getElementById("root")!).render(<App />);
