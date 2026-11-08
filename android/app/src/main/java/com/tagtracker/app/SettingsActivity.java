package com.tagtracker.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.text.DateFormat;
import java.util.Date;

/** Setup and settings: Google connection, background checking, Google Drive backup. */
public class SettingsActivity extends Activity {
    private static final int REQ_SIGN_IN = 1, REQ_UNLOCK = 2, REQ_DRIVE_FILE = 3, REQ_RESTORE = 4, REQ_IMPORT = 5;
    private static final int[] INTERVALS = {15, 30, 60, 120, 240};

    private LinearLayout root;
    private TextView status;
    /** When the user taps the guided "Connect" button, chain straight into the unlock step
     *  after sign-in succeeds, so it feels like a single login. */
    private boolean autoUnlockAfterSignIn = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setTitle(getString(R.string.settings_title));

        ScrollView scroll = new ScrollView(this);
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(20);
        root.setPadding(pad, pad, pad, pad);
        scroll.addView(root);
        setContentView(scroll);

        render();
    }

    @Override
    protected void onResume() {
        super.onResume();
        render();
    }

    private void render() {
        root.removeAllViews();
        TextView loading = new TextView(this);
        loading.setText(getString(R.string.settings_loading));
        loading.setPadding(0, dp(20), 0, 0);
        root.addView(loading);
        // Read the Google auth state OFF the UI thread — Python start can take seconds (avoids ANR).
        new Thread(() -> {
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
            final boolean fSignedIn = signedIn, fUnlocked = unlocked;
            final String fEmail = email, fError = error;
            runOnUiThread(() -> buildUi(fSignedIn, fUnlocked, fEmail, fError));
        }).start();
    }

    private void buildUi(boolean signedIn, boolean unlocked, String email, String error) {
        if (isFinishing() || isDestroyed()) return;
        root.removeAllViews();

        // Welcome / onboarding intro
        TextView welcome = new TextView(this);
        welcome.setText(getString(R.string.settings_welcome));
        welcome.setTextSize(22);
        welcome.setTypeface(welcome.getTypeface(), android.graphics.Typeface.BOLD);
        welcome.setPadding(0, dp(6), 0, dp(2));
        root.addView(welcome);
        note(getString(R.string.settings_intro));

        Button guide = new Button(this);
        guide.setText(getString(R.string.settings_guide_btn));
        guide.setAllCaps(false);
        guide.setOnClickListener(v -> startActivity(new Intent(this, HelpActivity.class)));
        LinearLayout.LayoutParams glp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        glp.bottomMargin = dp(8);
        root.addView(guide, glp);
        progress(signedIn, unlocked);

        heading(getString(R.string.settings_head_1));
        note(getString(R.string.settings_note_1));

        // One guided flow: sign-in, then automatically straight into the unlock step.
        if (!(signedIn && unlocked)) {
            Button connect = new Button(this);
            connect.setText(getString(R.string.settings_connect_guided));
            connect.setAllCaps(false);
            connect.setOnClickListener(v -> {
                autoUnlockAfterSignIn = true;
                if (signedIn) startAuth(GoogleAuthActivity.MODE_UNLOCK, REQ_UNLOCK);
                else startAuth(GoogleAuthActivity.MODE_SIGN_IN, REQ_SIGN_IN);
            });
            LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            clp.topMargin = dp(6);
            root.addView(connect, clp);
            note(getString(R.string.settings_note_individual));
        }

        // Step 1
        info(getString(R.string.settings_step_1_title, (signedIn ? "✓ " : "① "), (signedIn && !email.isEmpty() ? " – " + email : "")));
        button(getString(signedIn ? R.string.settings_signin_again : R.string.settings_signin_google),
                v -> startAuth(GoogleAuthActivity.MODE_SIGN_IN, REQ_SIGN_IN));

        // Step 2
        info(getString(R.string.settings_step_2_title, (unlocked ? "✓ " : "② ")));
        button(getString(unlocked ? R.string.settings_unlock_again : R.string.settings_unlock_keys),
                v -> startAuth(GoogleAuthActivity.MODE_UNLOCK, REQ_UNLOCK));
        if (signedIn && !unlocked) {
            note(getString(R.string.settings_warn_unlocked));
        }
        if (signedIn && unlocked) info(getString(R.string.settings_all_set));
        if (error != null) info("Note: " + error);

        // Option B alternative: import a login file made on a PC (most reliable).
        note(getString(R.string.settings_or));
        note(getString(R.string.settings_option_b));
        button(getString(R.string.settings_import_btn), v -> {
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

        heading(getString(R.string.settings_head_2));
        note(getString(R.string.settings_note_2));
        int interval = TagApp.intervalMinutes(this);
        info(getString(R.string.settings_currently_every, interval));
        LinearLayout rowI = row();
        for (int m : INTERVALS) {
            Button b = chip(getString(R.string.settings_min_suffix, m), v -> {
                TagApp.prefs(this).edit().putInt(TagApp.KEY_INTERVAL, m).apply();
                PollWorker.schedule(this);
                render();
            });
            if (m == interval) b.setEnabled(false);
            rowI.addView(b);
        }
        root.addView(rowI);
        note(getString(R.string.settings_note_interval));
        button(getString(R.string.settings_battery_activity_btn), v -> startActivity(new Intent(this, BatteryActivity.class)));
        if (!isIgnoringBattery()) {
            note(getString(R.string.settings_battery_ignore_note));
            button(getString(R.string.settings_battery_ignore_btn), v -> requestIgnoreBattery());
        } else {
            info(getString(R.string.settings_battery_ignore_ok));
        }
        boolean bgNotify = TagApp.prefs(this).getBoolean(TagApp.KEY_BG_NOTIFY, true);
        info(getString(bgNotify ? R.string.settings_bg_notify_on : R.string.settings_bg_notify_off));
        button(getString(bgNotify ? R.string.settings_bg_notify_hide : R.string.settings_bg_notify_show), v -> {
            TagApp.prefs(this).edit().putBoolean(TagApp.KEY_BG_NOTIFY, !bgNotify).apply();
            render();
        });

        note(getString(R.string.settings_swipe_note));
        boolean paused = TagApp.prefs(this).getBoolean(TagApp.KEY_PAUSED, false);
        if (paused) {
            info(getString(R.string.settings_tracking_stopped));
            button(getString(R.string.settings_resume_tracking), v -> {
                TagApp.prefs(this).edit().putBoolean(TagApp.KEY_PAUSED, false).apply();
                PollWorker.schedule(this);
                toast(getString(R.string.toast_tracking_resumed));
                render();
            });
        } else {
            button(getString(R.string.settings_stop_tracking), v -> {
                TagApp.prefs(this).edit().putBoolean(TagApp.KEY_PAUSED, true).apply();
                PollWorker.stop(this);
                toast(getString(R.string.toast_tracking_stopped));
                render();
            });
        }

        heading(getString(R.string.settings_head_3));
        note(getString(R.string.settings_note_3));

        boolean autoDrive = TagApp.prefs(this).getBoolean(TagApp.KEY_DRIVE_AUTO, false);
        info(getString(autoDrive ? R.string.settings_drive_auto_on : R.string.settings_drive_auto_off));
        button(getString(autoDrive ? R.string.settings_sync_default_now : R.string.settings_use_default_sync), v -> {
            TagApp.prefs(this).edit().putBoolean(TagApp.KEY_DRIVE_AUTO, true).apply();
            new Thread(() -> {
                try {
                    TagApp.py(this).callAttr("set_drive_default", true);
                    int got = TagApp.py(this).callAttr("drive_default_restore").toInt();
                    TagApp.py(this).callAttr("drive_default_upload");
                    toast(got > 0 ? getString(R.string.settings_sync_pulled, got)
                            : getString(R.string.settings_sync_ready));
                } catch (Exception e) {
                    toast(getString(R.string.settings_sync_need_google, e.getMessage()));
                }
                runOnUiThread(this::render);
            }).start();
        });
        if (autoDrive) {
            showDriveSummary();
            button(getString(R.string.settings_see_drive), v -> verifyDrive());
            button(getString(R.string.settings_turn_off_drive_auto), v -> {
                TagApp.prefs(this).edit().putBoolean(TagApp.KEY_DRIVE_AUTO, false).apply();
                new Thread(() -> { try { TagApp.py(this).callAttr("set_drive_default", false); } catch (Exception ignored) {} }).start();
                render();
            });
        }

        note(getString(R.string.settings_or_custom));
        if (DriveBackup.enabled(this)) {
            long last = TagApp.prefs(this).getLong(TagApp.KEY_LAST_BACKUP, 0);
            String lastSyncStr = last > 0
                    ? getString(R.string.settings_last_sync_prefix, DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT).format(new Date(last)))
                    : getString(R.string.settings_no_sync_yet);
            info(getString(R.string.settings_drive_custom_on, lastSyncStr));
            button(getString(R.string.settings_sync_drive_now), v -> new Thread(() -> {
                String err = DriveBackup.backupNow(this);
                toast(err == null ? getString(R.string.settings_synced_drive) : getString(R.string.settings_sync_failed, err));
                runOnUiThread(this::render);
            }).start());
            button(getString(R.string.settings_restore_drive_file), v -> pickRestoreFile());
            button(getString(R.string.settings_choose_diff_file), v -> pickDriveFile());
            button(getString(R.string.settings_turn_off_custom_drive), v -> {
                TagApp.prefs(this).edit().remove(TagApp.KEY_DRIVE_URI).apply();
                render();
            });
        } else {
            button(getString(R.string.settings_choose_drive_file), v -> pickDriveFile());
            button(getString(R.string.settings_restore_drive_file), v -> pickRestoreFile());
        }

        heading(getString(R.string.settings_head_4));
        button(getString(R.string.settings_refresh_tags), v -> new Thread(() -> {
            try {
                JSONArray tags = new JSONArray(TagApp.py(this).callAttr("list_tags_json").toString());
                toast(getString(R.string.settings_tags_found, tags.length()));
            } catch (Exception e) {
                toast(getString(R.string.settings_tags_list_error, e.getMessage()));
            }
        }).start());
        button(getString(R.string.settings_check_loc_now), v -> {
            PollWorker.runNow(this);
            toast(getString(R.string.toast_checking_find_hub));
        });

        heading(getString(R.string.settings_head_5));
        note(getString(R.string.settings_note_5));
        boolean guard = TagApp.prefs(this).getBoolean(TagApp.KEY_GUARD, false);
        info(getString(guard ? R.string.settings_guard_on : R.string.settings_guard_off));
        button(getString(guard ? R.string.settings_guard_turn_off : R.string.settings_guard_turn_on), v -> {
            TagApp.prefs(this).edit().putBoolean(TagApp.KEY_GUARD, !guard).apply();
            render();
        });

        heading(getString(R.string.settings_head_6));
        note(getString(R.string.settings_note_6));
        if (TagApp.hasAppLock(this)) {
            info(getString(R.string.settings_applock_on));
            button(getString(R.string.settings_change_app_pw), v -> showAppLockDialog());
            button(getString(R.string.settings_turn_off_applock), v -> { TagApp.setAppLock(this, null, null); render(); });
        } else {
            button(getString(R.string.settings_set_app_pw), v -> showAppLockDialog());
        }

        heading(getString(R.string.settings_head_legal));
        note(getString(R.string.settings_note_legal));
        button(getString(R.string.settings_read_legal_btn), v -> showLegal());

        status = new TextView(this);
        status.setPadding(0, dp(16), 0, 0);
        root.addView(status);
        button(getString(R.string.settings_open_map), v -> { startActivity(new Intent(this, MainActivity.class)); finish(); });
        button(getString(R.string.settings_help_btn), v -> startActivity(new Intent(this, HelpActivity.class)));
    }

    /** A no-network summary line: folder, last sync, how many locations are stored. The view is
     *  added in place now and its text filled in once the (fast, local) status is read off-thread. */
    private void showDriveSummary() {
        final TextView t = new TextView(this);
        t.setText(getString(R.string.settings_drive_reading));
        t.setTextSize(14);
        t.setPadding(0, dp(4), 0, dp(4));
        root.addView(t);
        new Thread(() -> {
            String line;
            try {
                JSONObject s = new JSONObject(TagApp.py(this).callAttr("drive_status_json").toString());
                long last = s.optLong("last_sync", 0);
                String when = last > 0 ? DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT)
                        .format(new Date(last * 1000L)) : getString(R.string.settings_drive_not_yet);
                line = getString(R.string.settings_drive_summary_line, s.optString("folder"),
                        s.optInt("locations"), s.optString("scope"), when);
                String err = s.isNull("error") ? null : s.optString("error", null);
                if (err != null && !err.isEmpty()) line += getString(R.string.settings_drive_last_error, err);
            } catch (Exception e) {
                line = getString(R.string.settings_drive_status_unavailable, e.getMessage());
            }
            final String fLine = line;
            runOnUiThread(() -> t.setText(fLine));
        }).start();
    }

    /** On-demand proof: ask Google Drive what's actually in TagTracker/history and show the list. */
    private void verifyDrive() {
        toast(getString(R.string.settings_checking_drive));
        new Thread(() -> {
            try {
                JSONObject r = new JSONObject(TagApp.py(this).callAttr("drive_verify_json").toString());
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
                runOnUiThread(() -> new AlertDialog.Builder(this)
                        .setTitle(getString(R.string.dialog_drive_title))
                        .setMessage(sb.toString().trim())
                        .setPositiveButton(getString(R.string.dialog_close), null).show());
            } catch (Exception e) {
                toast(getString(R.string.settings_drive_verify_failed, e.getMessage()));
            }
        }).start();
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

    private void progress(boolean signedIn, boolean unlocked) {
        LinearLayout r = row();
        r.setPadding(0, dp(2), 0, dp(10));
        addStep(r, getString(R.string.settings_step_signin), signedIn);
        addStep(r, getString(R.string.settings_step_unlock), unlocked);
        addStep(r, getString(R.string.settings_step_bg), true);
        root.addView(r);
    }

    private void addStep(LinearLayout r, String label, boolean done) {
        TextView t = new TextView(this);
        t.setText((done ? "✓ " : "○ ") + label);
        t.setTextSize(12);
        t.setPadding(dp(11), dp(6), dp(11), dp(6));
        android.graphics.drawable.GradientDrawable g = new android.graphics.drawable.GradientDrawable();
        g.setCornerRadius(dp(999));
        g.setColor(done ? 0xFF16A34A : 0x1A64748B);
        t.setBackground(g);
        t.setTextColor(done ? 0xFFFFFFFF : 0xFF64748B);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.rightMargin = dp(8);
        r.addView(t, lp);
    }

    private void showLegal() {
        TextView tv = new TextView(this);
        tv.setText(getString(R.string.settings_note_legal));
        tv.setTextSize(13);
        int pad = dp(20);
        tv.setPadding(pad, pad, pad, pad);
        ScrollView sc = new ScrollView(this);
        sc.addView(tv);
        new AlertDialog.Builder(this).setTitle(getString(R.string.dialog_legal_title))
                .setView(sc).setPositiveButton(getString(R.string.dialog_close), null).show();
    }

    private void showAppLockDialog() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(20);
        box.setPadding(pad, pad, pad, 0);
        EditText pw = new EditText(this);
        pw.setHint(getString(R.string.hint_new_pw));
        pw.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD);
        EditText hint = new EditText(this);
        hint.setHint(getString(R.string.hint_recovery));
        box.addView(pw);
        box.addView(hint);
        new AlertDialog.Builder(this)
                .setTitle(getString(R.string.title_set_app_pw))
                .setView(box)
                .setPositiveButton(getString(R.string.dialog_save), (d, w) -> {
                    String p = pw.getText().toString();
                    if (p.length() < 4) { toast(getString(R.string.toast_pw_short)); return; }
                    TagApp.setAppLock(this, p, hint.getText().toString());
                    TagApp.appUnlocked = true;
                    toast(getString(R.string.toast_applock_set));
                    render();
                })
                .setNegativeButton(getString(R.string.dialog_cancel), null)
                .show();
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

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_SIGN_IN && resultCode == RESULT_OK && autoUnlockAfterSignIn) {
            autoUnlockAfterSignIn = false;
            toast(getString(R.string.toast_signed_in_unlock));
            startAuth(GoogleAuthActivity.MODE_UNLOCK, REQ_UNLOCK);
            return;
        }
        if (resultCode != RESULT_OK) { autoUnlockAfterSignIn = false; return; }
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
                runOnUiThread(this::render);
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
                    runOnUiThread(this::render);
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
                } catch (Exception e) {
                    toast(getString(R.string.settings_restore_failed, e.getMessage()));
                }
            }).start();
        }
        render();
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

    private int dp(int v) {
        return (int) (v * getResources().getDisplayMetrics().density);
    }

    private LinearLayout row() {
        LinearLayout r = new LinearLayout(this);
        r.setOrientation(LinearLayout.HORIZONTAL);
        return r;
    }

    private void heading(String text) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(18);
        t.setPadding(0, dp(22), 0, dp(4));
        root.addView(t);
    }

    private void note(String text) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(13);
        t.setPadding(0, 0, 0, dp(8));
        root.addView(t);
    }

    private void info(String text) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(14);
        t.setPadding(0, dp(4), 0, dp(4));
        root.addView(t);
    }

    private void button(String text, View.OnClickListener onClick) {
        Button b = new Button(this);
        b.setText(text);
        b.setAllCaps(false);
        b.setOnClickListener(onClick);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(6);
        root.addView(b, lp);
    }

    private Button chip(String text, View.OnClickListener onClick) {
        Button b = new Button(this);
        b.setText(text);
        b.setAllCaps(false);
        b.setOnClickListener(onClick);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        lp.rightMargin = dp(6);
        b.setLayoutParams(lp);
        return b;
    }

    private void toast(String msg) {
        runOnUiThread(() -> Toast.makeText(this, msg, Toast.LENGTH_LONG).show());
    }
}
