// Menu: Fix Screens
// Description: Set screens to the right size
// Author: Kent C. Dodds
// Shortcut: command option control f
// Twitter: @kentcdodds

import '@johnlindquist/kit'

const bin = '/opt/homebrew/bin/displayplacer'
const builtInDisplayId = '37D8832A-2D66-02CA-B9F7-8F30A301B230'
const leftDisplayId = '14EB5859-EA7B-4C0A-BE57-3BEFA8CB0C09'
const rightDisplayId = '3867FCD7-633C-4657-81A4-EBF454F8DD84'

const listOutput = (await exec(`${bin} list`)).stdout
const isDesktop = listOutput.includes(leftDisplayId)

if (isDesktop) {
  await exec(
    `${bin} "id:${leftDisplayId} res:2560x1440 hz:60 color_depth:8 scaling:on origin:(0,0) degree:0" "id:${rightDisplayId} res:1920x1080 hz:60 color_depth:8 scaling:on origin:(2560,0) degree:0"`,
  )
} else {
  const is1080p = listOutput.includes(`Resolution: 1920x1080`)
  if (is1080p) {
    await exec(
      `${bin} "id:${builtInDisplayId} res:1728x1117 hz:120 color_depth:8 scaling:on origin:(0,0) degree:0"`,
    )
  } else {
    await exec(
      `${bin} "id:${builtInDisplayId} res:1920x1080 hz:120 color_depth:8 scaling:on origin:(0,0) degree:0"`,
    )
  }
}
