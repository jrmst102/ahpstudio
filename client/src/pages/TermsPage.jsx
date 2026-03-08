import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/layout/Footer';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Simple header for public pages */}
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
          <h1 className="text-3xl font-bold text-nyu-text-primary mb-2">Terms and Conditions</h1>
          <p className="text-sm text-nyu-text-secondary mb-6">Effective Date: March 7, 2026 | Last Updated: March 7, 2026</p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">1. Acceptance of Terms</h2>
          <p className="text-nyu-text-secondary mb-4">
            By accessing, downloading, installing, or using AHP Studio (the "Software"), you agree to be bound by these Terms and Conditions. If you do not agree to these Terms, you must not access or use the Software.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">2. Description of the Software</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio is an open-source, web-based decision support application that implements the Analytic Hierarchy Process (AHP). The Software enables users to define multi-criteria decision problems, perform pairwise comparisons, compute priority vectors and consistency ratios, synthesize global rankings, and conduct sensitivity analyses.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">3. Intellectual Foundation and Academic Attribution</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio is based on the Analytic Hierarchy Process (AHP), a multi-criteria decision-making methodology invented by <strong>Dr. Thomas L. Saaty</strong> (1926–2017). All users, contributors, and distributors must acknowledge the intellectual foundation of the AHP methodology. Any published work presenting results obtained through AHP Studio must include a citation to Dr. Saaty's foundational work:
          </p>
          <blockquote className="border-l-4 border-nyu-violet pl-4 italic text-nyu-text-secondary mb-4">
            Saaty, T. L. (1980). <em>The Analytic Hierarchy Process: Planning, Priority Setting, Resource Allocation.</em> New York: McGraw-Hill.
          </blockquote>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">4. Open Source License (MIT)</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio is released as free and open-source software under the <strong>MIT License</strong>.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-nyu-text-secondary mb-4 font-mono">
            <p className="mb-2">Copyright (c) 2026 Dr. Jose Mendoza</p>
            <p className="mb-2">
              Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
            </p>
            <p className="mb-2">
              The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
            </p>
            <p>
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
            </p>
          </div>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">5. Academic Use Designation</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio is designed and intended exclusively for <strong>academic and educational purposes</strong>. The Software is <strong>not intended</strong> for use as the sole or primary basis for professional, commercial, financial, medical, legal, military, governmental, or any other high-stakes decision-making. Users who choose to apply AHP Studio beyond academic exercises do so entirely at their own risk.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">6. Disclaimer of Warranties</h2>
          <p className="text-nyu-text-secondary mb-4">
            The Software is provided on an "AS IS" and "AS AVAILABLE" basis. No express or implied warranties are made, including but not limited to warranties of correctness, accuracy, completeness, reliability, fitness for a particular purpose, uninterrupted availability, or error-free operation. No guarantee is made that computations are free from numerical errors, rounding artifacts, or implementation defects.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">7. Limitation of Liability</h2>
          <p className="text-nyu-text-secondary mb-4">
            To the maximum extent permitted by applicable law, in no event shall Dr. Jose Mendoza, the contributors, the hosting institution, or any affiliated parties be liable for any direct, indirect, incidental, special, consequential, or exemplary damages arising out of or in connection with the use of the Software.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">8. User Accounts and Conduct</h2>
          <p className="text-nyu-text-secondary mb-4">
            User accounts are created by the course administrator. Users are responsible for maintaining the confidentiality of their login credentials. Accounts are locked after three consecutive failed login attempts. You agree to use AHP Studio only for lawful academic purposes consistent with the intent of the course.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">9. Data and Privacy</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio collects and stores: account information (username, full name, email, hashed password), decision problem files (.AHP), and basic usage metadata. User data is used solely for the operation of the Software and the administration of the course. No user data is sold, shared with third parties, or used for advertising. Users are advised to maintain their own backups of important work.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">10. Third-Party Services</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio is hosted on DigitalOcean infrastructure and uses DigitalOcean Spaces for file storage. The source code is maintained on GitHub. Use of these third-party services is subject to their respective terms of service and privacy policies.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">11. Modifications</h2>
          <p className="text-nyu-text-secondary mb-4">
            AHP Studio may be modified, updated, or discontinued at any time without prior notice. These Terms may be updated from time to time. Continued use of the Software after changes constitutes acceptance of the revised Terms.
          </p>

          <h2 className="text-xl font-semibold text-nyu-text-primary mt-8 mb-3">12. Governing Law</h2>
          <p className="text-nyu-text-secondary mb-4">
            These Terms shall be governed by and construed in accordance with the laws of the State of New York, United States of America.
          </p>

          <p className="text-sm text-nyu-text-secondary mt-8 pt-4 border-t border-gray-200">Copyright 2026 by Dr. Jose Mendoza.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage;
