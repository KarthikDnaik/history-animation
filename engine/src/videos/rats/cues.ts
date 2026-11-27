// Named cue times (seconds) on narration words for the Hanoi rat-hunt short.
import { at, lineStart, lineEnd } from "./story";
export const C = {
  paid: at(0, "paid"), rat0: at(0, "rat"), killed0: at(0, "killed"), terribly: at(0, "terribly"),
  l1: lineStart(1), sewer1: at(1, "sewer"), under: at(1, "under"), town: at(1, "town"),
  l2: lineStart(2), food: at(2, "food"), perfect: at(2, "perfect"),
  l3: lineStart(3), plague3: at(3, "plague"),
  l4: lineStart(4), catchers: at(4, "catchers"), down: at(4, "down"),
  l5: lineStart(5), june: at(5, "june"), twenty: at(5, "twenty"),
  l6: lineStart(6), coming: at(6, "coming"),
  l7: lineStart(7), smarter: at(7, "smarter"), anyone: at(7, "anyone"), cent: at(7, "cent"),
  l8: lineStart(8), piles: at(8, "piles"), office: at(8, "office"), so8: at(8, "so"), tail8: at(8, "tail"),
  l9: lineStart(9), pouring: at(9, "pouring"),
  l10: lineStart(10), seeing: at(10, "seeing"), around: at(10, "around"), no10: at(10, "no"),
  l11: lineStart(11), catching: at(11, "catching"), cutting: at(11, "cutting"), letting: at(11, "letting"),
  l12: lineStart(12), babies: at(12, "and"), babies2: at(12, "babies", false),
  l13: lineStart(13), found: at(13, "found"), better: at(13, "better"),
  l14: lineStart(14),
  l15: lineStart(15), cash: at(15, "cash"),
  l16: lineStart(16), cancelled: at(16, "cancelled"), hanoi16: at(16, "hanoi"), more16: at(16, "more"),
  l17: lineStart(17), plague17: at(17, "plague"),
  l18: lineStart(18), cobra: at(18, "cobra"), effect: at(18, "effect"),
  l19: lineStart(19), fix: at(19, "fix"), more19: at(19, "more"), end19: lineEnd(19),
};
