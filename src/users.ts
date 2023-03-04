import {
  Follow as FollowEvent,
  SetBio as SetBioEvent,
  SetDateOfBirth as SetDateOfBirthEvent,
  SetDiscord as SetDiscordEvent,
  SetEmail as SetEmailEvent,
  SetEmailVerifiedData as SetEmailVerifiedDataEvent,
  SetFingerScan as SetFingerScanEvent,
  SetFirstName as SetFirstNameEvent,
  SetGovID as SetGovIDEvent,
  SetInstagram as SetInstagramEvent,
  SetLastName as SetLastNameEvent,
  SetMiddleName as SetMiddleNameEvent,
  SetPictureNFT as SetPictureNFTEvent,
  SetPictureUpload as SetPictureUploadEvent,
  SetTelephone as SetTelephoneEvent,
  SetTelephoneVerifiedData as SetTelephoneVerifiedDataEvent,
  SetTiktok as SetTiktokEvent,
  SetTwitter as SetTwitterEvent,
  SetUsername as SetUsernameEvent,
  SignupBasic as SignupBasicEvent,
  SignupProfileInfo as SignupProfileInfoEvent,
  UnFollow as UnFollowEvent,
  SignupTags as SignupTagsEvent,
  SetBackgroundColor as SetBackgroundColorEvent,
  SetTags as SetTagsEvent,
  SetPronoun as SetPronounEvent
} from "../generated/users/users";
import { User, Post } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import { log } from "@graphprotocol/graph-ts";

export function handleUnFollow(event: UnFollowEvent): void {
  let follower = User.load(event.params.follower.toString());
  let followed = User.load(event.params.followed.toString());
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
    if (parseInt(follower.followedUsers![i]) !== parseInt(followed.id)) {
      newFollowings = newFollowings.concat([follower.followedUsers![i]]);
    }
  }
  follower.followedUsers = newFollowings;

  if (follower.followedUsersCount === 0 || followed.followingUsersCount === 0)
    return;

  follower.followedUsersCount -= 1;
  followed.followingUsersCount -= 1;
  follower.save();
  followed.save();
}

export function handleFollow(event: FollowEvent): void {
  let follower = User.load(event.params.follower.toString());
  let followed = User.load(event.params.followed.toString());

  if (follower === null || followed === null) {
    return;
  }

  // followed.followers.push(event.params.follower.toString());
  followed.followers = followed.followers!.concat([
    event.params.follower.toString()
  ]);

  follower.followedUsers = follower.followedUsers!.concat([
    event.params.followed.toString()
  ]);

  // follower.followedUsers.push(event.params.followed.toString());

  follower.followedUsersCount += 1;
  followed.followingUsersCount += 1;

  follower.save();
  followed.save();
}

export function handleSetPronoun(event: SetPronounEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) {
    return;
  }

  if (event.params.pronoun == 1) {
    entity.pronoun = "I";
  } else if (event.params.pronoun == 2) {
    entity.pronoun = "YOU";
  } else if (event.params.pronoun == 3) {
    entity.pronoun = "SHE";
  } else if (event.params.pronoun == 4) {
    entity.pronoun = "HE";
  } else if (event.params.pronoun == 5) {
    entity.pronoun = "IT";
  } else if (event.params.pronoun == 6) {
    entity.pronoun = "WE";
  } else if (event.params.pronoun == 7) {
    entity.pronoun = "THEY";
  } else if (event.params.pronoun == 0) {
    entity.pronoun = null;
  }

  entity.save();
}

export function handleSetFingerScan(event: SetFingerScanEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) {
    return;
  }
  entity.fingerScan = event.params.fingerScan;

  entity.save();
}

export function handleSetGovID(event: SetGovIDEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) {
    return;
  }
  entity.govtID = event.params.govID;

  entity.save();
}

export function handleSetTelephone(event: SetTelephoneEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) {
    return;
  }
  entity.telephone = event.params.telephone;

  entity.save();
}

export function handleSetEmailVerifiedData(
  event: SetEmailVerifiedDataEvent
): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) {
    return;
  }
  entity.emailVerifiedData = event.params.data;
  entity.save();
}

export function handleSetTelephoneVerifiedData(
  event: SetTelephoneVerifiedDataEvent
): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) {
    return;
  }
  entity.telephoneVerifiedData = event.params.data;
  entity.save();
}

export function handleSetPictureUpload(event: SetPictureUploadEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) {
    return;
  }
  entity.profilePicCid = event.params.url;

  entity.save();
}

