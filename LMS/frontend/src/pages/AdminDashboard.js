import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../PageStyles.css";
import axios from "axios";
import {
  FaUserCircle,
  FaBook,
  FaChartBar,
  FaUsers,
  FaClipboardList,
  FaSignOutAlt,
  FaBookOpen,
  FaUserFriends,
  FaBookmark,
  FaCheckCircle,
  FaHome,
  FaEdit,
  FaSave,
  FaTrash,
} from "react-icons/fa";

function AdminDashboard({ onLogout }) {
  const [adminName, setAdminName] = useState("Daryl Jake");
  const [mainContent, setMainContent] = useState("statistics");

  const [openMenu, setOpenMenu] = useState(null);


  // Statistics Data
  const [books, setBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [users, setUsers] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [newBook, setNewBook] = useState({
    title: "",
    author: "", 
    genre: "",
  });

  // Loan Applications / Borrow Requests
  const [applications, setApplications] = useState([]);

  const navigate = useNavigate();
  // ----------------------------
// FETCH STATISTICS FOR OVERVIEW
// ----------------------------
const fetchStatistics = async () => {
  try {
    const booksRes = await axios.get("http://127.0.0.1:8000/api/books/");
    const usersRes = await axios.get("http://127.0.0.1:8000/api/users/");
    const loansRes = await axios.get("http://127.0.0.1:8000/api/loans/");

    setBooks(booksRes.data);
    setUsers(usersRes.data);

    const borrowed = loansRes.data.filter((loan) => !loan.returned);
    setBorrowedBooks(borrowed);
  } catch (error) {
    console.error("Statistics fetch failed:", error);
  }
};

// optional: fetch initially when component mounts
useEffect(() => {
  fetchStatistics();
}, []);

// ----------------------------
// FUNCTION TO SHOW STATISTICS OVERVIEW
// ----------------------------
const handleStatisticsOverview = () => {
  setMainContent("statistics"); // switch main view
  fetchStatistics(); // fetch latest data
};

  // ----------------------------
  // LOGOUT
  // ----------------------------
  const handleLogout = () => {
    if (typeof onLogout === "function") onLogout();
    localStorage.removeItem("user");
    navigate("/auth", { replace: true });
  };

  const handleHome = () => navigate("/");
  const handleManageBooks = () => setMainContent("manageBooks");

  // ----------------------------
  // APPLICATIONS PAGE CLICK
  // ----------------------------
  const handleApprovalRequests = async () => {
    setMainContent("applications");
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/users/pending_librarians/"
      );
      setApplications(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load applications.");
    }
  };

  // ----------------------------
// TRACK BORROWED BOOKS WITH AUTO-REFRESH
// ----------------------------
const fetchBorrowedBooks = async () => {
  try {
    const res = await axios.get("http://127.0.0.1:8000/api/loans/");

    // Format data for table like LibrarianDashboard
    const formatted = res.data.map((loan) => ({
      id: loan.id,
      book_title: loan.book?.title || "Unknown",
      user_name: loan.user?.full_name || loan.user?.username || "Unknown",
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
    alert("Failed to load borrowed books.");
    setBorrowedBooks([]);
  }
};

const handleTrackBorrowedBooks = () => {
  setMainContent("borrowedBooks");
  fetchBorrowedBooks();
};

// Auto-refresh borrowed books when bookAdded or returned
useEffect(() => {
  const refreshListener = () => {
    if (mainContent === "borrowedBooks") fetchBorrowedBooks();
  };
  window.addEventListener("bookAdded", refreshListener);
  window.addEventListener("bookReturned", refreshListener);

  // Optional: poll every 30 seconds if no events
  const interval = setInterval(() => {
    if (mainContent === "borrowedBooks") fetchBorrowedBooks();
  }, 30000);

  return () => {
    window.removeEventListener("bookAdded", refreshListener);
    window.removeEventListener("bookReturned", refreshListener);
    clearInterval(interval);
  };
}, [mainContent]);


const handleManageUsers = async () => {
  setMainContent("manageUsers");
  try {
    const res = await axios.get("http://127.0.0.1:8000/api/users/");
    setUsers(res.data);
  } catch (err) {
    console.error("Failed to load users:", err);
    alert("Unable to load users.");
  }
};

// DELETE USER
const handleDeleteUser = async (id) => {
  if (!window.confirm("Are you sure you want to delete this user?")) return;

  try {
    await axios.delete(`http://127.0.0.1:8000/api/users/${id}/`);
    setUsers(users.filter((u) => u.id !== id));
    alert("User deleted.");
  } catch (err) {
    console.error(err);
    alert("Failed to delete user.");
  }
};

// Promote
const handlePromoteUser = async (id) => {
  try {
    await axios.patch(`http://127.0.0.1:8000/api/users/${id}/promote/`);
    alert("User promoted to librarian.");
    handleManageUsers();
  } catch (err) {
    console.error(err);
    alert("Failed to promote user.");
  }
};

// Demote
const handleDemoteUser = async (id) => {
  try {
    await axios.patch(`http://127.0.0.1:8000/api/users/${id}/demote/`);
    alert("Librarian demoted.");
    handleManageUsers();
  } catch (err) {
    console.error(err);
    alert("Failed to demote librarian.");
  }
};



  // ----------------------------
  // BOOK MODAL CONTROLS
  // ----------------------------
  const handleOpenAddModal = () => setShowAddModal(true);
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewBook({ title: "", author: "", genre: "" });
  };

  const handleOpenEditModal = async () => {
    setShowEditModal(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/books/");
      setBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch books for editing:", err);
      alert("Unable to load books. Please try again.");
    }
  };
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setBooks([]);
  };

  const handleOpenDeleteModal = async () => {
    setShowDeleteModal(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/books/");
      setBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch books for deletion:", err);
      alert("Unable to load books. Please try again.");
    }
  };
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setBooks([]);
  };

  // ----------------------------
  // ADD BOOK
  // ----------------------------
  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      const bookToAdd = { ...newBook, available: true };
      const res = await axios.post(
        "http://127.0.0.1:8000/api/books/",
        bookToAdd,
        { headers: { "Content-Type": "application/json" } }
      );
      alert(`Book "${res.data.title}" added successfully!`);
      handleCloseAddModal();
      window.dispatchEvent(new Event("bookAdded"));
    } catch (err) {
      console.error("Failed to add book:", err.response || err);
      alert(`Failed to add book. ${err.response?.data || ""}`);
    }
  };

  // ----------------------------
  // EDIT BOOK
  // ----------------------------
  const handleEditBookChange = (id, field, value) => {
    setBooks((prevBooks) =>
      prevBooks.map((book) => (book.id === id ? { ...book, [field]: value } : book))
    );
  };

  const handleSaveEdit = async (book) => {
    try {
      const res = await axios.put(
        `http://127.0.0.1:8000/api/books/${book.id}/`,
        book,
        { headers: { "Content-Type": "application/json" } }
      );
      alert(`"${res.data.title}" updated successfully!`);
      setBooks((prevBooks) =>
        prevBooks.map((b) => (b.id === book.id ? { ...b, expanded: false } : b))
      );
      window.dispatchEvent(new Event("bookAdded"));
    } catch (err) {
      console.error("Failed to update book:", err.response || err);
      alert("Failed to update book. Please try again.");
    }
  };

  // ----------------------------
  // DELETE BOOK
  // ----------------------------
  const handleDeleteBook = async (bookId, bookTitle) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${bookTitle}"?`
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/api/books/${bookId}/`);
      alert(`"${bookTitle}" has been deleted.`);
      setBooks((prevBooks) => prevBooks.filter((book) => book.id !== bookId));
      window.dispatchEvent(new Event("bookAdded"));
    } catch (err) {
      console.error("Failed to delete book:", err);
      alert("Failed to delete book. Please try again.");
    }
  };

  const anyBookExpanded = books.some((book) => book.expanded);

  // ----------------------------
  // APPROVE / DECLINE APPLICATIONS
  // ----------------------------
  const approveApplication = async (id) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/users/${id}/approve/`);
      alert("Application approved!");
      setApplications((prev) => prev.filter((user) => user.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to approve.");
    }
  };

  const declineApplication = async (id) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/users/${id}/decline/`);
      alert("Application declined.");
      setApplications((prev) => prev.filter((user) => user.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to decline.");
    }
  };

  // ----------------------------
  // UI RENDER
  // ----------------------------
  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-profile">
          <FaUserCircle className="profile-icon" />
          <h3 className="admin-name">{adminName}</h3>
          <p className="admin-role">
            <em>Admin</em>
          </p>
        </div>
        <nav className="admin-nav">
          <button onClick={handleManageBooks}>
            <FaBook /> Manage Books
          </button>
          <button onClick={handleTrackBorrowedBooks}>
            <FaClipboardList /> Track Borrowed Books
          </button>
          <button onClick={handleManageUsers}>
            <FaUsers /> Manage Users
          </button>
          <button onClick={handleApprovalRequests}>
            <FaCheckCircle /> Applications
          </button>
          <button onClick={handleStatisticsOverview}>
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


        {/* MANAGE USERS MODAL */}
{mainContent === "manageUsers" && (
  <div className="manage-users-page">

    <h2 className="manage-users-title">👥 Manage Users</h2>
    <p className="main-subtext">
      Promote, demote, or delete users and librarians.
    </p>

    {/* --- MODAL --- */}
    <div className="manage-users-modal">

      <div className="modal-inner">

        <div className="manage-users-grid">
          {users.length > 0 ? (
            users.map((user) => (
              <div className="user-card" key={user.id}>

                {/* Profile & Details */}
                <div className="user-card-body">
                  <div className="user-icon">
                    <i className="fas fa-user-circle"></i>
                  </div>

                  <div className="user-details">
                    <h3>{user.full_name}</h3>
                    <p>{user.username}</p>
                    <p>{user.email}</p>

                    <span
                      className={`role-badge ${
                        user.role === "librarian"
                          ? "role-librarian"
                          : "role-user"
                      }`}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* 3 DOTS MENU */}
                <div className="user-card-menu">
                  <button
                    className="menu-dots"
                    onClick={() =>
                      setOpenMenu(openMenu === user.id ? null : user.id)
                    }
                  >
                    ⋮
                  </button>

                  {openMenu === user.id && (
                    <div className="menu-dropdown">
                      {user.role === "user" && (
                        <p onClick={() => handlePromoteUser(user.id)}>Promote</p>
                      )}

                      {user.role === "librarian" && (
                        <p onClick={() => handleDemoteUser(user.id)}>Demote</p>
                      )}

                      <p
                        className="delete-option"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ))
          ) : (
            <p className="no-users">No users found.</p>
          )}
        </div>

      </div>
      {/* END modal-inner */}

    </div>
    {/* END manage-users-modal */}

  </div>
)}



      <main className="admin-main">
        {/* OVERVIEW PAGE */}
        {mainContent === "statistics" && (
  <>
    <h1 className="main-placeholder">📊 Statistics Overview</h1>
    <p className="main-subtext">
      Here’s a quick summary of your library system.
    </p>
    <div className="overview-cards">
      <div className="card">
        <FaBookOpen className="card-icon" />
        <h3>{books.length} Books</h3>
        <p>Total books in the system</p>
      </div>
      <div className="card">
        <FaBookmark className="card-icon" />
        <h3>{borrowedBooks.length} Borrowed</h3>
        <p>Currently borrowed books</p>
      </div>
      <div className="card">
        <FaCheckCircle className="card-icon" />
        <h3>{books.length - borrowedBooks.length} Available</h3>
        <p>Books ready to borrow</p>
      </div>
      <div className="card">
        <FaUserFriends className="card-icon" />
        <h3>{users.length} Users</h3>
        <p>Registered library members</p>
      </div>
    </div>
    <div className="quote-banner">
      <p>“A room without books is like a body without a soul.” – Cicero</p>
    </div>
  </>
)}


        {/* MANAGE BOOKS PAGE */}
        {mainContent === "manageBooks" && (
          <>
            <h1 className="main-placeholder">📚 Managing Books</h1>
            <p className="main-subtext">
              Add, update, or remove books from the library.
            </p>
            <div className="overview-cards">
              <div
                className="card"
                style={{ background: "#f1c40f", cursor: "pointer" }}
                onClick={handleOpenAddModal}
              >
                <FaBookOpen className="card-icon" />
                <h3>Add Book</h3>
                <p>Create a new book entry in the library.</p>
              </div>
              <div
                className="card"
                style={{ background: "#e67e22", cursor: "pointer" }}
                onClick={handleOpenEditModal}
              >
                <FaBookmark className="card-icon" />
                <h3>Update Books</h3>
                <p>Update details of existing books.</p>
              </div>
              <div
                className="card"
                style={{ background: "#e74c3c", cursor: "pointer" }}
                onClick={handleOpenDeleteModal}
              >
                <FaTrash className="card-icon" />
                <h3>Delete Book</h3>
                <p>Remove outdated or lost books.</p>
              </div>
            </div>

            {/* -- MODALS (ADD/EDIT/DELETE) SAME AS BEFORE -- */}

            {/* ADD BOOK MODAL */}
            {showAddModal && (
              <div className="modal-overlay">
                <div className="modal">
                  <h2>Add New Book</h2>
                  <form onSubmit={handleAddBook}>
                    <input
                      type="text"
                      placeholder="Book Title"
                      value={newBook.title}
                      onChange={(e) =>
                        setNewBook({ ...newBook, title: e.target.value })
                      }
                      required
                    />
                    <input
                      type="text"
                      placeholder="Author"
                      value={newBook.author}
                      onChange={(e) =>
                        setNewBook({ ...newBook, author: e.target.value })
                      }
                      required
                    />
                    <input
                      type="text"
                      placeholder="Genre"
                      value={newBook.genre}
                      onChange={(e) =>
                        setNewBook({ ...newBook, genre: e.target.value })
                      }
                      required
                    />
                    <div className="modal-buttons">
                      <button type="submit" className="submit-btn">
                        Add Book
                      </button>
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={handleCloseAddModal}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* EDIT BOOK MODAL */}
            {showEditModal && (
              <div className="modal-overlay">
                <div className="modal edit-modal">
                  <h2>Update Books</h2>
                  <div className="edit-book-list">
                    <table className="edit-book-table">
                      <thead>
                        <tr>
                          <th>Book Title</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {books.length > 0 ? (
                          books.map((book) => (
                            <React.Fragment key={book.id}>
                              <tr>
                                <td className="book-title-cell">{book.title}</td>
                                <td className="edit-btn-cell">
                                  <button
                                    className="edit-btn"
                                    onClick={() =>
                                      setBooks((prevBooks) =>
                                        prevBooks.map((b) =>
                                          b.id === book.id
                                            ? { ...b, expanded: !b.expanded }
                                            : { ...b, expanded: false }
                                        )
                                      )
                                    }
                                  >
                                    <FaEdit />
                                  </button>
                                </td>
                              </tr>
                              {book.expanded && (
                                <tr>
                                  <td colSpan="2">
                                    <div className="edit-details">
                                      <input
                                        type="text"
                                        value={book.title}
                                        onChange={(e) =>
                                          handleEditBookChange(
                                            book.id,
                                            "title",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Title"
                                      />
                                      <input
                                        type="text"
                                        value={book.author}
                                        onChange={(e) =>
                                          handleEditBookChange(
                                            book.id,
                                            "author",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Author"
                                      />
                                      <input
                                        type="text"
                                        value={book.genre || ""}
                                        onChange={(e) =>
                                          handleEditBookChange(
                                            book.id,
                                            "genre",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Genre"
                                      />
                                      <div className="modal-buttons">
                                        <button
                                          className="save-btn"
                                          onClick={() => handleSaveEdit(book)}
                                        >
                                          <FaSave /> Save
                                        </button>
                                        <button
                                          className="cancel-btn"
                                          onClick={() =>
                                            setBooks((prevBooks) =>
                                              prevBooks.map((b) =>
                                                b.id === book.id
                                                  ? { ...b, expanded: false }
                                                  : b
                                              )
                                            )
                                          }
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="2"
                              style={{ textAlign: "center", padding: "20px" }}
                            >
                              No books found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {!books.some((book) => book.expanded) && (
                    <div className="modal-buttons">
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={handleCloseEditModal}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DELETE BOOK MODAL */}
            {showDeleteModal && (
              <div className="modal-overlay">
                <div className="delete-modal">
                  <h3>Delete a Book</h3>
                  <p>Select a book to permanently delete from the system.</p>
                  <div className="delete-book-list">
                    {books.length > 0 ? (
                      books.map((book) => (
                        <div key={book.id} className="delete-book-item">
                          <span>{book.title}</span>
                          <button
                            className="confirm-delete-btn"
                            onClick={() =>
                              handleDeleteBook(book.id, book.title)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    ) : (
                      <p>No books found.</p>
                    )}
                  </div>
                  <div className="delete-modal-buttons">
                    <button
                      className="cancel-delete-btn"
                      onClick={handleCloseDeleteModal}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TRACK BORROWED BOOKS PAGE */}
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
              <td data-label="Book Title">{borrow.book_title}</td>
              <td data-label="Borrower">{borrow.user_name}</td>
              <td data-label="Borrowed Date">{borrow.borrowed_date}</td>
              <td data-label="Due Date">{borrow.due_date}</td>
              <td
                data-label="Status"
                className={
                  borrow.status === "Borrowed"
                    ? "status borrowed"
                    : "status returned"
                }
              >
                {borrow.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p>No borrowed books at the moment.</p>
    )}
  </>
)}


        {/* APPLICATIONS PAGE */}
        {mainContent === "applications" && (
          <>
            <h1 className="main-placeholder">📋 Applications</h1>
            <p className="main-subtext">
              Review librarian registration requests.
            </p>
            <div className="applications-list">
              {applications.length > 0 ? (
                applications.map((app) => (
                  <div key={app.id} className="application-card">
                    <h3>{app.full_name}</h3>
                    <p>
                      <strong>Username:</strong> {app.username}
                    </p>
                    <p>
                      <strong>Email:</strong> {app.email}
                    </p>
                    <div className="application-buttons">
                      <button
                        className="approve-btn"
                        onClick={() => approveApplication(app.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="decline-btn"
                        onClick={() => declineApplication(app.id)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No pending applications.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
