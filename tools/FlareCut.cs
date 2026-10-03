// Нарезка спрайтов FLARE (flare-game, CC-BY-SA 3.0): читает файл анимаций (frame=i,dir,x,y,w,h,ox,oy),
// берёт одно направление и собирает ровную сетку: строка = анимация, кадры выровнены по точке «ног» (ox,oy).
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

public class FlareFrame { public int I, D, X, Y, W, H, OX, OY; public string Img; }
public class FlareAnim { public string Name; public string Img; public List<FlareFrame> Frames = new List<FlareFrame>(); public int Count; }

public static class FlareCut {
    // Разбор файла анимаций. root — папка мода (…/mods/fantasycore), пути image= относительно неё.
    public static Dictionary<string, FlareAnim> Parse(string txt, string root) {
        var anims = new Dictionary<string, FlareAnim>();
        var named = new Dictionary<string, string>(); string def = null; FlareAnim cur = null;
        foreach (var raw in File.ReadAllLines(txt)) {
            var l = raw.Trim(); if (l.Length == 0 || l.StartsWith("#")) continue;
            if (l.StartsWith("INCLUDE ")) {                 // файл целиком берёт анимации из другого (путь от корня мода)
                var inc = Parse(Path.Combine(root, l.Substring(8).Trim().Replace('/', Path.DirectorySeparatorChar)), root);
                foreach (var kv in inc) anims[kv.Key] = kv.Value;
                continue;
            }
            if (l.StartsWith("[")) { cur = new FlareAnim { Name = l.Trim('[', ']') }; anims[cur.Name] = cur; continue; }
            int eq = l.IndexOf('='); if (eq < 0) continue;
            string k = l.Substring(0, eq), v = l.Substring(eq + 1);
            if (k == "image") {
                var parts = v.Split(','); string path = Path.Combine(root, parts[0].Replace('/', Path.DirectorySeparatorChar));
                if (cur != null) cur.Img = path; else if (parts.Length > 1) named[parts[1]] = path; else def = path;
            } else if (cur != null && k == "frames") cur.Count = int.Parse(v);
            else if (cur != null && k == "frame") {
                var parts = v.Split(',').Select(s => s.Trim()).ToArray();
                var n = parts.Take(8).Select(int.Parse).ToArray();
                var fr = new FlareFrame { I = n[0], D = n[1], X = n[2], Y = n[3], W = n[4], H = n[5], OX = n[6], OY = n[7] };
                if (parts.Length > 8) fr.Img = "@" + parts[8];   // кадр из листа с этим именем (image=…,имя)
                cur.Frames.Add(fr);
            }
        }
        foreach (var a in anims.Values) {
            if (a.Img == null) a.Img = named.ContainsKey(a.Name) ? named[a.Name] : def;
            foreach (var f in a.Frames) f.Img = f.Img != null && f.Img.StartsWith("@") && named.ContainsKey(f.Img.Substring(1)) ? named[f.Img.Substring(1)] : a.Img;
        }
        return anims;
    }

    static Dictionary<string, Img> cache = new Dictionary<string, Img>();
    static Img Load(string p) {
        if (!File.Exists(p)) { var alt = p.Replace("female_dark", "female"); if (File.Exists(alt)) p = alt; }
        if (!cache.ContainsKey(p)) cache[p] = Img.Load(p); return cache[p];
    }
    public static void ClearCache() { cache.Clear(); }

    // Лист: строки = rows (имена анимаций; первая найденная из вариантов через '|'), направление dir.
    // maxFrames — не больше стольких кадров в строке (равномерная выборка). scale — масштаб.
    // Возвращает строку метаданных: cw,ch,ax,ay,n1,n2,…
    public static string Sheet(Dictionary<string, FlareAnim> anims, string[] rows, int dir, int maxFrames, double scale, string outPng) {
        var chosen = new List<List<FlareFrame>>();
        foreach (var r in rows) {
            FlareAnim a = null; foreach (var alt in r.Split('|')) if (anims.ContainsKey(alt) && anims[alt].Frames.Count > 0) { a = anims[alt]; break; }
            var fr = a == null ? new List<FlareFrame>() : a.Frames.Where(f => f.D == dir).OrderBy(f => f.I).ToList();
            if (fr.Count > maxFrames) { var pick = new List<FlareFrame>(); for (int i = 0; i < maxFrames; i++) pick.Add(fr[i * fr.Count / maxFrames]); fr = pick; }
            chosen.Add(fr);
        }
        var all = chosen.SelectMany(x => x).ToList();
        int ax = all.Max(f => f.OX), ay = all.Max(f => f.OY), bx = all.Max(f => f.W - f.OX), by = all.Max(f => f.H - f.OY);
        int cw = ax + bx, ch = ay + by, cols = chosen.Max(x => Math.Max(1, x.Count));
        var sheet = new Img { W = cw * cols, H = ch * chosen.Count }; sheet.P = new byte[sheet.W * sheet.H * 4];
        for (int r = 0; r < chosen.Count; r++) for (int i = 0; i < chosen[r].Count; i++) {
            var f = chosen[r][i]; var src = Load(f.Img);
            var piece = src.Crop(f.X, f.Y, f.W, f.H);
            Cut.Paste(sheet, piece, i * cw + ax - f.OX, r * ch + ay - f.OY);
        }
        int ncw = (int)Math.Round(cw * scale), nch = (int)Math.Round(ch * scale);
        var o = scale == 1 ? sheet : Cut.Downscale(sheet, ncw * cols, nch * chosen.Count);
        o.Save(outPng);
        return ncw + "," + nch + "," + (int)Math.Round(ax * scale) + "," + (int)Math.Round(ay * scale) + "," + string.Join(",", chosen.Select(x => x.Count));
    }

