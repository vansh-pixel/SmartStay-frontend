import "@/styles/footer.css"

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>SmartStay</h3>
          <p>Providing exceptional hospitality in Ahmedabad since 2016.</p>
          <p className="contact-info">vanshmamtora17@gmail.com</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <a href="#home">Home</a>
            </li>
            <li>
              <a href="#about">About Us</a>
            </li>
            <li>
              <a href="#rooms">Rooms</a>
            </li>
            <li>
              <a href="#services">Services</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Locations</h4>
          <ul>
            <li>
              <a href="#location">Ahemdabad</a>
            </li>
            <li>
              <a href="#location">Ahemdabad</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Follow Us</h4>
          <ul>
            <li>
              <a href="#social">Facebook</a>
            </li>
            <li>
              <a href="#social">Instagram</a>
            </li>
            <li>
              <a href="#social">Twitter</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Hotel SmartStay. All rights reserved.</p>
      </div>
    </footer>
  )
}