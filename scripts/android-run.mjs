// Builds the debug app, installs it on a connected Android device or emulator
// and opens it.
//
//   npm run android:run   full offline build, exactly as the kiosk runs it
//   npm run android:dev   live reload: the app loads its screens from this
//                         computer's dev server, so saved changes show up
//                         on the device without rebuilding
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join, resolve } from "node:path";

const live = process.argv.includes("--live");
const PORT = 5173;

// Anything else is passed on to Capacitor, for example to skip the device
// question: npm run android:run -- --target emulator-5554
const extra = process.argv.slice(2).filter((arg) => arg !== "--live").join(" ");

// Gradle needs Java. Android Studio ships its own copy, so use that unless
// JAVA_HOME already points somewhere.
function useAndroidStudioJava() {
  if (process.env.JAVA_HOME) return;
  const candidates = [
    join(process.env.ProgramFiles ?? "C:\\Program Files", "Android", "Android Studio", "jbr"),
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home",
    "/opt/android-studio/jbr",
    join(homedir(), "android-studio", "jbr"),
  ];
  const found = candidates.find((dir) => existsSync(dir));
  if (found) process.env.JAVA_HOME = found;
}

function run(command) {
  const result = spawnSync(command, { stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function stop(child) {
  if (child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill();
  }
}

useAndroidStudioJava();

// Capacitor starts Gradle as plain "gradlew", which some Windows setups refuse
// to look for in the current folder. Putting android/ on the PATH covers that.
const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
process.env[pathKey] = `${resolve("android")}${delimiter}${process.env[pathKey] ?? ""}`;

if (!live) {
  run("npm run build");
  run(`npx cap run android ${extra}`);
  process.exit(0);
}

// Capacitor copies the built web app into the Android project even in live
// reload mode, so there has to be one.
if (!existsSync("dist")) run("npm run build");

console.log("\nLive reload: the app will load from this computer's dev server.");
console.log("Keep the device plugged in (or the emulator open). Press Ctrl+C to stop.\n");

// The device reaches the dev server through the USB/adb connection
// (--forwardPorts), so it works without Wi-Fi and on the emulator.
const server = spawn("npm run dev:host", { stdio: "inherit", shell: true });
const app = spawn(
  `npx cap run android --live-reload --host localhost --port ${PORT} --forwardPorts ${PORT}:${PORT} ${extra}`,
  { stdio: "inherit", shell: true },
);

app.on("exit", (code) => {
  stop(server);
  process.exit(code ?? 0);
});
server.on("exit", (code) => {
  stop(app);
  process.exit(code ?? 0);
});
