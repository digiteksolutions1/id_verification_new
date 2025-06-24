import logo from "../assets/logo.png";
const Logo = () => {
  return (
    <div className="flex-shrink-0 flex items-center group cursor-pointer absolute md:top-8 md:left-10 top-4 md:transform-none ">
      <img src={logo} alt="digital-accountant" className="md:h-12 h-12" />
    </div>
  );
};

export default Logo;
