import { useState, useRef, useCallback, useEffect } from "react";
import {
  Shield,
  ArrowLeft,
  Upload,
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import Webcam from "react-webcam";
import IDImage from "./idimage.png";
import axios from "axios";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

export default function IDCardUpload() {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [activeCamera, setActiveCamera] = useState(null); // 'front' or 'back' or null
  const [isMobile, setIsMobile] = useState(false);
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const webcamRef = useRef(null);
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);
  const navigate = useNavigate();
  const { isID, client, folderLink } = useAuth();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!isID) {
      navigate("/address-proof");
    }
  }, []);
  console.log(client);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Accepted file formats
  const acceptedFormats = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/webp",
    "image/heic",
    "image/heif",
  ];

  // File validation
  const validateFile = (file) => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return "Unsupported file format. Please upload JPG, PNG, GIF, BMP, WEBP, or HEIC image.";
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return "File size exceeds 5MB limit. Please upload a smaller image.";
    }

    return null;
  };

  // Handle file upload
  const handleFileUpload = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrors({ ...errors, [side]: error });
      return;
    }

    // Clear any previous errors
    setErrors({ ...errors, [side]: null });

    // Create preview URL
    const imageUrl = URL.createObjectURL(file);
    if (side === "front") {
      setFrontImage({ file, url: imageUrl });
    } else {
      setBackImage({ file, url: imageUrl });
    }
  };

  // Handle camera capture
  const handleCameraCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      // Convert base64 to blob
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `${activeCamera}-id-card.jpg`, {
            type: "image/jpeg",
          });
          const error = validateFile(file);

          if (error) {
            setErrors({ ...errors, [activeCamera]: error });
            return;
          }

          // Clear any previous errors
          setErrors({ ...errors, [activeCamera]: null });

          if (activeCamera === "front") {
            setFrontImage({ file, url: imageSrc });
          } else {
            setBackImage({ file, url: imageSrc });
          }
          setActiveCamera(null);
        });
    }
  }, [activeCamera, errors]);

  // Handle image removal
  const handleRemoveImage = (side) => {
    if (side === "front") {
      setFrontImage(null);
      if (frontInputRef.current) frontInputRef.current.value = "";
    } else {
      setBackImage(null);
      if (backInputRef.current) backInputRef.current.value = "";
    }
    setErrors({ ...errors, [side]: null });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!frontImage) {
      setErrors({
        ...errors,
        front: "Please upload the front side of your ID card",
      });
      return;
    }

    if (!backImage) {
      setErrors({
        ...errors,
        back: "Please upload the back side of your ID card",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("frontImage", frontImage.file); // assuming this is a File object
      formData.append("backImage", backImage.file);
      formData.append("client", client);
      formData.append("folderLink", folderLink);

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/client/upload-id`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      console.log(response);

      toast.success(response?.data?.message);
      navigate("/address-proof");
      // Optionally navigate to the next page here
    } catch (error) {
      toast.error("Error Uploading Images");
      console.error("Error uploading images:", error);
      setErrors({
        ...errors,
        submit: "Failed to upload images. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-start md:pt-28 justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Identification Card
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Please upload clear images of the front and back sides of your ID
              card for verification.
            </p>
          </div>

          {/* Main Content */}
          {activeCamera ? (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Capture {activeCamera === "front" ? "Front" : "Back"} Side
                </h2>
                <button
                  onClick={() => setActiveCamera(null)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close camera"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: isMobile ? "environment" : "user",
                  }}
                  className="w-full rounded-lg"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button
                    onClick={handleCameraCapture}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-5 shadow-lg"
                    aria-label="Take photo"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Upload Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                {/* Front Side Upload */}
                <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                    Front Side of ID Card
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-3 ${
                      errors.front
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300 hover:border-blue-400"
                    } transition-colors duration-200`}
                  >
                    {frontImage ? (
                      <div className="relative">
                        <img
                          src={frontImage.url || "/placeholder.svg"}
                          alt="Front of ID card"
                          className="w-full h-40 md:h-48 object-contain rounded"
                        />
                        <button
                          onClick={() => handleRemoveImage("front")}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="mb-3 rounded-lg">
                          <img
                            src={IDImage}
                            alt="ID Card Front Example"
                            className="w-36 h-20 object-cover"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mb-3 text-center">
                          Upload front side
                        </p>
                        <div className="flex flex-col gap-2 w-full">
                          <label className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors shadow-md text-sm">
                            <Upload className="w-4 h-4 mr-2" />
                            <span>Upload</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, "front")}
                              ref={frontInputRef}
                            />
                          </label>
                          <button
                            onClick={() => setActiveCamera("front")}
                            className="inline-flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md text-sm"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            <span>Camera</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.front && (
                    <div className="flex items-center mt-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="text-xs">{errors.front}</span>
                    </div>
                  )}
                </div>

                {/* Back Side Upload */}
                <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                    Back Side of ID Card
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-3 ${
                      errors.back
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300 hover:border-blue-400"
                    } transition-colors duration-200`}
                  >
                    {backImage ? (
                      <div className="relative">
                        <img
                          src={backImage.url || "/placeholder.svg"}
                          alt="Back of ID card"
                          className="w-full h-40 md:h-48 object-contain rounded"
                        />
                        <button
                          onClick={() => handleRemoveImage("back")}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="mb-3 rounded-lg">
                          <img
                            src={IDImage}
                            alt="ID Card Back Example"
                            className="w-36 h-20 object-cover"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mb-3 text-center">
                          Upload back side
                        </p>
                        <div className="flex flex-col gap-2 w-full">
                          <label className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors shadow-md text-sm">
                            <Upload className="w-4 h-4 mr-2" />
                            <span>Upload</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, "back")}
                              ref={backInputRef}
                            />
                          </label>
                          <button
                            onClick={() => setActiveCamera("back")}
                            className="inline-flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md text-sm"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            <span>Camera</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.back && (
                    <div className="flex items-center mt-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="text-xs">{errors.back}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* File Requirements */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Image Requirements:
              </h3>
              <ul className="text-xs text-blue-700 space-y-1 pl-5 list-disc">
                <li>Maximum file size: 5MB</li>
                <li>Supported formats: JPG, PNG, GIF, BMP, WEBP, HEIC</li>
                <li>Image must be clear and all text must be readable</li>
                <li>Entire ID card must be visible in the frame</li>
                <li>No glare or shadows covering important information</li>
              </ul>
            </div>
            <div className="flex justify-center mt-5">
              <button
                onClick={handleSubmit}
                // disabled={isUploading}
                disabled={isUploading}
                className={`w-1/2 py-3 px-4 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  isUploading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                } flex items-center justify-center`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <span className="text-[17px]">Continue</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
            {errors.submit && (
              <div className="flex items-center mt-2 text-red-600 text-sm justify-center">
                <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
