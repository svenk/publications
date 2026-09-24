#!/usr/bin/env node
// small standalone, needs npm install yaml and glob.
// This is basically a nodejs-variant of find-talks.py

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { globSync } from "glob";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const here_pub = "https://github.com/svenk/publications/tree/master/Talks";
const talks = [];

const githubTreeDownload = v => {
  if (typeof v !== "string") return null;
  const m = v.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+\.(?:pdf|odp|pptx?|key|zip))(?:[?#].*)?$/i);
  return m && `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}`;
};

const fixlinks = (t, p) => {
  const b = path.dirname(p);
  const bp = b.replace(here, here_pub);
  const fx = v =>
    fs.existsSync(path.join(b, String(v))) ? bp + "/" + v : v;

  const o = {};
  for (const [k, v] of Object.entries(t)) {
    if (Array.isArray(v)) o[k] = v.map(fx);
    else if (v && typeof v === "object") o[k] = fixlinks(v, p);
    //else o[k] = fx(v);
    else {
      o[k] = fx(v);
      const dl = githubTreeDownload(o[k]);
      if (dl) o[`${k}_download`] = dl;
    }
  }
  return o;
};

export function find_talks() {
  for (const p of globSync("**/*.talk.y*ml", { cwd: here, absolute: true })) {
    const c = yaml.load(fs.readFileSync(p, "utf8"), { schema: yaml.JSON_SCHEMA /* keep dates unparsed */ });
    if (Array.isArray(c)) {
      talks.push(...c.map(t => fixlinks(t, p)));
    } else if (c && typeof c === "object") {
      for (const [n, t] of Object.entries(c)) {
        t.key = n;
        talks.push(fixlinks(t, p));
      }
    }
  }
  return talks
}

export function dump_talks(target_file) {
    return fs.writeFileSync(target_file, yaml.dump({ talks: find_talks() }))
}

// Usage like:
// console.log(find_talks())
