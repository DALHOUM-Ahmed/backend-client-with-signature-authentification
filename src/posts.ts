import { BigInt } from "@graphprotocol/graph-ts";
import {
  CreatePost as CreatePostEvent,
  UpdateBody as UpdateBodyEvent,
  UpdateTitle as UpdateTitleEvent,
  UpdateTags as UpdateTagsEvent,
  AddComment as AddCommentEvent,
  AddCommentLike as AddCommentLikeEvent,
  AddPostLike as AddPostLikeEvent,
  AddReply as AddReplyEvent,
  AddReplyLike as AddReplyLikeEvent,
  DeleteComment as DeleteCommentEvent,
  DeleteReply as DeleteReplyEvent,
  EditComment as EditCommentEvent,
  EditReply as EditReplyEvent,
  RemoveCommentLike as RemoveCommentLikeEvent,
  RemovePostLike as RemovePostLikeEvent,
  RemoveReplyLike as RemoveReplyLikeEvent,
  UpdateTaggedGroups as UpdateTaggedGroupsEvent,
  UpdateTaggedPeople as UpdateTaggedPeopleEvent,
  UpdateType as UpdateTypeEvent,
  UpdateCID as UpdateCIDEvent,
  RemoveVote as RemoveVoteEvent,
  AddVote as AddVoteEvent,
  CreatePoll as CreatePollEvent,
  MintedNFT as MintedNFTEvent,
  EditBackgroundColor as EditBackgroundColorEvent,
  EditCaptionType as EditCaptionTypeEvent,
  HidePost as HidePostEvent
} from "../generated/posts/posts";
import {
  User,
  Post,
  Group,
  Comment,
  Reply,
  Poll,
  Vote
} from "../generated/schema";
import { log } from "@graphprotocol/graph-ts";

export function handleCreatePost(event: CreatePostEvent): void {
  let entity = new Post(event.params.postID.toString());
  let user = User.load(event.params._authorID.toString());
  let group = Group.load(event.params.groupID.toString());
  entity.authorID = event.params._authorID.toString();
  if (
    user !== null &&
    (group !== null || event.params.groupID == new BigInt(0))
  ) {
    if (user.userAddress === "") return;
    entity.author = event.params._authorID.toString();
    entity.title = event.params.title;
    entity.body = event.params.body;
    entity.tags = event.params.tags;
    entity.groupID = event.params.groupID;
    entity.cid = event.params.CIDAsset;

    entity.createdAt = event.block.timestamp;
    entity.hiddenByAdmin = false;
    entity.hiddenByAuthor = false;
    entity.editedAt = new BigInt(0);
    entity.likes = 0;
    entity.likers = [];
    entity.comments = [];
    entity.integerID = event.params.postID;
    if (user.firstCreatedPostID === null) {
      user.firstCreatedPostID = event.params.postID;
    }
    user.lastCreatedPostID = event.params.postID;
    // entity.taggedPeople = event.params.taggedElements.people.map(e =>
    //   e.toString()
    // );
    // entity.taggedGroups = event.params.taggedElements.groups.map(e =>
    //   e.toString()
    // );
    entity.taggedPeople = [];
    log.info("number of event taggedPeople", [
      event.params.taggedElements.people.length.toString()
    ]);
    log.info("number of event taggedGroups", [
      event.params.taggedElements.groups.length.toString()
    ]);
    for (let i = 0; i < event.params.taggedElements.people.length; i++) {
      entity.taggedPeople = entity.taggedPeople!.concat([
        event.params.taggedElements.people[i].toString()
      ]);
    }
    entity.taggedGroups = [];
    for (let i = 0; i < event.params.taggedElements.groups.length; i++) {
      entity.taggedGroups = entity.taggedGroups!.concat([
        event.params.taggedElements.groups[i].toString()
      ]);
    }
    entity.numberOfComments = 0;

    entity.group = "0";

    // if (event.params._type ==) user.posts!.push(event.params.postID.toString());

    if (event.params._type == 0) {
      entity.type = "Video";
    }
    if (event.params._type == 1) {
      entity.type = "Photo";
    }
    if (event.params._type == 2) {
      entity.type = "Caption";
    }

    if (group !== null) {
      group.posts = group.posts!.concat([event.params.postID.toString()]);
      group.save();
    }

    user.posts = user.posts!.concat([event.params.postID.toString()]);

    entity.isNFT = false;
    user.save();
    entity.save();
  }
}

