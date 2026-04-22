'use client'

import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import LangToggle from '@/components/ui/LangToggle'
import { useLang } from '@/lib/i18n/LangProvider'
import { s } from '@/types'

export default function PrivacyPage() {
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
          {lang === 'bm' ? 'DASAR PRIVASI' : 'PRIVACY POLICY'}
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: -0.8 }}>
          {lang === 'bm' ? 'Dasar Privasi' : 'Privacy Policy'}
        </h1>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 40 }}>
          {lang === 'bm' ? 'Kemas kini terakhir: ' : 'Last updated: '} {new Date().toLocaleDateString(lang === 'bm' ? 'ms-MY' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {lang === 'bm' ? <PrivacyBM /> : <PrivacyEN />}
      </main>

      <footer style={{ padding: '28px 32px', borderTop: `1px solid ${s.gray}`, background: '#0a0a0a', textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#555', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
          © {new Date().getFullYear()} Karaoku.
        </div>
      </footer>
    </div>
  )
}

function PrivacyEN() {
  return (
    <div style={{ color: '#ddd', fontSize: 14, lineHeight: 1.8 }}>
      <Section title="1. Information We Collect">
        <p>When you use Karaoku, we collect:</p>
        <ul style={ulStyle}>
          <li><strong style={{ color: 'white' }}>Account info:</strong> Your email address (via Google Sign-In) and display name.</li>
          <li><strong style={{ color: 'white' }}>Usage data:</strong> Rooms you host, participants who join, content references added to queues (YouTube video IDs, titles).</li>
          <li><strong style={{ color: 'white' }}>Payment info:</strong> Processed by Stripe (we don&apos;t store card details). We receive payment confirmation and subscription status only.</li>
          <li><strong style={{ color: 'white' }}>Guest info:</strong> If you join a room as a guest, we collect only the display name you provide and a device fingerprint for session continuity.</li>
          <li><strong style={{ color: 'white' }}>Technical data:</strong> IP address (for abuse prevention), browser type, basic device info.</li>
        </ul>
      </Section>

      <Section title="2. How We Use Information">
        <ul style={ulStyle}>
          <li>To provide and operate the Platform (room hosting, queue sync, participant management);</li>
          <li>To process payments via Stripe;</li>
          <li>To send essential service emails (account confirmations, receipts);</li>
          <li>To prevent abuse and enforce our Terms of Service;</li>
          <li>To improve the Platform based on aggregate usage patterns.</li>
        </ul>
        <p>We do NOT sell your data. We do NOT use your data for advertising.</p>
      </Section>

      <Section title="3. Third Parties">
        <p>We use the following providers to operate the Platform:</p>
        <ul style={ulStyle}>
          <li><strong style={{ color: 'white' }}>Supabase</strong> — database and authentication hosting</li>
          <li><strong style={{ color: 'white' }}>Vercel</strong> — application hosting</li>
          <li><strong style={{ color: 'white' }}>Stripe</strong> — payment processing</li>
          <li><strong style={{ color: 'white' }}>Google</strong> — sign-in service</li>
          <li><strong style={{ color: 'white' }}>YouTube</strong> — embedded video player (when videos are added to queues)</li>
        </ul>
        <p>When you interact with YouTube&apos;s embedded player, Google/YouTube&apos;s own privacy policy applies to that interaction.</p>
      </Section>

      <Section title="4. Your Rights">
        <ul style={ulStyle}>
          <li><strong style={{ color: 'white' }}>Access:</strong> Request a copy of your data.</li>
          <li><strong style={{ color: 'white' }}>Correction:</strong> Update your account info anytime.</li>
          <li><strong style={{ color: 'white' }}>Deletion:</strong> Delete your account anytime. Contact us for a full data purge.</li>
          <li><strong style={{ color: 'white' }}>Opt-out:</strong> Disable optional emails.</li>
        </ul>
        <p>Email <a href="mailto:support@karaoku.my" style={{ color: '#ff4757' }}>support@karaoku.my</a> for any privacy request.</p>
      </Section>

      <Section title="5. Data Retention">
        <p>Account data: retained while your account is active. Deleted 30 days after account closure.</p>
        <p>Room data: deleted 30 days after room ends.</p>
        <p>Payment records: retained 7 years per Malaysian tax law.</p>
      </Section>

      <Section title="6. Security">
        <p>We use industry-standard encryption (HTTPS/TLS) for data in transit. Passwords are not stored (we use Google Sign-In only). Payment data is handled entirely by Stripe.</p>
      </Section>

      <Section title="7. Children">
        <p>Karaoku is not directed at children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided data, email us for immediate deletion.</p>
      </Section>

      <Section title="8. Changes">
        <p>We may update this Privacy Policy. Material changes will be notified via email.</p>
      </Section>

      <Section title="9. Contact">
        <p>For privacy concerns, email <a href="mailto:support@karaoku.my" style={{ color: '#ff4757' }}>support@karaoku.my</a>.</p>
      </Section>
    </div>
  )
}

function PrivacyBM() {
  return (
    <div style={{ color: '#ddd', fontSize: 14, lineHeight: 1.8 }}>
      <Section title="1. Maklumat Yang Kami Kumpul">
        <p>Bila anda guna Karaoku, kami kumpul:</p>
        <ul style={ulStyle}>
          <li><strong style={{ color: 'white' }}>Info akaun:</strong> Emel (melalui Google Sign-In) dan nama paparan.</li>
          <li><strong style={{ color: 'white' }}>Data penggunaan:</strong> Bilik yang anda hos, peserta yang join, rujukan kandungan dalam queue (ID video YouTube, tajuk).</li>
          <li><strong style={{ color: 'white' }}>Info pembayaran:</strong> Diproses oleh Stripe (kami TIDAK simpan detail kad). Kami hanya terima pengesahan bayaran dan status langganan.</li>
          <li><strong style={{ color: 'white' }}>Info tetamu:</strong> Jika anda join bilik sebagai tetamu, kami kumpul hanya nama yang anda berikan dan fingerprint peranti untuk sync sesi.</li>
          <li><strong style={{ color: 'white' }}>Data teknikal:</strong> Alamat IP (pencegahan salah guna), jenis browser, info peranti asas.</li>
        </ul>
      </Section>

      <Section title="2. Cara Kami Guna Maklumat">
        <ul style={ulStyle}>
          <li>Untuk menyediakan dan mengendalikan Platform (hosting bilik, sync queue, pengurusan peserta);</li>
          <li>Untuk memproses bayaran melalui Stripe;</li>
          <li>Untuk hantar emel perkhidmatan penting (pengesahan akaun, resit);</li>
          <li>Untuk cegah salah guna dan kuatkuasakan Terma Perkhidmatan;</li>
          <li>Untuk tambah baik Platform berdasarkan corak penggunaan agregat.</li>
        </ul>
        <p>Kami TIDAK jual data anda. Kami TIDAK guna data anda untuk iklan.</p>
      </Section>

      <Section title="3. Pihak Ketiga">
        <p>Kami guna penyedia berikut untuk jalankan Platform:</p>
        <ul style={ulStyle}>
          <li><strong style={{ color: 'white' }}>Supabase</strong> — database dan authentication</li>
          <li><strong style={{ color: 'white' }}>Vercel</strong> — hosting aplikasi</li>
          <li><strong style={{ color: 'white' }}>Stripe</strong> — pemprosesan bayaran</li>
          <li><strong style={{ color: 'white' }}>Google</strong> — perkhidmatan sign-in</li>
          <li><strong style={{ color: 'white' }}>YouTube</strong> — pemain video benam (bila video ditambah ke queue)</li>
        </ul>
        <p>Bila anda berinteraksi dengan pemain benam YouTube, dasar privasi Google/YouTube sendiri terpakai untuk interaksi tersebut.</p>
      </Section>

      <Section title="4. Hak Anda">
        <ul style={ulStyle}>
          <li><strong style={{ color: 'white' }}>Akses:</strong> Minta salinan data anda.</li>
          <li><strong style={{ color: 'white' }}>Pembetulan:</strong> Kemas kini info akaun bila-bila masa.</li>
          <li><strong style={{ color: 'white' }}>Penghapusan:</strong> Padam akaun anda. Hubungi kami untuk pembuangan data penuh.</li>
          <li><strong style={{ color: 'white' }}>Opt-out:</strong> Matikan emel pilihan.</li>
        </ul>
        <p>Emel <a href="mailto:support@karaoku.my" style={{ color: '#ff4757' }}>support@karaoku.my</a> untuk sebarang permintaan privasi.</p>
      </Section>

      <Section title="5. Pengekalan Data">
        <p>Data akaun: disimpan selagi akaun aktif. Dipadam 30 hari selepas penutupan akaun.</p>
        <p>Data bilik: dipadam 30 hari selepas bilik tamat.</p>
        <p>Rekod bayaran: disimpan 7 tahun mengikut undang-undang cukai Malaysia.</p>
      </Section>

      <Section title="6. Keselamatan">
        <p>Kami guna enkripsi piawai industri (HTTPS/TLS) untuk data semasa transit. Kata laluan tidak disimpan (hanya Google Sign-In). Data bayaran dikendalikan sepenuhnya oleh Stripe.</p>
      </Section>

      <Section title="7. Kanak-kanak">
        <p>Karaoku tidak ditujukan kepada kanak-kanak di bawah 13 tahun. Kami tidak mengumpul data daripada kanak-kanak di bawah 13 tahun secara sedar. Jika anda percaya seorang kanak-kanak telah memberikan data, emel kami untuk penghapusan segera.</p>
      </Section>

      <Section title="8. Perubahan">
        <p>Kami boleh kemas kini Dasar Privasi ini. Perubahan material akan dimaklumkan melalui emel.</p>
      </Section>

      <Section title="9. Hubungi">
        <p>Untuk kebimbangan privasi, emel <a href="mailto:support@karaoku.my" style={{ color: '#ff4757' }}>support@karaoku.my</a>.</p>
      </Section>
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
