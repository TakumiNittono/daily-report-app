import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
};

// PushAlertのService Workerを使用するため、next-pwaのService Worker生成を無効化
const pwaConfig = withPWA({
  dest: "public",
  register: false, // PushAlertのService Workerを使用するため、next-pwaの自動登録を無効化
  skipWaiting: true,
  disable: true, // PushAlertのService Workerを使用するため、next-pwaを無効化
  // runtimeCachingは無効化中
});

export default pwaConfig(nextConfig);
