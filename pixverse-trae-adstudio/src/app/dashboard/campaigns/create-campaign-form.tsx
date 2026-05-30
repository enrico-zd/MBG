"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ObjectivePreset } from "@/generated/prisma/enums";
import { OBJECTIVE_PRESETS, objectivePresetLabelByValue } from "./objective-presets";

export function CreateCampaignForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const defaultPreset = ObjectivePreset.AWARENESS;
  const [preset, setPreset] = useState<ObjectivePreset>(defaultPreset);
  const [objectiveText, setObjectiveText] = useState(
    objectivePresetLabelByValue[defaultPreset],
  );

  const isCustom = preset === ObjectivePreset.CUSTOM;
  const presetLabel = useMemo(() => objectivePresetLabelByValue[preset], [preset]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buat Campaign</CardTitle>
        <CardDescription>
          Pilih objective preset, atau Custom untuk menulis objective sendiri.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-title">Title</Label>
            <Input id="campaign-title" name="title" placeholder="Nama campaign" />
          </div>

          <div className="space-y-2">
            <Label>Objective Preset</Label>
            <Select
              name="objectivePreset"
              value={preset}
              onValueChange={(value) => {
                const nextPreset = value as ObjectivePreset;
                setPreset(nextPreset);
                if (nextPreset === ObjectivePreset.CUSTOM) {
                  setObjectiveText("");
                  return;
                }

                setObjectiveText(objectivePresetLabelByValue[nextPreset]);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih objective" />
              </SelectTrigger>
              <SelectContent>
                {OBJECTIVE_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-objective-text">
              Objective Text {isCustom ? null : `(${presetLabel})`}
            </Label>
            <Textarea
              id="campaign-objective-text"
              name="objectiveText"
              value={objectiveText}
              readOnly={!isCustom}
              required={isCustom}
              placeholder={isCustom ? "Tulis objective..." : undefined}
              onChange={(e) => setObjectiveText(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit">Create</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

