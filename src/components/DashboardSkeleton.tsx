'use client'

export function StatCardSkeleton() {
  return (
    <div className="bg-white/40 rounded-[20px] p-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 rounded-md w-2/3"></div>
        <div className="h-8 bg-gray-200 rounded-md w-1/2"></div>
      </div>
    </div>
  )
}

export function PassProgramSkeleton() {
  return (
    <div className="bg-white/60 rounded-[16px] p-4 animate-pulse">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded-md w-1/2"></div>
          </div>
          <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded-md w-2/3"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded-md w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded-md w-1/3"></div>
        </div>
      </div>
    </div>
  )
}

export function PassCardSkeleton() {
  return (
    <div className="bg-white/60 rounded-[16px] p-4 animate-pulse">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded-md w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
          </div>
          <div className="h-6 w-14 bg-gray-200 rounded-full"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded-md w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded-md w-1/4"></div>
        </div>
      </div>
    </div>
  )
}

export function DashboardContentSkeleton() {
  return (
    <div className="container mx-auto px-11 py-8 mt-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-md w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded-md w-48"></div>
        </div>
        <div className="mt-4 lg:mt-0 animate-pulse">
          <div className="h-12 w-48 bg-gray-200 rounded-4xl"></div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Pass Programs Section */}
        <div className="bg-white/40 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="animate-pulse h-7 bg-gray-200 rounded-md w-40"></div>
            <div className="animate-pulse h-4 bg-gray-200 rounded-md w-16"></div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <PassProgramSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Recent Cards Section */}
        <div className="bg-white/40 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="animate-pulse h-7 bg-gray-200 rounded-md w-36"></div>
            <div className="animate-pulse h-4 bg-gray-200 rounded-md w-16"></div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <PassCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}