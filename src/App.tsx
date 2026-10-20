import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import AppLayout from "./components/layout/AppLayout";
import RequireAuth from "./components/auth/RequireAuth";
import HomePage from "./pages/HomePage";
import { Spinner } from "@/components/ui/spinner";

const BookPage = lazy(() => import("./pages/BookPage"));
const Login = lazy(() => import("./pages/Login"));
const MyLoansPage = lazy(() => import("./pages/MyLoansPage"));
const ReadingPage = lazy(() => import("./pages/ReadingPage"));
const Register = lazy(() => import("./pages/Register"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const WishlistsPage = lazy(() => import("./pages/WishlistsPage"));

function RouteFallback() {
  return (
    <output
      className="flex min-h-[calc(100svh-4.3rem)] items-center justify-center bg-muted"
      aria-label="Loading page"
    >
      <Spinner className="size-8 text-muted-foreground" />
    </output>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="/login"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Register />
            </Suspense>
          }
        />
        <Route
          path="/search"
          element={
            <Suspense fallback={<RouteFallback />}>
              <SearchPage />
            </Suspense>
          }
        />
        <Route
          path="/books/:id"
          element={
            <Suspense fallback={<RouteFallback />}>
              <BookPage />
            </Suspense>
          }
        />
        <Route
          path="/books/:id/read"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <ReadingPage />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/loans"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <MyLoansPage />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="/wishlists"
          element={
            <RequireAuth>
              <Suspense fallback={<RouteFallback />}>
                <WishlistsPage />
              </Suspense>
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}
export default App;
