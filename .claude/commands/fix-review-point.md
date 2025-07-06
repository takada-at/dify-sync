Resolveしていないレビューコメントの指摘内容へ対応して下さい。

## 進め方の手順

1. 次項の記載のコマンドを用いて、Resolveしていないレビューコメントを確認する
2. Resolveしていないレビューコメントの内容を理解する
3. 指摘内容を実現するために必要なタスクを遂行する
4. テストとLintを実行し、すべてのテストが通ることを確認する

## ghコマンド
以下のコマンドでResolveしていないレビューコメントを取得できます。

```bash
OWNER_REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
OWNER=$(echo $OWNER_REPO | cut -d'/' -f1)
REPO=$(echo $OWNER_REPO | cut -d'/' -f2)
PR_NUMBER=$(gh pr view --json number --jq '.number')

gh api graphql -f query="
query {
  repository(owner: \"${OWNER}\", name: \"${REPO}\") {
    pullRequest(number: ${PR_NUMBER}) {
      number
      title
      url
      state
      author {
        login
      }
      reviewRequests(first: 20) {
        nodes {
          requestedReviewer {
            ... on User {
              login
            }
          }
        }
      }
      reviewThreads(last: 20) {
        edges {
          node {
            isResolved
            isOutdated
            path
            line
            comments(last: 20) {
              nodes {
                author {
                  login
                }
                body
                url
                createdAt
              }
            }
          }
        }
      }
    }
  }
}" --jq '
  .data.repository.pullRequest as $pr |
  {
    pr_number: $pr.number,
    title: $pr.title,
    url: $pr.url,
    state: $pr.state,
    author: $pr.author.login,
    requested_reviewers: [.data.repository.pullRequest.reviewRequests.nodes[].requestedReviewer.login],
    unresolved_threads: [
      $pr.reviewThreads.edges[] |
      select(.node.isResolved == false) |
      {
        path: .node.path,
        line: .node.line,
        is_outdated: .node.isOutdated,
        comments: [
          .node.comments.nodes[] |
          {
            author: .author.login,
            body: .body,
            url: .url,
            created_at: .createdAt
          }
        ]
      }
    ]
  }
'
```