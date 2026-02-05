import React from "react";
import { createRoot } from "react-dom/client";

import "./main.css";
import App from "./App";

console.log("WIDGET JS LOADED");

const el = document.getElementById("journal-root");
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
