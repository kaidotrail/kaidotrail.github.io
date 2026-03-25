[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC_BY--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Deployment Status](https://github.com/kaidotrail/kaidotrail.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/kaidotrail/kaidotrail.github.io/actions/workflows/deploy.yml)

# 旧街道足跡マップ

江戸時代の旧街道を歩いた記録や情報を公開するサイトを開発しています。

サイトはこちら: https://kaidotrail.github.io/

[利用規約](https://kaidotrail.github.io/terms.html)
[プライバシーポリシー](https://kaidotrail.github.io/policy.html)

## 開発環境

今の所バニラ HTML & CSS & JS で書いています。
将来何かのジェネレーターやフレームワーク等を導入するかもしれません (選定中)。

タスクランナーは pnpm, フォーマッターは Prettier, リンターは ESLint を採用しています。

- 依存関係解決: `pnpm i`
- format: `pnpm format`
- lint: `pnpm lint`

最終成果物の HTML と JS は esbuild を使って minify しています。
ローカルでこれを実行するには `pnpm build` を実行し、生成された dist ディレクトリを確認してください。

## License

[CC BY-SA 4.0](LISENCE)
