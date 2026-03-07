import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  size = 'md',
  className = '',
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-nyu-violet text-white hover:bg-nyu-violet-dark focus:ring-nyu-violet disabled:bg-nyu-violet-light disabled:cursor-not-allowed',
    secondary: 'bg-nyu-violet-medium text-white hover:bg-nyu-violet focus:ring-nyu-violet-medium disabled:bg-nyu-violet-light disabled:cursor-not-allowed',
    danger: 'bg-red-700 text-white hover:bg-red-800 focus:ring-red-700 disabled:bg-red-300 disabled:cursor-not-allowed',
    outline: 'border-2 border-nyu-violet text-nyu-violet hover:bg-nyu-violet-ultra focus:ring-nyu-violet disabled:border-nyu-violet-light disabled:text-nyu-violet-light disabled:cursor-not-allowed',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
