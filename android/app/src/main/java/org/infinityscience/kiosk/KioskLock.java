package org.infinityscience.kiosk;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;

/**
 * The kiosk lock (Android "lock task mode"). Once the app is the device owner
 * (docs/KIOSK-LOCK.md), it:
 * - is always the Home app, so it opens at startup and Home returns to it
 * - pins itself: no status bar, notifications, Home or Recents buttons, and no
 *   power menu, so visitors can't leave it or reach Android's settings
 * - skips the lock screen
 * Staff unlock it for maintenance from Admin → Settings (until "Lock again" or the
 * next restart), or remove the lock there for good.
 * Without device owner, nothing here does anything and the app works as before.
 */
final class KioskLock {
    // Set by "Unlock for maintenance". Not saved, so a restart always locks again.
    private static boolean maintenance = false;

    private KioskLock() {}

    static boolean isDeviceOwner(Context context) {
        DevicePolicyManager dpm = context.getSystemService(DevicePolicyManager.class);
        return dpm != null && dpm.isDeviceOwnerApp(context.getPackageName());
    }

    static boolean isLocked(Context context) {
        ActivityManager am = context.getSystemService(ActivityManager.class);
        return am != null && am.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE;
    }

    static boolean inMaintenance() {
        return maintenance;
    }

    private static ComponentName admin(Context context) {
        return new ComponentName(context, KioskAdminReceiver.class);
    }

    /** Called whenever the app comes to the front. */
    static void apply(Activity activity) {
        if (maintenance || !isDeviceOwner(activity)) return;
        DevicePolicyManager dpm = activity.getSystemService(DevicePolicyManager.class);
        ComponentName admin = admin(activity);

        dpm.setLockTaskPackages(admin, new String[] { activity.getPackageName() });
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            dpm.setLockTaskFeatures(admin, DevicePolicyManager.LOCK_TASK_FEATURE_NONE);
        }
        IntentFilter home = new IntentFilter(Intent.ACTION_MAIN);
        home.addCategory(Intent.CATEGORY_HOME);
        home.addCategory(Intent.CATEGORY_DEFAULT);
        dpm.addPersistentPreferredActivity(admin, home, new ComponentName(activity, MainActivity.class));
        dpm.setKeyguardDisabled(admin, true);

        if (!isLocked(activity)) activity.startLockTask();
    }

    /** Staff maintenance: Android works normally until lock() or the next restart. */
    static void unlock(Activity activity) {
        maintenance = true;
        if (!isDeviceOwner(activity)) return;
        DevicePolicyManager dpm = activity.getSystemService(DevicePolicyManager.class);
        // Let Home reach Android's own launcher, so staff can open Files to install an update.
        dpm.clearPackagePersistentPreferredActivities(admin(activity), activity.getPackageName());
        if (isLocked(activity)) activity.stopLockTask();
    }

    static void lock(Activity activity) {
        maintenance = false;
        apply(activity);
    }

    /** Removes the kiosk lock for good. Setting it up again needs adb (docs/KIOSK-LOCK.md). */
    static void remove(Activity activity) {
        maintenance = true;
        if (!isDeviceOwner(activity)) return;
        DevicePolicyManager dpm = activity.getSystemService(DevicePolicyManager.class);
        ComponentName admin = admin(activity);
        if (isLocked(activity)) activity.stopLockTask();
        dpm.clearPackagePersistentPreferredActivities(admin, activity.getPackageName());
        dpm.setKeyguardDisabled(admin, false);
        dpm.setLockTaskPackages(admin, new String[0]);
        // Deprecated for new apps, but still how a device owner removes itself.
        dpm.clearDeviceOwnerApp(activity.getPackageName());
    }
}
