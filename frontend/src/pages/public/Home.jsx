import { useEffect } from "react";
import { useNavigate } from "react-router";

const Home = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/verify");
  }, []);
  return <div>Home</div>;
};

export default Home;
