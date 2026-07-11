import { useState, type SubmitEvent } from 'react'
import './AppPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface ChatResponse {
  text?: string
  error?: string
}

function AppPage() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!prompt.trim() || loading) return

    setLoading(true)
    setError('')
    setResponse('')

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data: ChatResponse = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Request failed')
      }

      setResponse(data.text ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="chat">
      <h1>Gemini chat</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask Gemini something..."
          rows={4}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {response && <p className="response">{response}</p>}
    </section>
  )
}

export default AppPage
