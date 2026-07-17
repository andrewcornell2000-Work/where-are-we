import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// NOTE: intentionally not wrapping in <StrictMode> — its double-invoked render
// would restart the draw-in stroke animations.
createRoot(document.getElementById("root")!).render(<App />);
