import { context } from '@actions/github'
import * as core from '@actions/core'
import { getTag } from './tag'
import { checkoutRepo, getRemoteURL } from './git'

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

    // Extract the version tag. This will be a tag or branch name
    const tag = getTag(context.ref)
    core.info(`[INFO] Working on version: ${tag}`)

    const token: string = core.getInput('github-token');
    const remoteURL = getRemoteURL(context.repo.owner, context.repo.repo, token)

    const targetBranch: string = core.getInput('target-branch');
    const tempDirectory = checkoutRepo(remoteURL, targetBranch);
    core.info(`[INFO] Checked out to ${tempDirectory}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
