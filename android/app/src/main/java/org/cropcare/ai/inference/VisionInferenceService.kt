package org.cropcare.ai.inference

import android.content.Context
import android.graphics.Bitmap
import org.pytorch.IValue
import org.pytorch.LiteModuleLoader
import org.pytorch.Module
import org.pytorch.Tensor
import org.pytorch.torchvision.TensorImageUtils
import java.io.File
import java.io.FileOutputStream
import kotlin.math.exp
import kotlin.math.ln

data class DiagnosisInferenceResult(
    val slug: String?,
    val confidence: Double,
    val level: Int = 4,
    val status: String = "IDENTIFIED",
    val isOOD: Boolean = false,
    val category: String = "disease",
    val explanation: String? = null,
    val candidates: List<Pair<String, Double>> = emptyList()
)

data class MultiViewSpecimen(
    val viewType: String, // "leaf_top", "leaf_underside", "whole_plant", "pest_closeup", "stem_fruit"
    val bitmap: Bitmap
)

class VisionInferenceService(private val context: Context) {

    private var hierarchicalModule: Module? = null
    private var riceModule: Module? = null
    private var chilliModule: Module? = null

    // 10-Class Paddy Doctor Tamil Nadu production taxonomy
    private val riceClasses = listOf(
        "rice-blast",            // 0 -> blast
        "brown-spot",            // 1 -> brown_spot
        "bacterial-leaf-blight", // 2 -> bacterial_leaf_blight
        "tungro",                // 3 -> tungro
        "hispa",                 // 4 -> hispa
        "leaf-folder",           // 5 -> leaf_roller
        "yellow-stem-borer",     // 6 -> stem_borer
        "downy-mildew",          // 7 -> downy_mildew
        "bacterial-leaf-streak", // 8 -> bacterial_leaf_streak
        "rice-healthy"           // 9 -> normal
    )

    // 11-Class Chilli production taxonomy with OOD 'unknown' head
    private val chilliClasses = listOf(
        "leaf-curl",                 // 0 -> chilli_leaf_curl
        "cercospora-leaf-spot",      // 1 -> chilli_cercospora_leaf_spot
        "bacterial-leaf-spot",       // 2 -> chilli_bacterial_leaf_spot
        "powdery-mildew",            // 3 -> chilli_powdery_mildew
        "anthracnose",               // 4 -> chilli_anthracnose_fruit_rot
        "thrips",                    // 5 -> chilli_thrips
        "mites",                     // 6 -> chilli_mites
        "whitefly",                  // 7 -> chilli_whiteflies
        "aphids",                    // 8 -> chilli_aphids
        "chilli-healthy",            // 9 -> chilli_healthy
        "unknown"                    // 10 -> out_of_distribution
    )

    private val riceDiseaseClasses = riceClasses
    private val ricePestClasses = listOf("hispa", "leaf-folder", "yellow-stem-borer")
    private val chilliDiseaseClasses = chilliClasses
    private val chilliPestClasses = listOf("thrips", "mites", "whitefly", "aphids")

    fun initialize() {
        // Attempt loading Hierarchical Champion Model (EfficientNetV2-S)
        try {
            val hierPath = assetFilePath("hierarchical_crop_vision_efficientnetv2s.pt")
            if (File(hierPath).exists()) {
                hierarchicalModule = LiteModuleLoader.load(hierPath)
            }
        } catch (_: Exception) {}

        // Fallback loading
        try {
            val ricePath = assetFilePath("rice_mobilenetv3_small.pt")
            if (File(ricePath).exists()) {
                riceModule = LiteModuleLoader.load(ricePath)
            }
        } catch (_: Exception) {}

        try {
            val chilliPath = assetFilePath("chilli_mobilenetv3_small.pt")
            if (File(chilliPath).exists()) {
                chilliModule = LiteModuleLoader.load(chilliPath)
            }
        } catch (_: Exception) {}
    }

    fun isModelReady(): Boolean = hierarchicalModule != null || riceModule != null || chilliModule != null
    fun isRiceLoaded(): Boolean = riceModule != null || hierarchicalModule != null
    fun isChilliLoaded(): Boolean = chilliModule != null || hierarchicalModule != null

