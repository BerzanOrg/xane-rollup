<script lang="ts">
    import Header from "$lib/components/Header.svelte"
    import Main from "$lib/components/Main.svelte"
    import "../app.css"
</script>

<Header />
<Main>
    <slot />
</Main>
