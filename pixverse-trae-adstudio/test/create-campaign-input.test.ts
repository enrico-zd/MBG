import assert from "node:assert/strict";
import test from "node:test";
import { parseCreateCampaignFormData } from "../src/app/dashboard/campaigns/validation";
import { ObjectivePreset } from "../src/generated/prisma/enums";

test("parseCreateCampaignFormData: auto-fills objectiveText from preset label when not Custom", () => {
  const formData = new FormData();
  formData.set("title", "My Campaign");
  formData.set("objectivePreset", ObjectivePreset.AWARENESS);
  formData.set("objectiveText", "");

  const result = parseCreateCampaignFormData(formData);
  assert.equal(result.objectivePreset, ObjectivePreset.AWARENESS);
  assert.equal(result.objectiveText, "Awareness");
});

test("parseCreateCampaignFormData: requires objectiveText when Custom", () => {
  const formData = new FormData();
  formData.set("title", "My Campaign");
  formData.set("objectivePreset", ObjectivePreset.CUSTOM);
  formData.set("objectiveText", "");

  assert.throws(() => parseCreateCampaignFormData(formData));
});

test("parseCreateCampaignFormData: accepts objectiveText when Custom", () => {
  const formData = new FormData();
  formData.set("title", "My Campaign");
  formData.set("objectivePreset", ObjectivePreset.CUSTOM);
  formData.set("objectiveText", "Drive email signups");

  const result = parseCreateCampaignFormData(formData);
  assert.equal(result.objectivePreset, ObjectivePreset.CUSTOM);
  assert.equal(result.objectiveText, "Drive email signups");
});
