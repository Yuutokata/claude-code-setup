const {spawn} = require("child_process");

const sound = {
    darwin: ["afplay", ["/System/Library/Sounds/Glass.aiff"]],
    win32: ["powershell.exe", ["-NoProfile", "-Command", "(New-Object Media.SoundPlayer 'C:/Windows/Media/Windows Notify System Generic.wav').PlaySync()"]],
}[process.platform];

if (sound) spawn(sound[0], sound[1], {stdio: "ignore", detached: true}).unref();