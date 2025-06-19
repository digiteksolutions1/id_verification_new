"use client";

import { useState, useEffect, useRef } from "react";
import {
  Shield,
  ArrowLeft,
  Calendar,
  Phone,
  CreditCard,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function PersonalInformation() {
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    mobileNumber: "",
    ninNumber: "",
    noNIN: false,
  });
  const navigate = useNavigate();
  const { isDOB } = useAuth();

  useEffect(() => {
    if (!isDOB) {
      navigate("/id-proof");
    }
  }, []);

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const datePickerRef = useRef(null);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear() - 20
  );
  const [selectedMonth, setSelectedMonth] = useState(0);

  // Country codes data
  // const countryCodes = [
  //   { code: "+44", country: "UK", flag: "🇬🇧" },
  //   { code: "+1", country: "US", flag: "🇺🇸" },
  //   { code: "+91", country: "IN", flag: "🇮🇳" },
  //   { code: "+33", country: "FR", flag: "🇫🇷" },
  //   { code: "+49", country: "DE", flag: "🇩🇪" },
  //   { code: "+61", country: "AU", flag: "🇦🇺" },
  // ];

  // Date formatting function
  const formatDate = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Add slashes at appropriate positions
    if (digits.length >= 5) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(
        4,
        8
      )}`;
    } else if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    } else {
      return digits;
    }
  };

  // Format date from Date object to DD/MM/YYYY
  const formatDateObject = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // NIN formatting function
  const formatNIN = (value) => {
    // Remove spaces and convert to uppercase
    const cleaned = value.replace(/\s/g, "").toUpperCase();

    // Apply NIN format: AA123456A
    if (cleaned.length <= 2) {
      return cleaned.replace(/[^A-Z]/g, "");
    } else if (cleaned.length <= 8) {
      const letters = cleaned.slice(0, 2).replace(/[^A-Z]/g, "");
      const numbers = cleaned.slice(2, 8).replace(/[^0-9]/g, "");
      return letters + numbers;
    } else {
      const letters = cleaned.slice(0, 2).replace(/[^A-Z]/g, "");
      const numbers = cleaned.slice(2, 8).replace(/[^0-9]/g, "");
      const lastLetter = cleaned.slice(8, 9).replace(/[^A-Z]/g, "");
      return letters + numbers + lastLetter;
    }
  };

  // Validation functions
  const validateDate = (date) => {
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(date)) return "Please enter date in DD/MM/YYYY format";

    const [, day, month, year] = date.match(dateRegex);
    const dateObj = new Date(year, month - 1, day);
    const today = new Date();

    if (
      dateObj.getDate() != day ||
      dateObj.getMonth() != month - 1 ||
      dateObj.getFullYear() != year
    ) {
      return "Please enter a valid date";
    }

    if (dateObj >= today) {
      return "Date of birth must be in the past";
    }

    const age = today.getFullYear() - dateObj.getFullYear();
    if (age < 16 || age > 120) {
      return "Age must be between 16 and 120 years";
    }

    return null;
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^\d{7,15}$/;
    if (!mobileRegex.test(mobile)) {
      return "Please enter a valid mobile number (7-15 digits)";
    }
    return null;
  };

  const validateNIN = (nin) => {
    if (formData.noNIN) return null;

    const ninRegex = /^[A-Z]{2}\d{6}[A-Z]$/;
    if (!ninRegex.test(nin)) {
      return "NIN must be in format: AA123456A (2 letters, 6 digits, 1 letter)";
    }
    return null;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    let formattedValue = value;

    if (field === "dateOfBirth") {
      formattedValue = formatDate(value);
    } else if (field === "mobileNumber") {
      formattedValue = value.replace(/\D/g, "");
    } else if (field === "ninNumber") {
      formattedValue = formatNIN(value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));

    // Clear error when user starts typing after submission
    if (submitted && errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      noNIN: checked,
      ninNumber: checked ? "" : prev.ninNumber,
    }));

    if (submitted && checked && errors.ninNumber) {
      setErrors((prev) => ({
        ...prev,
        ninNumber: null,
      }));
    }
  };

  const handleDateSelect = (date) => {
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: formatDateObject(date),
    }));
    setShowDatePicker(false);
  };

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowDatePicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [datePickerRef]);

  const validateForm = () => {
    const newErrors = {};

    const dateError = validateDate(formData.dateOfBirth);
    if (dateError) newErrors.dateOfBirth = dateError;

    const mobileError = validateMobile(formData.mobileNumber);
    if (mobileError) newErrors.mobileNumber = mobileError;

    if (!formData.noNIN) {
      const ninError = validateNIN(formData.ninNumber);
      if (ninError) newErrors.ninNumber = ninError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const isValid = validateForm();
    const otp_id = localStorage.getItem("id");
    const token = localStorage.getItem("token");

    if (isValid) {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL_SERVER}/client/save-personal-info`,
          {
            otp_id: otp_id,
            dob: formData.dateOfBirth,
            phoneNo: formData.mobileNumber,
            NIN: formData.ninNumber,
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );
        console.log(response);
        if (response.status == 200) {
          toast.success("Success");
          console.log("1");
          navigate("/id-proof");
        }
      } catch (e) {
        console.log(e);
        toast.error(e?.response?.data?.message);
      }
    }
  };

  // Generate calendar days
  const generateCalendar = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const years = Array.from({ length: 70 }, (_, i) => currentYear - i);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const getDaysInMonth = (year, month) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
      return new Date(year, month, 1).getDay();
    };

    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;

      days.push(
        <button
          key={`day-${day}`}
          onClick={() => handleDateSelect(date)}
          disabled={!isPast}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm
            ${isToday ? "bg-blue-100 text-blue-700" : ""}
            ${isPast ? "hover:bg-blue-50" : "text-gray-300 cursor-not-allowed"}
          `}
        >
          {day}
        </button>
      );
    }

    return (
      <>
        <div className="p-4 bg-white rounded-lg shadow-lg" ref={datePickerRef}>
          <div className="flex justify-between items-center mb-4">
            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(Number.parseInt(e.target.value))
              }
              className="p-1 border rounded"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
              className="p-1 border rounded"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="h-8 w-8 flex items-center justify-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{days}</div>
        </div>
      </>
    );
  };

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-start pt-28 justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Personal Information
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Please provide your personal details to continue with the
              verification process.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="space-y-6">
              {/* Date of Birth */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleInputChange("dateOfBirth", e.target.value)
                    }
                    onClick={() => setShowDatePicker(true)}
                    maxLength={10}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                      submitted && errors.dateOfBirth
                        ? "border-red-300 focus:border-red-500 bg-red-50"
                        : "border-gray-300 focus:border-blue-500 hover:border-gray-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Calendar className="w-5 h-5" />
                  </button>
                </div>
                {showDatePicker && (
                  <div className="absolute z-10 mt-1 w-full">
                    {generateCalendar()}
                  </div>
                )}
                {submitted && errors.dateOfBirth && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.dateOfBirth}
                  </div>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Mobile Number
                </label>
                <div className="flex">
                  <input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={formData.mobileNumber}
                    onChange={(e) =>
                      handleInputChange("mobileNumber", e.target.value)
                    }
                    className={`flex-1 px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                      submitted && errors.mobileNumber
                        ? "border-red-300 focus:border-red-500 bg-red-50"
                        : "border-gray-300 focus:border-blue-500 hover:border-gray-400"
                    }`}
                  />
                </div>
                {submitted && errors.mobileNumber && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.mobileNumber}
                  </div>
                )}
              </div>

              {/* NIN Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  National Insurance Number (NIN)
                </label>
                <input
                  type="text"
                  placeholder="AA123456A"
                  value={formData.ninNumber}
                  onChange={(e) =>
                    handleInputChange("ninNumber", e.target.value)
                  }
                  maxLength={9}
                  disabled={formData.noNIN}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                    formData.noNIN
                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : submitted && errors.ninNumber
                      ? "border-red-300 focus:border-red-500 bg-red-50"
                      : "border-gray-300 focus:border-blue-500 hover:border-gray-400"
                  }`}
                />
                {submitted && errors.ninNumber && !formData.noNIN && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.ninNumber}
                  </div>
                )}

                {/* No NIN Checkbox */}
                <div className="flex items-center mt-3">
                  <input
                    type="checkbox"
                    id="noNIN"
                    checked={formData.noNIN}
                    onChange={(e) => handleCheckboxChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="noNIN" className="ml-2 text-sm text-gray-600">
                    I don't have a National Insurance Number
                  </label>
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleSubmit}
              className="w-full mt-8 py-3 px-4 rounded-lg font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl cursor-pointer"
            >
              Continue
              <ArrowRight className="w-5 h-5 inline ml-2" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
