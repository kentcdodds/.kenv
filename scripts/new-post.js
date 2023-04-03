// Menu: New Post
// Description: Create a new blog post
// Author: Kent C. Dodds
// Shortcut: command option control p
// Twitter: @kentcdodds

import '@johnlindquist/kit'
const dateFns = await npm('date-fns')
const prettier = await npm('prettier')
const YAML = await npm('yaml')
const slugify = await npm('@sindresorhus/slugify')
const {format: formatDate} = await npm('date-fns')
const makeMetascraper = await npm('metascraper')
const {$filter, toRule} = await npm('@metascraper/helpers')

const unsplashTitleToAlt = toRule(str => str.replace(/ photo – .*$/, ''))
const unsplashOGTitleToAuthor = toRule(str =>
  str.replace(/Photo by (.*?) on Unsplash/, '$1'),
)
const unsplashImageToPhotoId = toRule(str =>
  new URL(str).pathname.replace('/', ''),
)

const metascraper = makeMetascraper([
  {
    unsplashPhotoId: [
      unsplashImageToPhotoId($ =>
        $('meta[property="og:image"]').attr('content'),
      ),
    ],
  },
  {
    author: [
      unsplashOGTitleToAuthor($ =>
        $('meta[property="og:title"]').attr('content'),
      ),
    ],
  },
  {alt: [unsplashTitleToAlt($ => $('title').text())]},
])

async function getMetadata(url) {
  const html = await fetch(url).then(res => res.text())
  return metascraper({html, url})
}

const blogDir = await env(
  'KCD_BLOG_CONTENT_DIR',
  `What's the path to the blog content directory on this machine?`,
)

const title = await arg({
  placeholder: `What's the title of this post?`,
  hint: 'Title',
  ignoreBlur: true,
})

const description = await arg({
  placeholder: `What's the description of this post?`,
  hint: 'Description',
  input: 'TODO: add a description',
  ignoreBlur: true,
})

const categories = (
  await arg({
    placeholder: `What are the categories of this post?`,
    hint: 'Categories (comma separated)',
    ignoreBlur: true,
  })
)
  .split(',')
  .map(c => c.trim())
  .filter(Boolean)

const keywords = (
  await arg({
    placeholder: `What are the keywords of this post?`,
    hint: 'Keywords (comma separated)',
    ignoreBlur: true,
  })
)
  .split(',')
  .map(c => c.trim())
  .filter(Boolean)

const filename = slugify(title, {decamelize: false})
// await exec(`open https://unsplash.com/s/photos/${filename}`)

const unsplashPhotoInput = await arg({
  placeholder: `What's the unsplash photo?`,
  hint: 'Unsplash Photo',
  ignoreBlur: true,
})
const unsplashPhotoUrl = unsplashPhotoInput.startsWith('http')
  ? unsplashPhotoInput
  : `https://unsplash.com/photos/${unsplashPhotoInput}`

const metadata = await getMetadata(unsplashPhotoUrl)

const frontmatter = YAML.stringify({
  title,
  date: dateFns.format(new Date(), 'yyyy-MM-dd'),
  description,
  categories,
  meta: {keywords},
  bannerCloudinaryId: `unsplash/${metadata.unsplashPhotoId}`,
  bannerAlt: metadata.alt,
  bannerCredit: `Photo by [${metadata.author}](${unsplashPhotoUrl})`,
})

const md = `---
${frontmatter}
---

Be excellent to each other.
`

// prettify the markdown
const prettyMd = await prettier.format(md, {
  parser: 'markdown',
  arrowParens: 'avoid',
  bracketSpacing: false,
  embeddedLanguageFormatting: 'auto',
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  jsxBracketSameLine: false,
  jsxSingleQuote: false,
  printWidth: 80,
  proseWrap: 'always',
  quoteProps: 'as-needed',
  requirePragma: false,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
  vueIndentScriptAndStyle: false,
})

const newFile = path.join(blogDir, `${filename}.mdx`)
await writeFile(newFile, prettyMd)
await edit(newFile)
