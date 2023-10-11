// Menu: Written Content
// Description: Write some quick content
// Author: Kent C. Dodds
// Shortcut: command option control w
// Twitter: @kentcdodds

import '@johnlindquist/kit'

const dateFns = await npm('date-fns')
const filenamify = await npm('filenamify')

const storyDir = await env(
  'WRITTEN_CONTENT_DIRECTORY',
  `Where do you want your written content to be saved?`,
)

const date = dateFns.format(new Date(), 'yyyy-MM-dd')
const title =
  (await arg({
    placeholder: 'What do you want to call this? (optional)',
    hint: 'Title',
  })) ?? 'Untitled'

const md = `---
title: ${title}
date: ${date}
---

Write your story here
`

const filename = filenamify(
  `${date}-${title.toLowerCase().replace(/ /g, '-').replace(/'/g, '')}.md`,
  {replacement: '-'},
)
const filepath = path.join(storyDir, filename)
await writeFile(filepath, md)
await edit(filepath, path.dirname(filepath))

export {}
