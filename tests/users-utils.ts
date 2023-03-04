import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  AddTag,
  Follow,
  SetBio,
  SetDateOfBirth,
  SetDiscord,
  SetEmail,
  SetEmailVerifiedData,
  SetFingerScan,
  SetFirstName,
  SetGovID,
  SetInstagram,
  SetLastName,
  SetMiddleName,
  SetPictureNFT,
  SetPictureUpload,
  SetTelephone,
  SetTelephoneVerifiedData,
  SetTiktok,
  SetTwitter,
  SetUsername,
  SignupBasic,
  SignupProfileInfo,
  UnFollow
} from "../generated/users/users"

export function createAddTagEvent(userId: BigInt, tag: string): AddTag {
  let addTagEvent = changetype<AddTag>(newMockEvent())

  addTagEvent.parameters = new Array()

  addTagEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  addTagEvent.parameters.push(
    new ethereum.EventParam("tag", ethereum.Value.fromString(tag))
  )

  return addTagEvent
}

export function createFollowEvent(
  follower: Address,
  followed: Address
): Follow {
  let followEvent = changetype<Follow>(newMockEvent())

  followEvent.parameters = new Array()

  followEvent.parameters.push(
    new ethereum.EventParam("follower", ethereum.Value.fromAddress(follower))
  )
  followEvent.parameters.push(
    new ethereum.EventParam("followed", ethereum.Value.fromAddress(followed))
  )

  return followEvent
}

export function createSetBioEvent(userId: BigInt, bio: string): SetBio {
  let setBioEvent = changetype<SetBio>(newMockEvent())

  setBioEvent.parameters = new Array()

  setBioEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setBioEvent.parameters.push(
    new ethereum.EventParam("bio", ethereum.Value.fromString(bio))
  )

  return setBioEvent
}

export function createSetDateOfBirthEvent(
  userId: BigInt,
  dateOfBirth: string
): SetDateOfBirth {
  let setDateOfBirthEvent = changetype<SetDateOfBirth>(newMockEvent())

  setDateOfBirthEvent.parameters = new Array()

  setDateOfBirthEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setDateOfBirthEvent.parameters.push(
    new ethereum.EventParam(
      "dateOfBirth",
      ethereum.Value.fromString(dateOfBirth)
    )
  )

  return setDateOfBirthEvent
}

export function createSetDiscordEvent(
  userId: BigInt,
  discord: string
): SetDiscord {
  let setDiscordEvent = changetype<SetDiscord>(newMockEvent())

  setDiscordEvent.parameters = new Array()

  setDiscordEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setDiscordEvent.parameters.push(
    new ethereum.EventParam("discord", ethereum.Value.fromString(discord))
  )

  return setDiscordEvent
}

export function createSetEmailEvent(userId: BigInt, email: string): SetEmail {
  let setEmailEvent = changetype<SetEmail>(newMockEvent())

  setEmailEvent.parameters = new Array()

  setEmailEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setEmailEvent.parameters.push(
    new ethereum.EventParam("email", ethereum.Value.fromString(email))
  )

  return setEmailEvent
}

export function createSetEmailVerifiedDataEvent(
  userId: BigInt,
  data: string
): SetEmailVerifiedData {
  let setEmailVerifiedDataEvent = changetype<SetEmailVerifiedData>(
    newMockEvent()
  )

  setEmailVerifiedDataEvent.parameters = new Array()

  setEmailVerifiedDataEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setEmailVerifiedDataEvent.parameters.push(
    new ethereum.EventParam("data", ethereum.Value.fromString(data))
  )

  return setEmailVerifiedDataEvent
}

export function createSetFingerScanEvent(
  userId: BigInt,
  fingerScan: string
): SetFingerScan {
  let setFingerScanEvent = changetype<SetFingerScan>(newMockEvent())

  setFingerScanEvent.parameters = new Array()

  setFingerScanEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setFingerScanEvent.parameters.push(
    new ethereum.EventParam("fingerScan", ethereum.Value.fromString(fingerScan))
  )

  return setFingerScanEvent
}

