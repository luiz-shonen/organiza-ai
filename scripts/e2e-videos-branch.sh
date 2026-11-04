#!/usr/bin/env bash
# Organiza AI — keeps the PR E2E media on the orphan `e2e-videos` branch.
#
#   scripts/e2e-videos-branch.sh publish <pr> <sha>   # replace pr-<pr>/ with e2e-videos/*.{gif,mp4}
#   scripts/e2e-videos-branch.sh remove <pr>          # drop pr-<pr>/ (PR closed)
#
# The branch holds one parentless commit that is force-pushed each time, so old media do not
# pile up in the history. It is built with git plumbing on a private index: the working tree
# and the checked-out branch are never touched. `publish` prints the folder's raw URL base as
# `base_url=...`, ready for $GITHUB_OUTPUT. Run from a checkout that can push (actions/checkout
# keeps the token). See docs/knowledge/decisions/testing.md.
set -euo pipefail

BRANCH=e2e-videos
command=${1:?publish or remove}
pr=${2:?PR number}
sha=${3:-}
repo=${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}
dir="pr-${pr}"
[ "$command" = publish ] && dir="pr-${pr}/${sha:0:7}"

export GIT_INDEX_FILE="${RUNNER_TEMP:-/tmp}/e2e-videos-index"
export GIT_AUTHOR_NAME='github-actions[bot]' GIT_COMMITTER_NAME='github-actions[bot]'
export GIT_AUTHOR_EMAIL='41898282+github-actions[bot]@users.noreply.github.com'
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"

for attempt in 1 2 3; do
  rm -f "$GIT_INDEX_FILE"
  old=$(git ls-remote origin "refs/heads/${BRANCH}" | cut -f1)
  if [ -n "$old" ]; then
    git fetch -q --depth=1 origin "$old"
    git read-tree "$old"
  else
    git read-tree --empty
  fi
  git rm -r -q --cached --ignore-unmatch "pr-${pr}" >/dev/null

  if [ "$command" = publish ]; then
    shopt -s nullglob
    for file in e2e-videos/*.gif e2e-videos/*.mp4; do
      blob=$(git hash-object -w --no-filters "$file")
      git update-index --add --cacheinfo "100644,${blob},${dir}/$(basename "$file")"
    done
    message="media for PR #${pr} at ${sha:0:7}"
  else
    message="drop media of closed PR #${pr}"
  fi

  tree=$(git write-tree)
  commit=$(git commit-tree "$tree" -m "chore(e2e-videos): ${message}")
  # The lease makes a concurrent push from another PR fail instead of being overwritten.
  if git push -q --force-with-lease="refs/heads/${BRANCH}:${old}" origin "${commit}:refs/heads/${BRANCH}"; then
    [ "$command" = publish ] && echo "base_url=https://raw.githubusercontent.com/${repo}/${BRANCH}/${dir}"
    exit 0
  fi
  echo "Push to ${BRANCH} raced with another PR (attempt ${attempt}); retrying." >&2
  sleep $((attempt * 3))
done
echo "Could not update the ${BRANCH} branch." >&2
exit 1
