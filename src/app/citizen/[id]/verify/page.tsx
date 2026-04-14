'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Phone, CreditCard, AlertCircle } from 'lucide-react';
import { citizenProfileService } from '@/services/database';

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const citizenId = params.id as string;

  const [verificationType, setVerificationType] = useState<'phone' | 'aadhar'>('phone');
  const [credentialValue, setCredentialValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [citizenExists, setCitizenExists] = useState(true);

  useEffect(() => {
    // Check if citizen exists
    const checkCitizen = async () => {
      try {
        const { data } = await citizenProfileService.getFullProfile(citizenId);
        if (!data?.citizen) {
          setCitizenExists(false);
        }
      } catch {
        setCitizenExists(false);
      } finally {
        setLoading(false);
      }
    };

    checkCitizen();
  }, [citizenId]);

  const handleVerify = async () => {
    if (!credentialValue.trim()) {
      setError(`Please enter your ${verificationType === 'phone' ? 'mobile number' : 'Aadhar ID'}`);
      return;
    }

    // Validate format
    if (verificationType === 'phone' && !/^\d{10}$/.test(credentialValue)) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }
    if (verificationType === 'aadhar' && !/^\d{12}$/.test(credentialValue)) {
      setError('Aadhar ID must be exactly 12 digits');
      return;
    }

    setIsVerifying(true);
    setError(null);

    const { success, error: verifyError } = await citizenProfileService.verifyCitizen(
      citizenId,
      { type: verificationType, value: credentialValue.trim() }
    );

    setIsVerifying(false);

    if (success) {
      // Store verification status in session storage
      sessionStorage.setItem(`verified_${citizenId}`, 'true');
      router.push(`/citizen/${citizenId}`);
    } else {
      setError(verifyError || 'Verification failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-orange-50 p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-emerald-700 mx-auto mb-4" />
          <p className="text-slate-600 text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  if (!citizenExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-orange-50 p-4">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Citizen Not Found</h1>
            <p className="text-slate-600 mb-4 text-sm sm:text-base">
              The citizen ID &quot;{citizenId}&quot; does not exist in our records.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Please check the ID and try again, or contact your registered hospital for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-orange-50 p-3 sm:p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="bg-emerald-100 p-3 sm:p-4 rounded-full">
              <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-700" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl">Verify Your Identity</CardTitle>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 px-2">
            To access the health records, please verify your identity using one of the following methods.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          {/* Verification Method Selection */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-sm sm:text-base font-medium">Choose Verification Method</Label>
            <RadioGroup
              value={verificationType}
              onValueChange={(v) => {
                setVerificationType(v as 'phone' | 'aadhar');
                setCredentialValue('');
                setError(null);
              }}
              className="grid grid-cols-2 gap-3 sm:gap-4"
            >
              <div>
                <RadioGroupItem
                  value="phone"
                  id="phone"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="phone"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-transparent p-3 sm:p-4 hover:bg-slate-50 hover:border-emerald-200 peer-data-[state=checked]:border-emerald-700 peer-data-[state=checked]:bg-emerald-50 cursor-pointer"
                >
                  <Phone className="mb-1 sm:mb-2 h-5 w-5 sm:h-6 sm:w-6 text-emerald-700" />
                  <span className="font-medium text-sm sm:text-base">Mobile</span>
                  <span className="text-xs text-slate-500 mt-0.5 sm:mt-1">10-digit number</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="aadhar"
                  id="aadhar"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="aadhar"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-transparent p-3 sm:p-4 hover:bg-slate-50 hover:border-emerald-200 peer-data-[state=checked]:border-emerald-700 peer-data-[state=checked]:bg-emerald-50 cursor-pointer"
                >
                  <CreditCard className="mb-1 sm:mb-2 h-5 w-5 sm:h-6 sm:w-6 text-emerald-700" />
                  <span className="font-medium text-sm sm:text-base">Aadhar ID</span>
                  <span className="text-xs text-slate-500 mt-0.5 sm:mt-1">12-digit Aadhar</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Input Field */}
          <div className="space-y-2">
            <Label htmlFor="credential" className="text-sm sm:text-base">
              {verificationType === 'phone' ? 'Mobile Number' : 'Aadhar ID'}
            </Label>
            <div className="relative">
              {verificationType === 'phone' ? (
                <Phone className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-slate-400" />
              ) : (
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-slate-400" />
              )}
              <Input
                id="credential"
                type="text"
                inputMode="numeric"
                placeholder={verificationType === 'phone' ? 'Enter 10-digit mobile number' : 'Enter 12-digit Aadhar ID'}
                className="pl-10 h-11 sm:h-12 text-sm sm:text-base"
                maxLength={verificationType === 'phone' ? 10 : 12}
                value={credentialValue}
                onChange={(e) => {
                  setCredentialValue(e.target.value.replace(/\D/g, ''));
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerify();
                  }
                }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {verificationType === 'phone'
                ? 'Enter the mobile number registered with this citizen ID'
                : 'Enter the Aadhar ID registered with this citizen ID'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Verify Button */}
          <Button
            className="w-full h-11 sm:h-12 text-sm sm:text-base"
            onClick={handleVerify}
            disabled={isVerifying || !credentialValue.trim()}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Verify & Continue
              </>
            )}
          </Button>

          {/* Citizen ID Display */}
          <div className="text-center pt-3 sm:pt-4 border-t">
            <p className="text-xs text-slate-500">Citizen ID</p>
            <p className="font-mono font-bold text-emerald-700 text-sm sm:text-base break-all">{citizenId}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
