"use client"

import "@/styles/home.css"

export default function Home() {
  const handleBookNow = () => {
    const roomsSection = document.getElementById("rooms")
    if (roomsSection) {
      roomsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleExploreMore = () => {
    const aboutSection = document.getElementById("about")
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="home-section">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h2>Welcome To</h2>
        <h1>
          Hotel <span className="brand-smart brand-smart-animated">Smart</span><span className="brand-stay">Stay</span>
        </h1>
        <h1 className="location-heading">Ahmedabad India</h1>
        <p className="hero-description">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam maxime praesentium. Why did the scarecrow win an award? Because he was outstanding in his field. Lorem ipsum
        </p>
        <div className="hero-buttons">
          <button className="btn btn-primary" onClick={handleBookNow}>Book Now</button>
          <button className="btn btn-secondary" onClick={handleExploreMore}>Explore More</button>
        </div>
      </div>
    </section>
  )
}