export function handleEditBackgroundColor(
  event: EditBackgroundColorEvent
): void {
  let entity = Post.load(event.params.postID.toString());
  if (entity === null) return;
  entity.backgroundColor = event.params.backgroundColor;
  entity.save();
}

export function handleEditCaptionType(event: EditCaptionTypeEvent): void {
  let entity = Post.load(event.params.postID.toString());
  if (entity === null) return;
  if (event.params.captionType == 0) {
    entity.captionType = "NOT_A_CAPTION";
  } else if (event.params.captionType == 1) {
    entity.captionType = "ANNOUNCEMENT";
  } else if (event.params.captionType == 2) {
    entity.captionType = "OPINION";
  } else if (event.params.captionType == 3) {
    entity.captionType = "CHALLENGE";
  } else if (event.params.captionType == 4) {
    entity.captionType = "TRENDING";
  } else if (event.params.captionType == 5) {
    entity.captionType = "POLL";
  } else if (event.params.captionType == 6) {
    entity.captionType = "FACT";
  } else {
    return;
  }

  entity.save();
}

export function handleCreatePoll(event: CreatePollEvent): void {
  let entity = new Poll(event.params.postID.toString());
  let postEntity = Post.load(event.params.postID.toString());
  if (postEntity === null) return;
  entity.options = event.params.options;
  entity.singleOption = event.params.singleOption;
  entity.integerID = event.params.postID;
  entity.votes = [];
  postEntity.poll = event.params.postID.toString();
  postEntity.save();
  entity.save();
}

export function handleMintedNFT(event: MintedNFTEvent): void {
  let postEntity = Post.load(event.params.postID.toString());
  if (postEntity) {
    let userEntity = User.load(postEntity.authorID);
    if (postEntity && userEntity) {
      userEntity.profilePostsNFTaddress = event.params.nftAddress.toHexString();
      userEntity.numberOfMintedPosts++;

      postEntity.nftID = userEntity.numberOfMintedPosts - 1;
      postEntity.isNFT = true;

      userEntity.save();
      postEntity.save();
    }
  }
}

export function handleAddVote(event: AddVoteEvent): void {
  let postEntity = Poll.load(event.params.postID.toString());
  if (postEntity === null) return;
  if (postEntity.firstCreatedVoteID === null) {
    postEntity.firstCreatedVoteID = event.params.postID;
  }
  postEntity.lastCreatedVoteID = event.params.postID;
  let voteEntity = new Vote(event.params.voteID.toString());
  voteEntity.removed = false;
  voteEntity.user = event.params.userID.toString();
  voteEntity.integerID = event.params.voteID;
  voteEntity.chosenOption = event.params.option;
  postEntity.votes = postEntity.votes!.concat([event.params.voteID.toString()]);
  postEntity.save();
  voteEntity.save();
}

// export function handleAddVote(event: AddVoteEvent): void {
//   let postEntity = Poll.load(event.params.postID.toString());
//   if (postEntity === null) return;
//   if (postEntity.firstCreatedVoteID === null) {
//     postEntity.firstCreatedVoteID = event.params.postID;
//   }
//   postEntity.lastCreatedVoteID = event.params.postID;
//   let voteEntity = new Vote(event.params.voteID.toString());
//   voteEntity.removed = false;
//   voteEntity.user = event.params.userID.toString();
//   voteEntity.integerID = event.params.voteID;
//   voteEntity.chosenOption = event.params.option;
//   postEntity.votes = postEntity.votes!.concat([event.params.voteID.toString()]);
//   postEntity.save();
//   voteEntity.save();
// }

