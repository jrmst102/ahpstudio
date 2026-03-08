import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-nyu-violet to-nyu-violet-dark shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Title */}
          <div className="flex items-center">
            <h1
              className="text-2xl font-bold text-white cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              AHP Studio
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white hover:text-nyu-violet-ultra transition-colors"
            >
              Dashboard
            </button>

            <button
              onClick={() => navigate('/about')}
              className="text-white hover:text-nyu-violet-ultra transition-colors"
            >
              About
            </button>

            <button
              onClick={() => navigate('/what-is-ahp')}
              className="text-white hover:text-nyu-violet-ultra transition-colors"
            >
              What is AHP?
            </button>

            <button
              onClick={() => navigate('/why-ahp')}
              className="text-white hover:text-nyu-violet-ultra transition-colors"
            >
              AHP in the Age of GenAI
            </button>

            <button
              onClick={() => navigate('/help')}
              className="text-white hover:text-nyu-violet-ultra transition-colors"
            >
              Help
            </button>
            
            {isAdmin() && (
              <button
                onClick={() => navigate('/admin')}
                className="text-white hover:text-nyu-violet-ultra transition-colors"
              >
                Admin Panel
              </button>
            )}

            <button
              onClick={() => navigate('/settings')}
              className="text-white hover:text-nyu-violet-ultra transition-colors"
            >
              Settings
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3 ml-4 border-l border-nyu-violet-medium pl-6">
              <div className="text-right">
                <p className="text-white text-sm font-medium">{user?.fullName}</p>
                <p className="text-nyu-violet-ultra text-xs">{user?.username}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="!text-white !border-white hover:!bg-nyu-violet-medium">
                Logout
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
