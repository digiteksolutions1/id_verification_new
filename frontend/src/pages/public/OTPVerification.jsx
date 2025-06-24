import { useState, useRef, useEffect } from "react";
import { Shield, ArrowLeft, CheckCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/Logo";
import { TrustTiles } from "../../components/TrustTiles";

export default function OTPVerification() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isComplete, setIsComplete] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef([]);
  const { authenticate, isAuthenticated } = useAuth();


  useEffect(() => {
    localStorage.removeItem("otp");
    localStorage.removeItem("token");
    localStorage.removeItem("id");
  }, []);

  // Function to handle OTP completion
  const handleOTPComplete = async (completeOTP) => {
    setIsVerifying(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/client/authenticateOTP`,
        { otp: completeOTP },
        { withCredentials: true }
      );
      toast.success(response?.data?.message);
      localStorage.setItem("otp", completeOTP);
      console.log(response.data.data);
      if (response.status == 200 && response.data.data.token) {
        authenticate(response.data.data);
        localStorage.setItem("id", response.data.data.otp_id);
        setIsVerifying(false);
        navigate("/personal-information");
      }
    } catch (e) {
      setTimeout(() => {
        toast.error(e?.response?.data?.message);
        setOtp(["", "", "", "", "", ""]);
        setIsVerifying(false);
      }, 1000);
    }
  };

  const handleChange = (index, value) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if OTP is complete
    const completeOTP = newOtp.join("");
    if (completeOTP.length === 6) {
      setIsComplete(true);
      handleOTPComplete(completeOTP);
    } else {
      setIsComplete(false);
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);

    if (pastedData.length === 6) {
      setIsComplete(true);
      handleOTPComplete(pastedData);
    }

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const resendOTP = () => {
    setOtp(["", "", "", "", "", ""]);
    setIsComplete(false);
    setIsVerifying(false);
    inputRefs.current[0]?.focus();
    // Here you would call your resend OTP API
    console.log("Resending OTP...");
  };

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-primary flex items-start pt-28 md:pt-28 justify-center p-4">
        <Logo />
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 shadow-lg border-black border-2">
              <Shield className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your Identity
            </h1>
            <p className="text-gray-700 text-sm leading-relaxed">
              We've sent a 6-digit verification code to your email address.
              Please enter it below to proceed with document upload.
            </p>
          </div>

          {/* OTP Input Card */}
          <div className="rounded-2xl p-8">
            <div className="mb-3">
              <label className="block text-md font-semibold text-black mb-4 text-center">
                Enter Verification Code
              </label>

              {/* OTP Input Fields */}
              <div className="flex justify-center space-x-1 md:space-x-3 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                      digit ? " text-black" : "hover:border-gray-600"
                    } `}
                    disabled={isVerifying}
                  />
                ))}
              </div>
              {isVerifying && (
                <div className="flex items-center justify-center text-primary mb-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2"></div>
                  <span className="text-sm font-medium">Verifying...</span>
                </div>
              )}
            </div>
          </div>
          {/* Trust Indicators */}
          <div className="mt-2 rounded-xl p-6">
            <div className="grid grid-cols-1 gap-4">
              <TrustTiles
                heading="Data Encrypted & Secure"
                description="End-to-end encryption protects your information"
              />
              <TrustTiles
                heading="GDPR Compliant"
                description="Full compliance with data protection regulations"
              />
              <TrustTiles
                heading="ICO Registered"
                description="Registered with Information Commissioner's Office"
              />
            </div>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed text-center mt-8">
            If the verification code is not working or expired — please contact
            our support team at{" "}
            <a
              href="mailto:info@digital-accountant.co.uk"
              className="font-bold underline"
            >
              compliance@digital-accountant.co.uk
            </a>{" "}
            for prompt assistance.
          </p>
        </div>
      </div>
    </>
  );
}
