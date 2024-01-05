import { it } from "node:test"
import assert from "node:assert/strict"
import { Encoding } from "o1js"
import {} from "xane"

it("simple o1js test", () => {
    const fields = Encoding.stringToFields("test string")
    const string = Encoding.stringFromFields(fields)

    assert.deepEqual(string, "test string")
})
