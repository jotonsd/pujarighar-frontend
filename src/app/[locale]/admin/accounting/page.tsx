import { redirect } from 'next/navigation'

export default function AccountingRedirectPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/admin/accounting/journal`)
}
