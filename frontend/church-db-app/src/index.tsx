import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./routes/root";
import ErrorPage from "./error-page";
import Login from "./routes/login";
import Dashboard from "./routes/dashboard";
import Other from "./routes/other";
import ConfigureAuth from "./auth/auth";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

ConfigureAuth();

const router = createBrowserRouter([
  { path: "/", element: <Root />, errorElement: <ErrorPage /> },
  { path: "/login", element: <Login /> },
  { path: "/dashboard", element: <Dashboard />, errorElement: <ErrorPage /> },
  { path: "/other", element: <Other />, errorElement: <ErrorPage /> },
  // probably add more base root paths here for different parts of the app
]);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
