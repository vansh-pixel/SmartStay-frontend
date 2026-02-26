"use client"
import "@/styles/testimonials.css"

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Rita O'Connor",
      email: "Sandrine.Luettgen@gmail.com",
      quote: "Nobis voluptatem magni doloribus voluptate culpa dolor est neque",
    },
    {
      id: 2,
      name: "Woodrow McCullough",
      email: "Idell.Hoppe86@yahoo.com",
      quote: "Nobis voluptatem magni doloribus voluptate culpa dolor est neque",
    },
    {
      id: 3,
      name: "Veronica Hessel",
      email: "Valentin.Homenick@gmail.com",
      quote: "Nobis voluptatem magni doloribus voluptate culpa dolor est neque",
    },
    {
      id: 4,
      name: "George Heaney",
      email: "Liliana.Howell85@hotmail.com",
      quote: "Nobis voluptatem magni doloribus voluptate culpa dolor est neque",
    },
  ]

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <div className="section-header">
          <h2>Testimonials</h2>
          <p>What People Say?</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="quote-mark">"</div>
              <p className="testimonial-text">{testimonial.quote}</p>
              <div className="testimonial-author">
                <h4>{testimonial.name}</h4>
                <p className="author-email">{testimonial.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
