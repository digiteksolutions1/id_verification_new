import { BrowserRouter } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/Routes";

function App() {
  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App;
