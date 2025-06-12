import { useState } from "react";

export default function Home() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (otp.length !== 6) {
      setMessage("OTP must be exactly 6 digits.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/client/authenticateOTP`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("OTP Verified Successfully!");
      } else {
        setMessage(data.message || "Invalid OTP. Try Again.");
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>OTP Verification</h2>
      <p>Enter the OTP sent to your email</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={otp}
          onChange={handleChange}
          maxLength="6"
          placeholder="Enter OTP"
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
