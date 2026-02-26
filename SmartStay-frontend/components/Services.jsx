"use client"

import { useState, useEffect } from "react"
import "@/styles/services.css"

export default function Services() {
  const [selectedService, setSelectedService] = useState(null)

  // Cleanup body overflow when component unmounts or modal closes
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  // Reset body overflow when modal closes
  useEffect(() => {
    if (!selectedService) {
      document.body.style.overflow = "auto"
    }
  }, [selectedService])

  const services = [
    {
      id: 1,
      name: "Rooms & Apartment",
      description: "Spacious and comfortable rooms",
      featured: false,
      images: [
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
      ],
    },
    {
      id: 2,
      name: "Sports & Gaming",
      description: "State-of-the-art sports facilities",
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1517649763962-0c623066013b",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
        "https://images.unsplash.com/photo-1521412644187-c49fa049e84d",
        "https://images.unsplash.com/photo-1605296867304-46d5465a13f1",
      ],
    },
    {
      id: 3,
      name: "Food & Restaurant",
      description: "World-class dining experience",
      featured: false,
      images: [
        "https://images.unsplash.com/photo-1739792598744-3512897156e3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9vZCUyMGFuZCUyMHJlc3RhdXJhbnR8ZW58MHx8MHx8fDA%3D",
        "https://images.unsplash.com/photo-1528605248644-14dd04022da1",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
        "https://images.unsplash.com/photo-1559339352-11d035aa65de",
      ],
    },
    {
      id: 4,
      name: "Spa & Fitness",
      description: "Complete wellness center",
      featured: false,
      images: [
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874",
        "https://plus.unsplash.com/premium_photo-1661505119522-22651550cd42?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fHNwYSUyMGFuZCUyMGZpdG5lc3N8ZW58MHx8MHx8fDA%3D",
        "https://images.unsplash.com/photo-1583417267826-aebc4d1542e1",
        "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b",
      ],
    },
    {
      id: 5,
      name: "Event & Party",
      description: "Perfect venues for celebrations",
      featured: false,
      images: [
        "https://images.unsplash.com/photo-1768851142332-75f3d1b47452?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZXZlbnQlMjBhbmQlMjBwYXJ0eXxlbnwwfHwwfHx8MA%3D%3D",
        "https://images.unsplash.com/photo-1768776183877-e8f3dfc91f40?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGV2ZW50JTIwYW5kJTIwcGFydHl8ZW58MHx8MHx8fDA%3D",
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
      ],
    },
    {
      id: 6,
      name: "Gym & Yoga",
      description: "Modern gym and yoga classes",
      featured: false,
      images: [
        "https://images.unsplash.com/photo-1571902943202-507ec2618e8f",
        "https://images.unsplash.com/photo-1558611848-73f7eb4001a1",
        "https://images.unsplash.com/photo-1518611012118-696072aa579a",
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
      ],
    },
  ]

  const getServiceIcon = (serviceName) => {
    const icons = {
      "Rooms & Apartment": (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
      "Sports & Gaming": (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M2 12h20"></path>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      ),
      "Food & Restaurant": (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
          <path d="M7 2v20"></path>
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
        </svg>
      ),
      "Spa & Fitness": (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
      ),
      "Event & Party": (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      "Gym & Yoga": (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6.5 6.5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
          <path d="M17.5 6.5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
          <path d="M6.5 17.5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
          <path d="M17.5 17.5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
          <line x1="6.5" y1="8.5" x2="6.5" y2="15.5"></line>
          <line x1="17.5" y1="8.5" x2="17.5" y2="15.5"></line>
          <line x1="8.5" y1="6.5" x2="15.5" y2="6.5"></line>
          <line x1="8.5" y1="17.5" x2="15.5" y2="17.5"></line>
        </svg>
      ),
    }
    return icons[serviceName] || null
  }

  const openModal = (service) => {
    setSelectedService(service)
    document.body.style.overflow = "hidden"
  }

  const closeModal = () => {
    // Ensure body overflow is reset
    document.body.style.overflow = "auto"
    // Clear selected service
    setSelectedService(null)
  }

  return (
    <section className="services-section">
      <div className="services-header">
        <div className="header-divider">
          <span className="line"></span>
          <span className="label">Our Services</span>
          <span className="line"></span>
        </div>
        <h2>
          Explore Our <span className="highlight">Services</span>
        </h2>
      </div>

      <div className="services-container">
        <div className="services-grid">
          {services.map((service) => (
            <div
              key={service.id}
              className="service-card"
              onClick={() => openModal(service)}
            >
              <div className="service-icon">{getServiceIcon(service.name)}</div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedService && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close modal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h2 className="modal-title">{selectedService.name}</h2>
            <div className="modal-images">
              {selectedService.images.map((image, idx) => (
                <div key={idx} className="modal-image">
                  <img src={image} alt={`${selectedService.name} ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
