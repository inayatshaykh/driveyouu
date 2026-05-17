import { renderToString } from "react-dom/server";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

export async function render(url: string) {
  const router = getRouter();
  
  await router.load();
  
  const html = renderToString(<RouterProvider router={router} />);
  
  return { html };
}
