package net.zachet.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Показывает приложение из assets/ через виртуальный https-адрес.
 * Так у страницы постоянный origin: localStorage (отметки, сочинения) сохраняется между запусками.
 * Принимает текст через «Поделиться» (например, из Google Объектива) и передаёт его странице.
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    private WebView web;
    private boolean pageReady = false;
    private String pendingText = null;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);
        web.setBackgroundColor(0x00000000);
        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String path = u.getPath();
                if (path == null || path.equals("/")) path = "/index.html";
                try {
                    InputStream in = getAssets().open(path.substring(1));
                    String type = mime(path);
                    return new WebResourceResponse(type, type.startsWith("text") ? "utf-8" : null, in);
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                pageReady = true;
                deliverPending();
            }
        });
        setContentView(web);
        takeShared(getIntent());
        if (state != null) web.restoreState(state);
        else web.loadUrl(START + "#home");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        takeShared(intent);
        deliverPending();
    }

    private void takeShared(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        CharSequence t = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        if (t != null && t.length() > 0) pendingText = t.toString();
    }

    private void deliverPending() {
        if (!pageReady || pendingText == null) return;
        String js = "window.receiveShared&&window.receiveShared(" + JSONObject.quote(pendingText) + ")";
        pendingText = null;
        web.evaluateJavascript(js, null);
    }

    /** Методы, которые вызывает страница: window.Android.* */
    private class Bridge {
        @JavascriptInterface
        public boolean isApp() { return true; }

        @JavascriptInterface
        public String clipboard() {
            final String[] out = {""};
            final CountDownLatch done = new CountDownLatch(1);
            runOnUiThread(() -> {
                try {
                    ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    ClipData c = cm != null ? cm.getPrimaryClip() : null;
                    if (c != null && c.getItemCount() > 0) {
                        CharSequence t = c.getItemAt(0).coerceToText(MainActivity.this);
                        if (t != null) out[0] = t.toString();
                    }
                } catch (Exception ignored) { }
                done.countDown();
            });
            try { done.await(2, TimeUnit.SECONDS); } catch (InterruptedException ignored) { }
            return out[0];
        }

        @JavascriptInterface
        public void share(final String text) {
            runOnUiThread(() -> {
                Intent s = new Intent(Intent.ACTION_SEND);
                s.setType("text/plain");
                s.putExtra(Intent.EXTRA_TEXT, text);
                try { startActivity(Intent.createChooser(s, "Поделиться")); } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface
        public boolean openLens() {
            // 1) отдельное приложение «Google Объектив»; 2) Объектив внутри приложения Google.
            Intent i = getPackageManager().getLaunchIntentForPackage("com.google.ar.lens");
            if (i == null) {
                Intent g = new Intent(Intent.ACTION_VIEW, Uri.parse("googleapp://lens"));
                g.setPackage("com.google.android.googlequicksearchbox");
                if (g.resolveActivity(getPackageManager()) != null) i = g;
            }
            if (i == null) return false;
            final Intent go = i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try { runOnUiThread(() -> { try { startActivity(go); } catch (Exception ignored) { } }); return true; }
            catch (Exception e) { return false; }
        }
    }

    private static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js")) return "text/javascript";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
