const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export async function playSound(name) {
    try {
        const response = await fetch(`${name}.mp3`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
    } catch (e) {
        console.warn("Sound play failed", e);
    }
}