import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "../PageStyles.css";

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <h1 className="logo">Daryl's Library</h1>
      <ul className="nav-links">
        <li>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/books" style={{ textDecoration: "none", color: "inherit" }}>
            Books
          </Link>
        </li>
        <li>
          <Link to="/loans" style={{ textDecoration: "none", color: "inherit" }}>
            Loans
          </Link>
        </li>
        <li
          className="profile-icon"
          onClick={() => navigate("/auth")} // ✅ Opens Auth page
          style={{ cursor: "pointer" }}
        >
          <FaUserCircle size={26} />
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
