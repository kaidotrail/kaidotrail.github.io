#!/bin/bash

# IndexNow にリクエストを送信します。
#
# 事前準備:
# .env ファイルを作成し INDEXNOW_KEY=<key> を書き込んでください。
# 現在使用中の key は GitHub Actions の設定ページを参照してください。
# https://github.com/kaidotrail/kaidotrail.github.io/settings/environments
#
# 備考:
# urlList は記入例です。適宜編集してください。

export "$(cat .env | xargs)"
curl -X POST https://api.indexnow.org/IndexNow \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "{
    \"host\": \"kaidotrail.github.io\",
    \"key\": \"$INDEXNOW_KEY\",
    \"KeyLocation\": \"https://kaidotrail.github.io/$INDEXNOW_KEY.txt\",
    \"urlList\": [
      \"https://kaidotrail.github.io\",
      \"https://kaidotrail.github.io/nakasendo.html\",
      \"https://kaidotrail.github.io/nikko.html\",
      \"https://kaidotrail.github.io/nakahara.html\",
      \"https://kaidotrail.github.io/kawagoe.html\",
      \"https://kaidotrail.github.io/oshu.html\"
    ]
  }"
