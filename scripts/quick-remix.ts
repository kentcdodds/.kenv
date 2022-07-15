// Menu: New Remix Project
// Description: Create a new Remix project with the KCD Quick Stack
// Shortcut: command option control r
// Author: Kent C. Dodds & John Lindquist
// Twitter: @kentcdodds

import "@johnlindquist/kit";
const generate = await npm("project-name-generator");
const Convert = await npm("ansi-to-html");
const convert = new Convert();

const defaultName = generate({ words: 2, alliterative: true }).dashed;

const name =
  (await arg({
    name: "What is this called?",
    hint: "e.g. 'My new project'",
    placeholder: `Default: ${defaultName}`,
  })) || defaultName;

const projectPath = `~/Desktop/quick-remix/${name}`;

hide();

const logWidget = await widget(
  `
<script>
const logEl = document.querySelector("#log")

const callback = ()=> {
    logEl.lastChild.scrollIntoView()
}
const observer = new MutationObserver(callback)

observer.observe(logEl, {childList: true})
</script>
<div class="font-mono text-xxs w-full h-full p-4">
    <div id="log" v-html="log" class="max-h-full overflow-y-scroll whitespace-pre"/>
</div>
`,
  {
    width: 720,
    height: 480,
    alwaysOnTop: true,
    state: {
      log: `<p>...</p>`,
    },
  }
);

let currentHtml = ``;
const handleLog = (line) => {
  const lineHtml = convert.toHtml(line);
  currentHtml += `<p>${lineHtml}</p>`;

  logWidget.setState({
    log: currentHtml,
  });
};

await execLog(
  `npx create-remix ${projectPath} --typescript --install --template kentcdodds/quick-stack`,
  handleLog
);

logWidget.close();

await edit(projectPath);
