import React from 'react';
function Logo({ className = "w-10 h-10" }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Minimalist Editorial Globe Grid */}
      <circle cx="16" cy="16" r="8" stroke="#3A5A40" strokeWidth="1.5" />
      <ellipse cx="16" cy="16" rx="3.2" ry="8" stroke="#3A5A40" strokeWidth="1.1" />
      <line x1="8" y1="16" x2="24" y2="16" stroke="#3A5A40" strokeWidth="1.5" />
      <line x1="9.2" y1="12" x2="22.8" y2="12" stroke="#3A5A40" strokeWidth="1" />
      <line x1="9.2" y1="20" x2="22.8" y2="20" stroke="#3A5A40" strokeWidth="1" />
      {/* Elegant Sweeping Journey Orbit */}
      <ellipse
        cx="16"
        cy="16"
        rx="11.5"
        ry="10.5"
        stroke="#C97B4A"
        strokeWidth="1.3"
        strokeDasharray="1.8 1.8"
        transform="rotate(-28 16 16)"
      />
      {/* Adjusted Plane: Relocated and rotated to perfectly follow the orbit track */}
      <g transform="translate(26.2, 8.2) rotate(42)">
        <path
          d="M 0,-3.5 
             L 0.6,-1.5 
             L 3.5,0.2 
             L 3.5,1.0 
             L 0.6,0.2 
             L 0.6,2.4 
             L 1.6,3.2 
             L 1.6,3.6 
             L 0,3.2 
             L -1.6,3.6 
             L -1.6,3.2 
             L -0.6,2.4 
             L -0.6,0.2 
             L -3.5,1.0 
             L -3.5,0.2 
             L -0.6,-1.5 
             Z"
          fill="#C97B4A"
        />
      </g>
    </svg>
  );
}
export default Logo;