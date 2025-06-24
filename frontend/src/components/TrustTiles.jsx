import { CheckCircle } from "lucide-react";

export const TrustTiles = ({ heading, description }) => {
  return (
    <div className="flex items-center ml-10">
      <div className="flex-shrink-0">
        <div className="w-6 h-6 rounded-full flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-black" />
        </div>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-gray-900">{heading}</h3>
        <p className="text-xs text-gray-700 mt-0.5">{description}</p>
      </div>
    </div>
  );
};
