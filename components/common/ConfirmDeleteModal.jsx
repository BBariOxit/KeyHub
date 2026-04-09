'use client'
import React, { useEffect } from 'react'

const ConfirmDeleteModal = ({
  isOpen,
  objectLabel = 'đối tượng',
  objectName = '',
  loading = false,
  onCancel,
  onConfirm
}) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) {
        onCancel?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onCancel])

  if (!isOpen) {
    return null
  }

  const resolvedName = String(objectName || '').trim()
  const objectText = resolvedName ? `${objectLabel} "${resolvedName}"` : objectLabel

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng hộp thoại xác nhận"
        className="absolute inset-0 bg-black/45"
        onClick={() => {
          if (!loading) {
            onCancel?.()
          }
        }}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
          <p className="mt-2 text-sm text-gray-600">
            Bạn có chắc muốn xóa vĩnh viễn {objectText}? Hành động này không thể hoàn tác.
          </p>
        </div>

        <div className="px-5 py-4 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal
