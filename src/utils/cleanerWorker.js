// Runs the photo cleaner's model (see bagCutout.js) off the page's main thread, so the admin
// page stays responsive while photos are being cleaned. Messages:
//   { id, type: "init", bytes, skipGpu }  ->  { id, ok, ep }
//   { id, type: "run", input }            ->  { id, ok, mask }   (1024×1024 floats, 0..1)
import * as ort from "onnxruntime-web";

ort.env.logLevel = "error";
const SIZE = 1024;
let model = null;   // the model file, kept to start again on the processor if the GPU fails
let session = null;
let ep = null;

const start = async (useGpu) => {
    await session?.release?.().catch(() => {});
    session = null;
    const gpu = useGpu && self.navigator?.gpu && await self.navigator.gpu.requestAdapter().catch(() => null);
    if (gpu) {
        try {
            session = await ort.InferenceSession.create(model, { executionProviders: ["webgpu"] });
            ep = "webgpu";
            return;
        } catch (err) {
            console.warn("Photo cleaner: graphics card not usable, using the processor", err);
        }
    }
    session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
    ep = "wasm";
};

const run = async (input) => {
    const out = await session.run({ [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, SIZE, SIZE]) });
    return out[session.outputNames[0]].data;   // the first output is the finest mask
};

self.onmessage = async ({ data }) => {
    const { id, type } = data;
    try {
        if (type === "init") {
            model = data.bytes;
            await start(!data.skipGpu);
            self.postMessage({ id, ok: true, ep });
        } else if (type === "run") {
            let mask;
            try {
                mask = await run(data.input);
            } catch (err) {
                // Some graphics cards open the model but can't run it: use the processor instead.
                if (ep !== "webgpu") throw err;
                console.warn("Photo cleaner: graphics card failed, using the processor", err);
                await start(false);
                mask = await run(data.input);
            }
            const copy = new Float32Array(mask);   // a buffer of our own to hand over
            self.postMessage({ id, ok: true, mask: copy, ep }, [copy.buffer]);
        }
    } catch (err) {
        self.postMessage({ id, ok: false, error: String(err?.message || err) });
    }
};
