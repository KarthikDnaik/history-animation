// Named cue times (seconds) on narration words for the Headless Mike short.
import { at, lineStart, lineEnd } from "./story";
export const C = {
  farmer: at(0, "farmer"), dinner: at(0, "dinner"),
  l1: lineStart(1), swing: at(1, "swing"), axe1: at(1, "axe"), done: at(1, "done"),
  l2: lineStart(2), got: at(2, "got"), walked: at(2, "walked"),
  l3: lineStart(3), vibes: at(3, "vibes"),
  l4: lineStart(4), box: at(4, "box"), morning: at(4, "morning"), alive: at(4, "alive"),
  l5: lineStart(5), name: at(5, "name"), mike5: at(5, "mike"),
  l6: lineStart(6), axe6: at(6, "axe"), brain: at(6, "brain"), clot: at(6, "clot"),
  l7: lineStart(7), peck: at(7, "peck"), preen: at(7, "preen"), crow: at(7, "crow"),
  l8: lineStart(8), gurgle: at(8, "gurgle"),
  l9: lineStart(9), eyedropper: at(9, "eyedropper"), straight: at(9, "straight"),
  l10: lineStart(10), promoter: at(10, "promoter"), dollar: at(10, "dollar"),
  l11: lineStart(11), tour: at(11, "tour"), cents: at(11, "cents"),
  l12: lineStart(12), life: at(12, "life"), made: at(12, "made"), month: at(12, "month"),
  l13: lineStart(13), baler: at(13, "baler"), tractors: at(13, "tractors"), pickup: at(13, "pickup"), paid: at(13, "paid"),
  l14: lineStart(14), phoenix: at(14, "phoenix"), choking: at(14, "choking"),
  l15: lineStart(15), syringe: at(15, "syringe"), left: at(15, "left"),
  l16: lineStart(16), gone: at(16, "gone"),
  l17: lineStart(17), town: at(17, "town"), festival: at(17, "festival"),
  l18: lineStart(18), proof: at(18, "proof"), still: at(18, "still"), ahead: at(18, "ahead"), end18: lineEnd(18),
};
