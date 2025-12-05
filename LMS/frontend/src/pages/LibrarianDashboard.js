import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../PageStyles.css";
import axios from "axios";
import {
  FaUserCircle,
  FaBook,
  FaSignOutAlt,
  FaHome,
  FaCheckCircle,
  FaBookOpen,
  FaChartBar,
} from "react-icons/fa";

function LibrarianDashboard({ onLogout }) {
  const [librarianName, setLibrarianName] = useState("Daryl Jake");
  const [mainContent, setMainContent] = useState("overview");
  const [books, setBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [lendModalOpen, setLendModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role !== "librarian") {
      alert("Unauthorized access!");
      navigate("/auth");
      return;
    }
    setLibrarianName(storedUser.username || "Daryl Jake");

    fetchBooks();
    fetchBorrowedBooks();
    fetchUsers();

    const booksInterval = setInterval(fetchBooks, 5000);
    const borrowedInterval = setInterval(fetchBorrowedBooks, 5000);

    return () => {
      clearInterval(booksInterval);
      clearInterval(borrowedInterval);
    };
  }, [navigate]);

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  const handleLogout = () => {
    if (typeof onLogout === "function") onLogout();
    localStorage.removeItem("user");
    navigate("/auth", { replace: true });
  };

  const handleHome = () => navigate("/");

  // --------------------------------
  // 📡 FETCH DATA
  // --------------------------------
  const fetchBooks = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/books/");
      const formattedBooks = Array.isArray(res.data)
        ? res.data.map((book) => {
            const activeLoan =
              book.loans?.find((loan) => loan.returned === false) || null;
            return {
              ...book,
              available: book.available,
              current_loan: activeLoan ? { id: activeLoan.id } : null,
            };
          })
        : [];
      setBooks(formattedBooks);
    } catch (err) {
      console.error("Failed to fetch books:", err);
      setBooks([]);
    }
  };

  const fetchBorrowedBooks = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/loans/");
      const formatted = res.data.map((loan) => ({
        id: loan.id,
        book_title: loan.book?.title || "Unknown",
        user_name:
          loan.user?.full_name || loan.user?.username || "Unknown",
        borrowed_date: loan.borrowed_at
          ? new Date(loan.borrowed_at).toLocaleString()
          : "Unknown",
        due_date: loan.due_at
          ? new Date(loan.due_at).toLocaleString()
          : "Unknown",
        status: loan.returned ? "Returned" : "Borrowed",
      }));
      setBorrowedBooks(formatted);
    } catch (err) {
      console.error("Failed to fetch borrowed books:", err);
      setBorrowedBooks([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/users/");
      setUsers(
        Array.isArray(res.data)
          ? res.data.filter((u) => u.role === "user")
          : []
      );
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    }
  };

  const handleTrackBorrowedBooks = () => {
    setMainContent("borrowedBooks");
    fetchBorrowedBooks();
  };

  const handleLendBook = async (bookId, userId) => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/loans/borrow_book/",
        { book_id: bookId, user_id: userId }
      );
      alert(res.data.message);
      fetchBooks();
      fetchBorrowedBooks();
      setMainContent("borrowedBooks");
    } catch (err) {
      console.error("Failed to lend book:", err);
      alert("Failed to lend book. Please try again.");
    }
  };

  const handleReturnBook = async (loanId) => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/loans/return_book/",
        { loan_id: loanId }
      );
      alert(res.data.message || "Book marked as returned.");
      fetchBorrowedBooks();
      fetchBooks();
    } catch (err) {
      console.error("Failed to mark book as returned:", err);
      alert("Failed to mark as returned. Please try again.");
    }
  };

  // --------------------------------
  // UI RENDER
  // --------------------------------
  const currentlyBorrowedCount = borrowedBooks.filter(
    (loan) => loan.status === "Borrowed"
  ).length;
  const availableCount = books.length - currentlyBorrowedCount;

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-profile">
          <FaUserCircle className="profile-icon" />
          <h3 className="admin-name">{librarianName}</h3>
          <p className="admin-role">
            <em>Librarian</em>
          </p>
        </div>

        <nav className="admin-nav">
          <button onClick={() => setMainContent("lendBook")}>
            <FaBookOpen /> Lend Book
          </button>
          <button onClick={handleTrackBorrowedBooks}>
            <FaBook /> Track Borrowed Books
          </button>
          <button onClick={() => setMainContent("statistics")}>
            <FaChartBar /> Statistics Overview
          </button>
        </nav>

        <div className="bottom-buttons">
          <button className="home-btn" onClick={handleHome}>
            <FaHome /> Home
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {mainContent === "overview" && (
          <>
            <h1 className="main-placeholder">
              Welcome, Librarian {librarianName} 👋
            </h1>
            <p className="main-subtext">
              Here’s a quick overview of your library system.
            </p>
            <div className="overview-cards">
              <div className="card">
                <FaBook className="card-icon" />
                <h3>{books.length} Books</h3>
                <p>Total books in the library</p>
              </div>
              <div className="card">
                <FaCheckCircle className="card-icon" />
                <h3>{books.filter((b) => b.available).length} Available</h3>
                <p>Books ready to borrow</p>
              </div>
            </div>
          </>
        )}

        {mainContent === "lendBook" && (
          <>
            <h1 className="main-placeholder">📚 Lend Books</h1>
            <p className="main-subtext">
              Click a book to lend it to a registered user or mark as returned.
            </p>
            <div className="overview-cards">
              {books.length > 0 ? (
                books.map((book) => (
                  <div key={book.id} className="card">
                    <h3>{book.title}</h3>
                    <p>{book.author}</p>
                    <p
                      className={
                        book.available ? "status available" : "status unavailable"
                      }
                    >
                      {book.available ? "Available" : "Unavailable"}
                    </p>
                    <button
                      className={book.available ? "borrow-btn" : "return-btn"}
                      onClick={async () => {
                        if (book.available) {
                          setSelectedBookId(book.id);
                          setLendModalOpen(true);
                        } else {
                          let loanId = book.current_loan?.id;
                          if (!loanId) {
                            const activeLoan = borrowedBooks.find(
                              (loan) =>
                                loan.book &&
                                loan.book.id === book.id &&
                                !loan.returned
                            );
                            loanId = activeLoan?.id;
                          }
                          if (!loanId) return alert("Loan ID missing!");
                          handleReturnBook(loanId);
                        }
                      }}
                    >
                      {book.available ? "Lend Book" : "Mark as Returned"}
                    </button>
                  </div>
                ))
              ) : (
                <p>No books available.</p>
              )}
            </div>

            {lendModalOpen && (
              <div className="lend-modal-backdrop">
                <div className="lend-modal">
                  <h2>Select a user</h2>
                  {users.length === 0 ? (
                    <p>No registered users available.</p>
                  ) : (
                    <select
                      className="user-select"
                      onChange={(e) => setSelectedUserId(Number(e.target.value))}
                      value={selectedUserId || ""}
                    >
                      <option value="" disabled>
                        Select a user
                      </option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="modal-buttons">
                    <button
                      className="borrow-btn"
                      disabled={!selectedUserId}
                      onClick={async () => {
                        await handleLendBook(selectedBookId, selectedUserId);
                        setLendModalOpen(false);
                        setSelectedUserId(null);
                        setSelectedBookId(null);
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => {
                        setLendModalOpen(false);
                        setSelectedBookId(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {mainContent === "borrowedBooks" && (
          <>
            <h1 className="main-placeholder">📖 Borrowed Books</h1>
            <p className="main-subtext">
              Here’s a list of all borrowed books and their borrowers.
            </p>
            {borrowedBooks.length > 0 ? (
              <table className="borrowed-books-table">
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Borrower</th>
                    <th>Borrowed Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowedBooks.map((borrow) => (
                    <tr key={borrow.id}>
                      <td>{borrow.book_title}</td>
                      <td>{borrow.user_name}</td>
                      <td>{borrow.borrowed_date}</td>
                      <td>{borrow.due_date}</td>
                      <td>{borrow.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No borrowed books at the moment.</p>
            )}
          </>
        )}

        {mainContent === "statistics" && (
          <>
            <h1 className="main-placeholder">📊 Statistics Overview</h1>
            <p className="main-subtext">Quick summary of library stats.</p>
            <div className="overview-cards">
              <div className="card">
                <FaBook className="card-icon" />
                <h3>{books.length} Books</h3>
                <p>Total books in the library</p>
              </div>
              <div className="card">
                <FaCheckCircle className="card-icon" />
                <h3>{availableCount} Available</h3>
                <p>Books ready to borrow</p>
              </div>
              <div className="card">
                <FaBook className="card-icon" />
                <h3>{currentlyBorrowedCount} Borrowed</h3>
                <p>Currently borrowed books</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default LibrarianDashboard;
