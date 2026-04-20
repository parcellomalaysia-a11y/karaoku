import PartyRoom from '@/components/party/PartyRoom'

export default function PartyPage({ params }: { params: { code: string } }) {
  return <PartyRoom code={params.code.toUpperCase()} />
}
