#!/usr/bin/env node

// Test script to validate the epicshop-update-ci script structure
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function validateScript() {
  const scriptPath = path.join(__dirname, '../scripts/epicshop-update-ci.ts')
  
  try {
    const content = await fs.readFile(scriptPath, 'utf8')
    
    // Check that the script removes interactive prompts
    if (content.includes('await arg({')) {
      console.error('❌ CI script still contains interactive prompts')
      process.exit(1)
    }
    
    // Check that it has the main functions
    const requiredFunctions = [
      'getLatestMtime',
      'findWorkshopDirs', 
      'getSortedWorkshopDirs',
      'updateWorkshopRepos',
      'main'
    ]
    
    for (const fn of requiredFunctions) {
      if (!content.includes(`async function ${fn}`)) {
        console.error(`❌ Missing required function: ${fn}`)
        process.exit(1)
      }
    }
    
    // Check that it imports required modules
    const requiredImports = [
      '@johnlindquist/kit',
      'globby',
      'execa',
      'chalk',
      'fs/promises'
    ]
    
    for (const imp of requiredImports) {
      if (!content.includes(imp)) {
        console.error(`❌ Missing required import: ${imp}`)
        process.exit(1)
      }
    }
    
    console.log('✅ epicshop-update-ci.ts validation passed')
    
  } catch (error) {
    console.error('❌ Failed to read script:', error.message)
    process.exit(1)
  }
}

async function validateWorkflow() {
  const workflowPath = path.join(__dirname, '../.github/workflows/epicshop-update.yml')
  
  try {
    const content = await fs.readFile(workflowPath, 'utf8')
    
    // Check that workflow has required elements
    const requiredElements = [
      'workflow_dispatch',
      'confirm_update',
      'Setup Node.js',
      'Install dependencies',
      'Setup Kit CLI',
      'Configure Git', 
      'Run EpicShop Update'
    ]
    
    for (const element of requiredElements) {
      if (!content.includes(element)) {
        console.error(`❌ Workflow missing required element: ${element}`)
        process.exit(1)
      }
    }
    
    console.log('✅ GitHub workflow validation passed')
    
  } catch (error) {
    console.error('❌ Failed to read workflow:', error.message)
    process.exit(1)
  }
}

async function main() {
  console.log('🔍 Validating EpicShop Update automation...')
  await validateScript()
  await validateWorkflow()
  console.log('🎉 All validations passed!')
}

main().catch(console.error)