// Runs the photo sharpener's model (see photoSharpen.js) off the page's main thread. Messages:
//   { id, type: "init", bytes }               ->  { id, ok, ep }
//   { id, type: "run", input, width, height } ->  { id, ok, output }   (floats, 4x the size)
import * as ort from "onnxruntime-web";

ort.env.logLevel = "error";
let model = null;   // kept to start again on the processor if the graphics card fails
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
            console.warn("Photo sharpener: graphics card not usable, using the processor", err);
        }
    }
    session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
    ep = "wasm";
};

const run = async (input, width, height) => {
    const out = await session.run({ [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, height, width]) });
    return out[session.outputNames[0]].data;
};

self.onmessage = async ({ data }) => {
    const { id, type } = data;
    try {
        if (type === "init") {
            model = data.bytes;
            await start(true);
            self.postMessage({ id, ok: true, ep });
        } else if (type === "run") {
            let output;
            try {
                output = await run(data.input, data.width, data.height);
            } catch (err) {
                // Some graphics cards open the model but can't run it: use the processor instead.
                if (ep !== "webgpu") throw err;
                console.warn("Photo sharpener: graphics card failed, using the processor", err);
                await start(false);
                output = await run(data.input, data.width, data.height);
            }
            const copy = new Float32Array(output);   // a buffer of our own to hand over
            self.postMessage({ id, ok: true, output: copy, ep }, [copy.buffer]);
        }
    } catch (err) {
        self.postMessage({ id, ok: false, error: String(err?.message || err) });
    }
};
