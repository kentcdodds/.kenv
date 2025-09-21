# Kent's ScriptKit scripts

[ScriptKit.com](https://scriptkit.com)

## GitHub Actions

### EpicShop Update

This repository includes a GitHub Action that can be manually triggered to run the EpicShop Update script, which updates the `@epic-web/workshop-app` package across all Epic Web workshop repositories.

**To run the action:**

1. Go to the Actions tab in this repository
2. Select "EpicShop Update" workflow
3. Click "Run workflow"
4. Select "yes" to confirm the update
5. Optionally specify a custom workshops directory path

The action will:
- Set up the Kit environment
- Configure Git authentication
- Find all workshop repositories with `epicshop` directories
- Update package versions and commit changes
- Push updates to the respective repositories

**Note:** This action requires appropriate Git permissions to push to the workshop repositories.