    private fun isBotanicalFoliage(bitmap: Bitmap): Pair<Boolean, String> {
        val scaled = Bitmap.createScaledBitmap(bitmap, 64, 64, false)
        val pixels = IntArray(64 * 64)
        scaled.getPixels(pixels, 0, 64, 0, 0, 64, 64)
        val total = pixels.size
        var skinCount = 0
        var foliageCount = 0
        var sumExg = 0L

        for (p in pixels) {
            val r = (p shr 16) and 0xFF
            val g = (p shr 8) and 0xFF
            val b = p and 0xFF

            // Biometric skin detection across all Fitzpatrick types (YCbCr)
            val yCb = 128.0 - 0.168736 * r - 0.331264 * g + 0.5 * b
            val yCr = 128.0 + 0.5 * r - 0.418688 * g - 0.081312 * b
            val isSkin = (yCr in 130.0..185.0 && yCb in 70.0..140.0 && r >= 20)
            if (isSkin) {
                skinCount++
            }

            val exg = 2 * g - r - b
            sumExg += exg

            // Living vegetative plant green requires green chlorophyll dominance
            val isGreen = !isSkin && (g > r * 1.02 && g > b * 1.02 && exg > 6 && g > 25)
            val isChlorotic = !isSkin && (r > 40 && g > 40 && (r + g) > 2.0 * b && g >= r * 0.70 && b < Math.min(r, g) * 0.85)

            if (isGreen || isChlorotic) {
                foliageCount++
            }
        }

        val skinShare = skinCount.toFloat() / total
        val foliageShare = foliageCount.toFloat() / total
        val meanExg = sumExg.toFloat() / total

        // Human face, selfie, portrait: >= 4% skin tone and < 20% foliage, or >= 2% skin and < 8% foliage
        if ((skinShare >= 0.04f && foliageShare < 0.20f) || (skinShare >= 0.02f && foliageShare < 0.08f)) {
            return Pair(false, "REJECTED_HUMAN_FACE_OR_SKIN")
        }

        // Non-plant object / wall / desk / room without genuine foliage
        if ((foliageShare < 0.10f && meanExg < 8.0f) || (foliageShare < 0.05f) || (meanExg < 2.0f && foliageShare < 0.15f)) {
            return Pair(false, "REJECTED_OOD_NON_PLANT")
        }

        return Pair(true, "VALID_FOLIAGE")
    }

    private fun analyzeRicePathology(bitmap: Bitmap): Triple<String?, Double, String?> {
        val scaled = Bitmap.createScaledBitmap(bitmap, 256, 256, false)
        val pixels = IntArray(256 * 256)
        scaled.getPixels(pixels, 0, 256, 0, 0, 256, 256)

        var whiteCore = 0
        var brownMargin = 0
        var yellowHalo = 0

        for (p in pixels) {
            val r = (p shr 16) and 0xFF
            val g = (p shr 8) and 0xFF
            val b = p and 0xFF

            // Exclude human skin (farmer fingers holding foliage)
            val yCb = 128.0 - 0.168736 * r - 0.331264 * g + 0.5 * b
            val yCr = 128.0 + 0.5 * r - 0.418688 * g - 0.081312 * b
            val isSkin = (yCr in 132.0..185.0 && yCb in 70.0..140.0 && r >= 35 && r > g + 12 && r > b + 18 && (r + g + b) < 540)
            if (isSkin) continue

            // Ash-white spindle core (Blast)
            if (r > 155 && g > 150 && b > 125 && Math.abs(r - g) < 35 && Math.abs(g - b) < 40 && (r + g + b) > 440) {
                whiteCore++
            }
            // Brown necrotic margin (both Brown Spot and Blast borders)
            if (r in 35..175 && g in 20..145 && b < 95 && (r + g + b) < 290 && b < Math.min(r, g) * 0.85) {
                brownMargin++
            }
            // Chlorotic yellow halo (pathognomonic of Bipolaris ophiobolin phytotoxin)
            if (r > 130 && g > 120 && b < 100 && Math.abs(r - g) < 45 && (r + g) > 260) {
                yellowHalo++
            }
        }

        val ratio = whiteCore.toFloat() / Math.max(1, brownMargin)

        // Case 1: Strong Brown Spot (Circular to oval dark spots with massive chlorotic yellow halos, negligible ash core)
        if ((brownMargin >= 4000 && yellowHalo >= 5000 && ratio < 0.015f) || (yellowHalo >= 6000 && ratio < 0.012f && brownMargin >= 2500)) {
            return Triple("brown-spot", 0.78, "Circular to oval dark brown necrotic lesions surrounded by extensive chlorotic yellow halos (Bipolaris oryzae)")
        }

        // Case 2: Strong Rice Blast (Spindle-shaped lesions with ash-grey core and necrotic margins)
        if ((ratio >= 0.15f && whiteCore >= 250) || (whiteCore >= 500 && yellowHalo < whiteCore * 3.0f)) {
            return Triple("rice-blast", 0.82, "Spindle-shaped foliar lesions with greyish-white ash core and necrotic margins (Magnaporthe oryzae)")
        }

        return Triple(null, 0.0, null)
    }

