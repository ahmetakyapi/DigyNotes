#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_NAME="$(basename "$ROOT_DIR")"
TARGET_PORT="4300"
SELF_PID="$$"

command_for_pid() {
  ps -p "$1" -o command= 2>/dev/null || true
}

parent_pid_for() {
  ps -p "$1" -o ppid= 2>/dev/null | tr -d ' ' || true
}

cwd_for_pid() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
}

is_digynotes_process() {
  local pid="$1"
  local command
  local cwd

  command="$(command_for_pid "$pid")"
  cwd="$(cwd_for_pid "$pid")"

  printf '%s\n%s\n' "$command" "$cwd" | grep -Fq "$ROOT_DIR" && return 0
  printf '%s\n%s\n' "$command" "$cwd" | grep -Fqi "$ROOT_NAME" && return 0

  return 1
}

collect_candidate_pids() {
  ps -axo pid=,command= | while read -r pid command; do
    [ -n "$pid" ] || continue
    printf '%s\n' "$command" \
      | grep -Eqi "next dev|next start|node .*next|npm run dev|npm exec next|pnpm dev|bun run dev" \
      || continue

    is_digynotes_process "$pid" && echo "$pid"
  done | sort -u || true
}

collect_listener_pids() {
  lsof -nP -iTCP -sTCP:LISTEN -t 2>/dev/null | sort -u || true
}

collect_digynotes_listener_pids() {
  local pid

  while read -r pid; do
    [ -n "$pid" ] || continue
    is_digynotes_process "$pid" && echo "$pid"
  done < <(collect_listener_pids)

  return 0
}

array_contains() {
  local needle="$1"
  shift

  local value
  for value in "$@"; do
    [ "$value" = "$needle" ] && return 0
  done

  return 1
}

collect_ancestor_pids() {
  local pid="$1"
  local parent_pid

  while [ -n "$pid" ] && [ "$pid" -gt 1 ] 2>/dev/null; do
    echo "$pid"
    parent_pid="$(parent_pid_for "$pid")"
    [ -n "$parent_pid" ] || break
    [ "$parent_pid" = "$pid" ] && break
    pid="$parent_pid"
  done
}

PROTECTED_PIDS="$(collect_ancestor_pids "$SELF_PID" | awk 'NF' | sort -u)"

is_protected_pid() {
  local pid="$1"

  printf '%s\n' "$PROTECTED_PIDS" | grep -Fxq "$pid"
}

collect_process_tree() {
  local -a queue=("$@")
  local -a seen=()
  local index=0
  local pid
  local child

  while [ "$index" -lt "${#queue[@]}" ]; do
    pid="${queue[$index]}"
    index=$((index + 1))
    [ -n "$pid" ] || continue

    array_contains "$pid" "${seen[@]}" && continue
    seen+=("$pid")

    while read -r child; do
      [ -n "$child" ] || continue
      array_contains "$child" "${queue[@]}" || queue+=("$child")
    done < <(pgrep -P "$pid" 2>/dev/null || true)
  done

  printf '%s\n' "${seen[@]}" | awk 'NF' | sort -u
}

stop_pids() {
  local pid_list="$1"
  local pid
  local survivors=""

  [ -n "$pid_list" ] || return 0

  echo "Durdurulacak PID'ler: $(printf '%s\n' "$pid_list" | xargs)"
  printf '%s\n' "$pid_list" | xargs kill -TERM 2>/dev/null || true
  sleep 2

  while read -r pid; do
    [ -n "$pid" ] || continue
    kill -0 "$pid" 2>/dev/null && survivors="$survivors $pid"
  done < <(printf '%s\n' "$pid_list")

  if [ -n "$survivors" ]; then
    echo "Yanıt vermeyen süreçler zorla kapatılıyor: $(printf '%s\n' "$survivors" | xargs)"
    kill -KILL $survivors 2>/dev/null || true
    sleep 1
  fi
}

collect_target_pids() {
  {
    collect_candidate_pids
    collect_digynotes_listener_pids
  } | while read -r pid; do
    [ -n "$pid" ] || continue
    is_protected_pid "$pid" && continue
    echo "$pid"
  done | awk 'NF' | sort -u || true
}

echo "DigyNotes süreçleri taranıyor..."
TARGET_PIDS="$(collect_target_pids)"

if [ -n "$TARGET_PIDS" ]; then
  PROCESS_TREE_PIDS="$(collect_process_tree $TARGET_PIDS)"
  stop_pids "$PROCESS_TREE_PIDS"
fi

PORT_PIDS="$(lsof -nP -tiTCP:"$TARGET_PORT" -sTCP:LISTEN 2>/dev/null | sort -u || true)"

if [ -n "$PORT_PIDS" ]; then
  for pid in $PORT_PIDS; do
    if is_digynotes_process "$pid"; then
      echo "Port $TARGET_PORT üzerinde DigyNotes süreci bulundu, durduruluyor: $pid"
      kill -TERM "$pid" 2>/dev/null || true
    else
      echo "Port $TARGET_PORT şu anda başka bir uygulama tarafından kullanılıyor:"
      command_for_pid "$pid"
      exit 1
    fi
  done
  sleep 1
fi

echo "Cache temizleniyor..."
rm -rf "$ROOT_DIR/.next" "$ROOT_DIR/node_modules/.cache"

echo "DigyNotes localhost:$TARGET_PORT üzerinde başlatılıyor..."
cd "$ROOT_DIR"
exec "$ROOT_DIR/node_modules/.bin/next" dev --port "$TARGET_PORT"
