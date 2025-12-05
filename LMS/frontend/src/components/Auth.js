import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../PageStyles.css";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLibrarian, setIsLibrarian] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // 🧑‍💼 Admin login (hardcoded)
    if (username === "daryljake" && password === "TheExpGod") {
      const userData = { username, role: "admin" };
      localStorage.setItem("user", JSON.stringify(userData));
      alert("Welcome Admin Daryl! 👑");
      navigate("/admin", { replace: true });
      window.dispatchEvent(new Event("storage"));
      return;
    }

    if (isLogin) {
      // ✅ LOGIN
      try {
        const res = await fetch("http://127.0.0.1:8000/api/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Invalid username or password");

        const userData = data.user;

        // 🚫 Prevent pending librarians from logging in
        if (
          userData.role?.toLowerCase() === "librarian" &&
          userData.status?.toLowerCase() === "pending"
        ) {
          alert("Your librarian application is still pending approval.");
          return;
        }

        // ✅ Save approved users and librarians to localStorage
        localStorage.setItem("user", JSON.stringify(userData));
        alert(`Welcome ${userData.username || userData.full_name}!`);

        // Navigate according to role
        const role = userData.role?.toLowerCase();
        const status = userData.status?.toLowerCase();

        if (role === "admin") navigate("/admin", { replace: true });
        else if (role === "librarian" && status === "approved") navigate("/librarian", { replace: true });
        else navigate("/dashboard", { replace: true });

        window.dispatchEvent(new Event("storage"));
      } catch (err) {
        console.error(err);
        alert("Login failed: " + err.message);
      }
    } else {
      // ✅ REGISTER (User or Librarian)
      const payload = {
        username,
        password,
        email,
        full_name: fullName,
        role: isLibrarian ? "librarian" : "user",
      };

      try {
        const res = await fetch("http://127.0.0.1:8000/api/users/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");

        // Librarian → pending approval
        if (isLibrarian) {
          alert("Your librarian application has been submitted and is pending admin approval.");
          navigate("/", { replace: true });
        } else {
          // User → auto login
          localStorage.setItem("user", JSON.stringify(data));
          alert(`Registration successful! Welcome ${data.username}`);
          navigate("/dashboard", { replace: true });
        }

        window.dispatchEvent(new Event("storage"));
      } catch (err) {
        console.error(err);
        alert("Registration failed: " + err.message);
      }
    }
  };

  const handleAdminLogin = () => {
    setUsername("daryljake");
    setPassword("TheExpGod");
    alert("Admin credentials filled in. Click Login to proceed.");
  };

  const handleLibrarianRegister = () => {
    setIsLogin(false);
    setIsLibrarian(true);
    setUsername("");
    setPassword("");
    setFullName("");
    setEmail("");
    setConfirmPassword("");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>
          {isLogin
            ? "Welcome Back 👋"
            : isLibrarian
            ? "Register as Librarian 🏫"
            : "Create an Account 📝"}
        </h2>

        <p className="auth-subtext">
          {isLogin
            ? "Log in to continue to Daryl’s Library"
            : isLibrarian
            ? "Register to manage library operations"
            : "Sign up to start borrowing your favorite books"}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="auth-btn">
            {isLogin ? "Login" : isLibrarian ? "Register Librarian" : "Register"}
          </button>

          {!isLogin && !isLibrarian && (
            <p
              className="auth-admin"
              onClick={handleLibrarianRegister}
              style={{ cursor: "pointer", marginTop: "10px" }}
            >
              Register as Librarian
            </p>
          )}

          {isLogin && (
            <p className="auth-admin" onClick={handleAdminLogin}>
              Login as Admin
            </p>
          )}
        </form>

        <p
          className="auth-toggle"
          onClick={() => {
            setIsLogin(!isLogin);
            setIsLibrarian(false);
            setUsername("");
            setPassword("");
            setFullName("");
            setEmail("");
            setConfirmPassword("");
          }}
        >
          {isLogin
            ? "Don't have an account? Register here"
            : "Already have an account? Login instead"}
        </p>
      </div>
    </div>
  );
}

export default Auth;
