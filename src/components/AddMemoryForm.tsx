'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, X, Plus, Heart, Calendar, MapPin } from 'lucide-react'

interface AddMemoryFormProps {
  selectedLocation: { lat: number; lng: number } | null
  onClose: () => void
  onMemoryAdded: () => void
}

export default function AddMemoryForm({ selectedLocation, onClose, onMemoryAdded }: AddMemoryFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!selectedLocation) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-md w-full mx-4 p-8 shadow-2xl border border-pink-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Bir Yer Seç</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Anını eklemek için önce harita üzerinde özel bir yer seç. 
              Her yerin bir hikayesi var! ✨
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-full hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `memories/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Image upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Image upload error:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Anı eklemek için giriş yapmalısın 💝')
        return
      }

      console.log('Current user:', user.id)

      // Upload image if selected (with timeout)
      let imageUrl: string | null = null
      if (image) {
        console.log('Uploading image...')
        const uploadPromise = uploadImage(image)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout')), 30000)
        )
        
        try {
          imageUrl = await Promise.race([uploadPromise, timeoutPromise]) as string | null
          console.log('Image uploaded:', imageUrl)
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          imageUrl = null
        }
      }

      console.log('Inserting memory...')
      // Insert memory (points olmadan)
      const { error } = await supabase
        .from('memories')
        .insert({
          title,
          description,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          image_url: imageUrl,
          tags,
          date,
          user_id: user.id
        })

      if (error) {
        console.error('Error adding memory:', error)
        alert('Anı eklenirken bir sorun oluştu 😔')
        return
      }

      console.log('Memory added successfully!')
      alert('Anın başarıyla eklendi! 🎉✨')
      onMemoryAdded()
      onClose()
    } catch (error) {
      console.error('Error:', error)
      alert('Beklenmeyen bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-pink-100">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Heart className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Yeni Anını Ekle</h2>
                <p className="text-sm text-gray-600">Bu özel anı sonsuza kadar sakla</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Heart size={16} className="text-pink-500" />
                Anının Başlığı *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="Bu anıya nasıl bir isim verirdin?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anının Hikayesi *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                placeholder="O an ne hissettin? Ne oldu? Bu yerin senin için önemi nedir?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-blue-500" />
                Bu Anı Ne Zaman Yaşandı? *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotoğraf
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 transition-colors hover:border-pink-300">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null)
                        setImagePreview(null)
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Upload size={32} className="text-gray-400 mb-3" />
                    <span className="text-sm text-gray-600 font-medium">Fotoğraf Yükle</span>
                    <span className="text-xs text-gray-400 mt-1">Bu anıyı görsel olarak sakla</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiketler
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="aile, tatil, sevgili..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-2 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-md"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-pink-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-pink-600 hover:text-pink-800 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Seçilen Konum</span>
              </div>
              <p className="text-sm text-gray-600">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Bu koordinatlarda anın sonsuza kadar saklanacak ✨
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 font-medium shadow-md"
              >
                {loading ? 'Anı Kaydediliyor...' : 'Anıyı Kaydet ✨'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 