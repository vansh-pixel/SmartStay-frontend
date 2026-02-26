"use client"
import { useState, useRef, useEffect } from "react"
import { supportAPI } from "@/lib/api"
import "@/styles/chatbot.css"

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm the SmartStay AI Concierge. How can I help you today?", sender: "bot" }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim()) return

    // 1. Add User Message immediately
    const userMessage = { id: Date.now(), text: input, sender: "user" }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true) // Show typing indicator

    try {
      // 2. Call your Backend API (which connects to Groq)
      const response = await supportAPI.chatbot(userMessage.text)

      // 3. Add Bot Response
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: response.reply,
          sender: "bot",
        },
      ])
    } catch (error) {
      console.error("Chat Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "I'm having trouble connecting to the server right now. Please try again later.",
          sender: "bot",
        },
      ])
    } finally {
      setIsTyping(false) // Hide typing indicator
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)} 
        aria-label="Toggle chat"
      >
        {isOpen ? (
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
             <line x1="18" y1="6" x2="6" y2="18"></line>
             <line x1="6" y1="6" x2="18" y2="18"></line>
           </svg>
        ) : (
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
             <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
           </svg>
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="header-info">
              <h3>SmartStay AI</h3>
              <span className="online-status">● Online</span>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-bubble">
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="message bot">
                <div className="message-bubble typing-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            
            {/* Invisible div to scroll to */}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Ask about rooms, prices, etc..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
              autoFocus
            />
            <button 
              onClick={handleSend} 
              aria-label="Send message" 
              disabled={isTyping || !input.trim()}
              className={input.trim() ? 'active' : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}