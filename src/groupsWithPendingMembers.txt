import {
  CreateGroup as CreateGroupEvent,
  UpdateGroupName as UpdateGroupNameEvent,
  UpdateGroupAbout as UpdateGroupAboutEvent,
  DeleteGroup as DeleteGroupEvent,
  AddGroupMember as AddGroupMemberEvent,
  RemoveMember as RemoveMemberEvent,
  AddPendingMember as SetAddPendingMember,
  RemovePendingMember as SetRemovePendingMember
} from "../generated/groups/groups";
import { User, Post, Group } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import { log } from "@graphprotocol/graph-ts";

export function handleRemoveMember(event: RemoveMemberEvent): void {
  let groupEntity = Group.load(event.params.groupId.toString());
  let userEntity = User.load(event.params.memberID.toString());
  if (groupEntity === null || userEntity === null) {
    return;
  }
  groupEntity.members = groupEntity.members!.concat([
    event.params.memberID.toString()
  ]);

  var newMembers: string[] = [];
  for (let i = 0; i < groupEntity.members!.length; i++) {
    if (parseInt(groupEntity.members![i]) !== parseInt(userEntity.id)) {
      newMembers = newMembers.concat([groupEntity.members![i]]);
    }
  }
  groupEntity.members = newMembers;

  var newGroups: string[] = [];
  for (let i = 0; i < userEntity.groups!.length; i++) {
    if (parseInt(userEntity.groups![i]) !== parseInt(groupEntity.id)) {
      newGroups = newGroups.concat([userEntity.groups![i]]);
    }
  }
  userEntity.groups = newGroups;

  userEntity.save();
  groupEntity.save();
}

export function handleCreateGroup(event: CreateGroupEvent): void {
  let userEntity = User.load(event.params.userID.toString());
  let groupEntity = newGroup(
    event.params.userID.toString(),
    event.params.groupID.toString(),
    event.params.name,
    event.params.about
  );
  if (userEntity === null) {
    return;
  }

  userEntity.save();
  groupEntity.save();
}

export function handleAddGroupMember(event: AddGroupMemberEvent): void {
  let groupEntity = Group.load(event.params.groupId.toString());
  if (groupEntity === null) {
    return;
  }
  groupEntity.members = groupEntity.members!.concat([
    event.params.memberID.toString()
  ]);
  groupEntity.save();
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

export function handleUpdateGroupName(event: UpdateGroupNameEvent): void {
  let entity = Group.load(event.params.groupId.toString());

  if (entity === null) {
    return;
  }

  entity.name = event.params.name;
  entity.save();
}

function newGroup(
  id: string,
  name: string,
  author: string,
  about: string
): Group {
  let entity = new Group(id);
  entity.name = name;
  entity.author = author;
  entity.about = about;
  entity.deleted = false;
  entity.admins = [author];
  entity.members = [];
  entity.pendingMembers = [];

  return entity;
}
