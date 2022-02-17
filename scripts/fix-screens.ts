// Menu: Fix Screens
// Description: Set screens to the right size
// Author: Kent C. Dodds
// Shortcut: command option control f
// Twitter: @kentcdodds

import "@johnlindquist/kit";

await exec(
  '/opt/homebrew/bin/displayplacer "id:14EB5859-EA7B-4C0A-BE57-3BEFA8CB0C09 res:2560x1440 hz:60 color_depth:8 scaling:on origin:(0,0) degree:0" "id:3867FCD7-633C-4657-81A4-EBF454F8DD84 res:1920x1080 hz:60 color_depth:8 scaling:on origin:(2560,0) degree:0"'
);
