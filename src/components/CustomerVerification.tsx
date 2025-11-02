'use client'

import React, { useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import VerificationInput from 'react-verification-input';

interface CustomerVerificationProps {
  programId?: string;
  businessEmail?: string;  // Changed from businessId to businessEmail
  onVerified: (customerId: string) => void;
}

export default function CustomerVerification({ programId, businessEmail, onVerified }: CustomerVerificationProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [existingCustomer, setExistingCustomer] = useState<boolean>(false);

  // Timer for OTP expiration countdown
  React.useEffect(() => {
    if (!expiresAt) return;

    const calculateRemainingTime = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diffMs = expiry.getTime() - now.getTime();
      return Math.max(0, Math.floor(diffMs / 1000));
    };

    setRemainingTime(calculateRemainingTime());
    
    const timer = setInterval(() => {
      const remaining = calculateRemainingTime();
      setRemainingTime(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [expiresAt]);

  // Format the remaining time as MM:SS
  const formatRemainingTime = () => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if customer already exists when phone number is entered
  const checkExistingCustomer = async () => {
    if (!phoneNumber || phoneNumber.length < 10) return;
    
    try {
      // Format the phone number with '+' if it doesn't have it
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const response = await fetch(`/api/customers/check?phone=${encodeURIComponent(formattedPhone)}`);
      const data = await response.json();
      
      if (data.success && data.customer) {
        setExistingCustomer(true);
        if (data.customer.full_name) {
          setFullName(data.customer.full_name);
        }
      } else {
        setExistingCustomer(false);
      }
    } catch (err) {
      console.error("Error checking for existing customer:", err);
      setExistingCustomer(false);
    }
  };

  // Add effect to check for existing customer when phone number changes
  React.useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 10) {
      checkExistingCustomer();
    }
  }, [phoneNumber]);

  const handleSendOTP = async () => {
    if (!existingCustomer && (!fullName || fullName.trim().length < 2)) {
      setError('Please enter your full name');
      return;
    }
    
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Format the phone number with '+' if it doesn't have it
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const response = await fetch('/api/customers/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      
      // Set expiry time for countdown
      setExpiresAt(new Date(data.expiresAt));
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Build the API URL with optional query parameters
      let url = '/api/customers/verify-otp';
      const params = new URLSearchParams();
      
      if (programId) params.append('programId', programId);
      if (businessEmail) params.append('businessEmail', businessEmail);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
          fullName: fullName.trim(),
          otp 
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to verify code');
      }
      
      // Call the onVerified callback with customer ID
      onVerified(data.customerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    setOtp('');
    handleSendOTP();
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm p-6 max-w-md mx-auto">
      <h2 className="text-[24px] font-albert text-black mb-6">
        {step === 'phone' ? 'Verify your phone number' : 'Enter verification code'}
      </h2>
      
      {step === 'phone' ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Enter your mobile number to continue
            </label>
            <div className="mt-1 mb-4">
              <PhoneInput
                country={'us'}
                value={phoneNumber}
                onChange={(phone) => setPhoneNumber(phone)}
                containerClass="w-full"
                inputClass="w-full h-[44px] px-4 py-2 rounded-[20px] bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                buttonClass="rounded-l-[20px] border border-gray-200 bg-gray-50"
                disabled={isLoading}
              />
            </div>
            
            {!existingCustomer && (
              <>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Enter your full name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-[44px] px-4 py-2 rounded-[20px] bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[14px] text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <button
            type="button"
            onClick={handleSendOTP}
            disabled={isLoading}
            className="w-full h-[44px] bg-black text-white font-medium rounded-[20px] hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending code...
              </span>
            ) : 'Continue'}
          </button>
          
          <p className="text-xs text-foreground text-center">
            We'll send a verification code to this number
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                Enter the 6-digit code sent to
              </label>
              <button
                type="button"
                className="text-sm text-black font-medium hover:underline"
                onClick={() => setStep('phone')}
              >
                Edit
              </button>
            </div>
            
            <div className="mb-1 text-foreground font-medium">
              {phoneNumber}
            </div>
            
            <div className="mt-4 flex justify-center">
              <VerificationInput
                length={6}
                placeholder=""
                validChars="0-9"
                autoFocus
                onChange={setOtp}
                value={otp}
                classNames={{
                  container: "flex justify-between space-x-2",
                  character: "w-10 h-12 rounded-lg border border-gray-200 flex items-center justify-center text-xl font-medium bg-white focus:border-black focus:ring-2 focus:ring-black",
                  characterInactive: "text-gray-400",
                  characterSelected: "border-black",
                }}
              />
            </div>
            
            {remainingTime > 0 && (
              <p className="mt-2 text-sm text-gray-500 text-center">
                Code expires in {formatRemainingTime()}
              </p>
            )}
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[14px] text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <button
            type="button"
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.length !== 6}
            className="w-full h-[44px] bg-black text-white font-medium rounded-[20px] hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : 'Verify'}
          </button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading || remainingTime > 0}
              className="text-sm text-foreground hover:text-black disabled:text-gray-400"
            >
              {remainingTime > 0 ? 'Resend code' : 'Didn\'t receive code? Resend'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}