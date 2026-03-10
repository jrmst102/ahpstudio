/**
 * Constants and configuration values for AHP Studio
 */

// Constraints
export const MAX_ALTERNATIVES = 12;
export const MAX_CRITERIA = 10;
export const MAX_SUB_CRITERIA = 7;
export const MAX_HIERARCHY_DEPTH = 3;
export const MAX_PARTICIPANTS = 12;

// Saaty's fundamental scale
export const SAATY_SCALE = [
  { value: 9, label: 'Extreme', description: 'Extreme importance' },
  { value: 8, label: 'Very Strong+', description: 'Very strong to extreme' },
  { value: 7, label: 'Very Strong', description: 'Very strong importance' },
  { value: 6, label: 'Strong+', description: 'Strong to very strong' },
  { value: 5, label: 'Strong', description: 'Strong importance' },
  { value: 4, label: 'Moderate+', description: 'Moderate to strong' },
  { value: 3, label: 'Moderate', description: 'Moderate importance' },
  { value: 2, label: 'Weak+', description: 'Weak to moderate' },
  { value: 1, label: 'Equal', description: 'Equal importance' },
  { value: 1/2, label: 'Weak-', description: 'Weak to moderate' },
  { value: 1/3, label: 'Moderate-', description: 'Moderate importance' },
  { value: 1/4, label: 'Moderate-', description: 'Moderate to strong' },
  { value: 1/5, label: 'Strong-', description: 'Strong importance' },
  { value: 1/6, label: 'Strong-', description: 'Strong to very strong' },
  { value: 1/7, label: 'Very Strong-', description: 'Very strong importance' },
  { value: 1/8, label: 'Very Strong-', description: 'Very strong to extreme' },
  { value: 1/9, label: 'Extreme-', description: 'Extreme importance' },
];

// Consistency ratio threshold
export const CR_THRESHOLD = 0.10;

// NYU Color palette
export const COLORS = {
  nyuViolet: '#57068C',
  ultraViolet: '#330662',
  mediumViolet: '#702B9D',
  lightViolet1: '#AB82C5',
  lightViolet2: '#EEE6F3',
  black: '#000000',
  darkGray: '#404040',
  mediumGray: '#6D6D6D',
  white: '#FFFFFF',
  successGreen: '#2E7D32',
  warningRed: '#C62828',
};

// Chart colors for alternatives
export const CHART_COLORS = [
  '#57068C', // NYU Violet
  '#702B9D', // Medium Violet
  '#AB82C5', // Light Violet 1
  '#330662', // Ultra Violet
  '#2E7D32', // Green
  '#1976D2', // Blue
  '#F57C00', // Orange
  '#C62828', // Red
  '#7B1FA2', // Purple
  '#0288D1', // Light Blue
  '#388E3C', // Light Green
  '#E64A19', // Deep Orange
];

// Password validation regex
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

// Username validation regex
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