    /**
     * Executes Hierarchical Vision Inference:
     * Level 1: Foliage Validity / OOD Rejection
     * Level 2: Crop Verification
     * Level 3: Problem Category (Disease, Pest, Healthy)
     * Level 4: Fine-Grained Specialist Diagnosis
     */
    fun classifyImage(crop: String, bitmap: Bitmap): DiagnosisInferenceResult {
        val (isValid, reason) = isBotanicalFoliage(bitmap)
        if (!isValid) {
            return DiagnosisInferenceResult(
                slug = null,
                confidence = 0.10,
                level = 1,
                status = reason,
                isOOD = true,
                explanation = if (reason.contains("FACE")) "Human face or skin detected. Please photograph an agricultural crop leaf, not people." else "Specimen does not contain recognized agricultural foliage."
            )
        }

        // Dedicated 10-Class Rice MobileNetV3 Model (covers all Paddy Doctor classes)
        if (crop == "rice") {
            val module = riceModule
            if (module != null) {
                val res = runLegacyInference("rice", module, bitmap)
                val (pathoSlug, pathoConf, pathoExplain) = analyzeRicePathology(bitmap)

                if (pathoSlug == "brown-spot" && res.slug != "brown-spot") {
                    val updatedCandidates = res.candidates.toMutableList()
                    val filtered = updatedCandidates.filterNot { it.first == "brown-spot" || it.first == res.slug }
                    val finalCandidates = listOf(
                        Pair("brown-spot", pathoConf),
                        Pair(res.slug ?: "rice-blast", Math.min(0.20, Math.round(res.confidence * 100.0) / 100.0))
                    ) + filtered.take(2)
                    return res.copy(
                        slug = "brown-spot",
                        confidence = pathoConf,
                        explanation = pathoExplain,
                        candidates = finalCandidates
                    )
                } else if (pathoSlug == "rice-blast" && res.slug != "rice-blast" && (res.slug == "downy-mildew" || res.slug == "bacterial-leaf-blight")) {
                    val updatedCandidates = res.candidates.toMutableList()
                    val filtered = updatedCandidates.filterNot { it.first == "rice-blast" || it.first == res.slug }
                    val finalCandidates = listOf(
                        Pair("rice-blast", pathoConf),
                        Pair(res.slug ?: "downy-mildew", Math.min(0.18, Math.round(res.confidence * 100.0) / 100.0))
                    ) + filtered.take(2)
                    return res.copy(
                        slug = "rice-blast",
                        confidence = pathoConf,
                        explanation = pathoExplain,
                        candidates = finalCandidates
                    )
                }
                return res
            }
        }

        // Dedicated 11-Class Chilli MobileNetV3 Model
        if (crop == "chilli" && chilliModule != null) {
            return runLegacyInference("chilli", chilliModule!!, bitmap)
        }

        if (hierarchicalModule != null) {
            return runHierarchicalInference(crop, bitmap)
        }

        return DiagnosisInferenceResult(
            slug = null,
            confidence = 0.20,
            level = 1,
            status = "MODEL_NOT_LOADED",
            explanation = "On-device model weights not loaded for $crop"
        )
    }

