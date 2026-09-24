import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AppErrorBoundary from "./app/AppErrorBoundary";
import { store } from "./app/store";
import "./styles/index.css";
import "./styles/register.css";
import "./styles/login.css";
import "./styles/home.css";
import "./styles/resources.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </AppErrorBoundary>
  </StrictMode>,
);