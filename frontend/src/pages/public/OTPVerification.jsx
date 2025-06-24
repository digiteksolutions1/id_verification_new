import { useState, useRef, useEffect } from "react";
import { Shield, ArrowLeft, CheckCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Navigate, useNavigate } from "react-router";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

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
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-start pt-12 md:pt-28 justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your Identity
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              We've sent a 6-digit verification code to your email address.
              Please enter it below to proceed with document upload.
            </p>
          </div>

          {/* OTP Input Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
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
                      digit
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400 focus:border-blue-500"
                    } ${isComplete ? "border-blue-500 bg-blue-100" : ""}`}
                    disabled={isVerifying}
                  />
                ))}
              </div>

              {/* Status Indicator */}
              {/* {isComplete && !isVerifying && (
              <div className="flex items-center justify-center text-blue-600 mb-4 animate-fade-in">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Code Complete</span>
              </div>
            )} */}

              {isVerifying && (
                <div className="flex items-center justify-center text-blue-600 mb-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm font-medium">Verifying...</span>
                </div>
              )}
            </div>
          </div>
          {/* Trust Indicators */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Data Encrypted & Secure
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    End-to-end encryption protects your information
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    GDPR Compliant
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Full compliance with data protection regulations
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    ICO Registered
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Registered with Information Commissioner's Office
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed text-center mt-8">
            If the verification code is not working or expired — please contact
            our support team at{" "}
            <a
              href="mailto:info@digital-accountant.co.uk"
              className="text-blue-400 underline"
            >
              info@digital-accountant.co.uk
            </a>{" "}
            for prompt assistance.
          </p>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}</style>
      </div>
    </>
  );
}
