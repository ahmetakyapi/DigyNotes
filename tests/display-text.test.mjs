import assert from "node:assert/strict";
import test from "node:test";

import { formatDisplaySentence, formatDisplayTitle } from "../src/lib/display-text.ts";

test("formatDisplayTitle trims and title-cases Turkish strings", () => {
  assert.equal(formatDisplayTitle("  İSTANBUL hatırası "), "İstanbul Hatırası");
  assert.equal(formatDisplayTitle("the-last OF us"), "The-Last of Us");
});

test("formatDisplayTitle keeps what the author typed on purpose", () => {
  assert.equal(formatDisplayTitle("AION 2"), "AION 2");
  assert.equal(formatDisplayTitle("D.I.S.C.O."), "D.I.S.C.O.");
  assert.equal(formatDisplayTitle("EA Sports FC 27"), "EA Sports FC 27");
  assert.equal(formatDisplayTitle("NCSoft"), "NCSoft");
  assert.equal(formatDisplayTitle("Kotor ve Budva"), "Kotor ve Budva");
  assert.equal(formatDisplayTitle("A Knight of the Seven Kingdoms"), "A Knight of the Seven Kingdoms");
  assert.equal(formatDisplayTitle("ırmak ile deniz"), "Irmak ile Deniz");
});

test("formatDisplaySentence capitalises sentences and calms shouting", () => {
  assert.equal(
    formatDisplaySentence("  bu bir DENEMEDİR. ikinci CÜMLE!  "),
    "Bu bir denemedir. İkinci cümle!"
  );
});

test("formatDisplaySentence keeps names and acronyms", () => {
  assert.equal(
    formatDisplaySentence("Insomniac, Wolverine'i sert yapmış. MMO'lardaki en güzel his, HBO'da."),
    "Insomniac, Wolverine'i sert yapmış. MMO'lardaki en güzel his, HBO'da."
  );
});

test("display helpers capitalise accented Latin letters at the first letter", () => {
  assert.equal(formatDisplayTitle("élite"), "Élite");
  assert.equal(formatDisplayTitle("Élite"), "Élite");
  assert.equal(formatDisplayTitle("Ólafur Arnalds"), "Ólafur Arnalds");
  assert.equal(formatDisplayTitle("âşık veysel"), "Âşık Veysel");
  assert.equal(formatDisplayTitle("Ñu"), "Ñu");
  assert.equal(
    formatDisplaySentence("élite bir dizi. ölmeden önce izle."),
    "Élite bir dizi. Ölmeden önce izle."
  );
});
