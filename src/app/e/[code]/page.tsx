import GuestParty from '@/components/guest/GuestParty'

export default function GuestPartyPage({ params }: { params: { code: string } }) {
  return <GuestParty code={params.code.toUpperCase()} />
}
