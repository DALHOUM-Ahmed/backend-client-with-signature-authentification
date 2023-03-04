import {
  CreateGroup as CreateGroupEvent,
  UpdateGroupName as UpdateGroupNameEvent,
  UpdateGroupAbout as UpdateGroupAboutEvent,
  DeleteGroup as DeleteGroupEvent,
  UpdateBanStatus as UpdateBanStatusEvent,
  UpdateGroupPrivacy as UpdateGroupPrivacyEvent,
  Follow as FollowEvent,
  UnFollow as UnFollowEvent,
  CreatePostGroup as CreatePostGroupEvent
} from "../generated/groups/groups";
import { User, Post, Group } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import { log } from "@graphprotocol/graph-ts";

export function handleCreatePostGroup(event: CreatePostGroupEvent): void {
  let userEntity = User.load(event.params.userID.toString());
  let postEntity = Post.load(event.params.postID.toString());

  if (userEntity === null || postEntity === null) {
    return;
  }
  let groupEntity = newGroup(
    event.params.groupID.toString(),
    event.params.name,
    event.params.userID.toString(),
    event.params.about,
    event.params.isPrivateGroup
  );

  postEntity.group = event.params.groupID.toString();
  groupEntity.post = event.params.postID.toString();

  groupEntity.integerID = event.params.groupID;
  groupEntity.followers = [];
  groupEntity.numberOfFollowers = 0;

  if (userEntity.firstCreatedGroupID === null) {
    userEntity.firstCreatedGroupID = event.params.groupID;
  }
  userEntity.lastCreatedGroupID = event.params.groupID;
  userEntity.save();
  groupEntity.save();
  postEntity.save();
}

export function handleCreateGroup(event: CreateGroupEvent): void {
  let userEntity = User.load(event.params.userID.toString());
  if (userEntity === null) {
    return;
  }
  let groupEntity = newGroup(
    event.params.groupID.toString(),
    event.params.name,
    event.params.userID.toString(),
    event.params.about,
    event.params.isPrivateGroup
  );
  groupEntity.integerID = event.params.groupID;
  groupEntity.followers = [];
  groupEntity.numberOfFollowers = 0;
  groupEntity.post = "0";

  if (userEntity.firstCreatedGroupID === null) {
    userEntity.firstCreatedGroupID = event.params.groupID;
  }
  userEntity.lastCreatedGroupID = event.params.groupID;
  userEntity.save();
  groupEntity.save();
}

export function handleFollow(event: FollowEvent): void {
  let follower = User.load(event.params.follower.toString());
  let followed = Group.load(event.params.followedGroup.toString());

  if (follower === null || followed === null) {
    return;
  }

  // followed.followers.push(event.params.follower.toString());
  followed.followers = followed.followers!.concat([
    event.params.follower.toString()
  ]);

  follower.followedGroups = follower.followedGroups!.concat([
    event.params.followedGroup.toString()
  ]);

  // follower.followedUsers.push(event.params.followed.toString());

  follower.followedGroupsCount += 1;
  followed.numberOfFollowers += 1;

  follower.save();
  followed.save();
}

export function handleUnFollow(event: UnFollowEvent): void {
  let follower = User.load(event.params.follower.toString());
  let followed = Group.load(event.params.followedGroup.toString());
  if (follower === null || followed === null) {
    return;
  }

  var newFollowers: string[] = [];
  for (let i = 0; i < followed.followers!.length; i++) {
    if (parseInt(followed.followers![i]) !== parseInt(follower.id)) {
      newFollowers = newFollowers.concat([followed.followers![i]]);
    }
  }
  followed.followers = newFollowers;

  var newFollowings: string[] = [];
  for (let i = 0; i < follower.followedUsers!.length; i++) {
    if (parseInt(follower.followedGroups![i]) !== parseInt(followed.id)) {
      newFollowings = newFollowings.concat([follower.followedUsers![i]]);
    }
  }
  follower.followedGroups = newFollowings;

  if (follower.followedGroupsCount === 0 || followed.numberOfFollowers === 0)
    return;

  follower.followedUsersCount -= 1;
  followed.numberOfFollowers -= 1;
  follower.save();
  followed.save();
}

export function handleDeleteGroup(event: DeleteGroupEvent): void {
  let entity = Group.load(event.params.groupId.toString());
  if (entity === null) {
    return;
  }
  entity.name = "";
  entity.author = "";
  entity.about = "";
  entity.deleted = true;

  entity.save();
}

export function handleUpdateGroupAbout(event: UpdateGroupAboutEvent): void {
  let entity = Group.load(event.params.groupId.toString());

  if (entity === null) {
    return;
  }

  entity.about = event.params.about;
  entity.save();
}

export function handleUpdateGroupPrivacy(event: UpdateGroupPrivacyEvent): void {
  let entity = Group.load(event.params.groupId.toString());

  if (entity === null) {
    return;
  }

  entity.isPrivate = event.params.isPrivate;
  entity.save();
}

export function handleUpdateGroupName(event: UpdateGroupNameEvent): void {
  let entity = Group.load(event.params.groupId.toString());

  if (entity === null) {
    return;
  }

  entity.name = event.params.name;
  entity.save();
}

export function handleUpdateBanStatus(event: UpdateBanStatusEvent): void {
  let userEntity = User.load(event.params.userID.toString());
  let groupEntity = Group.load(event.params.groupId.toString());

  if (groupEntity === null || userEntity === null) {
    return;
  }
  if (event.params.isBanned) {
    groupEntity.bannedUsersCount += 1;
    userEntity.bannedGroupsCount += 1;
  } else {
    groupEntity.bannedUsersCount -= 1;
    userEntity.bannedGroupsCount -= 1;
  }

  userEntity.save();
  groupEntity.save();
}

function newGroup(
  id: string,
  name: string,
  author: string,
  about: string,
  isPrivate: boolean
): Group {
  let entity = new Group(id);
  entity.name = name;
  entity.author = author;
  entity.about = about;
  entity.deleted = false;
  entity.admins = [author];
  entity.posts = [];
  entity.bannedUsersCount = 0;
  entity.isPrivate = isPrivate;
  return entity;
}
