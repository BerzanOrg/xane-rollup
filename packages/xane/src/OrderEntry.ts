import { Field, Poseidon, PublicKey, Struct, UInt64 } from "o1js"

/**
 * Represents a placed order entry's state.
 */
export const ORDER_ENTRY_STATE_PLACED = Field(0)

/**
 * Represents a cancelled order entry's state.
 */
export const ORDER_ENTRY_STATE_CANCELLED = Field(1)

/**
 * Represents an executed order entry's state.
 */
export const ORDER_ENTRY_STATE_EXECUTED = Field(2)

/**
 * A proovable type that represents an order.
 */
export class OrderEntry extends Struct({
    baseToken: PublicKey,
    quoteToken: PublicKey,
    maker: PublicKey,
    amount: UInt64,
    price: UInt64,
    state: Field,
}) {
    /**
     * Returns Poseidon hash of the order entry.
     */
    public hash(): Field {
        return Poseidon.hash([
            ...this.baseToken.toFields(),
            ...this.quoteToken.toFields(),
            ...this.maker.toFields(),
            ...this.amount.toFields(),
            ...this.price.toFields(),
            ...this.state.toFields(),
        ])
    }

    /**
     * Makes the order entry cancelled.
     */
    public cancel(): void {
        this.state = ORDER_ENTRY_STATE_CANCELLED
    }

    /**
     * Makes the order entry executed.
     */
    public execute(): void {
        this.state = ORDER_ENTRY_STATE_EXECUTED
    }
}
