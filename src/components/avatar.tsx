import React from "react";

interface AvatarProps {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = "md",
  isOnline,
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const fallbackClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const initials = alt
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-300 flex items-center justify-center`}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span
            className={`${fallbackClasses[size]} font-semibold text-gray-600`}
          >
            {initials}
          </span>
        )}
      </div>
      {isOnline !== undefined && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      )}
    </div>
  );
};
