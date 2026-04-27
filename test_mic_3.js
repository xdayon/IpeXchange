import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    args: [
      '--no-sandbox', 
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ] 
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(msg.text()));
  
  await page.evaluate(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options = {};
      const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/aac'];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
          options.mimeType = type;
          break;
        }
      }
      console.log("Options:", JSON.stringify(options));
      const mediaRecorder = new MediaRecorder(stream, options);
      console.log("Recorder created successfully!");
      mediaRecorder.start(1000);
      console.log("Recorder started!");
    } catch (err) {
      console.log("ERROR:", err.message);
    }
  });
  
  await browser.close();
})();