export function handleRemoveVote(event: RemoveVoteEvent): void {
  let postEntity = Poll.load(event.params.postID.toString());
  if (postEntity === null) return;
  let voteEntity = new Vote(event.params.voteID.toString());
  voteEntity.removed = true;
  voteEntity.user = event.params.userID.toString();
  voteEntity.chosenOption = event.params.option;
  postEntity.votes = postEntity.votes!.concat([event.params.voteID.toString()]);
  postEntity.save();
  voteEntity.save();
}

export function handleUpdateBody(event: UpdateBodyEvent): void {
  let entity = Post.load(event.params.postID.toString());
  if (entity) {
    entity.body = event.params.body;
    entity.editedAt = event.block.timestamp;
    entity.save();
  }
}

export function handleUpdateCID(event: UpdateCIDEvent): void {
  let entity = Post.load(event.params.postID.toString());
  if (entity) {
    entity.cid = event.params.cid;
    entity.editedAt = event.block.timestamp;
    entity.save();
  }
}

export function handleUpdateType(event: UpdateTypeEvent): void {
  let entity = Post.load(event.params.postID.toString());
  if (entity) {
    if (event.params.postType == 0) {
      entity.type = "Video";
    }
    if (event.params.postType == 1) {
      entity.type = "Photo";
    }
    if (event.params.postType == 2) {
      entity.type = "Caption";
    }
    entity.editedAt = event.block.timestamp;
    entity.save();
  }
}

export function handleUpdateTaggedPeople(event: UpdateTaggedPeopleEvent): void {
  let entity = Post.load(event.params.postID.toString());
  if (entity) {
    // entity.taggedPeople = [];
    // for (let i = 0; i < event.params.taggedPeople.length; i++) {
    //   entity.taggedPeople!.push(event.params.taggedPeople[i].toString());
    // }
    // // entity.taggedPeople = event.params.taggedPeople.map(e => e.toString());
    // entity.editedAt = event.block.timestamp;
    entity.taggedPeople = [];
    for (let i = 0; i < event.params.taggedPeople.length; i++) {
      entity.taggedPeople = entity.taggedPeople!.concat([
        event.params.taggedPeople[i].toString()
      ]);
    }
    entity.save();
  }
}

export function handleUpdateTaggedGroups(event: UpdateTaggedGroupsEvent): void {
  let entity = Post.load(event.params.postID.toString());
  if (entity) {
    // entity.taggedGroups = [];
    // for (let i = 0; i < event.params.taggedGroups.length; i++) {
    //   entity.taggedGroups!.push(event.params.taggedGroups[i].toString());
    // }
    // entity.editedAt = event.block.timestamp;
    // entity.taggedGroups = event.params.taggedGroups.map(e => e.toString());
    entity.taggedGroups = [];
    for (let i = 0; i < event.params.taggedGroups.length; i++) {
      entity.taggedGroups = entity.taggedGroups!.concat([
        event.params.taggedGroups[i].toString()
      ]);
    }
    entity.save();
  }
}

// export function handleUpdateType(event: UpdateTypeEvent): void {
//   let entity = Post.load(event.params.postID.toString());
//   if (entity) {
//     entity.type = event.params.taggedGroups.map(e => e.toString());
//     entity.editedAt = event.block.timestamp;
//     entity.save();
//   }
// }

export function handleEditComment(event: EditCommentEvent): void {
  let entity = Comment.load(event.params.commentID.toString());
  if (entity) {
    entity.body = event.params.newComment;
    entity.editedAt = event.block.timestamp;
    entity.save();
  }
}

export function handleEditReply(event: EditReplyEvent): void {
  let entity = Reply.load(event.params.replyID.toString());
  if (entity) {
    entity.body = event.params.newText;
    entity.editedAt = event.block.timestamp;
    entity.save();
  }
}

