/**
 * Congratulations! You made a `{{name}}` script! 🎉
 *
 * 1. Follow the instructions in the comments below.
 * 2. Run `{{name}}` in the prompt after each step:
 * Reminder: The prompt can be invoked with cmd+;
 */

//Find console.log messages in ~/.kenv/logs/console.log
console.log(`{{USER}} made a {{name}} script!`)

/**
 * Step 1: Accept an argument and show the result
 * 1. Uncomment the 2 lines "let user" and "show"
 * 2. Run `{{name}}` in your prompt again
 */

// let user = await arg("Type your github username:")
// show(`<h1 class="p-2">You typed: ${user}</h1>`)

/**
 * Step 2: Fetch data from the github api
 * 1. Comment out the `show` line above
 * 1. Uncomment lines the 2 lines "let response" and "inspect"
 * 2. Run `{{name}}` again
 */

// let response = await get(`https://api.github.com/users/${user}`)
// inspect(response.data)

/**
 * Step 3: Write your data to a template
 * 1. Comment out the `show` line above
 * 2. Uncomment the lines from "contentPath" to "edit"
 * 3. Run `{{name}} {{USER}}` again
 * Note: a prompt will ask you to select a directory for your file
 */

// let contentPath = await env("TUTORIAL_CONTENT_PATH", { message: 'Write file to:? e.g. "~/.kenv/tmp"'})
// let content = await compileTemplate("tutorial.md", { name: response.data.name })
// let filePath = path.join(contentPath, `${user}.md`)
// await writeFile(filePath, content)
// await edit(filePath)
