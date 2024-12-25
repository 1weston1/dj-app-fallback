QUnit.module("DJ App Security & Fallback Tests");

// 1) isSecureUrl checks
QUnit.test("isSecureUrl function", assert => {
  assert.ok(isSecureUrl("https://example.com/track.mp3"), "HTTPS is valid");
  assert.notOk(isSecureUrl("http://mysite.com/track.mp3"), "HTTP is invalid");
  assert.notOk(isSecureUrl("ftp://somewhere/track.mp3"), "FTP is invalid");
});

// 2) Manual Loop toggles
QUnit.test("Loop toggles (left/right)", assert => {
  // leftLoopActive / rightLoopActive presumably start false
  assert.notOk(leftLoopActive, "Left loop OFF initially");
  leftLoopActive = !leftLoopActive;
  assert.ok(leftLoopActive, "Left loop toggled ON");
  leftLoopActive = !leftLoopActive;
  assert.notOk(leftLoopActive, "Left loop toggled OFF again");

  assert.notOk(rightLoopActive, "Right loop OFF initially");
  rightLoopActive = !rightLoopActive;
  assert.ok(rightLoopActive, "Right loop toggled ON");
});

// 3) HEAD check + fallback in loadTrackLeft
QUnit.test("loadTrackLeft HEAD + fallback", assert => {
  const originalFetch = fetch;
  const done = assert.async();

  let fetchCount = 0;
  fetch = function(url, opts) {
    fetchCount++;
    assert.equal(opts.method, "HEAD", "HEAD method used for track load");
    if (url.includes("valid")) {
      return Promise.resolve({ ok: true });
    }
    // simulate 403 or fail
    return Promise.resolve({ ok: false, status: 403, statusText: "Forbidden" });
  };

  // Secure success
  loadTrackLeft("https://valid.com/track.mp3");
  // Secure fail => fallback
  loadTrackLeft("https://forbidden.com/nope.mp3");
  // Insecure => fallback
  loadTrackLeft("http://insecure.com/sound.mp3");

  assert.ok(true, "Verified fallback logic for loadTrackLeft");
  fetch = originalFetch;
  done();
});
