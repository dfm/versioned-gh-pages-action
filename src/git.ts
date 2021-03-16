import * as path from 'path';
import * as io from '@actions/io';
import { v4 as uuidV4 } from 'uuid';
import * as exec from '@actions/exec';

export async function createTempDirectory(): Promise<string> {
  const IS_WINDOWS = process.platform === 'win32';
  let tempDirectory: string = process.env['RUNNER_TEMP'] || '';
  if (!tempDirectory) {
    let baseLocation: string;
    if (IS_WINDOWS) {
      // On Windows use the USERPROFILE env variable
      baseLocation = process.env['USERPROFILE'] || 'C:\\';
    } else {
      if (process.platform === 'darwin') {
        baseLocation = '/Users';
      } else {
        baseLocation = '/home';
      }
    }
    tempDirectory = path.join(baseLocation, 'actions', 'temp');
  }
  const dest = path.join(tempDirectory, uuidV4());
  await io.mkdirP(dest);
  return dest;
}

export async function checkoutRepo(remoteURL: string, targetBranch: string): Promise<void> {
  const tempDirectory = await createTempDirectory();
  const code = await exec.exec('git', ['clone', '--depth=1', '--single-branch', '--branch', targetBranch, remoteURL, tempDirectory],);
}
