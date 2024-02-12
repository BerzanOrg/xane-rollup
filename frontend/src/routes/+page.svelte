<script lang="ts">
    let baseToken = $state("MINA")
    let quoteToken = $state("USD")

    $effect(() => {
        quoteToken = baseToken === "MINA" ? "USD" : "MINA"
    })

    $effect(() => {
        baseToken = quoteToken === "MINA" ? "USD" : "MINA"
    })
</script>

<section class="flex flex-col gap-6 text-center w-full items-center">
    <h1 class="text-center text-3xl font-bold">Swap Tokens</h1>
    <div class="bg-amber-200 flex flex-col p-4 gap-4 rounded-2xl w-full max-w-md">
        <div class="flex justify-between"></div>
        <div class="group bg-amber-100 rounded-2xl">
            <div
                class="group-focus-within:bg-amber-50 rounded-2xl flex justify-between pr-2.5 duration-150 h-20"
            >
                <input
                    class="outline-none bg-transparent px-4 text-xl w-full placeholder:text-amber-950/20 tabular-nums"
                    type="number"
                    placeholder="0.00"
                />

                <select
                    class="outline-none bg-transparent font-semibold text-xl cursor-pointer"
                    bind:value={baseToken}
                >
                    <option>MINA</option>
                    <option>USD</option>
                </select>
            </div>
        </div>
        <div class="group bg-amber-100 rounded-2xl">
            <div
                class="group-focus-within:bg-amber-50 rounded-2xl flex justify-between pr-2.5 duration-150 h-20"
            >
                <input
                    class="outline-none bg-transparent px-4 text-xl w-full placeholder:text-amber-950/20 tabular-nums"
                    type="number"
                    placeholder="0.00"
                />

                <select
                    class="outline-none bg-transparent font-semibold text-xl cursor-pointer"
                    bind:value={quoteToken}
                >
                    <option>MINA</option>
                    <option>USD</option>
                </select>
            </div>
        </div>
        <button
            class="bg-gradient-to-b from-amber-400 to to-amber-500 text-white h-11 font-semibold rounded-full hover:scale-95 active:scale-100 duration-150"
            >Swap</button
        >
    </div>
</section>
