// WebP 무손실 판정 — 2026-07-07 조사가 *"구현 시 픽셀 실측 검증 필수"* 라 적어둔 그 검증.
// 그 검증이 안 된 채 코드 주석에는 "무손실"이라 적혀 있다(mediaStore.ts:121 · ModelPage 여섯 자리).
// 콘솔에서:  fetch('/webptest.js').then(r=>r.text()).then(eval)
(async () => {
  const W = 256, H = 256;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  const img = g.createImageData(W, H);
  // 사진처럼 값이 촘촘히 변하는 무늬 — 손실 압축이면 여기서 어긋난다. 알파는 전부 255(불투명)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    img.data[i]     = (x * 7 + y * 3) % 256;
    img.data[i + 1] = (x * x + y) % 256;
    img.data[i + 2] = ((x ^ y) * 5) % 256;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const 원본 = g.getImageData(0, 0, W, H).data;

  const 재보기 = async (type, q) => {
    const blob = await new Promise((r) => c.toBlob(r, type, q));
    if (!blob) return { 형식: type, 판정: "⛔toBlob 이 null" };
    const bmp = await createImageBitmap(blob);
    const c2 = document.createElement("canvas"); c2.width = W; c2.height = H;
    const g2 = c2.getContext("2d", { willReadFrequently: true });
    g2.drawImage(bmp, 0, 0);
    const 뒤 = g2.getImageData(0, 0, W, H).data;
    let 다른수 = 0, 최대차 = 0;
    for (let i = 0; i < 원본.length; i++) {
      const d = Math.abs(원본[i] - 뒤[i]);
      if (d) { 다른수++; if (d > 최대차) 최대차 = d; }
    }
    return { 형식: blob.type, 품질: q ?? "-", 바이트: blob.size, 다른픽셀값: 다른수, 최대차, 판정: 다른수 === 0 ? "★무손실" : "⛔손실" };
  };

  console.log("%c=== WebP 무손실 판정 (256×256 · 불투명) ===", "font-size:16px;font-weight:700");
  console.table([
    await 재보기("image/png"),
    await 재보기("image/webp", 1.0),
    await 재보기("image/webp", 0.92),
  ]);
  console.log("%c★「다른픽셀값 0」 이면 무손실입니다. 하나라도 있으면 손실입니다.", "color:#4ade80;font-size:14px");
})();
