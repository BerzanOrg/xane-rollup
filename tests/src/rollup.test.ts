import { it, describe } from "node:test"
import assert from "node:assert/strict"
import { RollupProgram, RollupState, RollupStorage } from "xane"

describe("Rollup tests", async () => {
    await RollupProgram.compile()

    const rollupStorage = RollupStorage.empty()

    const rollupState = new RollupState({
        balancesRoot: rollupStorage.balanceStorage.getBalancesRoot(),
        ordersRoot: rollupStorage.orderStorage.getOrdersRoot(),
    })

    it("updates rollup state", async () => {
        assert(rollupState, "todo")
    })
})
