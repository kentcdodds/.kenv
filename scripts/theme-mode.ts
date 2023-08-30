// Shortcut: control ;
// Name: theme mode

// https://github.com/qualialog/dotfiles/blob/main/files/scripts/theme-mode.js

import '@johnlindquist/kit'

await exec(
  `osascript -e 'tell application "System Events" to tell appearance preferences to set dark mode to not dark mode'`,
)
