import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { getToken, setToken, removeToken } from "../utils/storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return;
  });
  const [isID, setIsID] = useState(false);
  const [isAddress, setIsAddress] = useState(false);
  const [isImages, setIsImages] = useState(false);
  const [isDOB, setIsDOB] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = getToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setClient(decoded);
        setIsAuthenticated(true);
      } catch (error) {
        logout();
        console.log(error);
      }
    }
    setLoading(false);
  };

  const authenticate = (response) => {
    console.log(response);

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
