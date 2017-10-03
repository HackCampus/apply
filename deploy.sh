#!/usr/bin/env bash
npm run build

UNTRACKED=$(git status --porcelain | wc -l)
if [ $UNTRACKED -ne 0 ]; then
  echo "uncommitted files in the repo. make sure the repo is up to date and try again."
  git status --porcelain
  exit 1
fi

git push heroku
heroku logs -t