export function handleSetPictureNFT(event: SetPictureNFTEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) {
    return;
  }
  entity.nftAddress = event.params.nftAddress.toString();
  entity.ownedID = event.params.id;

  entity.save();
}

export function handleSetBio(event: SetBioEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) {
    return;
  }
  entity.bio = event.params.bio;

  entity.save();
}

export function handleSetTags(event: SetTagsEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) {
    return;
  }
  entity.tags = event.params.tags;
  entity.save();
}

export function handleSetEmail(event: SetEmailEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) return;
  entity.email = event.params.email;

  entity.save();
}

export function handleSetLastName(event: SetLastNameEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) return;
  entity.lastName = event.params.lastName;

  entity.save();
}

export function handleSetTiktok(event: SetTiktokEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) return;
  entity.tiktok = event.params.tiktok;

  entity.save();
}

export function handleSetTwitter(event: SetTwitterEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) return;
  entity.twitter = event.params.twitter;

  entity.save();
}

export function handleSetInstagram(event: SetInstagramEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) return;
  entity.instagram = event.params.instagram;

  entity.save();
}

export function handleSetDiscord(event: SetDiscordEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) return;
  entity.discord = event.params.discord;

  entity.save();
}

export function handleSetDateOfBirth(event: SetDateOfBirthEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) return;
  entity.dateOfBirth = event.params.dateOfBirth;

  entity.save();
}

export function handleSetBackgroundColor(event: SetBackgroundColorEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) return;
  entity.backgroundColor = event.params.backgroundColor;

  entity.save();
}

export function handleSetMiddleName(event: SetMiddleNameEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) return;
  entity.middleName = event.params.middleName;

  entity.save();
}

export function handleSetFirstName(event: SetFirstNameEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) return;
  entity.firstName = event.params.firstName;

  entity.save();
}

export function handleSetUsername(event: SetUsernameEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) return;
  entity.userName = event.params.username;

  entity.save();
}

export function handleSignupTags(event: SignupTagsEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) {
    return;
  }
  entity.tags = event.params.tags;
  entity.save();
}

export function handleSignupBasic(event: SignupBasicEvent): void {
  let entity = newUser(event.params.userId.toString());
  entity.userId = event.params.userId;
  entity.userAddress = event.params._userAddress.toHexString();
  entity.firstName = event.params.names[0].toString();
  entity.middleName = event.params.names[1].toString();
  entity.lastName = event.params.names[2].toString();
  entity.userName = event.params.names[3].toString();
  entity.discord = event.params.socialInfo[0].toString();
  entity.instagram = event.params.socialInfo[1].toString();
  entity.twitter = event.params.socialInfo[2].toString();
  entity.tiktok = event.params.socialInfo[3].toString();
  entity.email = event.params.userContact[0].toString();
  entity.telephone = event.params.userContact[1].toString();
  entity.bannedGroupsCount = 0;
  entity.followedGroupsCount = 0;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.numberOfMintedPosts = 0;

  entity.save();
}

export function handleSignupProfileInfo(event: SignupProfileInfoEvent): void {
  let entity = User.load(event.params.userId.toString());
  if (entity === null) {
    return;
  }
  entity.userId = event.params.userId;
  if (event.params.pronoun == 1) {
    entity.pronoun = "I";
  } else if (event.params.pronoun == 2) {
    entity.pronoun = "YOU";
  } else if (event.params.pronoun == 3) {
    entity.pronoun = "SHE";
  } else if (event.params.pronoun == 4) {
    entity.pronoun = "HE";
  } else if (event.params.pronoun == 5) {
    entity.pronoun = "IT";
  } else if (event.params.pronoun == 6) {
    entity.pronoun = "WE";
  } else if (event.params.pronoun == 7) {
    entity.pronoun = "THEY";
  }
  entity.followedUsersCount = 0;
  entity.followingUsersCount = 0;

  entity.dateOfBirth = event.params.dateOfBirth;
  entity.backgroundColor = event.params.profile[0];
  entity.profilePicCid = event.params.profile[1];
  entity.bio = event.params.bio;
  entity.nftAddress = event.params.nftAddress.toString();
  entity.ownedID = event.params.ownedID;
  entity.govtID = event.params.verificationData[0];
  entity.fingerScan = event.params.verificationData[1];

  entity.followedUsers = [];
  entity.followers = [];
  entity.posts = [];
  entity.followedGroups = [];

  entity.save();
}

function newUser(id: string): User {
  let entity = new User(id);

  return entity;
}