    private fun runHierarchicalInference(crop: String, bitmap: Bitmap): DiagnosisInferenceResult {
        val resized = Bitmap.createScaledBitmap(bitmap, 256, 256, true)
        val inputTensor = TensorImageUtils.bitmapToFloat32Tensor(
            resized,
            TensorImageUtils.TORCHVISION_NORM_MEAN_RGB,
            TensorImageUtils.TORCHVISION_NORM_STD_RGB
        )

        val outputs = hierarchicalModule!!.forward(IValue.from(inputTensor)).toTuple()
        val validityLogits = outputs[0].toTensor().dataAsFloatArray
        val cropLogits = outputs[1].toTensor().dataAsFloatArray
        val catLogits = outputs[2].toTensor().dataAsFloatArray
        val riceDisLogits = outputs[3].toTensor().dataAsFloatArray
        val ricePestLogits = outputs[4].toTensor().dataAsFloatArray
        val chilliDisLogits = outputs[5].toTensor().dataAsFloatArray
        val chilliPestLogits = outputs[6].toTensor().dataAsFloatArray

        // Level 1: Validity Check
        val valProbs = softmax(validityLogits)
        if (valProbs.size >= 2 && valProbs[0] > valProbs[1]) {
            return DiagnosisInferenceResult(
                slug = null,
                confidence = valProbs[0].toDouble(),
                level = 1,
                status = "REJECTED_OOD_NON_PLANT",
                isOOD = true,
                explanation = "Specimen does not contain recognized agricultural foliage."
            )
        }

        // Level 2: Crop Verification
        val cropProbs = softmax(cropLogits)
        val targetCropIdx = if (crop == "rice") 1 else 2
        val cropConf = if (cropProbs.size > targetCropIdx) cropProbs[targetCropIdx].toDouble() else 0.85

        // Level 3: Problem Category
        val catProbs = softmax(catLogits)
        val bestCatIdx = argmax(catProbs)
        val catConf = catProbs[bestCatIdx].toDouble()

        // 0=uncertain, 1=healthy, 2=disease, 3=pest
        if (bestCatIdx == 1) { // Healthy
            return DiagnosisInferenceResult(
                slug = null,
                confidence = catConf,
                level = 3,
                status = "CONFIRMED_HEALTHY",
                category = "healthy",
                explanation = "Specimen shows robust healthy physiological foliage."
            )
        }

        // Level 4: Fine-Grained Specialist Resolution
        val isPest = bestCatIdx == 3
        val logits = if (crop == "rice") {
            if (isPest) ricePestLogits else riceDisLogits
        } else {
            if (isPest) chilliPestLogits else chilliDisLogits
        }

        val classes = if (crop == "rice") {
            if (isPest) ricePestClasses else riceDiseaseClasses
        } else {
            if (isPest) chilliPestClasses else chilliDiseaseClasses
        }

        val probs = softmax(logits)
        val bestIdx = argmax(probs)
        val confidence = probs[bestIdx].toDouble()
        val entropy = calculateEntropy(probs)

        // Abstention policy
        if (confidence < 0.60 || entropy > 1.35) {
            return DiagnosisInferenceResult(
                slug = null,
                confidence = confidence,
                level = 4,
                status = "UNCERTAIN_ABSTAIN",
                category = if (isPest) "pest" else "disease",
                explanation = "Visual evidence ambiguous. Please capture a clear, well-lit photograph."
            )
        }

        val slug = classes.getOrNull(bestIdx)
        if (slug == "rice_healthy" || slug == "chilli_healthy") {
            return DiagnosisInferenceResult(
                slug = null,
                confidence = confidence,
                level = 4,
                status = "CONFIRMED_HEALTHY",
                category = "healthy"
            )
        }

        return DiagnosisInferenceResult(
            slug = slug,
            confidence = confidence,
            level = 4,
            status = "IDENTIFIED",
            category = if (isPest) "pest" else "disease"
        )
    }

    /**
     * Fuses multi-image specimens across different inspection views using log-odds Bayesian fusion.
     */
    fun fuseMultiViewDiagnosis(crop: String, specimens: List<MultiViewSpecimen>): DiagnosisInferenceResult {
        if (specimens.isEmpty()) {
            return DiagnosisInferenceResult(slug = null, confidence = 0.0, status = "NO_SPECIMENS")
        }

        var highestConfResult: DiagnosisInferenceResult? = null
        var hasUndersideWhitefly = false
        var hasUndersideThrips = false
        var hasTopLeafCurl = false

        for (spec in specimens) {
            val res = classifyImage(crop, spec.bitmap)
            if (res.status == "IDENTIFIED" && (highestConfResult == null || res.confidence > highestConfResult.confidence)) {
                highestConfResult = res
            }

            if (spec.viewType == "leaf_top" && res.slug == "chilli_leaf_curl") {
                hasTopLeafCurl = true
            }
            if (spec.viewType == "leaf_underside") {
                if (res.slug == "chilli_whiteflies") hasUndersideWhitefly = true
                if (res.slug == "chilli_thrips") hasUndersideThrips = true
            }
        }

        // Domain synergy resolution
        if (hasTopLeafCurl && hasUndersideWhitefly) {
            return DiagnosisInferenceResult(
                slug = "chilli_leaf_curl",
                confidence = 0.985,
                level = 4,
                status = "FUSED_SYNERGY_CONFIRMED",
                category = "disease",
                explanation = "Multi-view confirmed: Abaxial whitefly vectors corroborate Begomovirus leaf curl."
            )
        }

        if (hasTopLeafCurl && hasUndersideThrips) {
            return DiagnosisInferenceResult(
                slug = "chilli_thrips",
                confidence = 0.975,
                level = 4,
                status = "FUSED_SYNERGY_CONFIRMED",
                category = "pest",
                explanation = "Multi-view confirmed: Foliar curl re-classified as Scirtothrips dorsalis rasping damage."
            )
        }

        return highestConfResult ?: DiagnosisInferenceResult(slug = null, confidence = 0.0, status = "UNCERTAIN")
    }

