#!/usr/bin/env bash
# 웹 빌드: expo export → docs/ 로 복사 → index.html 보정 (초대 링크 보관 스크립트, 모바일 가로 넘침 방지)
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist
npx expo export --platform web --clear
rm -rf docs && mkdir docs && cp -r dist/. docs/ && touch docs/.nojekyll
python3 - <<'EOF'
p = "docs/index.html"; s = open(p, encoding="utf-8").read()
s = s.replace('<html lang="en">', '<html lang="ko">')
inject = ('<script>try{if(location.hash&&location.hash.indexOf("#j-")===0){localStorage.setItem("amho.pendingInvite",location.hash.slice(1));}}catch(e){}</script>'
          '<style>html,body{overflow-x:hidden;max-width:100vw;background:#0E0E10}</style>')
if "amho.pendingInvite" not in s: s = s.replace("</head>", inject + "</head>", 1)
open(p, "w", encoding="utf-8").write(s)
EOF
echo "built: $(grep -o 'AppEntry-[a-f0-9]*\.js' docs/index.html | head -1)"
