document.addEventListener('DOMContentLoaded', function () {
  const isEditor = document.body.classList.contains('elementor-editor-active');

  if (!window.gsap) {
    console.warn('GSAP not loaded.');
    return;
  }
  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  } else {
    console.warn('ScrollTrigger not loaded. Scroll-based animations may not work.');
  }

  // Lenis smooth scrolling - synced with ScrollTrigger
  function initLenis() {
    if (!window.lenis && window.Lenis) {
      window.lenis = new window.Lenis({ lerp: 0.1, duration: 1.2, smoothWheel: true });
    }
    const lenis = window.lenis;
    if (!lenis) return;

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.targetScroll;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: document.body.style.transform ? 'transform' : 'fixed'
    });

    lenis.on('scroll', ScrollTrigger.update);

    function frame(time) { lenis.raf(time); requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
  }
  function waitForLenis() {
    if (window.Lenis && window.supercraftLenisEnabled) {
      initLenis();
    } else {
      setTimeout(waitForLenis, 100);
    }
  }
  waitForLenis();

  /* ==========================================
     CORE ANIMATIONS: split-text / blur / fade
     ========================================== */
  function initCoreAnimations() {
    const elements = document.querySelectorAll(
      '.split-text-reveal-up, .anim-fade-up, .blur-reveal, .split-text-char-fade, .split-text-char-fade-y, .split-text-char-fade-scroll, .split-text-char-fade-y-scroll, .split-text-word-fade, .split-text-word-fade-y, .split-text-word-fade-scroll, .split-text-word-fade-y-scroll, .split-text-word-fade-y-blur, .split-text-word-fade-y-blur-scroll, .split-text-word-mask-up, .split-text-word-mask-up-scroll, .split-text-char-mask-up, .split-text-char-mask-up-scroll'
    );

    elements.forEach((el) => {
      if (el.dataset.animInit === 'true') return;

      const isSplitFade =
        el.classList.contains('split-text-char-fade') ||
        el.classList.contains('split-text-char-fade-y') ||
        el.classList.contains('split-text-char-fade-scroll') ||
        el.classList.contains('split-text-char-fade-y-scroll') ||
        el.classList.contains('split-text-word-fade') ||
        el.classList.contains('split-text-word-fade-y') ||
        el.classList.contains('split-text-word-fade-scroll') ||
        el.classList.contains('split-text-word-fade-y-scroll') ||
        el.classList.contains('split-text-word-fade-y-blur') ||
        el.classList.contains('split-text-word-fade-y-blur-scroll') ||
        el.classList.contains('split-text-word-mask-up') ||
        el.classList.contains('split-text-word-mask-up-scroll') ||
        el.classList.contains('split-text-char-mask-up') ||
        el.classList.contains('split-text-char-mask-up-scroll');

      if (isSplitFade) {
        if (typeof window.SplitType !== 'function') {
          console.warn('SplitType not loaded for split-text animations');
          return;
        }

        const textTarget = (() => {
          if (
            el.matches(
              '.elementor-heading-title, h1, h2, h3, h4, h5, h6, p, span'
            )
          ) {
            return el;
          }
          return (
            el.querySelector(
              '.elementor-heading-title, h1, h2, h3, h4, h5, h6, p, span'
            ) || el
          );
        })();

        const isWord =
          el.classList.contains('split-text-word-fade') ||
          el.classList.contains('split-text-word-fade-y') ||
          el.classList.contains('split-text-word-fade-scroll') ||
          el.classList.contains('split-text-word-fade-y-scroll') ||
          el.classList.contains('split-text-word-fade-y-blur') ||
          el.classList.contains('split-text-word-fade-y-blur-scroll') ||
          el.classList.contains('split-text-word-mask-up') ||
          el.classList.contains('split-text-word-mask-up-scroll');

        const split = new SplitType(textTarget, {
          types: isWord ? 'words' : 'words, chars',
          whitespace: 'preserve',
        });

        // Preserve spacing and wrapping for words (char mode now includes words)
        if (split.words?.length) {
          split.words.forEach((wordEl) => {
            wordEl.style.display = 'inline-block';
            wordEl.style.whiteSpace = 'normal';
            wordEl.style.lineHeight = 'inherit';
            wordEl.style.marginRight = '0';
          });
        }

        if (!isWord && split.chars?.length) {
          split.chars.forEach((charEl) => {
            charEl.style.display = 'inline-block';
            charEl.style.whiteSpace = 'pre';
            charEl.style.lineHeight = 'inherit';
          });
        }
        const styles = getComputedStyle(el);

        let offsetX =
          (isWord
            ? styles.getPropertyValue('--word-offset-x')
            : styles.getPropertyValue('--char-offset-x'))?.trim() || '0px';
        let offsetY =
          (isWord
            ? styles.getPropertyValue('--word-offset-y')
            : styles.getPropertyValue('--char-offset-y'))?.trim() || '0px';

        const durationRaw = isWord
          ? styles.getPropertyValue('--word-duration')
          : styles.getPropertyValue('--char-duration');
        const duration =
          durationRaw && !Number.isNaN(parseFloat(durationRaw))
            ? parseFloat(durationRaw)
            : 1.5;

        const staggerRaw = isWord
          ? styles.getPropertyValue('--word-stagger')
          : styles.getPropertyValue('--char-stagger');
        const stagger =
          staggerRaw && !Number.isNaN(parseFloat(staggerRaw))
            ? parseFloat(staggerRaw)
            : 0.05;

        const opacityStartRaw = isWord
          ? styles.getPropertyValue('--word-opacity-start')
          : styles.getPropertyValue('--char-opacity-start');
        let opacityStart =
          opacityStartRaw && !Number.isNaN(parseFloat(opacityStartRaw))
            ? parseFloat(opacityStartRaw)
            : 0;

        const isMaskUpAnim =
          el.classList.contains('split-text-word-mask-up') ||
          el.classList.contains('split-text-word-mask-up-scroll') ||
          el.classList.contains('split-text-char-mask-up') ||
          el.classList.contains('split-text-char-mask-up-scroll');

        if (isMaskUpAnim) {
          offsetX = 0;
          if (offsetY === '0px' || offsetY === '0' || !offsetY) {
            offsetY = '115px';
          }
          opacityStart = 1;
        }

        const ease =
          (isWord
            ? styles.getPropertyValue('--word-ease')
            : styles.getPropertyValue('--char-ease'))?.trim() || 'power2.out';

        // Check if this is a scroll-scrubbed version
        const isScrollScrubbed =
          el.classList.contains('split-text-char-fade-scroll') ||
          el.classList.contains('split-text-char-fade-y-scroll') ||
          el.classList.contains('split-text-char-fade-y-blur-scroll') ||
          el.classList.contains('split-text-word-fade-scroll') ||
          el.classList.contains('split-text-word-fade-y-scroll') ||
          el.classList.contains('split-text-word-fade-y-blur-scroll') ||
          el.classList.contains('split-text-word-mask-up-scroll') ||
          el.classList.contains('split-text-char-mask-up-scroll');

        if (isScrollScrubbed) {
          // Scroll-scrubbed version - tied to scroll position, reversible
          const scrollStart =
            (isWord
              ? styles.getPropertyValue('--word-scroll-start')
              : styles.getPropertyValue('--char-scroll-start'))?.trim() || 'top 85%';
          const scrollEnd =
            (isWord
              ? styles.getPropertyValue('--word-scroll-end')
              : styles.getPropertyValue('--char-scroll-end'))?.trim() || 'top 20%';

          // Optional per-word/char blur for scrubbed variant
          const isWordBlurYScroll = el.classList.contains('split-text-word-fade-y-blur-scroll');
          const isCharBlurYScroll = el.classList.contains('split-text-char-fade-y-blur-scroll');
          let blurStart = (styles.getPropertyValue('--word-blur-start') || '').trim();
          if ((isWord && isWordBlurYScroll) || (!isWord && isCharBlurYScroll)) {
            if (!isWord) {
              blurStart = (styles.getPropertyValue('--char-blur-start') || '').trim();
            }
            if (!blurStart) blurStart = '20px';
            if (/^-?\d+(?:\.\d+)?$/.test(blurStart)) {
              blurStart = blurStart + 'px';
            }
          }

        const fromVars = {
          x: offsetX,
          y: offsetY,
          opacity: opacityStart,
        };
          const toVars = {
            x: 0,
            y: 0,
            opacity: 1,
            duration,
            stagger,
            ease,
            scrollTrigger: {
              trigger: el,
              start: scrollStart,
              end: scrollEnd,
              scrub: 0, // Ties animation to scroll position, reversible
              onUpdate: (self) => {
                const forwardOnly = el.dataset.splitForwardOnly === 'true';
                if (forwardOnly) {
                  const max = Math.max(self.progress, self._maxProgress || 0);
                  self._maxProgress = max;
                  if (self.progress < max) {
                    self.animation.progress(max);
                  }
                }
              },
            },
            // Don't revert on scroll-scrubbed versions - they need to stay split
          };

          if ((isWord && isWordBlurYScroll) || (!isWord && isCharBlurYScroll)) {
            fromVars.filter = `blur(${blurStart})`;
            toVars.filter = 'blur(0px)';
          }

          const targets = isWord ? split.words : split.chars;
          // Ensure initial state is applied before scrub
          gsap.set(targets, fromVars);
          gsap.fromTo(targets, fromVars, {
            ...toVars,
            immediateRender: false,
          });
        } else {
          // One-time trigger version (supports optional blur on words/chars)
          const isWordBlurY = el.classList.contains('split-text-word-fade-y-blur');
          const isCharBlurY = el.classList.contains('split-text-char-fade-y-blur');
          let blurStart = (styles.getPropertyValue(isWord ? '--word-blur-start' : '--char-blur-start') || '').trim();
          if (!blurStart) blurStart = '20px';
          if (/^-?\d+(?:\.\d+)?$/.test(blurStart)) {
            blurStart = blurStart + 'px';
          }

          // Optional overall delay for non-scrubbed variants
          const delayRawStd = styles.getPropertyValue('--animation-delay');
          const delayRawLegacy = isWord
            ? styles.getPropertyValue('--word-delay')
            : styles.getPropertyValue('--char-delay');
          const delaySource = (delayRawStd && !Number.isNaN(parseFloat(delayRawStd))) ? delayRawStd : delayRawLegacy;
          const delayAmt =
            delaySource && !Number.isNaN(parseFloat(delaySource))
              ? parseFloat(delaySource)
              : 0;

          const fromVars = {
            x: offsetX,
            y: offsetY,
            opacity: opacityStart,
          };
          const toVars = {
            x: 0,
            y: 0,
            opacity: 1,
            duration,
          stagger,
          ease,
          immediateRender: false, // don't hide text until the trigger actually fires
          delay: delayAmt,
          scrollTrigger: {
              trigger: el,
              start: 'top 85%',
            },
          };

          if (isWordBlurY || isCharBlurY) {
            fromVars.filter = `blur(${blurStart})`;
            toVars.filter = 'blur(0px)';
          }

          const targets = isWord ? split.words : split.chars;
          gsap.fromTo(targets, fromVars, {
            ...toVars,
            onComplete: () => {
              // Revert to original DOM to keep final spacing identical to pre-split
              split.revert();
            },
          });
          gsap.set(targets, fromVars);
        }

        el.dataset.animInit = 'true';
        return;
      }

      const hasSplit = el.classList.contains('split-text-reveal-up');
      const hasBlur  = el.classList.contains('blur-reveal');
      const hasFade  = el.classList.contains('anim-fade-up');

      let split = null;

      // --- SplitType prep if needed ---
      if (hasSplit) {
        if (typeof window.SplitType !== 'function') {
          console.warn('SplitType not loaded for split-text-reveal-up');
        } else {
          split = new SplitType(el, { types: 'lines, words' });

          el.querySelectorAll('.line').forEach((line) => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('text-reveal-line-wrapper');
            line.parentNode.insertBefore(wrapper, line);
            wrapper.appendChild(line);
          });
        }
      }

      // --- Blur vars from CSS custom props ---
      let duration = 1.5;
      let delay = 0;
      let move = '-20px';

      if (hasBlur) {
        const styles = getComputedStyle(el);
        duration =
          parseFloat(styles.getPropertyValue('--animation-duration')) || 1.5;
        delay =
          parseFloat(styles.getPropertyValue('--animation-delay')) || 0;
        move = styles.getPropertyValue('--move-distance') || '-20px';
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
      });

      // CASE 1: SPLIT + BLUR (blur on words, runs concurrently)
      if (hasSplit && hasBlur && split) {
        tl.from(
          split.words,
          {
            y: '120%',
            opacity: 0,
            filter: 'blur(20px)',
            duration,
            stagger: 0.08,
            ease: 'power2.out',
            onComplete: () => gsap.set(split.words, { filter: 'blur(0px)' }),
          },
          delay // launch the whole group after a trigger delay
        );
        
        // If fade-up is also present, add it to the element concurrently
        if (hasFade) {
          tl.fromTo(
            el,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: 'power2.out',
            },
            delay // start at the same trigger delay so both run together
          );
        }
      }
      // CASE 2: SPLIT ONLY (no blur, only if SplitType available)
      else if (hasSplit && !hasBlur && split) {
        const styles = getComputedStyle(el);
        const splitDelay =
          parseFloat(styles.getPropertyValue('--animation-delay')) ||
          parseFloat(styles.getPropertyValue('--split-delay')) || 0;

        tl.from(
          split.words,
          {
            y: '120%',
            opacity: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power2.out',
          },
          splitDelay // delay the whole split animation launch
        );
        
        // If fade-up is also present, add it to the element concurrently
        if (hasFade) {
          tl.fromTo(
            el,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: 'power2.out',
            },
            splitDelay // align start with split animation
          );
        }
      }
      // CASE 3: BLUR + FADE-UP (both on element, run concurrently)
      else if (hasBlur && hasFade) {
        tl.fromTo(
          el,
          {
            opacity: 0,
            filter: 'blur(20px)',
            y: move,
            scale: 1.1,
          },
          {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            scale: 1,
            duration,
            delay,
            ease: 'power2.out',
          }
        );
        // Fade-up properties are already included in the blur animation
        // (opacity and y are handled together)
      }
      // CASE 4: BLUR ONLY (no split, no fade)
      else if (hasBlur && !hasFade) {
        tl.fromTo(
          el,
          {
            opacity: 0,
            filter: 'blur(20px)',
            y: move,
            scale: 1.1,
          },
          {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            scale: 1,
            duration,
            delay,
            ease: 'power2.out',
          }
        );
      }
      // CASE 5: FADE-UP ONLY (no blur, no split)
      else if (hasFade && !hasBlur && !hasSplit) {
        const styles = getComputedStyle(el);
        const fadeDelay =
          parseFloat(styles.getPropertyValue('--animation-delay')) || 0;

        tl.fromTo(
          el,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            delay: fadeDelay,
          }
        );
      }

      el.dataset.animInit = 'true';
    });
  }

  /* ==========================================
     SCROLL TRANSFORM ANIMATION
     Controlled via CSS custom properties or data attributes
     ========================================== */
  function initScrollTransform() {
    const elements = gsap.utils.toArray('.scroll-transform');

    elements.forEach((el) => {
      // Skip if already initialized
      if (el.dataset.scrollTransformInit === 'true') return;

      const styles = getComputedStyle(el);

      // Prefer data-* overrides first, then CSS vars, then fallbacks
      const pickValue = (cssVarName, dataKey, fallback) => {
        const dataVal = el.dataset[dataKey];
        if (dataVal !== undefined && `${dataVal}`.trim() !== '') {
          return `${dataVal}`.trim();
        }
        const cssVal = styles.getPropertyValue(cssVarName);
        if (cssVal && cssVal.trim() !== '') {
          return cssVal.trim();
        }
        return fallback;
      };

      const pickNumber = (cssVarName, dataKey, fallback) => {
        const raw = pickValue(cssVarName, dataKey, '');
        const num = parseFloat(raw);
        return Number.isNaN(num) ? fallback : num;
      };

      // Get initial values from CSS custom properties or data attributes
      let startX = pickValue('--transform-start-x', 'transformStartX', '0px');
      let startY = pickValue('--transform-start-y', 'transformStartY', '0px');
      let startRotate = pickValue('--transform-start-rotate', 'transformStartRotate', '0deg');
      let startScale = pickNumber('--transform-start-scale', 'transformStartScale', 1);
      let startOpacity = pickNumber('--transform-start-opacity', 'transformStartOpacity', 0);
      let startBlur = pickValue('--transform-start-blur', 'transformStartBlur', '0px');

      // Get end values from CSS custom properties or data attributes
      let endX = pickValue('--transform-end-x', 'transformEndX', '0px');
      let endY = pickValue('--transform-end-y', 'transformEndY', '0px');
      let endRotate = pickValue('--transform-end-rotate', 'transformEndRotate', '0deg');
      let endScale = pickNumber('--transform-end-scale', 'transformEndScale', 1);
      let endOpacity = pickNumber('--transform-end-opacity', 'transformEndOpacity', 1);
      let endBlur = pickValue('--transform-end-blur', 'transformEndBlur', '0px');

      // Get animation settings
      let duration = pickNumber('--transform-duration', 'transformDuration', 1);
      let delay =
        pickNumber('--animation-delay', 'animationDelay', 0) ||
        pickNumber('--transform-delay', 'transformDelay', 0);
      let ease = pickValue('--transform-ease', 'transformEase', 'power2.out');
      let startTrigger = pickValue('--transform-trigger', 'transformTrigger', 'top 85%');

      // Ensure values have units if they're just numbers
      const ensureUnit = (val, defaultUnit = 'px') => {
        if (typeof val === 'string') {
          val = val.trim();
          // If it's just a number, add default unit
          if (/^-?\d+\.?\d*$/.test(val)) {
            return val + defaultUnit;
          }
          return val;
        }
        return val || '0' + defaultUnit;
      };

      // Ensure rotate values have 'deg' unit
      const ensureRotateUnit = (val) => {
        if (typeof val === 'string') {
          val = val.trim();
          if (/^-?\d+\.?\d*$/.test(val)) {
            return val + 'deg';
          }
          return val;
        }
        return val || '0deg';
      };

      // Ensure blur values have 'px' unit
      const ensureBlurUnit = (val) => {
        if (typeof val === 'string') {
          val = val.trim();
          if (/^-?\d+\.?\d*$/.test(val)) {
            return val + 'px';
          }
          return val;
        }
        return val || '0px';
      };

      // Clear any CSS transitions that might interfere with GSAP
      // This is important for containers that might have CSS transitions set
      el.style.transition = 'none';
      el.style.willChange = 'transform, opacity, filter';

      // Set initial state (GSAP accepts string values with units)
      gsap.set(el, {
        x: ensureUnit(startX, 'px'),
        y: ensureUnit(startY, 'px'),
        rotation: ensureRotateUnit(startRotate),
        scale: startScale,
        opacity: startOpacity,
        filter: `blur(${ensureBlurUnit(startBlur)})`,
        force3D: true, // Force hardware acceleration for better performance
        immediateRender: true, // Apply immediately
      });

      // Editor preview override: show start or end state statically if requested
      const previewState = el.dataset.previewState;
      // In editor, default to showing end state for visibility unless explicitly set to "start"
      if (isEditor) {
        const stateToUse = previewState || 'end';
        if (stateToUse === 'end') {
          gsap.set(el, {
            x: ensureUnit(endX, 'px'),
            y: ensureUnit(endY, 'px'),
            rotation: ensureRotateUnit(endRotate),
            scale: endScale,
            opacity: endOpacity,
            filter: `blur(${ensureBlurUnit(endBlur)})`,
          });
        }
        // if stateToUse === 'start', the initial gsap.set above already left it at start
        el.dataset.scrollTransformInit = 'true';
        return;
      }

      // Create timeline for better control over duration
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: startTrigger,
          toggleActions: 'play none none none', // Play once when entering viewport
        },
      });

      // Animate to end state when element enters viewport (entrance animation)
      // Add delay to timeline position if needed
      tl.to(el, {
        x: ensureUnit(endX, 'px'),
        y: ensureUnit(endY, 'px'),
        rotation: ensureRotateUnit(endRotate),
        scale: endScale,
        opacity: endOpacity,
        filter: `blur(${ensureBlurUnit(endBlur)})`,
        duration: duration,
        ease: ease,
        force3D: true, // Force hardware acceleration
      }, delay); // Position delay at timeline position

      el.dataset.scrollTransformInit = 'true';
    });
  }

  /* ==========================================
     SCROLL FILL HEADINGS
     ========================================== */
  function initScrollFillHeadings() {
    // "scroll-fill-text" is on the widget or any wrapper
    const wrappers = gsap.utils.toArray('.scroll-fill-text');

    wrappers.forEach((wrapper) => {
      // Kill any previous trigger so we can rebuild with updated settings
      if (wrapper._scrollFillTrigger) {
        wrapper._scrollFillTrigger.kill();
        wrapper._scrollFillTrigger = null;
      }
      // Also kill any ScrollTrigger whose trigger matches this wrapper (defensive)
      if (window.ScrollTrigger) {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === wrapper) {
            st.kill();
          }
        });
      }

      // Try to find an inner text element (prioritize actual text elements, not containers)
      let el = wrapper.querySelector(
        '.elementor-heading-title, h1, h2, h3, h4, h5, h6, p, span, .elementor-icon-box-title, .elementor-icon-box-description'
      );
      
      // If no text element found, check if wrapper itself is a text element
      if (!el) {
        const tagName = wrapper.tagName?.toLowerCase();
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'].includes(tagName)) {
          el = wrapper;
        } else {
          // Last resort: use wrapper but try to find text inside
          el = wrapper.querySelector('.elementor-widget-container') || wrapper;
        }
      }

      const wrapperStyles = getComputedStyle(wrapper);
      const baseOverride =
        (wrapperStyles.getPropertyValue('--scroll-fill-base') || '').trim() ||
        (wrapper.dataset.scrollFillBase || '').trim();

      // Resolve the text color robustly — getComputedStyle resolves CSS vars,
      // but we need to read from the correct element and handle edge cases.
      const resolveColor = (element) => {
        let color = getComputedStyle(element).color;
        // If color is empty, transparent, or the default black placeholder,
        // try to read from the element's webkitTextFillColor in case it was set
        if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
          color = getComputedStyle(element).webkitTextFillColor;
        }
        return color;
      };

      let originalColorStr = resolveColor(el);
      // If still no color or transparent, walk up to the wrapper
      if (!originalColorStr || originalColorStr === 'rgba(0, 0, 0, 0)' || originalColorStr === 'transparent') {
        originalColorStr = resolveColor(wrapper);
      }
      // Final fallback to black
      if (!originalColorStr || originalColorStr === 'rgba(0, 0, 0, 0)' || originalColorStr === 'transparent') {
        originalColorStr = 'rgb(0, 0, 0)';
      }

      const hexToRgba = (hex) => {
        const clean = hex.replace('#', '');
        const full = clean.length === 3
          ? clean.split('').map((c) => c + c).join('')
          : clean;
        if (full.length !== 6) return null;
        const intVal = parseInt(full, 16);
        const r = (intVal >> 16) & 255;
        const g = (intVal >> 8) & 255;
        const b = intVal & 255;
        return { r, g, b, a: 1 };
      };

      const parseColor = (str) => {
        if (!str) return null;
        let m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
        if (m) {
          return {
            r: parseInt(m[1], 10),
            g: parseInt(m[2], 10),
            b: parseInt(m[3], 10),
            a: m[4] !== undefined ? parseFloat(m[4]) : 1,
          };
        }
        if (str.startsWith('#')) return hexToRgba(str);
        // Handle CSS variables that weren't resolved — use a temp element
        if (str.startsWith('var(')) {
          const temp = document.createElement('span');
          temp.style.color = str;
          temp.style.display = 'none';
          document.body.appendChild(temp);
          const resolved = getComputedStyle(temp).color;
          document.body.removeChild(temp);
          return parseColor(resolved);
        }
        return null;
      };

      const originalParsed = parseColor(originalColorStr) || { r: 0, g: 0, b: 0, a: 1 };
      const baseParsed = baseOverride ? parseColor(baseOverride) : null;

      // Unfilled/base color: use provided base (force alpha to 1) or dimmed original
      const dimColor = baseParsed
        ? `rgba(${baseParsed.r}, ${baseParsed.g}, ${baseParsed.b}, 1)`
        : `rgba(${originalParsed.r}, ${originalParsed.g}, ${originalParsed.b}, 0.2)`;

      // Filled color: always solid original (alpha forced to 1)
      const fullColor = `rgba(${originalParsed.r}, ${originalParsed.g}, ${originalParsed.b}, 1)`;

      // Two-layer background: base stays visible, fill overlays as it grows
      // Use cssText to ensure -webkit-background-clip: text is preserved literally
      // (el.style.webkitBackgroundClip can be normalized/dropped by some browsers)
      const existingStyle = el.getAttribute('style') || '';
      // Strip any previously injected scroll-fill styles to avoid duplicates on re-init
      const cleaned = existingStyle
        .replace(/background-image:[^;]*;?/gi, '')
        .replace(/background-repeat:[^;]*;?/gi, '')
        .replace(/background-size:[^;]*;?/gi, '')
        .replace(/-webkit-background-clip:[^;]*;?/gi, '')
        .replace(/background-clip:[^;]*;?/gi, '')
        .replace(/-webkit-text-fill-color:[^;]*;?/gi, '')
        .replace(/display:\s*inline-block[^;]*;?/gi, '')
        .replace(/color:\s*transparent[^;]*;?/gi, '')
        .trim();
      
      const scrollFillStyles = [
        `background-image: linear-gradient(to right, ${fullColor}, ${fullColor}), linear-gradient(${dimColor}, ${dimColor})`,
        'background-repeat: no-repeat, no-repeat',
        'background-size: 0% 100%, 100% 100%',
        '-webkit-background-clip: text',
        'background-clip: text',
        '-webkit-text-fill-color: transparent',
        'color: transparent',
        'display: inline-block',
      ].join(' !important; ') + ' !important';
      
      el.setAttribute('style', cleaned + '; ' + scrollFillStyles);
      
      // Propagate to child elements (spans, etc.) that Elementor may have
      // given their own color — which would override inherited transparent
      el.querySelectorAll('span, a, strong, em, b, i').forEach((child) => {
        child.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
        child.style.setProperty('color', 'transparent', 'important');
      });

