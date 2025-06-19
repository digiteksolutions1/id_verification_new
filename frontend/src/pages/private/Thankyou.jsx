import { useState, useEffect } from "react";
import { CheckCircle, Shield, Clock, Mail, ArrowRight } from "lucide-react";
import axios from "axios";

export default function ThankYouPage() {
  const [showContent, setShowContent] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("id");
    const token = localStorage.getItem("token");
    localStorage.clear();
    const changeStatus = async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL_SERVER}/client/thankyou`,
          {
            id: id,
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );
        console.log(response);
      } catch (err) {
        console.log(err);
      }
    };
    changeStatus();

    // Stagger the animations
    const timer1 = setTimeout(() => setShowContent(true), 300);
    const timer2 = setTimeout(() => setShowCheckmark(true), 300);
    const timer3 = setTimeout(() => setShowDetails(true), 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <>
      <div className="min-h-screen bg-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Header */}

          {/* Success Card */}
          <div
            className={`bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-6 transition-all duration-700 ${
              showContent
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 transition-all duration-500 ${
                  showCheckmark
                    ? "bg-green-100 scale-100"
                    : "bg-gray-100 scale-75"
                }`}
              >
                <Mail
                  className={`w-12 h-12 transition-all duration-500 ${
                    showCheckmark
                      ? "text-green-600 scale-100"
                      : "text-gray-400 scale-75"
                  }`}
                />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Thanks for submitting!
              </h2>
              <p className="text-gray-600 text-sm">
                We have received all your verification documents and they are
                now under review.
              </p>
            </div>

            {/* Status Information */}
            <div
              className={`space-y-4 transition-all duration-700 delay-300 ${
                showDetails
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-900">
                    Processing Time
                  </h3>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Your documents will be reviewed within 24-48 hours
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </>
  );
}
