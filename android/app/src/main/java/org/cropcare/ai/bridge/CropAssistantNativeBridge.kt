package org.cropcare.ai.bridge

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.WebView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.cropcare.ai.inference.LlamaInferenceService
import org.cropcare.ai.inference.VisionInferenceService
import org.cropcare.ai.safety.SafetyValidationService
import org.cropcare.ai.severity.SeverityAnalysisService
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

class CropAssistantNativeBridge(
    private val context: Context,
    private val webView: WebView
) {
    private val scope = CoroutineScope(Dispatchers.Main)
    private val visionService = VisionInferenceService(context)
    private val llamaService = LlamaInferenceService(context)
    private val severityService = SeverityAnalysisService()
    private val safetyService = SafetyValidationService()

    private var tts: TextToSpeech? = null
    private var isTtsReady = false

    init {
        // Pre-warm services on startup
        scope.launch(Dispatchers.IO) {
            visionService.initialize()
            llamaService.initialize()
        }

        // Initialize Native Vernacular Text-To-Speech engine
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                isTtsReady = true
                tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        notifyPlaybackState(true)
                    }

                    override fun onDone(utteranceId: String?) {
                        notifyPlaybackState(false)
                    }

                    @Deprecated("Deprecated in Java")
                    override fun onError(utteranceId: String?) {
                        notifyPlaybackState(false)
                    }
                })
            }
        }
    }

    private fun notifyPlaybackState(isPlaying: Boolean) {
        scope.launch(Dispatchers.Main) {
            webView.evaluateJavascript(
                "if (window.onCropAssistantVoiceState) window.onCropAssistantVoiceState($isPlaying);",
                null
            )
        }
    }

    @JavascriptInterface
    fun speakText(text: String, lang: String): Boolean {
        if (!isTtsReady || tts == null) return false

        val targetLocale = when (lang.lowercase()) {
            "te" -> Locale("te", "IN")
            "ta" -> Locale("ta", "IN")
            "kn" -> Locale("kn", "IN")
            "mr" -> Locale("mr", "IN")
            "hi" -> Locale("hi", "IN")
            else -> Locale("en", "IN")
        }

        var result = tts?.setLanguage(targetLocale)
        if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
            // Graceful fallback to Indian English or Hindi
            result = tts?.setLanguage(Locale("hi", "IN"))
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.setLanguage(Locale("en", "IN"))
            }
        }

        tts?.setSpeechRate(0.92f)
        tts?.setPitch(1.0f)
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "CropAssistantVoiceAgent")
        return true
    }

    @JavascriptInterface
    fun stopSpeaking() {
        tts?.stop()
        notifyPlaybackState(false)
    }

    @JavascriptInterface
    fun isSpeaking(): Boolean {
        return tts?.isSpeaking == true
    }

    fun destroy() {
        tts?.stop()
        tts?.shutdown()
    }

    /**
     * Injects the Promise-based window.CropAssistantNative bridge object into the DOM.
     */
    fun injectShim() {
        val shimScript = """
            (function() {
                window.CropAssistantNative = window.CropAssistantNative || {};
                window.CropAssistantNative.diagnose = function(input) {
                    return new Promise(function(resolve, reject) {
                        try {
                            var resJson = window.CropAssistantAndroid.diagnoseSync(JSON.stringify(input));
                            resolve(JSON.parse(resJson));
                        } catch (e) {
                            reject(e);
                        }
                    });
                };
                window.CropAssistantNative.ask = function(input) {
                    return new Promise(function(resolve, reject) {
                        try {
                            var ans = window.CropAssistantAndroid.askSync(JSON.stringify(input));
                            resolve(ans);
                        } catch (e) {
                            reject(e);
                        }
                    });
                };
                window.CropAssistantNative.status = function() {
                    return new Promise(function(resolve, reject) {
                        try {
                            var resJson = window.CropAssistantAndroid.statusSync();
                            resolve(JSON.parse(resJson));
                        } catch (e) {
                            reject(e);
                        }
                    });
                };
                window.CropAssistantNative.speak = function(text, lang) {
                    try {
                        if (window.CropAssistantAndroid && window.CropAssistantAndroid.speakText) {
                            return window.CropAssistantAndroid.speakText(text, lang || "en");
                        }
                    } catch (e) {}
                    return false;
                };
                window.CropAssistantNative.stopSpeaking = function() {
                    try {
                        if (window.CropAssistantAndroid && window.CropAssistantAndroid.stopSpeaking) {
                            window.CropAssistantAndroid.stopSpeaking();
                        }
                    } catch (e) {}
                };
                window.CropAssistantNative.isSpeaking = function() {
                    try {
                        if (window.CropAssistantAndroid && window.CropAssistantAndroid.isSpeaking) {
                            return window.CropAssistantAndroid.isSpeaking();
                        }
                    } catch (e) {}
                    return false;
                };
            })();
        """.trimIndent()

        webView.evaluateJavascript(shimScript, null)
    }

    @JavascriptInterface
    fun diagnoseSync(payloadJson: String): String {
        return try {
            val input = JSONObject(payloadJson)
            val crop = input.getString("crop")
            val mode = input.optString("mode", "disease")
            val imageDataUrl = input.getString("imageDataUrl")

            val bitmap = decodeBase64Image(imageDataUrl)
                ?: return JSONObject().apply {
                    put("slug", JSONObject.NULL)
                    put("confidence", 0.0)
                    put("error", "Failed to decode image")
                }.toString()

            val diagResult = visionService.classifyImage(crop, bitmap, mode)
            val slug = diagResult.slug
            val confidence = diagResult.confidence

            val response = JSONObject()
            if (diagResult.isOOD || slug == null || slug == "unknown") {
                response.put("slug", JSONObject.NULL)
                response.put("confidence", confidence)
                response.put("status", diagResult.status)
                response.put("isOOD", true)
                response.put("explanation", diagResult.explanation ?: "Specimen not recognized as agricultural foliage")
            } else {
                response.put("slug", slug)
                response.put("confidence", confidence)
                response.put("status", diagResult.status)
                response.put("category", diagResult.category)
                if (diagResult.explanation != null) {
                    response.put("explanation", diagResult.explanation)
                }

                val candArray = JSONArray()
                for ((cSlug, cConf) in diagResult.candidates) {
                    val candObj = JSONObject()
                    candObj.put("slug", cSlug)
                    candObj.put("confidence", cConf)
                    candArray.put(candObj)
                }
                response.put("candidates", candArray)

                // Run computer vision severity calculation if it's a disease
                if (diagResult.category == "disease") {
                    val severity = severityService.calculateSeverity(crop, slug, bitmap)
                    val sevObj = JSONObject().apply {
                        put("affectedPercent", severity.affectedPercent)
                        put("stage", severity.stage)
                        put("headline", severity.headline)
                        put("urgency", severity.urgency)
                        put("rationale", severity.rationale)
                    }
                    response.put("severity", sevObj)
                }
            }

            response.toString()
        } catch (e: Exception) {
            JSONObject().apply {
                put("slug", JSONObject.NULL)
                put("confidence", 0.0)
                put("error", e.message)
            }.toString()
        }
    }

    @JavascriptInterface
    fun askSync(payloadJson: String): String {
        return try {
            val input = JSONObject(payloadJson)
            val question = input.optString("question", "")
            val lang = input.optString("lang", "en")
            val context = input.optString("context", "")

            // 1. Enforce statutory safety check
            val safetyResult = safetyService.validateQuery(question, lang)
            if (!safetyResult.isSafe) {
                return safetyResult.refusalMessage
            }

            // 2. Generate response using Llama on-device engine
            val queryWithContext = if (context.isNotBlank()) "$question $context" else question
            val answer = llamaService.generateResponse(queryWithContext, lang)
            safetyService.validateResponse(answer, lang)
        } catch (e: Exception) {
            "An error occurred while processing the inquiry."
        }
    }

    @JavascriptInterface
    fun statusSync(): String {
        val array = JSONArray()

        array.put(JSONObject().apply {
            put("name", "Llama 3.2 1B Instruct (On-Device LLM)")
            put("type", "Language / Multimodal")
            put("status", if (llamaService.isReady()) "Ready" else "Active")
            put("details", "4-bit quantized ExecuTorch engine supporting English, Hindi, and Telugu.")
        })

        array.put(JSONObject().apply {
            put("name", "MobileNetV3-Small (Rice Classifier)")
            put("type", "Vision")
            put("status", if (visionService.isRiceLoaded()) "Ready" else "Standby")
            put("details", "Quantized TorchScript / ExecuTorch model running on-device.")
        })

        array.put(JSONObject().apply {
            put("name", "MobileNetV3-Small (Chilli Classifier)")
            put("type", "Vision")
            put("status", if (visionService.isChilliLoaded()) "Ready" else "Standby")
            put("details", "Quantized TorchScript / ExecuTorch model running on-device.")
        })

        array.put(JSONObject().apply {
            put("name", "Agricultural Knowledge DB")
            put("type", "Database")
            put("status", "Active")
            put("details", "SQLite 3 engine containing ICAR, ANGRAU, and PJTSAU advisory records.")
        })

        array.put(JSONObject().apply {
            put("name", "CIB&RC Statutory Safety Validator")
            put("type", "Safety")
            put("status", "Enforcing")
            put("details", "Strictly intercepts unapproved dosages, mixing, and chemical hazards.")
        })

        array.put(JSONObject().apply {
            put("name", "Multilingual Vernacular Voice Agent")
            put("type", "Speech / Audio")
            put("status", if (isTtsReady) "Ready" else "Active")
            put("details", "Native Android offline speech synthesizer supporting English, Hindi, Telugu, Tamil, Kannada, and Marathi.")
        })

        return array.toString()
    }

    private fun decodeBase64Image(dataUrl: String): Bitmap? {
        val base64 = if (dataUrl.contains(",")) {
            dataUrl.substring(dataUrl.indexOf(",") + 1)
        } else {
            dataUrl
        }
        val bytes = Base64.decode(base64, Base64.DEFAULT)
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    }
}

