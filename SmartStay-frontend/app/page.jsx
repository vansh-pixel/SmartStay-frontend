"use client"

import { useRef } from "react"
import Navbar from "@/components/Navbar"
import Home from "@/components/Home"
import About from "@/components/About"
import Rooms from "@/components/Rooms"
import Services from "@/components/Services"
import Testimonials from "@/components/Testimonials"
import Footer from "@/components/Footer"
import Chatbot from "@/components/Chatbot"
import "@/styles/global.css"

export default function Page() {
  const navbarRef = useRef(null)

  const handleOpenAuth = () => {
    if (navbarRef.current) {
      navbarRef.current.openAuthModal()
    }
  }

  return (
    <div className="app">
      <Navbar ref={navbarRef} />
      <main>
        <section id="home">
          <Home />
        </section>
        <section id="about">
          <About />
        </section>
        <section id="rooms">
          <Rooms onOpenAuth={handleOpenAuth} />
        </section>
        <section id="services">
          <Services />
        </section>
        <section id="testimonials">
          <Testimonials />
        </section>
      </main>
      <Footer />
      <Chatbot />
    </div>
  )
}
