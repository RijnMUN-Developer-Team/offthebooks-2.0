import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { InitialLoadingScreen } from "./InitialLoadingScreen";
import "./styles.css";
import "./admin.css";
import "./visual-editor.css";
import "./archive.css";
import "./refinements.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /><InitialLoadingScreen /></React.StrictMode>);
