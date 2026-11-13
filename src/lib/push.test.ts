import { describe, expect, it } from "vitest";
import { isKnownPushEndpoint, urlBase64ToUint8Array } from "./push";

describe("isKnownPushEndpoint", () => {
  it("accepts the services browsers use", () => {
    for (const ok of [
      "https://fcm.googleapis.com/fcm/send/abc",
      "https://updates.push.services.mozilla.com/wpush/v2/abc",
      "https://web.push.apple.com/abc",
      "https://wns2-par02p.notify.windows.com/w/?token=abc",
    ])
      expect(isKnownPushEndpoint(ok), ok).toBe(true);
  });

  it("refuses everything else, including look-alikes and internal addresses", () => {
    for (const bad of [
      "http://fcm.googleapis.com/fcm/send/abc", // not https
      "https://fcm.googleapis.com.evil.example/fcm/send/abc",
      "https://evil.example/fcm.googleapis.com",
      "https://user:pass@fcm.googleapis.com/x",
      "https://fcm.googleapis.com:8443/x",
      "https://169.254.169.254/latest/meta-data",
      "https://localhost/x",
      "https://notpush.apple.com.evil.example/x",
      "not a url",
      "",
    ])
      expect(isKnownPushEndpoint(bad), bad).toBe(false);
  });
});

describe("urlBase64ToUint8Array", () => {
  it("decodes URL-safe base64 without padding", () => {
    expect(Array.from(urlBase64ToUint8Array("AQID"))).toEqual([1, 2, 3]);
    expect(Array.from(urlBase64ToUint8Array("-_8"))).toEqual([251, 255]);
  });
});
