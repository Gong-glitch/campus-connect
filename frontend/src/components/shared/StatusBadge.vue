<script setup>
defineProps({ status: { type: String, required: true } });

function badgeClass(status) {
  return {
    Unclaimed: "bg-amber-100 text-amber-700",
    Claimed: "bg-green-100 text-green-700",
    Pending: "bg-blue-100 text-blue-700",
    "Pending Approval": "bg-blue-100 text-blue-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
    Archived: "bg-gray-100 text-gray-600",
    Open: "bg-blue-100 text-blue-700",
    Matched: "bg-light text-primary",
    Resolved: "bg-green-100 text-green-700"
  }[status] || "bg-gray-100 text-gray-600";
}
</script>

<template>
  <span class="inline-flex rounded-md px-3 py-1 text-xs font-semibold" :class="badgeClass(status)">
    {{ status }}
  </span>
</template>
