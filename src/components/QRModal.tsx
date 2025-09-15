'use client'

import { useState, useRef } from 'react'
import { X, Download, Share2, Copy, Check } from 'lucide-react'
import { AnalyticsTracker } from '@/lib/analytics-tracker'

interface QRModalProps {
  isOpen: boolean
  onClose: () => void
  qrCodeUrl: string
  passUrl: string
  passId: string | number
  passTitle: string
  passType?: string
}

export default function QRModal({
  isOpen,
  onClose,
  qrCodeUrl,
  passUrl,
  passId,
  passTitle,
  passType = 'pass'
}: QRModalProps) {
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  if (!isOpen) return null

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(passUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.warn('Failed to copy URL:', error)
    }
  }

  const handleDownloadQR = async () => {
    try {
      // Track QR download - validate passId first
      if (passId != null) {
        await AnalyticsTracker.trackDownload(passId.toString())
      }
      
      // Download the QR code image
      const link = document.createElement('a')
      link.href = qrCodeUrl
      link.download = `${passTitle.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.warn('Failed to download QR:', error)
    }
  }

  const handleDownloadCard = async () => {
    setIsDownloading(true)
    try {
      // Track card download - validate passId first
      if (passId != null) {
        await AnalyticsTracker.trackDownload(passId.toString())
      }
      
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size (similar to Google Wallet pass dimensions)
      canvas.width = 400
      canvas.height = 250

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 400, 250)
      gradient.addColorStop(0, '#1f2937')
      gradient.addColorStop(1, '#374151')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 400, 250)

      // Add subtle pattern
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      for (let i = 0; i < 400; i += 20) {
        for (let j = 0; j < 250; j += 20) {
          if ((i + j) % 40 === 0) {
            ctx.fillRect(i, j, 10, 10)
          }
        }
      }

      // Load and draw QR code
      const qrImage = new Image()
      qrImage.crossOrigin = 'anonymous'
      
      qrImage.onload = () => {
        // Draw QR code on the right side
        const qrSize = 120
        const qrX = 400 - qrSize - 20
        const qrY = (250 - qrSize) / 2
        
        // White background for QR
        ctx.fillStyle = 'white'
        ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20)
        
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

        // Add pass title
        ctx.fillStyle = 'white'
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'left'
        const titleLines = wrapText(ctx, passTitle, 180)
        titleLines.forEach((line, index) => {
          ctx.fillText(line, 20, 50 + (index * 28))
        })

        // Add pass type
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.font = '16px system-ui, -apple-system, sans-serif'
        ctx.fillText(passType.charAt(0).toUpperCase() + passType.slice(1) + ' Pass', 20, 110)

        // Add "Scan to add to wallet" text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '14px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Scan to add to wallet', qrX + qrSize/2, qrY + qrSize + 25)

        // Add branding
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.font = '12px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText('Powered by PerkLane', 20, 230)

        // Download the canvas as image
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${passTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Card.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }
          setIsDownloading(false)
        }, 'image/png')
      }

      qrImage.onerror = () => {
        console.warn('Failed to load QR image')
        setIsDownloading(false)
      }

      qrImage.src = qrCodeUrl
    } catch (error) {
      console.warn('Failed to generate card:', error)
      setIsDownloading(false)
    }
  }

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
      const word = words[i]
      const width = ctx.measureText(currentLine + ' ' + word).width
      if (width < maxWidth) {
        currentLine += ' ' + word
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    }
    lines.push(currentLine)
    return lines.slice(0, 2) // Limit to 2 lines
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">QR Code</h2>
            <p className="text-sm text-gray-600 mt-1">{passTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* QR Code Display */}
        <div className="p-6 text-center">
          <div className="inline-block p-6 bg-gray-50 rounded-2xl">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Scan this QR code to add the pass to your wallet
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          {/* Download QR Button */}
          <button
            onClick={handleDownloadQR}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download QR Code
          </button>

          {/* Download Card Button */}
          <button
            onClick={handleDownloadCard}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Generating Card...' : 'Download QR Card'}
          </button>

          {/* Copy URL Button */}
          <button
            onClick={handleCopyUrl}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Pass URL'}
          </button>

          {/* Share Button */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: passTitle,
                  text: `Add this ${passType} pass to your wallet`,
                  url: passUrl
                }).catch(console.warn)
              } else {
                handleCopyUrl()
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Pass
          </button>
        </div>

        {/* Hidden canvas for card generation */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}