"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SetAppView } from "@/types"
import { useLanguage } from "@/hooks/useLanguage"

interface MachineTemplate {
  id: string
  name: string
  description: string | null
  fieldDefinitions: FieldDefinition[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface FieldDefinition {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea'
  required: boolean
  options?: string[]
  placeholder?: string
}

interface AdminMachineTemplatesProps {
  setView: SetAppView
}

const AdminMachineTemplates: React.FC<AdminMachineTemplatesProps> = ({ setView }) => {
  const { t } = useLanguage()
  const [templates, setTemplates] = useState<MachineTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<MachineTemplate | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formFields, setFormFields] = useState<FieldDefinition[]>([])
  const [formIsActive, setFormIsActive] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/machine-templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingTemplate(null)
    setFormName("")
    setFormDescription("")
    setFormFields([])
    setFormIsActive(true)
    setShowForm(true)
  }

  const handleEdit = (template: MachineTemplate) => {
    setEditingTemplate(template)
    setFormName(template.name)
    setFormDescription(template.description || "")
    setFormFields(template.fieldDefinitions)
    setFormIsActive(template.isActive)
    setShowForm(true)
  }

  const handleAddField = () => {
    setFormFields([
      ...formFields,
      {
        name: "",
        label: "",
        type: "text",
        required: false,
        placeholder: ""
      }
    ])
  }

  const handleUpdateField = (index: number, updates: Partial<FieldDefinition>) => {
    const newFields = [...formFields]
    newFields[index] = { ...newFields[index], ...updates }
    setFormFields(newFields)
  }

