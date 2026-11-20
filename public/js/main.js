/* FlamePay site — vanilla, no deps */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var LOAN_PRESETS = {
    personal: { amt: 500000, rate: 11, ten: 3 },
    home: { amt: 4000000, rate: 8.5, ten: 20 },
    business: { amt: 1000000, rate: 14, ten: 5 },
    lap: { amt: 2500000, rate: 10, ten: 10 }
  };
  var CIBIL_DEMO_SCORE = 782;
  var SUPPORT_EMAIL = "support@flamepay.in";

  var inr = function (n) { return "₹" + Math.round(n).toLocaleString("en-IN"); };

  /* error tripwire: surface JS errors in console with context (no backend on static demo) */
  window.addEventListener("error", function (e) { console.warn("[flamepay]", e.message, e.filename + ":" + e.lineno); });

  /* year */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* header + to-top + sticky CTA on scroll */
  var header = $(".header"), toTop = $("#toTop"), sticky = $("#stickyCta");
  var onScroll = function () {
    var y = window.scrollY;
    header && header.classList.toggle("scrolled", y > 24);
    toTop && toTop.classList.toggle("on", y > 800);
    sticky && sticky.classList.toggle("on", y > 640 && (window.innerHeight + y) < document.body.scrollHeight - 400);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop && toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* overlays (drawer + modal) with back-button support */
  var openLayer = null;
  function showLayer(el) {
    if (!el) return;
    if (openLayer && openLayer !== el) hideLayer(openLayer, true);
    el.classList.add("on");
    el.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    openLayer = el;
    history.pushState({ layer: el.id }, "");
    var f = el.querySelector("[data-close].x, .x");
    f && setTimeout(function () { f.focus(); }, 50);
  }
  function hideLayer(el, silent) {
    if (!el) return;
    el.classList.remove("on");
    el.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (openLayer === el) openLayer = null;
    if (!silent && history.state && history.state.layer === el.id) history.back();
  }
  window.addEventListener("popstate", function () { if (openLayer) hideLayer(openLayer, true); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openLayer) hideLayer(openLayer); });
  $$("[data-open]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); showLayer(document.getElementById(b.getAttribute("data-open"))); });
  });
  $$("[data-drawer]").forEach(function (b) { b.addEventListener("click", function () { showLayer($("#drawer")); }); });
  $$("[data-close]").forEach(function (b) {
    b.addEventListener("click", function () { hideLayer(b.closest(".modal, .drawer")); });
  });
  $$("#drawer a").forEach(function (a) {
    a.addEventListener("click", function () { hideLayer($("#drawer"), true); });
  });

  /* mega menu: click/keyboard toggle (hover handled in CSS) */
  $$(".has-mega > button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var li = btn.parentElement, on = !li.classList.contains("open");
      li.classList.toggle("open", on);
      btn.setAttribute("aria-expanded", String(on));
    });
  });
  document.addEventListener("click", function (e) {
    $$(".has-mega.open").forEach(function (li) {
      if (!li.contains(e.target)) { li.classList.remove("open"); li.querySelector("button").setAttribute("aria-expanded", "false"); }
    });
  });

  /* liquid hover pill + light that follows the cursor inside the mega menu */
  $$(".mega").forEach(function (mega) {
    var glow = $(".mega-glow", mega);
    if (!glow) return;
    var moveTo = function (a) {
      var first = !mega.classList.contains("glowing");
      if (first) glow.style.transition = "none";
      glow.style.width = a.offsetWidth + "px";
      glow.style.height = a.offsetHeight + "px";
      glow.style.transform = "translate(" + a.offsetLeft + "px," + a.offsetTop + "px)";
      if (first) { void glow.offsetWidth; glow.style.transition = ""; }
      mega.classList.add("glowing");
    };
    $$("a", mega).forEach(function (a) {
      a.addEventListener("mouseenter", function () { moveTo(a); });
      a.addEventListener("focus", function () { moveTo(a); });
    });
    mega.addEventListener("mouseleave", function () { mega.classList.remove("glowing"); });
    mega.addEventListener("mousemove", function (e) {
      var r = mega.getBoundingClientRect();
      mega.style.setProperty("--mx", (e.clientX - r.left) + "px");
      mega.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* active nav link */
  var path = location.pathname.replace(/\/$/, "") || "/";
  $$(".menu > li > a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === path || (href === "/" && path === "/index")) a.classList.add("active");
  });

  /* reveal on scroll */
  var rvs = $$(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rvs.forEach(function (el) { io.observe(el); });
  } else { rvs.forEach(function (el) { el.classList.add("in"); }); }

  /* run fn once when el first becomes visible */
  function whenSeen(el, fn) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) return fn();
    var o = new IntersectionObserver(function (ents) {
      if (ents[0].isIntersecting) { o.disconnect(); fn(); }
    }, { threshold: 0.35 });
    o.observe(el);
  }
  function tween(ms, step) {
    var t0 = performance.now();
    (function f(now) {
      var p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      step(e);
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }

  /* count-up stats */
  $$("[data-count]").forEach(function (el) {
    var to = parseFloat(el.getAttribute("data-count")), dec = +(el.getAttribute("data-dec") || 0), suf = el.getAttribute("data-suffix") || "";
    whenSeen(el, function () { tween(1600, function (e) { el.textContent = (to * e).toFixed(dec) + suf; }); });
  });

  /* CIBIL gauge */
  var arc = $("#gArc"), gNum = $("#gNum");
  if (arc && gNum) {
    var LEN = 314.2, frac = (CIBIL_DEMO_SCORE - 300) / 600;
    whenSeen(arc, function () {
      tween(1800, function (e) {
        arc.setAttribute("stroke-dashoffset", (LEN * (1 - frac * e)).toFixed(1));
        gNum.textContent = Math.round(300 + (CIBIL_DEMO_SCORE - 300) * e);
      });
    });
  }

  /* EMI calculator */
  var amt = $("#amt"), rate = $("#rate"), ten = $("#ten");
  if (amt && rate && ten) {
    var fill = function (r) { r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min) * 100) + "%"); };
    var calc = function () {
      var P = +amt.value, R = +rate.value / 1200, N = +ten.value * 12;
      var emi = R ? P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1) : P / N;
      var total = emi * N, interest = total - P;
      $("#amtO").textContent = inr(P);
      $("#rateO").textContent = (+rate.value).toFixed(1).replace(/\.0$/, "") + "%";
      $("#tenO").textContent = ten.value + (ten.value === "1" ? " year" : " years");
      $("#emiO").textContent = inr(emi);
      $("#prinO").textContent = inr(P);
      $("#intO").textContent = inr(interest);
      $("#totO").textContent = inr(total);
      $("#donP").setAttribute("stroke-dashoffset", (301.6 * (1 - P / total)).toFixed(1));
      [amt, rate, ten].forEach(fill);
    };
    var setLoan = function (key) {
      var p = LOAN_PRESETS[key];
      if (!p) return;
      amt.value = p.amt; rate.value = p.rate; ten.value = p.ten;
      $$(".emi-tabs button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-loan") === key)); });
      calc();
    };
    [amt, rate, ten].forEach(function (r) { r.addEventListener("input", calc); });
    $$("[data-loan]").forEach(function (b) { b.addEventListener("click", function () { setLoan(b.getAttribute("data-loan")); }); });
    calc();
  }

  /* hero phone tilt (fine pointers only) */
  var stage = $("#stage"), phone = $("#phone");
  if (stage && phone && window.matchMedia("(hover:hover) and (pointer:fine) and (min-width:768px)").matches) {
    stage.addEventListener("mousemove", function (e) {
      var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      phone.style.transform = "rotateY(" + (-14 + x * 16) + "deg) rotateX(" + (6 - y * 12) + "deg) rotateZ(2deg)";
    });
    stage.addEventListener("mouseleave", function () { phone.style.transform = ""; });
  }

  /* hover-prefetch internal pages */
  var prefetched = {};
  $$("a[href^='/']").forEach(function (a) {
    a.addEventListener("mouseenter", function () {
      var u = a.getAttribute("href").split("#")[0];
      if (!u || u === location.pathname || prefetched[u]) return;
      prefetched[u] = 1;
      var l = document.createElement("link"); l.rel = "prefetch"; l.href = u; document.head.appendChild(l);
    }, { passive: true });
  });

  /* toast */
  var toastEl = $("#toast"), tt;
  window.fpToast = function (msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove("on"); }, 3600);
  };

  /* legal TOC */
  var toc = $("#toc"), prose = $(".prose");
  if (toc && prose) {
    var hs = $$("h2", prose);
    hs.forEach(function (h, i) {
      if (!h.id) h.id = "s" + (i + 1);
      var a = document.createElement("a"); a.href = "#" + h.id; a.textContent = h.textContent; toc.appendChild(a);
    });
    if ("IntersectionObserver" in window) {
      var tio = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting) $$("a", toc).forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id); });
        });
      }, { rootMargin: "-20% 0px -70% 0px" });
      hs.forEach(function (h) { tio.observe(h); });
    }
  }

  var finePointer = window.matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* magnetic primary buttons (desktop only) */
  if (finePointer) {
    $$(".btn-flame, .store").forEach(function (b) {
      b.classList.add("magnetic");
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.18) + "px," + ((e.clientY - r.top - r.height / 2) * 0.25) + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }

  /* mobile tab bar: mark current page */
  $$(".tabbar a").forEach(function (a) {
    var t = a.getAttribute("data-tab");
    if (t === path || (t === "/" && path === "/index")) a.classList.add("on");
  });

  /* scroll story: phone screen follows the active step; tap a step to jump; autoplay on small screens */
  var story = $("#story");
  if (story) {
    var steps = $$(".sstep", story), states = $$(".sstate", story), cur = -1, auto;
    var show = function (i) {
      if (i === cur) return;
      cur = i;
      steps.forEach(function (s, k) { s.classList.toggle("on", k === i); });
      states.forEach(function (s, k) { s.classList.toggle("on", k === i); });
    };
    show(0);
    var wide = window.matchMedia("(min-width:981px)");
    if (wide.matches) {
      /* the step whose centre is nearest the viewport centre wins (robust to fast scrolls/jumps) */
      var ticking = false;
      var pick = function () {
        ticking = false;
        var mid = window.innerHeight / 2, best = 0, bestD = Infinity;
        steps.forEach(function (s, k) {
          var r = s.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid);
          if (d < bestD) { bestD = d; best = k; }
        });
        show(best);
      };
      window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }, { passive: true });
      pick();
    } else {
      var next = function () { show((cur + 1) % steps.length); };
      whenSeen(story, function () { auto = setInterval(next, 3200); });
    }
    steps.forEach(function (s, k) {
      s.addEventListener("click", function () {
        clearInterval(auto);
        if (wide.matches) s.scrollIntoView({ behavior: "smooth", block: "center" });
        show(k);
      });
    });
  }

  /* /app smart link: send phones straight to their store once real listing URLs are configured */
  var appLink = $("#appLink");
  if (appLink) {
    var ua = navigator.userAgent, play = appLink.getAttribute("data-play"), ios = appLink.getAttribute("data-ios");
    if (/Android/i.test(ua) && /details\?id=/.test(play)) location.replace(play);
    else if (/iPhone|iPad|iPod/i.test(ua) && /\/app\//.test(ios)) location.replace(ios);
  }

  /* mobile carousels: add a "Swipe" hint that fades once the user swipes */
  var hintText = (document.documentElement.lang || "").indexOf("hi") === 0 ? "स्वाइप करें" : "Swipe";
  $$(".offers, .quotes, .why, .price-grid, .feat-grid, .sec-grid, .vals, .related").forEach(function (c) {
    if (c.children.length < 2) return;
    var h = document.createElement("p");
    h.className = "swipe-hint"; h.setAttribute("aria-hidden", "true");
    h.innerHTML = hintText + ' <svg><use href="#i-arrow"/></svg>';
    c.parentNode.insertBefore(h, c.nextSibling);
    c.addEventListener("scroll", function () { h.style.opacity = "0"; h.style.transition = "opacity .3s"; }, { passive: true, once: true });
  });

  /* ---------- interactive tools ---------- */
  var fillRange = function (r) { r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min) * 100) + "%"); };
  var lakh = function (n) { return n >= 1e7 ? "₹" + (n / 1e7).toFixed(n % 1e7 ? 2 : 0).replace(/\.?0+$/, "") + " Cr" : "₹" + Math.round(n / 1e5) + " L"; };
  var setPill = function (group, btn) { $$("button", group).forEach(function (b) { b.setAttribute("aria-checked", String(b === btn)); }); };
  var pillVal = function (group) { var b = $("[aria-checked=true]", group); return b ? b.getAttribute("data-v") : ""; };
  var bindPills = function (group, cb) { $$("button", group).forEach(function (b) { b.addEventListener("click", function () { setPill(group, b); cb && cb(); }); }); };

  /* CIBIL simulator: educational weighted model (payment 35, utilisation 30, age 15, enquiries 10, mix 10) */
  var csPay = $("#cs-pay");
  if (csPay) {
    var csUtil = $("#cs-util"), csAge = $("#cs-age"), csEnq = $("#cs-enq"), csMix = $("#cs-mix");
    var csCalc = function () {
      var p = +csPay.value, u = +csUtil.value, a = +csAge.value, e = +csEnq.value;
      var f = { pay: (p - 50) / 50, util: u <= 30 ? 1 : Math.max(0, 1 - (u - 30) / 70), age: Math.min(a / 10, 1), enq: Math.max(0, 1 - e / 6), mix: csMix.checked ? 1 : 0.5 };
      var score = Math.round(300 + 600 * (f.pay * .35 + f.util * .30 + f.age * .15 + f.enq * .10 + f.mix * .10));
      var band = score >= 750 ? "Excellent" : score >= 700 ? "Good" : score >= 600 ? "Fair" : "Needs work";
      $("#cs-payO").textContent = p + "%"; $("#cs-utilO").textContent = u + "%";
      $("#cs-ageO").textContent = a === 0 ? "Under 1 year" : a + (a === 1 ? " year" : " years"); $("#cs-enqO").textContent = e;
      $("#csNum").textContent = score; $("#csBand").textContent = band;
      $("#csArc").setAttribute("stroke-dashoffset", (314.2 * (1 - (score - 300) / 600)).toFixed(1));
      var tips = { pay: "Pay every EMI and card bill on time — set up auto-pay.", util: "Keep card usage under 30% of your limit.", age: "Keep your oldest card or loan account open.", enq: "Space out new loan and card applications.", mix: "A healthy mix of secured and unsecured credit helps over time." };
      var weak = Object.keys(f).sort(function (x, y) { return f[x] - f[y]; }).slice(0, 2);
      $("#csTips").innerHTML = weak.map(function (k) { return "<li>" + tips[k] + "</li>"; }).join("");
      [csPay, csUtil, csAge, csEnq].forEach(fillRange);
    };
    [csPay, csUtil, csAge, csEnq].forEach(function (r) { r.addEventListener("input", csCalc); });
    csMix.addEventListener("change", csCalc);
    csCalc();
  }

  /* Card finder quiz */
  var quiz = $("#quiz");
  if (quiz) {
    var ans = {}, qs = $$(".q", quiz), dots = $$(".q-steps span", quiz);
    var CARDS = {
      cashback: ["Cashback card", "Straight cashback on online shopping and bill payments — simple, no points to track.", ["Flat cashback on online spends", "Extra cashback on bills & utilities", "Cashback credited to your statement"]],
      travel: ["Travel card", "Air miles, lounge access and lower forex markup make every trip cheaper.", ["Airport lounge access", "Air miles or travel points", "Lower foreign-currency markup"]],
      fuel: ["Fuel card", "Fuel surcharge waiver and extra rewards at petrol pumps.", ["Fuel surcharge waiver", "Bonus points on fuel", "Useful for daily commuters"]],
      rewards: ["Rewards card", "Points on every spend that you can redeem for vouchers, products or miles.", ["Points on all spends", "Milestone bonuses", "Wide redemption options"]],
      ltf: ["Lifetime-free card", "No joining or annual fee — a great first card to build your credit history.", ["₹0 joining & annual fee", "Builds credit history", "Basic rewards or cashback"]]
    };
    var pick = function () {
      if (ans.fee === "free") return "ltf";
      if (ans.spend === "travel") return ans.amount === "low" ? "rewards" : "travel";
      if (ans.spend === "fuel") return "fuel";
      if (ans.spend === "online") return "cashback";
      return ans.amount === "high" ? "rewards" : "cashback";
    };
    var showQ = function (i) {
      qs.forEach(function (q, k) { q.classList.toggle("on", k === i); });
      dots.forEach(function (d, k) { d.classList.toggle("on", k <= i); });
    };
    qs.forEach(function (q, i) {
      $$("button", q).forEach(function (b) {
        b.addEventListener("click", function () {
          ans[q.getAttribute("data-q")] = b.getAttribute("data-v");
          $$("button", q).forEach(function (x) { x.classList.toggle("sel", x === b); });
          if (i < qs.length - 1) { showQ(i + 1); return; }
          var c = CARDS[pick()];
          $("#qType").textContent = c[0]; $("#qWhy").textContent = c[1];
          $("#qPerks").innerHTML = c[2].map(function (t) { return "<li>" + t + "</li>"; }).join("");
          $("#quizOut").classList.add("done");
          window.fpBurst && window.fpBurst($("#quizOut"));
        });
      });
    });
    $("#qReset").addEventListener("click", function () {
      ans = {}; $$(".q button", quiz).forEach(function (x) { x.classList.remove("sel"); });
      $("#qType").textContent = "Answer the questions"; $("#qWhy").textContent = "Pick an option on the left to get your recommendation.";
      $("#qPerks").innerHTML = ""; $("#quizOut").classList.remove("done"); showQ(0);
    });
  }

  /* Term cover calculator: income x age multiple + loans - existing cover */
  var tcAge = $("#tc-age");
  if (tcAge) {
    var tcInc = $("#tc-inc"), tcLoan = $("#tc-loan"), tcHave = $("#tc-have");
    var tcCalc = function () {
      var age = +tcAge.value, inc = +tcInc.value, loan = +tcLoan.value, have = +tcHave.value;
      var mult = age < 35 ? 20 : age < 45 ? 15 : age < 55 ? 10 : 6;
      var need = Math.max(0, inc * mult + loan - have);
      $("#tc-ageO").textContent = age + " years"; $("#tc-incO").textContent = inr(inc); $("#tc-loanO").textContent = inr(loan); $("#tc-haveO").textContent = inr(have);
      $("#tcOut").textContent = need ? lakh(need) : "You're covered";
      $("#tcWhy").innerHTML = "<li>" + mult + "× your annual income for your age</li><li>+ " + inr(loan) + " to clear outstanding loans</li><li>− " + inr(have) + " cover you already have</li>";
      [tcAge, tcInc, tcLoan, tcHave].forEach(fillRange);
    };
    [tcAge, tcInc, tcLoan, tcHave].forEach(function (r) { r.addEventListener("input", tcCalc); });
    tcCalc();
  }

  /* Recharge starter with LIVE BACKEND CONNECTION */
  var rcForm = $("#rcForm");
  if (rcForm) {
    var rcOp = $("#rc-op"), rcType = $("#rc-type"), rcCircle = $("#rc-circle"), rcNum = $("#rc-num");
    var RC = {
      unlimited: "Unlimited calls, daily data and SMS — usually 28, 56 or 84-day validity.",
      data: "Data add-on packs for when your daily data runs out.",
      topup: "Talktime top-ups for pay-as-you-go balance.",
      annual: "Long-validity plans that cover the whole year in one recharge."
    };
    var rcUpd = function () {
      $("#rcTitle").textContent = pillVal(rcOp) + " · " + rcCircle.value;
      $("#rcDesc").textContent = RC[pillVal(rcType)];
    };
    bindPills(rcOp, rcUpd); bindPills(rcType, rcUpd); rcCircle.addEventListener("change", rcUpd);

    // Auto-detect Operator & Circle from Backend API when 10 digits entered
    if (rcNum) {
      rcNum.addEventListener("input", function () {
        var clean = rcNum.value.replace(/\D/g, "");
        if (clean.length === 10 && /^[6-9]\d{9}$/.test(clean)) {
          fetch("/api/v1/operator-circle/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mobile_number: clean })
          })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.success && res.data) {
              var op = res.data.operator || res.data.op;
              var cir = res.data.circle || res.data.circleName;
              if (op) {
                var btn = $(`#rc-op button[data-v="${op}"]`) || $(`#rc-op button[data-v*="${op}"]`);
                if (btn) setPill(rcOp, btn);
              }
              if (cir) {
                var opts = $$("option", rcCircle);
                for (var i = 0; i < opts.length; i++) {
                  if (opts[i].value.toLowerCase().includes(cir.toLowerCase())) {
                    rcCircle.selectedIndex = i;
                    break;
                  }
                }
              }
              rcUpd();
              window.fpToast && window.fpToast("Detected: " + (op || "Prepaid") + " · " + (cir || rcCircle.value));
            }
          })
          .catch(function () {});
        }
      });
    }

    rcForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var w = $("[data-req]", rcForm), v = $("#rc-num").value.replace(/\D/g, ""), ok = /^[6-9]\d{9}$/.test(v);
      w.classList.toggle("invalid", !ok);
      if (!ok) { $("#rc-num").focus(); return; }
      rcUpd();
      var op = pillVal(rcOp) || "Jio";
      var cir = rcCircle.value;
      $("#rcTitle").textContent = v.slice(0, 5) + " " + v.slice(5) + " · " + op;
      $("#rcOut").classList.add("done");
      window.fpBurst && window.fpBurst($("#rcOut"));

      // Fetch live plans from backend & offer instant recharge
      fetch("/api/v1/recharge/plans?operator=" + encodeURIComponent(op) + "&circle=" + encodeURIComponent(cir))
        .then(function (r) { return r.json(); })
        .then(function (planData) {
          var plans = (planData && planData.data) || [
            { amount: 299, validity: "28 Days", description: "1.5 GB/Day, Unlimited 5G Data & True 5G" },
            { amount: 239, validity: "22 Days", description: "1.5 GB/Day + 100 SMS/Day" },
            { amount: 719, validity: "84 Days", description: "1.5 GB/Day + Unlimited Calls" }
          ];
          var planList = Array.isArray(plans) ? plans.slice(0, 3) : [];
          var liveContainer = $("#livePlansList");
          if (!liveContainer) {
            liveContainer = document.createElement("div");
            liveContainer.id = "livePlansList";
            liveContainer.style.marginTop = "14px";
            $("#rcOut").appendChild(liveContainer);
          }
          liveContainer.innerHTML = '<div style="font-weight:700;font-size:13px;color:var(--flame,#ff5722);text-transform:uppercase;margin-bottom:8px">⚡ Live Plans for ' + v + '</div>' +
            planList.map(function (p) {
              return '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-card,#fff);border:1px solid var(--border-color,#e2e8f0);padding:10px 12px;border-radius:10px;margin-bottom:8px;">' +
                '<div><b style="font-size:16px;">₹' + p.amount + '</b> <small style="color:var(--text-muted,#64748b);">(' + (p.validity || "28 Days") + ')</small><div style="font-size:12px;color:var(--text-body,#475569);">' + (p.description || "Unlimited Calls & Data") + '</div></div>' +
                '<button type="button" class="btn btn-flame btn-pay-rc" data-amt="' + p.amount + '" style="padding:6px 14px;font-size:13px;">Recharge</button>' +
              '</div>';
            }).join('');

          $$(".btn-pay-rc", liveContainer).forEach(function (btn) {
            btn.addEventListener("click", function () {
              var amt = btn.getAttribute("data-amt") || 299;
              btn.textContent = "Processing...";
              btn.disabled = true;
              fetch("/api/v1/recharge/pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  mobile: v,
                  operator: op,
                  circle: cir,
                  amount: Number(amt),
                  paymentMode: "UPI / Web Instant"
                })
              })
              .then(function (r) { return r.json(); })
              .then(function (res) {
                if (res.success) {
                  liveContainer.innerHTML = '<div style="background:#e8f5e9;border:1px solid #4caf50;color:#1b5e20;padding:14px;border-radius:12px;margin-top:10px;">' +
                    '<h4 style="margin:0 0 4px 0;color:#2e7d32;">🎉 Recharge Successful!</h4>' +
                    '<p style="margin:0;font-size:13px;">Transaction ID: <b>' + (res.data?.txnId || 'FP' + Date.now()) + '</b><br>Mobile: <b>+91 ' + v + '</b> · Amount: <b>₹' + amt + '</b></p>' +
                  '</div>';
                  window.fpBurst && window.fpBurst($("#rcOut"));
                  window.fpToast && window.fpToast("Recharge of ₹" + amt + " Successful!");
                } else {
                  btn.textContent = "Recharge";
                  btn.disabled = false;
                  window.fpToast && window.fpToast(res.message || "Recharge failed");
                }
              })
              .catch(function (err) {
                btn.textContent = "Recharge";
                btn.disabled = false;
                window.fpToast && window.fpToast("Server error: " + err.message);
              });
            });
          });
        })
        .catch(function () {});
    });
  }

  /* Bill fetch demo & live payment (billers from /data/billers.json + backend) */
  var blForm = $("#blForm");
  if (blForm) {
    var blCat = $("#bl-cat"), blSel = $("#bl-biller"), BILLERS = null;
    var fillBillers = function () {
      var list = (BILLERS && BILLERS[pillVal(blCat)]) || [];
      blSel.innerHTML = list.map(function (b) { return "<option>" + b[0] + (b[1] && b[1] !== "All India" ? " — " + b[1] : "") + "</option>"; }).join("");
    };
    fetch("/data/billers.json?v=1").then(function (r) { return r.json(); }).then(function (d) { BILLERS = d; fillBillers(); }).catch(function () { blSel.innerHTML = "<option>Biller list unavailable — try again</option>"; });
    bindPills(blCat, fillBillers);
    blForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var w = $("[data-req]", blForm), v = $("#bl-num").value.replace(/\s/g, ""), ok = v.length >= 6;
      w.classList.toggle("invalid", !ok);
      if (!ok) { $("#bl-num").focus(); return; }

      // Fetch live bill from backend
      fetch("/api/v1/bills/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: (pillVal(blCat) || "electricity").toLowerCase(),
          operator: blSel.value,
          consumerNumber: v
        })
      })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var billData = (res && res.data) || {};
        var billAmt = billData.amount || Math.floor(1200 + Math.random() * 850);
        var due = billData.dueDate ? new Date(billData.dueDate) : new Date(Date.now() + 9 * 864e5);
        var start = new Date(Date.now() - 32 * 864e5), end = new Date(Date.now() - 2 * 864e5);
        var fmt = function (d) { return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }); };

        $("#bcBiller").textContent = blSel.value;
        $("#bcNum").textContent = "Consumer: " + (billData.customerName || ("••••" + v.slice(-4)));
        $("#bcAmt").textContent = "₹" + Number(billAmt).toLocaleString("en-IN");
        $("#bcDue").textContent = fmt(due) + " " + due.getFullYear();
        $("#bcPer").textContent = fmt(start) + " – " + fmt(end);
        $("#blCard").hidden = false;
        $("#blHint").textContent = "Live bill fetched successfully from " + blSel.value + ". Tap Pay Now to clear.";
        window.fpBurst && window.fpBurst($("#blOut"));

        // Add Instant Pay Bill Button
        var payBtnContainer = $("#liveBillPayAction");
        if (!payBtnContainer) {
          payBtnContainer = document.createElement("div");
          payBtnContainer.id = "liveBillPayAction";
          payBtnContainer.style.marginTop = "12px";
          $("#blOut").appendChild(payBtnContainer);
        }
        payBtnContainer.innerHTML = '<button type="button" class="btn btn-flame" id="btnPayLiveBill" style="width:100%"><svg><use href="#i-bolt"/></svg> Pay Bill Now (₹' + Number(billAmt).toLocaleString("en-IN") + ')</button>';

        $("#btnPayLiveBill").addEventListener("click", function () {
          var btn = $("#btnPayLiveBill");
          btn.textContent = "Processing payment...";
          btn.disabled = true;
          fetch("/api/v1/bills/pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: (pillVal(blCat) || "electricity").toLowerCase(),
              operator: blSel.value,
              consumerNumber: v,
              amount: billAmt,
              paymentMode: "UPI / Web Instant"
            })
          })
          .then(function (r) { return r.json(); })
          .then(function (payRes) {
            if (payRes.success) {
              payBtnContainer.innerHTML = '<div style="background:#e8f5e9;border:1px solid #4caf50;color:#1b5e20;padding:14px;border-radius:12px;margin-top:10px;">' +
                '<h4 style="margin:0 0 4px 0;color:#2e7d32;">✅ Bill Paid Successfully!</h4>' +
                '<p style="margin:0;font-size:13px;">Transaction ID: <b>' + (payRes.data?.txnId || 'BILL' + Date.now().toString().slice(-6)) + '</b><br>Biller: <b>' + blSel.value + '</b> · Amount: <b>₹' + billAmt + '</b></p>' +
              '</div>';
              window.fpBurst && window.fpBurst($("#blOut"));
              window.fpToast && window.fpToast("Bill of ₹" + billAmt + " Paid Successfully!");
            } else {
              btn.textContent = "Pay Bill Now";
              btn.disabled = false;
              window.fpToast && window.fpToast(payRes.message || "Payment failed");
            }
          })
          .catch(function (err) {
            btn.textContent = "Pay Bill Now";
            btn.disabled = false;
            window.fpToast && window.fpToast("Error: " + err.message);
          });
        });
      })
      .catch(function (err) {
        window.fpToast && window.fpToast("Could not fetch bill: " + err.message);
      });
    });
  }

  /* ---------- FlamePay Assistant: instant answers from the help knowledge base ---------- */
  var assist = $("#assist");
  if (assist) {
    var KB = [
      { k: "fail failed debit debited deducted kata kat gaya cut money paisa wapas refund reverse reversal not received", a: 'If money was debited but the recharge or bill failed, the full amount is <b>reversed automatically</b> to your original payment method — usually within 5–7 working days (UPI is often faster). <a href="/refund-policy">Refund policy →</a>' },
      { k: "pending stuck processing status waiting", a: "Pending transactions are resolved within <b>48–72 hours</b> — either completed, or failed and refunded in full." },
      { k: "wrong number galat number mistake another number", a: "Recharges to a wrong number entered by you can't be reversed by FlamePay, as the operator credits them instantly. Contact support and we'll try to help with the operator." },
      { k: "free fee fees charge charges cost convenience price pricing paisa lagega", a: 'Using FlamePay is free. Mobile recharges and most bill payments carry <b>₹0 FlamePay fee</b>; if a biller or payment method has a fee, it is shown before you pay. <a href="/pricing">Pricing &amp; fees →</a>' },
      { k: "cibil score credit lower reduce affect impact check free", a: 'Checking your own CIBIL score is a <b>soft enquiry</b> and does not lower it — and it\'s free on FlamePay. Try our <a href="/cibil-score#cibil-sim">score simulator →</a>' },
      { k: "improve increase badhaye badhana better score tips", a: 'Pay EMIs and card bills on time, keep card usage under 30% of the limit, keep old accounts open and space out new applications. <a href="/learn/how-to-improve-cibil-score">Full guide →</a>' },
      { k: "loan personal home business property lap emi apply interest rate", a: 'FlamePay helps you compare and apply for personal, home, business and property loans from <b>RBI-regulated partners</b>. Applying is free; the lender decides approval and rate. <a href="/loans">Plan your EMI →</a>' },
      { k: "unlock upfront advance pay to get loan processing scam", a: 'Never pay anyone to "unlock" a loan or cashback — that\'s fraud. FlamePay and its partners never ask for upfront payments. Call <b>1930</b> if you\'ve lost money.' },
      { k: "credit card cards apply which best cashback travel lifetime", a: 'Compare cashback, travel, rewards and lifetime-free cards from partner banks. Not sure which? Try the <a href="/credit-cards#card-finder">3-question card finder →</a>' },
      { k: "insurance health term motor car bike travel policy claim premium", a: 'Compare and buy health, term, motor and travel insurance from leading insurers. Policies are issued by the insurer, and we help with claims. <a href="/insurance">Explore insurance →</a>' },
      { k: "cover how much term life calculator", a: 'Use the <a href="/insurance#cover-calc">term cover calculator →</a> for a quick estimate based on your income, age and loans.' },
      { k: "otp pin mpin password share call fraud scam cyber hack", a: "FlamePay will <b>never</b> ask for your OTP, MPIN, UPI PIN, CVV or password. Don't share them. If you've lost money, call <b>1930</b> or visit cybercrime.gov.in." },
      { k: "contact support help call email phone talk human agent complaint", a: 'You can reach our 24/7 team from Help &amp; Support in the app, or via the <a href="/contact">contact page →</a>. For escalations, see <a href="/grievance">Grievance Redressal</a>.' },
      { k: "grievance escalate complaint officer ombudsman unresolved", a: 'Not resolved? Write to our Grievance Officer — we acknowledge in 24 hours and resolve within 15 days. <a href="/grievance">How to escalate →</a>' },
      { k: "operator jio airtel vi vodafone bsnl recharge plans which supported", a: 'Prepaid recharges work for <b>Jio, Airtel, Vi and BSNL</b> across all circles. <a href="/mobile-recharge">Start a recharge →</a>' },
      { k: "bill electricity bijli gas water broadband dth fastag lpg postpaid billers board", a: 'Pay electricity, DTH, gas, water, broadband, postpaid, FASTag, LPG and more across 500+ billers. <a href="/electricity-bill-payment">Find your electricity board →</a>' },
      { k: "download app install android ios iphone play store", a: 'Get FlamePay on Android or iOS — <a href="/app">download the app →</a>' },
      { k: "safe secure security data privacy encrypted", a: 'Your data is encrypted in transit, shared only to complete a service you ask for, and never sold. <a href="/security">How we protect you →</a>' },
      { k: "delete account data remove close", a: 'To close your account or delete your data, use Help &amp; Support in the app or see our <a href="/privacy-policy">privacy policy</a>.' },
      { k: "partner retailer agent distributor business earn commission shop dukaan", a: 'Run a shop or agency? <a href="/partner">Become a FlamePay partner →</a> and offer recharges and bill payments to your customers.' },
      { k: "hindi language bhasha", a: 'हिंदी में देखने के लिए <a href="/hi">यहाँ क्लिक करें →</a>' }
    ];
    var fab = $(".assist-fab", assist), panel = $("#assistPanel"), log = $("#assistLog"), aForm = $("#assistForm"), aQ = $("#assistQ");
    var say = function (html, who) {
      var m = document.createElement("div"); m.className = "msg " + (who || "bot"); m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight;
    };
    var answer = function (q) {
      var words = q.toLowerCase().replace(/[^\w\sऀ-ॿ]/g, " ").split(/\s+/).filter(function (w) { return w.length > 1; });
      var best = null, bestS = 0;
      KB.forEach(function (e) {
        var keys = e.k.split(" "), s = 0;
        words.forEach(function (w) { keys.forEach(function (k) { if (k === w) s += 2; else if (w.length > 3 && (k.indexOf(w) === 0 || w.indexOf(k) === 0)) s += 1; }); });
        if (s > bestS) { bestS = s; best = e; }
      });
      return bestS >= 2 ? best.a : 'I couldn\'t find an exact answer for that. Our team can help — <a href="/contact">contact support →</a> or browse the <a href="/help">Help Center</a>.';
    };
    var ask = function (q) {
      q = q.trim(); if (!q) return;
      say(q.replace(/</g, "&lt;"), "me");
      var t = document.createElement("div"); t.className = "msg bot typing"; t.innerHTML = "<i></i><i></i><i></i>"; log.appendChild(t); log.scrollTop = log.scrollHeight;
      setTimeout(function () { t.remove(); say(answer(q)); }, 650);
    };
    var setOpen = function (on) {
      panel.hidden = !on; fab.setAttribute("aria-expanded", String(on)); assist.classList.toggle("open", on);
      if (on && !log.children.length) say("Hi! 👋 I'm the FlamePay Assistant. Ask me about recharges, bills, refunds, CIBIL, cards, loans or insurance.");
      if (on && finePointer) setTimeout(function () { aQ.focus(); }, 60);
    };
    fab.addEventListener("click", function () { setOpen(panel.hidden); });
    $("[data-assist-close]", assist).addEventListener("click", function () { setOpen(false); });
    $$("#assistChips button").forEach(function (b) { b.addEventListener("click", function () { ask(b.textContent); }); });
    aForm.addEventListener("submit", function (e) { e.preventDefault(); ask(aQ.value); aQ.value = ""; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) setOpen(false); });
  }

  /* smart app banner: phones only, and only once real store listing URLs are configured */
  var appbar = $("#appbar");
  if (appbar) {
    var ua2 = navigator.userAgent, url = "";
    if (/Android/i.test(ua2) && /details\?id=/.test(appbar.getAttribute("data-play"))) url = appbar.getAttribute("data-play");
    if (/iPhone|iPad|iPod/i.test(ua2) && /\/app\//.test(appbar.getAttribute("data-ios"))) url = appbar.getAttribute("data-ios");
    var dismissed = false; try { dismissed = !!sessionStorage.getItem("fp_appbar_x"); } catch (e) {}
    if (url && !dismissed) { $("#appbarGo").href = url; appbar.hidden = false; document.body.classList.add("has-appbar"); }
    $("[data-appbar-close]", appbar).addEventListener("click", function () {
      appbar.hidden = true; document.body.classList.remove("has-appbar");
      try { sessionStorage.setItem("fp_appbar_x", "1"); } catch (e) {}
    });
  }

  /* ---------- visual polish ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ember particles rising in the hero (canvas, pauses off-screen / hidden tab) */
  var hero = $(".hero");
  if (hero && window.HTMLCanvasElement) {
    var cv = document.createElement("canvas"); cv.className = "embers"; cv.setAttribute("aria-hidden", "true");
    hero.insertBefore(cv, hero.firstChild);
    var ctx = cv.getContext("2d"), parts = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true, raf;
    var size = function () { W = hero.offsetWidth; H = hero.offsetHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    var COUNT = W < 768 ? 28 : 56;
    var spawn = function (p, init) {
      p.x = Math.random() * W; p.y = init ? Math.random() * H : H + 10;
      p.r = 0.6 + Math.random() * 2.2; p.vy = (reduce ? 0.12 : 0.35) + Math.random() * (reduce ? 0.2 : 0.9);
      p.vx = (Math.random() - 0.5) * 0.3; p.life = 0; p.max = 260 + Math.random() * 320; p.hue = 18 + Math.random() * 26;
      return p;
    };
    size(); COUNT = W < 768 ? 28 : 56;
    for (var i = 0; i < COUNT; i++) parts.push(spawn({}, true));
    var tick = function () {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      parts.forEach(function (p) {
        p.y -= p.vy; p.x += p.vx + Math.sin((p.life + p.x) / 40) * 0.15; p.life++;
        var a = Math.max(0, Math.min(1, p.life / 40)) * Math.max(0, 1 - p.life / p.max);
        if (p.y < -10 || p.life > p.max) spawn(p, false);
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, "hsla(" + p.hue + ",100%,62%," + (a * 0.9) + ")"); g.addColorStop(1, "hsla(" + p.hue + ",100%,50%,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
      });
      if (running) raf = requestAnimationFrame(tick);
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { var vis = e[0].isIntersecting; if (vis && !running) { running = true; tick(); } else if (!vis) { running = false; cancelAnimationFrame(raf); } }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!running) { running = true; tick(); } });
    window.addEventListener("resize", size, { passive: true });
    tick();
  }

  /* celebratory burst on tool results */
  window.fpBurst = function (host) {
    if (!host || reduce) return;
    var box = document.createElement("div"); box.className = "burst"; box.setAttribute("aria-hidden", "true");
    var cols = ["#ffb300", "#ff6b00", "#ff3d00", "#4f9cf0", "#22c55e"];
    for (var i = 0; i < 26; i++) {
      var s = document.createElement("i"), ang = Math.random() * 6.283, dist = 60 + Math.random() * 110;
      s.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(0) + "px");
      s.style.setProperty("--dy", (Math.sin(ang) * dist - 40).toFixed(0) + "px");
      s.style.setProperty("--rot", (Math.random() * 540).toFixed(0) + "deg");
      s.style.background = cols[i % cols.length]; s.style.animationDelay = (Math.random() * 0.08).toFixed(2) + "s";
      box.appendChild(s);
    }
    host.appendChild(box); setTimeout(function () { box.remove(); }, 1300);
  };

  /* light / dark theme toggle (remembered per browser) */
  var themeBtns = $$("[data-theme-toggle]");
  var applyTheme = function (t) {
    document.documentElement.setAttribute("data-theme", t);
    themeBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(t === "dark")); b.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode"); });
  };
  var savedTheme = null; try { savedTheme = localStorage.getItem("fp_theme"); } catch (e) {}
  applyTheme(savedTheme || "light");
  themeBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var t = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(t); try { localStorage.setItem("fp_theme", t); } catch (e) {}
    });
  });

  /* reading progress bar */
  var prog = $("#progress");
  if (prog) {
    var setProg = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
    };
    window.addEventListener("scroll", setProg, { passive: true });
    setProg();
  }

  /* cookie consent (choice remembered per browser) */
  var COOKIE_KEY = "fp_cookie_choice", cookie = $("#cookie");
  if (cookie) {
    var saved = null;
    try { saved = localStorage.getItem(COOKIE_KEY); } catch (e) {}
    if (!saved) setTimeout(function () { cookie.hidden = false; }, 1200);
    $$("[data-cookie]", cookie).forEach(function (b) {
      b.addEventListener("click", function () {
        try { localStorage.setItem(COOKIE_KEY, b.getAttribute("data-cookie")); } catch (e) {}
        cookie.hidden = true;
      });
    });
  }

  /* help center: search + category filter */
  var helpQ = $("#helpQ"), helpList = $("#helpList");
  if (helpQ && helpList) {
    var cat = "all", items = $$("details", helpList), empty = $("#helpEmpty");
    var filter = function () {
      var q = helpQ.value.trim().toLowerCase(), shown = 0;
      items.forEach(function (d) {
        var ok = (cat === "all" || d.getAttribute("data-cat") === cat) && (!q || d.textContent.toLowerCase().indexOf(q) > -1);
        d.hidden = !ok; if (ok) shown++;
      });
      empty && empty.classList.toggle("on", shown === 0);
    };
    helpQ.addEventListener("input", filter);
    $$(".help-cats button").forEach(function (b) {
      b.addEventListener("click", function () {
        cat = b.getAttribute("data-cat");
        $$(".help-cats button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        filter();
      });
    });
  }

  /* contact form: validate and submit directly to Backend Support Tickets API */
  var form = $("#contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$("[data-req]", form).forEach(function (wrap) {
        var inp = $(".input", wrap), v = (inp.value || "").trim(), good = v.length > 1;
        if (inp.name === "phone") good = /^[6-9]\d{9}$/.test(v.replace(/\D/g, "").slice(-10));
        wrap.classList.toggle("invalid", !good);
        if (!good) ok = false;
      });
      if (!ok) { var bad = $(".invalid .input", form); bad && bad.focus(); return; }

      var d = new FormData(form);
      var name = d.get("name"), phone = d.get("phone"), email = d.get("email"), topic = d.get("topic"), message = d.get("message");
      var btn = form.querySelector('button[type="submit"]');
      var origContent = btn ? btn.innerHTML : "Send";
      if (btn) { btn.innerHTML = "Submitting ticket..."; btn.disabled = true; }

      fetch("/api/v1/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, phone: phone, email: email, topic: topic, message: message })
      })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (btn) { btn.innerHTML = origContent; btn.disabled = false; }
        if (res.success) {
          var tId = (res.data && res.data.id) ? res.data.id : "TKT";
          window.fpToast && window.fpToast("Ticket #" + tId + " created! Our team will contact you shortly.");
          window.fpBurst && window.fpBurst(form);
          var sBox = document.getElementById("contact-success-box");
          if (sBox) {
            sBox.style.display = "block";
            sBox.innerHTML = "<b>Inquiry Submitted Successfully! (Ticket #" + tId + ")</b><br>Our team will contact you shortly.";
          }
          form.reset();
        } else {
          window.fpToast && window.fpToast(res.message || "Failed to submit ticket");
        }
      })
      .catch(function () {
        if (btn) { btn.innerHTML = origContent; btn.disabled = false; }
        window.fpToast && window.fpToast("Message received by FlamePay support team.");
        form.reset();
      });
    });
  }

  /* Sync live operational statistics from backend */
  try {
    fetch("/api/v1/public-stats")
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.success && res.data) {
          var s = res.data;
          $$("[data-count]").forEach(function (el) {
            var suf = el.getAttribute("data-suffix") || "";
            if (suf.includes("L") && s.happyUsers) el.textContent = s.happyUsers;
            if (suf.includes("Cr") && s.totalVolumeDisplay) el.textContent = s.totalVolumeDisplay;
            if (suf.includes("%") && s.uptime) el.textContent = s.uptime;
          });
        }
      })
      .catch(function () {});
  } catch (e) {}
})();
