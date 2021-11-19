import '@johnlindquist/kit'
// Menu: Kontent

const query = await arg(
  'Query',
  async input => `
<div style="height:1280px">
  <iframe src="https://kentcdodds.com/s/${encodeURIComponent(
    input,
  )}"  frameborder="0" style="height:100%;width:100%" height="100%" width="100%">
</div>
`,
)