export function createSetFirstNameEvent(
  userId: BigInt,
  firstName: string
): SetFirstName {
  let setFirstNameEvent = changetype<SetFirstName>(newMockEvent())

  setFirstNameEvent.parameters = new Array()

  setFirstNameEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setFirstNameEvent.parameters.push(
    new ethereum.EventParam("firstName", ethereum.Value.fromString(firstName))
  )

  return setFirstNameEvent
}

export function createSetGovIDEvent(userId: BigInt, govID: string): SetGovID {
  let setGovIdEvent = changetype<SetGovID>(newMockEvent())

  setGovIdEvent.parameters = new Array()

  setGovIdEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setGovIdEvent.parameters.push(
    new ethereum.EventParam("govID", ethereum.Value.fromString(govID))
  )

  return setGovIdEvent
}

export function createSetInstagramEvent(
  userId: BigInt,
  instagram: string
): SetInstagram {
  let setInstagramEvent = changetype<SetInstagram>(newMockEvent())

  setInstagramEvent.parameters = new Array()

  setInstagramEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setInstagramEvent.parameters.push(
    new ethereum.EventParam("instagram", ethereum.Value.fromString(instagram))
  )

  return setInstagramEvent
}

export function createSetLastNameEvent(
  userId: BigInt,
  lastName: string
): SetLastName {
  let setLastNameEvent = changetype<SetLastName>(newMockEvent())

  setLastNameEvent.parameters = new Array()

  setLastNameEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setLastNameEvent.parameters.push(
    new ethereum.EventParam("lastName", ethereum.Value.fromString(lastName))
  )

  return setLastNameEvent
}

export function createSetMiddleNameEvent(
  userId: BigInt,
  middleName: string
): SetMiddleName {
  let setMiddleNameEvent = changetype<SetMiddleName>(newMockEvent())

  setMiddleNameEvent.parameters = new Array()

  setMiddleNameEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setMiddleNameEvent.parameters.push(
    new ethereum.EventParam("middleName", ethereum.Value.fromString(middleName))
  )

  return setMiddleNameEvent
}

export function createSetPictureNFTEvent(
  userId: BigInt,
  nftAddress: Address,
  id: BigInt
): SetPictureNFT {
  let setPictureNftEvent = changetype<SetPictureNFT>(newMockEvent())

  setPictureNftEvent.parameters = new Array()

  setPictureNftEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setPictureNftEvent.parameters.push(
    new ethereum.EventParam(
      "nftAddress",
      ethereum.Value.fromAddress(nftAddress)
    )
  )
  setPictureNftEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )

  return setPictureNftEvent
}

export function createSetPictureUploadEvent(
  userId: BigInt,
  url: string
): SetPictureUpload {
  let setPictureUploadEvent = changetype<SetPictureUpload>(newMockEvent())

  setPictureUploadEvent.parameters = new Array()

  setPictureUploadEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setPictureUploadEvent.parameters.push(
    new ethereum.EventParam("url", ethereum.Value.fromString(url))
  )

  return setPictureUploadEvent
}

export function createSetTelephoneEvent(
  userId: BigInt,
  telephone: string
): SetTelephone {
  let setTelephoneEvent = changetype<SetTelephone>(newMockEvent())

  setTelephoneEvent.parameters = new Array()

  setTelephoneEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setTelephoneEvent.parameters.push(
    new ethereum.EventParam("telephone", ethereum.Value.fromString(telephone))
  )

  return setTelephoneEvent
}

export function createSetTelephoneVerifiedDataEvent(
  userId: BigInt,
  data: string
): SetTelephoneVerifiedData {
  let setTelephoneVerifiedDataEvent = changetype<SetTelephoneVerifiedData>(
    newMockEvent()
  )

  setTelephoneVerifiedDataEvent.parameters = new Array()

  setTelephoneVerifiedDataEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setTelephoneVerifiedDataEvent.parameters.push(
    new ethereum.EventParam("data", ethereum.Value.fromString(data))
  )

  return setTelephoneVerifiedDataEvent
}

export function createSetTiktokEvent(
  userId: BigInt,
  tiktok: string
): SetTiktok {
  let setTiktokEvent = changetype<SetTiktok>(newMockEvent())

  setTiktokEvent.parameters = new Array()

  setTiktokEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setTiktokEvent.parameters.push(
    new ethereum.EventParam("tiktok", ethereum.Value.fromString(tiktok))
  )

  return setTiktokEvent
}

