package com.tagtracker.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** A single, low-priority notification that reports the latest background check / Drive sync. */
final class Notify {
    private static final String CHANNEL = "sync";
    private static final String CHANNEL_ALERT = "theft";
    private static final int ID = 1;

    private Notify() {}

    private static NotificationManager mgr(Context ctx) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
            if (nm.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL, ctx.getString(R.string.notification_channel_sync),
                        NotificationManager.IMPORTANCE_LOW); // low = no sound, minimal battery
                ch.setDescription(ctx.getString(R.string.notification_channel_sync_desc));
                nm.createNotificationChannel(ch);
            }
            if (nm.getNotificationChannel(CHANNEL_ALERT) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL_ALERT, ctx.getString(R.string.notification_channel_theft),
                        NotificationManager.IMPORTANCE_HIGH); // loud: this is the important one
                ch.setDescription(ctx.getString(R.string.notification_channel_theft_desc));
                nm.createNotificationChannel(ch);
            }
        }
        return nm;
    }

    /** Loud alert when a guarded tag moves. Actions: open the map, open Maps, or ring the tag. */
    static void theftAlert(Context ctx, String deviceId, String name, int movedM, double lat, double lon) {
        NotificationManager nm = mgr(ctx);
        if (nm == null) return;
        int rc = Math.abs(name.hashCode());
        PendingIntent open = PendingIntent.getActivity(ctx, rc, new Intent(ctx, MainActivity.class),
                PendingIntent.FLAG_IMMUTABLE);
        Intent maps = new Intent(Intent.ACTION_VIEW,
                android.net.Uri.parse("https://www.google.com/maps?q=" + lat + "," + lon));
        PendingIntent mapsPi = PendingIntent.getActivity(ctx, rc + 1, maps, PendingIntent.FLAG_IMMUTABLE);
        Intent ring = new Intent(ctx, RingReceiver.class).putExtra(RingReceiver.EXTRA_DEVICE, deviceId);
        PendingIntent ringPi = PendingIntent.getBroadcast(ctx, rc + 2, ring,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? new Notification.Builder(ctx, CHANNEL_ALERT)
                : new Notification.Builder(ctx).setPriority(Notification.PRIORITY_HIGH);
        Notification n = b.setContentTitle(ctx.getString(R.string.theft_alert_title, name))
                .setContentText(ctx.getString(R.string.theft_alert_text, movedM))
                .setSmallIcon(R.drawable.ic_launcher)
                .setContentIntent(open)
                .addAction(new Notification.Action.Builder(R.drawable.ic_launcher, ctx.getString(R.string.action_ring_tag), ringPi).build())
                .addAction(new Notification.Action.Builder(R.drawable.ic_launcher, ctx.getString(R.string.action_open_maps), mapsPi).build())
                .setAutoCancel(true)
                .build();
        try {
            nm.notify(1000 + rc % 1000, n);
        } catch (SecurityException ignored) {
        }
    }

    static void syncStatus(Context ctx, String text, boolean ongoing) {
        NotificationManager nm = mgr(ctx);
        if (nm == null) return;
        PendingIntent tap = PendingIntent.getActivity(ctx, 0, new Intent(ctx, MainActivity.class),
                PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? new Notification.Builder(ctx, CHANNEL)
                : new Notification.Builder(ctx);
        Notification n = b.setContentTitle(ctx.getString(R.string.notification_running_title))
                .setContentText(text)
                .setSmallIcon(R.drawable.ic_launcher)
                .setContentIntent(tap)
                .setOnlyAlertOnce(true)
                .setOngoing(ongoing)   // ongoing = a persistent "active in background" indicator
                .build();
        try {
            nm.notify(ID, n);
        } catch (SecurityException ignored) {
            // POST_NOTIFICATIONS not granted (Android 13+); silently skip.
        }
    }
}