// Get scroll trigger values - prefer data attributes, then CSS vars, then fallback
const getScrollValue = (dataKey, cssVar, fallback) => {
  // Check data attribute first
  const dataVal = wrapper.dataset[dataKey];
  if (dataVal !== undefined && dataVal.trim() !== '') {
    return dataVal.trim();
  }
  // Check CSS custom property
  const cssVal = wrapperStyles.getPropertyValue(cssVar);
  if (cssVal && cssVal.trim() !== '') {
    return cssVal.trim();
  }
  // Return fallback
  return fallback;
};

const scrollStart = getScrollValue('scrollFillStart', '--scroll-fill-start', 'top 85%');
const scrollEnd = getScrollValue('scrollFillEnd', '--scroll-fill-end', 'top 60%');
const parseBool = (val) => {
  const t = (val || '').trim().toLowerCase();
  return t === 'true' || t === '1' || t === 'yes';
};
const lockForward = parseBool(wrapperStyles.getPropertyValue('--scroll-fill-forward-only') || wrapper.dataset.scrollFillForwardOnly || 'false');
const lineByLine = parseBool(wrapper.dataset.scrollFillLine || 'false');

// LINE BY LINE MODE - Use SplitType to animate each line sequentially
      if (lineByLine && typeof window.SplitType === 'function') {
        // Split into lines
        const split = new SplitType(el, { types: 'lines' });

        if (split.lines && split.lines.length > 0) {
          // Reset element styles
          el.style.position = 'relative';

          // Get all lines from SplitType
          const lines = Array.from(split.lines);
          const totalLines = lines.length;

          if (totalLines === 0) {
            // No lines found, fall back to standard mode
          } else {
            // Parse scroll values: "top 85%" -> 85, "top 60%" -> 60
            const parseScrollVal = (val) => {
              const match = (val || '').match(/(\d+)/);
              return match ? parseInt(match[1]) : 85;
            };

            const startVal = parseScrollVal(scrollStart);
            const endVal = parseScrollVal(scrollEnd);
            const totalRange = startVal - endVal; // e.g., 85 - 60 = 25

            // Process each line - staggered triggers within the scroll range
            lines.forEach((lineEl, index) => {
              // Style the line with robust webkit prefix handling
              lineEl.style.display = 'inline';
              lineEl.style.width = 'auto';
              lineEl.style.setProperty('background', `linear-gradient(to right, ${fullColor}, ${fullColor}), linear-gradient(to right, ${dimColor}, ${dimColor})`, 'important');
              lineEl.style.setProperty('background-repeat', 'no-repeat, no-repeat', 'important');
              lineEl.style.setProperty('background-size', '0% 100%, 100% 100%', 'important');
              lineEl.style.setProperty('-webkit-background-clip', 'text', 'important');
              lineEl.style.setProperty('background-clip', 'text', 'important');
              lineEl.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
              lineEl.style.setProperty('color', 'transparent', 'important');

              // Calculate staggered start/end for this line
              // Line 0: start at scrollStart, end at scrollStart - (1/totalLines * range)
              // Line 1: start at scrollStart - (1/totalLines * range), end at scrollStart - (2/totalLines * range)
              const lineDelay = totalRange / totalLines;
              const lineStart = startVal - (index * lineDelay);
              const lineEnd = startVal - ((index + 1) * lineDelay);

              const lineStartStr = 'top ' + lineStart + '%';
              const lineEndStr = 'top ' + lineEnd + '%';

              gsap.to(lineEl, {
                backgroundSize: '100% 100%, 100% 100%',
                ease: 'none',
                scrollTrigger: {
                  trigger: wrapper,
                  start: lineStartStr,
                  end: lineEndStr,
                  scrub: 0.4,
                },
              });

              // FIX: Insert a <br> after the line to preserve vertical stacking for inline elements
              if (index < totalLines - 1) {
                const br = document.createElement('br');
                lineEl.parentNode.insertBefore(br, lineEl.nextSibling);
              }
            });
          }
        }
      } else {
        // STANDARD MODE - Original single-element scroll fill
        const anim = gsap.to(el, {
          backgroundSize: '100% 100%, 100% 100%',
          ease: 'none',
          scrollTrigger: {
            trigger: wrapper,
            start: scrollStart,
            end: scrollEnd,
            scrub: 0.4,
            onUpdate: (self) => {
              if (lockForward) {
                const max = Math.max(self.progress, self._maxProgress || 0);
                self._maxProgress = max;
                if (self.progress < max) {
                  self.animation.progress(max);
                }
              }
            },
          },
        });
        wrapper._scrollFillTrigger = anim && anim.scrollTrigger ? anim.scrollTrigger : null;
      }

      // Expose applied values for debugging/inspection
      wrapper.dataset.scrollFillStartApplied = scrollStart;
      wrapper.dataset.scrollFillEndApplied = scrollEnd;
    });

    if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  }

  /* ==========================================
     IMAGE REVEAL ANIMATION
     Smooth mask reveal with zoom effect for images
     ========================================== */
  function initImageReveal() {
    const containers = gsap.utils.toArray('.image-reveal');

    containers.forEach((container) => {
      // Skip if already initialized
      if (container.dataset.imageRevealInit === 'true') return;

      // Find the image inside the container
      let image = container.querySelector('img');
      if (!image) {
        console.warn('image-reveal: No img element found in container');
        return;
      }

      const styles = getComputedStyle(container);

      // Get animation settings from CSS custom properties or data attributes
      let duration = parseFloat(styles.getPropertyValue('--reveal-duration')?.trim()) || 
                     parseFloat(container.dataset.revealDuration) || 1.5;
      let delay = parseFloat(styles.getPropertyValue('--animation-delay')?.trim()) ||
                  parseFloat(styles.getPropertyValue('--reveal-delay')?.trim()) || 
                  parseFloat(container.dataset.revealDelay) || 0;
      let ease = styles.getPropertyValue('--reveal-ease')?.trim() || 
                 container.dataset.revealEase || 'power2.out';
      let startTrigger = styles.getPropertyValue('--reveal-trigger')?.trim() || 
                         container.dataset.revealTrigger || 'top 85%';
      let imageScale = parseFloat(styles.getPropertyValue('--reveal-image-scale')?.trim()) || 
                       parseFloat(container.dataset.revealImageScale) || 1.3;

      // Clear any CSS transitions
      container.style.transition = 'none';
      container.style.willChange = 'clip-path';
      image.style.willChange = 'transform';

      // Create timeline with ScrollTrigger
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: startTrigger,
          toggleActions: 'play none none none', // Play once when entering viewport
        },
      });

      const isEnvelope = container.classList.contains('image-reveal-envelope') || container.classList.contains('image-reveal-envelope-single');
      const isSingle = container.classList.contains('image-reveal-envelope-single');

      if (isEnvelope) {
        // --- Envelope Animation Logic ---
        
        // Read colors from styles
        let color1 = styles.getPropertyValue('--ir-color1')?.trim() || '';
        let color2 = styles.getPropertyValue('--ir-color2')?.trim() || '';
        if (!color1 || color1 === 'transparent') {
          const rootStyles = getComputedStyle(document.documentElement);
          color1 = rootStyles.getPropertyValue('--e-global-color-primary')?.trim() || '#6EC1E4';
        }
        if (!color2 || color2 === 'transparent') {
          const rootStyles = getComputedStyle(document.documentElement);
          color2 = rootStyles.getPropertyValue('--e-global-color-secondary')?.trim() || '#54595F';
        }

        // Inject blocks if they don't exist
        if (!container.querySelector('.ir-block-1')) {
          container.insertAdjacentHTML('beforeend', `<div class="ir-block-1"></div>`);
          if (!isSingle) {
            container.insertAdjacentHTML('beforeend', `<div class="ir-block-2"></div>`);
          }
        }
        
        const block1 = container.querySelector('.ir-block-1');
        const block2 = isSingle ? null : container.querySelector('.ir-block-2');
        
        if (block1) block1.style.backgroundColor = color1;
        if (block2) block2.style.backgroundColor = color2;
        
        const segmentDur = duration / 2;

        tl.set(container, { autoAlpha: 1, immediateRender: true });
        tl.set(image, { autoAlpha: 0, scale: imageScale });
        gsap.set(block1, { scaleX: 0, transformOrigin: 'left' });
        if (block2) gsap.set(block2, { scaleX: 0, transformOrigin: 'left' });

        if (isSingle) {
          tl.to(block1, { scaleX: 1, duration: segmentDur, ease: "power2.inOut", transformOrigin: 'left' }, delay)
            .to(image, { autoAlpha: 1, scale: 1, duration: 0.01 })
            .to(block1, { scaleX: 0, duration: segmentDur, ease: "power2.inOut", transformOrigin: "right" });
        } else {
          tl.to(block1, { scaleX: 1, duration: segmentDur, ease: "power2.inOut", transformOrigin: 'left' }, delay)
            .to(block2, { scaleX: 1, duration: segmentDur, ease: "power2.inOut", transformOrigin: 'left' }, `-=${segmentDur * 0.5}`)
            .to(image, { autoAlpha: 1, scale: 1, duration: 0.01 })
            .to(block1, { scaleX: 0, duration: segmentDur, ease: "power2.inOut", transformOrigin: "right" })
            .to(block2, { scaleX: 0, duration: segmentDur, ease: "power2.inOut", transformOrigin: "right" }, `-=${segmentDur * 0.5}`);
        }

      } else {
        // --- Original Clip-Path Animation Logic ---
        
        // Determine reveal direction (left, right, top, bottom)
        const directionAttr = (container.dataset.revealDirection || '').trim().toLowerCase();
        const directionCss = (styles.getPropertyValue('--reveal-direction') || '').trim().toLowerCase();
        let direction = directionAttr || directionCss;

        if (container.classList.contains('image-reveal-right')) direction = 'right';
        else if (container.classList.contains('image-reveal-top')) direction = 'top';
        else if (container.classList.contains('image-reveal-bottom')) direction = 'bottom';
        else if (container.classList.contains('image-reveal-left')) direction = 'left';

        if (!direction) direction = 'left';
        const fullClip = 'inset(0% 0% 0% 0%)';
        let startClip;
        switch (direction) {
          case 'right': startClip = 'inset(0% 100% 0% 0%)'; break;
          case 'top': startClip = 'inset(100% 0% 0% 0%)'; break;
          case 'bottom': startClip = 'inset(0% 0% 100% 0%)'; break;
          default: startClip = 'inset(0% 0% 0% 100%)';
        }

        tl.set(container, { autoAlpha: 1, immediateRender: true });

        tl.fromTo(container,
          { clipPath: startClip, webkitClipPath: startClip },
          { clipPath: fullClip, webkitClipPath: fullClip, duration: duration, ease: ease },
          delay
        );

        tl.from(image,
          { scale: imageScale, duration: duration, ease: ease },
          delay
        );
      }


      container.dataset.imageRevealInit = 'true';
    });
  }

  // Helper to safely locate or dynamically isolate a container's background image
  function getOrCreateBgImage(container, styles) {
    // 1. Try to find existing dedicated background/overlay elements
    let bgImage = container.querySelector(
      '.elementor-background-overlay, .elementor-background-slideshow__image, .elementor-background-slideshow, .elementor-background-image, .supercraft-dynamic-bg-layer'
    );

    if (bgImage) return bgImage;

    // 2. Isolate inline backgrounds set on the container itself
    const inlineBg = styles.backgroundImage;
    if (inlineBg && inlineBg !== 'none' && !inlineBg.includes('gradient')) {
      const bgPos = styles.backgroundPosition || 'center center';
      const bgSize = styles.backgroundSize || 'cover';
      const bgRepeat = styles.backgroundRepeat || 'no-repeat';

      const bgLayer = document.createElement('div');
      bgLayer.className = 'supercraft-dynamic-bg-layer';
      Object.assign(bgLayer.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundImage: inlineBg,
        backgroundPosition: bgPos,
        backgroundSize: bgSize,
        backgroundRepeat: bgRepeat,
        zIndex: '0',
        pointerEvents: 'none',
        willChange: 'transform',
      });

      // Ensure the container is a relative positioning context and clips children
      container.style.position = 'relative';
      container.style.overflow = 'hidden';

      // Ensure container contents remain in front of the new background layer
      Array.from(container.children).forEach((child) => {
        const childStyles = getComputedStyle(child);
        if (childStyles.position === 'static') {
          child.style.position = 'relative';
        }
        if (!childStyles.zIndex || childStyles.zIndex === 'auto') {
          child.style.zIndex = '1';
        }
      });

      container.prepend(bgLayer);
      container.style.backgroundImage = 'none'; // Prevent double rendering
      return bgLayer;
    }

    // 3. Fallback to child images if it is the primary element or marked
    const images = container.querySelectorAll('img');
    for (const img of images) {
      const imgStyle = getComputedStyle(img);
      if (
        imgStyle.position === 'absolute' || 
        imgStyle.objectFit === 'cover' || 
        img.classList.contains('bg-image') || 
        img.classList.contains('hero-image')
      ) {
        return img;
      }
    }

    // 4. Default to first image only if it's the sole image widget
    if (images.length === 1) {
      return images[0];
    }

    return null;
  }

  /* ==========================================
     CONTAINER REVEAL ANIMATION
     Mask reveal for any container (center-out or directional)
     ========================================== */
  function initContainerReveal() {
    const containers = gsap.utils.toArray('.container-reveal');

    containers.forEach((container) => {
      if (container.dataset.containerRevealInit === 'true') return;

      const styles = getComputedStyle(container);

      const duration = parseFloat(styles.getPropertyValue('--reveal-duration')?.trim()) || 
                       parseFloat(container.dataset.revealDuration) || 1.2;
      const delayRaw = styles.getPropertyValue('--animation-delay');
      const delay = (delayRaw && !Number.isNaN(parseFloat(delayRaw)))
        ? parseFloat(delayRaw)
        : 0;
      const ease = styles.getPropertyValue('--reveal-ease')?.trim() || 
                   container.dataset.revealEase || 'power2.out';
      const startTrigger = styles.getPropertyValue('--reveal-trigger')?.trim() || 
                           container.dataset.revealTrigger || 'top 85%';

      const directionAttr = (container.dataset.revealDirection || '').trim().toLowerCase();
      const directionCss = (styles.getPropertyValue('--reveal-direction') || '').trim().toLowerCase();
      let direction = directionAttr || directionCss || 'center';

      if (container.classList.contains('container-reveal-right')) direction = 'right';
      else if (container.classList.contains('container-reveal-top')) direction = 'top';
      else if (container.classList.contains('container-reveal-bottom')) direction = 'bottom';
      else if (container.classList.contains('container-reveal-left')) direction = 'left';
      else if (container.classList.contains('container-reveal-center')) direction = 'center';
      else if (container.classList.contains('container-reveal-cinematic-gate')) direction = 'cinematic-gate';

      const fullClip = direction === 'cinematic-gate' ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' : 'inset(0% 0% 0% 0%)';
      let startClip;
      switch (direction) {
        case 'right':
          startClip = 'inset(0% 100% 0% 0%)';
          break;
        case 'left':
          startClip = 'inset(0% 0% 0% 100%)';
          break;
        case 'top':
          startClip = 'inset(100% 0% 0% 0%)';
          break;
        case 'bottom':
          startClip = 'inset(0% 0% 100% 0%)';
          break;
        case 'cinematic-gate':
          startClip = 'polygon(50% 20%, 50% 20%, 50% 80%, 50% 80%)';
          break;
        default: // center-out (both vertical sides)
          startClip = 'inset(50% 0% 50% 0%)';
      }

      // In the Elementor editor, show the end state for visibility without needing to play
      if (isEditor) {
        gsap.set(container, {
          autoAlpha: 1,
          clipPath: fullClip,
          webkitClipPath: fullClip,
          visibility: 'visible',
        });
        container.dataset.containerRevealInit = 'true';
        return;
      }

      const isScrollScrub = container.classList.contains('container-reveal-scroll');
      const scrollStart = styles.getPropertyValue('--reveal-scroll-start')?.trim() ||
                          container.dataset.revealScrollStart || 'top 85%';
      const scrollEnd = styles.getPropertyValue('--reveal-scroll-end')?.trim() ||
                        container.dataset.revealScrollEnd || 'top 20%';
      const forwardOnly = (container.dataset.revealForwardOnly || '').trim().toLowerCase() === 'true';

      // Ensure no interfering transitions and force initial masked state
      container.style.transition = 'none';
      gsap.set(container, {
        autoAlpha: 1,
        clipPath: startClip,
        webkitClipPath: startClip,
        visibility: 'visible',
      });

      if (isScrollScrub) {
        if (direction === 'cinematic-gate') {
          const overlay = container.querySelector('.elementor-background-overlay');
          if (overlay) {
            gsap.set(overlay, { autoAlpha: 0 });
          }

          const bgImage = getOrCreateBgImage(container, styles);
          if (bgImage) {
            gsap.set(bgImage, { scale: 1 });
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: container,
              start: scrollStart,
              end: scrollEnd,
              scrub: 0,
              onUpdate: (self) => {
                if (forwardOnly) {
                  const max = Math.max(self.progress, self._maxProgress || 0);
                  self._maxProgress = max;
                  if (self.progress < max) {
                    self.animation.progress(max);
                  }
                }
              },
            },
          });

          tl.fromTo(
            container,
            {
              clipPath: 'polygon(50% 20%, 50% 20%, 50% 80%, 50% 80%)',
              webkitClipPath: 'polygon(50% 20%, 50% 20%, 50% 80%, 50% 80%)',
            },
            {
              clipPath: 'polygon(35% 20%, 65% 20%, 65% 80%, 35% 80%)',
              webkitClipPath: 'polygon(35% 20%, 65% 20%, 65% 80%, 35% 80%)',
              ease: 'power2.inOut',
              duration: 0.45,
            }
          );

          if (bgImage) {
            tl.to(bgImage, {
              scale: 0.86,
              ease: 'power2.inOut',
              duration: 0.45,
            }, '<');
          }

          tl.to(container, {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            webkitClipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            ease: 'power4.inOut',
            duration: 0.55,
          });

          if (bgImage) {
            tl.to(bgImage, {
              scale: 1,
              ease: 'power4.inOut',
              duration: 0.55,
            }, '<');
          }

          if (overlay) {
            tl.to(overlay, {
              autoAlpha: 1,
              duration: 0.5,
            }, '<+=0.2');
          }
        } else {
          gsap.fromTo(
            container,
            {
              autoAlpha: 1,
              clipPath: startClip,
              webkitClipPath: startClip,
              visibility: 'visible',
            },
            {
              clipPath: fullClip,
              webkitClipPath: fullClip,
              ease,
              immediateRender: false,
              scrollTrigger: {
                trigger: container,
                start: scrollStart,
                end: scrollEnd,
                scrub: 0,
                onUpdate: (self) => {
                  if (forwardOnly) {
                    const max = Math.max(self.progress, self._maxProgress || 0);
                    self._maxProgress = max;
                    if (self.progress < max) {
                      self.animation.progress(max);
                    }
                  }
                },
              },
            }
          );
        }
      } else {
        if (direction === 'cinematic-gate') {
          const overlay = container.querySelector('.elementor-background-overlay');
          if (overlay) {
            gsap.set(overlay, { autoAlpha: 0 });
          }

          const bgImage = getOrCreateBgImage(container, styles);
          if (bgImage) {
            gsap.set(bgImage, { scale: 1 });
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: container,
              start: startTrigger,
              toggleActions: 'play none none none',
            },
          });

          tl.fromTo(
            container,
            {
              autoAlpha: 1,
              clipPath: 'polygon(50% 20%, 50% 20%, 50% 80%, 50% 80%)',
              webkitClipPath: 'polygon(50% 20%, 50% 20%, 50% 80%, 50% 80%)',
              immediateRender: false,
            },
            {
              clipPath: 'polygon(35% 20%, 65% 20%, 65% 80%, 35% 80%)',
              webkitClipPath: 'polygon(35% 20%, 65% 20%, 65% 80%, 35% 80%)',
              duration: duration * 0.45,
              ease: 'power2.inOut',
            },
            delay
          );

          if (bgImage) {
            tl.to(bgImage, {
              scale: 0.86,
              duration: duration * 0.45,
              ease: 'power2.inOut',
            }, '<');
          }

          tl.to(
            container,
            {
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
              webkitClipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
              duration: duration * 0.55,
              ease: 'power4.inOut',
            },
            `>${delay > 0 ? '' : '=-0.05'}`
          );

          if (bgImage) {
            tl.to(bgImage, {
              scale: 1,
              duration: duration * 0.55,
              ease: 'power4.inOut',
            }, '<');
          }

          if (overlay) {
            tl.to(overlay, {
              autoAlpha: 1,
              duration: duration * 0.5,
            }, '<+=0.2');
          }

          tl.set(container, { clearProps: 'clipPath,webkitClipPath' });
        } else {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: container,
              start: startTrigger,
              toggleActions: 'play none none none',
            },
          });

          tl.fromTo(
            container,
            {
              autoAlpha: 1,
              clipPath: startClip,
              webkitClipPath: startClip,
              immediateRender: false,
            },
            {
              clipPath: fullClip,
              webkitClipPath: fullClip,
              duration: duration,
              ease,
            },
            delay
          );
        }
      }

      container.dataset.containerRevealInit = 'true';
    });
    if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  }

  /* ==========================================
     SCROLL TRANSFORM SCRUB (scroll-linked, reversible optional)
     Uses same vars/data-* as scroll-transform plus:
     --transform-scroll-start / --transform-scroll-end
     data-transform-reversible="true" to allow reverse on scroll-back
     ========================================== */
  function initScrollTransformScrub() {
    const elements = gsap.utils.toArray('.scroll-transform-scrub');

    elements.forEach((el) => {
      if (el.dataset.scrollTransformScrubInit === 'true') return;

      const styles = getComputedStyle(el);

      const parseNum = (val, fallback = 0) => {
        const num = parseFloat((val || '').trim());
        return Number.isNaN(num) ? fallback : num;
      };
      const withUnit = (val, unit = 'px') => {
        if (!val) return '0' + unit;
        const t = val.trim();
        return /^-?\d+(\.\d+)?$/.test(t) ? t + unit : t;
      };
      const withDeg = (val) => {
        if (!val) return '0deg';
        const t = val.trim();
        return /^-?\d+(\.\d+)?$/.test(t) ? t + 'deg' : t;
      };
      const withPx = (val) => {
        if (!val) return '0px';
        const t = val.trim();
        return /^-?\d+(\.\d+)?$/.test(t) ? t + 'px' : t;
      };

      const startX = withUnit(styles.getPropertyValue('--transform-start-x') || el.dataset.transformStartX);
      const startY = withUnit(styles.getPropertyValue('--transform-start-y') || el.dataset.transformStartY);
      const startR = withDeg(styles.getPropertyValue('--transform-start-rotate') || el.dataset.transformStartRotate);
      const startS = parseNum(styles.getPropertyValue('--transform-start-scale') || el.dataset.transformStartScale, 1);
      const startO = parseNum(styles.getPropertyValue('--transform-start-opacity') || el.dataset.transformStartOpacity, 0);
      const startB = withPx(styles.getPropertyValue('--transform-start-blur') || el.dataset.transformStartBlur);

      const endX = withUnit(styles.getPropertyValue('--transform-end-x') || el.dataset.transformEndX);
      const endY = withUnit(styles.getPropertyValue('--transform-end-y') || el.dataset.transformEndY);
      const endR = withDeg(styles.getPropertyValue('--transform-end-rotate') || el.dataset.transformEndRotate);
      const endS = parseNum(styles.getPropertyValue('--transform-end-scale') || el.dataset.transformEndScale, 1);
      const endO = parseNum(styles.getPropertyValue('--transform-end-opacity') || el.dataset.transformEndOpacity, 1);
      const endB = withPx(styles.getPropertyValue('--transform-end-blur') || el.dataset.transformEndBlur);

      const ease = (styles.getPropertyValue('--transform-ease') || el.dataset.transformEase || 'none').trim();
      const startTrigger = (styles.getPropertyValue('--transform-scroll-start') || el.dataset.transformScrollStart || 'top 85%').trim();
      const endTrigger = (styles.getPropertyValue('--transform-scroll-end') || el.dataset.transformScrollEnd || 'top 15%').trim();
      const parseBool = (val) => {
        const t = (val || '').trim().toLowerCase();
        return t === 'true' || t === '1' || t === 'yes';
      };
      const lockForward = parseBool(styles.getPropertyValue('--transform-forward-only') || el.dataset.transformForwardOnly || 'false'); // scrub but never reverse progress

      // Initial state
      gsap.set(el, {
        x: startX,
        y: startY,
        rotation: startR,
        scale: startS,
        opacity: startO,
        filter: `blur(${startB})`,
        force3D: true,
        willChange: 'transform, opacity, filter',
      });

      gsap.to(el, {
        x: endX,
        y: endY,
        rotation: endR,
        scale: endS,
        opacity: endO,
        filter: `blur(${endB})`,
        ease,
        scrollTrigger: {
          trigger: el,
          start: startTrigger,
          end: endTrigger,
          scrub: 0,
          onUpdate: (self) => {
            if (lockForward) {
              const max = Math.max(self.progress, self._maxProgress || 0);
              self._maxProgress = max;
              if (self.progress < max) {
                self.animation.progress(max);
              }
            }
          },
        },
      });

      el.dataset.scrollTransformScrubInit = 'true';
    });
  }

  /* ==========================================
     VIDEO GSAP ANIMATIONS
     ========================================== */
  function initVideoGSAP() {
    const videoContainers = gsap.utils.toArray('.video-gsap-init');

    // Detect iOS and general mobile
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = isIOS || /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // ── Shared mobile video unlock ──────────────────────────────
    const videosToUnlock = [];
    let mobileUnlocked = false;

    function unlockVideos() {
      if (mobileUnlocked) return;
      mobileUnlocked = true;

      videosToUnlock.forEach((v) => {
        const p = v.play();
        if (p !== undefined) {
          p.then(() => { v.pause(); v.currentTime = 0; })
           .catch(() => { v.pause(); });
        }
      });

      unlockEvents.forEach((evt) => {
        document.removeEventListener(evt, unlockVideos, true);
      });
    }

    const unlockEvents = ['touchstart', 'touchend', 'click', 'pointerdown', 'scroll'];
    if (isMobile) {
      unlockEvents.forEach((evt) => {
        document.addEventListener(evt, unlockVideos, { capture: true, passive: true });
      });
    }

    // ── Per-container setup ─────────────────────────────────────
    videoContainers.forEach((container) => {
      if (container.dataset.videoGsapInit === 'true') return;

      const video = container.querySelector('video');
      if (!video) {
        return; // Don't mark init — Elementor may inject the video later
      }

      const isScrollScrub = container.classList.contains('video-gsap-scroll-scrub');
      if (!isScrollScrub) {
        container.dataset.videoGsapInit = 'true';
        return;
      }

      container.dataset.videoGsapInit = 'true';

      // ── Force mobile-compatible attributes ────────────────────
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('preload', 'auto');
      video.muted = true;
      video.removeAttribute('autoplay');
      video.removeAttribute('loop');
      video.pause();

      // Register for the shared unlock
      if (isMobile) {
        videosToUnlock.push(video);
      }

      let src = video.currentSrc || video.src || (video.querySelector('source') || {}).src;

      const scrollStart = container.dataset.videoScrollStart || 'top top';
      const scrollEnd   = container.dataset.videoScrollEnd   || 'bottom bottom';
      const fetchDelay  = parseInt(container.dataset.videoFetchDelay || '1000', 10);
      const smoothing   = parseFloat(container.dataset.videoScrubSmoothing || '0.5');

      // ── Canvas Setup for Mobile ────────────────────────────────
      let canvas = null;
      let ctx = null;
      let useCanvas = isMobile;

      if (useCanvas) {
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');
        
        // Match video styling/classes to canvas
        canvas.className = video.className;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = getComputedStyle(video).objectFit || 'cover';
        canvas.style.display = 'block';

        // Hide video, insert canvas
        video.style.display = 'none';
        video.parentNode.insertBefore(canvas, video);
      }

      // Render video frame to canvas
      function renderFrame() {
        if (!useCanvas || !canvas || !ctx || !video) return;
        
        // Match canvas dimensions to video's actual resolution
        if (video.videoWidth && canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch (e) {
          // If frame drawing fails (e.g. video not ready), ignore
        }
      }

      // ── Seek logic ─────────────────────────────────────────────
      let targetTime = 0;
      let rafPending = false;

      function smoothSeek() {
        rafPending = false;
        if (Math.abs(video.currentTime - targetTime) > 0.01) {
          video.currentTime = targetTime;
        }
        if (useCanvas) {
          renderFrame();
        }
      }

      // Also render on seeked event to catch the final frame position
      if (useCanvas) {
        video.addEventListener('seeked', renderFrame);
      }

      // ── Build ScrollTrigger timeline ──────────────────────────
      function setupTimeline(duration) {
        if (!duration || !isFinite(duration) || duration <= 0) return;

        const tl = gsap.timeline({
          defaults: { duration: 1 },
          scrollTrigger: {
            trigger: container,
            start: scrollStart,
            end: scrollEnd,
            scrub: smoothing,
            onUpdate: () => {
              if (useCanvas) {
                renderFrame();
              }
            }
          },
        });

        if (isMobile) {
          // Proxy approach for mobile (critical for iOS and Android rendering pipeline)
          const proxy = { t: 0 };
          tl.fromTo(proxy, { t: 0 }, {
            t: duration,
            onUpdate() {
              targetTime = proxy.t;
              if (!rafPending) {
                rafPending = true;
                requestAnimationFrame(smoothSeek);
              }
            },
          });
        } else {
          // Desktop: direct currentTime tween
          tl.fromTo(video, { currentTime: 0 }, { currentTime: duration });
        }
      }

      // ── Wait for video metadata ───────────────────────────────
      function initTimeline() {
        const dur = video.duration;
        if (!dur || !isFinite(dur) || dur <= 0) return;
        setupTimeline(dur);
        if (useCanvas) {
          // Render initial frame
          setTimeout(renderFrame, 200);
        }
      }

      if (video.readyState >= 1 && isFinite(video.duration) && video.duration > 0) {
        initTimeline();
      } else {
        const onMeta = () => {
          video.removeEventListener('loadedmetadata', onMeta);
          clearTimeout(metaFallback);
          initTimeline();
        };
        video.addEventListener('loadedmetadata', onMeta);

        const metaFallback = setTimeout(() => {
          video.removeEventListener('loadedmetadata', onMeta);
          video.load();
          video.addEventListener('loadedmetadata', () => initTimeline(), { once: true });
        }, 5000);
      }

      // ── Blob fetch for smoother scrubbing ─────────────────────
      setTimeout(function () {
        if (!window.fetch || !src || src.startsWith('blob:')) return;

        fetch(src, { mode: 'cors' })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.blob();
          })
          .then((blob) => {
            const blobURL = URL.createObjectURL(blob);
            const t = video.currentTime;
            video.setAttribute('src', blobURL);
            video.currentTime = t + 0.01;

            if (isMobile && !mobileUnlocked) {
              videosToUnlock.push(video);
            }
            if (useCanvas) {
              setTimeout(renderFrame, 200);
            }
          })
          .catch((err) => {
            if (typeof console !== 'undefined' && console.info) {
              console.info('Video GSAP: blob pre-fetch skipped —', err.message || err);
            }
          });
      }, fetchDelay);
    });
  }

  /* ==========================================
     SECTION TRANSITIONS
     ========================================== */
  function initSectionTransitions() {
    function isTransparent(c) {
      return !c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)' || c === 'rgba(0,0,0,0)';
    }

    function resolveFill(el, fallback) {
      var cur = el;
      while (cur && cur !== document.documentElement) {
        var bg = getComputedStyle(cur).backgroundColor;
        if (!isTransparent(bg)) return bg;
        cur = cur.parentElement;
      }
      return fallback || 'rgb(255,255,255)';
    }

    function findNextContainer(section) {
      var next = section.nextElementSibling;
      if (next) return next;
      var parent = section.parentElement;
      while (parent && parent !== document.body) {
        var parentNext = parent.nextElementSibling;
        if (parentNext) return parentNext;
        parent = parent.parentElement;
      }
      return null;
    }

    function buildShutter(section, count, fill) {
      section.style.position = 'relative';
      section.style.overflow = 'hidden';
      section.style.isolation = 'isolate';

      var layer = document.createElement('div');
      Object.assign(layer.style, {
        position: 'absolute',
        left: '0',
        right: '0',
        bottom: '0',
        top: 'auto',
        height: '100%',
        zIndex: '9999',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      });
      layer.setAttribute('aria-hidden', 'true');
      layer.setAttribute('data-st-layer', 'true');
      section.appendChild(layer);

      var slats = Array.from({ length: count }, function () {
        var row = document.createElement('div');
        Object.assign(row.style, {
          flex: '1 1 0',
          minHeight: '0',
          overflow: 'visible',
          position: 'relative',
        });
        var slat = document.createElement('div');
        Object.assign(slat.style, {
          width: '100%',
          height: 'calc(100% + 4px)',
          marginTop: '-2px',
          background: fill,
          transformOrigin: '50% 100%',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        });
        row.appendChild(slat);
        layer.appendChild(row);
        return slat;
      });

      gsap.set(slats, { scaleY: 0 });
      return { layer: layer, slats: slats };
    }

    const sections = document.querySelectorAll('.supercraft-section-transition');

    sections.forEach(function (section) {
      if (section.dataset.stInit === 'true') return;

      // Remove any previously injected shutter layers (for editor re-init)
      section.querySelectorAll('[data-st-layer]').forEach(function (el) { el.remove(); });

      const preset = section.dataset.stPreset || 'vertical-shutter';
      const scrollStart = section.dataset.stStart || 'bottom bottom+=20%';
      const scrollEnd = section.dataset.stEnd || '+=100%';
      const scrub = parseFloat(section.dataset.stScrub || '1');
      const fallback = section.dataset.stFallback || 'rgb(255,255,255)';

      if (preset === 'vertical-shutter') {
        const next = findNextContainer(section);
        if (!next) {
          section.dataset.stInit = 'true';
          return;
        }

        const slatCount = parseInt(section.dataset.stSlats || '16', 10);
        const fill = resolveFill(next, fallback);
        const result = buildShutter(section, slatCount, fill);
        const layer = result.layer;
        const slats = result.slats;

        gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: {
            trigger: section,
            start: scrollStart,
            end: function () {
              return '+=' + Math.max(layer.offsetHeight, 1);
            },
            scrub: scrub,
            invalidateOnRefresh: true,
          },
        }).to(slats, {
          scaleY: 1,
          duration: 0.03,
          stagger: { each: 0.001, from: 'end' },
        }, 0);
      }

      section.dataset.stInit = 'true';
    });
  }

  /* ==========================================
     ADVANCED ANIMATIONS
     Data-driven animations using data attributes emitted by PHP
     ========================================== */
  const namedElementRegistry = {};

  function buildNamedElementRegistry() {
    const namedElements = document.querySelectorAll('[data-supercraft-named="true"]');
    namedElements.forEach((el) => {
      const key = el.dataset.supercraftKey;
      if (key) {
        if (!namedElementRegistry[key]) {
          namedElementRegistry[key] = [];
        }
        namedElementRegistry[key].push(el);
      }
    });
  }

  function resolveElement(mode, namedKey, hostEl) {
    if (mode === 'self' || !namedKey) {
      return [hostEl];
    }
    return namedElementRegistry[namedKey] || null;
  }

  function getPresetTransforms(effect, opts) {
    const { duration = 0.8, delay = 0, ease = 'power2.out', intensity = 1 } = opts;
    const base = { duration, delay, ease };

    switch (effect) {
      // --- Premium Idle Presets ---
      case 'pulse':
        return { ...base, from: { scale: 1 }, to: { scale: 1 + (0.03 * intensity) }, yoyo: true, repeat: -1 };
      case 'float':
        return { ...base, from: { y: 0 }, to: { y: -8 * intensity }, yoyo: true, repeat: -1, ease: 'sine.inOut' };
      case 'spin-continuous':
        return { ...base, from: { rotation: 0 }, to: { rotation: 360 * (intensity > 0 ? 1 : -1) }, yoyo: false, repeat: -1, ease: 'none' };
      case 'spin-yoyo':
        return { ...base, from: { rotation: -10 * intensity }, to: { rotation: 10 * intensity }, yoyo: true, repeat: -1, ease: 'sine.inOut' };
      case 'breathe':
        return { ...base, from: { scale: 1, filter: 'blur(0px)' }, to: { scale: 1 + (0.02 * intensity), filter: `blur(${2 * intensity}px)` }, yoyo: true, repeat: -1, ease: 'sine.inOut' };
      case 'swing':
        return { ...base, from: { rotation: -5 * intensity, transformOrigin: 'top center' }, to: { rotation: 5 * intensity, transformOrigin: 'top center' }, yoyo: true, repeat: -1, ease: 'sine.inOut' };
      // --- Custom Transform ---
      case 'custom-transform': {
        const toObj = {};
        if (opts.x !== undefined && opts.x !== '') toObj.x = opts.x;
        if (opts.y !== undefined && opts.y !== '') toObj.y = opts.y;
        if (opts.rotate !== undefined && opts.rotate !== '') toObj.rotation = opts.rotate;
        if (opts.scale !== undefined && opts.scale !== '') toObj.scale = opts.scale;
        if (opts.opacity !== undefined && opts.opacity !== '') toObj.opacity = opts.opacity;
        if (opts.blur !== undefined && opts.blur !== '') toObj.filter = `blur(${opts.blur}px)`;
        const fromObj = {};
        if (opts.startX !== undefined && opts.startX !== '') fromObj.x = opts.startX;
        if (opts.startY !== undefined && opts.startY !== '') fromObj.y = opts.startY;
        if (opts.startRotate !== undefined && opts.startRotate !== '') fromObj.rotation = opts.startRotate;
        if (opts.startScale !== undefined && opts.startScale !== '') fromObj.scale = opts.startScale;
        if (opts.startOpacity !== undefined && opts.startOpacity !== '') fromObj.opacity = opts.startOpacity;
        if (opts.startBlur !== undefined && opts.startBlur !== '') fromObj.filter = `blur(${opts.startBlur}px)`;
        return {
          ...base,
          from: fromObj,
          to: toObj,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        };
      }
      default:
        return { ...base, from: { opacity: 0 }, to: { opacity: 1 }, yoyo: true, repeat: -1 };
    }
  }

  function getHoverVars(effect, opts) {
    const { duration = 0.8, delay = 0, ease = 'power2.out', intensity = 1 } = opts;
    const base = { duration, delay, ease };
    switch (effect) {
      // --- Premium Hover Presets ---
      case 'micro-scale':
      case 'scale-up': // legacy fallback
        return { ...base, to: { scale: 1 + 0.03 * intensity } };
      case 'scale-down': // legacy fallback
        return { ...base, to: { scale: 1 - 0.03 * intensity } };
      case 'tactile-press':
      case 'push': // legacy fallback
        return { ...base, to: { y: 2 * intensity, scale: 1 - 0.04 * intensity } };
      case 'soft-elevate':
      case 'lift': // legacy fallback
        return { ...base, to: { y: -4 * intensity, boxShadow: '0px 12px 30px rgba(0,0,0,0.06)' } };
      case '3d-float':
        return { ...base, to: { y: -3 * intensity, rotationX: 2 * intensity, rotationY: -2 * intensity, transformPerspective: 1000 } };
      case 'focus-reveal':
        return { ...base, to: { scale: 1 + 0.02 * intensity, opacity: 1, filter: 'blur(0px)' } };
      case 'float-blur':
        return { ...base, to: { y: -4 * intensity, scale: 1 + 0.02 * intensity, filter: `blur(${4 * intensity}px)` } };
      case 'skew-press':
        return { ...base, to: { y: 2 * intensity, scale: 1 - 0.02 * intensity, skewX: -2 * intensity } };
      case 'magnetic-pull':
        return { ...base, to: { x: -2 * intensity, y: -2 * intensity, rotation: -1 * intensity } };
      case 'cinematic-zoom':
        // Override the duration to be very slow and cinematic
        return { ...base, duration: Math.max(duration, 1.2), ease: "power1.out", to: { scale: 1 + 0.05 * intensity } };
      case 'zoom-bg':
        return { ...base, to: { scale: 1 + 0.1 * intensity } };
      case 'glow': // legacy fallback
        return { ...base, to: { filter: `drop-shadow(0px 0px 15px rgba(255, 255, 255, ${0.5 * intensity}))` } };
      case 'wiggle': // legacy fallback
        return { ...base, to: { rotation: 4 * intensity, ease: "elastic.out(2, 0.2)" } };
      // --- Custom Transform ---
      case 'custom-transform': {
        const toObj = {};
        if (opts.x !== undefined && opts.x !== '') toObj.x = opts.x;
        if (opts.y !== undefined && opts.y !== '') toObj.y = opts.y;
        if (opts.rotate !== undefined && opts.rotate !== '') toObj.rotation = opts.rotate;
        if (opts.scale !== undefined && opts.scale !== '') toObj.scale = opts.scale;
        if (opts.opacity !== undefined && opts.opacity !== '') toObj.opacity = opts.opacity;
        if (opts.blur !== undefined && opts.blur !== '') toObj.filter = `blur(${opts.blur}px)`;
        const fromObj = {};
        if (opts.startX !== undefined && opts.startX !== '') fromObj.x = opts.startX;
        if (opts.startY !== undefined && opts.startY !== '') fromObj.y = opts.startY;
        if (opts.startRotate !== undefined && opts.startRotate !== '') fromObj.rotation = opts.startRotate;
        if (opts.startScale !== undefined && opts.startScale !== '') fromObj.scale = opts.startScale;
        if (opts.startOpacity !== undefined && opts.startOpacity !== '') fromObj.opacity = opts.startOpacity;
        if (opts.startBlur !== undefined && opts.startBlur !== '') fromObj.filter = `blur(${opts.startBlur}px)`;
        return { ...base, from: fromObj, to: toObj };
      }
      default:
        return { ...base, to: { scale: 1 + 0.05 * intensity } };
    }
  }

