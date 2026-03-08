import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/layout/Footer';

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-nyu-violet to-nyu-violet-dark shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-white cursor-pointer" onClick={() => navigate('/')}>AHP Studio</h1>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="text-nyu-violet hover:underline text-sm mb-6 inline-block">← Back</button>
        <div className="bg-white rounded-lg shadow-md p-8 prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-nyu-text-primary mb-2">Privacy Policy</h1>
          <p className="text-sm text-nyu-text-secondary mb-6">Effective Date: March 7, 2026 | Last Updated: March 7, 2026</p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">1. Introduction</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio ("the Software") is committed to protecting user privacy. This Privacy Policy explains what data is collected, how it is used, and your rights regarding that data.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">2. Data Collected</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio collects and stores the following data:
          </p>
          <ul className="list-disc pl-6 text-nyu-text-secondary space-y-1 mb-4">
            <li>Account information: username, full name, email address, and hashed password</li>
            <li>Decision problem files (.AHP) saved to the cloud storage bucket</li>
            <li>Basic usage metadata: login timestamps, problem creation and modification dates</li>
          </ul>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">3. How Data Is Used</h2>
          <p className="text-nyu-text-secondary mb-4">
            User data is used solely for the operation of the Software and the administration of the course. Specifically:
          </p>
          <ul className="list-disc pl-6 text-nyu-text-secondary space-y-1 mb-4">
            <li>Account information is used for authentication and user management</li>
            <li>Decision problem files are stored to allow you to save and resume your work</li>
            <li>Usage metadata is used for system administration and troubleshooting</li>
          </ul>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">4. Data Sharing</h2>
          <p className="text-nyu-text-secondary mb-4">
            <strong>No user data is sold, shared with third parties, or used for advertising or commercial purposes.</strong> Data may be accessible to the course administrator for academic administration purposes.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">5. Data Retention</h2>
          <p className="text-nyu-text-secondary mb-4">
            User data is retained for the duration of the academic term. At the conclusion of the course or upon request, the administrator may delete user accounts and associated data.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">6. Data Security</h2>
          <p className="text-nyu-text-secondary mb-4">
            Reasonable security measures are implemented, including encrypted connections (HTTPS), hashed passwords (bcrypt), and access controls. However, no absolute guarantee of data confidentiality or security is made. Users should not store sensitive personal information, proprietary business data, or classified material in AHP Studio.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">7. Third-Party Services</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio is hosted on DigitalOcean infrastructure and uses DigitalOcean Spaces for file storage. The source code is maintained on GitHub. Use of these third-party services is subject to their respective privacy policies.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">8. Your Rights</h2>
          <p className="text-nyu-text-secondary mb-4">
            You may request access to, correction of, or deletion of your personal data by contacting the course administrator. You may download your decision problem files at any time using the Download feature in the application.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">9. Contact</h2>
          <p className="text-nyu-text-secondary mb-4">
            For privacy-related questions or concerns, please contact:
          </p>
          <p className="text-nyu-text-secondary mb-4">
            <strong>Dr. Jose Mendoza</strong><br />
            New York University<br />
            Email: jose.mendoza@nyu.edu
          </p>

          <p className="text-sm text-nyu-text-secondary mt-8 pt-4 border-t border-gray-200">Copyright 2026 by Dr. Jose Mendoza.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
