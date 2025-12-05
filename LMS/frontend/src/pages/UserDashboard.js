import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../PageStyles.css";
import axios from "axios";
import {
  FaUserCircle,
  FaBookmark,
  FaCheckCircle,
  FaHome,
  FaSignOutAlt,
} from "react-icons/fa";

function UserDashboard({ onLogout }) {
  const [userName, setUserName] = useState("John Doe");
  const [mainContent, setMainContent] = useState("overview");
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user"));
    } catch {
      storedUser = null;
    }

    if (!storedUser || !storedUser.username) {
      localStorage.removeItem("user");
      alert("Unauthorized access or broken session!");
      navigate("/auth", { replace: true });
      return;
    }

    setUserName(storedUser.username || "John Doe");
    setUserId(storedUser.id || storedUser.username);
    setIsAdmin(storedUser.isAdmin || false);

    fetchBorrowedBooks(storedUser.id || storedUser.username);
    fetchAvailableBooks();
  }, []);

  const handleLogout = () => {
    if (typeof onLogout === "function") onLogout();
    localStorage.removeItem("user");
    navigate("/auth", { replace: true });
  };

  const handleHome = () => setMainContent("overview");
  const handleBorrowedBooks = () => setMainContent("borrowedBooks");

  const fetchBorrowedBooks = async (id) => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/loans/");
      const filtered = res.data
        .filter((loan) => loan.user?.id === id)
        .map((loan) => ({
          id: loan.id,
          book_title: loan.book?.title || "Unknown",
          book_author: loan.book?.author || "Unknown",
          book_genre: loan.book?.genre || "Unknown",
          returned: loan.returned,
          borrowed_at: loan.borrowed_at,
        }));
      setBorrowedBooks(filtered);
    } catch {
      setBorrowedBooks([]);
    }
  };

  const fetchAvailableBooks = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/books/");
      const filtered = res.data.filter((b) => b.available);
      setAvailableBooks(filtered);
    } catch {
      setAvailableBooks([]);
    }
  };

  const instantBorrow = async (book) => {
  if (!userId || !book?.id) return;

  try {
    await axios.post("http://127.0.0.1:8000/api/loans/borrow_book/", {
      user_id: userId,
      book_id: book.id,
    });

    alert(`You borrowed "${book.title}" successfully!`);

    await fetchBorrowedBooks(userId);
    await fetchAvailableBooks();
  } catch (error) {
    console.log(error);
    alert("Unable to borrow this book.");
  }
};


  // 🔹 Return book function (updated for instant state refresh)
  const returnBook = async (loanId) => {
  if (!loanId) return;

  try {
    await axios.post("http://127.0.0.1:8000/api/loans/return_book/", { loan_id: loanId });
    alert("Book returned successfully!");

    await fetchBorrowedBooks(userId);
    await fetchAvailableBooks();
  } catch (error) {
    console.log(error);
    alert("Unable to return this book.");
  }
};

  // 🔹 Only count currently borrowed books (not returned)
  const currentlyBorrowedCount = borrowedBooks.filter((loan) => !loan.returned).length;

  return (
    <div className="user-dashboard">
      <aside className="user-sidebar">
        <div className="user-profile">
          <FaUserCircle className="profile-icon" />
          <h3 className="user-name">{userName}</h3>
          <p className="user-role"><em>{isAdmin ? "Admin" : "User"}</em></p>
        </div>

        <nav className="user-nav">
          <button onClick={handleHome}><FaHome /> Overview</button>
          <button onClick={handleBorrowedBooks}><FaBookmark /> Borrowed Books</button>
        </nav>

        <div className="bottom-buttons">
          <button className="home-btn" onClick={() => navigate("/")}>
            <FaHome /> Home
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      <main className="user-main">
        {mainContent === "overview" && (
          <>
            <h1 className="main-placeholder">Welcome, {userName} 👋</h1>
            <p className="main-subtext">Quick overview of your library account.</p>

            <div className="overview-cards">
              <div className="card">
                <FaBookmark className="card-icon" />
                <h3>{currentlyBorrowedCount}</h3>
                <p>Currently borrowed</p>
              </div>

              <div className="card">
                <FaCheckCircle className="card-icon" />
                <h3>{availableBooks.length}</h3>
                <p>Books ready to borrow</p>
              </div>
            </div>
          </>
        )}

        {mainContent === "borrowedBooks" && (
          <>
            <h1 className="main-placeholder">📚 Borrowed Books</h1>
            <p className="main-subtext">Track the books you have borrowed.</p>

            <div className="book-list">
              {borrowedBooks.length > 0 ? borrowedBooks.map((loan) => (
                <div key={loan.id} className="book-card">
                  <h3>{loan.book_title}</h3>
                  <p><strong>Author:</strong> {loan.book_author}</p>
                  <p><strong>Genre:</strong> {loan.book_genre}</p>
                  <p><strong>Borrowed At:</strong> {loan.borrowed_at ? new Date(loan.borrowed_at).toLocaleString() : "Unknown"}</p>
                  <p><strong>Status:</strong> {loan.returned ? "Returned" : "Borrowed"}</p>
                  {!loan.returned && (
                    <button
                      className="return-btn"
                      onClick={() => returnBook(loan.id)}
                    >
                      Return
                    </button>
                  )}
                </div>
              )) : <p>You haven’t borrowed any books yet.</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
export default UserDashboard;