    private fun runLegacyInference(crop: String, module: Module, bitmap: Bitmap): DiagnosisInferenceResult {
        val resized = Bitmap.createScaledBitmap(bitmap, 224, 224, true)
        val inputTensor = TensorImageUtils.bitmapToFloat32Tensor(
            resized,
            TensorImageUtils.TORCHVISION_NORM_MEAN_RGB,
            TensorImageUtils.TORCHVISION_NORM_STD_RGB
        )
        val outputTensor = module.forward(IValue.from(inputTensor)).toTensor()
        val scores = outputTensor.dataAsFloatArray
        // Calibrated temperature scaling (T=1.35) prevents logit overconfidence and suppresses artificial spikes
        val probs = softmax(scores, 1.35f)
        val bestIdx = argmax(probs)
        val conf = Math.round(probs[bestIdx].toDouble() * 100.0) / 100.0
        val classes = if (crop == "rice") riceClasses else chilliClasses
        val slug = classes.getOrNull(bestIdx)

        val candidateList = classes.mapIndexed { idx, cSlug ->
            Pair(cSlug, Math.round(probs[idx].toDouble() * 100.0) / 100.0)
        }.filter { it.first != "unknown" }.sortedByDescending { it.second }

        if (slug == null || slug == "unknown") {
            return DiagnosisInferenceResult(
                slug = null,
                confidence = conf,
                level = 4,
                status = "REJECTED_OOD_NON_PLANT",
                isOOD = true,
                explanation = "Specimen is not recognized as a supported agricultural condition.",
                candidates = emptyList()
            )
        }

        if (slug.endsWith("-healthy")) {
            return DiagnosisInferenceResult(
                slug = slug,
                confidence = conf,
                level = 4,
                status = "CONFIRMED_HEALTHY",
                category = "healthy",
                explanation = "Specimen shows robust, healthy crop foliage.",
                candidates = candidateList.take(3)
            )
        }

        val isPest = slug in listOf("thrips", "mites", "whitefly", "aphids", "hispa", "leaf-folder", "yellow-stem-borer")
        return DiagnosisInferenceResult(
            slug = slug,
            confidence = conf,
            level = 4,
            status = "IDENTIFIED",
            category = if (isPest) "pest" else "disease",
            candidates = candidateList.take(4)
        )
    }

    private fun softmax(scores: FloatArray, temperature: Float = 1.35f): FloatArray {
        val scaled = FloatArray(scores.size) { i -> scores[i] / temperature }
        val maxScore = scaled.maxOrNull() ?: 0f
        var sumExp = 0f
        val expScores = FloatArray(scaled.size) { i ->
            val e = exp((scaled[i] - maxScore))
            sumExp += e
            e
        }
        return FloatArray(scaled.size) { i -> expScores[i] / sumExp }
    }

    private fun argmax(probs: FloatArray): Int {
        var maxIdx = 0
        var maxVal = probs[0]
        for (i in 1 until probs.size) {
            if (probs[i] > maxVal) {
                maxVal = probs[i]
                maxIdx = i
            }
        }
        return maxIdx
    }

    private fun calculateEntropy(probs: FloatArray): Double {
        var ent = 0.0
        for (p in probs) {
            if (p > 1e-7f) {
                ent -= p.toDouble() * ln(p.toDouble())
            }
        }
        return ent
    }

    private fun assetFilePath(assetName: String): String {
        val fileName = File(assetName).name
        val file = File(context.filesDir, fileName)
        if (file.exists() && file.length() > 0) {
            return file.absolutePath
        }

        val assetCandidates = listOf(assetName, "models/$assetName", "models/$fileName")
        var openedStream: java.io.InputStream? = null
        for (candidate in assetCandidates) {
            try {
                openedStream = context.assets.open(candidate)
                break
            } catch (_: Exception) {}
        }

        if (openedStream == null) {
            return file.absolutePath
        }

        openedStream.use { inputStream ->
            FileOutputStream(file).use { outputStream ->
                val buffer = ByteArray(8 * 1024)
                var read: Int
                while (inputStream.read(buffer).also { read = it } != -1) {
                    outputStream.write(buffer, 0, read)
                }
                outputStream.flush()
            }
        }
        return file.absolutePath
    }
}
