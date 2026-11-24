import React, { useState } from 'react';

export const CHATBOT_AVATAR_SRC = '/assets/aistudio/image_c1134e52.png';

interface HassnainLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const HassnainLogo: React.FC<HassnainLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const dimensions =
    size === 'sm'
      ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-xl'
      : size === 'lg'
        ? 'w-14 h-14 rounded-2xl'
        : size === 'xl'
          ? 'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl'
          : 'w-9 h-9 rounded-xl';

  return (
    <div
      className={`${dimensions} shrink-0 overflow-hidden bg-[#1D4E78] border border-blue-400/30 dark:border-blue-400/25 flex items-center justify-center shadow-sm ${className}`}
    >
      {!imgError ? (
        <img
          src={CHATBOT_AVATAR_SRC}
          alt="HASSNAIN AI avatar"
          referrerPolicy="no-referrer"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className={size === 'xl' ? 'w-10 h-10' : size === 'lg' ? 'w-7 h-7' : 'w-4 h-4'}
        >
          <path
            d="M8.5 7V25M23.5 7V25M8.5 16H23.5"
            className="stroke-white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 11.5L19.5 16L16 20.5L12.5 16L16 11.5Z"
            className="fill-cyan-300"
          />
        </svg>
      )}
    </div>
  );
};
