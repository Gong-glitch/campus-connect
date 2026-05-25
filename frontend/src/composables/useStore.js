import { inject } from "vue";
import { appStoreKey } from "../store/appStore";

export function useStore() {
  const store = inject(appStoreKey);
  if (!store) throw new Error("Campus store was not provided.");
  return store;
}
