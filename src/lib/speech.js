
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { isDevice } from "./store/index.js";

export async function speak(text) {
    const message = String(text ?? "").trim();

    if (!message) return;

    // Use native text-to-speech on the Android kiosk.
    if (isDevice) {
        await TextToSpeech.stop();

        await TextToSpeech.speak({
            text: message,
            lang: "en-US",
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            queueStrategy: 0,
        });

        return;
    }

    // Use browser speech during web development.
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    await new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(message);

        utterance.lang = "en-US";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = resolve;
        utterance.onerror = (event) => {
            // Cancellation is expected when speech is stopped.
            if (event.error === "canceled" || event.error === "interrupted") {
                resolve();
            } else {
                reject(new Error(`Speech failed: ${event.error}`));
            }
        };

        window.speechSynthesis.speak(utterance);
    });
}

export async function stop() {
    if (isDevice) {
        await TextToSpeech.stop();
        return;
    }

    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}
