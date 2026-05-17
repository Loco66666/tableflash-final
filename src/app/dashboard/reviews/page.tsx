import { ChevronRight, Star, ThumbsUp } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReviewCard } from "@/components/ui-custom/ReviewCard";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { StatCard } from "@/components/ui-custom/StatCard";
import { reviews } from "@/lib/data/seed";

export default function ReviewsPage() {
  return (
    <AppShell>
      <PageHeader title="Avis clients" subtitle="Avis" />
      <div className="mb-6 grid grid-cols-3 gap-3"><StatCard icon={Star} value="4,8/5" label="note moyenne" /><StatCard icon={Star} value="3" label="avis à traiter" warm /><StatCard icon={ThumbsUp} value="24" label="avis positifs" /></div>
      <SectionCard className="mb-7 flex min-h-20 items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-emerald-50 text-3xl font-black text-blue-600">G</span><div className="min-w-0 flex-1"><h2 className="text-xl font-black">Lien Google Avis</h2><p className="truncate text-slate-600">Voir et gérer vos avis sur Google</p></div><ChevronRight className="size-6 text-slate-500" /></SectionCard>
      <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">À traiter</h2>
      <div className="grid gap-5">{reviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div>
    </AppShell>
  );
}
