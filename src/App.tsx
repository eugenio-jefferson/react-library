import { Route, Routes } from "react-router";
import AppLayout from "./components/layout/AppLayout";
import BookPage from "./pages/BookPage";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
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
      </Route>
    </Routes>
  );
}

export default App;
