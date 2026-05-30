"use client";

import { useMemo, useState } from "react";
import { ObjectivePreset } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getObjectivePresetDefaultCta } from "../../objective-presets";

type CreativePackSummary = {
  id: string;
  name: string;
  packStyle: string;
  defaultTone: string;
  defaultCta: string;
  targetDurationSec: number;
  estimatedCreditCost: number;
};

type InitialPackConfig = {
  packId: string;
  audience: string;
  tone: string;
  overlayLanguage: string;
  offer: string;
  ctaText: string;
};

type CreativeSetupFormProps = {
  packs: CreativePackSummary[];
  objectivePreset: ObjectivePreset;
  initialConfig: InitialPackConfig;
  action: (formData: FormData) => void | Promise<void>;
};

export function CreativeSetupForm({ packs, objectivePreset, initialConfig, action }: CreativeSetupFormProps) {
  const packsById = useMemo(
    () => new Map(packs.map((pack) => [pack.id, pack] as const)),
    [packs],
  );

  const initialPack = packsById.get(initialConfig.packId);
  const initialObjectiveCta = initialPack
    ? getObjectivePresetDefaultCta(objectivePreset) ?? initialPack.defaultCta
    : null;

  const [selectedPackId, setSelectedPackId] = useState(initialConfig.packId);
  const [audience, setAudience] = useState(initialConfig.audience);
  const [tone, setTone] = useState(initialConfig.tone);
  const [overlayLanguage, setOverlayLanguage] = useState(initialConfig.overlayLanguage);
  const [offer, setOffer] = useState(initialConfig.offer);
  const [ctaText, setCtaText] = useState(initialConfig.ctaText);

  const [toneTouched, setToneTouched] = useState(
    initialPack ? initialConfig.tone.trim() !== initialPack.defaultTone.trim() : false,
  );
  const [ctaTouched, setCtaTouched] = useState(
    initialObjectiveCta ? initialConfig.ctaText.trim() !== initialObjectiveCta.trim() : false,
  );

  const selectedPack = packsById.get(selectedPackId) ?? packs[0];

  function handleSelectPack(packId: string) {
    const pack = packsById.get(packId);
    if (!pack) return;

    setSelectedPackId(packId);

    if (!toneTouched) {
      setTone(pack.defaultTone);
    }

    if (!ctaTouched) {
      setCtaText(getObjectivePresetDefaultCta(objectivePreset) ?? pack.defaultCta);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pilih Creative Pack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {packs.map((pack) => {
              const selected = pack.id === selectedPackId;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handleSelectPack(pack.id)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition",
                    selected
                      ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-950"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-950",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {pack.name}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {pack.targetDurationSec}s • {pack.estimatedCreditCost} credit
                      </p>
                    </div>
                    {selected ? <Badge variant="secondary">Selected</Badge> : null}
                  </div>

                  <dl className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="space-y-0.5">
                      <dt className="font-medium text-zinc-900 dark:text-zinc-100">Pack Style</dt>
                      <dd>{pack.packStyle}</dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="font-medium text-zinc-900 dark:text-zinc-100">Default Tone</dt>
                      <dd>{pack.defaultTone}</dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="font-medium text-zinc-900 dark:text-zinc-100">Default CTA</dt>
                      <dd>{pack.defaultCta}</dd>
                    </div>
                  </dl>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pack Config</CardTitle>
        </CardHeader>
        <form action={action}>
          <CardContent className="space-y-5">
            <input type="hidden" name="packId" value={selectedPackId} />

            <div className="space-y-2">
              <Label>Selected Pack</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{selectedPack.name}</Badge>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {selectedPack.targetDurationSec}s • {selectedPack.estimatedCreditCost} credit
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pack-audience">Audience</Label>
              <Textarea
                id="pack-audience"
                name="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Contoh: wanita 18-35, urban, suka skincare"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pack-tone">Tone</Label>
              <Input
                id="pack-tone"
                name="tone"
                value={tone}
                onChange={(e) => {
                  setToneTouched(true);
                  setTone(e.target.value);
                }}
                placeholder={selectedPack.defaultTone}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pack-overlay-language">Overlay Language</Label>
              <Input
                id="pack-overlay-language"
                name="overlayLanguage"
                value={overlayLanguage}
                onChange={(e) => setOverlayLanguage(e.target.value)}
                placeholder="English"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pack-offer">Offer</Label>
              <Textarea
                id="pack-offer"
                name="offer"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder="Contoh: Diskon 20% sampai Minggu ini"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pack-cta">CTA Text</Label>
              <Input
                id="pack-cta"
                name="ctaText"
                value={ctaText}
                onChange={(e) => {
                  setCtaTouched(true);
                  setCtaText(e.target.value);
                }}
                placeholder={getObjectivePresetDefaultCta(objectivePreset) ?? selectedPack.defaultCta}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button type="submit">Save</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

