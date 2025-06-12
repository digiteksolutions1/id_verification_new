import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/verify" replace />;
  }

  return children;
};

export default ProtectedRoute;
