import { Routes, Route } from "react-router";
import ProtectedRoute from "./ProtectedRoute";
import OTPVerification from "../pages/public/OTPVerification";
import PersonalInformation from "../pages/private/PersonalInformation";
import IDCardUpload from "../pages/private/IDCardInformation";
import AddressDocumentUpload from "../pages/private/AddressInformation";

const AppRoutes = () => {
  return (
    <Routes>
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
        path="/id-information"
        element={
          <ProtectedRoute>
            <IDCardUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/address-information"
        element={
          <ProtectedRoute>
            <AddressDocumentUpload />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
