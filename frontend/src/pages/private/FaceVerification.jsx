import { useState, useRef, useCallback, useEffect } from "react";
import {
  Shield,
  Camera,
  RefreshCw,
  X,
  AlertCircle,
  Upload,
} from "lucide-react";
import Webcam from "react-webcam";
import axios from "axios";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { getToken } from "../../utils/storage";
import toast, { Toaster } from "react-hot-toast";

export default function SelfieVerification() {
  // States for managing the capture process
  const [capturePhase, setCapturePhase] = useState("initial"); // initial, recording, review, uploading
  const [currentPose, setCurrentPose] = useState("front"); // front, left, right
  const [capturedImages, setCapturedImages] = useState({
    front: null,
    left: null,
    right: null,
  });
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();
  const token = getToken();
  const { isImages, client } = useAuth();

  // Refs
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Pose instructions
  const poseInstructions = {
    front: "Look directly at the camera with a neutral expression",
    left: "Turn your head slightly to the left",
    right: "Turn your head slightly to the right",
  };

  // Check if device is mobile
  useEffect(() => {
    if (!isImages) {
      navigate("/thankyou");
    }
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

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Handle recorded video data
  const handleDataAvailable = useCallback(({ data }) => {
    if (data.size > 0) {
      recordedChunksRef.current.push(data);
    }
  }, []);

  // Handle recording stop
  const handleRecordingStop = useCallback(() => {
    if (recordedChunksRef.current.length > 0) {
      const blob = new Blob(recordedChunksRef.current, {
        type: "video/webm",
      });
      const url = URL.createObjectURL(blob);
      setRecordedVideo({
        url,
        blob,
      });
      recordedChunksRef.current = [];
    }
  }, []);

  // Start video recording
  const startRecording = useCallback(() => {
    if (webcamRef.current && webcamRef.current.stream) {
      setRecordingTime(0);
      recordedChunksRef.current = [];

      try {
        const options = { mimeType: "video/webm;codecs=vp9" };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = "video/webm;codecs=vp8";
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = "video/webm";
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
              options.mimeType = "";
            }
          }
        }

        mediaRecorderRef.current = new MediaRecorder(
          webcamRef.current.stream,
          options
        );

        mediaRecorderRef.current.ondataavailable = handleDataAvailable;
        mediaRecorderRef.current.onstop = handleRecordingStop;

        mediaRecorderRef.current.start(100);
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting recording:", error);
        setErrors({ recording: "Failed to start video recording" });
      }
    }
  }, [handleDataAvailable, handleRecordingStop]);

  // Stop video recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Start the capture process
  const startCapture = () => {
    setCapturePhase("recording");
    setCurrentPose("front");
    setRecordedVideo(null);
    setCapturedImages({
      front: null,
      left: null,
      right: null,
    });
    setRecordingTime(0);
  };

  // Capture image for current pose
  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();

      // Update captured images
      setCapturedImages((prev) => ({
        ...prev,
        [currentPose]: imageSrc,
      }));

      // Start recording when first pose is captured
      if (currentPose === "front" && !isRecording) {
        startRecording();
      }

      // Move to next pose or finish
      if (currentPose === "front") {
        setCurrentPose("left");
      } else if (currentPose === "left") {
        setCurrentPose("right");
      } else if (currentPose === "right") {
        // All poses captured, stop recording and move to review
        stopRecording();
        setCapturePhase("review");
      }
    }
  }, [currentPose, isRecording, startRecording, stopRecording]);

  // Delete a captured image
  const deleteImage = (pose) => {
    setCapturedImages((prev) => ({
      ...prev,
      [pose]: null,
    }));
  };

  // Delete recorded video
  const deleteVideo = () => {
    if (recordedVideo && recordedVideo.url) {
      URL.revokeObjectURL(recordedVideo.url);
    }
    setRecordedVideo(null);
  };

  // Restart the capture process
  const restartCapture = () => {
    // Clean up existing resources
    if (recordedVideo && recordedVideo.url) {
      URL.revokeObjectURL(recordedVideo.url);
    }

    // Reset states
    setCapturedImages({
      front: null,
      left: null,
      right: null,
    });
    setRecordedVideo(null);
    setCurrentPose("front");
    setCapturePhase("recording");
    setErrors({});
    setRecordingTime(0);
  };

  // Upload captured content to server
  const uploadContent = async () => {
    if (
      !capturedImages.front ||
      !capturedImages.left ||
      !capturedImages.right ||
      !recordedVideo
    ) {
      setErrors({
        upload: "Please capture all required images and video before uploading",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      const appendImageToFormData = async (pose) => {
        const response = await fetch(capturedImages[pose]);
        const blob = await response.blob();
        formData.append(`${pose}_pose`, blob, `${pose}_pose.jpg`);
      };
      await Promise.all([
        appendImageToFormData("front"),
        appendImageToFormData("left"),
        appendImageToFormData("right"),
      ]);
      formData.append(
        "verification_video",
        recordedVideo.blob,
        "verification.webm"
      );
      formData.append("client", client);
      const response = await axios.post(
        "http://localhost:3002/client/upload-verification",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response);

      if (response.data.success) {
        // Navigate to success page on successful upload
        toast.success("Files Uploaded Successfully");
        navigate("/thankyou");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading content:", error);
      toast.error("Error in uploading the files");
      setErrors({
        upload: "Failed to upload verification content. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recordedVideo && recordedVideo.url) {
        URL.revokeObjectURL(recordedVideo.url);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [recordedVideo, isRecording]);

  // Render different UI based on capture phase
  const renderContent = () => {
    switch (capturePhase) {
      case "initial":
        return (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Selfie Verification
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                We need to verify your identity with a quick video recording and
                three photos with different poses.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  Important:
                </p>
                <p className="text-xs text-blue-700">
                  This process will record a video with audio. Please ensure
                  you're in a quiet environment and your microphone is working.
                </p>
              </div>

              <ul className="text-left text-sm text-gray-600 mb-6 space-y-2 max-w-md mx-auto">
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-blue-600 rounded-full mr-2 mt-1 flex-shrink-0"></span>
                  Ensure you're in a well-lit area
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-blue-600 rounded-full mr-2 mt-1 flex-shrink-0"></span>
                  Remove glasses, hats, or anything covering your face
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-blue-600 rounded-full mr-2 mt-1 flex-shrink-0"></span>
                  Follow the on-screen instructions for each pose
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-4 h-4 bg-blue-600 rounded-full mr-2 mt-1 flex-shrink-0"></span>
                  The process will take less than a minute
                </li>
              </ul>
            </div>
            <button
              onClick={startCapture}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <Camera className="w-5 h-5 mr-2" />
              <span>Start Verification</span>
            </button>
          </div>
        );

      case "recording":
        return (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {isRecording ? "Recording Verification Video" : "Capture Poses"}
              </h2>
              {isRecording && (
                <div className="flex items-center">
                  <div className="flex items-center mr-4">
                    <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></span>
                    <span className="text-sm text-red-600 font-medium">
                      REC
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {recordingTime}s
                  </span>
                </div>
              )}
            </div>

            <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: "user",
                  width: 1280,
                  height: 720,
                }}
                className="w-full rounded-lg"
              />

              {/* Pose overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  <div className="w-48 h-64 border-4 border-white border-opacity-50 rounded-full flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-lg font-semibold mb-2">
                        {currentPose === "front" && "Look Forward"}
                        {currentPose === "left" && "Turn Left"}
                        {currentPose === "right" && "Turn Right"}
                      </div>
                      <div className="text-sm opacity-75">
                        Position your face in the oval
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instruction overlay */}
              <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm animate-fadeIn">
                  {poseInstructions[currentPose]}
                </div>
              </div>

              {/* Pose indicator */}
              <div className="absolute bottom-20 left-0 right-0 flex justify-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    currentPose === "front"
                      ? "bg-blue-500"
                      : capturedImages.front
                      ? "bg-green-500"
                      : "bg-gray-400"
                  } transition-colors`}
                ></div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    currentPose === "left"
                      ? "bg-blue-500"
                      : capturedImages.left
                      ? "bg-green-500"
                      : "bg-gray-400"
                  } transition-colors`}
                ></div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    currentPose === "right"
                      ? "bg-blue-500"
                      : capturedImages.right
                      ? "bg-green-500"
                      : "bg-gray-400"
                  } transition-colors`}
                ></div>
              </div>

              {/* Capture button */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button
                  onClick={captureImage}
                  className="bg-white hover:bg-gray-100 text-gray-800 rounded-full p-4 shadow-lg transition-transform hover:scale-105"
                  aria-label="Capture photo"
                >
                  <Camera className="w-8 h-8" />
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Pose{" "}
                {currentPose === "front"
                  ? "1"
                  : currentPose === "left"
                  ? "2"
                  : "3"}{" "}
                of 3
              </p>
              <p className="text-xs text-gray-500">
                Click the camera button when you're in the correct position
              </p>
            </div>
          </div>
        );

      case "review":
        return (
          <>
            <Toaster />
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Review Your Verification
              </h2>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Captured Photos
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {["front", "left", "right"].map((pose) => (
                    <div key={pose} className="relative">
                      <img
                        src={capturedImages[pose] || "/placeholder.svg"}
                        alt={`${pose} pose`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        onClick={() => deleteImage(pose)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                        aria-label={`Delete ${pose} image`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-center mt-1 text-gray-600">
                        {pose.charAt(0).toUpperCase() + pose.slice(1)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Recorded Video ({recordingTime}s)
                </h3>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  {recordedVideo ? (
                    <>
                      <video
                        src={recordedVideo.url}
                        controls
                        className="w-full rounded-lg"
                        style={{ maxHeight: "300px" }}
                      />
                      <button
                        onClick={deleteVideo}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                        aria-label="Delete video"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                      <span className="text-gray-500 text-sm">
                        Video processing complete
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={restartCapture}
                  className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  <span>Retake</span>
                </button>
                <button
                  onClick={uploadContent}
                  disabled={isUploading || !recordedVideo}
                  className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 flex-1 flex items-center justify-center ${
                    isUploading || !recordedVideo
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      <span>Uploading {uploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      <span>Upload Verification</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex justify-center pt-28">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Identity Verification
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Please complete the selfie verification process to confirm your
              identity.
            </p>
          </div>
          {renderContent()}
        </div>
      </div>
    </>
  );
}