export function handleUpdateTitle(event: UpdateTitleEvent): void {
  let entity = Post.load(event.params.postID.toString());
  if (entity) {
    entity.title = event.params.title;
    entity.editedAt = event.block.timestamp;
    entity.save();
  }
}

export function handleUpdateTags(event: UpdateTagsEvent): void {
  let entity = Post.load(event.params.postID.toString());
  if (entity) {
    entity.tags = event.params.tags;
    entity.editedAt = event.block.timestamp;
    entity.save();
  }
}

export function handleAddComment(event: AddCommentEvent): void {
  let entity = new Comment(event.params.commentID.toString());
  entity.body = event.params.comment;
  entity.createdAt = event.block.timestamp;
  entity.likes = 0;
  entity.likers = [];
  entity.author = event.params._executorID.toString();
  entity.post = event.params.postID.toString();
  entity.integerID = event.params.commentID;
  // entity.taggedGroups = event.params.tags.groups.map(e => e.toString());
  entity.taggedGroups = [];
  for (let i = 0; i < event.params.tags.groups.length; i++) {
    entity.taggedGroups = entity.taggedGroups!.concat([
      event.params.tags.groups[i].toString()
    ]);
  }
  entity.replies = [];
  entity.taggedPeople = [];
  for (let i = 0; i < event.params.tags.people.length; i++) {
    entity.taggedPeople = entity.taggedPeople!.concat([
      event.params.tags.people[i].toString()
    ]);
  }

  let postEntity = Post.load(entity.post);
  if (!postEntity) {
    return;
  }
  if (postEntity.firstCreatedCommentID === null) {
    postEntity.firstCreatedCommentID = event.params.commentID;
  }
  postEntity.lastCreatedCommentID = event.params.commentID;

  postEntity.comments = postEntity.comments!.concat([
    event.params.commentID.toString()
  ]);
  postEntity.numberOfComments++;
  entity.numberOfReplies = 0;
  entity.save();
  postEntity.save();
}

export function handleAddReply(event: AddReplyEvent): void {
  let entity = new Reply(event.params.replyID.toString());
  entity.body = event.params.text;
  entity.createdAt = event.block.timestamp;
  entity.likes = 0;
  entity.likers = [];
  entity.comment = event.params.commentID.toString();
  entity.author = event.params._executorID.toString();
  entity.integerID = event.params.replyID;
  // entity.taggedPeople = event.params.tags.people.map(e => e.toString());
  entity.taggedPeople = [];
  for (let i = 0; i < event.params.tags.groups.length; i++) {
    entity.taggedPeople = entity.taggedPeople!.concat([
      event.params.tags.people[i].toString()
    ]);
  }
  entity.taggedGroups = [];
  for (let i = 0; i < event.params.tags.groups.length; i++) {
    entity.taggedGroups = entity.taggedGroups!.concat([
      event.params.tags.groups[i].toString()
    ]);
  }
  // entity.taggedGroups = event.params.tags.groups.map(e => e.toString());
  // entity.taggedUsers = event.params.tags[0].toString();
  entity.createdAt = event.block.timestamp;

  let commentEntity = Comment.load(event.params.commentID.toString());
  if (commentEntity === null) {
    return;
  }
  if (commentEntity.firstCreatedReplyID === null) {
    commentEntity.firstCreatedReplyID = event.params.replyID;
  }
  commentEntity.lastCreatedReplyID = event.params.replyID;

  commentEntity.replies = commentEntity.replies!.concat([
    event.params.replyID.toString()
  ]);
  commentEntity.numberOfReplies++;
  commentEntity.save();
  entity.save();
}

export function handleAddPostLike(event: AddPostLikeEvent): void {
  let entity = Post.load(event.params.postID.toString());
  if (entity === null) return;
  entity.likes++;
  // entity.likers!.push(event.params._executorID.toString()); !.concat([
  //   event.params.follower.toString()
  // ]);
  entity.likers = entity.likers!.concat([event.params._executorID.toString()]);
  entity.save();
}

