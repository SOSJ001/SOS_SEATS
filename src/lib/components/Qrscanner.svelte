<script>
    //@ts-nocheck
  import { onMount, onDestroy } from 'svelte';
  import { Html5Qrcode } from 'html5-qrcode';

  let qrCodeScanner;
  let cameraId;
  let isScanning = false;
  let scanResult = '';
  let on = false;

  const startScanner = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        cameraId = devices[0].id;
        on = !on;
        qrCodeScanner.start(
          { facingMode: "environment" }, // Use facingMode for better compatibility
          {
            fps: 10, // Optional, frames per second for the scanner
            qrbox: 250, // Optional, QR scanning box width
            disableFlip: true // Important for iOS devices
          },
          (decodedText, decodedResult) => {
            // Handle the result
            console.log(`Decoded Text: ${decodedText}`);
            scanResult = decodedText;
            isScanning = false;
            qrCodeScanner.stop();
          },
          (errorMessage) => {
            // parse error, ignore it.
          }
        ).then(() => {
          isScanning = true;
        }).catch((err) => {
          console.error(`Unable to start scanning, error: ${err}`);
        });
      }
    } catch (err) {
      console.error(`Error getting cameras: ${err}`);
    }
  };

  const stopScanner = () => {
    if (on) {
        on = !on;
      qrCodeScanner.stop().then(() => {
        isScanning = false;
      }).catch((err) => {
        console.error(`Error stopping scanner: ${err}`);
      });
    }
  };

  onMount(() => {
    qrCodeScanner = new Html5Qrcode("qr-reader");
  });

  onDestroy(() => {
    stopScanner();
  });
</script>

<style>
  #qr-reader {
    width: 300px;
    height: 300px;
    border: 1px solid #ccc;
    margin: 20px auto;
  }
</style>

<div id="qr-reader"></div>
<button on:click={startScanner} disabled={isScanning}>Start Scanner</button>
<button on:click={stopScanner} disabled={!isScanning}>Stop Scanner</button>
<p>Scan Result: {scanResult}</p>
