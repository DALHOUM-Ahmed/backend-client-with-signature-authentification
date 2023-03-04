import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  CreatePost,
  DeletePost,
  UpdateBody,
  UpdatePost
} from "../generated/posts/posts"

export function createCreatePostEvent(
  _author: Address,
  title: string,
  body: string,
  createdAt: BigInt,
  groupID: BigInt,
  postID: BigInt
): CreatePost {
  let createPostEvent = changetype<CreatePost>(newMockEvent())

  createPostEvent.parameters = new Array()

  createPostEvent.parameters.push(
    new ethereum.EventParam("_author", ethereum.Value.fromAddress(_author))
  )
  createPostEvent.parameters.push(
    new ethereum.EventParam("title", ethereum.Value.fromString(title))
  )
  createPostEvent.parameters.push(
    new ethereum.EventParam("body", ethereum.Value.fromString(body))
  )
  createPostEvent.parameters.push(
    new ethereum.EventParam(
      "createdAt",
      ethereum.Value.fromUnsignedBigInt(createdAt)
    )
  )
  createPostEvent.parameters.push(
    new ethereum.EventParam(
      "groupID",
      ethereum.Value.fromUnsignedBigInt(groupID)
    )
  )
  createPostEvent.parameters.push(
    new ethereum.EventParam("postID", ethereum.Value.fromUnsignedBigInt(postID))
  )

  return createPostEvent
}

export function createDeletePostEvent(
  _executor: Address,
  postID: BigInt
): DeletePost {
  let deletePostEvent = changetype<DeletePost>(newMockEvent())

  deletePostEvent.parameters = new Array()

  deletePostEvent.parameters.push(
    new ethereum.EventParam("_executor", ethereum.Value.fromAddress(_executor))
  )
  deletePostEvent.parameters.push(
    new ethereum.EventParam("postID", ethereum.Value.fromUnsignedBigInt(postID))
  )

  return deletePostEvent
}

export function createUpdateBodyEvent(
  _executor: Address,
  postID: BigInt,
  body: string
): UpdateBody {
  let updateBodyEvent = changetype<UpdateBody>(newMockEvent())

  updateBodyEvent.parameters = new Array()

  updateBodyEvent.parameters.push(
    new ethereum.EventParam("_executor", ethereum.Value.fromAddress(_executor))
  )
  updateBodyEvent.parameters.push(
    new ethereum.EventParam("postID", ethereum.Value.fromUnsignedBigInt(postID))
  )
  updateBodyEvent.parameters.push(
    new ethereum.EventParam("body", ethereum.Value.fromString(body))
  )

  return updateBodyEvent
}

export function createUpdatePostEvent(
  _executor: Address,
  postID: BigInt,
  title: string
): UpdatePost {
  let updatePostEvent = changetype<UpdatePost>(newMockEvent())

  updatePostEvent.parameters = new Array()

  updatePostEvent.parameters.push(
    new ethereum.EventParam("_executor", ethereum.Value.fromAddress(_executor))
  )
  updatePostEvent.parameters.push(
    new ethereum.EventParam("postID", ethereum.Value.fromUnsignedBigInt(postID))
  )
  updatePostEvent.parameters.push(
    new ethereum.EventParam("title", ethereum.Value.fromString(title))
  )

  return updatePostEvent
}
