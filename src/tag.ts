import * as core from '@actions/core';
import { context } from '@actions/github';
import * as semver from 'semver';

// Ref: https://github.com/crazy-max/ghaction-docker-meta/blob/master/src/meta.ts
export function getTag(): string {
  // First handle tags
  let main: string = context.ref;
  if (/^refs\/tags\//.test(main)) {
    main = main.replace(/^refs\/tags\//g, '').replace(/\//g, '-');
    const cleaned = semver.clean(main);
    if (!cleaned) {
      core.warning(`${main} is not a valid semver. More info: https://semver.org/`);
    } else {
      main = cleaned;
    }
  } else if (/^refs\/heads\//.test(main)) {
    main = main.replace(/^refs\/heads\//g, '').replace(/[^a-zA-Z0-9._-]+/g, '-');
  } else if (/^refs\/pull\//.test(main)) {
    main = `pr-${main.replace(/^refs\/pull\//g, '').replace(/\/merge$/g, '')}`;
  } else {
    core.warning(`${main} is not a recognized ref`);
  }
  return main;
}
