import { useState, FormEvent } from 'react'

interface EventFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  topic: string
  preferredSlot: string
}

const TOPICS = [
  'Workshop',
  'Seminar',
  'Conference',
  'Networking Event',
  'Other'
]

const TIME_SLOTS = [
  'Morning (9AM - 12PM)',
  'Afternoon (1PM - 4PM)',
  'Evening (5PM - 8PM)'
]

export function EventRegistrationForm() {
  const [formData, setFormData] = useState<EventFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    topic: '',
    preferredSlot: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Here you would typically make an API call to register the user
      // For now let's just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Clear form after successful submission
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        topic: '',
        preferredSlot: ''
      })
      
      alert('Registration successful!')
    } catch (error) {
      alert('Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="event-registration-page">
      <div className="glass-form">
        <h2>Event Registration</h2>
        <p>Register with us to get more details.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label>Name</label>
            <div className="form-row two-columns">
              <div className="form-group">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First"
                  required
                />
              </div>
              
              <div className="form-group">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            
            <div className="form-group">
              <label>Topic</label>
              <select
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                required
              >
                <option value="">Select a topic</option>
                {TOPICS.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Preferred Slot</label>
              <select
                name="preferredSlot"
                value={formData.preferredSlot}
                onChange={handleChange}
                required
              >
                <option value="">Select a time</option>
                {TIME_SLOTS.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Sign me up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 