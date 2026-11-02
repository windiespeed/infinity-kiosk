package org.infinityscience.kiosk;

import android.app.Activity;
import android.content.Intent;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Lets Admin → Settings show and change the kiosk lock (src/lib/kioskLock.js). */
@CapacitorPlugin(name = "KioskLock")
public class KioskLockPlugin extends Plugin {
    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void unlock(PluginCall call) {
        run(call, () -> KioskLock.unlock(getActivity()));
    }

    @PluginMethod
    public void lock(PluginCall call) {
        run(call, () -> KioskLock.lock(getActivity()));
    }

    @PluginMethod
    public void remove(PluginCall call) {
        run(call, () -> KioskLock.remove(getActivity()));
    }

    /**
     * Opens Android's Settings app, so staff can get out of the kiosk app (for example to
     * change the Home app) on a kiosk where Android's bars can't be swiped in. While the
     * kiosk lock is on, staff unlock for maintenance first.
     */
    @PluginMethod
    public void openAndroidSettings(PluginCall call) {
        Activity activity = getActivity();
        if (KioskLock.isDeviceOwner(activity) && !KioskLock.inMaintenance()) {
            call.reject("Tap Unlock for maintenance first.");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                // A pinned app (Android's own screen pinning) can't open other apps. Try to
                // unpin; Android may refuse, and then staff unpin by hand.
                if (KioskLock.isLocked(activity)) {
                    try {
                        activity.stopLockTask();
                    } catch (RuntimeException ignored) {
                        // Still pinned.
                    }
                }
                Intent intent = new Intent(Settings.ACTION_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(intent);
                call.resolve(status());
            } catch (RuntimeException e) {
                call.reject(e.getMessage(), e);
            }
        });
    }

    // Lock task calls belong on the screen's own thread.
    private void run(PluginCall call, Runnable action) {
        Activity activity = getActivity();
        activity.runOnUiThread(() -> {
            try {
                action.run();
                call.resolve(status());
            } catch (RuntimeException e) {
                call.reject(e.getMessage(), e);
            }
        });
    }

    private JSObject status() {
        JSObject result = new JSObject();
        result.put("deviceOwner", KioskLock.isDeviceOwner(getContext()));
        result.put("locked", KioskLock.isLocked(getContext()));
        result.put("maintenance", KioskLock.inMaintenance());
        return result;
    }
}
