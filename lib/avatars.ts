export const AVATAR_NAMES = [
  "Fox", "Cat", "Puppy", "Bear", "Panda",
  "Bunny", "Frog", "Owl", "Penguin", "Lion",
  "Monkey", "Koala", "Piglet", "Alien", "Robot",
  "Ghost", "Dino", "Octopus", "Monster", "Unicorn",
] as const;

export const AVATAR_COUNT = AVATAR_NAMES.length; // 20

/** Background colour behind each character. */
export const AVATAR_BG = [
  "#FDE68A", "#BAE6FD", "#FBCFE8", "#BBF7D0", "#C7D2FE",
  "#FECACA", "#FEF08A", "#DDD6FE", "#A5F3FC", "#FED7AA",
  "#FDE047", "#99F6E4", "#BFDBFE", "#5B21B6", "#FDBA74",
  "#6366F1", "#FCA5A5", "#7DD3FC", "#FEF3C7", "#A7F3D0",
] as const;
