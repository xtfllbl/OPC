import android.animation.Animator
import android.animation.AnimatorSet
import android.animation.Keyframe
import android.animation.ObjectAnimator
import android.animation.PropertyValuesHolder
import android.animation.TimeInterpolator
import android.animation.ValueAnimator
import android.os.Build
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.PathInterpolator

object OpcOpenDoorAnimations {
    private const val DOOR_DURATION_MS = 4200L
    private const val RING_DURATION_MS = 2600L

    fun createOpenDoorLoop(
        ring: View,
        doorPanel: View,
        interiorGlow: View,
        doorShadow: View,
        lockGlow: View? = null,
        shackle: View? = null
    ): AnimatorSet {
        val animators = mutableListOf(
            createRingPulseAnimator(ring),
            createDoorSwingAnimator(doorPanel),
            createInteriorGlowAnimator(interiorGlow),
            createDoorShadowAnimator(doorShadow)
        )
        lockGlow?.let { animators.add(createLockGlowAnimator(it)) }
        shackle?.let { animators.add(createShackleUnlockAnimator(it)) }
        return AnimatorSet().apply {
            playTogether(animators)
        }
    }

    fun createRingPulseAnimator(ring: View): Animator {
        val alpha = PropertyValuesHolder.ofKeyframe(
            View.ALPHA,
            Keyframe.ofFloat(0f, 0.3f),
            Keyframe.ofFloat(0.5f, 0.7f),
            Keyframe.ofFloat(1f, 0.3f)
        )
        val scaleX = PropertyValuesHolder.ofKeyframe(
            View.SCALE_X,
            Keyframe.ofFloat(0f, 0.98f),
            Keyframe.ofFloat(0.5f, 1.02f),
            Keyframe.ofFloat(1f, 0.98f)
        )
        val scaleY = PropertyValuesHolder.ofKeyframe(
            View.SCALE_Y,
            Keyframe.ofFloat(0f, 0.98f),
            Keyframe.ofFloat(0.5f, 1.02f),
            Keyframe.ofFloat(1f, 0.98f)
        )
        return ObjectAnimator.ofPropertyValuesHolder(ring, alpha, scaleX, scaleY).apply {
            duration = RING_DURATION_MS
            interpolator = AccelerateDecelerateInterpolator()
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.RESTART
        }
    }

    fun createDoorSwingAnimator(doorPanel: View): Animator {
        val density = doorPanel.resources.displayMetrics.density
        doorPanel.post {
            doorPanel.pivotX = doorPanel.width.toFloat()
            doorPanel.pivotY = doorPanel.height * 0.5f
            doorPanel.cameraDistance = 1000f * density
        }

        val rotation = PropertyValuesHolder.ofKeyframe(
            View.ROTATION_Y,
            Keyframe.ofFloat(0f, 0f),
            Keyframe.ofFloat(0.12f, 0f),
            Keyframe.ofFloat(0.40f, 78f),
            Keyframe.ofFloat(0.55f, 70f),
            Keyframe.ofFloat(1f, 0f)
        )

        val holders = mutableListOf(rotation)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            val translationZ = PropertyValuesHolder.ofKeyframe(
                View.TRANSLATION_Z,
                Keyframe.ofFloat(0f, dpToPx(8f, density)),
                Keyframe.ofFloat(0.12f, dpToPx(8f, density)),
                Keyframe.ofFloat(0.40f, dpToPx(32f, density)),
                Keyframe.ofFloat(0.55f, dpToPx(28f, density)),
                Keyframe.ofFloat(1f, dpToPx(8f, density))
            )
            holders.add(translationZ)
        }

