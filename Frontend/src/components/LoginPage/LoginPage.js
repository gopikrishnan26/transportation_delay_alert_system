import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // Attractive CSS file

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    mobileNo: "",
    password: "",
    role: "driver",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Correct key name — backend returns userID, not id
        localStorage.setItem("userId", data.userID);
        localStorage.setItem("userRole", data.role);

        // ✅ Navigate by role
        if (data.role === "driver") {
          navigate("/driver-dashboard");
        } else if (data.role === "admin") {
          navigate("/admin-dashboard");
        }
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please check the console or server logs.");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Welcome Back 👋</h2>
        <p className="login-subtitle">Please log in to continue</p>

        <input
          type="text"
          name="mobileNo"
          placeholder="Mobile Number"
          value={formData.mobileNo}
          onChange={handleChange}
          required
          className="login-input"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="login-input"
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="login-select"
        >
          <option value="driver">Driver</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" className="login-button">
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginPage;