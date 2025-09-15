'use client'

import { useState } from 'react'
import { Database, CheckCircle, AlertCircle, Loader2, Settings } from 'lucide-react'

interface SetupStep {
  step: string;
  success: boolean;
  message?: string;
  error?: string;
}

interface SetupResult {
  success: boolean;
  message: string;
  steps: SetupStep[];
}

export default function SetupStorageButton() {
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<SetupResult | null>(null)

  const runSetup = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch('/api/setup-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        message: `Setup failed: ${error.message}`,
        steps: []
      })
    } finally {
      setIsRunning(false)
    }
  }

  const closeSetup = () => {
    setIsSetupOpen(false)
    setResult(null)
  }

  return (
    <>
      <button
        onClick={() => setIsSetupOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        title="Setup storage for image uploads"
      >
        <Settings className="w-4 h-4" />
        Setup Storage
      </button>

      {/* Setup Modal */}
      {isSetupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Storage Setup</h3>
                <p className="text-sm text-gray-600">Configure Supabase storage for image uploads</p>
              </div>
            </div>

            {!result && !isRunning && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This will create the required storage bucket and database tables for image uploads.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={closeSetup}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={runSetup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Run Setup
                  </button>
                </div>
              </div>
            )}

            {isRunning && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600">Setting up storage...</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.message}
                    </p>
                  </div>
                </div>

                {result.steps.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Setup Steps:</h4>
                    {result.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        {step.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium">{step.step}</p>
                          <p className={step.success ? 'text-green-700' : 'text-red-700'}>
                            {step.success ? step.message : step.error}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={closeSetup}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}