import React from 'react';

export default function EngineIcon({ className = '', strokeWidth = 1.5 }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 6L12 4" 
        strokeLinecap="round"
      />
      <path 
        d="M12 20L12 18" 
        strokeLinecap="round"
      />
      <path 
        d="M6 12L4 12" 
        strokeLinecap="round"
      />
      <path 
        d="M20 12L18 12" 
        strokeLinecap="round"
      />
      <circle 
        cx="12" 
        cy="12" 
        r="3" 
      />
      <path 
        d="M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z" 
      />
      <path 
        d="M15.5 8.5L17.5 6.5" 
        strokeLinecap="round"
      />
      <path 
        d="M6.5 17.5L8.5 15.5" 
        strokeLinecap="round"
      />
      <path 
        d="M15.5 15.5L17.5 17.5" 
        strokeLinecap="round"
      />
      <path 
        d="M6.5 6.5L8.5 8.5" 
        strokeLinecap="round"
      />
    </svg>
  );
}