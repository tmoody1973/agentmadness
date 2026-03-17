export interface ScheduleEntry {
  scheduledTime: string;
  venue: string;
  tvChannel: string;
}

// Men's 2026 NCAA Tournament schedule
// Key = Kaggle slot name
export const MEN_SCHEDULE: Record<string, ScheduleEntry> = {
  // First Four - Tuesday March 17
  Y16: { scheduledTime: "2026-03-17T18:40:00-05:00", venue: "UD Arena, Dayton", tvChannel: "truTV" },
  Z11: { scheduledTime: "2026-03-17T21:15:00-05:00", venue: "UD Arena, Dayton", tvChannel: "truTV" },

  // First Four - Wednesday March 18
  X16: { scheduledTime: "2026-03-18T18:40:00-05:00", venue: "UD Arena, Dayton", tvChannel: "truTV" },
  Y11: { scheduledTime: "2026-03-18T21:15:00-05:00", venue: "UD Arena, Dayton", tvChannel: "truTV" },

  // R64 - Thursday March 19
  R1W8: { scheduledTime: "2026-03-19T12:15:00-05:00", venue: "Bon Secours Wellness Arena, Greenville", tvChannel: "CBS" },
  R1W1: { scheduledTime: "2026-03-19T14:50:00-05:00", venue: "Bon Secours Wellness Arena, Greenville", tvChannel: "CBS" },
  R1W6: { scheduledTime: "2026-03-19T13:30:00-05:00", venue: "KeyBank Center, Buffalo", tvChannel: "TNT" },
  R1W3: { scheduledTime: "2026-03-19T16:05:00-05:00", venue: "KeyBank Center, Buffalo", tvChannel: "TNT" },
  R1X4: { scheduledTime: "2026-03-19T12:40:00-05:00", venue: "Paycom Center, Oklahoma City", tvChannel: "truTV" },
  R1X5: { scheduledTime: "2026-03-19T15:15:00-05:00", venue: "Paycom Center, Oklahoma City", tvChannel: "truTV" },
  R1X7: { scheduledTime: "2026-03-19T19:35:00-05:00", venue: "Paycom Center, Oklahoma City", tvChannel: "truTV" },
  R1X2: { scheduledTime: "2026-03-19T22:10:00-05:00", venue: "Paycom Center, Oklahoma City", tvChannel: "truTV" },
  R1X6: { scheduledTime: "2026-03-19T18:50:00-05:00", venue: "Bon Secours Wellness Arena, Greenville", tvChannel: "TNT" },
  R1X3: { scheduledTime: "2026-03-19T21:25:00-05:00", venue: "Bon Secours Wellness Arena, Greenville", tvChannel: "TNT" },
  R1Z5: { scheduledTime: "2026-03-19T13:50:00-05:00", venue: "Moda Center, Portland", tvChannel: "TBS" },
  R1Z4: { scheduledTime: "2026-03-19T16:25:00-05:00", venue: "Moda Center, Portland", tvChannel: "TBS" },
  R1Z6: { scheduledTime: "2026-03-19T19:25:00-05:00", venue: "Moda Center, Portland", tvChannel: "TBS" },
  R1Z3: { scheduledTime: "2026-03-19T22:00:00-05:00", venue: "Moda Center, Portland", tvChannel: "TBS" },
  R1Y1: { scheduledTime: "2026-03-19T19:10:00-05:00", venue: "KeyBank Center, Buffalo", tvChannel: "CBS" },
  R1Y8: { scheduledTime: "2026-03-19T21:45:00-05:00", venue: "KeyBank Center, Buffalo", tvChannel: "CBS" },

  // R64 - Friday March 20
  R1W5: { scheduledTime: "2026-03-20T19:10:00-05:00", venue: "Pechanga Arena, San Diego", tvChannel: "CBS" },
  R1W4: { scheduledTime: "2026-03-20T21:45:00-05:00", venue: "Pechanga Arena, San Diego", tvChannel: "CBS" },
  R1W7: { scheduledTime: "2026-03-20T19:25:00-05:00", venue: "Wells Fargo Center, Philadelphia", tvChannel: "TBS" },
  R1W2: { scheduledTime: "2026-03-20T22:00:00-05:00", venue: "Wells Fargo Center, Philadelphia", tvChannel: "TBS" },
  R1X8: { scheduledTime: "2026-03-20T18:50:00-05:00", venue: "Amalie Arena, Tampa", tvChannel: "TNT" },
  R1X1: { scheduledTime: "2026-03-20T21:25:00-05:00", venue: "Amalie Arena, Tampa", tvChannel: "TNT" },
  R1Z1: { scheduledTime: "2026-03-20T13:35:00-05:00", venue: "Pechanga Arena, San Diego", tvChannel: "TNT" },
  R1Z8: { scheduledTime: "2026-03-20T16:10:00-05:00", venue: "Pechanga Arena, San Diego", tvChannel: "TNT" },
  R1Z2: { scheduledTime: "2026-03-20T19:35:00-05:00", venue: "Enterprise Center, St. Louis", tvChannel: "truTV" },
  R1Z7: { scheduledTime: "2026-03-20T22:10:00-05:00", venue: "Enterprise Center, St. Louis", tvChannel: "truTV" },
  R1Y5: { scheduledTime: "2026-03-20T12:40:00-05:00", venue: "Amalie Arena, Tampa", tvChannel: "truTV" },
  R1Y4: { scheduledTime: "2026-03-20T15:15:00-05:00", venue: "Amalie Arena, Tampa", tvChannel: "truTV" },
  R1Y3: { scheduledTime: "2026-03-20T13:50:00-05:00", venue: "Wells Fargo Center, Philadelphia", tvChannel: "TBS" },
  R1Y6: { scheduledTime: "2026-03-20T16:25:00-05:00", venue: "Wells Fargo Center, Philadelphia", tvChannel: "TBS" },
  R1Y7: { scheduledTime: "2026-03-20T12:15:00-05:00", venue: "Enterprise Center, St. Louis", tvChannel: "CBS" },
  R1Y2: { scheduledTime: "2026-03-20T14:50:00-05:00", venue: "Enterprise Center, St. Louis", tvChannel: "CBS" },

  // R32 - Saturday March 21 (placeholder times)
  R2W1: { scheduledTime: "2026-03-21T12:00:00-05:00", venue: "Bon Secours Wellness Arena, Greenville", tvChannel: "CBS" },
  R2W2: { scheduledTime: "2026-03-21T14:30:00-05:00", venue: "Bon Secours Wellness Arena, Greenville", tvChannel: "CBS" },
  R2W3: { scheduledTime: "2026-03-21T19:00:00-05:00", venue: "KeyBank Center, Buffalo", tvChannel: "TNT" },
  R2W4: { scheduledTime: "2026-03-21T21:30:00-05:00", venue: "KeyBank Center, Buffalo", tvChannel: "TNT" },
  R2X1: { scheduledTime: "2026-03-21T12:30:00-05:00", venue: "Paycom Center, Oklahoma City", tvChannel: "truTV" },
  R2X2: { scheduledTime: "2026-03-21T15:00:00-05:00", venue: "Paycom Center, Oklahoma City", tvChannel: "truTV" },
  R2X3: { scheduledTime: "2026-03-21T19:30:00-05:00", venue: "Moda Center, Portland", tvChannel: "TBS" },
  R2X4: { scheduledTime: "2026-03-21T22:00:00-05:00", venue: "Moda Center, Portland", tvChannel: "TBS" },

  // R32 - Sunday March 22 (placeholder times)
  R2Y1: { scheduledTime: "2026-03-22T12:00:00-05:00", venue: "Pechanga Arena, San Diego", tvChannel: "CBS" },
  R2Y2: { scheduledTime: "2026-03-22T14:30:00-05:00", venue: "Pechanga Arena, San Diego", tvChannel: "CBS" },
  R2Y3: { scheduledTime: "2026-03-22T19:00:00-05:00", venue: "Wells Fargo Center, Philadelphia", tvChannel: "TBS" },
  R2Y4: { scheduledTime: "2026-03-22T21:30:00-05:00", venue: "Wells Fargo Center, Philadelphia", tvChannel: "TBS" },
  R2Z1: { scheduledTime: "2026-03-22T12:30:00-05:00", venue: "Amalie Arena, Tampa", tvChannel: "TNT" },
  R2Z2: { scheduledTime: "2026-03-22T15:00:00-05:00", venue: "Amalie Arena, Tampa", tvChannel: "TNT" },
  R2Z3: { scheduledTime: "2026-03-22T19:30:00-05:00", venue: "Enterprise Center, St. Louis", tvChannel: "truTV" },
  R2Z4: { scheduledTime: "2026-03-22T22:00:00-05:00", venue: "Enterprise Center, St. Louis", tvChannel: "truTV" },

  // Sweet 16 - Thursday-Friday March 26-27
  R3W1: { scheduledTime: "2026-03-26T19:09:00-05:00", venue: "TBD", tvChannel: "CBS/TNT" },
  R3W2: { scheduledTime: "2026-03-26T21:39:00-05:00", venue: "TBD", tvChannel: "CBS/TNT" },
  R3X1: { scheduledTime: "2026-03-27T19:09:00-05:00", venue: "TBD", tvChannel: "CBS/TNT" },
  R3X2: { scheduledTime: "2026-03-27T21:39:00-05:00", venue: "TBD", tvChannel: "CBS/TNT" },
  R3Y1: { scheduledTime: "2026-03-26T19:09:00-05:00", venue: "TBD", tvChannel: "TBS/truTV" },
  R3Y2: { scheduledTime: "2026-03-26T21:39:00-05:00", venue: "TBD", tvChannel: "TBS/truTV" },
  R3Z1: { scheduledTime: "2026-03-27T19:09:00-05:00", venue: "TBD", tvChannel: "TBS/truTV" },
  R3Z2: { scheduledTime: "2026-03-27T21:39:00-05:00", venue: "TBD", tvChannel: "TBS/truTV" },

  // Elite 8 - Saturday-Sunday March 28-29
  R4W1: { scheduledTime: "2026-03-28T18:09:00-05:00", venue: "TBD", tvChannel: "CBS" },
  R4X1: { scheduledTime: "2026-03-28T20:49:00-05:00", venue: "TBD", tvChannel: "CBS" },
  R4Y1: { scheduledTime: "2026-03-29T18:09:00-05:00", venue: "TBD", tvChannel: "CBS" },
  R4Z1: { scheduledTime: "2026-03-29T20:49:00-05:00", venue: "TBD", tvChannel: "CBS" },

  // Final Four - Saturday April 4
  R5WX: { scheduledTime: "2026-04-04T18:09:00-05:00", venue: "Alamodome, San Antonio", tvChannel: "CBS" },
  R5YZ: { scheduledTime: "2026-04-04T20:49:00-05:00", venue: "Alamodome, San Antonio", tvChannel: "CBS" },

  // Championship - Monday April 6
  R6CH: { scheduledTime: "2026-04-06T20:20:00-05:00", venue: "Alamodome, San Antonio", tvChannel: "CBS" },
};

