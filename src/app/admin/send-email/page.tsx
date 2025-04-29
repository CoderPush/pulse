'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Send, X, Plus } from 'lucide-react'
import { getEmailSubject, getEmailTemplate } from '@/lib/email-templates'

export default function SendEmailPage() {
  const router = useRouter()
  const [emailInput, setEmailInput] = useState('')
  const [emailList, setEmailList] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState('initial')
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleAddEmails = () => {
    const emails = emailInput
      .split(/[\n,]+/) // Split by newlines and commas
      .map(email => email.trim())
      .filter(email => email && !emailList.includes(email))
    
    if (emails.length > 0) {
      setEmailList([...emailList, ...emails])
      setEmailInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.metaKey) { // Cmd/Ctrl + Enter to submit
      e.preventDefault()
      handleAddEmails()
    }
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmailList(emailList.filter(email => email !== emailToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (emailList.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one email address' })
      return
    }

    setIsSending(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          emails: emailList,
          type: selectedType
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails')
      }

      setMessage({ 
        type: 'success', 
        text: `Successfully sent ${data.results.length} emails!` 
      })
      setEmailList([])
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to send emails' 
      })
    } finally {
      setIsSending(false)
    }
  }

  // Get preview content for the selected type
  const getPreviewContent = () => {
    const previewEmail = 'user@example.com'
    const previewName = previewEmail.split('@')[0]
    const previewLink = 'https://example.com/auth/login'
    return getEmailTemplate(selectedType, previewName, previewLink)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-semibold">Send Emails</h1>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Addresses
              </label>
              <div className="space-y-2">
                <textarea
                  id="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                  placeholder="Enter email addresses (one per line or separated by commas)"
                  rows={5}
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Press Cmd/Ctrl + Enter to add emails
                  </p>
                  <button
                    type="button"
                    onClick={handleAddEmails}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Emails
                  </button>
                </div>
              </div>
              
              {/* Email List */}
              {emailList.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {emailList.length} email{emailList.length !== 1 ? 's' : ''} added
                    </span>
                    <button
                      type="button"
                      onClick={() => setEmailList([])}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {emailList.map((email) => (
                        <div 
                          key={email} 
                          className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full group"
                        >
                          <span className="text-sm font-medium">{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            className="text-blue-400 hover:text-blue-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Email Type
              </label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="initial">Initial Form Access</option>
                <option value="on-time">On-Time Reminder</option>
                <option value="late-1">Late Submission</option>
              </select>
            </div>

            {/* Email Preview */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b">
                <h3 className="font-medium text-gray-700">Email Preview</h3>
                <p className="text-sm text-gray-500">Subject: {getEmailSubject(selectedType)}</p>
              </div>
              <div className="p-4 prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: getPreviewContent() }} />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSending || emailList.length === 0}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 ${
                isSending || emailList.length === 0 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSending ? 'Sending...' : (
                <>
                  <Send className="w-5 h-5" />
                  Send Emails
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
