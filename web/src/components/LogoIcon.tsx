import React from 'react';

export default function LogoIcon({ className, size = 32 }: { className?: string, size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="url(#logoGradient)" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))' }}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      
      {/* PC / Monitor */}
      <rect x="2" y="3" width="14" height="10" rx="2" ry="2" />
      <path d="M6 13v2" />
      <path d="M12 13v2" />
      <path d="M5 15h8" />
      
      {/* Laptop */}
      <path d="M14 17h6l1.5 3H12.5l1.5-3z" />
      <path d="M14 17v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
      
      {/* Network / Connection Nodes */}
      <circle cx="5" cy="20" r="1.5" fill="#3b82f6" stroke="none" />
      <circle cx="21" cy="6" r="1.5" fill="#8b5cf6" stroke="none" />
      <path d="M6.5 20h3.5" stroke="#3b82f6" strokeDasharray="2 2" strokeWidth="1" />
      <path d="M16 6h3.5" stroke="#8b5cf6" strokeDasharray="2 2" strokeWidth="1" />
    </svg>
  );
}
