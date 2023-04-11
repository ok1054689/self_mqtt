const Gpio = require('onoff').Gpio;
const led = new Gpio(198, 'out');


setInterval(() => {
    const value = led.readSync() ^ 1; // 切换 GPIO 值（异或运算）
    led.writeSync(value); // 将新值写入 GPIO
  }, 1000);