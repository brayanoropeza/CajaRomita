package com.romita.caja

import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            settings.builtInZoomControls = true
            settings.displayZoomControls = false
            settings.setSupportZoom(true)
            settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            settings.databaseEnabled = true
            webViewClient = object : WebViewClient() {
                override fun onReceivedSslError(view: WebView?, handler: android.webkit.SslErrorHandler?, error: android.net.http.SslError?) {
                    handler?.proceed()
                }
            }

            addJavascriptInterface(AndroidBridge(this@MainActivity), "AndroidInterface")

            loadUrl("file:///android_asset/index.html")
        }

        setContentView(webView)
    }

    inner class AndroidBridge(private val context: MainActivity) {

        @JavascriptInterface
        fun mostrarMensajeDesdeHTML(mensaje: String) {
            runOnUiThread {
                Toast.makeText(context, mensaje, Toast.LENGTH_LONG).show()
            }
        }
    }
}
