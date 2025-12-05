import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../PageStyles.css";
import Navbar from "../components/Navbar";
import axios from "axios";

function MainPage() {
  const navigate = useNavigate();
  const [availableBooks, setAvailableBooks] = useState([]);
  const [userRole, setUserRole] = useState("User"); // Default role

  useEffect(() => {
    // Get user info from localStorage
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user"));
    } catch {
      storedUser = null;
    }

    if (storedUser && storedUser.username) {
      setUserRole(storedUser.isAdmin ? "Admin" : "User");
    }

    // Fetch all available books for viewing
    fetchAvailableBooks();
  }, []);

  const fetchAvailableBooks = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/books/");
      if (Array.isArray(res.data)) {
        setAvailableBooks(res.data.filter((b) => b.available));
      } else {
        setAvailableBooks([]);
      }
    } catch {
      setAvailableBooks([]);
    }
  };

  return (
    <div className="main-container">
      {/* Navbar */}
      <Navbar />

      {/* Hero section */}
      <section className="hero">
        <h2>Welcome to Daryl's Library!</h2>
        <p>Borrow, track, and explore books easily.</p>
        <button className="hero-btn" onClick={() => navigate("/books")}>
          View Books
        </button>
      </section>

      {/* Features section */}
      <section className="features">
        <div className="feature-card">
          <h3>Browse Books</h3>
          <p>See all available books and their details.</p>
          {/* Display-only: no API, no buttons */}
        </div>

        <div className="feature-card">
          <h3>Borrow Books</h3>
          <p>Request a book and keep track of your loans.</p>
          {/* Display-only: no buttons */}
        </div>

        <div className="feature-card">
          <h3>Loan History</h3>
          <p>Check your borrowing and returned books history.</p>
          {/* Display-only: no buttons */}
        </div>
      </section>
    </div>
  );
}

export default MainPage;
