export default function TermsPage() {
  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>

        {/* Header */}
        <a href="/" style={{ color: '#E60012', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          ← Back to Karaoku
        </a>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginTop: 32, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 48 }}>Last updated: June 2025</p>

        {sections.map((s) => (
          <section key={s.title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E60012', marginBottom: 12 }}>{s.title}</h2>
            <p style={{ color: '#ccc', lineHeight: 1.8, fontSize: 15 }}>{s.content}</p>
          </section>
        ))}

        <p style={{ color: '#555', fontSize: 13, marginTop: 60, borderTop: '1px solid #222', paddingTop: 24 }}>
          © {new Date().getFullYear()} Karaoku. All rights reserved. Contact:{' '}
          <a href="mailto:danielnordin53@gmail.com" style={{ color: '#E60012' }}>danielnordin53@gmail.com</a>
        </p>
      </div>
    </main>
  )
}

const sections = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By accessing or using Karaoku ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service. These terms apply to all users including free and paid subscribers.',
  },
  {
    title: '2. Description of Service',
    content:
      'Karaoku is a web-based karaoke party platform that allows users to create party sessions, queue songs, and manage karaoke events. The Service is provided on a freemium basis with optional paid plans.',
  },
  {
    title: '3. User Accounts',
    content:
      'You must sign in with a valid Google account to use Karaoku. You are responsible for maintaining the security of your account and all activities that occur under it. You must not share your account credentials with others.',
  },
  {
    title: '4. Acceptable Use',
    content:
      'You agree not to use Karaoku for any unlawful purpose, to harass other users, to upload harmful content, or to attempt to reverse-engineer or disrupt the platform. We reserve the right to suspend or terminate accounts that violate these terms.',
  },
  {
    title: '5. Payments and Refunds',
    content:
      'Paid plans (Day Pass, Monthly, Yearly) are processed via Stripe. All purchases are final and non-refundable unless required by Malaysian consumer law. Subscription plans will auto-renew unless cancelled before the renewal date.',
  },
  {
    title: '6. Plan Limits',
    content:
      'Free accounts are limited to 2 party sessions and 3 songs per party. Paid plans unlock higher limits as described on the pricing page. Limits are enforced automatically by the platform.',
  },
  {
    title: '7. Intellectual Property',
    content:
      'Karaoku and its original content, features, and functionality are owned by the Karaoku team and are protected by applicable intellectual property laws. Users retain ownership of any content they upload.',
  },
  {
    title: '8. Disclaimer of Warranties',
    content:
      'Karaoku is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service. We are not liable for any loss of data, revenue, or profits arising from use of the platform.',
  },
  {
    title: '9. Changes to Terms',
    content:
      'We reserve the right to modify these Terms at any time. We will notify users of material changes via email or in-app notification. Continued use of Karaoku after changes constitutes your acceptance.',
  },
  {
    title: '10. Governing Law',
    content:
      'These Terms shall be governed by and construed in accordance with the laws of Malaysia. Any disputes shall be resolved in the courts of Malaysia.',
  },
  {
    title: '11. Contact',
    content:
      'For questions about these Terms, contact us at danielnordin53@gmail.com.',
  },
]
