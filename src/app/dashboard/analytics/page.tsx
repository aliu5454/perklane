'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import BGTexture from "@/components/layout/BGTexture";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/NavBar";
import { DashboardContentSkeleton } from "@/components/DashboardSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useToast } from "@/components/Toast";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Calendar,
  Download,
  Filter,
  ChevronDown,
  Eye,
  Clock,
  RefreshCw,
  UserCheck,
  X,
  Gift,
  Search,
  SortAsc,
  Smartphone,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface Pass {
  id: number;
  user_email: string;
  pass_type: string;
  title: string;
  pass_data: any;
  class_id: string;
  object_id: string;
  qr_code_url: string;
  pass_url: string;
  status: string;
  created_at: string;
}

interface Customer {
  id: string;
  customerId?: string;
  name: string;
  phone?: string;
  dateAdded: string;
  status: 'Active' | 'Expired' | 'Revoked';
  points?: number;
  tier?: string;
  lastActivity?: string;
}

interface AnalyticsData {
  totalViews: number;
  totalDownloads: number;
  conversionRate: number;
  activePasses: number;
  popularDevices: { device: string; count: number }[];
  viewsOverTime: { date: string; views: number; downloads: number }[];
  passPerformance: { passId: string; title: string; views: number; downloads: number }[];
  customers: Customer[];
}

function AnalyticsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const [passes, setPasses] = useState<Pass[]>([])
  const [selectedPass, setSelectedPass] = useState<Pass | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('30d')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  
  // Customer table filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Expired' | 'Revoked'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'points'>('recent')
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '7d' | '30d' | '90d'>('all')
  const [tableLoading, setTableLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    } else {
      fetchPasses()
    }
  }, [session, status, router])

  useEffect(() => {
    if (selectedPass) {
      fetchAnalyticsData()
    }
  }, [selectedPass, timeRange])

  const fetchPasses = async () => {
    try {
      setError(null)
      const response = await fetch('/api/passes')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch passes')
      }

      setPasses(data.passes)
      
      // Check for passId in URL query parameters
      const passIdFromQuery = searchParams.get('passId')
      
      // Auto-select pass from query param or first pass if available
      if (data.passes.length > 0) {
        let passToSelect = data.passes[0]
        
        if (passIdFromQuery) {
          const foundPass = data.passes.find((p: Pass) => p.id.toString() === passIdFromQuery)
          if (foundPass) {
            passToSelect = foundPass
          }
        }
        
        setSelectedPass(passToSelect)
      }
    } catch (err: any) {
      console.error('Error fetching passes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalyticsData = async () => {
    if (!selectedPass) return
    
    try {
      setIsRefreshing(true)
      setTableLoading(true)
      
      // Fetch analytics data from API
      const response = await fetch(`/api/analytics/${selectedPass.id}?timeRange=${timeRange}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics data')
      }
      
      setAnalyticsData(result.data)
    } catch (err: any) {
      console.error('Error fetching analytics:', err)
      addToast('Failed to load analytics data', 'error')
    } finally {
      setIsRefreshing(false)
      setTableLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (selectedPass) {
      await fetchAnalyticsData()
    }
  }

  // Filter and sort customers
  const getFilteredAndSortedCustomers = () => {
    if (!analyticsData?.customers) return []

    let filtered = [...analyticsData.customers]

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.customerId && customer.customerId.toLowerCase().includes(searchLower)) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchLower)) ||
        customer.id.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter)
    }

    // Apply date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date()
      const daysAgo = {
        '7d': 7,
        '30d': 30,
        '90d': 90
      }[dateRangeFilter] || 0

      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(customer => {
        const customerDate = new Date(customer.dateAdded)
        return customerDate >= cutoffDate
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        case 'oldest':
          return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
        case 'points':
          const aPoints = a.points || 0
          const bPoints = b.points || 0
          return bPoints - aPoints
        default:
          return 0
      }
    })

    return filtered
  }

  const openCustomerModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerModalOpen(true)
  }

  const closeCustomerModal = () => {
    setSelectedCustomer(null)
    setCustomerModalOpen(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Expired':
        return 'bg-yellow-100 text-yellow-800'
      case 'Revoked':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Helper function to format date
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Helper function to get pass type display name
  function getPassTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      'loyalty': 'Loyalty Program',
      'gift-card': 'Gift Card',
      'offer': 'Offer',
      'smart-tap': 'Smart Tap',
      'generic': 'Generic Pass'
    }
    return typeNames[type] || type
  }

  // Chart data processing functions
  const getUsersAddedPerDayData = () => {
    if (!analyticsData?.customers) return []
    
    // Group customers by date added
    const customersByDate = analyticsData.customers.reduce((acc, customer) => {
      const date = customer.dateAdded
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Create array of last 14 days with customer counts
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (13 - i))
      const dateString = date.toISOString().split('T')[0]
      
      return {
        date: dateString,
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: customersByDate[dateString] || 0
      }
    })

    return last14Days
  }

  const getStatusDistributionData = () => {
    if (!analyticsData?.customers) return []
    
    const statusCounts = analyticsData.customers.reduce((acc, customer) => {
      acc[customer.status] = (acc[customer.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const colors = {
      'Active': '#10b981', // green
      'Expired': '#f59e0b', // yellow/orange
      'Revoked': '#ef4444'  // red
    }

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      percentage: Math.round((count / analyticsData.customers.length) * 100),
      color: colors[status as keyof typeof colors] || '#6b7280'
    }))
  }

  const getPointsDistributionData = () => {
    if (!analyticsData?.customers) return []
    
    const customersWithPoints = analyticsData.customers.filter(c => c.points !== undefined)
    if (customersWithPoints.length === 0) return []

    // Create point ranges
    const ranges = [
      { range: '0-50', min: 0, max: 50, count: 0 },
      { range: '51-100', min: 51, max: 100, count: 0 },
      { range: '101-200', min: 101, max: 200, count: 0 },
      { range: '201-300', min: 201, max: 300, count: 0 },
      { range: '301-400', min: 301, max: 400, count: 0 },
      { range: '401+', min: 401, max: Infinity, count: 0 }
    ]

    customersWithPoints.forEach(customer => {
      const points = customer.points!
      const range = ranges.find(r => points >= r.min && points <= r.max)
      if (range) range.count++
    })

    return ranges.filter(range => range.count > 0)
  }

  const hasPointsBasedCustomers = () => {
    return analyticsData?.customers.some(c => c.points !== undefined) || false
  }

  // Custom tooltip components
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900">{`Date: ${label}`}</p>
          <p className="text-blue-600">{`New Users: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  }

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p style={{ color: data.color }}>
            {`${data.value} customers (${data.percentage}%)`}
          </p>
        </div>
      );
    }
    return null;
  }

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900">{`${label} points`}</p>
          <p className="text-purple-600">{`${payload[0].value} customers`}</p>
        </div>
      );
    }
    return null;
  }

  if (status === 'loading' || loading) {
    return (
      <main>
        <Navbar />
        <DashboardContentSkeleton />
        <Footer />
        <BGTexture/>
      </main>
    )
  }

  if (!session) {
    return null
  }

  if (error && passes.length === 0) {
    return (
      <main>
        <Navbar />
        <div className="container mx-auto px-11 py-8 mt-20">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Unable to load analytics
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={fetchPasses}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
        <Footer />
        <BGTexture/>
      </main>
    )
  }

  return (
    <ErrorBoundary>
      <main>
        <Navbar />
        
        {/* Analytics Content */}
        <div className="container mx-auto px-11 py-8 mt-20">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-[36px] lg:text-[50px] font-albert mb-2 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 lg:w-10 lg:h-10 text-black" />
                Analytics
              </h1>
              <p className="text-foreground">Track performance and engagement for your digital passes</p>
            </div>
            <div className="flex items-center gap-3 mt-4 lg:mt-0">
              {/* Time Range Filter */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-10">
                    <div className="py-1">
                      {[
                        { value: '7d', label: 'Last 7 days' },
                        { value: '30d', label: 'Last 30 days' },
                        { value: '90d', label: 'Last 90 days' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTimeRange(option.value)
                            setDropdownOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                            timeRange === option.value ? 'bg-gray-50 font-medium' : ''
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Pass Selection */}
          {passes.length > 0 && (
            <div className="bg-white/40 rounded-[20px] p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium text-black mb-1">
                    {selectedPass ? `${getPassTypeName(selectedPass.pass_type)} Analytics` : 'Select a Pass'}
                  </h2>
                  <p className="text-sm text-foreground">
                    {selectedPass 
                      ? `Showing analytics for "${selectedPass.title}"`
                      : 'Choose a pass to view its analytics'
                    }
                  </p>
                </div>
                
                <div className="relative">
                  <select
                    value={selectedPass?.id || ''}
                    onChange={(e) => {
                      const passId = parseInt(e.target.value)
                      const pass = passes.find(p => p.id === passId)
                      setSelectedPass(pass || null)
                    }}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Select a pass...</option>
                    {passes.map((pass) => (
                      <option key={pass.id} value={pass.id}>
                        {pass.title} ({getPassTypeName(pass.pass_type)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Analytics Dashboard */}
          {selectedPass && analyticsData ? (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/40 rounded-[20px] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600">Total Views</h3>
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-albert text-black mb-1">{analyticsData.totalViews.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +12% from last period
                  </p>
                </div>

                <div className="bg-white/40 rounded-[20px] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600">Downloads</h3>
                    <Download className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-albert text-black mb-1">{analyticsData.totalDownloads.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +8% from last period
                  </p>
                </div>

                <div className="bg-white/40 rounded-[20px] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600">Conversion Rate</h3>
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-albert text-black mb-1">{analyticsData.conversionRate}%</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +2.1% from last period
                  </p>
                </div>

                <div className="bg-white/40 rounded-[20px] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-600">Active Passes</h3>
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-albert text-black mb-1">{analyticsData.activePasses.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +5% from last period
                  </p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Views Over Time */}
                <div className="bg-white/40 rounded-[20px] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-black">Views & Downloads Over Time</h3>
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">Views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Downloads</span>
                      </div>
                    </div>
                    
                    {/* Simple chart visualization */}
                    <div className="h-40 bg-gray-50 rounded-lg flex items-end gap-1 px-4 py-4">
                      {analyticsData.viewsOverTime.slice(-14).map((data, index) => (
                        <div key={data.date} className="flex-1 flex flex-col items-center gap-1">
                          <div className="flex flex-col gap-1 items-center">
                            <div 
                              className="bg-blue-500 rounded-t w-full"
                              style={{ height: `${(data.views / 50) * 100}px` }}
                            ></div>
                            <div 
                              className="bg-green-500 rounded-b w-full"
                              style={{ height: `${(data.downloads / 20) * 40}px` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 rotate-45 origin-bottom-left">
                            {formatDate(data.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Device Breakdown */}
                <div className="bg-white/40 rounded-[20px] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-black">Popular Devices</h3>
                    <Smartphone className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="space-y-4">
                    {analyticsData.popularDevices.map((device, index) => {
                      const total = analyticsData.popularDevices.reduce((sum, d) => sum + d.count, 0)
                      const percentage = Math.round((device.count / total) * 100)
                      
                      return (
                        <div key={device.device} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">{device.device}</span>
                            <span className="text-gray-500">{device.count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                index === 0 ? 'bg-blue-500' :
                                index === 1 ? 'bg-green-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Pass Performance Table */}
              <div className="bg-white/40 rounded-[20px] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-black">Pass Performance Comparison</h3>
                  <Filter className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left text-sm font-medium text-gray-600 pb-3">Pass Title</th>
                        <th className="text-left text-sm font-medium text-gray-600 pb-3">Views</th>
                        <th className="text-left text-sm font-medium text-gray-600 pb-3">Downloads</th>
                        <th className="text-left text-sm font-medium text-gray-600 pb-3">Conversion</th>
                        <th className="text-left text-sm font-medium text-gray-600 pb-3">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analyticsData.passPerformance.map((pass, index) => {
                        const conversionRate = pass.views > 0 ? Math.round((pass.downloads / pass.views) * 100) : 0
                        
                        return (
                          <tr key={pass.passId} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  selectedPass?.id.toString() === pass.passId ? 'bg-blue-500' : 'bg-gray-300'
                                }`}></div>
                                <span className="font-medium text-gray-900">
                                  {pass.title}
                                </span>
                                {selectedPass?.id.toString() === pass.passId && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    Current
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 text-gray-700">{pass.views.toLocaleString()}</td>
                            <td className="py-4 text-gray-700">{pass.downloads.toLocaleString()}</td>
                            <td className="py-4 text-gray-700">{conversionRate}%</td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${Math.min(conversionRate * 2, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {conversionRate > 20 ? 'Excellent' : conversionRate > 10 ? 'Good' : 'Average'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Table */}
              <div className="bg-white/40 rounded-[20px] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-black flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Pass Holders
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {analyticsData ? (
                        getFilteredAndSortedCustomers().length !== analyticsData.customers.length 
                          ? `${getFilteredAndSortedCustomers().length} of ${analyticsData.customers.length} customers shown`
                          : `${analyticsData.customers.length} customers have added this pass`
                      ) : (
                        'Loading customer data...'
                      )}
                    </p>
                  </div>
                </div>

                {/* Search and Filter Controls */}
                <div className="mb-6 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Search Bar */}
                    <div className="lg:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search customers by name or ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Expired">Expired</option>
                        <option value="Revoked">Revoked</option>
                      </select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="recent">Most Recent</option>
                        <option value="oldest">Oldest First</option>
                        <option value="points">Most Points</option>
                      </select>
                    </div>
                  </div>

                  {/* Date Range Filter and Export */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Added:</label>
                      <select
                        value={dateRangeFilter}
                        onChange={(e) => setDateRangeFilter(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="all">All Time</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                      </select>

                      {/* Active Filters Indicator */}
                      {(searchTerm || statusFilter !== 'all' || dateRangeFilter !== 'all' || sortBy !== 'recent') && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">•</span>
                          <button
                            onClick={() => {
                              setSearchTerm('')
                              setStatusFilter('all')
                              setDateRangeFilter('all')
                              setSortBy('recent')
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Clear all filters
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {analyticsData && getFilteredAndSortedCustomers().length !== analyticsData.customers.length && (
                        <span className="text-sm text-gray-600">
                          Showing {getFilteredAndSortedCustomers().length} of {analyticsData.customers.length} customers
                        </span>
                      )}
                      <button className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Table Content */}
                {tableLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading customers...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-sm font-medium text-gray-600 pb-3">Customer</th>
                          <th className="text-left text-sm font-medium text-gray-600 pb-3">Phone</th>
                          <th className="text-left text-sm font-medium text-gray-600 pb-3">Date Added</th>
                          <th className="text-left text-sm font-medium text-gray-600 pb-3">Status</th>
                          <th className="text-left text-sm font-medium text-gray-600 pb-3">Points</th>
                          <th className="text-left text-sm font-medium text-gray-600 pb-3">Tier</th>
                          <th className="text-left text-sm font-medium text-gray-600 pb-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {getFilteredAndSortedCustomers().map((customer) => (
                          <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                  {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">{customer.name}</span>
                                  {customer.customerId && (
                                    <span className="text-xs text-gray-500">ID: {customer.customerId}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-sm text-gray-700">
                              {customer.phone || '—'}
                            </td>
                            <td className="py-4 text-gray-700 text-sm">
                              {new Date(customer.dateAdded).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                                {customer.status}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="text-sm text-gray-700">
                                {customer.points !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{customer.points}</span>
                                    <span className="text-gray-500">pts</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 text-sm text-gray-700">
                              {customer.tier || '—'}
                            </td>
                            <td className="py-4">
                              <button
                                onClick={() => openCustomerModal(customer)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Customer Analytics Charts */}
                {!tableLoading && analyticsData && analyticsData.customers.length > 0 && (
                  <div className="mt-8 space-y-8">
                    <div className="border-t border-gray-200 pt-8">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-lg font-medium text-black">Customer Insights</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Visual analytics for {getFilteredAndSortedCustomers().length} customers
                            {getFilteredAndSortedCustomers().length !== analyticsData.customers.length && 
                              ` (filtered from ${analyticsData.customers.length} total)`
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>Active: {analyticsData.customers.filter(c => c.status === 'Active').length}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span>Expired: {analyticsData.customers.filter(c => c.status === 'Expired').length}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>Revoked: {analyticsData.customers.filter(c => c.status === 'Revoked').length}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* New Users Added per Day */}
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h5 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            New Users Added (Last 14 Days)
                          </h5>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getUsersAddedPerDayData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                  dataKey="displayDate" 
                                  stroke="#6b7280"
                                  fontSize={12}
                                  tick={{ fill: '#6b7280' }}
                                  interval="preserveStartEnd"
                                />
                                <YAxis 
                                  stroke="#6b7280"
                                  fontSize={12}
                                  tick={{ fill: '#6b7280' }}
                                  allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line 
                                  type="monotone" 
                                  dataKey="users" 
                                  stroke="#3b82f6" 
                                  strokeWidth={3}
                                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                  activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Total new users: {getUsersAddedPerDayData().reduce((sum, day) => sum + day.users, 0)}
                          </p>
                        </div>

                        {/* Status Distribution */}
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h5 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Customer Status Distribution
                          </h5>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={getStatusDistributionData()}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={100}
                                  paddingAngle={2}
                                  dataKey="value"
                                >
                                  {getStatusDistributionData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend 
                                  verticalAlign="bottom" 
                                  height={36}
                                  iconType="circle"
                                  wrapperStyle={{ 
                                    paddingTop: '20px',
                                    fontSize: '14px'
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Points Distribution Chart - Only for loyalty passes */}
                      {hasPointsBasedCustomers() && (
                        <div className="mt-8">
                          <div className="bg-gray-50 rounded-xl p-6">
                            <h5 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                              <Gift className="w-4 h-4" />
                              Points Distribution
                            </h5>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={getPointsDistributionData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                  <XAxis 
                                    dataKey="range" 
                                    stroke="#6b7280"
                                    fontSize={12}
                                    tick={{ fill: '#6b7280' }}
                                  />
                                  <YAxis 
                                    stroke="#6b7280"
                                    fontSize={12}
                                    tick={{ fill: '#6b7280' }}
                                    allowDecimals={false}
                                  />
                                  <Tooltip content={<CustomBarTooltip />} />
                                  <Bar 
                                    dataKey="count" 
                                    fill="#8b5cf6"
                                    radius={[4, 4, 0, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <p className="text-sm text-gray-600 mt-4">
                              Distribution of loyalty points among {analyticsData.customers.filter(c => c.points !== undefined).length} customers with points
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Empty States */}
                {!tableLoading && getFilteredAndSortedCustomers().length === 0 && analyticsData.customers.length > 0 && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No customers found</h4>
                    <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('all')
                        setDateRangeFilter('all')
                        setSortBy('recent')
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

                {!tableLoading && analyticsData.customers.length === 0 && (
                  <div className="text-center py-12">
                    <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h4>
                    <p className="text-gray-600 mb-4">When customers add your pass to their wallet, they'll appear here</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-blue-600 mt-0.5">💡</div>
                        <div className="text-left">
                          <h5 className="font-medium text-blue-900 mb-1">Grow your audience</h5>
                          <p className="text-sm text-blue-700">Share your pass URL or QR code to start collecting customers</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : passes.length > 0 && !selectedPass ? (
            <div className="text-center py-16">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a pass to view analytics</h3>
              <p className="text-gray-600">Choose from the dropdown above to see detailed performance metrics</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No passes available</h3>
              <p className="text-gray-600 mb-6">Create your first pass to start tracking analytics</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
        
        <Footer />
        <BGTexture/>
      </main>

      {/* Customer Details Modal */}
      {customerModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-medium text-gray-600">
                    {selectedCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h3>
                  </div>
                </div>
                <button
                  onClick={closeCustomerModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCustomer.status)}`}>
                    {selectedCustomer.status}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Member Since</h4>
                  <p className="text-gray-700">
                    {new Date(selectedCustomer.dateAdded).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Customer Snapshot */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-blue-600">{selectedCustomer.points ?? 0}</div>
                  <div className="text-sm text-gray-600">Points</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-gray-900">{selectedCustomer.tier || 'bronze'}</div>
                  <div className="text-sm text-gray-600">Tier</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {selectedCustomer.phone || 'Phone not provided'}
                  </div>
                  <div className="text-sm text-gray-600">Phone</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {selectedCustomer.lastActivity
                      ? new Date(selectedCustomer.lastActivity).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </div>
                  <div className="text-sm text-gray-600">Last Activity</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {selectedCustomer.dateAdded
                      ? new Date(selectedCustomer.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </div>
                  <div className="text-sm text-gray-600">Joined</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <main>
        <Navbar />
        <DashboardContentSkeleton />
        <Footer />
        <BGTexture/>
      </main>
    }>
      <AnalyticsContent />
    </Suspense>
  )
}
