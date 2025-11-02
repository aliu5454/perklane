'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Customer {
  id: string; // This is the customer_program id
  points: number;
  tier: string;
  joined_at: string;
  last_activity: string;
  program_id: string;
  customers: {
    id: string; // This is the actual customer id
    full_name: string | null;
    phone_number: string;
    email: string | null;
  }
}

interface CustomerPointsManagementProps {
  programId?: string;
}

export default function CustomerPointsManagement({ programId }: CustomerPointsManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState<number>(0);
  const [pointsNote, setPointsNote] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    // Initialize search term from URL if available
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
    
    fetchCustomers();
  }, [searchParams]);

  const fetchCustomers = async (search?: string) => {
    if (!session) {
      setError('You must be logged in to manage customers');
      setLoading(false);
      return;
    }
    console.log('Fetching customers with search:', search, session);
    
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (search || searchTerm) {
        queryParams.append('search', search || searchTerm);
      }
      
      // Add programId filter if provided
      if (programId) {
        queryParams.append('programId', programId);
      }

      
      const response = await fetch(`/api/customers?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      const data = await response.json();
      setCustomers(data.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching customers');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchTerm);
    
    // Update URL with search term
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    
    router.push(`?${params.toString()}`);
  };

  const handleUpdatePoints = async () => {
    if (!selectedCustomer || !session) return;
    
    setUpdateLoading(true);
    setError(null);
    
    try {
      // Use the customer_program id directly
      const response = await fetch(`/api/customers/${selectedCustomer.id}/points`, {
        method: 'PUT', // The API uses PUT for updating points
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: Math.abs(pointsToAdd), // Always send positive value
          updateType: pointsToAdd >= 0 ? 'add' : 'subtract', // Determine if adding or subtracting
          description: pointsNote,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update points');
      }
      
      const data = await response.json();
      
      // Update the customer in the local state
      setCustomers(customers.map(customer => 
        customer.id === selectedCustomer.id 
          ? { 
              ...customer, 
              points: data.data.new_points,
              last_activity: new Date().toISOString()
            } 
          : customer
      ));
      
      // Reset form
      setPointsToAdd(0);
      setPointsNote('');
      
      // Show success message or toast
      alert('Points updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating points');
      console.error('Error updating points:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customer Points Management</h1>
        <p className="text-gray-600">Search for customers and manage their points</p>
      </div>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex items-center">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by name or phone number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="h-12 px-6 bg-black text-white font-medium rounded-r-lg hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </div>
      </form>
      
      {/* Error message */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {/* Customer List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No customers found. Try a different search term.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr 
                    key={customer.id}
                    className={selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {customer.customers.full_name || 'Not provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.customers.phone_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium">{customer.points}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(customer.last_activity).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-black font-medium hover:underline"
                        aria-label={`Manage points for ${customer.customers.full_name || customer.customers.phone_number}`}
                      >
                        Manage Points
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Points Management Form */}
      {selectedCustomer && (
        <div className="bg-white p-6 shadow-sm rounded-lg">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">
              Update Points for {selectedCustomer.customers.full_name || selectedCustomer.customers.phone_number}
            </h2>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="text-gray-500 hover:text-black"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600">
              Current Points: <span className="font-bold">{selectedCustomer.points}</span>
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points to Add/Subtract
              </label>
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setPointsToAdd(prev => prev - 1)}
                  className="h-10 w-10 bg-gray-100 border border-gray-300 rounded-l-lg flex items-center justify-center hover:bg-gray-200"
                >
                  -
                </button>
                <input
                  type="number"
                  value={pointsToAdd}
                  onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                  className="h-10 text-center w-20 border-y border-gray-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setPointsToAdd(prev => prev + 1)}
                  className="h-10 w-10 bg-gray-100 border border-gray-300 rounded-r-lg flex items-center justify-center hover:bg-gray-200"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Use negative values to subtract points
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note (Optional)
              </label>
              <textarea
                value={pointsNote}
                onChange={(e) => setPointsNote(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                rows={3}
                placeholder="Enter a note about this points update"
              />
            </div>
            
            <div className="pt-2">
              <button
                onClick={handleUpdatePoints}
                disabled={pointsToAdd === 0 || updateLoading}
                className="w-full h-12 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : 'Update Points'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}