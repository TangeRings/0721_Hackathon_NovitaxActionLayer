/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface IconProps {
  className?: string;
}

export const GoogleSheetsIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 2H10C7.79 2 6 3.79 6 6V42C6 44.21 7.79 46 10 46H38C40.21 46 42 44.21 42 42V18L26 2Z" fill="#107C41" />
      <path d="M42 18H26V2L42 18Z" fill="#1F9A55" />
      <path d="M13 14H23V20H13V14Z" fill="#FFF" opacity="0.3" />
      <path d="M25 14H35V20H25V14Z" fill="#FFF" opacity="0.3" />
      <path d="M13 22H23V28H13V22Z" fill="#FFF" opacity="0.3" />
      <path d="M25 22H35V28H25V22Z" fill="#FFF" opacity="0.3" />
      <path d="M13 30H23V36H13V30Z" fill="#FFF" opacity="0.3" />
      <path d="M25 30H35V36H25V30Z" fill="#FFF" opacity="0.3" />
      {/* Inner grid lines */}
      <path d="M14 15H22V19H14V15Z" fill="#FFF" />
      <path d="M26 15H34V19H26V15Z" fill="#FFF" />
      <path d="M14 23H22V27H14V23Z" fill="#FFF" />
      <path d="M26 23H34V27H26V23Z" fill="#FFF" />
      <path d="M14 31H22V35H14V31Z" fill="#FFF" />
      <path d="M26 31H34V35H26V31Z" fill="#FFF" />
    </svg>
  );
};

export const GoogleFormsIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 2H10C7.79 2 6 3.79 6 6V42C6 44.21 7.79 46 10 46H38C40.21 46 42 44.21 42 42V18L26 2Z" fill="#7248B9" />
      <path d="M42 18H26V2L42 18Z" fill="#8E65D3" />
      {/* Document content */}
      <circle cx="15" cy="18" r="2.5" fill="white" />
      <rect x="21" y="17" width="14" height="2" rx="1" fill="white" />
      <circle cx="15" cy="26" r="2.5" fill="white" />
      <rect x="21" y="25" width="14" height="2" rx="1" fill="white" />
      <circle cx="15" cy="34" r="2.5" fill="white" />
      <rect x="21" y="33" width="14" height="2" rx="1" fill="white" />
    </svg>
  );
};

export const GmailIcon: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Blue Left Column */}
      <path d="M6 10V38C6 39.1 6.9 40 8 40H14V16L6 10Z" fill="#4285F4" />
      {/* Green Right Column */}
      <path d="M42 10V38C42 39.1 41.1 40 40 40H34V16L42 10Z" fill="#34A853" />
      {/* Red Top / V-Shape / Bottom Body */}
      <path d="M34 8L24 16L14 8V16L24 24L34 16V8Z" fill="#EA4335" />
      {/* Yellow fold accent or soft Red shadow */}
      <path d="M14 8H6V10L14 16V8Z" fill="#FBBC05" />
      <path d="M34 8H42V10L34 16V8Z" fill="#EA4335" />
    </svg>
  );
};
