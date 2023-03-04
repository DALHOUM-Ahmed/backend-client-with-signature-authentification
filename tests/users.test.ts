import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { AddTag } from "../generated/schema"
import { AddTag as AddTagEvent } from "../generated/users/users"
import { handleAddTag } from "../src/users"
import { createAddTagEvent } from "./users-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let userId = BigInt.fromI32(234)
    let tag = "Example string value"
    let newAddTagEvent = createAddTagEvent(userId, tag)
    handleAddTag(newAddTagEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AddTag created and stored", () => {
    assert.entityCount("AddTag", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AddTag",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "userId",
      "234"
    )
    assert.fieldEquals(
      "AddTag",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "tag",
      "Example string value"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
