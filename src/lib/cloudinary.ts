import { v2 as cloudinary } from 'cloudinary'
import { credsReady } from '@/lib/utils/env'

if (credsReady.cloudinary()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export interface UploadResult {
  url: string
  publicId: string
}

export async function uploadLogo(
  dataUri: string,
  userId: string
): Promise<UploadResult> {
  if (!credsReady.cloudinary()) {
    throw new Error('Cloudinary not configured')
  }
  const res = await cloudinary.uploader.upload(dataUri, {
    folder: `menudrop/logos`,
    public_id: userId,
    overwrite: true,
    transformation: [{ width: 400, height: 400, crop: 'limit' }],
  })
  return { url: res.secure_url, publicId: res.public_id }
}

export async function uploadSpecials(dataUri: string, userId: string): Promise<UploadResult> {
  if (!credsReady.cloudinary()) throw new Error('Cloudinary not configured')
  const res = await cloudinary.uploader.upload(dataUri, {
    folder: 'menudrop/posts',
    public_id: `${userId}-${Date.now()}`,
    overwrite: false,
  })
  return { url: res.secure_url, publicId: res.public_id }
}

export { cloudinary }
