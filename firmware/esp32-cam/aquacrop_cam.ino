/*
  ===================================================================================
  AquaCrop ESP32-CAM Field Visual Monitoring Node
  Hardware: ESP32-CAM (AI-Thinker OV2640 Camera Board)
  Features: Live HTTP JPEG Frame Capture Stream & Periodic Snapshot Upload to Backend
  ===================================================================================
*/

#include <WiFi.h>
#include <esp_camera.h>
#include <HTTPClient.h>

// ===================================================================================
// AI-THINKER CAMERA PIN CONFIGURATION
// ===================================================================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define FLASH_LED_PIN      4 // Onboard Bright Flash LED

// ===================================================================================
// NETWORK & AQUACROP API CONFIGURATION
// ===================================================================================
const char* WIFI_SSID    = "Your_WiFi_SSID";
const char* WIFI_PASS    = "Your_WiFi_Password";
const char* API_HOST     = "http://10.227.62.41:8000";
const char* HARDWARE_ID  = "esp32-cam-01";
const char* DEVICE_TOKEN = "esp32-demo-token";

void setup() {
  Serial.begin(115200);
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW); // Flash OFF

  Serial.println("\n[AQUACROP-CAM] Initializing OV2640 Camera...");

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA; // 640x480
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_CIF; // 400x296
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  // Camera Init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[CAMERA ERROR] Camera init failed with error 0x%x\n", err);
    return;
  }

  Serial.println("[AQUACROP-CAM] Camera initialized successfully.");

  // Connect Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] ESP32-CAM Connected!");
  Serial.print("[WiFi] Camera Stream URL: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/capture");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    uploadFieldSnapshot();
  }
  delay(15000); // Take and upload visual snapshot every 15 seconds
}

void uploadFieldSnapshot() {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("[CAMERA ERROR] Camera capture failed!");
    return;
  }

  Serial.printf("[CAMERA] Photo Captured (%d bytes). Uploading to AquaCrop API...\n", fb->len);

  HTTPClient http;
  String endpoint = String(API_HOST) + "/api/v1/devices/" + HARDWARE_ID + "/camera";
  http.begin(endpoint);
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);

  int httpCode = http.POST(fb->buf, fb->len);
  Serial.printf("[API CAMERA] Snapshot Upload -> HTTP %d\n", httpCode);

  http.end();
  esp_camera_fb_return(fb);
}
