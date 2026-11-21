/* Jiang Li — site interactions (no dependencies) */
(function () {
    "use strict";

    var doc = document.documentElement;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------------- nav + progress ---------------- */
    var nav = document.getElementById("nav");
    var progress = document.getElementById("navProgress");
    function onScroll() {
        var y = window.scrollY || doc.scrollTop;
        if (nav) nav.classList.toggle("is-scrolled", y > 24);
        if (progress) {
            var h = doc.scrollHeight - window.innerHeight;
            var p = h > 0 ? Math.min(1, Math.max(0, y / h)) : 0;
            progress.style.setProperty("--p", p.toFixed(4));
        }
    }
    var ticking = false;
    window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () { onScroll(); ticking = false; });
    }, { passive: true });
    onScroll();

    /* ---------------- mobile menu ---------------- */
    var burger = document.querySelector(".burger");
    var mobileNav = document.getElementById("mobileNav");
    function setMenu(open) {
        if (!burger || !mobileNav) return;
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        mobileNav.hidden = !open;
        mobileNav.classList.toggle("is-open", open);
        document.body.style.overflow = open ? "hidden" : "";
    }
    if (burger) {
        burger.addEventListener("click", function () {
            setMenu(burger.getAttribute("aria-expanded") !== "true");
        });
    }
    if (mobileNav) {
        mobileNav.addEventListener("click", function (e) {
            if (e.target.closest("a")) setMenu(false);
        });
    }
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setMenu(false);
    });
    window.addEventListener("resize", function () {
        if (window.innerWidth > 860) setMenu(false);
    });

    /* ---------------- reveal on scroll ---------------- */
    var revealEls = [].slice.call(document.querySelectorAll("[data-reveal]"));
    if ("IntersectionObserver" in window && !reduce) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add("is-in");
                    io.unobserve(en.target);
                }
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
        revealEls.forEach(function (el) { io.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add("is-in"); });
    }

    /* ---------------- stats count-up ---------------- */
    var counters = [].slice.call(document.querySelectorAll(".stat-n[data-count]"));
    function animateCount(el) {
        var target = parseInt(el.getAttribute("data-count"), 10) || 0;
        if (reduce) { el.textContent = target; return; }
        var start = null, dur = 1100;
        function step(ts) {
            if (!start) start = ts;
            var p = Math.min(1, (ts - start) / dur);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased);
            if (p < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }
    if (counters.length && "IntersectionObserver" in window) {
        var cio = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
            });
        }, { threshold: 0.5 });
        counters.forEach(function (el) { cio.observe(el); });
    }

    /* ---------------- publications filter ---------------- */
    var searchInput = document.getElementById("pubSearch");
    var chips = [].slice.call(document.querySelectorAll(".chip[data-role]"));
    var records = [].slice.call(document.querySelectorAll(".record"));
    var countEl = document.getElementById("pubCount");
    var emptyEl = document.getElementById("pubEmpty");
    var expandBtn = document.getElementById("expandAll");
    var total = records.length;
    var activeRole = "all";

    function applyFilter() {
        var q = (searchInput && searchInput.value || "").trim().toLowerCase();
        var tokens = q ? q.split(/\s+/) : [];
        var shown = 0;
        records.forEach(function (rec) {
            var roleOk = activeRole === "all" || rec.getAttribute("data-role") === activeRole;
            var hay = rec.getAttribute("data-search") || "";
            var textOk = tokens.every(function (t) { return hay.indexOf(t) !== -1; });
            var ok = roleOk && textOk;
            rec.classList.toggle("is-hidden", !ok);
            if (ok) {
                shown++;
                rec.classList.add("is-in");
            }
        });
        [].slice.call(document.querySelectorAll(".year-block")).forEach(function (block) {
            var visible = block.querySelectorAll(".record:not(.is-hidden)").length;
            block.classList.toggle("is-hidden", visible === 0);
        });
        if (countEl) {
            var tpl = countEl.getAttribute("data-template");
            countEl.textContent = (tpl || "Showing {n} of {total}").replace("{n}", shown).replace("{total}", total);
        }
        if (emptyEl) emptyEl.hidden = shown !== 0;
    }

    if (searchInput) {
        searchInput.addEventListener("input", applyFilter);
    }
    chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
            activeRole = chip.getAttribute("data-role");
            chips.forEach(function (c) {
                c.classList.toggle("is-active", c === chip);
                c.setAttribute("aria-pressed", c === chip ? "true" : "false");
            });
            applyFilter();
        });
    });

    if (expandBtn) {
        var expanded = false;
        expandBtn.addEventListener("click", function () {
            expanded = !expanded;
            [].slice.call(document.querySelectorAll(".record-abs")).forEach(function (d) {
                if (expanded) d.setAttribute("open", ""); else d.removeAttribute("open");
            });
            expandBtn.setAttribute("aria-pressed", expanded ? "true" : "false");
            expandBtn.textContent = expanded
                ? (doc.lang === "en" ? "Collapse all abstracts" : "收起全部摘要")
                : (doc.lang === "en" ? "Expand all abstracts" : "展开全部摘要");
        });
    }

})();
