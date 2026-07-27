#!/bin/zsh

cd -- "${0:A:h}" || exit 1

npm run scrape
exit_code=$?

echo
if (( exit_code == 0 )); then
  echo "口コミの更新が完了しました。"
else
  echo "口コミの更新に失敗しました。"
fi

read -r "?Enterキーを押すと閉じます。"
exit "$exit_code"
