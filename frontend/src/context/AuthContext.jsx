import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { getToken, setToken, removeToken } from "../utils/storage";
import { useNavigate } from "react-router";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isID, setIsID] = useState(false);
  const [isAddress, setIsAddress] = useState(false);
  const [isImages, setIsImages] = useState(false);
  const [isDOB, setIsDOB] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const otp = localStorage.getItem("otp");
    if (otp) {
      //Second time
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL_SERVER}/client/auth`,
          { otp: otp },
          { withCredentials: true }
        );
        console.log("Call");

        if (response.status == 200) {
          authenticate(response.data.data);
        }
      } catch (e) {
        localStorage.removeItem("token");
        console.log(e);
      }
    }
    setLoading(false);
  };

  const authenticate = (response) => {
    setClient(response.clientName);
    setToken(response.token);
    setIsAuthenticated(true);
    setIsID(response.idDoc);
    setIsAddress(response.addressDoc);
    setIsImages(response.images);
    setIsDOB(response.dob);
  };

  return (
    <AuthContext.Provider
      value={{
        authenticate,
        isAuthenticated,
        client,
        isID,
        isAddress,
        isDOB,
        isImages,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
