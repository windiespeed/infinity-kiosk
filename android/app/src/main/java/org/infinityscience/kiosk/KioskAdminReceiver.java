package org.infinityscience.kiosk;

import android.app.admin.DeviceAdminReceiver;

/**
 * Makes the app eligible to be the kiosk's device owner, which is what lets it lock
 * the kiosk to itself (see KioskLock). Set once with adb:
 *   adb shell dpm set-device-owner org.infinityscience.kiosk/.KioskAdminReceiver
 */
public class KioskAdminReceiver extends DeviceAdminReceiver {}
