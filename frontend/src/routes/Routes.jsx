import { Routes, Route } from "react-router";
import ProtectedRoute from "./ProtectedRoute";
import OTPVerification from "../pages/public/OTPVerification";
import PersonalInformation from "../pages/private/PersonalInformation";
import IDCardUpload from "../pages/private/IDCardInformation";
import AddressDocumentUpload from "../pages/private/AddressInformation";
import SelfieVerification from "../pages/private/FaceVerification";
import Thankyou from "../pages/private/Thankyou";
import Home from "../pages/public/Home";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      <Route path="/verify" element={<OTPVerification />}></Route>
      <Route
        path="/personal-information"
        element={
          <ProtectedRoute>
            <PersonalInformation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/id-proof"
        element={
          <ProtectedRoute>
            <IDCardUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/address-proof"
        element={
          <ProtectedRoute>
            <AddressDocumentUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/face-verification"
        element={
          <ProtectedRoute>
            <SelfieVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path="/thankyou"
        element={
          <ProtectedRoute>
            <Thankyou />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
