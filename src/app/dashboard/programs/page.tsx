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
import { DashboardContentSkeleton } from "@/components/DashboardSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useToast } from "@/components/Toast";
import { 
  ArrowLeft, Edit2, Trash2, QrCode, Plus, CreditCard, Users, Calendar, 
  MoreVertical, RefreshCw, AlertCircle, Search, Filter, Grid, List,
  Eye, Download, Share2
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

interface GroupedPass {
  type: string;
  name: string;
  passes: Pass[];
  count: number;
  icon: string;
}

export default function PassPrograms() {
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
  const [passes, setPasses] = useState<Pass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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
      day: 'numeric'
    })
  }

  // Filter and group passes
  const passTypes = ['loyalty', 'gift-card', 'offer', 'smart-tap', 'generic']
  const groupedPasses: GroupedPass[] = passTypes.map(type => ({
    type,
    name: getPassTypeName(type),
    passes: passes.filter(pass => pass.pass_type === type),
    count: passes.filter(pass => pass.pass_type === type).length,
    icon: getPassTypeIcon(type)
  })).filter(group => group.count > 0)

  // Apply filters
  const filteredGroups = groupedPasses.filter(group => {
    if (selectedType !== 'all' && group.type !== selectedType) return false
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return group.name.toLowerCase().includes(searchLower) ||
             group.passes.some(pass => 
               pass.title.toLowerCase().includes(searchLower) ||
               pass.pass_type.toLowerCase().includes(searchLower)
             )
    }
    return true
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
                Unable to load pass programs
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
                <CreditCard className="w-8 h-8 lg:w-10 lg:h-10 text-black" />
                Pass Programs
              </h1>
              <p className="text-foreground">Manage all your pass programs and templates</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-4xl bg-black text-white py-3 px-6 font-medium hover:bg-gray-800 transition-colors"
              style={{ boxShadow: "0px 5px 15px 0px rgba(0, 0, 0, 0.2)" }}
            >
              <Plus className="w-5 h-5" />
              Create New Program
            </button>
          </div>

          {/* Filters and Search */}
          <div className="bg-white/40 rounded-[20px] p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search programs..."
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
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-black text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-black text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
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

          {/* Programs Grid/List */}
          {filteredGroups.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {filteredGroups.map((group) => (
                <div 
                  key={group.type} 
                  className={`bg-white/40 rounded-[20px] p-6 group hover:shadow-lg transition-all ${
                    viewMode === 'list' ? 'flex items-center justify-between' : ''
                  }`}
                >
                  <div className={viewMode === 'list' ? 'flex items-center gap-6 flex-1' : ''}>
                    <div className={`flex items-center gap-4 ${viewMode === 'list' ? '' : 'mb-4'}`}>
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
                        {group.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-albert text-black">{group.name}</h3>
                        <p className="text-foreground">
                          {group.count} {group.count === 1 ? 'program' : 'programs'}
                        </p>
                      </div>
                    </div>

                    {viewMode === 'grid' && (
                      <div className="space-y-2 mb-4">
                        {group.passes.slice(0, 3).map((pass) => (
                          <div key={pass.id} className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-black truncate">{pass.title}</p>
                              <p className="text-xs text-foreground">
                                Created {formatDate(pass.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => window.open(pass.qr_code_url, '_blank')}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="View QR Code"
                              >
                                <QrCode className="w-3 h-3 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleEditPass(pass)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3 h-3 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {group.passes.length > 3 && (
                          <p className="text-xs text-foreground text-center py-2">
                            +{group.passes.length - 3} more passes
                          </p>
                        )}
                      </div>
                    )}

                    {viewMode === 'list' && (
                      <div className="text-sm text-foreground">
                        Latest: {group.passes[0] ? formatDate(group.passes[0].created_at) : 'N/A'}
                      </div>
                    )}
                  </div>

                  <div className={`flex items-center gap-2 ${viewMode === 'list' ? '' : 'pt-4 border-t border-gray-200'}`}>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Active
                    </span>
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                          <Share2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchTerm || selectedType !== 'all' ? 'No matching programs' : 'No pass programs yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedType !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first pass program to get started'
                }
              </p>
              {(!searchTerm && selectedType === 'all') && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-4xl bg-black text-white py-3 px-6 font-medium hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Program
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
        
        <Footer />
        <BGTexture/>
      </main>
    </ErrorBoundary>
  );
}