#!/bin/bash

# Garantir que começamos limpos
rm -rf docs
rm -rf site

# Criar estrutura temporária
mkdir -p docs
cp README.md docs/index.md
for dir in */; do
  dir=${dir%/}
  if [ "$dir" != "docs" ] && [ "$dir" != "site" ]; then
    cp -r "$dir" docs/
  fi
done

# Garantir a limpeza quando o script for encerrado (Ctrl+C)
cleanup() {
  echo ""
  echo "Limpando diretórios temporários..."
  rm -rf docs site
  exit 0
}
trap cleanup INT TERM EXIT

# Iniciar o servidor local
python3 -m mkdocs serve
