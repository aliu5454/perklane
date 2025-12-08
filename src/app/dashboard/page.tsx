'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
import Link from 'next/link';
import { Edit2, Trash2, QrCode, Plus, Activity, CreditCard, Users, Calendar, ExternalLink, MoreVertical, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';

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

interface DashboardStats {
  totalPasses: number;
  activeCards: number;
  passTypes: Record<string, number>;
}

export default function Dashboard() {
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
  const [stats, setStats] = useState<DashboardStats>({
    totalPasses: 0,
    activeCards: 0,
    passTypes: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    } else {
      fetchPasses()
    }
  }, [session, status, router])

  const fetchPasses = async () => {
    try {
      setError(null)
      if (!loading) setIsRefreshing(true) // Only show refresh indicator if not initial load
      
      const response = await fetch('/api/passes')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch passes')
      }

      setPasses(data.passes)
      setStats(data.stats)
    } catch (err: any) {
      console.error('Error fetching passes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Refresh function for manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchPasses()
  }

  // Refresh passes when modal closes (in case a new pass was created)
  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditPass(null)
    // Only refresh if we're not in an error state
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
  }

  const confirmDeletePass = async () => {
    if (!deleteModal.pass) return

    setDeleteModal(prev => ({ ...prev, isDeleting: true }))

    // Optimistic update - remove from UI immediately
    const originalPasses = [...passes]
    const originalStats = { ...stats }
    
    setPasses(prev => prev.filter(p => p.id !== deleteModal.pass!.id))
    setStats(prev => ({
      ...prev,
      totalPasses: prev.totalPasses - 1,
      activeCards: prev.activeCards - 1,
      passTypes: {
        ...prev.passTypes,
        [deleteModal.pass!.pass_type]: Math.max(0, (prev.passTypes[deleteModal.pass!.pass_type] || 1) - 1)
      }
    }))

    try {
      const response = await fetch(`/api/passes/${deleteModal.pass.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete pass')
      }

      // Close modal and show success message
      setDeleteModal({ isOpen: false, pass: null, isDeleting: false })
      addToast(`Pass "${deleteModal.pass.title}" deleted successfully`, 'success')
    } catch (error) {
      // Rollback optimistic update
      setPasses(originalPasses)
      setStats(originalStats)
      
      console.error('Error deleting pass:', error)
      addToast(`Failed to delete pass: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      setDeleteModal(prev => ({ ...prev, isDeleting: false }))
    }
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
                Unable to load dashboard
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Try Again'}
                </button>
                
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create New Pass
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
        <BGTexture/>
      </main>
    )
  }

  // Group passes by type for display
  const passTypes = ['loyalty', 'gift-card', 'offer', 'smart-tap', 'generic']
  const groupedPasses = passTypes.map(type => ({
    type,
    name: getPassTypeName(type),
    passes: passes.filter(pass => pass.pass_type === type),
    count: stats.passTypes[type] || 0
  })).filter(group => group.count > 0)

  // Recent passes (last 3)
  const recentPasses = passes.slice(0, 3)

  // Helper function to get display name for pass types
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

  // Helper function to get icon for pass types
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

  // Helper function to format date
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <ErrorBoundary>
      <main>
        <Navbar />
        
        {/* Dashboard Content */}
        <div className="container mx-auto px-11 py-8 mt-20">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-[36px] lg:text-[50px] font-albert mb-2 flex items-center gap-3">
                <Activity className="w-8 h-8 lg:w-10 lg:h-10 text-black" />
                Dashboard
              </h1>
              <p className="text-foreground">Welcome back, {session.user?.name || session.user?.email}</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 lg:mt-0 inline-flex items-center gap-2 rounded-4xl bg-black text-white py-3 px-6 font-medium hover:bg-gray-800 transition-colors"
              style={{ boxShadow: "0px 5px 15px 0px rgba(0, 0, 0, 0.2)" }}
            >
              <Plus className="w-5 h-5" />
              Create New Pass
            </button>
            {passes.length > 0 && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="mt-4 lg:mt-0 lg:ml-3 inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/40 rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-black">Total Programs</h3>
                <CreditCard className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-[32px] font-albert text-black">{stats.totalPasses}</p>
              <p className="text-sm text-gray-500 mt-1">Active pass programs</p>
            </div>
            <div className="bg-white/40 rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-black">Total Passes</h3>
                <QrCode className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-[32px] font-albert text-black">{stats.totalPasses}</p>
              <p className="text-sm text-gray-500 mt-1">Generated passes</p>
            </div>
            <div className="bg-white/40 rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-black">Active Cards</h3>
                <Users className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-[32px] font-albert text-black">{stats.activeCards}</p>
              <p className="text-sm text-gray-500 mt-1">In user wallets</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Pass Programs Section */}
            <div className="bg-white/40 rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[24px] font-albert text-black flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  Pass Programs
                </h2>
                <Link
                  href="/dashboard/programs"
                  className="text-sm text-foreground hover:text-black transition-colors flex items-center gap-1"
                >
                  View all
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              
              {groupedPasses.length > 0 ? (
                <div className="space-y-4">
                  {groupedPasses.map((group) => (
                    <div key={group.type} className="bg-white/60 rounded-[16px] p-4 group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                            {getPassTypeIcon(group.type)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-black">{group.name}</h3>
                            <p className="text-sm text-foreground">
                              {group.passes.length} {group.passes.length === 1 ? 'pass' : 'passes'} created
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Active
                          </span>
                          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-200">
                        <span className="text-foreground flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {group.count} total
                        </span>
                        <span className="text-foreground flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Latest: {group.passes[0] ? formatDate(group.passes[0].created_at) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-foreground mb-4">No pass programs yet</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-4xl border border-black py-2 px-4 text-black font-medium hover:bg-black hover:text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Program
                  </button>
                </div>
              )}
            </div>

            {/* Recent Cards Section */}
            <div className="bg-white/40 rounded-[20px] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[24px] font-albert text-black flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Recent Passes
                </h2>
                <Link
                  href="/dashboard/cards"
                  className="text-sm text-foreground hover:text-black transition-colors flex items-center gap-1"
                >
                  View all
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              
              {recentPasses.length > 0 ? (
                <div className="space-y-4">
                  {recentPasses.map((pass) => (
                    <div key={pass.id} className="bg-white/60 rounded-[16px] p-4 group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-black">{pass.title}</p>
                          <p className="text-sm text-foreground capitalize">
                            {getPassTypeName(pass.pass_type)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full capitalize">
                            {pass.status}
                          </span>
                          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/dashboard/analytics?passId=${pass.id}`}
                                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                                title="View analytics"
                              >
                                <BarChart3 className="w-4 h-4 text-blue-600" />
                              </Link>
                              <button
                                onClick={() => handleEditPass(pass)}
                                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Edit pass"
                              >
                                <Edit2 className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleDeletePass(pass)}
                                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete pass"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created on {formatDate(pass.created_at)}
                        </p>
                        {pass.qr_code_url && (
                          <button
                            onClick={() => handleShowQR(pass)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            title="View QR code"
                          >
                            <QrCode className="w-3 h-3" />
                            View QR
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Pass ID: {pass.object_id.split('.').pop()?.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-foreground">No passes created yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Create Pass Modal */}
        <CreatePassModal 
          isOpen={isModalOpen} 
          onClose={handleModalClose}
          onSuccess={fetchPasses} // Refresh passes immediately on success
          editPass={editPass}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, pass: null, isDeleting: false })}
          onConfirm={confirmDeletePass}
          passTitle={deleteModal.pass?.title || ''}
          isDeleting={deleteModal.isDeleting}
        />

        {/* QR Code Modal */}
        <QRModal
          isOpen={qrModal.isOpen}
          onClose={() => setQrModal({ isOpen: false, pass: null })}
          qrCodeUrl={qrModal.pass?.qr_code_url || ''}
          passUrl={qrModal.pass?.pass_url || ''}
          passId={qrModal.pass?.id || ''}
          passTitle={qrModal.pass?.title || ''}
          passType={getPassTypeName(qrModal.pass?.pass_type || '')}
        />
        
        <Footer />

        <BGTexture/>

        <div className="hidden xl:fixed z-10 bottom-0 left-0 right-0 h-[25px]" style={{ backdropFilter: "blur(3px)" }}></div>
      </main>
    </ErrorBoundary>
  );
}
