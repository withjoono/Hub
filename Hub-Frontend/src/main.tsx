import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import NotFoundError from "./components/errors/not-found-error";

// Setup API interceptors
import { setupInterceptors } from "./lib/api";

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultNotFoundComponent: () => <NotFoundError />,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// tanstack/react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // 기본적으로 재시도하지 않음
      refetchOnWindowFocus: false, // 윈도우 포커스 시 재시도하지 않음
      staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    },
  },
});

// Setup API interceptors (인증, 토큰 갱신 등)
setupInterceptors();

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}


