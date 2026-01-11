import { createRoot } from "react-dom/client";

import GranularCaptionAligner from "./GranularCaptionAligner";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
	createRoot(rootElement).render(<GranularCaptionAligner />);
}
