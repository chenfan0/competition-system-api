export enum UserRole {
  student = 0,
  teacher = 1,
  admin = 2,
}

export enum CompetitionMode {
  singe = 0,
  team = 1,
}

export enum SignUpStatus {
  pending = 1,
  fulfilled = 0,
}

export enum CompetitionStatus {
  beforeSignUp = 0,
  signUping = 1,
  waitUpload = 2,
  uploading = 3,
  waitResult = 4,
  end = 5,
}

export enum AlreadyProcess {
  yes = 1,
  no = 0,
}

export enum UserDisable {
  yes = 1,
  no = 0,
}
