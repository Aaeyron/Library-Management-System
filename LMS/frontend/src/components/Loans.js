import React, { useState, useEffect } from "react";
import "../PageStyles.css";
import axios from "axios";
import Navbar from "./Navbar";

function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get logged-in user from localStorage
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user"));
    } catch {
      storedUser = null;
    }

    if (!storedUser || !storedUser.id || storedUser.role !== "user") {
      alert("Unauthorized access or session expired.");
      return;
    }

    setUserId(storedUser.id);

    // Fetch loans for this user only
    fetchUserLoans(storedUser.id);
  }, []);

  const fetchUserLoans = async (userProfileId) => {
    try {
      // Backend endpoint returns all loans; filter by logged-in user
      const res = await axios.get("http://127.0.0.1:8000/api/loans/");
      const userLoans = res.data.filter((loan) => loan.user?.id === userProfileId);
      setLoans(userLoans);
    } catch (err) {
      console.error("Error fetching loans:", err);
      setLoans([]);
    }
  };

  return (
    <div className="loans-container">
      <Navbar />

      <div className="loans-header">
        <h2>📖 Borrowed Books</h2>
        <p>Track your current and past borrowed books here.</p>
      </div>

      <div className="table-wrapper">
        <table className="books-table">
          <thead>
            <tr>
              <th>Book Title</th>
              <th>Borrow Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loans.length > 0 ? (
              loans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.book?.title || "Unknown Book"}</td>
                  <td>
                    {loan.borrowed_at
                      ? new Date(loan.borrowed_at).toLocaleString()
                      : "Unknown"}
                  </td>
                  <td>
                    <span
                      className={
                        loan.returned ? "status returned" : "status borrowed"
                      }
                    >
                      {loan.returned ? "Returned" : "Borrowed"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="no-books">
                  You haven't borrowed any books yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LoansPage;
