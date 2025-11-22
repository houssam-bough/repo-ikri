"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SetAppView } from "@/types"

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
      alert("Please enter a machine name")
      return
    }

    if (formFields.length === 0) {
      alert("Please add at least one field")
      return
    }

    // Validate all fields have name and label
    const invalidFields = formFields.filter(f => !f.name.trim() || !f.label.trim())
    if (invalidFields.length > 0) {
      alert("All fields must have a name and label")
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
        alert(editingTemplate ? 'Template updated successfully' : 'Template created successfully')
        setShowForm(false)
        fetchTemplates()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save template')
      }
    } catch (error) {
      console.error('Save template error:', error)
      alert('Failed to save template')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this machine template?')) return

    try {
      const response = await fetch(`/api/machine-templates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Template deleted successfully')
        fetchTemplates()
      } else {
        alert('Failed to delete template')
      }
    } catch (error) {
      console.error('Delete template error:', error)
      alert('Failed to delete template')
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
        alert('Failed to update template status')
      }
    } catch (error) {
      console.error('Toggle active error:', error)
      alert('Failed to update template status')
    }
  }

  if (showForm) {
    return (
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-3xl font-bold text-slate-800">
            {editingTemplate ? 'Edit Machine Template' : 'Create Machine Template'}
          </h2>
          <Button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
          >
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Machine Name *
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Tractor, Harvester, Seeder"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Optional description of this machine type"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-slate-700">
                Form Fields *
              </label>
              <Button
                type="button"
                onClick={handleAddField}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                + Add Field
              </Button>
            </div>

            <div className="space-y-4">
              {formFields.map((field, index) => (
                <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Field Name (internal) *
                      </label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => handleUpdateField(index, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        placeholder="e.g., horsepower"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Field Label (display) *
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        placeholder="e.g., Horsepower"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Field Type *
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => handleUpdateField(index, { type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="textarea">Text Area</option>
                        <option value="select">Dropdown</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Placeholder
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
                        Required
                      </label>
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Options (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={field.options?.join(', ') || ""}
                        onChange={(e) => handleUpdateField(index, {
                          options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        placeholder="e.g., Small, Medium, Large"
                      />
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => handleRemoveField(index)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Remove Field
                  </Button>
                </div>
              ))}

              {formFields.length === 0 && (
                <p className="text-slate-500 text-center py-4">
                  No fields added yet. Click "Add Field" to create form fields.
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
              Active (visible to providers)
            </label>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium"
            >
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
            <Button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
            >
              Cancel
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
          Machine Templates ({templates.length})
        </h2>
        <div className="flex gap-3">
          <Button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            + Create Template
          </Button>
          <Button
            onClick={() => setView("dashboard")}
            className="px-4 py-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-600">Loading templates...</p>
      ) : templates.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-slate-600 mb-4">No machine templates found.</p>
          <Button
            onClick={handleCreateNew}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Create Your First Template
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
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Fields ({template.fieldDefinitions.length}):
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
                      +{template.fieldDefinitions.length - 3} more...
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(template)}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleToggleActive(template)}
                  className="flex-1 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm"
                >
                  {template.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  onClick={() => handleDelete(template.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                >
                  Delete
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
