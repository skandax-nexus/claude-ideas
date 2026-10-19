package com.afterzero.preview;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import java.util.Locale;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.net.Uri;
import java.io.IOException;
import java.io.InputStream;

/**
 * Full-screen WebView host for the AFTERZERO playable build, fully offline.
 * The game is served from the APK's assets under https://afterzero.app/ so it can
 * fetch its character models and voice pack (fetch can't read file:// URLs).
 */
public class MainActivity extends Activity {
    private WebView web;
    private TextToSpeech tts;
    private static final String ORIGIN_HOST = "afterzero.app";

    private static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "text/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".glb")) return "model/gltf-binary";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".jpg")) return "image/jpeg";
        if (p.endsWith(".hdr")) return "application/octet-stream";
        if (p.endsWith(".ogg")) return "audio/ogg";
        if (p.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }
    private boolean ttsReady = false;

    /** Voiced dialogue: the game calls window.AndroidTTS.speak(text, pitch, rate). */
    public class Voice {
        @JavascriptInterface public boolean ready() { return ttsReady; }
        @JavascriptInterface public void speak(String text, float pitch, float rate) {
            if (!ttsReady) return;
            tts.setPitch(pitch);
            tts.setSpeechRate(rate);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null);
        }
        @JavascriptInterface public void stop() { if (ttsReady) tts.stop(); }
    }

    /** Menus work upright; gameplay locks to landscape: window.AndroidUI.setLandscape(true|false). */
    public class UI {
        @JavascriptInterface public void setLandscape(final boolean on) {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    setRequestedOrientation(on ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE : ActivityInfo.SCREEN_ORIENTATION_FULL_USER);
                }
            });
        }
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_FULLSCREEN);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);           // saves (localStorage)
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override public void onInit(int status) {
                if (status == TextToSpeech.SUCCESS) {
                    tts.setLanguage(Locale.US);
                    ttsReady = true;
                }
            }
        });
        web.addJavascriptInterface(new Voice(), "AndroidTTS");
        web.addJavascriptInterface(new UI(), "AndroidUI");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!ORIGIN_HOST.equals(u.getHost())) return null;
                String path = u.getPath() == null || u.getPath().equals("/") ? "index.html" : u.getPath().substring(1);
                try {
                    InputStream in = getAssets().open(path);
                    return new WebResourceResponse(mime(path), mime(path).startsWith("text") ? "utf-8" : null, in);
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.setBackgroundColor(0xFF05070A);
        setContentView(web);
        immersive();
        if (state != null) web.restoreState(state);
        else web.loadUrl("https://" + ORIGIN_HOST + "/index.html");
    }

    private void immersive() {
        if (Build.VERSION.SDK_INT >= 19) {
            web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }

    @Override public void onWindowFocusChanged(boolean focus) { super.onWindowFocusChanged(focus); if (focus) immersive(); }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }
    @Override protected void onPause() { super.onPause(); web.onPause(); web.pauseTimers(); if (ttsReady) tts.stop(); }
    @Override protected void onDestroy() { if (tts != null) tts.shutdown(); web.destroy(); super.onDestroy(); } // a recreated activity leaves no old WebView (or its audio) running
    @Override protected void onResume() { super.onResume(); web.onResume(); web.resumeTimers(); immersive(); }
    @Override public void onBackPressed() {
        // Back opens the in-game pause menu instead of quitting mid-run.
        web.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}))", null);
    }
}
