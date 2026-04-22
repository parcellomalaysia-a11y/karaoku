'use client'

import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import { useLang } from '@/lib/i18n/LangProvider'
import { s } from '@/types'

export default function TermsPage() {
  const { lang } = useLang()

  return (
    <div style={{ minHeight: '100vh', background: s.black }}>
      <header
        style={{
          padding: '20px 32px',
          borderBottom: `1px solid ${s.gray}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link href="/"><Logo size={36} /></Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <LangToggle />
          <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 32px 80px' }}>
        <div style={{ fontSize: 11, color: s.redLight, letterSpacing: 3, fontWeight: 800, marginBottom: 8 }}>
          {lang === 'bm' ? 'TERMA PERKHIDMATAN' : 'TERMS OF SERVICE'}
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: -0.8 }}>
          {lang === 'bm' ? 'Terma Perkhidmatan' : 'Terms of Service'}
        </h1>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 40 }}>
          {lang === 'bm' ? 'Kemas kini terakhir: ' : 'Last updated: '} {new Date().toLocaleDateString(lang === 'bm' ? 'ms-MY' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {lang === 'bm' ? <TermsBM /> : <TermsEN />}
      </main>

      <Footer />
    </div>
  )
}

function TermsEN() {
  return (
    <div style={{ color: '#ddd', fontSize: 14, lineHeight: 1.8 }}>
      <Section title="1. About Karaoku">
        <p>Karaoku (&quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;) is a session management and queue coordination service for groups. The Platform enables users to create virtual rooms, invite participants via unique codes or QR codes, build shared queues of content references (e.g., YouTube video links), and coordinate synchronized playback status among participants.</p>
        <p><strong style={{ color: 'white' }}>What the Platform does NOT do:</strong> We do not host, distribute, sell, stream, transmit, or license any music, audio, video, or other copyrighted content. All such content is played via embedded third-party streaming providers (such as YouTube) using their own players, under those providers&apos; terms of service.</p>
      </Section>

      <Section title="2. User Responsibility for Third-Party Content">
        <p>Users are solely responsible for:</p>
        <ul style={ulStyle}>
          <li>Ensuring their use of third-party content (including YouTube videos) complies with that provider&apos;s terms of service and all applicable copyright laws;</li>
          <li>Obtaining any necessary licenses, permissions, or rights required for their intended use of such content (including public performance where applicable);</li>
          <li>All consequences arising from their selection, sharing, or playback of third-party content via the Platform.</li>
        </ul>
        <p>The Platform provides no rights, licenses, or permissions for music, video, or any copyrighted content. Platform fees cover only the session management software features described in Section 3.</p>
      </Section>

      <Section title="3. Platform Features and Paid Access">
        <p>Platform features include: room hosting, participant management, queue coordination, real-time synchronization status, QR code generation, and related software tools.</p>
        <p>Paid subscription tiers (Day, Monthly, Yearly) grant access to extended platform features such as unlimited rooms, unlimited participants per room, extended session duration, and additional queue capacity. <strong style={{ color: 'white' }}>Subscription fees do not provide access to, licenses for, or rights to any music, video, or third-party content.</strong></p>
      </Section>

      <Section title="4. Acceptable Use">
        <p>You agree not to use the Platform:</p>
        <ul style={ulStyle}>
          <li>For any commercial public performance of copyrighted works without the appropriate licenses from rights holders;</li>
          <li>To violate any third-party provider&apos;s terms of service (including YouTube);</li>
          <li>To infringe any copyright, trademark, or other intellectual property right;</li>
          <li>For any illegal, harmful, or abusive purpose.</li>
        </ul>
      </Section>

      <Section title="5. Account and Access">
        <p>To host rooms, you must create an account via Google Sign-In. Participants may join rooms as guests without an account. You are responsible for activity under your account.</p>
      </Section>

      <Section title="6. Refunds and Cancellations">
        <p>Paid passes are one-time purchases. Day passes (RM9) expire 24 hours after purchase. Monthly (RM39) and Yearly (RM199) passes expire 30 and 365 days after purchase respectively. Refunds may be requested within 24 hours of purchase if platform features are not delivered as described; email support@karaoku.my.</p>
      </Section>

      <Section title="7. Disclaimer of Warranties">
        <p>The Platform is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted service, specific outcomes from use, or the availability of third-party content providers (YouTube may change, restrict, or remove embedded player access at any time).</p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>To the maximum extent permitted by law, our liability for any claim arising from or relating to the Platform shall not exceed the total amount you paid to us in the 12 months preceding the claim.</p>
        <p>We are not liable for any claim arising from third-party content played via the Platform. Users assume all risk and responsibility for their content choices and use.</p>
      </Section>

      <Section title="9. Changes">
        <p>We may update these Terms from time to time. Continued use after changes constitutes acceptance.</p>
      </Section>

      <Section title="10. Contact">
        <p>Questions? Email <a href="mailto:support@karaoku.my" style={{ color: '#ff4757' }}>support@karaoku.my</a>.</p>
      </Section>

      <div style={{
        marginTop: 40,
        padding: 20,
        background: '#1a0a0d',
        borderRadius: 10,
        border: `1px solid ${s.gray}`,
        fontSize: 12,
        color: '#bbb',
      }}>
        <strong style={{ color: 'white' }}>Summary:</strong> Karaoku is coordination software. You bring your own YouTube links. We don&apos;t license music. You handle your own copyright compliance.
      </div>
    </div>
  )
}

function TermsBM() {
  return (
    <div style={{ color: '#ddd', fontSize: 14, lineHeight: 1.8 }}>
      <Section title="1. Mengenai Karaoku">
        <p>Karaoku (&quot;Platform&quot;, &quot;kami&quot;) ialah perkhidmatan pengurusan sesi dan koordinasi queue untuk kumpulan. Platform ini membolehkan pengguna mencipta bilik maya, menjemput peserta melalui kod unik atau QR code, membina queue bersama rujukan kandungan (contoh: link video YouTube), dan menyelaras status main serentak antara peserta.</p>
        <p><strong style={{ color: 'white' }}>Apa Platform TIDAK buat:</strong> Kami tidak hos, edar, jual, strim, hantar, atau lesen apa-apa muzik, audio, video, atau kandungan berhak cipta. Semua kandungan dimainkan melalui penyedia strim pihak ketiga benam (seperti YouTube) menggunakan pemain mereka sendiri, di bawah terma perkhidmatan penyedia tersebut.</p>
      </Section>

      <Section title="2. Tanggungjawab Pengguna untuk Kandungan Pihak Ketiga">
        <p>Pengguna bertanggungjawab sepenuhnya untuk:</p>
        <ul style={ulStyle}>
          <li>Memastikan penggunaan kandungan pihak ketiga (termasuk video YouTube) mematuhi terma perkhidmatan penyedia tersebut dan semua undang-undang hak cipta yang berkenaan;</li>
          <li>Mendapatkan sebarang lesen, kebenaran, atau hak yang diperlukan untuk penggunaan yang dimaksudkan (termasuk persembahan awam jika berkenaan);</li>
          <li>Semua akibat yang timbul daripada pemilihan, perkongsian, atau main balik kandungan pihak ketiga melalui Platform.</li>
        </ul>
        <p>Platform tidak memberi apa-apa hak, lesen, atau kebenaran untuk muzik, video, atau kandungan berhak cipta. Yuran Platform hanya meliputi ciri perisian pengurusan sesi seperti dijelaskan dalam Seksyen 3.</p>
      </Section>

      <Section title="3. Ciri Platform dan Akses Berbayar">
        <p>Ciri Platform termasuk: hosting bilik, pengurusan peserta, koordinasi queue, status sync realtime, penjanaan QR code, dan alat perisian berkaitan.</p>
        <p>Pakej langganan berbayar (Harian, Bulanan, Tahunan) memberi akses ciri Platform lanjutan seperti bilik tanpa had, peserta tanpa had setiap bilik, tempoh sesi lanjutan, dan kapasiti queue tambahan. <strong style={{ color: 'white' }}>Yuran langganan TIDAK memberi akses kepada, lesen untuk, atau hak kepada apa-apa muzik, video, atau kandungan pihak ketiga.</strong></p>
      </Section>

      <Section title="4. Penggunaan Yang Boleh Diterima">
        <p>Anda bersetuju untuk TIDAK menggunakan Platform:</p>
        <ul style={ulStyle}>
          <li>Untuk apa-apa persembahan awam komersial karya berhak cipta tanpa lesen yang sesuai daripada pemilik hak;</li>
          <li>Untuk melanggar terma perkhidmatan mana-mana penyedia pihak ketiga (termasuk YouTube);</li>
          <li>Untuk melanggar apa-apa hak cipta, tanda dagangan, atau hak harta intelek lain;</li>
          <li>Untuk tujuan haram, memudaratkan, atau menyalahguna.</li>
        </ul>
      </Section>

      <Section title="5. Akaun dan Akses">
        <p>Untuk hos bilik, anda mesti cipta akaun melalui Google Sign-In. Peserta boleh join bilik sebagai tetamu tanpa akaun. Anda bertanggungjawab untuk aktiviti di bawah akaun anda.</p>
      </Section>

      <Section title="6. Refund dan Pembatalan">
        <p>Pas berbayar adalah pembelian sekali. Pas Harian (RM9) luput 24 jam selepas pembelian. Pas Bulanan (RM39) dan Tahunan (RM199) luput 30 dan 365 hari selepas pembelian. Refund boleh diminta dalam tempoh 24 jam pembelian jika ciri platform tidak disampaikan seperti dijelaskan; emel support@karaoku.my.</p>
      </Section>

      <Section title="7. Penafian Jaminan">
        <p>Platform disediakan &quot;sebagaimana adanya&quot; tanpa jaminan apa-apa jenis. Kami tidak menjamin perkhidmatan tidak terganggu, hasil tertentu daripada penggunaan, atau ketersediaan penyedia kandungan pihak ketiga (YouTube boleh tukar, sekat, atau buang akses pemain benam pada bila-bila masa).</p>
      </Section>

      <Section title="8. Had Liabiliti">
        <p>Setakat maksimum yang dibenarkan oleh undang-undang, liabiliti kami untuk apa-apa tuntutan yang timbul daripada atau berkaitan dengan Platform tidak akan melebihi jumlah keseluruhan yang anda bayar kepada kami dalam 12 bulan sebelum tuntutan.</p>
        <p>Kami tidak bertanggungjawab untuk apa-apa tuntutan yang timbul daripada kandungan pihak ketiga yang dimainkan melalui Platform. Pengguna menanggung semua risiko dan tanggungjawab untuk pilihan dan penggunaan kandungan mereka.</p>
      </Section>

      <Section title="9. Perubahan">
        <p>Kami boleh kemas kini Terma ini dari masa ke masa. Penggunaan berterusan selepas perubahan bermakna penerimaan.</p>
      </Section>

      <Section title="10. Hubungi">
        <p>Ada soalan? Emel <a href="mailto:support@karaoku.my" style={{ color: '#ff4757' }}>support@karaoku.my</a>.</p>
      </Section>

      <div style={{
        marginTop: 40,
        padding: 20,
        background: '#1a0a0d',
        borderRadius: 10,
        border: `1px solid ${s.gray}`,
        fontSize: 12,
        color: '#bbb',
      }}>
        <strong style={{ color: 'white' }}>Ringkasan:</strong> Karaoku ialah software koordinasi. Anda bawa link YouTube sendiri. Kami tidak lesen muzik. Anda uruskan pematuhan hak cipta sendiri.
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, color: 'white', letterSpacing: -0.2 }}>
        {title}
      </h2>
      <div>{children}</div>
    </div>
  )
}

const ulStyle: React.CSSProperties = {
  paddingLeft: 20,
  margin: '8px 0 12px',
}

function Footer() {
  const { lang } = useLang()
  return (
    <footer style={{ padding: '28px 32px', borderTop: `1px solid ${s.gray}`, background: '#0a0a0a', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#555', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
        © {new Date().getFullYear()} Karaoku. {lang === 'bm'
          ? 'Platform pengurusan sesi. Tidak mengedar atau melesenkan muzik.'
          : 'Session management platform. Does not distribute or license music.'}
      </div>
    </footer>
  )
}
