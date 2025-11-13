#!/bin/sh
set -e

echo ""
echo "  ____   ___   __   __     __   ____  "
echo " / ___) / __) / _\ (  )   / _\ (  _ \ "
echo " \___ \( (__ /    \/ (_/\/    \ )   / "
echo " (____/ \___)\_/\_/\____/\_/\_/(__\_) "
echo ""

cd ./packages

CURRENT=$(pwd)
echo "CURRENT: $CURRENT"

disallowed=("cli/", "scalar.aspnetcore/", "scalar_fastapi/")

# Loop over directories and pack
pwd
for dir in */ ; do
  if [[ ${disallowed[@]} =~ $dir ]]
  then
    echo "$dir cannot be packaged"
  else
    cd "$CURRENT/$dir"
    if [ -f './package.json' ]; then
      rm -f ./*.tgz
      pnpm pack
      file=$(ls *.tgz)
      mv "$file" "${file%-*}.tgz"
    else
      echo "$dir cannot be packaged"
    fi
  fi
done

echo "All packages have been packed"
