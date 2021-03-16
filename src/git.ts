import * as path from 'path'
import * as io from '@actions/io'
import {v4 as uuidV4} from 'uuid'
import * as exec from '@actions/exec'
import * as core from '@actions/core'
import * as fs from 'fs'
import * as semver from 'semver'

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

export function getRemoteURL(
  user: string,
  repo: string,
  token: string
): string {
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
    core.info(`[INFO] Branch (${targetBranch}) doesn't exist; starting fresh`)
  }
  return tempDirectory
}

export async function copyAssets(
  sourceDir: string,
  destDir: string
): Promise<void> {
  if (fs.existsSync(destDir)) {
    core.info(`[INFO] Removing ${destDir}`)
    await io.rmRF(destDir)
  }

  core.info(`[INFO] Copying ${sourceDir} to ${destDir}`)
  await io.cp(sourceDir, destDir, {recursive: true, force: true})
}

export function createRedirect(workDir: string, defaultVersion: string): void {
  core.info(`[INFO] Writing redirect to 'index.html'`)
  const filepath = path.join(workDir, 'index.html')
  fs.writeFileSync(
    filepath,
    `<!DOCTYPE HTML>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${defaultVersion}">
  <script type="text/javascript">window.location.href = "${defaultVersion}"</script>
  <title>Redirecting...</title>
</head>
<body>
  If you are not redirected automatically, follow this <a href='${defaultVersion}'>link to the docs</a>.
</body>
</html>`
  )
}

export function updateVersions(
  workDir: string,
  currentVersion: string
): {stable: string; versions: string[]} {
  const filepath = path.join(workDir, 'versions.json')

  let data = {
    stable: currentVersion,
    versions: ['v0.0.1', 'v0.1.0', 'v0.2.0rc1']
  }
  try {
    data = JSON.parse(fs.readFileSync(filepath).toString())
  } catch (e) {
    core.info(`[INFO] Failed to load versions: ${e}`)
  }

  if (!data.versions) data.versions = [currentVersion]
  if (!data.versions.includes(currentVersion))
    data.versions.push(currentVersion)

  // Sort the tagged releases and select the stable version as the most recent
  const sortedReleases = data.versions
    .filter(v => semver.valid(v))
    .sort(semver.compare)
  if (
    sortedReleases.includes(currentVersion) &&
    sortedReleases[sortedReleases.length - 1] === currentVersion
  ) {
    data.stable = currentVersion
  }

  // If there is no tagged versions, we'll save this as the current stable release
  if (!data.stable) data.stable = currentVersion

  // Update the database of saved versions
  fs.writeFileSync(filepath, JSON.stringify(data))

  core.info(`[INFO] Available versions: ${data.versions}`)
  core.info(`[INFO] Current stable versions: ${data.stable}`)

  return data
}
