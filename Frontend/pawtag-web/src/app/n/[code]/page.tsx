import { redirect } from "next/navigation";
export default async function NfcPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/t/${code}`);
}
