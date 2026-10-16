import { Outlet } from "react-router";
import Header from "./Header";

function AppLayout() {
  return (
    <>
      <div className="z-100 sticky top-0">
        <Header />
      </div>

      <main>
        <Outlet />
      </main>
    </>
  );
}

export default AppLayout;
