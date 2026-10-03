package com.endlesswar.game;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.DisplayCutout;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Полноэкранная обёртка: игра (index.html + js/css/art) лежит в assets и открывается в WebView.
 * Мост AndroidApp даёт странице вибрацию, кнопка «Назад» сначала передаётся игре (window.androidBack).
 */
public class MainActivity extends Activity {
    private WebView web;
    private volatile float insetTop = 0, insetBottom = 0;   // вырез камеры, в CSS-пикселях

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(13, 10, 20));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                 // localStorage — сохранения
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);

        web.setWebChromeClient(new WebChromeClient() {        // сообщения консоли игры -> logcat (тег EW)
            @Override public boolean onConsoleMessage(android.webkit.ConsoleMessage m) { android.util.Log.i("EW", m.message()); return true; }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if ("file".equals(request.getUrl().getScheme())) return false;
                startActivity(new Intent(Intent.ACTION_VIEW, request.getUrl()));
                return true;
            }
        });
        web.setLongClickable(false);
        web.setOnLongClickListener(v -> true);
        web.setHapticFeedbackEnabled(false);
        web.addJavascriptInterface(new Bridge(), "AndroidApp");

        // рисуем и под вырезом камеры; размер выреза передаём игре (window.AndroidApp.safeTop)
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
        web.setOnApplyWindowInsetsListener((v, insets) -> {
            float d = getResources().getDisplayMetrics().density;
            if (Build.VERSION.SDK_INT >= 28 && insets.getDisplayCutout() != null) {
                DisplayCutout dc = insets.getDisplayCutout();
                insetTop = dc.getSafeInsetTop() / d; insetBottom = dc.getSafeInsetBottom() / d;
            }
            web.evaluateJavascript("window.onNativeInsets && window.onNativeInsets()", null);
            return v.onApplyWindowInsets(insets);
        });
        setContentView(web);
        hideSystemBars();
        String dbg = getIntent() != null ? getIntent().getStringExtra("dbg") : null;   // отладка: adb shell am start ... --es dbg auto,dpr1
        web.loadUrl("file:///android_asset/index.html" + (dbg != null ? "#" + dbg : ""));
    }

    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.androidBack ? window.androidBack() : false", result -> {
            if (!"true".equals(result)) finish();
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        web.resumeTimers();
        web.evaluateJavascript("window.appPause&&appPause(false)", null);
    }

    @Override
    protected void onPause() {
        web.evaluateJavascript("window.appPause&&appPause(true)", null);   // глушим музыку в фоне
        web.onPause();
        web.pauseTimers();                            // игра не крутится в фоне
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }

    /** Методы, доступные странице как window.AndroidApp. */
    public class Bridge {
        @JavascriptInterface public float safeTop() { return insetTop; }
        @JavascriptInterface public float safeBottom() { return insetBottom; }

        @JavascriptInterface
        public void vibrate(int ms) {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null || !v.hasVibrator()) return;
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(Math.max(1, ms), VibrationEffect.DEFAULT_AMPLITUDE));
            else v.vibrate(ms);
        }
    }
}
