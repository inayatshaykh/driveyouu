import React from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { Toaster } from "sonner";
import "./styles.css";

const router = getRouter();

hydrateRoot(
  document,
  <>
    <RouterProvider router={router} />
    <Toaster position="top-right" />
  </>
);
