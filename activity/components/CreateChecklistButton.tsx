// components/CreateChecklistButton.tsx
import React, { useState } from 'react'
import { Plus, Loader2, AlertCircle, Calendar, User, Building } from 'lucide-react'
import { useCreateChecklistRecord } from '../hooks/useCreateChecklistRecord'

interface CreateChecklistButtonProps {
  currentUser: {
    udid: string
    name: string
    position: string
    branchCode: string
    branchName: string
  }
  onSuccess?: (record: any) => void
}

export const CreateChecklistButton: React.FC<CreateChecklistButtonProps> = ({
  currentUser,
  onSuccess,
}) => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const { createNewRecord, isCreating, error, clearError } = useCreateChecklistRecord()

  const handleCreate = async () => {
    const record = await createNewRecord({
      date: formData.date,
      udid: currentUser.udid,
      employeeName: currentUser.name,
      position: currentUser.position,
      branchCode: currentUser.branchCode,
      branchName: currentUser.branchName,
      notes: formData.notes,
    })

    if (record) {
      setShowForm(false)
      setFormData({ date: new Date().toISOString().split('T')[0], notes: '' })
      onSuccess?.(record)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl"
      >
        <Plus className="h-5 w-5" />
        ສ້າງ Checklist ໃໝ່
      </button>
    )
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">ສ້າງ Checklist ໃໝ່</h2>

        {/* Error Display */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-red-700">{error}</p>
              <button onClick={clearError} className="mt-1 text-sm text-red-600 hover:text-red-800">
                ປິດຂໍ້ຄວາມ
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              <Calendar className="mr-1 inline h-4 w-4" />
              ວັນທີ່
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              disabled={isCreating}
            />
          </div>

          {/* User Info (Read-only) */}
          <div className="space-y-3 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">ພະນັກງານ:</span>
              <span className="text-sm font-medium text-gray-900">{currentUser.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">ສາຂາ:</span>
              <span className="text-sm font-medium text-gray-900">{currentUser.branchName}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              ໝາຍເຫດ (ທາງເລືອກ)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="ເພີ່ມໝາຍເຫດ..."
              disabled={isCreating}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setShowForm(false)}
            className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-all duration-200 hover:bg-gray-300"
            disabled={isCreating}
          >
            ຍົກເລີກ
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                ກຳລັງສ້າງ...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                ສ້າງ Checklist
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
