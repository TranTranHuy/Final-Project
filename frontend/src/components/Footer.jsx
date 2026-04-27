// src/components/Footer.jsx
import React from 'react';

const Footer = () => {
    return (
        <footer style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #e9ecef', padding: '60px 0 30px', marginTop: '100px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
                <div>
                    <h2 style={{ color: '#ff6b00', margin: '0 0 20px' }}>CookWeb 👩🏻‍🍳</h2>
                    <p style={{ color: '#6c757d', lineHeight: '1.6' }}>The ultimate platform for cooking enthusiasts to share recipes and find quality ingredients.</p>
                </div>
                <div>
                    <h4 style={{ marginBottom: '20px' }}>Quick Links</h4>
                    <ul style={{ listStyle: 'none', padding: 0, color: '#6c757d', lineHeight: '2' }}>
                        <li>Browse Recipes</li>
                        <li>Marketplace</li>
                        <li>Premium Membership</li>
                        <li>Cooking Challenges</li>
                    </ul>
                </div>
                <div>
                    <h4 style={{ marginBottom: '20px' }}>Support</h4>
                    <ul style={{ listStyle: 'none', padding: 0, color: '#6c757d', lineHeight: '2' }}>
                        <li>Help Center</li>
                        <li>Terms of Service</li>
                        <li>Privacy Policy</li>
                        <li>Contact Us</li>
                    </ul>
                </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #dee2e6', color: '#adb5bd', fontSize: '14px' }}>
                © 2026 CookWeb Project. All rights reserved. Built with ❤️ for Foodies.
            </div>
        </footer>
    );
};

export default Footer;