  const handleRemoveField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formName.trim()) {
      alert(t('adminDash.alertEnterMachineName'))
      return
    }

    if (formFields.length === 0) {
      alert(t('adminDash.alertAddAtLeastOneField'))
      return
    }

    // Validate all fields have name and label
    const invalidFields = formFields.filter(f => !f.name.trim() || !f.label.trim())
    if (invalidFields.length > 0) {
      alert(t('adminDash.alertFieldsNeedNameLabel'))
      return
    }

    try {
      const payload = {
        name: formName,
        description: formDescription,
        fieldDefinitions: formFields,
        isActive: formIsActive
      }

      const response = editingTemplate
        ? await fetch(`/api/machine-templates/${editingTemplate.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        : await fetch('/api/machine-templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

      if (response.ok) {
        alert(editingTemplate ? t('adminDash.templateUpdated') : t('adminDash.templateCreated'))
        setShowForm(false)
        fetchTemplates()
      } else {
        const data = await response.json()
        alert(data.error || t('adminDash.failedToSaveTemplate'))
      }
    } catch (error) {
      console.error('Save template error:', error)
      alert(t('adminDash.failedToSaveTemplate'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('adminDash.confirmDeleteTemplate'))) return

    try {
      const response = await fetch(`/api/machine-templates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert(t('adminDash.templateDeleted'))
        fetchTemplates()
      } else {
        alert(t('adminDash.failedToDeleteTemplate'))
      }
    } catch (error) {
      console.error('Delete template error:', error)
      alert(t('adminDash.failedToDeleteTemplate'))
    }
  }

  const handleToggleActive = async (template: MachineTemplate) => {
    try {
      const response = await fetch(`/api/machine-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive })
      })

      if (response.ok) {
        fetchTemplates()
      } else {
        alert(t('adminDash.failedToUpdateStatus'))
      }
    } catch (error) {
      console.error('Toggle active error:', error)
      alert(t('adminDash.failedToUpdateStatus'))
    }
  }

  if (showForm) {
    return (
      <div className="bg-linear-to-br from-purple-50 via-white to-violet-50 p-3 md:p-8 overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-1 sm:px-6 lg:px-8 py-4 md:py-8">

        {/* Hero Header */}
        <div className="mb-4 md:mb-8">
          <div className="bg-linear-to-r from-purple-500 to-violet-600 rounded-2xl shadow-2xl p-5 md:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <span className="text-[100px] md:text-[200px]">⚙️</span>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl md:text-4xl font-bold mb-1 md:mb-2">
                  {editingTemplate ? t('adminDash.editMachineTemplate') : t('adminDash.createMachineTemplate')}
                </h1>
              </div>
              <Button
                onClick={() => setShowForm(false)}
                className="px-4 md:px-5 py-2 md:py-2.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all shrink-0 text-sm md:text-base"
              >
                {t('adminDash.cancel')}
              </Button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-xl border">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('adminDash.machineName')}
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-slate-50"
              placeholder={t('adminDash.machineNamePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('adminDash.descriptionLabel')}
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-slate-50"
              rows={3}
              placeholder={t('adminDash.descriptionPlaceholder')}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-slate-700">
                {t('adminDash.formFields')}
              </label>
              <Button
                type="button"
                onClick={handleAddField}
                className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600"
              >
                {t('adminDash.addField')}
              </Button>
            </div>

            <div className="space-y-4">
              {formFields.map((field, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {t('adminDash.fieldNameInternal')}
                      </label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => handleUpdateField(index, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        placeholder={t('adminDash.fieldNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {t('adminDash.fieldLabelDisplay')}
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        placeholder={t('adminDash.fieldLabelPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {t('adminDash.fieldType')}
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => handleUpdateField(index, { type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      >
                        <option value="text">{t('adminDash.fieldTypeText')}</option>
                        <option value="number">{t('adminDash.fieldTypeNumber')}</option>
                        <option value="textarea">{t('adminDash.fieldTypeTextArea')}</option>
                        <option value="select">{t('adminDash.fieldTypeDropdown')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {t('adminDash.placeholderLabel')}
                      </label>
                      <input
                        type="text"
                        value={field.placeholder || ""}
                        onChange={(e) => handleUpdateField(index, { placeholder: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                          className="mr-2"
                        />
                        {t('adminDash.required')}
                      </label>
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {t('adminDash.optionsCommaSeparated')}
                      </label>
                      <input
                        type="text"
                        value={field.options?.join(', ') || ""}
                        onChange={(e) => handleUpdateField(index, {
                          options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        placeholder={t('adminDash.optionsPlaceholder')}
                      />
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => handleRemoveField(index)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600"
                  >
                    {t('adminDash.removeField')}
                  </Button>
                </div>
              ))}

              {formFields.length === 0 && (
                <p className="text-slate-500 text-center py-4">
                  {t('adminDash.noFieldsAdded')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="mr-2"
              />
              {t('adminDash.activeVisibleToProviders')}
            </label>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 font-medium shadow-lg"
            >
              {editingTemplate ? t('adminDash.updateTemplate') : t('adminDash.createTemplate')}
            </Button>
            <Button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 border"
            >
              {t('adminDash.cancel')}
            </Button>
          </div>
        </form>
      </div>
      </div>
    )
  }

  return (
    <div className="bg-linear-to-br from-purple-50 via-white to-violet-50 p-3 md:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 py-4 md:py-8">

        {/* Hero Header */}
        <div className="mb-4 md:mb-8">
          <div className="bg-linear-to-r from-purple-500 to-violet-600 rounded-2xl shadow-2xl p-5 md:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <span className="text-[100px] md:text-[200px]">⚙️</span>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl md:text-4xl font-bold mb-1 md:mb-2">
                  {t('adminDash.machineTemplatesTitle')}
                </h1>
                <p className="text-purple-100 text-sm md:text-lg">
                  {templates.length} {t('adminDash.machineTemplatesTitle').toLowerCase()}
                </p>
              </div>
              <div className="flex gap-2 md:gap-3 shrink-0">
                <Button
                  onClick={handleCreateNew}
                  className="px-4 md:px-5 py-2 md:py-2.5 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all shadow-lg text-sm md:text-base"
                >
                  {t('adminDash.createTemplate')}
                </Button>
                <Button
                  onClick={() => setView("dashboard")}
                  className="px-4 md:px-5 py-2 md:py-2.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all text-sm md:text-base"
                >
                  {t('adminDash.backToDashboard')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-500">{t('adminDash.loadingTemplates')}</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-xl border text-center">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-slate-600 mb-6 text-lg">{t('adminDash.noTemplatesFound')}</p>
            <Button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 shadow-lg"
            >
              {t('adminDash.createFirstTemplate')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-800 truncate">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-slate-400 truncate mt-0.5">{template.description}</p>
                    )}
                  </div>
                  <span
                    className={`ml-3 shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ${
                      template.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {template.isActive ? t('adminDash.active') : t('adminDash.inactive')}
                  </span>
                </div>

                {/* Fields summary */}
                <div className="px-4 py-3 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    {t('adminDash.fieldsLabel')} ({template.fieldDefinitions.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.fieldDefinitions.slice(0, 3).map((field, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600">
                        <span className="w-2 h-2 bg-purple-400 rounded-full shrink-0"></span>
                        {field.label}
                      </span>
                    ))}
                    {template.fieldDefinitions.length > 3 && (
                      <span className="text-xs text-slate-400 italic self-center">
                        +{template.fieldDefinitions.length - 3} {t('adminDash.moreFields')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
                  <button
                    onClick={() => handleEdit(template)}
                    className="py-3 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    {t('adminDash.edit')}
                  </button>
                  <button
                    onClick={() => handleToggleActive(template)}
                    className="py-3 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    {template.isActive ? t('adminDash.deactivate') : t('adminDash.activate')}
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    {t('adminDash.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminMachineTemplates
