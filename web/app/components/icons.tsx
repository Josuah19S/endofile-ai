import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

// 1. Tooth Icon (representing EndoScan AI brand)
export const ToothIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <path d="M12 2C10.5 2 9 3 8 4.5 7.2 3.8 6 3.5 5 4c-1.5.8-2 2.5-2 4 0 3.5 1.5 6 2.5 8 .8 1.6 1.5 3 2 4.5.3 1 1 1.5 2 1.5.8 0 1.5-.5 1.8-1.2.3-.7.7-1.3.7-1.8 0-.5.4-.7.7-.7s.7.2.7.7c0 .5.4 1.1.7 1.8.3.7 1 1.2 1.8 1.2 1 0 1.7-.5 2-1.5.5-1.5 1.2-2.9 2-4.5 1-2 2.5-4.5 2.5-8 0-1.5-.5-3.2-2-4-.9-.5-2.2-.2-3 .5C15 3 13.5 2 12 2zm-4 6c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1zm8 0c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1z" />
  </svg>
);

// 2. Hamburger Menu Icon
export const MenuIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

// 3. Aspect Ratio / Expand Viewport Icon
export const ExpandIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9V5.25A2.25 2.25 0 0 1 6 3h3.75M14.25 3H18a2.25 2.25 0 0 1 2.25 2.25V9M20.25 15v3.75A2.25 2.25 0 0 1 18 21h-3.75M9.75 21H6a2.25 2.25 0 0 1-2.25-2.25V15" />
  </svg>
);

// 4. Flash / Bolt Icon
export const FlashIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 9.75h8.25L9.75 21.75 12 14.25H3.75z" />
  </svg>
);

// 5. Upload File / Document Icon
export const UploadIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" />
  </svg>
);

// 6. History / Reset Clock Icon
export const HistoryIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// 7. Checkmark Circle Icon (for Lima detectada card)
export const CheckCircleIcon: React.FC<IconProps> = ({ size = 24, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    width={size}
    height={size}
    className={className}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
  </svg>
);
