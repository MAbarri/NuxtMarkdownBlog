import { useNuxtApp } from '#app'
import type { NuxtApp } from '#app'

export function useDomain() {
    const domain = ref('')

    const nuxtApp = useNuxtApp() as NuxtApp

    const baseUrl = (nuxtApp.$config.public.baseUrl || window?.location.hostname) as string;

    return { domain: baseUrl }
}
