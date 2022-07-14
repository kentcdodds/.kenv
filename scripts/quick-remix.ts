// Menu: New Remix Project
// Description: Create a new Remix project with the KCD Quick Stack
// Shortcut: command option control r
// Author: Kent C. Dodds
// Twitter: @kentcdodds

import "@johnlindquist/kit";
const generate = await npm("project-name-generator");

const defaultName = generate({ words: 2, alliterative: true }).dashed;

const name =
  (await arg({
    name: "What is this called?",
    hint: "e.g. 'My new project'",
    placeholder: `Default: ${defaultName}`,
  })) || defaultName;

const createPromise = exec(
  `npx create-remix ~/Desktop/${name} --typescript --install --template kentcdodds/quick-stack`
);
await new Promise((resolve) => setTimeout(resolve, 2000));
await edit(`~/Desktop/${name}`);
await createPromise;
await notify({
  title: `✅ ${name}`,
  message: `Project created and initialized in ~/Desktop/${name}`,
});
