<script>
    import { user } from "$lib/utils/User.svelte"
</script>

<header class="h-16 sticky top-0 flex items-center justify-between px-4">
    <a href="/" class="text-2xl font-extrabold italic">Xane</a>
    <button
        class="bg-gradient-to-b from-amber-400 to-amber-500 h-11 px-7 text-white font-semibold rounded-full hover:scale-95 active:scale-100 duration-150"
        onclick={user.address ? user.disconnect : user.connect}
    >
        {#if user.address}
            Disconnect
        {:else}
            Connect
        {/if}
    </button>
</header>
