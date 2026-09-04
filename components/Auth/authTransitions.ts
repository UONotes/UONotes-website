// Single source of truth for every animation timing value used across
// the auth pages. Change a duration here, it updates everywhere.

export const PAGE_TRANSITION = {
  duration: 0.25,
  ease: "easeOut" as const,
};

export const STEP_TRANSITION = {
  duration: 0.2,
  ease: "easeOut" as const,
};

export const CARD_RESIZE_TRANSITION = {
  duration: 0.28,
  ease: "easeInOut" as const,
};

export const SUCCESS_TRANSITION = {
  type: "spring" as const,
  stiffness: 300,
  damping: 24,
};

// Delay after a successful action before redirecting the user.
export const REDIRECT_DELAY_MS = 700;