import GuestJoin from '@/components/guest/GuestJoin'

export default function JoinCodePage({ params }: { params: { code: string } }) {
  return <GuestJoin code={params.code.toUpperCase()} />
}
