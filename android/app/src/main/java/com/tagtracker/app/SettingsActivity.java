package com.tagtracker.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.text.DateFormat;
import java.util.Date;

/**
 * Setup and settings: Google connection, background checking, Google Drive backup,
 * anti-theft sentinel alerts, app lock and Pro license management.
 * Rendered using the modern bundled web interface (web/settings.html).
 */
public class SettingsActivity extends Activity {
    private static final int REQ_SIGN_IN = 1, REQ_UNLOCK = 2, REQ_DRIVE_FILE = 3, REQ_RESTORE = 4, REQ_IMPORT = 5;
    static final String CONTACT_EMAIL = "jamesonabade@gmail.com";

    private WebView web;
    private WebViewAssetLoader loader;
    private boolean autoUnlockAfterSignIn = false;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setTitle(getString(R.string.settings_title));

        loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        setContentView(web);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.setWebChromeClient(new android.webkit.WebChromeClient());
        web.addJavascriptInterface(new SettingsBridge(), "SettingsBridge");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return loader.shouldInterceptRequest(r.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                if ("appassets.androidplatform.net".equals(r.getUrl().getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, r.getUrl()));
                } catch (Exception ignored) {
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                pushState();
            }
        });

        web.loadUrl("https://appassets.androidplatform.net/assets/web/settings.html");
    }

    @Override
    protected void onResume() {
        super.onResume();
        pushState();
    }

    /** Gather all status attributes off the UI thread and push as JSON into the WebView. */
    private void pushState() {
        new Thread(() -> {
            try {
                boolean signedIn = false, unlocked = false;
                String email = "", error = null;
                try {
                    JSONObject a = new JSONObject(TagApp.py(this).callAttr("account_json").toString());
                    signedIn = a.optBoolean("signed_in");
                    unlocked = a.optBoolean("unlocked");
                    email = a.optString("email");
                    error = a.has("error") && !a.isNull("error") ? a.optString("error") : null;
                } catch (Exception e) {
                    error = e.getMessage();
                }

                int interval = TagApp.intervalMinutes(this);
                boolean paused = TagApp.prefs(this).getBoolean(TagApp.KEY_PAUSED, false);
                boolean bgNotify = TagApp.prefs(this).getBoolean(TagApp.KEY_BG_NOTIFY, true);
                boolean isIgnoringBattery = isIgnoringBattery();
                boolean autoDrive = TagApp.prefs(this).getBoolean(TagApp.KEY_DRIVE_AUTO, false);
                boolean guard = TagApp.prefs(this).getBoolean(TagApp.KEY_GUARD, false);
                boolean hasAppLock = TagApp.hasAppLock(this);
                String deviceId = TagApp.deviceId(this);

                boolean pro = false;
                try {
                    JSONObject st = new JSONObject(TagApp.py(this).callAttr("license_state", deviceId).toString());
                    pro = st.optBoolean("licensed");
                } catch (Exception ignored) {
                }

                String driveSummary = readDriveSummary();

                JSONObject s = new JSONObject();
                s.put("signedIn", signedIn);
                s.put("unlocked", unlocked);
                s.put("email", email);
                s.put("error", error != null ? error : JSONObject.NULL);
                s.put("interval", interval);
                s.put("paused", paused);
                s.put("bgNotify", bgNotify);
                s.put("isIgnoringBattery", isIgnoringBattery);
                s.put("autoDrive", autoDrive);
                s.put("driveSummary", driveSummary);
                s.put("guard", guard);
                s.put("hasAppLock", hasAppLock);
                s.put("deviceId", deviceId);
                s.put("pro", pro);

                final String jsonStr = s.toString();
                runOnUiThread(() -> {
                    if (web != null) {
                        web.evaluateJavascript("if (window.updateState) updateState(" + jsonStr + ");", null);
                    }
                });
            } catch (Exception ignored) {
            }
        }).start();
    }

    private String readDriveSummary() {
        try {
            JSONObject s = new JSONObject(TagApp.py(this).callAttr("drive_status_json").toString());
            long last = s.optLong("last_sync", 0);
            String when = last > 0 ? DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT)
                    .format(new Date(last * 1000L)) : getString(R.string.settings_drive_not_yet);
            String line = getString(R.string.settings_drive_summary_line, s.optString("folder"),
                    s.optInt("locations"), s.optString("scope"), when);
            String err = s.isNull("error") ? null : s.optString("error", null);
            if (err != null && !err.isEmpty()) line += getString(R.string.settings_drive_last_error, err);
            return line;
        } catch (Exception e) {
            return getString(R.string.settings_drive_status_unavailable, e.getMessage());
        }
    }

    private boolean isIgnoringBattery() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        return pm != null && pm.isIgnoringBatteryOptimizations(getPackageName());
    }

    @SuppressLint("BatteryLife")
    private void requestIgnoreBattery() {
        try {
            Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:" + getPackageName()));
            startActivity(i);
        } catch (Exception e) {
            startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
        }
    }

    private void startAuth(String mode, int req) {
        Intent i = new Intent(this, GoogleAuthActivity.class);
        i.putExtra(GoogleAuthActivity.EXTRA_MODE, mode);
        startActivityForResult(i, req);
    }

    private void pickDriveFile() {
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("text/csv");
        i.putExtra(Intent.EXTRA_TITLE, "TagTracker-history.csv");
        try {
            startActivityForResult(i, REQ_DRIVE_FILE);
        } catch (Exception e) {
            toast(getString(R.string.toast_no_picker));
        }
    }

    private void pickRestoreFile() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*");
        i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"text/csv", "text/comma-separated-values", "text/plain"});
        try {
            startActivityForResult(i, REQ_RESTORE);
        } catch (Exception e) {
            toast(getString(R.string.toast_no_picker));
        }
    }

    private void toast(String msg) {
        runOnUiThread(() -> Toast.makeText(this, msg, Toast.LENGTH_LONG).show());
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_SIGN_IN && resultCode == RESULT_OK && autoUnlockAfterSignIn) {
            autoUnlockAfterSignIn = false;
            toast(getString(R.string.toast_signed_in_unlock));
            startAuth(GoogleAuthActivity.MODE_UNLOCK, REQ_UNLOCK);
            return;
        }
        if (resultCode != RESULT_OK) {
            autoUnlockAfterSignIn = false;
            return;
        }

        if (requestCode == REQ_DRIVE_FILE && data != null && data.getData() != null) {
            Uri uri = data.getData();
            try {
                getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            } catch (SecurityException ignored) {
            }
            TagApp.prefs(this).edit().putString(TagApp.KEY_DRIVE_URI, uri.toString())
                    .putLong(TagApp.KEY_LAST_BACKUP, 0).apply();
            new Thread(() -> {
                String err = DriveBackup.backupNow(this);
                toast(err == null ? getString(R.string.toast_drive_sync_setup) : "Sync failed: " + err);
                pushState();
            }).start();
        } else if (requestCode == REQ_IMPORT && data != null && data.getData() != null) {
            Uri uri = data.getData();
            new Thread(() -> {
                try {
                    File tmp = new File(getCacheDir(), "import-secrets.json");
                    try (InputStream in = getContentResolver().openInputStream(uri);
                         OutputStream out = new FileOutputStream(tmp)) {
                        byte[] buf = new byte[64 * 1024];
                        int n;
                        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                    }
                    String stateJson = TagApp.py(this).callAttr("import_secrets", tmp.getAbsolutePath()).toString();
                    //noinspection ResultOfMethodCallIgnored
                    tmp.delete();
                    JSONObject st = new JSONObject(stateJson);
                    toast(st.optBoolean("unlocked")
                            ? getString(R.string.settings_import_login_ok)
                            : getString(R.string.settings_import_login_no_keys));
                    pushState();
                } catch (Exception e) {
                    toast(getString(R.string.settings_import_failed, e.getMessage()));
                }
            }).start();
        } else if (requestCode == REQ_RESTORE && data != null && data.getData() != null) {
            Uri uri = data.getData();
            new Thread(() -> {
                try {
                    File tmp = new File(getCacheDir(), "restore.csv");
                    try (InputStream in = getContentResolver().openInputStream(uri);
                         OutputStream out = new FileOutputStream(tmp)) {
                        byte[] buf = new byte[64 * 1024];
                        int n;
                        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                    }
                    int added = TagApp.py(this).callAttr("import_csv", tmp.getAbsolutePath()).toInt();
                    //noinspection ResultOfMethodCallIgnored
                    tmp.delete();
                    toast(getString(R.string.settings_restore_success, added));
                    pushState();
                } catch (Exception e) {
                    toast(getString(R.string.settings_restore_failed, e.getMessage()));
                }
            }).start();
        }
        pushState();
    }

    /** JavaScript Interface bridge exposed to web/settings.html */
    class SettingsBridge {
        @JavascriptInterface
        public void requestInitialState() {
            pushState();
        }

        @JavascriptInterface
        public void startGuidedLogin() {
            runOnUiThread(() -> {
                new Thread(() -> {
                    boolean signedIn = false;
                    try {
                        signedIn = new JSONObject(TagApp.py(SettingsActivity.this).callAttr("account_json").toString())
                                .optBoolean("signed_in");
                    } catch (Exception ignored) {
                    }
                    final boolean fSignedIn = signedIn;
                    runOnUiThread(() -> {
                        autoUnlockAfterSignIn = true;
                        if (fSignedIn) startAuth(GoogleAuthActivity.MODE_UNLOCK, REQ_UNLOCK);
                        else startAuth(GoogleAuthActivity.MODE_SIGN_IN, REQ_SIGN_IN);
                    });
                }).start();
            });
        }

        @JavascriptInterface
        public void startSignIn() {
            runOnUiThread(() -> {
                autoUnlockAfterSignIn = false;
                startAuth(GoogleAuthActivity.MODE_SIGN_IN, REQ_SIGN_IN);
            });
        }

        @JavascriptInterface
        public void startUnlockKeys() {
            runOnUiThread(() -> {
                autoUnlockAfterSignIn = false;
                startAuth(GoogleAuthActivity.MODE_UNLOCK, REQ_UNLOCK);
            });
        }

        @JavascriptInterface
        public void importSecrets() {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "*/*"});
                try {
                    startActivityForResult(i, REQ_IMPORT);
                } catch (Exception e) {
                    toast(getString(R.string.toast_no_picker));
                }
            });
        }

        @JavascriptInterface
        public void setTrackingPaused(boolean paused) {
            TagApp.prefs(SettingsActivity.this).edit().putBoolean(TagApp.KEY_PAUSED, paused).apply();
            if (paused) {
                PollWorker.stop(SettingsActivity.this);
                toast(getString(R.string.toast_tracking_stopped));
            } else {
                PollWorker.schedule(SettingsActivity.this);
                toast(getString(R.string.toast_tracking_resumed));
            }
            pushState();
        }

        @JavascriptInterface
        public void setInterval(int minutes) {
            TagApp.prefs(SettingsActivity.this).edit().putInt(TagApp.KEY_INTERVAL, minutes).apply();
            PollWorker.schedule(SettingsActivity.this);
            pushState();
        }

        @JavascriptInterface
        public void openBatteryActivity() {
            startActivity(new Intent(SettingsActivity.this, BatteryActivity.class));
        }

        @JavascriptInterface
        public void requestIgnoreBattery() {
            runOnUiThread(SettingsActivity.this::requestIgnoreBattery);
        }

        @JavascriptInterface
        public void setBgNotify(boolean on) {
            TagApp.prefs(SettingsActivity.this).edit().putBoolean(TagApp.KEY_BG_NOTIFY, on).apply();
            pushState();
        }

        @JavascriptInterface
        public void setDriveAuto(boolean on) {
            TagApp.prefs(SettingsActivity.this).edit().putBoolean(TagApp.KEY_DRIVE_AUTO, on).apply();
            new Thread(() -> {
                try {
                    TagApp.py(SettingsActivity.this).callAttr("set_drive_default", on);
                    if (on) {
                        int got = TagApp.py(SettingsActivity.this).callAttr("drive_default_restore").toInt();
                        TagApp.py(SettingsActivity.this).callAttr("drive_default_upload");
                        toast(got > 0 ? getString(R.string.settings_sync_pulled, got)
                                : getString(R.string.settings_sync_ready));
                    }
                } catch (Exception e) {
                    toast(getString(R.string.settings_sync_need_google, e.getMessage()));
                }
                pushState();
            }).start();
        }

        @JavascriptInterface
        public void syncDriveNow() {
            new Thread(() -> {
                try {
                    int got = TagApp.py(SettingsActivity.this).callAttr("drive_default_restore").toInt();
                    TagApp.py(SettingsActivity.this).callAttr("drive_default_upload");
                    toast(getString(R.string.settings_synced_drive));
                } catch (Exception e) {
                    toast(getString(R.string.settings_sync_failed, e.getMessage()));
                }
                pushState();
            }).start();
        }

        @JavascriptInterface
        public void verifyDrive() {
            toast(getString(R.string.settings_checking_drive));
            new Thread(() -> {
                try {
                    JSONObject r = new JSONObject(TagApp.py(SettingsActivity.this).callAttr("drive_verify_json").toString());
                    if (!r.optBoolean("ok")) {
                        toast(getString(R.string.settings_drive_cant_read, r.optString("error")));
                        return;
                    }
                    StringBuilder sb = new StringBuilder();
                    sb.append(getString(R.string.settings_drive_folder_label, r.optString("folder")));
                    sb.append(getString(R.string.settings_drive_files_total, r.optInt("count"), r.optLong("bytes") / 1024));
                    JSONArray files = r.optJSONArray("files");
                    if (files == null || files.length() == 0) {
                        sb.append(getString(R.string.settings_drive_empty));
                    } else {
                        for (int i = 0; i < files.length(); i++) {
                            JSONObject f = files.optJSONObject(i);
                            sb.append("• ").append(f.optString("name"))
                                    .append("  (").append(f.optLong("size") / 1024).append(" KB)\n");
                        }
                    }
                    runOnUiThread(() -> new AlertDialog.Builder(SettingsActivity.this)
                            .setTitle(getString(R.string.dialog_drive_title))
                            .setMessage(sb.toString().trim())
                            .setPositiveButton(getString(R.string.dialog_close), null).show());
                } catch (Exception e) {
                    toast(getString(R.string.settings_drive_verify_failed, e.getMessage()));
                }
            }).start();
        }

        @JavascriptInterface
        public void pickDriveFile() {
            runOnUiThread(SettingsActivity.this::pickDriveFile);
        }

        @JavascriptInterface
        public void pickRestoreFile() {
            runOnUiThread(SettingsActivity.this::pickRestoreFile);
        }

        @JavascriptInterface
        public void refreshTags() {
            new Thread(() -> {
                try {
                    JSONArray tags = new JSONArray(TagApp.py(SettingsActivity.this).callAttr("list_tags_json").toString());
                    toast(getString(R.string.settings_tags_found, tags.length()));
                    pushState();
                } catch (Exception e) {
                    toast(getString(R.string.settings_tags_list_error, e.getMessage()));
                }
            }).start();
        }

        @JavascriptInterface
        public void checkLocationsNow() {
            PollWorker.runNow(SettingsActivity.this);
            toast(getString(R.string.toast_checking_find_hub));
        }

        @JavascriptInterface
        public void setSentinel(boolean on) {
            TagApp.prefs(SettingsActivity.this).edit().putBoolean(TagApp.KEY_GUARD, on).apply();
            pushState();
        }

        @JavascriptInterface
        public void setAppLock(String pw, String hint) {
            if (pw == null || pw.length() < 4) {
                toast(getString(R.string.toast_pw_short));
                return;
            }
            TagApp.setAppLock(SettingsActivity.this, pw, hint != null ? hint : "");
            TagApp.appUnlocked = true;
            toast(getString(R.string.toast_applock_set));
            pushState();
        }

        @JavascriptInterface
        public void removeAppLock() {
            TagApp.setAppLock(SettingsActivity.this, null, null);
            toast("Bloqueio por senha removido");
            pushState();
        }

        @JavascriptInterface
        public void copyDeviceId(String text) {
            runOnUiThread(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) {
                    cm.setPrimaryClip(ClipData.newPlainText("Device ID", text));
                    toast("Device ID copiado");
                }
            });
        }

        @JavascriptInterface
        public void requestProEmail() {
            runOnUiThread(() -> {
                String devId = TagApp.deviceId(SettingsActivity.this);
                Intent email = new Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:" + CONTACT_EMAIL));
                email.putExtra(Intent.EXTRA_SUBJECT, getString(R.string.license_email_subject));
                email.putExtra(Intent.EXTRA_TEXT, getString(R.string.license_email_body, devId));
                try {
                    startActivity(Intent.createChooser(email, getString(R.string.license_email_chooser)));
                } catch (Exception e) {
                    toast(getString(R.string.license_no_email_toast, CONTACT_EMAIL));
                }
            });
        }

        @JavascriptInterface
        public void requestProShare() {
            runOnUiThread(() -> {
                String devId = TagApp.deviceId(SettingsActivity.this);
                Intent share = new Intent(Intent.ACTION_SEND);
                share.setType("text/plain");
                share.putExtra(Intent.EXTRA_TEXT, getString(R.string.license_share_text, devId, CONTACT_EMAIL));
                try {
                    startActivity(Intent.createChooser(share, getString(R.string.license_share_chooser)));
                } catch (Exception e) {
                    toast(getString(R.string.license_share_fallback_toast, CONTACT_EMAIL));
                }
            });
        }

        @JavascriptInterface
        public void activateProKey(String key) {
            if (key == null || key.trim().isEmpty()) {
                toast(getString(R.string.license_paste_first));
                return;
            }
            new Thread(() -> {
                try {
                    String devId = TagApp.deviceId(SettingsActivity.this);
                    JSONObject r = new JSONObject(TagApp.py(SettingsActivity.this)
                            .callAttr("activate_license", devId, key.trim()).toString());
                    if (r.optBoolean("ok")) {
                        toast(getString(R.string.license_unlocked_toast));
                    } else {
                        toast(getString(R.string.license_invalid_key_toast, r.optString("reason")));
                    }
                    pushState();
                } catch (Exception e) {
                    toast("Erro: " + e.getMessage());
                }
            }).start();
        }

        @JavascriptInterface
        public void removeProKey() {
            new Thread(() -> {
                try {
                    String devId = TagApp.deviceId(SettingsActivity.this);
                    TagApp.py(SettingsActivity.this).callAttr("remove_license", devId);
                    toast(getString(R.string.license_removed_toast));
                    pushState();
                } catch (Exception e) {
                    toast("Erro: " + e.getMessage());
                }
            }).start();
        }

        @JavascriptInterface
        public void openMap() {
            runOnUiThread(() -> {
                startActivity(new Intent(SettingsActivity.this, MainActivity.class));
                finish();
            });
        }

        @JavascriptInterface
        public void openHelp() {
            runOnUiThread(() -> startActivity(new Intent(SettingsActivity.this, HelpActivity.class)));
        }

        @JavascriptInterface
        public void goBack() {
            runOnUiThread(SettingsActivity.this::finish);
        }
    }
}
