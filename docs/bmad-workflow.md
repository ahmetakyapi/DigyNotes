# BMAD Workflow

Bu projeye BMAD Method v6 kuruldu. BMAD kaynakları proje içinde tutulur ve bundan sonraki ekleme/düzenleme işlerinde mümkün olduğunca bu akış baz alınır.

## Kurulu BMAD Kaynakları

- Çekirdek ve workflow dosyaları: `_bmad/`
- Claude Code komutları: `.claude/commands/bmad-*.md`
- Proje bilgisi / kalıcı dokümantasyon: `docs/`
- Planlama çıktıları: `planning-artifacts/`
- Uygulama / sprint çıktıları: `implementation-artifacts/`

## Varsayılan Çalışma Biçimi

Küçük ve orta ölçekli değişikliklerde:

1. Önce kısa teknik kapsam çıkarılır.
2. Gerekirse `planning-artifacts/` altına kısa bir spec bırakılır.
3. Ardından implementasyon yapılır.
4. Son olarak kod gözden geçirilir ve eksik test/risk not edilir.

Bu iş için esas alınacak BMAD akışları:

- Hızlı kapsam/spec: `_bmad/bmm/workflows/bmad-quick-flow/quick-spec/workflow.md`
- Hızlı implementasyon: `_bmad/bmm/workflows/bmad-quick-flow/quick-dev/workflow.md`
- Kod inceleme: `_bmad/bmm/workflows/4-implementation/code-review/workflow.yaml`

Daha büyük özelliklerde önerilen sıra:

1. Product brief
2. PRD
3. UX design
4. Architecture
5. Epics and stories
6. Sprint planning
7. Story implementation

## Bu Proje İçin Notlar

- Kalıcı proje bilgisi `docs/` altında tutulmalı.
- Planlama dokümanları `planning-artifacts/` altında tutulmalı.
- Sprint/story çıktıları `implementation-artifacts/` altında tutulmalı.
- Mevcut proje kuralları için `CLAUDE.md` ve `ERRORS.md` hâlâ geçerli.
- BMAD kuralları, mevcut DigyNotes mimari ve UI kurallarının yerine geçmez; onları tamamlar.

## Claude Code Kullanımı

Claude Code içinde BMAD komutları doğrudan kullanılabilir:

- `/bmad-help`
- `/bmad-bmm-quick-spec`
- `/bmad-bmm-quick-dev`
- `/bmad-bmm-code-review`

Codex içinde çalışırken de aynı workflow dosyaları doğrudan okunup izlenebilir.
