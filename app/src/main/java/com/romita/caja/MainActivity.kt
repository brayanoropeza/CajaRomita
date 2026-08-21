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
            webViewClient = WebViewClient()

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
