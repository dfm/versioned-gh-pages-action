import * as path from 'path'
import * as io from '@actions/io'
import { v4 as uuidV4 } from 'uuid'
import * as exec from '@actions/exec'
import * as core from '@actions/core'
import * as fs from 'fs';

async function createTempDirectory(): Promise<string> {
  const IS_WINDOWS = process.platform === 'win32'
  let tempDirectory: string = process.env['RUNNER_TEMP'] || ''
  if (!tempDirectory) {
    let baseLocation: string
    if (IS_WINDOWS) {
      // On Windows use the USERPROFILE env variable
      baseLocation = process.env['USERPROFILE'] || 'C:\\'
    } else {
      if (process.platform === 'darwin') {
        baseLocation = '/Users'
      } else {
        baseLocation = '/home'
      }
    }
    tempDirectory = path.join(baseLocation, 'actions', 'temp')
  }
  const dest = path.join(tempDirectory, uuidV4())
  await io.mkdirP(dest)
  return dest
}

export function getRemoteURL(user: string, repo: string, token: string): string {
  return `https://x-access-token:${token}@github.com/${user}/${repo}.git`
}

export async function checkoutRepo(
  remoteURL: string,
  targetBranch: string
): Promise<string> {
  const tempDirectory = await createTempDirectory()
  try {
    await exec.exec('git', [
      'clone',
      '--depth=1',
      '--single-branch',
      '--branch',
      targetBranch,
      remoteURL,
      tempDirectory
    ])
    core.info(`[INFO] Checked out to ${tempDirectory}`)
  } catch (e) {
    core.info(`[INFO] Branch (${targetBranch}) doesn't exist; it will be created`);
  }
  return tempDirectory;
}

export async function copyAssets(
  sourceDir: string,
  destDir: string
): Promise<void> {
  if (fs.existsSync(destDir)) {
    core.info(`[INFO] Removing ${destDir}`);
    await io.rmRF(destDir);
  }

  core.info(`[INFO] Copying ${sourceDir} to ${destDir}`);
  await io.cp(sourceDir, destDir, { recursive: true, force: true })
}