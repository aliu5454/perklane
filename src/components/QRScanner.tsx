'use client'

import React, { useState } from 'react';
import CustomerVerification from './CustomerVerification';
import QRModal from './QRModal';

interface CustomerOnboardingProps {
  programId: string;
  businessEmail: string;  // Changed from businessId
  passId?: string;
  onCustomerVerified?: (customerId: string) => void;
}

export default function CustomerOnboarding({ programId, businessEmail, passId, onCustomerVerified }: CustomerOnboardingProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle successful customer verification
  const handleCustomerVerified = (customerId: string) => {
    if (onCustomerVerified) {
      onCustomerVerified(customerId);
    }
    setError(null);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center space-y-6 p-6">
        <h2 className="text-2xl font-bold">Customer Onboarding</h2>
        <p className="text-gray-600">Verify customer to add them to your loyalty program</p>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowQRModal(true)}
            className="bg-black text-white px-6 py-3 rounded-[20px] hover:bg-gray-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Show QR Code
          </button>
        </div>
        
        <div className="mt-4">
          <div className="border-b border-gray-300 w-full my-4"></div>
          <p className="text-sm text-gray-500 my-4">
            Or ask the customer to directly enter their phone number below
          </p>
        </div>
        
        <CustomerVerification 
          programId={programId} 
          businessEmail={businessEmail} 
          onVerified={handleCustomerVerified} 
        />
      </div>
      
      {showQRModal && passId && (
        <QRModal 
          isOpen={showQRModal}
          passId={passId}
          qrCodeUrl={`/pass/${passId}`}
          passUrl={`/pass/${passId}`}
          passTitle="Customer Loyalty Card"
          onClose={() => setShowQRModal(false)}
        />
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-[14px] text-red-700 text-sm">
          {error}
          <button 
            className="ml-2 underline text-red-700" 
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}