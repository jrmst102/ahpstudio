import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-sm text-nyu-text-secondary">
            Copyright 2026 by Dr. Jose Mendoza.
          </p>
          <p className="text-sm text-nyu-text-secondary">
            v 1.1.3
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/terms')}
              className="text-sm text-nyu-text-secondary hover:text-nyu-violet transition-colors"
            >
              Terms and Conditions
            </button>
            <button
              onClick={() => navigate('/privacy')}
              className="text-sm text-nyu-text-secondary hover:text-nyu-violet transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
