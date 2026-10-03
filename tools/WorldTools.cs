using System;
public static class WorldTools {
  // перекраска: смесь исходного цвета и (яркость * оттенок)
  public static void Colorize(Img im, int tr, int tg, int tb, double k) {
    for (int i = 0; i < im.W * im.H; i++) {
      int b = im.P[i*4], g = im.P[i*4+1], r = im.P[i*4+2];
      double lum = (0.3*r + 0.59*g + 0.11*b) / 128.0;
      im.P[i*4+2] = (byte)Math.Min(255, r*(1-k) + lum*tr*k); im.P[i*4+1] = (byte)Math.Min(255, g*(1-k) + lum*tg*k); im.P[i*4] = (byte)Math.Min(255, b*(1-k) + lum*tb*k);
    }
  }
  // плитка-ромб на полотне с переносом через края (бесшовность)
  public static void PutWrap(Img dst, Img src, int cx, int cy, int ox, int oy) {
    for (int y = 0; y < src.H; y++) for (int x = 0; x < src.W; x++) {
      int s = (y*src.W + x)*4; int a = src.P[s+3]; if (a == 0) continue;
      int tx = ((cx - ox + x) % dst.W + dst.W) % dst.W, ty = ((cy - oy + y) % dst.H + dst.H) % dst.H, d = (ty*dst.W + tx)*4;
      double k = a / 255.0;
      for (int c = 0; c < 3; c++) dst.P[d+c] = (byte)(src.P[s+c]*k + dst.P[d+c]*(1-k));
      dst.P[d+3] = 255;
    }
  }
}