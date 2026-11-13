# Experimental live tracking (Tag Tracker)

This branch adds an opt-in **Live (experimental)** control beside the existing Locate action.

- Works on the Android WebView and the browser/server interface.
- Queries the selected tag through the existing GoogleFindMyTools request, decrypts any reports and refreshes the saved history/map.
- Shows the source report timestamp, and only calls a position **new** when the Google report's timestamp advances.
- Moves the map to the newest tag position when a genuinely newer report appears.
- Waits **at least 30 seconds after each request completes** before sending another; never overlaps its own live requests.
- Stops automatically when the map is hidden/backgrounded, the tag is changed, the user presses Stop, 30 minutes elapse, or three consecutive requests fail.
- Live Android requests have a separate asynchronous JavaScript bridge callback so a request does not appear finished before Python returns.
- Does not alter Android WorkManager polling, Google account authentication, stored location schema or history exports.

## What this is not

This is **not** continuous GPS tracking, Bluetooth ranging, or a guaranteed realtime stream. Google's unofficial API might send duplicate/old positions or not provide a fresh report at all. The user is responsible for using the experimental feature only for their own devices, and should avoid running repeated live queries unnecessarily.

## Manual verification on Android

1. Install an APK built from this branch in a compatible signing environment (keep the regular installed version if unsure).
2. Open a tag in the map and tap **Ao vivo (experimental)**.
3. Check the displayed report time. If Google returns the same timestamp, the status must say **Sem nova posição**, not claim movement.
4. Verify that a newer report updates the marker, history and follow position; the existing origin filters continue to work.
5. Tap **Parar ao vivo**: no additional requests should be scheduled.
6. Repeat and background the app, switch tags, or leave the map: live mode should stop.
7. Verify the usual background polling still works with live mode disabled.
8. Switch the UI language between Portuguese and English and verify live labels/status change.

No Android build or on-device end-to-end test was run while preparing this branch.
