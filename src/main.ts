import { context } from '@actions/github';
import * as core from '@actions/core';
import { getTag } from './tag';

async function run(): Promise<void> {
  try {
    core.info('[INFO] Usage https://github.com/dfm/versioned-gh-pages-action');

    // Don't run on forks
    const eventName = context.eventName;
    if (eventName === 'pull_request' || eventName === 'push') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isFork = (context.payload as any).repository.fork;
      if (isFork) {
        core.warning('Skip deployment on fork');
        core.setOutput('skip', 'true');
        return;
      }
    }

    // Extract the version tag. This will be a tag or branch name
    const tag: string = getTag();
    // const token: string = core.getInput('github-token');
    // const targetBranch: string = core.getInput('target-branch');

    core.info(`Tag: ${tag}`)

  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
