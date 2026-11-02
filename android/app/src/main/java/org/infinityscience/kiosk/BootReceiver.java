package org.infinityscience.kiosk;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Opens the app when the kiosk starts up, even if another Home app is chosen.
 * Android only lets a device owner start a screen from the background like this,
 * so on a kiosk without the kiosk lock this does nothing (the Home app setting
 * still opens the app at startup).
 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;
        if (!KioskLock.isDeviceOwner(context)) return;
        Intent open = new Intent(context, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(open);
    }
}
