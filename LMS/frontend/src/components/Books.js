import React, { useState, useEffect } from "react";
import "../PageStyles.css";
import axios from "axios";
import Navbar from "./Navbar";

function BooksPage({ currentUser }) {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetchBooks();
  }, []);

  // Fetch all books
  const fetchBooks = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/books/");
      // Ensure 'available' field matches backend
      const booksData = res.data.map((book) => ({
        ...book,
        available: book.available ?? true,
      }));
      setBooks(booksData);
    } catch (err) {
      console.error("Error fetching books:", err);
    }
  };

  // Borrow a book directly without librarian approval
  const borrowBook = async (book) => {
    if (!currentUser) {
      alert("You must be logged in to borrow books.");
      return;
    }

    if (!book.available) {
      alert("This book is already borrowed.");
      return;
    }

    try {
      // Call backend borrow action
      const res = await axios.post("http://127.0.0.1:8000/api/loans/borrow_book/", {
        user_id: currentUser.id,
        book_id: book.id,
      });

      if (res.status === 201) {
        alert(`You have borrowed "${book.title}" successfully!`);

        // Update local books state
        setBooks((prevBooks) =>
          prevBooks.map((b) =>
            b.id === book.id ? { ...b, available: false } : b
          )
        );
      }
    } catch (err) {
      console.error("Error borrowing book:", err);
      alert(err.response?.data?.message || "Failed to borrow the book.");
    }
  };

  return (
    <div className="books-page">
      <header className="books-navbar">
        <Navbar />
      </header>

      <main className="books-content">
        <div className="books-header">
          <h2>📚 Available Books</h2>
          <p>Browse through our collection and borrow your next great read.</p>
        </div>

        <div className="table-wrapper">
          <table className="books-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Genre</th>
                <th>Available</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {books.length > 0 ? (
                books.map((book) => (
                  <tr key={book.id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.genre}</td>
                    <td>
                      <span
                        className={
                          book.available ? "status available" : "status unavailable"
                        }
                      >
                        {book.available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => borrowBook(book)}
                        disabled={!book.available}
                        className={`borrow-btn ${!book.available ? "disabled" : ""}`}
                      >
                        {book.available ? "Borrow" : "Unavailable"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-books">
                    No books available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default BooksPage;