export function handleAddCommentLike(event: AddCommentLikeEvent): void {
  let entity = Comment.load(event.params.commentID.toString());
  if (entity === null) return;
  entity.likes++;
  entity.likers = entity.likers!.concat([event.params._executorID.toString()]);
  entity.save();
}

export function handleAddReplyLike(event: AddReplyLikeEvent): void {
  let entity = Reply.load(event.params.replyID.toString());
  if (entity === null) return;
  entity.likes++;
  entity.likers = entity.likers!.concat([event.params._executorID.toString()]);
  entity.save();
}

export function handleRemovePostLike(event: RemovePostLikeEvent): void {
  let entity = Post.load(event.params.postID.toString());
  if (entity === null) return;

  entity.likes--;
  var newLikers: string[] = [];
  for (let i = 0; i < entity.likers!.length; i++) {
    if (
      parseInt(entity.likers![i]) !==
      parseInt(event.params._executorID.toString())
    ) {
      newLikers = newLikers.concat([entity.likers![i]]);
    }
  }
  entity.likers = newLikers;

  entity.save();
  // if (entity.likers) {
  //   const index = entity.likers!.indexOf(
  //     event.params._executorID.toString(),
  //     0
  //   );
  //   if (index > -1) {
  //     entity.likers! = entity.likers!.splice(index, 1);
  //     // entity.likers![index]! = "";
  //     entity.likes--;
  //     entity.likers!.push(event.params._executorID.toString());

  //   }
  // }
}

export function handleRemoveCommentLike(event: RemoveCommentLikeEvent): void {
  let entity = Comment.load(event.params.commentID.toString());
  if (entity === null) return;
  entity.likes--;
  var newLikers: string[] = [];
  for (let i = 0; i < entity.likers!.length; i++) {
    if (
      parseInt(entity.likers![i]) !==
      parseInt(event.params._executorID.toString())
    ) {
      newLikers = newLikers.concat([entity.likers![i]]);
    }
  }
  entity.likers = newLikers;

  entity.save();
}

export function handleRemoveReplyLike(event: RemoveReplyLikeEvent): void {
  let entity = Reply.load(event.params.replyID.toString());
  if (entity === null) return;
  entity.likes--;
  var newLikers: string[] = [];
  for (let i = 0; i < entity.likers!.length; i++) {
    if (
      parseInt(entity.likers![i]) !==
      parseInt(event.params._executorID.toString())
    ) {
      newLikers = newLikers.concat([entity.likers![i]]);
    }
  }
  entity.likers = newLikers;

  entity.save();
}

export function handleDeleteComment(event: DeleteCommentEvent): void {
  let entity = Comment.load(event.params.commentID.toString());

  if (entity == null) return;
  let postEntity = Post.load(entity.post);
  if (!postEntity) {
    return;
  }
  postEntity.numberOfComments--;
  entity.body = "";
  entity.post = "";
  entity.createdAt = new BigInt(0);
  entity.likes = 0;
  entity.likers = [];
  entity.taggedGroups = [];
  entity.taggedPeople = [];
  entity.author = "";
  postEntity.save();
  entity.save();
}

export function handleDeleteReply(event: DeleteReplyEvent): void {
  let entity = Reply.load(event.params.replyID.toString());

  if (entity == null) return;
  entity.body = "";
  entity.comment = "";
  entity.createdAt = new BigInt(0);
  entity.likes = 0;
  entity.likers = [];
  entity.taggedGroups = [];
  entity.taggedPeople = [];
  entity.author = "";
  entity.save();
}

export function handleHidePost(event: HidePostEvent): void {
  let entity = Post.load(event.params.postID.toString());
  if (entity !== null) {
    if (event.params.authorChoice) {
      entity.hiddenByAuthor = !entity.hiddenByAuthor;
    } else {
      entity.hiddenByAdmin = !entity.hiddenByAdmin;
    }
    entity.save();
  }
}
