import { Route, Routes } from "react-router";
import AppLayout from "./components/layout/AppLayout";
import RequireAuth from "./components/auth/RequireAuth";
import BookPage from "./pages/BookPage";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import MyLoansPage from "./pages/MyLoansPage";
import Register from "./pages/Register";
import SearchPage from "./pages/SearchPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/books/:id" element={<BookPage />} />
        <Route
          path="/loans"
          element={
            <RequireAuth>
              <MyLoansPage />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}
export default App;
