import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { CreatePost } from "../generated/schema"
import { CreatePost as CreatePostEvent } from "../generated/posts/posts"
import { handleCreatePost } from "../src/posts"
import { createCreatePostEvent } from "./posts-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let _author = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let title = "Example string value"
    let body = "Example string value"
    let createdAt = BigInt.fromI32(234)
    let groupID = BigInt.fromI32(234)
    let postID = BigInt.fromI32(234)
    let newCreatePostEvent = createCreatePostEvent(
      _author,
      title,
      body,
      createdAt,
      groupID,
      postID
    )
    handleCreatePost(newCreatePostEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("CreatePost created and stored", () => {
    assert.entityCount("CreatePost", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CreatePost",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "_author",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CreatePost",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "title",
      "Example string value"
    )
    assert.fieldEquals(
      "CreatePost",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "body",
      "Example string value"
    )
    assert.fieldEquals(
      "CreatePost",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "createdAt",
      "234"
    )
    assert.fieldEquals(
      "CreatePost",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "groupID",
      "234"
    )
    assert.fieldEquals(
      "CreatePost",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "postID",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
