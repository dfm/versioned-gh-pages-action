import { context } from '@actions/github'
import * as core from '@actions/core'
import { getTag } from './tag'
import { checkoutRepo, copyAssets, getRemoteURL } from './git'
import * as path from 'path'
import * as fs from 'fs';

async function run(): Promise<void> {
  try {
    core.info('[INFO] Usage https://github.com/dfm/versioned-gh-pages-action')

    // Don't run on forks
    const eventName = context.eventName
    if (eventName === 'pull_request' || eventName === 'push') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isFork = (context.payload as any).repository.fork
      if (isFork) {
        core.warning('Skip deployment on fork')
        core.setOutput('skip', 'true')
        return
      }
    }

    const sourceDir: string = core.getInput('path');
    if (!fs.existsSync(sourceDir)) {
      core.warning(`The source directory ${sourceDir} doesn't exist`)
      core.setOutput('skip', 'true')
      return
    }

    // Extract the version tag. This will be a tag or branch name
    const tag = getTag(context.ref)
    core.info(`[INFO] Working on version: ${tag}`)

    // Construct the repo URL
    const token: string = core.getInput('github-token');
    const remoteURL = getRemoteURL(context.repo.owner, context.repo.repo, token)

    // Check out the existing branch if possible
    core.startGroup('Checking out existing branch');
    const targetBranch: string = core.getInput('target-branch');
    const tempDirectory = await checkoutRepo(remoteURL, targetBranch);
    core.endGroup();

    // Copy over the files
    core.startGroup('Copying generated files');
    copyAssets(sourceDir, path.join(tempDirectory, tag))
    core.endGroup();

    core.setOutput('outputDirectory', tempDirectory)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
