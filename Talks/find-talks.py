#!/usr/bin/env python3
#
# A small collection script for talk description files (YAML).
# Heavily inspired by https://github.com/svenk/uniordner/tree/master/unibib-searchengine
#

import pathlib, yaml, sys
here = pathlib.Path(__file__).parent
here_pub = "https://github.com/svenk/publications/tree/master/Talks"
talks = []

def fixlinks(talk, path):
    "Discover anything file-like in the talk dict and replace it with public URL."
    base = path.parent
    base_pub = str(base).replace(str(here),here_pub)
    talk_pub = {}
    fixer = lambda v: base_pub+"/"+v if (base/str(v)).exists() else v
    for k,v in talk.items():
        if isinstance(v, dict):
            talk_pub[k] = fixlinks(v, path)
        elif isinstance(v, list):
            talk_pub[k] = [ fixer(w) for w in v ]
        else:
            talk_pub[k] = fixer(v)
    return talk_pub

for path in here.rglob("*.talk.y*ml"):
    #print(path, file=sys.stderr)
    content = yaml.safe_load(open(path, "r"))
    if isinstance(content, list):
        talks += (fixlinks(talk,path) for talk in content)
    elif isinstance(content, dict):
        for name, talk in content.items():
            talk['key'] = name
            talks.append(fixlinks(talk,path))

print(yaml.dump({"talks": talks }))
