import React, { useState } from "react";
import "../styles.css";

const LoginSignup = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError("⚠️ Email and password are required!");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(`❌ ${data.error}`);
      } else {
        setMessage(isLogin ? "✅ Logged in successfully!" : "✅ Signup successful! Please verify your OTP.");
        onAuthSuccess(formData.email);
      }
    } catch (err) {
      setError("❌ Something went wrong!");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? "🔑 Login" : "🆕 Sign Up"}</h2>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
        </button>
      </form>
      <p onClick={() => setIsLogin(!isLogin)} className="toggle-link">
        {isLogin ? "❓ Don't have an account? Sign Up" : "🔙 Already have an account? Login"}
      </p>
    </div>
  );
};

export default LoginSignup;
