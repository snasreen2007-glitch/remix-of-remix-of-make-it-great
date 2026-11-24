package org.cropcare.ai

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebResourceErrorCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import org.cropcare.ai.bridge.CropAssistantNativeBridge
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var nativeBridge: CropAssistantNativeBridge

    private val PERMISSION_REQUEST_CODE = 101
    private val FILE_CHOOSER_REQUEST_CODE = 102

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var cameraImageUri: Uri? = null

    private val REQUIRED_PERMISSIONS = arrayOf(
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO
    )

    private fun checkAndRequestPermissions() {
        val missingPermissions = REQUIRED_PERMISSIONS.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missingPermissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                missingPermissions.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    private fun createImageFileUri(): Uri? {
        return try {
            val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
            val imageFileName = "JPEG_${timeStamp}_"
            val storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
            val imageFile = File.createTempFile(imageFileName, ".jpg", storageDir)
            FileProvider.getUriForFile(this, "${applicationContext.packageName}.fileprovider", imageFile)
        } catch (e: Exception) {
            Log.e("MainActivity", "Error creating image file for camera intent", e)
            null
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        checkAndRequestPermissions()

        webView = findViewById(R.id.webView)
        nativeBridge = CropAssistantNativeBridge(this, webView)

        // Ensure edge-to-edge drawing so status bar and navigation bar fit safely without duplicate padding
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val rootLayout = findViewById<FrameLayout>(R.id.rootLayout)
        rootLayout.setPadding(0, 0, 0, 0)

        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { _, windowInsets ->
            val systemBars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            val ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime())

            val density = resources.displayMetrics.density
            val topDp = (systemBars.top / density).toInt()
            val bottomDp = if (ime.bottom > 0) 0 else (systemBars.bottom / density).toInt()
            val imeDp = (ime.bottom / density).toInt()

            webView.post {
                webView.evaluateJavascript(
                    "document.documentElement.style.setProperty('--sat', '${topDp}px');" +
                    "document.documentElement.style.setProperty('--sab', '${bottomDp}px');" +
                    "document.documentElement.style.setProperty('--ime', '${imeDp}px');",
                    null
                )
            }
            windowInsets
        }

        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/dist/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            useWideViewPort = true
            loadWithOverviewMode = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            mediaPlaybackRequiresUserGesture = false
            userAgentString = "${userAgentString} KisanAI-Android/1.0"
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                // Grant camera & audio capture permissions for WebRTC & Web Speech
                runOnUiThread {
                    request.grant(request.resources)
                }
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                Log.d("KisanAI-WebView", "[${consoleMessage.messageLevel()}] ${consoleMessage.message()} -- From line ${consoleMessage.lineNumber()} of ${consoleMessage.sourceId()}")
                return true
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                cameraImageUri = createImageFileUri()
                if (cameraImageUri != null) {
                    takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraImageUri)
                }

                val contentSelectionIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "image/*"
                }

                val intentArray: Array<Intent> = if (cameraImageUri != null && packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)) {
                    arrayOf(takePictureIntent)
                } else {
                    emptyArray()
                }

                val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
                    putExtra(Intent.EXTRA_INTENT, contentSelectionIntent)
                    putExtra(Intent.EXTRA_TITLE, "Select Leaf Image or Take Photo")
                    putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray)
                }

                try {
                    startActivityForResult(chooserIntent, FILE_CHOOSER_REQUEST_CODE)
                    return true
                } catch (e: Exception) {
                    Log.e("MainActivity", "Cannot open file chooser", e)
                    this@MainActivity.filePathCallback?.onReceiveValue(null)
                    this@MainActivity.filePathCallback = null
                    return false
                }
            }
        }

        webView.webViewClient = object : WebViewClientCompat() {
            private fun handleVirtualAssetRequest(uri: Uri): WebResourceResponse {
                val path = uri.path ?: "/"
                val defaultHeaders = mapOf(
                    "Access-Control-Allow-Origin" to "*",
                    "Access-Control-Allow-Methods" to "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers" to "*",
                    "Cache-Control" to "no-cache"
                )

                // 1. Any navigation route without a file extension, root "/", or index.html is an SPA route: serve dist/index.html
                val lastSegment = path.substringAfterLast("/")
                if (path == "/" || path.isEmpty() || path == "/index.html" || path.endsWith("/index.html") || !lastSegment.contains(".")) {
                    return try {
                        val stream = assets.open("dist/index.html")
                        WebResourceResponse("text/html", "UTF-8", 200, "OK", defaultHeaders, stream)
                    } catch (e: Exception) {
                        Log.e("MainActivity", "Error serving SPA index.html for path: $path", e)
                        WebResourceResponse("text/plain", "UTF-8", 200, "OK", defaultHeaders, java.io.ByteArrayInputStream("KisanAI Local Bundle Error".toByteArray()))
                    }
                }

                // 2. Candidate asset paths within assets/ directory
                val cleanPath = when {
                    path.startsWith("/assets/dist/") -> path.removePrefix("/assets/")
                    path.startsWith("/assets/") -> {
                        val sub = path.removePrefix("/assets/")
                        if (sub.startsWith("dist/")) sub else "dist/assets/" + sub.removePrefix("assets/")
                    }
                    path.startsWith("/dist/") -> path.removePrefix("/")
                    else -> "dist" + (if (path.startsWith("/")) path else "/$path")
                }

                val directAssetPath = path.removePrefix("/")

                val candidates = listOf(
                    cleanPath,
                    directAssetPath,
                    "dist/$directAssetPath",
                    "dist/assets/$lastSegment",
                    "dist/models/$lastSegment",
                    "dist/database/$lastSegment"
                )

                for (cand in candidates) {
                    try {
                        val stream = assets.open(cand)
                        val mimeType = when {
                            cand.endsWith(".html") -> "text/html"
                            cand.endsWith(".js") || cand.endsWith(".mjs") -> "application/javascript"
                            cand.endsWith(".css") -> "text/css"
                            cand.endsWith(".json") || cand.endsWith(".webmanifest") -> "application/json"
                            cand.endsWith(".png") -> "image/png"
                            cand.endsWith(".jpg") || cand.endsWith(".jpeg") -> "image/jpeg"
                            cand.endsWith(".svg") -> "image/svg+xml"
                            cand.endsWith(".wasm") -> "application/wasm"
                            cand.endsWith(".onnx") -> "application/octet-stream"
                            cand.endsWith(".pt") || cand.endsWith(".bin") -> "application/octet-stream"
                            else -> "application/octet-stream"
                        }
                        return WebResourceResponse(mimeType, "UTF-8", 200, "OK", defaultHeaders, stream)
                    } catch (_: Exception) {
                        // continue trying candidates
                    }
                }

                // 3. Fallback: if asset not found on virtual domain
                Log.w("MainActivity", "Virtual asset not found: $path, providing fallback")
                return if (lastSegment.endsWith(".png") || lastSegment.endsWith(".jpg") || lastSegment.endsWith(".jpeg") || lastSegment.endsWith(".ico")) {
                    val transparentPixel = android.util.Base64.decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", android.util.Base64.DEFAULT)
                    WebResourceResponse("image/png", "UTF-8", 200, "OK", defaultHeaders, java.io.ByteArrayInputStream(transparentPixel))
                } else if (lastSegment.endsWith(".svg")) {
                    val dummySvg = "<svg xmlns='http://www.w3.org/2000/svg'></svg>".toByteArray()
                    WebResourceResponse("image/svg+xml", "UTF-8", 200, "OK", defaultHeaders, java.io.ByteArrayInputStream(dummySvg))
                } else {
                    try {
                        val stream = assets.open("dist/index.html")
                        WebResourceResponse("text/html", "UTF-8", 200, "OK", defaultHeaders, stream)
                    } catch (fallbackEx: Exception) {
                        WebResourceResponse("text/plain", "UTF-8", 200, "OK", defaultHeaders, java.io.ByteArrayInputStream("KisanAI Offline".toByteArray()))
                    }
                }
            }

            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return try {
                    val uri = request.url
                    val host = uri.host?.lowercase() ?: ""

                    // Always intercept our local virtual domain and local schemes - NEVER let them fall through to real DNS
                    if (host == "appassets.androidplatform.net" || host == "localhost" || uri.scheme == "file" || host.isEmpty()) {
                        val loaderResponse = assetLoader.shouldInterceptRequest(uri)
                        if (loaderResponse != null) return loaderResponse
                        return handleVirtualAssetRequest(uri)
                    } else {
                        null
                    }
                } catch (e: Exception) {
                    Log.e("MainActivity", "Error in shouldInterceptRequest", e)
                    try {
                        val defaultHeaders = mapOf("Access-Control-Allow-Origin" to "*")
                        WebResourceResponse("text/html", "UTF-8", 200, "OK", defaultHeaders, assets.open("dist/index.html"))
                    } catch (_: Exception) {
                        WebResourceResponse("text/plain", "UTF-8", 200, "OK", mapOf("Access-Control-Allow-Origin" to "*"), java.io.ByteArrayInputStream("KisanAI Offline Error".toByteArray()))
                    }
                }
            }

            @Deprecated("Deprecated in Java")
            override fun shouldInterceptRequest(view: WebView, url: String): WebResourceResponse? {
                return try {
                    val uri = Uri.parse(url)
                    val host = uri.host?.lowercase() ?: ""
                    if (host == "appassets.androidplatform.net" || host == "localhost" || uri.scheme == "file" || host.isEmpty()) {
                        val loaderResponse = assetLoader.shouldInterceptRequest(uri)
                        if (loaderResponse != null) return loaderResponse
                        return handleVirtualAssetRequest(uri)
                    } else {
                        null
                    }
                } catch (e: Exception) {
                    Log.e("MainActivity", "Error in legacy shouldInterceptRequest", e)
                    try {
                        val defaultHeaders = mapOf("Access-Control-Allow-Origin" to "*")
                        WebResourceResponse("text/html", "UTF-8", 200, "OK", defaultHeaders, assets.open("dist/index.html"))
                    } catch (_: Exception) {
                        WebResourceResponse("text/plain", "UTF-8", 200, "OK", mapOf("Access-Control-Allow-Origin" to "*"), java.io.ByteArrayInputStream("KisanAI Offline Error".toByteArray()))
                    }
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                val host = uri.host?.lowercase() ?: ""
                val path = uri.path ?: ""
                // Let internal virtual assets remain within WebView
                if (host == "appassets.androidplatform.net" || host == "localhost" || uri.scheme == "file") {
                    if (path.endsWith(".apk")) {
                        return try {
                            val intent = Intent(Intent.ACTION_VIEW, uri)
                            startActivity(intent)
                            true
                        } catch (_: Exception) { false }
                    }
                    return false
                }
                // Handle external links (e.g. github, downloads) in external browser
                return try {
                    val intent = Intent(Intent.ACTION_VIEW, uri)
                    startActivity(intent)
                    true
                } catch (e: Exception) {
                    Log.e("MainActivity", "Error launching external browser for: $uri", e)
                    false
                }
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceErrorCompat
            ) {
                val host = request.url?.host?.lowercase() ?: ""
                // Never show Android chromium error page for our local virtual host; gracefully recover
                if (host == "appassets.androidplatform.net" || host == "localhost" || host.isEmpty()) {
                    Log.w("MainActivity", "Local virtual asset recovery for: ${request.url}")
                    view.post {
                        view.loadUrl("https://appassets.androidplatform.net/assets/dist/index.html")
                    }
                    return
                }
                super.onReceivedError(view, request, error)
            }

            @Deprecated("Deprecated in Java")
            override fun onReceivedError(
                view: WebView,
                errorCode: Int,
                description: String?,
                failingUrl: String?
            ) {
                val host = try { Uri.parse(failingUrl).host?.lowercase() ?: "" } catch (_: Exception) { "" }
                if (host == "appassets.androidplatform.net" || host == "localhost") {
                    Log.w("MainActivity", "Legacy navigation error recovered for: $failingUrl")
                    view.post {
                        view.loadUrl("https://appassets.androidplatform.net/assets/dist/index.html")
                    }
                    return
                }
                super.onReceivedError(view, errorCode, description, failingUrl)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                nativeBridge.injectShim()
            }
        }

        // Expose NativeBridge to window.CropAssistantAndroid
        webView.addJavascriptInterface(nativeBridge, "CropAssistantAndroid")

        // Load the local offline bundle
        webView.loadUrl("https://appassets.androidplatform.net/assets/dist/index.html")
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            val callback = filePathCallback
            filePathCallback = null

            if (callback != null) {
                if (resultCode == Activity.RESULT_OK) {
                    val resultUri: Uri? = if (data == null || data.data == null) {
                        // Image was taken using camera
                        cameraImageUri
                    } else {
                        // Image picked from gallery
                        data.data
                    }

                    if (resultUri != null) {
                        callback.onReceiveValue(arrayOf(resultUri))
                    } else {
                        callback.onReceiveValue(null)
                    }
                } else {
                    callback.onReceiveValue(null)
                }
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        nativeBridge.destroy()
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
