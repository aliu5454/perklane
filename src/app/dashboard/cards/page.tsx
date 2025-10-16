'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BGTexture from "@/components/layout/BGTexture";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/NavBar";
import CreatePassModal from "@/components/CreatePassModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import QRModal from "@/components/QRModal";
import { DashboardContentSkeleton } from "@/components/DashboardSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useToast } from "@/components/Toast";
import { AnalyticsTracker } from "@/lib/analytics-tracker";
import { 
  ArrowLeft, Edit2, Trash2, QrCode, Plus, Calendar, 
  RefreshCw, AlertCircle, Search, Filter, SortAsc, SortDesc,
  Eye, Download, Share2, MoreVertical, Clock, CheckCircle,
  ExternalLink
} from 'lucide-react';

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

export default function RecentPasses() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editPass, setEditPass] = useState<Pass | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; pass: Pass | null; isDeleting: boolean }>({
    isOpen: false,
    pass: null,
    isDeleting: false
  })
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; pass: Pass | null }>({
    isOpen: false,
    pass: null
  })
  const [passes, setPasses] = useState<Pass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    } else {
      fetchPasses()
    }
  }, [session, status, router])

  // Track cards page view when component mounts
  useEffect(() => {
    if (session && passes.length > 0) {
      // Track view for each pass on cards page load
      passes.forEach(pass => {
        if (pass && pass.id) {
          AnalyticsTracker.trackView(pass.id.toString()).catch(console.warn)
        } else {
          console.warn('Cards: Skipping analytics tracking for pass with missing ID', { pass })
        }
      })
    }
  }, [session, passes])

  const fetchPasses = async () => {
    try {
      setError(null)
      if (!loading) setIsRefreshing(true)
      
      const response = await fetch('/api/passes')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch passes')
      }

      setPasses(data.passes)
    } catch (err: any) {
      console.error('Error fetching passes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchPasses()
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditPass(null)
    if (!error) {
      fetchPasses()
    }
  }

  const handleEditPass = (pass: Pass) => {
    setEditPass(pass)
    setIsModalOpen(true)
  }

  const handleDeletePass = (pass: Pass) => {
    setDeleteModal({
      isOpen: true,
      pass,
      isDeleting: false
    })
  }

  const handleShowQR = (pass: Pass) => {
    setQrModal({
      isOpen: true,
      pass
    })
    // Track QR code view
    AnalyticsTracker.trackView(pass.id.toString()).catch(console.warn)
  }

  const confirmDeletePass = async () => {
    if (!deleteModal.pass) return

    setDeleteModal(prev => ({ ...prev, isDeleting: true }))

    const originalPasses = [...passes]
    setPasses(prev => prev.filter(p => p.id !== deleteModal.pass!.id))

    try {
      const response = await fetch(`/api/passes/${deleteModal.pass.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete pass')
      }

      setDeleteModal({ isOpen: false, pass: null, isDeleting: false })
      addToast(`Pass "${deleteModal.pass.title}" deleted successfully`, 'success')
    } catch (error) {
      setPasses(originalPasses)
      console.error('Error deleting pass:', error)
      addToast(`Failed to delete pass: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      setDeleteModal(prev => ({ ...prev, isDeleting: false }))
    }
  }

  // Helper functions
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

  function getPassTypeIcon(type: string) {
    const typeIcons = {
      'loyalty': '⭐',
      'gift-card': '🎁',
      'offer': '🏷️',
      'smart-tap': '📱',
      'generic': '📄'
    }
    return typeIcons[type as keyof typeof typeIcons] || '📄'
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInHours / 24

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} days ago`
    } else {
      return formatDate(dateString)
    }
  }

  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  function getStatusIcon(status: string) {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-3 h-3" />
      case 'expired':
        return <Clock className="w-3 h-3" />
      case 'pending':
        return <Clock className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  // Filter and sort passes
  const filteredAndSortedPasses = passes
    .filter(pass => {
      if (selectedType !== 'all' && pass.pass_type !== selectedType) return false
      if (selectedStatus !== 'all' && pass.status !== selectedStatus) return false
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return pass.title.toLowerCase().includes(searchLower) ||
               pass.pass_type.toLowerCase().includes(searchLower) ||
               getPassTypeName(pass.pass_type).toLowerCase().includes(searchLower)
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name':
          return a.title.localeCompare(b.title)
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

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

  if (error) {
    return (
      <main>
        <Navbar />
        <div className="container mx-auto px-11 py-8 mt-20">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Unable to load passes
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Try Again'}
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
        
        <div className="container mx-auto px-11 py-8 mt-20">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-[36px] lg:text-[50px] font-albert mb-2 flex items-center gap-3">
                <Calendar className="w-8 h-8 lg:w-10 lg:h-10 text-black" />
                Recent Passes
              </h1>
              <p className="text-foreground">View and manage all your created passes</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-4xl bg-black text-white py-3 px-6 font-medium hover:bg-gray-800 transition-colors"
              style={{ boxShadow: "0px 5px 15px 0px rgba(0, 0, 0, 0.2)" }}
            >
              <Plus className="w-5 h-5" />
              Create New Pass
            </button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/40 rounded-[16px] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-albert text-black">{passes.length}</p>
                  <p className="text-sm text-foreground">Total Passes</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/40 rounded-[16px] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-albert text-black">
                    {passes.filter(p => p.status === 'active').length}
                  </p>
                  <p className="text-sm text-foreground">Active</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/40 rounded-[16px] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-albert text-black">
                    {passes.filter(p => new Date(p.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length}
                  </p>
                  <p className="text-sm text-foreground">This Week</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/40 rounded-[16px] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-albert text-black">
                    {passes.filter(p => p.qr_code_url).length}
                  </p>
                  <p className="text-sm text-foreground">With QR Codes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white/40 rounded-[20px] p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search passes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent w-full sm:w-64"
                  />
                </div>
                
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="loyalty">Loyalty Programs</option>
                  <option value="gift-card">Gift Cards</option>
                  <option value="offer">Offers</option>
                  <option value="smart-tap">Smart Tap</option>
                  <option value="generic">Generic</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                </select>
                
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Passes List */}
          {filteredAndSortedPasses.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedPasses.map((pass) => (
                <div 
                  key={pass.id} 
                  className="bg-white/40 rounded-[20px] p-6 group hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        {getPassTypeIcon(pass.pass_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-albert text-black mb-1">{pass.title}</h3>
                            <p className="text-foreground capitalize">
                              {getPassTypeName(pass.pass_type)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(pass.status)}`}>
                              {getStatusIcon(pass.status)}
                              {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
                            </span>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {pass.qr_code_url && (
                                <button
                                  onClick={() => handleShowQR(pass)}
                                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                  title="View QR Code"
                                >
                                  <QrCode className="w-4 h-4 text-gray-600" />
                                </button>
                              )}
                              
                              {pass.pass_url && (
                                <button
                                  onClick={() => {
                                    // Track download event
                                    AnalyticsTracker.trackDownload(pass.id.toString()).catch(console.warn)
                                    window.open(pass.pass_url, '_blank')
                                  }}
                                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                  title="Open Pass"
                                >
                                  <ExternalLink className="w-4 h-4 text-gray-600" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleEditPass(pass)}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Edit Pass"
                              >
                                <Edit2 className="w-4 h-4 text-gray-600" />
                              </button>
                              
                              <button
                                onClick={() => handleDeletePass(pass)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete Pass"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                              
                              <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Created {getRelativeTime(pass.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(pass.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4" />
                            <span>ID: {pass.object_id.split('.').pop()?.substring(0, 8) || pass.id}</span>
                          </div>
                        </div>
                        
                        {/* Pass Data Preview */}
                        {pass.pass_data && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              {pass.pass_data.description && (
                                <div>
                                  <span className="font-medium text-gray-700">Description:</span>
                                  <p className="text-foreground truncate">{pass.pass_data.description}</p>
                                </div>
                              )}
                              
                              {pass.pass_data.balance && (
                                <div>
                                  <span className="font-medium text-gray-700">Balance:</span>
                                  <p className="text-foreground">${pass.pass_data.balance}</p>
                                </div>
                              )}
                              
                              {pass.pass_data.pointsBalance && (
                                <div>
                                  <span className="font-medium text-gray-700">Points:</span>
                                  <p className="text-foreground">{pass.pass_data.pointsBalance} points</p>
                                </div>
                              )}
                              
                              {pass.pass_data.offerCode && (
                                <div>
                                  <span className="font-medium text-gray-700">Code:</span>
                                  <p className="text-foreground font-mono">{pass.pass_data.offerCode}</p>
                                </div>
                              )}
                              
                              {pass.pass_data.expiryDate && (
                                <div>
                                  <span className="font-medium text-gray-700">Expires:</span>
                                  <p className="text-foreground">{new Date(pass.pass_data.expiryDate).toLocaleDateString()}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Pass ID Info */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-xs text-gray-500 text-center">
                            <span>Pass ID: {pass.object_id.split('.').pop()?.substring(0, 12) || pass.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchTerm || selectedType !== 'all' || selectedStatus !== 'all' 
                  ? 'No matching passes' 
                  : 'No passes created yet'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first pass to get started'
                }
              </p>
              {(!searchTerm && selectedType === 'all' && selectedStatus === 'all') && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-4xl bg-black text-white py-3 px-6 font-medium hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Pass
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Modals */}
        <CreatePassModal 
          isOpen={isModalOpen} 
          onClose={handleModalClose}
          onSuccess={fetchPasses} // Refresh passes immediately on success
          editPass={editPass}
        />

        <DeleteConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, pass: null, isDeleting: false })}
          onConfirm={confirmDeletePass}
          passTitle={deleteModal.pass?.title || ''}
          isDeleting={deleteModal.isDeleting}
        />

        {qrModal.isOpen && qrModal.pass && (
          <QRModal
            isOpen={qrModal.isOpen}
            onClose={() => setQrModal({ isOpen: false, pass: null })}
            qrCodeUrl={qrModal.pass.qr_code_url || ''}
            passUrl={qrModal.pass.pass_url || ''}
            passId={qrModal.pass.id || ''}
            passTitle={qrModal.pass.title || ''}
            passType={getPassTypeName(qrModal.pass.pass_type || '')}
          />
        )}
        
        <Footer />
        <BGTexture/>
      </main>
    </ErrorBoundary>
  );
}