<script setup>
import { reactive, ref } from "vue";
import { isValidEmail, isValidSchoolId, sanitizeClaimPayload } from "../../utils/inputProtection";

const props = defineProps({
  open: { type: Boolean, default: false },
  item: { type: Object, default: null }
});

const emit = defineEmits(["close", "submit"]);
const errors = ref({});
const form = reactive({ claimantName: "", schoolId: "", contactEmail: "", proof: "" });

function submit() {
  const clean = sanitizeClaimPayload({
    ...form,
    itemId: props.item?.id,
    itemName: props.item?.name
  });
  Object.assign(form, {
    claimantName: clean.claimantName,
    schoolId: clean.schoolId,
    contactEmail: clean.contactEmail,
    proof: clean.proof
  });
  errors.value = {};
  if (!form.claimantName || form.claimantName.length < 3) errors.value.claimantName = "Full name is required.";
  if (!isValidSchoolId(form.schoolId)) errors.value.schoolId = "School ID must be in format 211-00087.";
  if (!isValidEmail(form.contactEmail)) errors.value.contactEmail = "Contact email is invalid.";
  if (!form.proof || form.proof.length < 10) errors.value.proof = "Proof must be specific.";
  if (Object.keys(errors.value).length) return;

  emit("submit", {
    ...clean
  });
  Object.assign(form, { claimantName: "", schoolId: "", contactEmail: "", proof: "" });
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 bg-black/30">
    <aside class="ml-auto flex h-full w-full max-w-md flex-col bg-white p-6 shadow-soft">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-primary">Claim item</p>
          <h2 class="text-2xl font-bold text-dark">{{ item?.name }}</h2>
        </div>
        <button class="btn-secondary" type="button" @click="$emit('close')">Close</button>
      </div>
      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <label class="block">
          <span class="label">Full Name</span>
          <input v-model="form.claimantName" class="field mt-1" />
          <span v-if="errors.claimantName" class="text-xs text-danger">{{ errors.claimantName }}</span>
        </label>
        <label class="block">
          <span class="label">School ID</span>
          <input v-model="form.schoolId" class="field mt-1" placeholder="211-00087" />
          <span v-if="errors.schoolId" class="text-xs text-danger">{{ errors.schoolId }}</span>
        </label>
        <label class="block">
          <span class="label">Contact Email</span>
          <input v-model="form.contactEmail" class="field mt-1" type="email" />
          <span v-if="errors.contactEmail" class="text-xs text-danger">{{ errors.contactEmail }}</span>
        </label>
        <label class="block">
          <span class="label">Proof of Ownership</span>
          <textarea v-model="form.proof" class="field mt-1 min-h-32" />
          <span v-if="errors.proof" class="text-xs text-danger">{{ errors.proof }}</span>
        </label>
        <button class="btn-primary w-full" type="submit">Submit Claim</button>
      </form>
    </aside>
  </div>
</template>
