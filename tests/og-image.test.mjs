import assert from "node:assert/strict";
import test from "node:test";

import { isPrivateAddress, isPublicImageUrl } from "../src/lib/og-image.ts";

test("isPublicImageUrl accepts public http(s) hosts on default ports", () => {
  assert.equal(isPublicImageUrl("https://image.tmdb.org/t/p/w500/a.jpg"), true);
  assert.equal(isPublicImageUrl("http://covers.openlibrary.org/b/id/1-L.jpg"), true);
  assert.equal(isPublicImageUrl("https://example.com:443/a.png"), true);
  assert.equal(isPublicImageUrl("http://example.com:80/a.png"), true);
  assert.equal(isPublicImageUrl("https://example.com./a.png"), true);
});

test("isPublicImageUrl rejects other schemes, ports and internal names", () => {
  assert.equal(isPublicImageUrl("ftp://example.com/a.png"), false);
  assert.equal(isPublicImageUrl("file:///etc/passwd"), false);
  assert.equal(isPublicImageUrl("http://127.0.0.1.nip.io:9001/x"), false);
  assert.equal(isPublicImageUrl("https://example.com:8443/a.png"), false);
  assert.equal(isPublicImageUrl("http://localhost/a.png"), false);
  assert.equal(isPublicImageUrl("http://localhost./a.png"), false);
  assert.equal(isPublicImageUrl("http://foo.localhost./a.png"), false);
  assert.equal(isPublicImageUrl("http://db.internal/a.png"), false);
  assert.equal(isPublicImageUrl("http://printer.local./a.png"), false);
  assert.equal(isPublicImageUrl("http://169.254.169.254/latest"), false);
  assert.equal(isPublicImageUrl("http://[::1]/a.png"), false);
  assert.equal(isPublicImageUrl("http://intranet/a.png"), false);
  assert.equal(isPublicImageUrl("not a url"), false);
});

test("isPrivateAddress flags loopback, private, link-local and reserved IPv4", () => {
  for (const ip of [
    "0.0.0.0",
    "10.0.0.5",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "100.64.0.1",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
  ]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "172.32.0.1", "100.128.0.1", "151.101.1.1", "198.20.0.1"]) {
    assert.equal(isPrivateAddress(ip), false, ip);
  }
});

test("isPrivateAddress allows only global unicast IPv6", () => {
  for (const ip of [
    "::",
    "::1",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "ff02::1",
    "64:ff9b::7f00:1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
  ]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  for (const ip of ["2606:4700::6810:84e5", "2a00:1450:4001:82a::200e", "::ffff:8.8.8.8"]) {
    assert.equal(isPrivateAddress(ip), false, ip);
  }
  assert.equal(isPrivateAddress("not-an-ip"), true);
});