const activeIdleTimelines = new Map();
  const hoverTimelines = new Map();

  function initAdvancedAnimations() {
    buildNamedElementRegistry();

    const hosts = document.querySelectorAll('.supercraft-advanced-host');

    hosts.forEach((host) => {
      if (host.dataset.advancedInit === 'true') {
        return;
      }

      let configRows;
      try {
        const raw = host.dataset.supercraftAdvanced;
        if (!raw) return;
        configRows = JSON.parse(raw);
      } catch (e) {
        console.warn('Failed to parse data-supercraft-advanced:', e);
        return;
      }

      if (!Array.isArray(configRows) || configRows.length === 0) return;

      configRows.forEach((row, idx) => {
        const triggerMode = row.triggerElementMode || 'self';
        const triggerKey = row.triggerNamed || '';
        const animMode = row.animatedElementMode || 'self';
        const animKey = row.animatedNamed || '';
        const effect = row.effect || 'fade';
        const animationType = row.animationType || 'simple';
        const scrollTriggerPoint = row.scroll_trigger || 'top 85%';
        const duration = (row.duration !== undefined && row.duration !== null && row.duration !== '') ? parseFloat(row.duration) : (row.trigger === 'hover' ? 0.1 : 0.8);
        const delay = (row.delay !== undefined && row.delay !== null && row.delay !== '') ? parseFloat(row.delay) : 0;
        const ease = row.ease || 'power2.out';
        const intensity = (row.intensity !== undefined && row.intensity !== null && row.intensity !== '') ? parseFloat(row.intensity) : 1;
        const speed = (row.speed !== undefined && row.speed !== null && row.speed !== '') ? parseFloat(row.speed) : 1;

        const resolvedTriggerEls = resolveElement(triggerMode, triggerKey, host);
        const resolvedTargetEls = resolveElement(animMode, animKey, host);
        const triggerEls = Array.isArray(resolvedTriggerEls) ? resolvedTriggerEls : [resolvedTriggerEls].filter(Boolean);
        const targetEls = Array.isArray(resolvedTargetEls) ? resolvedTargetEls : [resolvedTargetEls].filter(Boolean);

        if (!triggerEls.length || !targetEls.length) return;

        const isIdleLoop = row.trigger === 'idle_loop';
        const isScrollTrigger = row.trigger === 'scroll_into_view';
        const isHover = row.trigger === 'hover';
        const isStaticState = row.trigger === 'static_state';
        const isClick = row.trigger === 'click';
        if (!host.dataset.advancedAnimId) {
          host.dataset.advancedAnimId = Math.random().toString(36).substr(2, 9);
        }
        const animKeyId = `${host.dataset.advancedAnimId}_${idx}`;

        if ((isScrollTrigger || isClick) && animationType !== 'simple') {
          handleScrollIntoViewAdvanced(row, triggerEls, targetEls, animationType, {
            triggerMode: row.trigger,
            duration,
            delay,
            ease,
            intensity,
            speed,
            scrollPreset: row.scrollPreset,
            imageDirection: row.imageDirection,
            containerDirection: row.containerDirection,
            splitMode: row.splitMode,
            splitVariantChar: row.splitVariantChar,
            splitVariantWord: row.splitVariantWord,
            scrollTriggerPoint,
            x: row.x,
            y: row.y,
            rotate: row.rotate,
            scale: row.scale,
            opacity: row.opacity,
            blur: row.blur,
            startX: row.startX,
            startY: row.startY,
            startRotate: row.startRotate,
            startScale: row.startScale,
            startOpacity: row.startOpacity,
            startBlur: row.startBlur,
          });
          return;
        }

        const applyStaticState = () => {
          const vars = {};
          if (row.x !== undefined && row.x !== '') vars.x = row.x;
          if (row.y !== undefined && row.y !== '') vars.y = row.y;
          if (row.rotate !== undefined && row.rotate !== '') vars.rotation = row.rotate;
          if (row.scale !== undefined && row.scale !== '') vars.scale = row.scale;
          if (row.opacity !== undefined && row.opacity !== '') vars.opacity = row.opacity;
          if (row.blur !== undefined && row.blur !== '') vars.filter = `blur(${row.blur}px)`;
          if (Object.keys(vars).length > 0) {
            gsap.set(targetEls, vars);
          }
        };

        const applyIdleLoop = () => {
          if (activeIdleTimelines.has(animKeyId)) {
            const existingTl = activeIdleTimelines.get(animKeyId);
            if (existingTl && existingTl.paused()) {
              existingTl.play();
            }
            return;
          }

          targetEls.forEach((el) => {
            el.style.transition = 'none';
            el.style.willChange = 'transform, opacity, filter';
          });

          const transforms = getPresetTransforms(effect, { duration, delay, ease, intensity, ...row });
          const tl = gsap.timeline({ repeat: -1, yoyo: transforms.yoyo || false, paused: true });
          targetEls.forEach((el) => {
            tl.fromTo(el, transforms.from, {
              ...transforms.to,
              duration: transforms.duration / speed,
              ease: transforms.ease
            }, 0);
          });
          activeIdleTimelines.set(animKeyId, tl);
          tl.play();
        };

        const applyScrollTrigger = () => {
          const transforms = getPresetTransforms(effect, { duration, delay, ease, intensity });
          triggerEls.forEach((triggerItem, idx) => {
            const targetItem = targetEls[idx] || targetEls[0];
            if (targetItem) {
              gsap.killTweensOf(targetItem);
              gsap.fromTo(targetItem, transforms.from, {
                ...transforms.to,
                duration: transforms.duration / speed,
                ease: transforms.ease,
                scrollTrigger: {
                  trigger: triggerItem,
                  start: scrollTriggerPoint,
                  toggleActions: 'play none none none'
                }
              });
            }
          });
        };

        const applyHover = () => {
          let hoverTargetEls = targetEls;
          if (effect === 'zoom-bg') {
            hoverTargetEls = targetEls.map((el) => {
              el.style.overflow = 'hidden';
              if (getComputedStyle(el).position === 'static') {
                el.style.position = 'relative';
              }
              const styles = getComputedStyle(el);
              const bg = getOrCreateBgImage(el, styles);
              if (bg) {
                bg.style.transition = 'none';
                bg.style.willChange = 'transform';
                return bg;
              }
              return el;
            });
          } else {
            targetEls.forEach((el) => {
              el.style.transition = 'none';
              el.style.willChange = 'transform, opacity, filter';
            });
          }

          const transforms = getHoverVars(effect, {
            duration,
            delay,
            ease,
            intensity,
            x: row.x,
            y: row.y,
            rotate: row.rotate,
            scale: row.scale,
            opacity: row.opacity,
            blur: row.blur,
            startX: row.startX,
            startY: row.startY,
            startRotate: row.startRotate,
            startScale: row.startScale,
            startOpacity: row.startOpacity,
            startBlur: row.startBlur,
          });

          const handleMouseEnter = () => {
            const key = `${animKeyId}_enter`;
            if (hoverTimelines.has(key)) {
              const tl = hoverTimelines.get(key);
              if (tl) {
                tl.restart();
              }
              return;
            }
            const tl = gsap.timeline();
            hoverTargetEls.forEach((el) => {
              if (transforms.from && Object.keys(transforms.from).length > 0) {
                tl.fromTo(el, transforms.from, {
                  ...transforms.to,
                  duration: transforms.duration / speed,
                  ease: transforms.ease
                }, 0);
              } else {
                tl.to(el, {
                  ...transforms.to,
                  duration: transforms.duration / speed,
                  ease: transforms.ease
                }, 0);
              }
            });
            hoverTimelines.set(key, tl);
          };

          const handleMouseLeave = () => {
            const key = `${animKeyId}_enter`;
            const tl = hoverTimelines.get(key);
            if (tl && tl.progress() > 0) {
              tl.reverse();
            } else if (!tl) {
              // Create reverse animation on first leave if no enter animation yet
              const reverseTl = gsap.timeline();
              hoverTargetEls.forEach((el) => {
                reverseTl.to(el, {
                  ...transforms.from,
                  duration: transforms.duration / speed,
                  ease: transforms.ease
                }, 0);
              });
              hoverTimelines.set(`${animKeyId}_leave`, reverseTl);
              reverseTl.play();
            }
          };

          triggerEls.forEach((el) => {
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);
          });
        };

        const applyClick = () => {
          const transforms = getPresetTransforms(effect, { duration, delay, ease, intensity });
          triggerEls.forEach((triggerItem, idx) => {
            const targetItem = targetEls[idx] || targetEls[0];
            if (!targetItem) return;

            gsap.killTweensOf(targetItem);
            gsap.set(targetItem, transforms.from);
            
            const tl = gsap.timeline({ paused: true });
            tl.to(targetItem, {
              ...transforms.to,
              duration: transforms.duration / speed,
              ease: transforms.ease
            }, delay);

            triggerItem.addEventListener('click', () => tl.restart(true));
          });
        };

        if (isStaticState) {
          applyStaticState();
        } else if (isIdleLoop) {
          const checkAllOutOfViewport = () => {
            return triggerEls.every((el) => {
              const rect = el.getBoundingClientRect();
              return rect.top >= window.innerHeight || rect.bottom <= 0;
            });
          };

          if (window.ScrollTrigger) {
            triggerEls.forEach((triggerItem) => {
              ScrollTrigger.create({
                trigger: triggerItem,
                start: 'top bottom',
                end: 'bottom top',
                onEnter: () => applyIdleLoop(),
                onLeave: () => {
                  if (checkAllOutOfViewport()) {
                    const idleTl = activeIdleTimelines.get(animKeyId);
                    if (idleTl) idleTl.pause();
                  }
                },
                onEnterBack: () => applyIdleLoop(),
                onLeaveBack: () => {
                  if (checkAllOutOfViewport()) {
                    const idleTl = activeIdleTimelines.get(animKeyId);
                    if (idleTl) idleTl.pause();
                  }
                }
              });
            });
          } else {
            applyIdleLoop();
          }
        } else if (isScrollTrigger) {
          applyScrollTrigger();
        } else if (isHover) {
          applyHover();
        } else if (isClick) {
          applyClick();
        }
      });

      host.dataset.advancedInit = 'true';
    });
  }

  // Handle advanced scroll_into_view with full animation types
  function handleScrollIntoViewAdvanced(row, triggerEls, targetEls, animationType, opts) {
    const duration = opts.duration || 1;
    const delay = opts.delay || 0;
    const ease = opts.ease || 'power2.out';
    const keyId = `scroll_${animationType}_${Math.random().toString(36).substr(2, 9)}`;

    const isManual = opts.triggerMode === 'click';
    const createTriggerArgs = (triggerEl, baseArgs = {}) => {
      if (isManual) {
        return { ...baseArgs, paused: true };
      }
      return {
        ...baseArgs,
        scrollTrigger: {
          trigger: triggerEl,
          start: opts.scrollTriggerPoint || 'top 85%',
          toggleActions: 'play none none none'
        }
      };
    };

    const bindManualTrigger = (anim, triggerEl) => {
      if (!isManual) return;
      triggerEl.addEventListener('click', () => anim.restart(true));
    };

    switch (animationType) {
      case 'scroll-transform':
        const preset = opts.scrollPreset || 'fade-up';
        const fromVars = {};

        if (preset === 'custom') {
          if (opts.startX !== undefined && opts.startX !== '') fromVars.x = opts.startX;
          if (opts.startY !== undefined && opts.startY !== '') fromVars.y = opts.startY;
          if (opts.startRotate !== undefined && opts.startRotate !== '') fromVars.rotation = opts.startRotate;
          if (opts.startScale !== undefined && opts.startScale !== '') fromVars.scale = opts.startScale;
          if (opts.startOpacity !== undefined && opts.startOpacity !== '') fromVars.opacity = opts.startOpacity;
          if (opts.startBlur !== undefined && opts.startBlur !== '') fromVars.filter = `blur(${opts.startBlur}px)`;
        } else {
          const presetMap = {
            'fade-left': { x: '-100px', y: 0, opacity: 0 },
            'fade-right': { x: '100px', y: 0, opacity: 0 },
            'fade-up': { x: 0, y: '50px', opacity: 0 },
            'fade-down': { x: 0, y: '-50px', opacity: 0 },
            'zoom-in': { scale: 0.8, opacity: 0 },
            'zoom-out': { scale: 1.2, opacity: 0 },
            'blur-fade': { opacity: 0, filter: 'blur(20px)' },
            'blur-fade-left': { x: '-100px', opacity: 0, filter: 'blur(20px)' },
            'blur-fade-right': { x: '100px', opacity: 0, filter: 'blur(20px)' },
            'blur-fade-up': { y: '50px', opacity: 0, filter: 'blur(20px)' },
            'blur-fade-down': { y: '-50px', opacity: 0, filter: 'blur(20px)' },
            'blur-zoom-in': { scale: 0.8, opacity: 0, filter: 'blur(15px)' },
            'blur-zoom-out': { scale: 1.2, opacity: 0, filter: 'blur(15px)' },
            'fade': { opacity: 0 },
          };
          Object.assign(fromVars, presetMap[preset] || { opacity: 0, y: '50px' });
        }
        const finalDuration = duration / (opts.speed || 1);

        const toVars = {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)',
        };

        if (preset === 'custom') {
          if (opts.x !== undefined && opts.x !== '') toVars.x = opts.x;
          if (opts.y !== undefined && opts.y !== '') toVars.y = opts.y;
          if (opts.rotate !== undefined && opts.rotate !== '') toVars.rotation = opts.rotate;
          if (opts.scale !== undefined && opts.scale !== '') toVars.scale = opts.scale;
          if (opts.opacity !== undefined && opts.opacity !== '') toVars.opacity = opts.opacity;
          if (opts.blur !== undefined && opts.blur !== '') toVars.filter = `blur(${opts.blur}px)`;
        }

        triggerEls.forEach((triggerEl, idx) => {
          const target = targetEls[idx] || targetEls[0];
          if (!target) return;

          gsap.killTweensOf(target);

          // Clear any CSS transitions that interfere with GSAP easing
          target.style.transition = 'none';
          target.style.willChange = 'transform, opacity, filter';

          // Set initial state immediately
          gsap.set(target, { ...fromVars, force3D: true, immediateRender: true });

          // Create timeline for exact parity with default entrance
          const tl = gsap.timeline(createTriggerArgs(triggerEl));

          tl.to(target, {
            ...toVars,
            duration: finalDuration, 
            ease: ease,
            force3D: true
          }, delay);
          bindManualTrigger(tl, triggerEl);
        });
        break;

      case 'image-reveal':
        const direction = opts.imageDirection || 'left';
        targetEls.forEach((target, idx) => {
          const trigger = triggerEls[idx] || triggerEls[0] || target;
          const img = target.querySelector('img');
          if (!img) return;
          
          gsap.killTweensOf(img);

          const clipMap = {
            left: 'inset(0% 0% 0% 100%)',
            right: 'inset(0% 100% 0% 0%)',
            top: 'inset(100% 0% 0% 0%)',
            bottom: 'inset(0% 0% 100% 0%)',
          };
          const fullClip = 'inset(0% 0% 0% 0%)';

          const tl = gsap.timeline(createTriggerArgs(trigger));
          tl.fromTo(
            target,
            { clipPath: clipMap[direction], webkitClipPath: clipMap[direction], autoAlpha: 1 },
            { clipPath: fullClip, webkitClipPath: fullClip, duration, ease },
            delay
          );
          tl.from(img, { scale: 1.3, duration, ease }, delay);
          bindManualTrigger(tl, trigger);
        });
        break;

      case 'container-reveal':
        const contDir = opts.containerDirection || 'center';
        const contClipMap = {
          center: 'inset(50% 0% 50% 0%)',
          left: 'inset(0% 0% 0% 100%)',
          right: 'inset(0% 100% 0% 0%)',
          top: 'inset(100% 0% 0% 0%)',
          bottom: 'inset(0% 0% 100% 0%)',
        };
        const fullContClip = 'inset(0% 0% 0% 0%)';

        targetEls.forEach((target, idx) => {
          const trigger = triggerEls[idx] || triggerEls[0] || target;
          const anim = gsap.fromTo(target,
            { clipPath: contClipMap[contDir], webkitClipPath: contClipMap[contDir], autoAlpha: 1 },
            createTriggerArgs(trigger, {
              clipPath: fullContClip,
              webkitClipPath: fullContClip,
              duration,
              delay,
              ease
            })
          );
          bindManualTrigger(anim, trigger);
        });
        break;

      case 'split-text':
        if (typeof window.SplitType !== 'function') {
          console.warn('SplitType not loaded for split-text advanced animation');
          return;
        }
        const splitMode = opts.splitMode || 'chars';
        const isWord = splitMode === 'words';
        const splitVariant = isWord ? (opts.splitVariantWord || 'fade-x') : (opts.splitVariantChar || 'fade-x');

        targetEls.forEach((target, idx) => {
          const trigger = triggerEls[idx] || triggerEls[0] || target;
          const textTarget = target.matches('.elementor-heading-title, h1, h2, h3, h4, h5, h6, p, span')
            ? target
            : target.querySelector('.elementor-heading-title, h1, h2, h3, h4, h5, h6, p, span') || target;

          const split = new SplitType(textTarget, {
            types: isWord ? 'words' : 'words, chars',
            whitespace: 'preserve',
          });

          const items = isWord ? split.words : split.chars;
          if (!items || !items.length) return;

          items.forEach((el) => {
            el.style.display = isWord ? 'inline-block' : 'inline-block';
            if (splitVariant === 'mask-up') {
              el.style.transform = 'translateY(115px)';
            }
          });

          if (splitVariant === 'mask-up') {
            textTarget.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)';
            textTarget.style.webkitClipPath = 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)';
          }

          let fromVars = { opacity: 0 };
          let toVars = { opacity: 1, duration, stagger: 0.05, ease, delay };

          if (splitVariant === 'fade-x') {
            fromVars.x = 30;
            toVars.x = 0;
          } else if (splitVariant === 'fade-y') {
            fromVars.y = 30;
            toVars.y = 0;
          } else if (splitVariant === 'fade-blur') {
            fromVars.y = 30;
            toVars.y = 0;
            fromVars.filter = 'blur(20px)';
            toVars.filter = 'blur(0px)';
          } else if (splitVariant === 'mask-up') {
            fromVars.opacity = 1;
            fromVars.y = 115;
            toVars.y = 0;
          }

          const anim = gsap.fromTo(items, fromVars, createTriggerArgs(trigger, toVars));
          bindManualTrigger(anim, trigger);
        });
        break;

      default:
        // Simple effects fallback
        const transforms = getPresetTransforms(effect, { duration, delay, ease, intensity: opts.intensity });
        triggerEls.forEach((triggerItem, idx) => {
          const targetItem = targetEls[idx] || targetEls[0];
          if (targetItem) {
            const anim = gsap.fromTo(targetItem, transforms.from, createTriggerArgs(triggerItem, {
              ...transforms.to,
              duration: transforms.duration / opts.speed,
              ease: transforms.ease
            }));
            bindManualTrigger(anim, triggerItem);
          }
        });
    }
  }

  /* ==========================================
     TEXT REVEAL (ENVELOPE, ETC.)
     ========================================== */
  function initTextReveal() {
    if (typeof window.SplitType !== 'function') {
      console.warn('SplitType not loaded for text-reveal');
      return;
    }
    const reveals = document.querySelectorAll('.text-reveal:not([data-text-reveal-init])');
    reveals.forEach((el) => {
      el.dataset.textRevealInit = 'true';
      
      const textTarget = el.querySelector('.elementor-heading-title, h1, h2, h3, h4, h5, h6, p, span, .elementor-text-editor') || el;
      
      // Read colors from computed styles; resolve CSS var() values to actual colors
      const computedStyles = getComputedStyle(el);
      let color1 = computedStyles.getPropertyValue('--tr-color1')?.trim() || '';
      let color2 = computedStyles.getPropertyValue('--tr-color2')?.trim() || '';
      
      // Fallback: if the CSS vars didn't resolve (empty or 'transparent'), try reading Elementor globals
      if (!color1 || color1 === 'transparent') {
        const rootStyles = getComputedStyle(document.documentElement);
        color1 = rootStyles.getPropertyValue('--e-global-color-primary')?.trim() || '#6EC1E4';
      }
      if (!color2 || color2 === 'transparent') {
        const rootStyles = getComputedStyle(document.documentElement);
        color2 = rootStyles.getPropertyValue('--e-global-color-secondary')?.trim() || '#54595F';
      }
      
      const durationRaw = computedStyles.getPropertyValue('--tr-duration');
      const duration = durationRaw && !Number.isNaN(parseFloat(durationRaw)) ? parseFloat(durationRaw) : 1;
      
      const delayRaw = computedStyles.getPropertyValue('--animation-delay');
      const delay = delayRaw && !Number.isNaN(parseFloat(delayRaw)) ? parseFloat(delayRaw) : 0;
      
      const triggerPos = computedStyles.getPropertyValue('--tr-trigger')?.trim() || 'top 85%';
      
      const isEnvelope = el.classList.contains('text-reveal-envelope') || (!el.classList.contains('text-reveal-envelope-single') && !el.classList.contains('text-reveal-decoder'));
      const isSingle = el.classList.contains('text-reveal-envelope-single');
      const isDecoder = el.classList.contains('text-reveal-decoder');
      
      let splitInstance = null;
      
      if (isDecoder) {
        // --- Decoder Animation Logic ---
        if (!textTarget.querySelector('.char')) {
          splitInstance = new SplitType(textTarget, { types: 'lines, words, chars' });
        }
        
        const charsArr = textTarget.querySelectorAll('.char');
        if (!charsArr || charsArr.length === 0) return;
        
        const loop = el.dataset.trLoop === 'true';
        const decoderDuration = parseFloat(el.dataset.trDecoderDuration) || 1.5;
        const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_-+=[]{}|;:,.<>?';
        
        // Save original characters
        charsArr.forEach(charEl => {
          if (!charEl.dataset.originalChar) {
            charEl.dataset.originalChar = charEl.innerHTML;
          }
        });
        
        const createDecoderTimeline = () => {
          const tl = gsap.timeline({
            delay: isEditor ? 0 : delay,
            scrollTrigger: isEditor || loop ? null : {
              trigger: el,
              start: triggerPos,
              once: true
            },
            onComplete: () => {
              if (loop && !isEditor) {
                gsap.delayedCall(1, () => tl.restart());
              } else {
                el.removeAttribute('data-supercraft-preview-play');
                delete el.dataset.textRevealInit;
                if (!loop && splitInstance) {
                  splitInstance.revert();
                }
              }
            }
          });
          
          charsArr.forEach((charEl, i) => {
            const originalChar = charEl.dataset.originalChar;
            if (originalChar === '&nbsp;' || originalChar === ' ') return;
            
            let proxy = { charIndex: 0 };
            
            tl.to(proxy, {
              charIndex: scrambleChars.length - 1,
              duration: decoderDuration,
              ease: "power2.inOut",
              onUpdate: () => {
                const randomIndex = Math.floor(Math.random() * scrambleChars.length);
                charEl.textContent = scrambleChars[randomIndex];
              },
              onComplete: () => {
                charEl.innerHTML = originalChar;
              }
            }, i * 0.1);
          });
          
          return tl;
        };
        
        if (loop && !isEditor) {
          ScrollTrigger.create({
            trigger: el,
            start: triggerPos,
            once: true,
            onEnter: () => createDecoderTimeline()
          });
        } else {
          createDecoderTimeline();
        }

      } else {
        // --- Envelope Animation Logic ---
        if (!textTarget.querySelector('.tr-line-wrapper')) {
          splitInstance = new SplitType(textTarget, { types: 'lines', lineClass: 'tr-line-wrapper' });
          
          const splitLines = splitInstance.lines;
          if (!splitLines || splitLines.length === 0) return;
          
          splitLines.forEach(line => {
            line.style.position = 'relative';
            line.style.overflow = 'visible';
            
            const innerHTML = line.innerHTML;
            const blocksHtml = isSingle ? `<div class="tr-block-1"></div>` : `<div class="tr-block-1"></div><div class="tr-block-2"></div>`;
            line.innerHTML = `<span class="tr-envelope-mask" style="position:relative; display:inline-block; overflow:hidden; vertical-align: bottom;"><span class="tr-word">${innerHTML}</span>${blocksHtml}</span>`;
          });
        }
        
        const lines = textTarget.querySelectorAll('.tr-line-wrapper');
        if (!lines || lines.length === 0) return;

        const segmentDur = duration / 2;
        const stagger = 0.15;

        // Build the timeline
        const mainTl = gsap.timeline({
          delay: isEditor ? 0 : delay,
          scrollTrigger: isEditor ? null : {
            trigger: el,
            start: triggerPos,
            once: true
          },
          onComplete: () => {
            el.removeAttribute('data-supercraft-preview-play');
            delete el.dataset.textRevealInit;
            if (splitInstance) {
              splitInstance.revert();
            }
          }
        });

      lines.forEach((line, index) => {
        const word = line.querySelector('.tr-word');
        const block1 = line.querySelector('.tr-block-1');
        const block2 = isSingle ? null : line.querySelector('.tr-block-2');
        
        if (!word || !block1 || (!isSingle && !block2)) return;
        
        // Apply colors directly as inline styles — bypasses CSS var issues
        block1.style.backgroundColor = color1;
        if (!isSingle) block2.style.backgroundColor = color2;
        
        // Reset state
        gsap.set(word, { opacity: 0 });
        gsap.set(block1, { scaleX: 0, transformOrigin: 'left' });
        if (!isSingle) gsap.set(block2, { scaleX: 0, transformOrigin: 'left' });
        
        const lineTl = gsap.timeline();
        if (isSingle) {
          lineTl.to(block1, { scaleX: 1, duration: segmentDur, ease: "power2.inOut", transformOrigin: 'left' })
                .to(word, { opacity: 1, duration: 0.01 })
                .to(block1, { scaleX: 0, duration: segmentDur, ease: "power2.inOut", transformOrigin: "right" });
        } else {
          lineTl.to(block1, { scaleX: 1, duration: segmentDur, ease: "power2.inOut", transformOrigin: 'left' })
                .to(block2, { scaleX: 1, duration: segmentDur, ease: "power2.inOut", transformOrigin: 'left' }, `-=${segmentDur * 0.5}`)
                .to(word, { opacity: 1, duration: 0.01 })
                .to(block1, { scaleX: 0, duration: segmentDur, ease: "power2.inOut", transformOrigin: "right" })
                .to(block2, { scaleX: 0, duration: segmentDur, ease: "power2.inOut", transformOrigin: "right" }, `-=${segmentDur * 0.5}`);
        }
              
        mainTl.add(lineTl, index * stagger);
      });
      } // End of Envelope Animation Logic

    });
  }

  /* ==========================================
     SCROLL BACKGROUND COLOR ANIMATION
     ========================================== */
  function initScrollBgColor() {
    const elements = gsap.utils.toArray('.scroll-bg-color');

    elements.forEach((el) => {
      // Avoid double initialization unless it's a preview play trigger
      const isPreviewPlay = el.getAttribute('data-supercraft-preview-play') === 'yes';
      if (el.dataset.scrollBgColorInit === 'true' && !isPreviewPlay) return;

      const targetColor = el.dataset.bgColorTarget;
      if (!targetColor) return;

      const scrubEnabled = el.dataset.bgColorScrub === 'yes';
      const startTrigger = el.dataset.bgColorStart || 'top 85%';
      const endTrigger = el.dataset.bgColorEnd || 'top 50%';
      
      const duration = parseFloat(el.dataset.bgColorDuration) || 1;
      const delay = isPreviewPlay ? 0 : (parseFloat(el.dataset.bgColorDelay) || 0);
      const ease = el.dataset.bgColorEase || 'power2.out';
      const forwardOnly = el.dataset.bgColorForward === 'true';

      // Capture original background color.
      // If we already captured it, use the stored one to avoid capturing a halfway state during re-inits.
      if (!el.dataset.bgColorOriginal) {
        let originalColor = getComputedStyle(el).backgroundColor;
        if (originalColor === 'rgba(0, 0, 0, 0)' || originalColor === 'transparent') {
          originalColor = 'rgba(255, 255, 255, 0)';
        }
        el.dataset.bgColorOriginal = originalColor;
      }
      
      const originalColor = el.dataset.bgColorOriginal;

      // Reset style to original before building the animation
      gsap.set(el, { backgroundColor: originalColor });

      if (scrubEnabled) {
        gsap.to(el, {
          backgroundColor: targetColor,
          ease: 'none', // Scrubbing feels best with linear ease
          scrollTrigger: {
            trigger: el,
            start: startTrigger,
            end: endTrigger,
            scrub: 0.4,
            onUpdate: (self) => {
              if (forwardOnly) {
                const max = Math.max(self.progress, self._maxProgress || 0);
                self._maxProgress = max;
                if (self.progress < max) {
                  self.animation.progress(max);
                }
              }
            },
          },
        });
      } else {
        gsap.to(el, {
          backgroundColor: targetColor,
          duration: duration,
          delay: delay,
          ease: ease,
          scrollTrigger: {
            trigger: el,
            start: startTrigger,
            toggleActions: 'play none none none',
          },
        });
      }

      el.dataset.scrollBgColorInit = 'true';
    });
  }

  /* ==========================================
     MASTER INIT
     ========================================== */
  function initAllAnimations() {
    initCoreAnimations();
    initScrollFillHeadings();
    initScrollTransform();
    initScrollTransformScrub();
    initImageReveal();
    initContainerReveal();
    initVideoGSAP();
    initSectionTransitions();
    initAdvancedAnimations();
    initTextReveal();
    initScrollBgColor();
  }

  initAllAnimations();
  // Expose for editor preview tools
  window.initAllAnimations = initAllAnimations;
  window.initCoreAnimations = initCoreAnimations;
  window.initScrollFillHeadings = initScrollFillHeadings;
  window.initScrollTransform = initScrollTransform;
  window.initScrollTransformScrub = initScrollTransformScrub;
  window.initImageReveal = initImageReveal;
  window.initContainerReveal = initContainerReveal;
  window.initAdvancedAnimations = initAdvancedAnimations;
  window.initTextReveal = initTextReveal;
  window.initScrollBgColor = initScrollBgColor;

  // Listen for re-init requests posted from the Elementor editor (main window → iframe)
  window.addEventListener('message', function (e) {
    if (!e || !e.data || e.data.type !== 'supercraft_reinit_all') return;
    window.supercraftRestartAnimations();
  });

  // Expose a global restart function that can be called manually
  window.supercraftRestartAnimations = function() {
    if (window.ScrollTrigger) {
      ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
    }
    // Note: If you want to kill all active GSAP animations as well to prevent overlaps, uncomment the next line:
    // gsap.killTweensOf('*');
    
    document.querySelectorAll(
      '[data-scroll-transform-init],[data-scroll-transform-scrub-init],[data-image-reveal-init],[data-container-reveal-init],[data-video-gsap-init],[data-scroll-fill-init],[data-anim-init],[data-advanced-init],[data-st-init],[data-text-reveal-init],[data-scroll-bg-color-init]'
    ).forEach(function (el) {
      delete el.dataset.scrollTransformInit;
      delete el.dataset.scrollTransformScrubInit;
      delete el.dataset.imageRevealInit;
      delete el.dataset.containerRevealInit;
      delete el.dataset.videoGsapInit;
      delete el.dataset.scrollFillInit;
      delete el.dataset.animInit;
      delete el.dataset.advancedInit;
      delete el.dataset.stInit;
      delete el.dataset.textRevealInit;
      delete el.dataset.scrollBgColorInit;
      
      // Clear SplitType instances if any (so they can be safely re-split)
      if (el.isSplit) {
         // Usually SplitType attaches to the element, but we just let it re-init.
      }
    });
    
    initAllAnimations();
    
    setTimeout(function () {
      if (window.ScrollTrigger) { ScrollTrigger.refresh(); }
    }, 150);
  };
});
