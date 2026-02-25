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
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-3xl font-bold text-slate-800">
            {editingTemplate ? t('adminDash.editMachineTemplate') : t('adminDash.createMachineTemplate')}
          </h2>
          <Button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
          >
            {t('adminDash.cancel')}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('adminDash.machineName')}
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                {t('adminDash.addField')}
              </Button>
            </div>

            <div className="space-y-4">
              {formFields.map((field, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
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
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
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
              className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium"
            >
              {editingTemplate ? t('adminDash.updateTemplate') : t('adminDash.createTemplate')}
            </Button>
            <Button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
            >
              {t('adminDash.cancel')}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-3xl font-bold text-slate-800">
          {t('adminDash.machineTemplatesTitle')} ({templates.length})
        </h2>
        <div className="flex gap-3">
          <Button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            {t('adminDash.createTemplate')}
          </Button>
          <Button
            onClick={() => setView("dashboard")}
            className="px-4 py-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg"
          >
            {t('adminDash.backToDashboard')}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-600">{t('adminDash.loadingTemplates')}</p>
      ) : templates.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-slate-600 mb-4">{t('adminDash.noTemplatesFound')}</p>
          <Button
            onClick={handleCreateNew}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            {t('adminDash.createFirstTemplate')}
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-slate-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    template.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {template.isActive ? t('adminDash.active') : t('adminDash.inactive')}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  {t('adminDash.fieldsLabel')} ({template.fieldDefinitions.length}):
                </p>
                <div className="space-y-1">
                  {template.fieldDefinitions.slice(0, 3).map((field, idx) => (
                    <div key={idx} className="text-xs text-slate-600 flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      {field.label} ({field.type})
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                  ))}
                  {template.fieldDefinitions.length > 3 && (
                    <p className="text-xs text-slate-500 italic">
                      +{template.fieldDefinitions.length - 3} {t('adminDash.moreFields')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(template)}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  {t('adminDash.edit')}
                </Button>
                <Button
                  onClick={() => handleToggleActive(template)}
                  className="flex-1 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm"
                >
                  {template.isActive ? t('adminDash.deactivate') : t('adminDash.activate')}
                </Button>
                <Button
                  onClick={() => handleDelete(template.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                >
                  {t('adminDash.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminMachineTemplates
