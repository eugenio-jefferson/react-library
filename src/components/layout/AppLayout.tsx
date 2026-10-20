import { Outlet } from "react-router";
import Header from "./Header";
import Footer from "./Footer";

function AppLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-200 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="z-100 sticky top-0">
        <Header />
      </div>

      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

export default AppLayout;