    // Герой из слоёв (у всех слоёв одинаковые номера кадров): layers — анимации слоёв в порядке отрисовки (первый — самый дальний).
    public static string Composite(List<Dictionary<string, FlareAnim>> layers, string[] rows, int dir, int maxFrames, double scale, string outPng) {
        var rowIdx = new List<List<int>>(); var rowName = new List<string>();
        var basis = layers[0];
        foreach (var r in rows) {
            string name = null; foreach (var alt in r.Split('|')) if (basis.ContainsKey(alt) && basis[alt].Frames.Count > 0) { name = alt; break; }
            rowName.Add(name);
            var idx = name == null ? new List<int>() : basis[name].Frames.Where(f => f.D == dir).Select(f => f.I).Distinct().OrderBy(i => i).ToList();
            if (idx.Count > maxFrames) { var pick = new List<int>(); for (int i = 0; i < maxFrames; i++) pick.Add(idx[i * idx.Count / maxFrames]); idx = pick; }
            rowIdx.Add(idx);
        }
        Func<Dictionary<string, FlareAnim>, string, int, FlareFrame> get = (L, n, i) =>
            (n != null && L.ContainsKey(n)) ? L[n].Frames.FirstOrDefault(f => f.D == dir && f.I == i) : null;
        int ax = 0, ay = 0, bx = 0, by = 0;
        for (int r = 0; r < rows.Length; r++) foreach (var i in rowIdx[r]) foreach (var L in layers) {
            var f = get(L, rowName[r], i); if (f == null) continue;
            ax = Math.Max(ax, f.OX); ay = Math.Max(ay, f.OY); bx = Math.Max(bx, f.W - f.OX); by = Math.Max(by, f.H - f.OY);
        }
        int cw = ax + bx, ch = ay + by, cols = rowIdx.Max(x => Math.Max(1, x.Count));
        var sheet = new Img { W = cw * cols, H = ch * rows.Length }; sheet.P = new byte[sheet.W * sheet.H * 4];
        for (int r = 0; r < rows.Length; r++) for (int k = 0; k < rowIdx[r].Count; k++) foreach (var L in layers) {
            var f = get(L, rowName[r], rowIdx[r][k]); if (f == null) continue;
            var piece = Load(f.Img).Crop(f.X, f.Y, f.W, f.H);
            Over(sheet, piece, k * cw + ax - f.OX, r * ch + ay - f.OY);
        }
        int ncw = (int)Math.Round(cw * scale), nch = (int)Math.Round(ch * scale);
        var o = Cut.Downscale(sheet, ncw * cols, nch * rows.Length);
        o.Save(outPng);
        return ncw + "," + nch + "," + (int)Math.Round(ax * scale) + "," + (int)Math.Round(ay * scale) + "," + string.Join(",", rowIdx.Select(x => x.Count));
    }
    // Наложение с альфа-смешиванием (слои героя перекрываются)
    static void Over(Img dst, Img src, int dx, int dy) {
        for (int y = 0; y < src.H; y++) for (int x = 0; x < src.W; x++) {
            int tx = dx + x, ty = dy + y; if (tx < 0 || ty < 0 || tx >= dst.W || ty >= dst.H) continue;
            int s = (y * src.W + x) * 4, d = (ty * dst.W + tx) * 4; int sa = src.P[s + 3]; if (sa == 0) continue;
            int da = dst.P[d + 3]; double a = sa / 255.0, oa = a + da / 255.0 * (1 - a);
            for (int c = 0; c < 3; c++) dst.P[d + c] = (byte)((src.P[s + c] * a + dst.P[d + c] * (da / 255.0) * (1 - a)) / Math.Max(oa, 1e-6));
            dst.P[d + 3] = (byte)(oa * 255);
        }
    }
}
