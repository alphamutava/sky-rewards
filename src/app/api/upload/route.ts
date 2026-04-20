import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { v2 as cloudinary } from 'cloudinary'
import { apiResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/errors'
import { checkRateLimit } from '@/lib/rate-limit'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// POST /api/upload - Upload media to Cloudinary
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return handleApiError(new Error('Unauthorized'))
    }

    // Rate limit: 10 uploads per hour
    const rateLimitResult = await checkRateLimit(`upload:${token.sub}`, 10, 3600)
    if (!rateLimitResult.success) {
      return handleApiError(new Error('Upload limit exceeded. Please try again later.'))
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'image', 'video', 'document'

    if (!file) {
      return handleApiError(new Error('No file provided'))
    }

    // Validate file type
    const allowedTypes: Record<string, string[]> = {
      image: ['image/jpeg', 'image/png', 'image/webp'],
      video: ['video/mp4', 'video/quicktime', 'video/webm'],
      document: ['application/pdf'],
    }

    if (!allowedTypes[type]?.includes(file.type)) {
      return handleApiError(new Error(`Invalid file type. Allowed: ${allowedTypes[type]?.join(', ')}`))
    }

    // Validate file size (10MB images, 50MB videos, 5MB documents)
    const maxSizes: Record<string, number> = {
      image: 10 * 1024 * 1024,
      video: 50 * 1024 * 1024,
      document: 5 * 1024 * 1024,
    }

    if (file.size > maxSizes[type]) {
      return handleApiError(new Error(`File too large. Max size: ${maxSizes[type] / (1024 * 1024)}MB`))
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const folder = `skykenya/${type}/${token.sub}`
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: type === 'video' ? 'video' : 'auto',
          ...(type === 'image' && { transformation: [{ quality: 'auto:good' }] }),
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    const uploadResult = result as {
      secure_url: string
      public_id: string
      resource_type: string
      format: string
      bytes: number
      duration?: number
      width?: number
      height?: number
    }

    return apiResponse({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      type: uploadResult.resource_type,
      format: uploadResult.format,
      size: uploadResult.bytes,
      duration: uploadResult.duration,
      dimensions: uploadResult.width && uploadResult.height
        ? { width: uploadResult.width, height: uploadResult.height }
        : undefined,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
