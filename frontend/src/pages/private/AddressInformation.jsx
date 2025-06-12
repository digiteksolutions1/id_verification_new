import { useState, useRef, useCallback, useEffect } from "react";
import {
  Shield,
  Upload,
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import Webcam from "react-webcam";

export default function AddressDocumentUpload() {
  const [addressDocument, setAddressDocument] = useState(null);
  const [activeCamera, setActiveCamera] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState("utility"); // utility, bank, government, other
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

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
  const acceptedImageFormats = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/webp",
    "image/heic",
    "image/heif",
  ];

  const acceptedDocFormats = ["application/pdf"];
  const acceptedFormats = [...acceptedImageFormats, ...acceptedDocFormats];

  // File validation
  const validateFile = (file) => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return "Unsupported file format. Please upload JPG, PNG, GIF, BMP, WEBP, HEIC image or PDF document.";
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return "File size exceeds 5MB limit. Please upload a smaller file.";
    }

    return null;
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrors({ ...errors, document: error });
      return;
    }

    // Clear any previous errors
    setErrors({ ...errors, document: null });

    // Create preview URL
    const fileUrl = URL.createObjectURL(file);
    setAddressDocument({
      file,
      url: fileUrl,
      type: file.type,
      isPdf: file.type === "application/pdf",
    });
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
          const file = new File([blob], "address-document.jpg", {
            type: "image/jpeg",
          });
          const error = validateFile(file);

          if (error) {
            setErrors({ ...errors, document: error });
            return;
          }

          // Clear any previous errors
          setErrors({ ...errors, document: null });
          setAddressDocument({
            file,
            url: imageSrc,
            type: "image/jpeg",
            isPdf: false,
          });
          setActiveCamera(false);
        });
    }
  }, [errors]);

  // Handle document removal
  const handleRemoveDocument = () => {
    setAddressDocument(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setErrors({ ...errors, document: null });
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsUploading(true);

    try {
      // Here you would typically upload the document to your server
      // Example API call:
      // const formData = new FormData()
      // formData.append('addressDocument', addressDocument.file)
      // formData.append('documentType', documentType)
      // const response = await fetch('/api/upload-address-document', {
      //   method: 'POST',
      //   body: formData
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("Address document uploaded successfully!");
      // Here you would typically navigate to the next step
    } catch (error) {
      console.error("Error uploading document:", error);
      setErrors({
        ...errors,
        submit: "Failed to upload document. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Get document type label
  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case "utility":
        return "Utility Bill";
      case "bank":
        return "Bank Statement";
      case "government":
        return "Government Letter";
      case "other":
        return "Other Document";
      default:
        return "Address Document";
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex justify-center md:pt-28">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Upload Address Proof
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Please upload a document that verifies your current residential
              address. This could be a utility bill, bank statement, or phone
              bill.
            </p>
          </div>

          {/* Main Content */}
          {activeCamera ? (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Capture Address Document
                </h2>
                <button
                  onClick={() => setActiveCamera(false)}
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
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
                    aria-label="Take photo"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Document Type Selection */}
              <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Document Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setDocumentType("utility")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      documentType === "utility"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center cursor-pointer">
                      <FileText className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Utility Bill</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setDocumentType("bank")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      documentType === "bank"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center cursor-pointer">
                      <FileText className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">
                        Bank Statement
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setDocumentType("government")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      documentType === "government"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center cursor-pointer">
                      <FileText className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Phone Bill</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setDocumentType("other")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      documentType === "other"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center cursor-pointer">
                      <FileText className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Other</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Document Upload */}
              <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Upload {getDocumentTypeLabel(documentType)}
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 ${
                    errors.document
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 hover:border-blue-400"
                  } transition-colors duration-200`}
                >
                  {addressDocument ? (
                    <div className="relative">
                      {addressDocument.isPdf ? (
                        <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded">
                          <FileText className="w-16 h-16 text-blue-600 mb-2" />
                          <p className="text-sm font-medium text-gray-800">
                            {addressDocument.file.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(addressDocument.file.size / 1024 / 1024).toFixed(
                              2
                            )}{" "}
                            MB
                          </p>
                        </div>
                      ) : (
                        <img
                          src={addressDocument.url || "/placeholder.svg"}
                          alt="Address document"
                          className="w-full h-64 object-contain rounded"
                        />
                      )}
                      <button
                        onClick={handleRemoveDocument}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                        aria-label="Remove document"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2">
                      {/* <div className="mb-4 bg-gray-100 p-3 rounded-lg">
                        <img
                          src="/placeholder.svg?height=100&width=160"
                          alt="Address Document Example"
                          className="w-40 h-28 object-cover"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-2 text-center">
                        Upload a clear image or PDF of your address document
                      </p> */}
                      <p className="text-xs text-gray-500 mb-4 text-center">
                        Document must show your full name and current address
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center">
                        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors shadow-md">
                          <Upload className="w-4 h-4 mr-2" />
                          <span>Upload Document</span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.heic,.pdf"
                            onChange={handleFileUpload}
                            ref={fileInputRef}
                          />
                        </label>
                        <button
                          onClick={() => setActiveCamera(true)}
                          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          <span>Use Camera</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {errors.document && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="text-xs">{errors.document}</span>
                  </div>
                )}
              </div>

              {/* Document Requirements */}
              <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100 mb-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Document Requirements:
                  </h3>
                  <ul className="text-xs text-blue-700 space-y-1 pl-5 list-disc">
                    <li>Document must be dated within the last 3 months</li>
                    <li>Maximum file size: 5MB</li>
                    <li>
                      Supported formats: JPG, PNG, GIF, BMP, WEBP, HEIC images
                      or PDF
                    </li>
                    <li>
                      Document must clearly show your full name and current
                      address
                    </li>
                    <li>All text must be clearly readable</li>
                    <li>No screenshots of digital documents</li>
                  </ul>
                </div>

                {/* Continue Button */}
                <div className="flex justify-center mt-5">
                  <button
                    onClick={handleSubmit}
                    disabled={isUploading || !addressDocument}
                    className={`w-1/2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      isUploading || !addressDocument
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
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span>Continue</span>
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