        return ObjectAnimator.ofPropertyValuesHolder(doorPanel, *holders.toTypedArray()).apply {
            duration = DOOR_DURATION_MS
            interpolator = doorInterpolator()
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.RESTART
        }
    }

    fun createInteriorGlowAnimator(interiorGlow: View): Animator {
        val alpha = PropertyValuesHolder.ofKeyframe(
            View.ALPHA,
            Keyframe.ofFloat(0f, 0.85f),
            Keyframe.ofFloat(0.12f, 0.85f),
            Keyframe.ofFloat(0.40f, 1f),
            Keyframe.ofFloat(0.55f, 1f),
            Keyframe.ofFloat(1f, 0.85f)
        )
        return ObjectAnimator.ofPropertyValuesHolder(interiorGlow, alpha).apply {
            duration = DOOR_DURATION_MS
            interpolator = AccelerateDecelerateInterpolator()
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.RESTART
        }
    }

    fun createDoorShadowAnimator(doorShadow: View): Animator {
        val density = doorShadow.resources.displayMetrics.density
        val alpha = PropertyValuesHolder.ofKeyframe(
            View.ALPHA,
            Keyframe.ofFloat(0f, 0.2f),
            Keyframe.ofFloat(0.12f, 0.2f),
            Keyframe.ofFloat(0.40f, 0.5f),
            Keyframe.ofFloat(0.55f, 0.5f),
            Keyframe.ofFloat(1f, 0.2f)
        )
        val translateX = PropertyValuesHolder.ofKeyframe(
            View.TRANSLATION_X,
            Keyframe.ofFloat(0f, 0f),
            Keyframe.ofFloat(0.12f, 0f),
            Keyframe.ofFloat(0.40f, -dpToPx(10f, density)),
            Keyframe.ofFloat(0.55f, -dpToPx(10f, density)),
            Keyframe.ofFloat(1f, 0f)
        )
        return ObjectAnimator.ofPropertyValuesHolder(doorShadow, alpha, translateX).apply {
            duration = DOOR_DURATION_MS
            interpolator = AccelerateDecelerateInterpolator()
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.RESTART
        }
    }

    fun createLockGlowAnimator(lockGlow: View): Animator {
        val alpha = PropertyValuesHolder.ofKeyframe(
            View.ALPHA,
            Keyframe.ofFloat(0f, 0.35f),
            Keyframe.ofFloat(0.18f, 0.35f),
            Keyframe.ofFloat(0.40f, 0.75f),
            Keyframe.ofFloat(0.60f, 0.75f),
            Keyframe.ofFloat(1f, 0.35f)
        )
        val scaleX = PropertyValuesHolder.ofKeyframe(
            View.SCALE_X,
            Keyframe.ofFloat(0f, 0.98f),
            Keyframe.ofFloat(0.18f, 0.98f),
            Keyframe.ofFloat(0.40f, 1.04f),
            Keyframe.ofFloat(0.60f, 1.04f),
            Keyframe.ofFloat(1f, 0.98f)
        )
        val scaleY = PropertyValuesHolder.ofKeyframe(
            View.SCALE_Y,
            Keyframe.ofFloat(0f, 0.98f),
            Keyframe.ofFloat(0.18f, 0.98f),
            Keyframe.ofFloat(0.40f, 1.04f),
            Keyframe.ofFloat(0.60f, 1.04f),
            Keyframe.ofFloat(1f, 0.98f)
        )
        return ObjectAnimator.ofPropertyValuesHolder(lockGlow, alpha, scaleX, scaleY).apply {
            duration = DOOR_DURATION_MS
            interpolator = AccelerateDecelerateInterpolator()
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.RESTART
        }
    }

    fun createShackleUnlockAnimator(shackle: View): Animator {
        val density = shackle.resources.displayMetrics.density
        shackle.post {
            shackle.pivotX = 0f
            shackle.pivotY = shackle.height.toFloat()
        }
        val rotation = PropertyValuesHolder.ofKeyframe(
            View.ROTATION,
            Keyframe.ofFloat(0f, -6f),
            Keyframe.ofFloat(0.18f, -6f),
            Keyframe.ofFloat(0.32f, -14f),
            Keyframe.ofFloat(0.45f, -42f),
            Keyframe.ofFloat(0.60f, -40f),
            Keyframe.ofFloat(0.78f, -14f),
            Keyframe.ofFloat(1f, -6f)
        )
        val translateY = PropertyValuesHolder.ofKeyframe(
            View.TRANSLATION_Y,
            Keyframe.ofFloat(0f, 0f),
            Keyframe.ofFloat(0.18f, 0f),
            Keyframe.ofFloat(0.32f, -dpToPx(2f, density)),
            Keyframe.ofFloat(0.45f, -dpToPx(10f, density)),
            Keyframe.ofFloat(0.60f, -dpToPx(10f, density)),
            Keyframe.ofFloat(0.78f, -dpToPx(2f, density)),
            Keyframe.ofFloat(1f, 0f)
        )
        return ObjectAnimator.ofPropertyValuesHolder(shackle, rotation, translateY).apply {
            duration = DOOR_DURATION_MS
            interpolator = AccelerateDecelerateInterpolator()
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.RESTART
        }
    }

    private fun dpToPx(dp: Float, density: Float): Float {
        return dp * density
    }

    private fun doorInterpolator(): TimeInterpolator {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            PathInterpolator(0.4f, 0f, 0.2f, 1f)
        } else {
            AccelerateDecelerateInterpolator()
        }
    }
}
