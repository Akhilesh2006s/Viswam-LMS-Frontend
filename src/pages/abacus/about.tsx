import { useState } from 'react';
import { Link } from 'wouter';
import { AbacusModuleLayout } from '@/components/abacus/AbacusModuleLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageTitle } from '@/hooks/use-page-title';
import { ABACUS_ROUTES } from '@/lib/abacus-routes';

export default function AbacusAboutPage() {
  usePageTitle('Know Abacus');
  const [info, setInfo] = useState({ title: 'Select a Part', text: 'Click a marker on the image to learn more.' });

  return (
    <AbacusModuleLayout page="about" title="Know Abacus" wide>
      <Tabs defaultValue="intro" className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto">
          <TabsTrigger value="intro">About Abacus</TabsTrigger>
          <TabsTrigger value="parts">Parts</TabsTrigger>
          <TabsTrigger value="fingers">Finger Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="intro" className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <h1 className="text-2xl font-bold text-[#0b1f3a]">The Art of Abacus</h1>
          <p className="border-l-4 border-emerald-500 pl-4 text-slate-600">
            Abacus is a tool used for arithmetic calculations and mental math training. With consistent practice,
            students improve speed, accuracy, concentration, and confidence.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 border">
              <h3 className="font-semibold text-[#0b1f3a]">Evolution of Abacus</h3>
              <p className="mt-2 text-sm text-slate-600">Derived from Greek &quot;Abax&quot; meaning counting table. India follows the Japanese Soroban methodology.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border">
              <h3 className="font-semibold text-[#0b1f3a]">How it Works</h3>
              <p className="mt-2 text-sm text-slate-600">Builds visualization first, then instant mental arithmetic without pen, paper, or a physical abacus.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="parts" className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-6">
            <div className="relative">
              <img src="/abacus/a.png" alt="Abacus parts" className="max-w-full rounded-lg" />
              {[
                { top: '24%', left: '15%', info: 'Frame: Holds the entire structure' },
                { top: '25%', left: '64%', info: 'Heaven Beads: Each bead = 5' },
                { top: '37%', left: '45%', info: 'Unit Bar: Divider between beads' },
                { top: '96%', left: '62%', info: 'Earth Beads: Each bead = 1' },
              ].map((pt) => (
                <button
                  key={pt.info}
                  type="button"
                  className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500 ring-2 ring-white"
                  style={{ top: pt.top, left: pt.left }}
                  onClick={() => setInfo({ title: 'Abacus Part', text: pt.info })}
                />
              ))}
            </div>
            <div className="min-w-[240px] flex-1 rounded-xl border-2 border-emerald-500/30 p-5">
              <h3 className="font-semibold text-emerald-700">{info.title}</h3>
              <p className="mt-2 text-slate-600">{info.text}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fingers" className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-[#0b1f3a]">Finger Movements</h2>
          <p className="text-slate-600">Use thumb for earth beads (addition) and index finger for heaven beads and subtraction moves.</p>
          <div className="rounded-xl bg-sky-50 border border-sky-100 p-4">
            <h3 className="font-semibold text-sky-900">The Golden Rule</h3>
            <p className="mt-2 text-sm text-sky-900">Use only thumb and index finger. Keep other fingers tucked — often holding a pencil ready to write the answer.</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 text-center">
        <Link href={ABACUS_ROUTES.home} className="text-sm font-medium text-emerald-700 hover:underline">
          ← Back to Abacus Home
        </Link>
      </div>
    </AbacusModuleLayout>
  );
}
