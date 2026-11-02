package org.infinityscience.kiosk;

import android.app.Activity;
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
