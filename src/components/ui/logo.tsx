import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, className = '' }) => {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circle background */}
      <circle cx="20" cy="20" r="20" fill="#2b82e5"/>
      
      {/* Capybara body - simplified side view based on reference image */}
      <path 
        d="M8,26 C8,20 9,16 12,13 C15,10 18,9 22,10 C25,11 28,14 30,18 C32,22 32,26 30,30 C28,32 24,33 20,32 C16,31 12,29 10,26 C9,25 8.5,23 8,26 Z"
        fill="#BB8E6A"
        stroke="#6D5142"
        strokeWidth="1"
      />
      
      {/* Ear */}
      <path 
        d="M12,13 C11,12 10,11 11,10 C12,9 13,10 14,11" 
        stroke="#6D5142" 
        strokeWidth="1.5" 
        strokeLinecap="round"
        fill="#BB8E6A"
      />
      
      {/* Eye */}
      <path
        d="M24,16 C24,16.5 23.5,17 23,17 C22.5,17 22,16.5 22,16"
        stroke="#6D5142"
        strokeWidth="1"
        strokeLinecap="round"
      />
      
      {/* Nose */}
      <ellipse 
        cx="30" 
        cy="18" 
        rx="2" 
        ry="1.5" 
        fill="#6D5142" 
      />
      
      {/* Whisker spot */}
      <circle 
        cx="28" 
        cy="20" 
        r="1" 
        fill="#6D5142" 
        fillOpacity="0.7"
      />
      
      {/* Small details */}
      <path 
        d="M18,26 C18,27 19,28 20,28" 
        stroke="#6D5142" 
        strokeWidth="0.75" 
        strokeLinecap="round"
      />
      
      {/* Subtle fur texture */}
      <path 
        d="M14,20 C14,21 15,22 16,22" 
        stroke="#6D5142" 
        strokeWidth="0.75" 
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </svg>
  );
};

export default Logo;
