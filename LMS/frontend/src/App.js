import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainPage from "./pages/MainPage";
import Books from "./components/Books";
import Loans from "./components/Loans";
import Auth from "./components/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import LibrarianDashboard from "./pages/LibrarianDashboard"; // Librarian dashboard
import axios from "axios"; // for API calls

function App() {
  const [user, setUser] = useState(null);

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser && storedUser.role) {
      setUser(storedUser);
    } else {
      setUser(null);
      localStorage.removeItem("user");
    }
  }, []);

  // Listen to storage changes (multi-tab logout/login handling)
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem("user"));
      if (updatedUser && updatedUser.role) {
        setUser(updatedUser);
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event("storage"));
  };

  // -------------------------------
  // 📌 Borrow request function (user requests book with message)
  // -------------------------------
  const requestBorrowBook = async (bookId, message = "") => {
    if (!user) {
      alert("Please login first to request a book.");
      return;
    }

    try {
      const response = await axios.post("/api/loans/request_borrow/", {
        user: user.id,   // matches DRF endpoint key
        book: bookId,    // matches DRF endpoint key
        message: message // new: send user's message
      });

      if (response.data.message) {
        alert(response.data.message); // show success message from backend
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Error requesting book.");
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<MainPage />} />
        <Route path="/books" element={<Books requestBorrowBook={requestBorrowBook} currentUser={user} />} />
        <Route path="/loans" element={<Loans />} />

        {/* Auth page */}
        <Route
          path="/auth"
          element={
            user?.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : user?.role === "user" ? (
              <Navigate to="/dashboard" replace />
            ) : user?.role === "librarian" ? (
              <Navigate to="/librarian" replace />
            ) : (
              <Auth />
            )
          }
        />

        {/* Admin protected */}
        <Route
          path="/admin"
          element={
            user?.role === "admin" ? (
              <AdminDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* User protected */}
        <Route
          path="/dashboard"
          element={
            user?.role === "user" ? (
              <UserDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Librarian protected */}
        <Route
          path="/librarian"
          element={
            user?.role === "librarian" ? (
              <LibrarianDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
