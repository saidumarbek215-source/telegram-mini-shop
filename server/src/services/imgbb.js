const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload'

// Uploads a base64-encoded image to ImgBB and returns its permanent URL.
export async function uploadImageToImgbb(base64Image) {
  const apiKey = process.env.IMGBB_API_KEY
  if (!apiKey) throw new Error('IMGBB_API_KEY не настроен')

  const form = new FormData()
  form.append('key', apiKey)
  form.append('image', base64Image)

  const res = await fetch(IMGBB_UPLOAD_URL, { method: 'POST', body: form })
  const data = await res.json()

  if (!data.success) {
    throw new Error(data.error?.message || 'Не удалось загрузить изображение на ImgBB')
  }

  return data.data.url
}