export function createSetTwitterEvent(
  userId: BigInt,
  twitter: string
): SetTwitter {
  let setTwitterEvent = changetype<SetTwitter>(newMockEvent())

  setTwitterEvent.parameters = new Array()

  setTwitterEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setTwitterEvent.parameters.push(
    new ethereum.EventParam("twitter", ethereum.Value.fromString(twitter))
  )

  return setTwitterEvent
}

export function createSetUsernameEvent(
  userId: BigInt,
  username: string
): SetUsername {
  let setUsernameEvent = changetype<SetUsername>(newMockEvent())

  setUsernameEvent.parameters = new Array()

  setUsernameEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  setUsernameEvent.parameters.push(
    new ethereum.EventParam("username", ethereum.Value.fromString(username))
  )

  return setUsernameEvent
}

export function createSignupBasicEvent(
  userId: BigInt,
  _userAddress: Address,
  names: Array<string>,
  socialInfo: Array<string>,
  userContact: Array<string>
): SignupBasic {
  let signupBasicEvent = changetype<SignupBasic>(newMockEvent())

  signupBasicEvent.parameters = new Array()

  signupBasicEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  signupBasicEvent.parameters.push(
    new ethereum.EventParam(
      "_userAddress",
      ethereum.Value.fromAddress(_userAddress)
    )
  )
  signupBasicEvent.parameters.push(
    new ethereum.EventParam("names", ethereum.Value.fromStringArray(names))
  )
  signupBasicEvent.parameters.push(
    new ethereum.EventParam(
      "socialInfo",
      ethereum.Value.fromStringArray(socialInfo)
    )
  )
  signupBasicEvent.parameters.push(
    new ethereum.EventParam(
      "userContact",
      ethereum.Value.fromStringArray(userContact)
    )
  )

  return signupBasicEvent
}

export function createSignupProfileInfoEvent(
  userId: BigInt,
  pronoun: i32,
  dateOfBirth: string,
  profile: Array<string>,
  bio: string,
  nftAddress: Address,
  ownedID: BigInt,
  verificationData: Array<string>
): SignupProfileInfo {
  let signupProfileInfoEvent = changetype<SignupProfileInfo>(newMockEvent())

  signupProfileInfoEvent.parameters = new Array()

  signupProfileInfoEvent.parameters.push(
    new ethereum.EventParam("userId", ethereum.Value.fromUnsignedBigInt(userId))
  )
  signupProfileInfoEvent.parameters.push(
    new ethereum.EventParam(
      "pronoun",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(pronoun))
    )
  )
  signupProfileInfoEvent.parameters.push(
    new ethereum.EventParam(
      "dateOfBirth",
      ethereum.Value.fromString(dateOfBirth)
    )
  )
  signupProfileInfoEvent.parameters.push(
    new ethereum.EventParam("profile", ethereum.Value.fromStringArray(profile))
  )
  signupProfileInfoEvent.parameters.push(
    new ethereum.EventParam("bio", ethereum.Value.fromString(bio))
  )
  signupProfileInfoEvent.parameters.push(
    new ethereum.EventParam(
      "nftAddress",
      ethereum.Value.fromAddress(nftAddress)
    )
  )
  signupProfileInfoEvent.parameters.push(
    new ethereum.EventParam(
      "ownedID",
      ethereum.Value.fromUnsignedBigInt(ownedID)
    )
  )
  signupProfileInfoEvent.parameters.push(
    new ethereum.EventParam(
      "verificationData",
      ethereum.Value.fromStringArray(verificationData)
    )
  )

  return signupProfileInfoEvent
}

export function createUnFollowEvent(
  follower: Address,
  followed: Address
): UnFollow {
  let unFollowEvent = changetype<UnFollow>(newMockEvent())

  unFollowEvent.parameters = new Array()

  unFollowEvent.parameters.push(
    new ethereum.EventParam("follower", ethereum.Value.fromAddress(follower))
  )
  unFollowEvent.parameters.push(
    new ethereum.EventParam("followed", ethereum.Value.fromAddress(followed))
  )

  return unFollowEvent
}
