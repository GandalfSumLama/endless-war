// Нарезка спрайтов из листов с тёмным фоном: удаление фона заливкой от краёв,
// поиск отдельных фигур (кадров) и сохранение в PNG с прозрачностью.
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class Img {
    public int W, H; public byte[] P; // BGRA
    public static Img Load(string path) {
        using (var b0 = new Bitmap(path)) {
            var b = new Bitmap(b0.Width, b0.Height, PixelFormat.Format32bppArgb);
            using (var g = Graphics.FromImage(b)) g.DrawImage(b0, 0, 0, b0.Width, b0.Height);
            var img = new Img { W = b.Width, H = b.Height, P = new byte[b.Width * b.Height * 4] };
            var d = b.LockBits(new Rectangle(0, 0, b.Width, b.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            Marshal.Copy(d.Scan0, img.P, 0, img.P.Length); b.UnlockBits(d); b.Dispose();
            return img;
        }
    }
    public Img Crop(int x, int y, int w, int h) {
        var o = new Img { W = w, H = h, P = new byte[w * h * 4] };
        for (int j = 0; j < h; j++) Array.Copy(P, ((y + j) * W + x) * 4, o.P, j * w * 4, w * 4);
        return o;
    }
    public void Save(string path, int scale = 1) {
        var b = new Bitmap(W * scale, H * scale, PixelFormat.Format32bppArgb);
        var buf = new byte[W * scale * H * scale * 4];
        for (int y = 0; y < H * scale; y++) for (int x = 0; x < W * scale; x++)
            Array.Copy(P, ((y / scale) * W + x / scale) * 4, buf, (y * W * scale + x) * 4, 4);
        var d = b.LockBits(new Rectangle(0, 0, b.Width, b.Height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        Marshal.Copy(buf, 0, d.Scan0, buf.Length); b.UnlockBits(d);
        b.Save(path, ImageFormat.Png); b.Dispose();
    }
}

public static class Cut {
    // Расстояние цвета пикселя до фона
    static int Dist(byte[] p, int i, int br, int bg, int bb) {
        int dr = p[i + 2] - br, dg = p[i + 1] - bg, db = p[i] - bb;
        return Math.Max(Math.Abs(dr), Math.Max(Math.Abs(dg), Math.Abs(db)));
    }

    // Маска фона: заливка от краёв по пикселям, близким к фону (tol). Возвращает true = фон.
    public static bool[] BgMask(Img im, int tol, int br, int bg, int bb) {
        int W = im.W, H = im.H; var bgm = new bool[W * H]; var st = new Stack<int>();
        for (int x = 0; x < W; x++) { st.Push(x); st.Push((H - 1) * W + x); }
        for (int y = 0; y < H; y++) { st.Push(y * W); st.Push(y * W + W - 1); }
        while (st.Count > 0) {
            int k = st.Pop(); if (bgm[k]) continue;
            if (Dist(im.P, k * 4, br, bg, bb) > tol) continue;
            bgm[k] = true; int x = k % W, y = k / W;
            if (x > 0) st.Push(k - 1); if (x < W - 1) st.Push(k + 1);
            if (y > 0) st.Push(k - W); if (y < H - 1) st.Push(k + W);
        }
        return bgm;
    }

    // Вырезает из области главную фигуру: самый большой кусок и всё, что ближе gap пикселей к нему.
    // Соседние позы, попавшие в прямоугольник, отбрасываются. Возвращает плотно обрезанную картинку.
    public static Img ExtractMain(Img im, bool[] m, int rx, int ry, int rw, int rh, int gap) {
        var fg = new bool[rw * rh];
        for (int y = 0; y < rh; y++) for (int x = 0; x < rw; x++) fg[y * rw + x] = !m[(ry + y) * im.W + rx + x];
        var dil = new bool[rw * rh];
        for (int y = 0; y < rh; y++) for (int x = 0; x < rw; x++) {
            if (!fg[y * rw + x]) continue;
            for (int dy = -gap; dy <= gap; dy++) { int yy = y + dy; if (yy < 0 || yy >= rh) continue;
                for (int dx = -gap; dx <= gap; dx++) { int xx = x + dx; if (xx >= 0 && xx < rw) dil[yy * rw + xx] = true; } }
        }
        var lab = new int[rw * rh]; var cnt = new List<int> { 0 }; var st = new Stack<int>();
        for (int s = 0; s < rw * rh; s++) {
            if (!dil[s] || lab[s] != 0) continue;
            int id = cnt.Count, c = 0; st.Push(s); lab[s] = id;
            while (st.Count > 0) {
                int k = st.Pop(); if (fg[k]) c++; int x = k % rw, y = k / rw;
                int[] nb = { x > 0 ? k - 1 : -1, x < rw - 1 ? k + 1 : -1, y > 0 ? k - rw : -1, y < rh - 1 ? k + rw : -1 };
                foreach (var n in nb) if (n >= 0 && dil[n] && lab[n] == 0) { lab[n] = id; st.Push(n); }
            }
            cnt.Add(c);
        }
        int best = 1; for (int i = 2; i < cnt.Count; i++) if (cnt[i] > cnt[best]) best = i;
        int x0 = rw, y0 = rh, x1 = -1, y1 = -1;
        for (int k = 0; k < rw * rh; k++) if (fg[k] && lab[k] == best) { int x = k % rw, y = k / rw; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        var o = new Img { W = x1 - x0 + 1, H = y1 - y0 + 1 }; o.P = new byte[o.W * o.H * 4];
        for (int y = y0; y <= y1; y++) for (int x = x0; x <= x1; x++) {
            int k = y * rw + x; if (!fg[k] || lab[k] != best) continue;
            Array.Copy(im.P, ((ry + y) * im.W + rx + x) * 4, o.P, ((y - y0) * o.W + x - x0) * 4, 4);
        }
        return o;
    }
    // Обрезка по вписанному кругу с мягким краем (для «шариков», слипшихся с соседними линиями)
    public static Img CircleCrop(Img s, double scale) {
        var o = new Img { W = s.W, H = s.H, P = (byte[])s.P.Clone() };
        double cx = s.W / 2.0, cy = s.H / 2.0, R = Math.Min(s.W, s.H) / 2.0 * scale;
        for (int y = 0; y < s.H; y++) for (int x = 0; x < s.W; x++) {
            double d = Math.Sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)), k = Math.Max(0, Math.Min(1, (R - d) / 4.0));
            int i = (y * s.W + x) * 4 + 3; o.P[i] = (byte)(o.P[i] * k);
        }
        return o;
    }
    // Зеркальное отражение по горизонтали (чтобы все кадры смотрели в одну сторону)
    public static Img Mirror(Img s) {
        var o = new Img { W = s.W, H = s.H, P = new byte[s.P.Length] };
        for (int y = 0; y < s.H; y++) for (int x = 0; x < s.W; x++) Array.Copy(s.P, (y * s.W + x) * 4, o.P, (y * s.W + s.W - 1 - x) * 4, 4);
        return o;
    }
    // Кладёт картинку src в dst (dx, dy), прозрачные пиксели не копируются
    public static void Paste(Img dst, Img src, int dx, int dy) {
        for (int y = 0; y < src.H; y++) for (int x = 0; x < src.W; x++) {
            int si = (y * src.W + x) * 4; if (src.P[si + 3] == 0) continue;
            int X = dx + x, Y = dy + y; if (X < 0 || Y < 0 || X >= dst.W || Y >= dst.H) continue;
            Array.Copy(src.P, si, dst.P, (Y * dst.W + X) * 4, 4);
        }
    }

    // Наложение с прозрачностью (source-over), в отличие от Paste, которое заменяет пиксели
    public static void Blend(Img dst, Img src, int dx, int dy) {
        for (int y = 0; y < src.H; y++) for (int x = 0; x < src.W; x++) {
            int si = (y * src.W + x) * 4, sa = src.P[si + 3]; if (sa == 0) continue;
            int X = dx + x, Y = dy + y; if (X < 0 || Y < 0 || X >= dst.W || Y >= dst.H) continue;
            int di = (Y * dst.W + X) * 4; double a = sa / 255.0, da = dst.P[di + 3] / 255.0, oa = a + da * (1 - a);
            for (int c = 0; c < 3; c++) dst.P[di + c] = (byte)((src.P[si + c] * a + dst.P[di + c] * da * (1 - a)) / oa);
            dst.P[di + 3] = (byte)(oa * 255);
        }
    }

    // Светящийся эффект на светлом (нарисованном «шахматном») фоне → прозрачная картинка.
    // Пиксель = белый*(1-a) + цвет*a; альфа восстанавливается по недостатку красного канала
    // относительно фона, слабые значения (клетки «шахматки») отсекаются.
    public static double CheckSq = 0, CheckDark = 250, CheckLight = 250;   // параметры нарисованной «шахматки» (0 — ровный фон)
    public static Img Unglow(Img im, int rx, int ry, int rw, int rh, int cr, int cg, int cb) {
        var o = new Img { W = rw, H = rh, P = new byte[rw * rh * 4] };
        for (int y = 0; y < rh; y++) for (int x = 0; x < rw; x++) {
            int s = ((ry + y) * im.W + rx + x) * 4, d = (y * rw + x) * 4;
            double r = im.P[s + 2], g = im.P[s + 1], b = im.P[s];
            double bg = 250;
            if (CheckSq > 0) bg = (((int)((rx + x) / CheckSq) + (int)((ry + y) / CheckSq)) % 2 == 0) ? CheckDark : CheckLight;
            // серые клетки имеют равные каналы, поэтому (синий − красный) от фона не зависит: b − r = a·(cb − cr)
            double a = (b - r) / (cb - cr);
            a = (a - 0.04) / 0.96; if (a <= 0) continue; a = Math.Min(1, Math.Pow(a, 0.75) * 1.6);
            // цвет: чем плотнее, тем насыщеннее; в самой яркой части — ближе к белому свечению
            double w = Math.Max(0, 1 - a) * 0.5;
            o.P[d + 2] = (byte)(cr + (255 - cr) * w); o.P[d + 1] = (byte)(cg + (255 - cg) * w); o.P[d] = (byte)(cb + (255 - cb) * w);
            o.P[d + 3] = (byte)(a * 255);
        }
        return o;
    }

    // Превью области: фигуры по маске на зелёном фоне (для проверки нарезки)
    public static Img Preview(Img im, bool[] m, int rx, int ry, int rw, int rh) {
        var o = new Img { W = rw, H = rh, P = new byte[rw * rh * 4] };
        for (int y = 0; y < rh; y++) for (int x = 0; x < rw; x++) {
            int d = (y * rw + x) * 4, s = ((ry + y) * im.W + rx + x) * 4;
            if (m[(ry + y) * im.W + rx + x]) { o.P[d] = 42; o.P[d + 1] = 64; o.P[d + 2] = 40; }
            else { o.P[d] = im.P[s]; o.P[d + 1] = im.P[s + 1]; o.P[d + 2] = im.P[s + 2]; }
            o.P[d + 3] = 255;
        }
        return o;
    }
    public static int[] AlphaHist(Img im) { var h = new int[8]; for (int k = 0; k < im.W * im.H; k++) h[im.P[k * 4 + 3] / 32]++; return h; }

    // Маска фона по прозрачности (для PNG, где фон уже прозрачный)
    public static bool[] AlphaMask(Img im, int thr) {
        var m = new bool[im.W * im.H];
        for (int k = 0; k < m.Length; k++) m[k] = im.P[k * 4 + 3] < thr;
        return m;
    }

    // Замкнутые «дыры» цвета фона внутри фигуры (между ног и т.п.) тоже делаем фоном
    public static void FillHoles(Img im, bool[] bgm, int tol, int minArea, int br, int bg, int bb) {
        int W = im.W, H = im.H; var seen = new bool[W * H]; var st = new Stack<int>(); var list = new List<int>();
        for (int s = 0; s < W * H; s++) {
            if (bgm[s] || seen[s] || Dist(im.P, s * 4, br, bg, bb) > tol) continue;
            list.Clear(); st.Push(s); seen[s] = true;
            while (st.Count > 0) {
                int k = st.Pop(); list.Add(k); int x = k % W, y = k / W;
                int[] nb = { x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1 };
                foreach (var n in nb) if (n >= 0 && !bgm[n] && !seen[n] && Dist(im.P, n * 4, br, bg, bb) <= tol) { seen[n] = true; st.Push(n); }
            }
            if (list.Count >= minArea) foreach (var k in list) bgm[k] = true;
        }
    }

    // Убирает светлую кайму (для белого фона): крайние пиксели, близкие к фону, становятся фоном
    public static void Defringe(Img im, bool[] bgm, int thr, int passes, int br, int bg, int bb) {
        int W = im.W, H = im.H;
        for (int p = 0; p < passes; p++) {
            var kill = new List<int>();
            for (int k = 0; k < W * H; k++) {
                if (bgm[k]) continue; int x = k % W, y = k / W;
                bool edge = (x > 0 && bgm[k - 1]) || (x < W - 1 && bgm[k + 1]) || (y > 0 && bgm[k - W]) || (y < H - 1 && bgm[k + W]);
                if (edge && Dist(im.P, k * 4, br, bg, bb) < thr) kill.Add(k);
            }
            foreach (var k in kill) bgm[k] = true;
        }
    }

    // Применить маску: фон прозрачный, граница — мягкая альфа по близости к фону
    public static void ApplyAlpha(Img im, bool[] bgm, int tol, int br, int bg, int bb) {
        int W = im.W, H = im.H;
        for (int k = 0; k < W * H; k++) {
            if (bgm[k]) { im.P[k * 4 + 3] = 0; continue; }
            int x = k % W, y = k / W; bool edge = false;
            if (x > 0 && bgm[k - 1]) edge = true; else if (x < W - 1 && bgm[k + 1]) edge = true;
            else if (y > 0 && bgm[k - W]) edge = true; else if (y < H - 1 && bgm[k + W]) edge = true;
            if (edge) {
                int d = Dist(im.P, k * 4, br, bg, bb);
                im.P[k * 4 + 3] = (byte)Math.Min(255, 90 + d * 165 / Math.Max(1, tol * 3));
            }
        }
    }

    // Делит область на n кадров по пустым столбцам; если пустых разрывов мало — режет
    // самый широкий кусок по столбцу с наименьшим числом пикселей. Возвращает x,y,w,h * n.
    public static int[] SplitRow(bool[] bgm, int W, int rx, int ry, int rw, int rh, int n, int minCol) {
        var col = new int[rw];
        for (int x = 0; x < rw; x++) for (int y = 0; y < rh; y++) if (!bgm[(ry + y) * W + rx + x]) col[x]++;
        var segs = new List<int[]>(); int s = -1;
        for (int x = 0; x <= rw; x++) {
            bool on = x < rw && col[x] > minCol;
            if (on && s < 0) s = x;
            if (!on && s >= 0) { segs.Add(new[] { s, x - 1 }); s = -1; }
        }
        // выбросить крошки: узкие куски и куски с малой массой пикселей
        long total = 0; foreach (var c in col) total += c;
        segs.RemoveAll(g => { long m = 0; for (int x = g[0]; x <= g[1]; x++) m += col[x]; return g[1] - g[0] < 6 || m < total * 0.04; });
        while (segs.Count > n) {           // склеить самую близкую пару
            int bi = 0, bd = int.MaxValue;
            for (int i = 0; i < segs.Count - 1; i++) { int d = segs[i + 1][0] - segs[i][1]; int sz = Math.Min(segs[i][1] - segs[i][0], segs[i + 1][1] - segs[i + 1][0]); d = d * 4 + sz; if (d < bd) { bd = d; bi = i; } }
            segs[bi] = new[] { segs[bi][0], segs[bi + 1][1] }; segs.RemoveAt(bi + 1);
        }
        while (segs.Count < n && segs.Count > 0) {  // разрезать самый широкий
            int wi = 0; for (int i = 1; i < segs.Count; i++) if (segs[i][1] - segs[i][0] > segs[wi][1] - segs[wi][0]) wi = i;
            var g = segs[wi]; int a = g[0] + (g[1] - g[0]) / 4, b = g[1] - (g[1] - g[0]) / 4, best = a;
            for (int x = a; x <= b; x++) if (col[x] < col[best]) best = x;
            segs[wi] = new[] { g[0], best - 1 }; segs.Insert(wi + 1, new[] { best + 1, g[1] });
        }
        var o = new List<int>();
        foreach (var g in segs) {
            int y0 = rh, y1 = -1;
            for (int x = g[0]; x <= g[1]; x++) for (int y = 0; y < rh; y++) if (!bgm[(ry + y) * W + rx + x]) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
            if (y1 < 0) continue;
            o.AddRange(new[] { rx + g[0], ry + y0, g[1] - g[0] + 1, y1 - y0 + 1 });
        }
        return o.ToArray();
    }

    // Делит область на n равных слотов и берёт рамку содержимого каждого (для ровно разложенных кадров)
    public static int[] SplitSlots(bool[] bgm, int W, int rx, int ry, int rw, int rh, int n) {
        var o = new List<int>();
        for (int i = 0; i < n; i++) {
            int sx = rx + rw * i / n, ex = rx + rw * (i + 1) / n, x0 = int.MaxValue, x1 = -1, y0 = int.MaxValue, y1 = -1;
            for (int y = ry; y < ry + rh; y++) for (int x = sx; x < ex; x++) if (!bgm[y * W + x]) {
                if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
            if (x1 >= 0) o.AddRange(new[] { x0, y0, x1 - x0 + 1, y1 - y0 + 1 });
        }
        return o.ToArray();
    }

    // Кадры по компонентам: каждая фигура/кусок относится к слоту, в который попадает её центр;
    // рамка кадра — объединение кусков слота. Тонкие линии (рамки панелей) и крошки пропускаются.
    public static int[] SlotMap;   // номер кадра для каждого пикселя последней области SplitByComp (-1 — ничей)
    public static int[] SplitByComp(bool[] bgm, int W, int rx, int ry, int rw, int rh, int n, int[] cuts) {
        var lab = new int[rw * rh]; var st = new Stack<int>(); var comps = new List<int[]>(); var pix = new List<List<int>>();
        for (int s0 = 0; s0 < rw * rh; s0++) {
            if (lab[s0] != 0 || bgm[(ry + s0 / rw) * W + rx + s0 % rw]) continue;
            var list = new List<int>(); int id = pix.Count + 1, x0 = rw, y0 = rh, x1 = -1, y1 = -1;
            st.Push(s0); lab[s0] = id;
            while (st.Count > 0) {
                int k = st.Pop(); list.Add(k); int x = k % rw, y = k / rw;
                if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
                for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
                    int xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= rw || yy >= rh) continue;
                    int q = yy * rw + xx; if (lab[q] == 0 && !bgm[(ry + yy) * W + rx + xx]) { lab[q] = id; st.Push(q); }
                }
            }
            pix.Add(list); comps.Add(new[] { x0, y0, x1 - x0 + 1, y1 - y0 + 1 });
        }
        SlotMap = new int[rw * rh]; for (int i = 0; i < SlotMap.Length; i++) SlotMap[i] = -1;
        var box = new int[n * 4]; for (int i = 0; i < n; i++) { box[i * 4] = int.MaxValue; box[i * 4 + 1] = int.MaxValue; box[i * 4 + 2] = -1; box[i * 4 + 3] = -1; }
        for (int c = 0; c < comps.Count; c++) {
            int x = comps[c][0], y = comps[c][1], w = comps[c][2], h = comps[c][3];
            if (pix[c].Count < 10 || (w <= 3 && h > 25) || (h <= 3 && w > 25)) continue;
            int cx = x + w / 2, s;
            if (cuts != null && cuts.Length == n - 1) { s = 0; foreach (var q in cuts) if (cx >= q) s++; }
            else s = Math.Min(n - 1, Math.Max(0, cx * n / rw));
            foreach (var k in pix[c]) SlotMap[k] = s;
            box[s * 4] = Math.Min(box[s * 4], x); box[s * 4 + 1] = Math.Min(box[s * 4 + 1], y);
            box[s * 4 + 2] = Math.Max(box[s * 4 + 2], x + w - 1); box[s * 4 + 3] = Math.Max(box[s * 4 + 3], y + h - 1);
        }
        var o = new List<int>();
        for (int i = 0; i < n; i++) if (box[i * 4 + 2] >= 0)
            o.AddRange(new[] { rx + box[i * 4], ry + box[i * 4 + 1], box[i * 4 + 2] - box[i * 4] + 1, box[i * 4 + 3] - box[i * 4 + 1] + 1 });
        return o.ToArray();
    }

    // Как Strip, но копирует только пиксели своего кадра (по карте SlotMap области rx,ry,rw)
    public static Img StripSlots(Img src, int[] frames, int cw, int ch, int[] map, int rx, int ry, int rw) {
        int n = frames.Length / 4; var o = new Img { W = cw * n, H = ch, P = new byte[cw * n * ch * 4] };
        for (int i = 0; i < n; i++) {
            int fx = frames[i * 4], fy = frames[i * 4 + 1], fw = frames[i * 4 + 2], fh = frames[i * 4 + 3];
            int ox = i * cw + (cw - fw) / 2, oy = ch - fh;
            for (int y = 0; y < fh; y++) for (int x = 0; x < fw; x++) {
                int mx = fx + x - rx, my = fy + y - ry; if (map[my * rw + mx] != i) continue;
                Array.Copy(src.P, ((fy + y) * src.W + fx + x) * 4, o.P, ((oy + y) * o.W + ox + x) * 4, 4);
            }
        }
        return o;
    }

    // Собирает кадры в ленту одинаковых ячеек cw*ch, кадр по центру снизу. frames: x,y,w,h * n
    public static Img Strip(Img src, int[] frames, int cw, int ch) {
        int n = frames.Length / 4; var o = new Img { W = cw * n, H = ch, P = new byte[cw * n * ch * 4] };
        for (int i = 0; i < n; i++) {
            int fx = frames[i * 4], fy = frames[i * 4 + 1], fw = frames[i * 4 + 2], fh = frames[i * 4 + 3];
            int ox = i * cw + (cw - fw) / 2, oy = ch - fh;
            for (int y = 0; y < fh; y++) for (int x = 0; x < fw; x++) {
                int si = ((fy + y) * src.W + fx + x) * 4, di = ((oy + y) * o.W + ox + x) * 4;
                if (ox + x < i * cw || ox + x >= (i + 1) * cw || oy + y < 0) continue;
                Array.Copy(src.P, si, o.P, di, 4);
            }
        }
        return o;
    }

    // Уменьшение с усреднением (с учётом альфы) — для больших артов
    // Чёрный фон (JPG): тёмное, достижимое от краёв, становится прозрачным; свечение — полупрозрачным по яркости.
    // thr — яркость «твёрдого» предмета, minHole — замкнутые тёмные области крупнее этого тоже прозрачные.
    // core — эллипсы cx,cy,rx,ry (по 4 числа), внутри которых всё непрозрачно; тогда вне их — только свечение.
    public static Img BlackKey(Img im, int thr, int minHole, int[] core) {
        int W = im.W, H = im.H, N = W * H; var o = new Img { W = W, H = H, P = (byte[])im.P.Clone() };
        var L = new int[N]; for (int k = 0; k < N; k++) L[k] = Math.Max(im.P[k * 4], Math.Max(im.P[k * 4 + 1], im.P[k * 4 + 2]));
        var solid = new bool[N];
        if (core != null && core.Length >= 4) {
            for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) for (int c = 0; c + 3 < core.Length; c += 4) {
                double dx = (x - core[c]) / (double)core[c + 2], dy = (y - core[c + 1]) / (double)core[c + 3];
                if (dx * dx + dy * dy <= 1) { solid[y * W + x] = true; break; }
            }
        } else {
            var bg = new bool[N]; var st = new Stack<int>();
            for (int x = 0; x < W; x++) { st.Push(x); st.Push((H - 1) * W + x); }
            for (int y = 0; y < H; y++) { st.Push(y * W); st.Push(y * W + W - 1); }
            while (st.Count > 0) { int k = st.Pop(); if (bg[k] || L[k] > thr) continue; bg[k] = true; int x = k % W, y = k / W;
                if (x > 0) st.Push(k - 1); if (x < W - 1) st.Push(k + 1); if (y > 0) st.Push(k - W); if (y < H - 1) st.Push(k + W); }
            var seen = new bool[N]; var comp = new List<int>();
            for (int s = 0; s < N; s++) {
                if (bg[s] || seen[s] || L[s] > thr) continue;
                comp.Clear(); st.Push(s);
                while (st.Count > 0) { int k = st.Pop(); if (seen[k] || bg[k] || L[k] > thr) continue; seen[k] = true; comp.Add(k); int x = k % W, y = k / W;
                    if (x > 0) st.Push(k - 1); if (x < W - 1) st.Push(k + 1); if (y > 0) st.Push(k - W); if (y < H - 1) st.Push(k + W); }
                if (comp.Count > minHole) foreach (int k in comp) bg[k] = true;
            }
            for (int k = 0; k < N; k++) solid[k] = !bg[k];
        }
        for (int k = 0; k < N; k++) {
            if (solid[k]) { o.P[k * 4 + 3] = 255; continue; }
            double a = Math.Max(0, Math.Min(1, (L[k] - 10) / (double)(Math.Max(thr, 60) - 10)));
            a = a * a * (3 - 2 * a);
            o.P[k * 4 + 3] = (byte)(a * 255);
            if (a > 0.02) for (int c = 0; c < 3; c++) o.P[k * 4 + c] = (byte)Math.Min(255, im.P[k * 4 + c] / Math.Max(a, 0.35));
        }
        return o;
    }
    // «Поднять» тёмно-серый фон до чёрного: c = (c - floor) * 255 / (255 - floor)
    public static Img Lift(Img im, int floor) {
        var o = new Img { W = im.W, H = im.H, P = (byte[])im.P.Clone() };
        for (int k = 0; k < im.W * im.H; k++) for (int c = 0; c < 3; c++) o.P[k * 4 + c] = (byte)(Math.Max(0, im.P[k * 4 + c] - floor) * 255 / (255 - floor));
        return o;
    }
    // Белый фон: то же, что BlackKey, на негативе (свечение «отделяется» от белого)
    public static Img WhiteKey(Img im, int thr, int minHole) {
        var inv = new Img { W = im.W, H = im.H, P = (byte[])im.P.Clone() };
        for (int k = 0; k < im.W * im.H; k++) for (int c = 0; c < 3; c++) inv.P[k * 4 + c] = (byte)(255 - im.P[k * 4 + c]);
        var o = BlackKey(inv, thr, minHole, null);
        for (int k = 0; k < im.W * im.H; k++) for (int c = 0; c < 3; c++) o.P[k * 4 + c] = (byte)(255 - o.P[k * 4 + c]);
        return o;
    }
    // Убрать полупрозрачную дымку фона: alpha = (a - floor) * 255 / (255 - floor)
    public static Img AlphaFloor(Img im, int floor) {
        var o = new Img { W = im.W, H = im.H, P = (byte[])im.P.Clone() };
        for (int k = 0; k < im.W * im.H; k++) o.P[k * 4 + 3] = (byte)(Math.Max(0, im.P[k * 4 + 3] - floor) * 255 / (255 - floor));
        return o;
    }
    // Обрезка по непрозрачным пикселям (alpha > thr) с отступом, в квадрат
    public static Img TrimSquare(Img s, int thr, int pad) {
        int x0 = s.W, y0 = s.H, x1 = -1, y1 = -1;
        for (int y = 0; y < s.H; y++) for (int x = 0; x < s.W; x++) if (s.P[(y * s.W + x) * 4 + 3] > thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) return s;
        int side = Math.Max(x1 - x0, y1 - y0) + 1 + pad * 2, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        var o = new Img { W = side, H = side, P = new byte[side * side * 4] };
        for (int y = 0; y < side; y++) for (int x = 0; x < side; x++) {
            int sx = cx - side / 2 + x, sy = cy - side / 2 + y;
            if (sx < 0 || sy < 0 || sx >= s.W || sy >= s.H) continue;
            Array.Copy(s.P, (sy * s.W + sx) * 4, o.P, (y * side + x) * 4, 4);
        }
        return o;
    }
    // Границы непрозрачного (alpha > thr): [x0, y0, x1, y1]; Trim — обрезка по ним с отступом pad
    public static int[] Bounds(Img s, int thr) {
        int x0 = s.W, y0 = s.H, x1 = -1, y1 = -1;
        for (int y = 0; y < s.H; y++) for (int x = 0; x < s.W; x++) if (s.P[(y * s.W + x) * 4 + 3] > thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        return new[] { x0, y0, x1, y1 };
    }
    public static Img Trim(Img s, int thr, int pad) {
        var b = Bounds(s, thr); if (b[2] < 0) return s;
        int x0 = Math.Max(0, b[0] - pad), y0 = Math.Max(0, b[1] - pad), x1 = Math.Min(s.W - 1, b[2] + pad), y1 = Math.Min(s.H - 1, b[3] + pad);
        return s.Crop(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    }
    // Перекраска по яркости: тёмные пиксели -> цвет (r0,g0,b0), светлые -> (r1,g1,b1); gain усиливает яркость. Прозрачность не трогаем.
    public static void Gradient(Img im, int r0, int g0, int b0, int r1, int g1, int b1, double gain) {
        for (int k = 0; k < im.W * im.H; k++) {
            int i = k * 4; if (im.P[i + 3] == 0) continue;
            double l = Math.Min(1.0, (im.P[i] * 0.11 + im.P[i + 1] * 0.59 + im.P[i + 2] * 0.3) / 255.0 * gain);
            im.P[i] = (byte)(b0 + (b1 - b0) * l); im.P[i + 1] = (byte)(g0 + (g1 - g0) * l); im.P[i + 2] = (byte)(r0 + (r1 - r0) * l);
        }
    }

    public static Img Downscale(Img s, int nw, int nh) {
        var o = new Img { W = nw, H = nh, P = new byte[nw * nh * 4] };
        for (int y = 0; y < nh; y++) for (int x = 0; x < nw; x++) {
            int x0 = x * s.W / nw, x1 = Math.Max(x0 + 1, (x + 1) * s.W / nw), y0 = y * s.H / nh, y1 = Math.Max(y0 + 1, (y + 1) * s.H / nh);
            double r = 0, g = 0, b = 0, a = 0; int c = 0;
            for (int yy = y0; yy < y1; yy++) for (int xx = x0; xx < x1; xx++) {
                int i = (yy * s.W + xx) * 4; double al = s.P[i + 3] / 255.0;
                b += s.P[i] * al; g += s.P[i + 1] * al; r += s.P[i + 2] * al; a += al; c++;
            }
            int di = (y * nw + x) * 4;
            if (a > 0) { o.P[di] = (byte)(b / a); o.P[di + 1] = (byte)(g / a); o.P[di + 2] = (byte)(r / a); }
            o.P[di + 3] = (byte)(255 * a / c);
        }
        return o;
    }

    // Компоненты переднего плана (с «раздуванием» на gap пикселей, чтобы усики/крылья не отрывались).
    // Возвращает прямоугольники x,y,w,h, отсортированные слева направо.
    public static int[] Components(bool[] bgm, int W, int H, int gap, int minArea) {
        var fg = new bool[W * H];
        for (int k = 0; k < W * H; k++) fg[k] = !bgm[k];
        // раздувание по столбцам и строкам
        var dil = new bool[W * H];
        for (int y = 0; y < H; y++) for (int x = 0; x < W; x++) {
            if (!fg[y * W + x]) continue;
            for (int dy = -gap; dy <= gap; dy++) { int yy = y + dy; if (yy < 0 || yy >= H) continue;
                for (int dx = -gap; dx <= gap; dx++) { int xx = x + dx; if (xx < 0 || xx >= W) continue; dil[yy * W + xx] = true; } }
        }
        var lab = new int[W * H]; var res = new List<int[]>(); int id = 0; var st = new Stack<int>();
        for (int s = 0; s < W * H; s++) {
            if (!dil[s] || lab[s] != 0) continue;
            id++; int x0 = W, y0 = H, x1 = -1, y1 = -1, area = 0; st.Push(s); lab[s] = id;
            while (st.Count > 0) {
                int k = st.Pop(); int x = k % W, y = k / W;
                if (fg[k]) { area++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
                int[] nb = { x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1 };
                foreach (var n in nb) if (n >= 0 && dil[n] && lab[n] == 0) { lab[n] = id; st.Push(n); }
            }
            if (area >= minArea) res.Add(new[] { x0, y0, x1 - x0 + 1, y1 - y0 + 1, area });
        }
        res.Sort((a, b) => a[0].CompareTo(b[0]));
        var o = new List<int>(); foreach (var r in res) o.AddRange(r);
        return o.ToArray();
    }
}
