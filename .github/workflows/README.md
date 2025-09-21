# GitHub Actions Workflow for EpicShop Update

This workflow allows you to manually trigger the `epicshop-update` script from GitHub Actions, enabling you to run updates from anywhere, including mobile devices.

## How to Use

1. Go to the [Actions tab](../../actions) in your GitHub repository
2. Select the "EpicShop Update" workflow
3. Click "Run workflow"
4. Choose whether to auto-confirm large batch operations (if more than 30 directories are found)
5. Click "Run workflow" to start the process

## Workflow Configuration

The workflow:
- Runs on Ubuntu latest
- Sets up Node.js 18.18.2 (matching the project's engine requirement)
- Configures Git for automated commits and pushes
- Creates a standalone version of the epicshop-update script that doesn't depend on @johnlindquist/kit
- Handles the interactive confirmation prompt automatically based on your input

## Git Authentication

The workflow uses GitHub's provided token for authentication. If you need to push to repositories outside of this one, you may need to:

1. Create a Personal Access Token with `repo` permissions
2. Add it as a repository secret named `PERSONAL_ACCESS_TOKEN`
3. The workflow will automatically use it if available

## Inputs

- **confirm_large_batch**: Choose 'y' to automatically proceed if more than 30 workshop directories are found, or 'n' (default) to exit safely

## What the Script Does

The epicshop-update script:
1. Searches for workshop directories in `~/code` and `~/Desktop`
2. Updates `@epic-web/workshop-app`, `@epic-web/workshop-utils`, and `@epic-web/workshop-presence` dependencies
3. Runs `npm install` to update package-lock.json files
4. Commits and pushes changes to each repository
5. Handles git stashing if there are uncommitted changes

## Troubleshooting

If the workflow fails:
- Check the logs in the Actions tab
- Ensure your repositories have the correct permissions for the GitHub token
- For repositories outside this organization, use a Personal Access Token