// Women's 2026 NCAA Tournament schedule (placeholder times)
export const WOMEN_SCHEDULE: Record<string, ScheduleEntry> = {
  // First Four - Tuesday March 18
  X16: { scheduledTime: "2026-03-18T19:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  Y16: { scheduledTime: "2026-03-18T21:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },

  // First Four - Wednesday March 19
  X10: { scheduledTime: "2026-03-19T19:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  Z11: { scheduledTime: "2026-03-19T21:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },

  // R64 - Friday-Saturday March 20-21 (placeholder times)
  R1W1: { scheduledTime: "2026-03-20T11:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1W2: { scheduledTime: "2026-03-20T13:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1W3: { scheduledTime: "2026-03-20T16:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1W4: { scheduledTime: "2026-03-20T18:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1W5: { scheduledTime: "2026-03-20T19:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1W6: { scheduledTime: "2026-03-20T21:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1W7: { scheduledTime: "2026-03-21T11:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1W8: { scheduledTime: "2026-03-21T13:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1X1: { scheduledTime: "2026-03-20T12:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1X2: { scheduledTime: "2026-03-20T14:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1X3: { scheduledTime: "2026-03-20T17:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1X4: { scheduledTime: "2026-03-20T19:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1X5: { scheduledTime: "2026-03-20T20:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1X6: { scheduledTime: "2026-03-20T22:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1X7: { scheduledTime: "2026-03-21T12:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1X8: { scheduledTime: "2026-03-21T14:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1Y1: { scheduledTime: "2026-03-21T11:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1Y2: { scheduledTime: "2026-03-21T14:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1Y3: { scheduledTime: "2026-03-21T16:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1Y4: { scheduledTime: "2026-03-21T19:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1Y5: { scheduledTime: "2026-03-21T19:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1Y6: { scheduledTime: "2026-03-21T21:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1Y7: { scheduledTime: "2026-03-22T11:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1Y8: { scheduledTime: "2026-03-22T13:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1Z1: { scheduledTime: "2026-03-21T12:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1Z2: { scheduledTime: "2026-03-21T15:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1Z3: { scheduledTime: "2026-03-21T17:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1Z4: { scheduledTime: "2026-03-21T20:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1Z5: { scheduledTime: "2026-03-21T20:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1Z6: { scheduledTime: "2026-03-21T22:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R1Z7: { scheduledTime: "2026-03-22T12:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R1Z8: { scheduledTime: "2026-03-22T14:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },

  // R32 - March 22-23
  R2W1: { scheduledTime: "2026-03-22T11:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R2W2: { scheduledTime: "2026-03-22T13:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R2W3: { scheduledTime: "2026-03-22T16:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R2W4: { scheduledTime: "2026-03-22T18:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R2X1: { scheduledTime: "2026-03-22T12:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R2X2: { scheduledTime: "2026-03-22T14:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R2X3: { scheduledTime: "2026-03-22T17:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R2X4: { scheduledTime: "2026-03-22T19:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R2Y1: { scheduledTime: "2026-03-23T11:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R2Y2: { scheduledTime: "2026-03-23T13:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R2Y3: { scheduledTime: "2026-03-23T16:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R2Y4: { scheduledTime: "2026-03-23T18:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R2Z1: { scheduledTime: "2026-03-23T12:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R2Z2: { scheduledTime: "2026-03-23T14:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R2Z3: { scheduledTime: "2026-03-23T17:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R2Z4: { scheduledTime: "2026-03-23T19:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },

  // Sweet 16 - March 28-29
  R3W1: { scheduledTime: "2026-03-28T19:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R3W2: { scheduledTime: "2026-03-28T21:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R3X1: { scheduledTime: "2026-03-29T19:00:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R3X2: { scheduledTime: "2026-03-29T21:30:00-05:00", venue: "TBD", tvChannel: "ESPN" },
  R3Y1: { scheduledTime: "2026-03-28T19:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R3Y2: { scheduledTime: "2026-03-28T21:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R3Z1: { scheduledTime: "2026-03-29T19:00:00-05:00", venue: "TBD", tvChannel: "ESPN2" },
  R3Z2: { scheduledTime: "2026-03-29T21:30:00-05:00", venue: "TBD", tvChannel: "ESPN2" },

  // Elite 8 - April 4-5
  R4W1: { scheduledTime: "2026-04-04T18:00:00-05:00", venue: "TBD", tvChannel: "ABC" },
  R4X1: { scheduledTime: "2026-04-04T20:30:00-05:00", venue: "TBD", tvChannel: "ABC" },
  R4Y1: { scheduledTime: "2026-04-05T18:00:00-05:00", venue: "TBD", tvChannel: "ABC" },
  R4Z1: { scheduledTime: "2026-04-05T20:30:00-05:00", venue: "TBD", tvChannel: "ABC" },

  // Final Four - April 3
  R5WX: { scheduledTime: "2026-04-03T19:00:00-05:00", venue: "Rocket Mortgage FieldHouse, Cleveland", tvChannel: "ESPN" },
  R5YZ: { scheduledTime: "2026-04-03T21:30:00-05:00", venue: "Rocket Mortgage FieldHouse, Cleveland", tvChannel: "ESPN" },

  // Championship - April 5
  R6CH: { scheduledTime: "2026-04-05T20:00:00-05:00", venue: "Rocket Mortgage FieldHouse, Cleveland", tvChannel: "ABC" },
};
