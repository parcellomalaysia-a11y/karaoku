export default function PrivacyPage() {
  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>

        {/* Header */}
        <a href="/" style={{ color: '#E60012', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          ← Back to Karaoku
        </a>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginTop: 32, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 48 }}>Last updated: June 2025</p>

        {sections.map((s) => (
          <section key={s.title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E60012', marginBottom: 12 }}>{s.title}</h2>
            <p style={{ color: '#ccc', lineHeight: 1.8, fontSize: 15 }}>{s.content}</p>
          </section>
        ))}

        <p style={{ color: '#555', fontSize: 13, marginTop: 60, borderTop: '1px solid #222', paddingTop: 24 }}>
          © {new Date().getFullYear()} Karaoku. All rights reserved. Contact:{' '}
          <a href="mailto:parcellomalaysia@gmail.com" style={{ color: '#E60012' }}>parcellomalaysia@gmail.com</a>
        </p>
      </div>
    </main>
  )
}

const sections = [
  {
    title: '1. Information We Collect',
    content:
      'We collect information you provide when you create an account, including your name and email address via Google Sign-In. We also collect usage data such as party sessions created, songs queued, and subscription history to provide and improve our service.',
  },
  {
    title: '2. How We Use Your Information',
    content:
      'Your information is used to operate Karaoku, process payments via Stripe, send important account notifications, and improve the platform. We do not sell your personal data to third parties.',
  },
  {
    title: '3. Google Sign-In',
    content:
      'Karaoku uses Google OAuth for authentication. We only request your basic profile information (name, email, profile picture). We do not access your Google Drive, Gmail, or any other Google services.',
  },
  {
    title: '4. Payments',
    content:
      'All payments are processed securely by Stripe. Karaoku does not store your credit card details. For FPX and GrabPay transactions, payment is handled entirely by Stripe\'s certified payment infrastructure.',
  },
  {
    title: '5. Data Storage',
    content:
      'Your data is stored securely on Supabase (PostgreSQL), hosted on servers compliant with industry security standards. We retain your data for as long as your account is active or as required by law.',
  },
  {
    title: '6. Cookies',
    content:
      'Karaoku uses session cookies to keep you logged in. We do not use third-party advertising cookies. You can disable cookies in your browser settings, but this may affect app functionality.',
  },
  {
    title: '7. Your Rights',
    content:
      'You may request to access, correct, or delete your personal data at any time by emailing us at parcellomalaysia@gmail.com. We will respond within 14 business days.',
  },
  {
    title: '8. Changes to This Policy',
    content:
      'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice. Continued use of Karaoku after changes constitutes acceptance of the updated policy.',
  },
  {
    title: '9. Contact Us',
    content:
      'If you have any questions about this Privacy Policy, please contact us at parcellomalaysia@gmail.com.',
  },
]
